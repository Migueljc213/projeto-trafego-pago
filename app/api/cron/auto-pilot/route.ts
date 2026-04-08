import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { updateCampaignStatus, updateCampaignBudget } from '@/lib/meta-api'
import { runAutoPilot, type CampaignMetrics } from '@/lib/ai/auto-pilot'
import { logDecision, markDecisionExecuted, updateCampaignAiStatus } from '@/lib/ai/decision-logger'
import { withBudgetRetry } from '@/lib/ai/retry'
import { sendAutoPilotAlert } from '@/lib/email'

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
    errors: [] as string[],
  }

  // Busca todas as campanhas ativas com Auto-Pilot ativado
  const campaigns = await prisma.campaign.findMany({
    where: {
      aiAutoPilot: true,
      status: 'ACTIVE',
    },
    include: {
      adAccount: {
        include: {
          businessManager: {
            include: { user: true },
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

      const decision = runAutoPilot(metrics, campaign.aiMaxFrequency)
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

        // Envia email de alerta para o dono da campanha
        const user = campaign.adAccount.businessManager.user
        if (user.email) {
          await sendAutoPilotAlert({
            to: user.email,
            userName: user.name ?? 'Usuário',
            campaignName: campaign.name,
            action: decision.type as 'PAUSE' | 'SCALE' | 'REDUCE_BUDGET',
            reason: decision.reason,
            roas: campaign.roas,
            spend: campaign.spend,
          }).catch((err) => console.error('[cron] Falha ao enviar email:', err))
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

  console.log('[cron/auto-pilot]', results)
  return NextResponse.json({ ok: true, ...results })
}
