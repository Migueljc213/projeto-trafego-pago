'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { updateCampaignStatus, updateCampaignBudget } from '@/lib/meta-api'
import { runAutoPilot, runCorrelatedAutoPilot, type CampaignMetrics } from '@/lib/ai/auto-pilot'
import { analyzeAdCreative, type AdCreative } from '@/lib/ai/llm-analysis'
import { logDecision, markDecisionExecuted, updateCampaignAiStatus } from '@/lib/ai/decision-logger'
import { withBudgetRetry } from '@/lib/ai/retry'
import { getStrategicInsight, type CorrelationPayload } from '@/lib/ai/correlation-engine'
import { sendCorrelationAlert } from '@/lib/email'
import type { ActionResult } from './ad-accounts'

// ─── Executar Auto-Pilot em uma campanha ──────────────────────────────────────

/**
 * Avalia e executa a lógica de Auto-Pilot para uma campanha específica.
 * Se aiAutoPilot = true, aplica a decisão na Meta API via retry.
 * Token de acesso descriptografado apenas no servidor.
 */
export async function runAutoPilotAction(campaignId: string): Promise<ActionResult<{
  decision: string
  reason: string
  confidence: number
  executed: boolean
  logId: string
}>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  // Busca campanha com relacionamentos necessários
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId },
    include: {
      adAccount: {
        include: { businessManager: true },
      },
    },
  })

  if (!campaign || campaign.adAccount.businessManager.userId !== session.user.id) {
    return { success: false, error: 'Campanha não encontrada ou sem permissão' }
  }

  if (!campaign.aiAutoPilot) {
    return { success: false, error: 'Auto-Pilot não está ativado para esta campanha' }
  }

  // Monta métricas para o motor de decisão
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
    spendThreshold: (campaign.dailyBudget ?? 100) * 0.3, // 30% do orçamento diário
    cpaLimit: campaign.spend > 0 && campaign.conversions > 0
      ? (campaign.spend / campaign.conversions) * 1.5
      : 999,
    dailyBudget: Math.round((campaign.dailyBudget ?? 0) * 100), // Converte para centavos
  }

  // Executa o motor de decisão
  const decision = runAutoPilot(metrics, campaign.aiMaxFrequency)

  // Salva a decisão no log
  const logId = await logDecision(campaign.id, decision)

  // Se não há ação a tomar, retorna sem executar
  if (decision.type === 'NO_ACTION' || decision.type === 'MONITOR') {
    await updateCampaignAiStatus(campaign.id, decision.reason)
    return {
      success: true,
      data: {
        decision: decision.type,
        reason: decision.reason,
        confidence: decision.confidence,
        executed: false,
        logId,
      },
    }
  }

  // Descriptografa o token para chamar a Meta API
  const accessToken = decrypt(campaign.adAccount.businessManager.accessTokenEnc)
  let executed = false

  try {
    if (decision.type === 'PAUSE') {
      // Retry com backoff para pausar campanha
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
      // Retry com backoff para alterar orçamento
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
    }

    await updateCampaignAiStatus(campaign.id, decision.reason)
  } catch (err) {
    console.error('[runAutoPilot] Erro ao executar ação na Meta API:', err)
    return {
      success: false,
      error: `Decisão gerada mas falhou ao sincronizar com a Meta: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
    }
  }

  return {
    success: true,
    data: {
      decision: decision.type,
      reason: decision.reason,
      confidence: decision.confidence,
      executed,
      logId,
    },
  }
}

// ─── Análise de criativo com LLM ──────────────────────────────────────────────

/**
 * Analisa o criativo de uma campanha usando OpenAI GPT-4o.
 * Retorna insight + action_score para exibir no dashboard.
 */
export async function analyzeCreativeAction(
  campaignId: string,
  creative: AdCreative
): Promise<ActionResult<{
  insight: string
  action_score: number
  urgency: string
  suggestions: string[]
}>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      adAccount: { businessManager: { userId: session.user.id } },
    },
  })

  if (!campaign) return { success: false, error: 'Campanha não encontrada' }

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
    spendThreshold: 0,
    cpaLimit: 999,
    dailyBudget: Math.round((campaign.dailyBudget ?? 0) * 100),
  }

  try {
    const analysis = await analyzeAdCreative(creative, metrics)
    return {
      success: true,
      data: {
        insight: analysis.insight,
        action_score: analysis.action_score,
        urgency: analysis.urgency,
        suggestions: analysis.suggestions,
      },
    }
  } catch (err) {
    console.error('[analyzeCreative]', err)
    return { success: false, error: 'Erro ao analisar criativo com IA' }
  }
}

// ─── Auto-Pilot Correlacionado ────────────────────────────────────────────────

/**
 * Versão avançada do Auto-Pilot que usa o Motor de Correlação Estratégica.
 * Busca dados de preço e LP audit do banco, monta o payload correlacionado,
 * e toma decisões baseadas em múltiplos sinais simultaneamente.
 *
 * Se o scraper de preços falhou, os dados são marcados como não-confiáveis
 * e a IA não toma decisão baseada em preço.
 */
export async function runCorrelatedAutoPilotAction(campaignId: string): Promise<ActionResult<{
  decision: string
  reason: string
  confidence: number
  executed: boolean
  logId: string
  trigger: string
  bottleneck: string
  rootCauseInsight: string
  adScore: number
  priceScore: number
  siteScore: number
}>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId },
    include: {
      adAccount: {
        include: {
          businessManager: true,
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

  if (!campaign || campaign.adAccount.businessManager.userId !== session.user.id) {
    return { success: false, error: 'Campanha não encontrada ou sem permissão' }
  }

  if (!campaign.aiAutoPilot) {
    return { success: false, error: 'Auto-Pilot não está ativado para esta campanha' }
  }

  // ── Monta métricas para o motor ───────────────────────────────────────────
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
    cpaLimit: campaign.conversions > 0 ? (campaign.spend / campaign.conversions) * 1.5 : 999,
    dailyBudget: Math.round((campaign.dailyBudget ?? 0) * 100),
  }

  // ── Monta dados de preço dos competidores ─────────────────────────────────
  const competitors = campaign.adAccount.competitors
  const competitorPrices: CorrelationPayload['competitorPrices'] = competitors.map((c) => {
    const scrapeFailed = !c.lastPrice || !c.lastChecked
    const isStale = c.lastChecked
      ? Date.now() - c.lastChecked.getTime() > 24 * 60 * 60 * 1000 // > 24h = stale
      : true

    return {
      competitorId: c.id,
      competitorName: c.name,
      price: scrapeFailed || isStale ? null : c.lastPrice,
      myPrice: null, // será buscado do produto se disponível
      currency: c.currency,
      scrapedAt: c.lastChecked,
      scrapeFailed: scrapeFailed || isStale,
    }
  })

  // ── Monta dados de auditoria da LP ────────────────────────────────────────
  const audits = campaign.adAccount.funnelAudits
  const hasCheckoutError = audits.some(
    (a) => a.type === 'CHECKOUT_ERROR' && a.severity === 'CRITICAL'
  )
  const hasPixelFailure = audits.some((a) => a.type === 'PIXEL_FAILURE')
  const hasSlowPage = audits.some(
    (a) => a.type === 'SLOW_PAGE' && (a.severity === 'HIGH' || a.severity === 'CRITICAL')
  )
  const hasBrokenCta = audits.some(
    (a) => a.type === 'BROKEN_CTA' && a.severity !== 'LOW'
  )
  const criticalIssueCount = audits.filter((a) => a.severity === 'CRITICAL').length
  const highIssueCount = audits.filter((a) => a.severity === 'HIGH').length
  const topIssue = audits.find((a) => a.severity === 'CRITICAL') ?? audits[0]

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
      hasCheckoutError,
      hasPixelFailure,
      hasSlowPage,
      hasBrokenCta,
      criticalIssueCount,
      highIssueCount,
      auditScore: null,
      lastAuditedAt: topIssue?.createdAt ?? null,
      topIssueDescription: topIssue?.description ?? null,
    },
  }

  // ── Executa correlação + GPT-4o insight ───────────────────────────────────
  let correlation
  try {
    correlation = await getStrategicInsight(correlationPayload)
  } catch (err) {
    console.error('[runCorrelatedAutoPilot] Falha no motor de correlação:', err)
    // Fallback para auto-pilot clássico se correlação falhar
    const fallbackDecision = runAutoPilot(metrics, campaign.aiMaxFrequency)
    const logId = await logDecision(campaign.id, fallbackDecision)
    await updateCampaignAiStatus(campaign.id, fallbackDecision.reason)
    return {
      success: true,
      data: {
        decision: fallbackDecision.type,
        reason: fallbackDecision.reason,
        confidence: fallbackDecision.confidence,
        executed: false,
        logId,
        trigger: 'FALLBACK_CLASSIC',
        bottleneck: 'AD',
        rootCauseInsight: fallbackDecision.reason,
        adScore: 50,
        priceScore: 70,
        siteScore: 70,
      },
    }
  }

  // ── Executa decisão correlacionada ────────────────────────────────────────
  const decision = runCorrelatedAutoPilot(metrics, correlation, campaign.aiMaxFrequency)
  const logId = await logDecision(campaign.id, decision)

  // Persiste insight estratégico no banco
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - weekStart.getDay()) // Segunda-feira
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

  // Nenhuma ação executável
  if (decision.type === 'NO_ACTION' || decision.type === 'MONITOR') {
    await updateCampaignAiStatus(campaign.id, decision.reason)
    return {
      success: true,
      data: {
        decision: decision.type,
        reason: decision.reason,
        confidence: decision.confidence,
        executed: false,
        logId,
        trigger: correlation.trigger,
        bottleneck: correlation.bottleneck,
        rootCauseInsight: correlation.rootCauseInsight,
        adScore: correlation.adScore,
        priceScore: correlation.priceScore,
        siteScore: correlation.siteScore,
      },
    }
  }

  // ── Executa na Meta API ───────────────────────────────────────────────────
  const accessToken = decrypt(campaign.adAccount.businessManager.accessTokenEnc)
  let executed = false

  try {
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
    }

    // Envia email de alerta correlacionado se necessário
    if (correlation.shouldSendAlert && executed) {
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { email: true, name: true },
      })
      if (user?.email) {
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
        }).catch((e) => console.error('[email] Falha ao enviar alerta de correlação:', e))
      }
    }

    await updateCampaignAiStatus(campaign.id, decision.reason)
  } catch (err) {
    console.error('[runCorrelatedAutoPilot] Erro ao executar ação na Meta API:', err)
    return {
      success: false,
      error: `Decisão gerada mas falhou ao sincronizar com a Meta: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
    }
  }

  return {
    success: true,
    data: {
      decision: decision.type,
      reason: decision.reason,
      confidence: decision.confidence,
      executed,
      logId,
      trigger: correlation.trigger,
      bottleneck: correlation.bottleneck,
      rootCauseInsight: correlation.rootCauseInsight,
      adScore: correlation.adScore,
      priceScore: correlation.priceScore,
      siteScore: correlation.siteScore,
    },
  }
}

// ─── Executar Auto-Pilot em todas as campanhas ativas ─────────────────────────

/**
 * Roda o Auto-Pilot em TODAS as campanhas ativas de uma adAccount.
 * Ideal para ser chamado por um cron job ou webhook de métricas.
 */
export async function runBulkAutoPilotAction(adAccountId: string): Promise<ActionResult<{
  processed: number
  actionsExecuted: number
  skipped: number
}>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const campaigns = await prisma.campaign.findMany({
    where: {
      adAccountId,
      aiAutoPilot: true,
      status: 'ACTIVE',
      adAccount: { businessManager: { userId: session.user.id } },
    },
  })

  let actionsExecuted = 0
  let skipped = 0

  for (const campaign of campaigns) {
    const result = await runAutoPilotAction(campaign.id)
    if (result.success && result.data?.executed) {
      actionsExecuted++
    } else {
      skipped++
    }
  }

  return {
    success: true,
    data: {
      processed: campaigns.length,
      actionsExecuted,
      skipped,
    },
  }
}
