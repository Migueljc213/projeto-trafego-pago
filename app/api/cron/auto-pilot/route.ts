import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { updateCampaignStatus, updateCampaignBudget } from '@/lib/meta-api'
import { runAutoPilot, runCorrelatedAutoPilot, type CampaignMetrics } from '@/lib/ai/auto-pilot'
import { getStrategicInsight, type CorrelationPayload } from '@/lib/ai/correlation-engine'
import { logDecision, markDecisionExecuted, updateCampaignAiStatus } from '@/lib/ai/decision-logger'
import { withBudgetRetry } from '@/lib/ai/retry'
import { sendAutoPilotAlert, sendCorrelationAlert, sendPredictivePriceDropAlert, sendTokenExpiryAlert } from '@/lib/email'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(req: NextRequest) {
  // Verifica secret para proteger a rota de chamadas externas
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const results = {
    processed: 0,
    executed: 0,
    skipped: 0,
    correlations: 0,
    priceAlerts: 0,
    errors: [] as string[],
  }

  // ── Auto-Pilot + Correlação por campanha ─────────────────────────────────────

  const campaigns = await prisma.campaign.findMany({
    where: {
      aiAutoPilot: true,
      status: 'ACTIVE',
    },
    include: {
      adAccount: {
        include: {
          businessManager: { include: { user: true } },
          competitors: true,
          funnelAudits: {
            where: { resolved: false },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
    },
  })

  for (const campaign of campaigns) {
    results.processed++

    try {
      const metrics: CampaignMetrics = {
        campaignId: campaign.id,
        campaignName: campaign.name,
        spend: campaign.spend,
        conversions: campaign.conversions,
        roas: campaign.roas,
        cpa: campaign.conversions > 0 ? campaign.spend / campaign.conversions : 9999,
        frequency: campaign.frequency,
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
        targetRoas: campaign.aiMinRoas,
        spendThreshold: (campaign.dailyBudget ?? 100) * 0.3,
        cpaLimit: campaign.spend > 0 && campaign.conversions > 0
          ? (campaign.spend / campaign.conversions) * 1.5
          : 999,
        dailyBudget: Math.round((campaign.dailyBudget ?? 0) * 100),
      }

      // Monta payload de correlação
      const competitorPrices: CorrelationPayload['competitorPrices'] = campaign.adAccount.competitors.map((c) => {
        const isStale = c.lastChecked
          ? Date.now() - c.lastChecked.getTime() > 24 * 60 * 60 * 1000
          : true
        const scrapeFailed = !c.lastPrice || isStale
        return {
          competitorId: c.id,
          competitorName: c.name,
          price: scrapeFailed ? null : c.lastPrice,
          myPrice: null,
          currency: c.currency,
          scrapedAt: c.lastChecked,
          scrapeFailed,
        }
      })

      const audits = campaign.adAccount.funnelAudits
      const correlationPayload: CorrelationPayload = {
        campaign: {
          campaignId: metrics.campaignId,
          campaignName: metrics.campaignName,
          roas: metrics.roas,
          targetRoas: metrics.targetRoas,
          spend: metrics.spend,
          spendThreshold: metrics.spendThreshold,
          cpa: metrics.cpa,
          cpaLimit: metrics.cpaLimit,
          frequency: metrics.frequency,
          clicks: metrics.clicks,
          impressions: metrics.impressions,
          conversions: metrics.conversions,
        },
        competitorPrices,
        lpAudit: {
          hasCheckoutError: audits.some((a) => a.type === 'CHECKOUT_ERROR' && a.severity === 'CRITICAL'),
          hasPixelFailure: audits.some((a) => a.type === 'PIXEL_FAILURE'),
          hasSlowPage: audits.some((a) => a.type === 'SLOW_PAGE' && (a.severity === 'HIGH' || a.severity === 'CRITICAL')),
          hasBrokenCta: audits.some((a) => a.type === 'BROKEN_CTA' && a.severity !== 'LOW'),
          criticalIssueCount: audits.filter((a) => a.severity === 'CRITICAL').length,
          highIssueCount: audits.filter((a) => a.severity === 'HIGH').length,
          auditScore: null,
          lastAuditedAt: audits[0]?.createdAt ?? null,
          topIssueDescription: audits.find((a) => a.severity === 'CRITICAL')?.description ?? audits[0]?.description ?? null,
        },
      }

      // Tenta motor de correlação; fallback para autopilot clássico se falhar
      let decision
      let correlation: Awaited<ReturnType<typeof getStrategicInsight>> | null = null

      try {
        correlation = await getStrategicInsight(correlationPayload)
        decision = runCorrelatedAutoPilot(metrics, correlation, campaign.aiMaxFrequency)
        results.correlations++

        // Persiste insight estratégico
        const weekStart = new Date()
        weekStart.setDate(weekStart.getDate() - weekStart.getDay())
        weekStart.setHours(0, 0, 0, 0)

        await prisma.strategicInsight.create({
          data: {
            adAccountId: campaign.adAccountId,
            campaignId: campaign.id,
            weekStart,
            rootCause: correlation.rootCauseInsight,
            bottleneck: correlation.bottleneck,
            adScore: correlation.adScore,
            priceScore: correlation.priceScore,
            siteScore: correlation.siteScore,
            rawData: {
              ...(correlationPayload as object),
              executiveSummary: correlation.executiveSummary,
            },
          },
        })
      } catch (corrErr) {
        console.error(`[cron] Correlação falhou para ${campaign.id}, usando autopilot clássico:`, corrErr)
        decision = runAutoPilot(metrics, campaign.aiMaxFrequency)
      }

      const logId = await logDecision(campaign.id, decision)

      if (decision.type === 'NO_ACTION' || decision.type === 'MONITOR') {
        await updateCampaignAiStatus(campaign.id, decision.reason)
        results.skipped++
        continue
      }

      const accessToken = decrypt(campaign.adAccount.businessManager.accessTokenEnc)
      let executed = false

      if (decision.type === 'PAUSE') {
        await withBudgetRetry(() =>
          updateCampaignStatus(campaign.metaCampaignId, 'PAUSED', accessToken)
        )
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { status: 'PAUSED' },
        })
        executed = true
      }

      if ((decision.type === 'SCALE' || decision.type === 'REDUCE_BUDGET') && decision.suggestedBudget) {
        await withBudgetRetry(() =>
          updateCampaignBudget(campaign.metaCampaignId, decision.suggestedBudget!, accessToken)
        )
        await prisma.campaign.update({
          where: { id: campaign.id },
          data: { dailyBudget: decision.suggestedBudget! / 100 },
        })
        executed = true
      }

      if (executed) {
        await markDecisionExecuted(logId)
        results.executed++

        const user = campaign.adAccount.businessManager.user

        // Email de correlação se disponível, senão email clássico
        if (user.email && correlation?.shouldSendAlert) {
          await sendCorrelationAlert({
            to: user.email,
            userName: user.name ?? 'Usuário',
            campaignName: campaign.name,
            subject: correlation.alertEmailSubject,
            body: correlation.alertEmailBody,
            roas: campaign.roas,
            spend: campaign.spend,
            trigger: correlation.trigger,
            details: correlation.details,
          }).catch((e) => console.error('[cron] Falha ao enviar alerta de correlação:', e))
        } else if (user.email) {
          await sendAutoPilotAlert({
            to: user.email,
            userName: user.name ?? 'Usuário',
            campaignName: campaign.name,
            action: decision.type as 'PAUSE' | 'SCALE' | 'REDUCE_BUDGET',
            reason: decision.reason,
            roas: campaign.roas,
            spend: campaign.spend,
          }).catch((e) => console.error('[cron] Falha ao enviar email:', e))
        }
      } else {
        results.skipped++
      }

      await updateCampaignAiStatus(campaign.id, decision.reason)
    } catch (err) {
      results.errors.push(`${campaign.name}: ${String(err)}`)
      console.error(`[cron/auto-pilot] Erro na campanha ${campaign.id}:`, err)
    }
  }

  // ── Alertas Preditivos de Queda de Preço do Concorrente ──────────────────────
  // Para cada AdAccount, compara a última entrada de CompetitorPrice com a anterior.
  // Se o concorrente baixou o preço recentemente (últimas 24h) em >5%, envia alerta.

  try {
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const recentPriceRecords = await prisma.competitorPrice.findMany({
      where: { recordedAt: { gte: yesterday } },
      include: {
        competitor: {
          include: {
            adAccount: {
              include: { businessManager: { include: { user: true } } },
            },
          },
        },
      },
    })

    for (const record of recentPriceRecords) {
      // Busca o registro anterior para comparar
      const previousRecord = await prisma.competitorPrice.findFirst({
        where: {
          competitorId: record.competitorId,
          recordedAt: { lt: record.recordedAt },
        },
        orderBy: { recordedAt: 'desc' },
      })

      if (!previousRecord || previousRecord.price <= 0) continue

      const dropPct = ((previousRecord.price - record.price) / previousRecord.price) * 100
      if (dropPct < 5) continue // Queda insignificante

      const user = record.competitor.adAccount.businessManager.user
      if (!user.email) continue

      await sendPredictivePriceDropAlert({
        to: user.email,
        userName: user.name ?? 'Usuário',
        competitorName: record.competitor.name,
        productContext: record.competitor.name,
        previousPrice: previousRecord.price,
        newPrice: record.price,
        dropPercent: dropPct,
      }).catch((e) => console.error('[cron] Falha ao enviar alerta preditivo de preço:', e))

      results.priceAlerts++
    }
  } catch (priceErr) {
    console.error('[cron] Erro ao verificar quedas de preço:', priceErr)
  }

  // ── Token Health Monitor ──────────────────────────────────────────────────────
  // Verifica todos os BusinessManagers com token expirando em < 5 dias e envia alerta.

  let tokenAlertsCount = 0
  try {
    const fiveDaysFromNow = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)

    const expiringTokens = await prisma.businessManager.findMany({
      where: {
        tokenExpiresAt: { lte: fiveDaysFromNow, gt: new Date() },
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    })

    for (const bm of expiringTokens) {
      if (!bm.user.email) continue

      const msRemaining = (bm.tokenExpiresAt?.getTime() ?? 0) - Date.now()
      const daysRemaining = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)))
      const reconnectUrl = `${process.env.NEXTAUTH_URL}/dashboard/configuracoes?reconnect=meta`

      await sendTokenExpiryAlert({
        to: bm.user.email,
        userName: bm.user.name ?? 'Usuário',
        businessManagerName: bm.name,
        daysRemaining,
        reconnectUrl,
      }).catch((e) => console.error('[cron] Falha ao enviar alerta de token:', e))

      tokenAlertsCount++
    }
  } catch (tokenErr) {
    console.error('[cron] Erro ao verificar saúde dos tokens:', tokenErr)
  }

  console.log('[cron/auto-pilot]', { ...results, tokenAlertsCount })
  return NextResponse.json({ ok: true, ...results, tokenAlertsCount })
}
