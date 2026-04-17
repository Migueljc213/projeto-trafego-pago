/**
 * Queries do dashboard — lidas no servidor (Server Components).
 * Busca dados reais do Neon via Prisma e retorna no formato
 * que os componentes do dashboard já esperam.
 */

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { RevenueDataPoint } from '@/lib/types'

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Retorna a AdAccount pelo ID (verificando ownership) ou a primeira do usuário. */
async function getUserAdAccount(adAccountId?: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  if (adAccountId) {
    return prisma.adAccount.findFirst({
      where: {
        id: adAccountId,
        businessManager: { userId: session.user.id },
      },
    })
  }

  return prisma.adAccount.findFirst({
    where: { businessManager: { userId: session.user.id } },
  })
}

/** Retorna a data de início dado o número de dias para trás. */
function sinceDate(days: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(0, 0, 0, 0)
  return d
}

// ─── Ad Account Switcher ──────────────────────────────────────────────────────

export interface AdAccountInfo {
  id: string
  name: string
  metaAccountId: string
  currency: string
}

/** Lista todas as Ad Accounts do usuário logado (para o switcher). */
export async function getUserAdAccounts(): Promise<AdAccountInfo[]> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return []

  const accounts = await prisma.adAccount.findMany({
    where: { businessManager: { userId: session.user.id } },
    orderBy: { name: 'asc' },
  })

  return accounts.map((a) => ({
    id: a.id,
    name: a.name,
    metaAccountId: a.metaAccountId,
    currency: a.currency ?? 'BRL',
  }))
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSpend: number
  avgRoas: number
  totalConversions: number
  lostRevenue: number
}

/**
 * Quando `days` é definido, agrega DailyInsight do período.
 * Quando não definido, usa totais acumulados das campanhas.
 */
export async function getDashboardStats(opts?: {
  adAccountId?: string
  days?: number
}): Promise<DashboardStats> {
  const adAccount = await getUserAdAccount(opts?.adAccountId)
  if (!adAccount) {
    return { totalSpend: 0, avgRoas: 0, totalConversions: 0, lostRevenue: 0 }
  }

  if (opts?.days) {
    const since = sinceDate(opts.days)

    const insights = await prisma.dailyInsight.findMany({
      where: {
        campaign: { adAccountId: adAccount.id },
        date: { gte: since },
      },
    })

    const totalSpend = insights.reduce((s, i) => s + i.spend, 0)
    const totalRevenue = insights.reduce((s, i) => s + i.revenue, 0)
    const totalConversions = insights.reduce((s, i) => s + i.conversions, 0)
    const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

    // Receita perdida: campanhas pausadas com histórico de conversões
    const pausedCampaigns = await prisma.campaign.findMany({
      where: { adAccountId: adAccount.id, status: 'PAUSED', roas: { gt: 0 } },
      select: { dailyBudget: true, roas: true },
    })
    const lostRevenue = pausedCampaigns.reduce(
      (s, c) => s + (c.dailyBudget ?? 0) * c.roas,
      0
    )

    return { totalSpend, avgRoas, totalConversions, lostRevenue }
  }

  // Sem filtro de data: usa totais acumulados
  const campaigns = await prisma.campaign.findMany({
    where: { adAccountId: adAccount.id },
  })

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

  const pausedWithHistory = campaigns.filter(
    (c) => c.status === 'PAUSED' && c.roas > 0
  )
  const lostRevenue = pausedWithHistory.reduce(
    (s, c) => s + (c.dailyBudget ?? 0) * c.roas,
    0
  )

  return { totalSpend, avgRoas, totalConversions, lostRevenue }
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

export async function getRevenueChartData(opts?: {
  adAccountId?: string
  days?: number
}): Promise<RevenueDataPoint[]> {
  const adAccount = await getUserAdAccount(opts?.adAccountId)
  if (!adAccount) return []

  const since = sinceDate(opts?.days ?? 30)

  const insights = await prisma.dailyInsight.findMany({
    where: {
      campaign: { adAccountId: adAccount.id },
      date: { gte: since },
    },
    orderBy: { date: 'asc' },
  })

  const byDate = new Map<string, { investment: number; revenue: number }>()
  for (const row of insights) {
    const key = row.date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
    const existing = byDate.get(key) ?? { investment: 0, revenue: 0 }
    byDate.set(key, {
      investment: existing.investment + row.spend,
      revenue: existing.revenue + row.revenue,
    })
  }

  return Array.from(byDate.entries()).map(([date, values]) => ({
    date,
    investment: parseFloat(values.investment.toFixed(2)),
    revenue: parseFloat(values.revenue.toFixed(2)),
  }))
}

// ─── AI Insights Feed ─────────────────────────────────────────────────────────

export interface FeedInsight {
  id: string
  type: 'pause' | 'scale' | 'alert' | 'insight'
  timestamp: string
  title: string
  description: string
  value?: string
}

export async function getAIInsightsFeed(opts?: {
  adAccountId?: string
}): Promise<FeedInsight[]> {
  const adAccount = await getUserAdAccount(opts?.adAccountId)
  if (!adAccount) return []

  const logs = await prisma.aiDecisionLog.findMany({
    where: { campaign: { adAccountId: adAccount.id } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: { campaign: { select: { name: true } } },
  })

  const TYPE_MAP: Record<string, FeedInsight['type']> = {
    PAUSE: 'pause',
    SCALE: 'scale',
    REDUCE_BUDGET: 'alert',
    MONITOR: 'insight',
    NO_ACTION: 'insight',
  }

  const TITLE_MAP: Record<string, string> = {
    PAUSE: 'Campanha pausada pela IA',
    SCALE: 'Campanha escalada pela IA',
    REDUCE_BUDGET: 'Orçamento reduzido pela IA',
    MONITOR: 'Campanha em monitoramento',
    NO_ACTION: 'Nenhuma ação necessária',
  }

  return logs.map((log) => ({
    id: log.id,
    type: TYPE_MAP[log.type] ?? 'insight',
    timestamp: log.createdAt.toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    title: `${TITLE_MAP[log.type]} — ${log.campaign.name}`,
    description: log.reason,
    value: log.confidence ? `Confiança: ${log.confidence}%` : undefined,
  }))
}

// ─── Campaign List ────────────────────────────────────────────────────────────

export interface CampaignRow {
  id: string
  name: string
  status: string
  dailyBudget: number
  spend: number
  roas: number
  conversions: number
  frequency: number
  aiAutoPilot: boolean
  lastAiAction: string | null
  metaCampaignId: string
}

export async function getCampaignRows(opts?: {
  adAccountId?: string
  days?: number
}): Promise<CampaignRow[]> {
  const adAccount = await getUserAdAccount(opts?.adAccountId)
  if (!adAccount) return []

  const campaigns = await prisma.campaign.findMany({
    where: { adAccountId: adAccount.id },
    orderBy: { spend: 'desc' },
  })

  if (!opts?.days) {
    return campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      status: c.status,
      dailyBudget: c.dailyBudget ?? 0,
      spend: c.spend,
      roas: c.roas,
      conversions: c.conversions,
      frequency: c.frequency,
      aiAutoPilot: c.aiAutoPilot,
      lastAiAction: c.lastAiAction,
      metaCampaignId: c.metaCampaignId,
    }))
  }

  // Com filtro de data: sobrepõe spend/roas/conversions com dados do período
  const since = sinceDate(opts.days)
  const insights = await prisma.dailyInsight.findMany({
    where: {
      campaign: { adAccountId: adAccount.id },
      date: { gte: since },
    },
  })

  // Agrupa insights por campaignId
  const byCampaign = new Map<string, { spend: number; revenue: number; conversions: number }>()
  for (const i of insights) {
    const existing = byCampaign.get(i.campaignId) ?? { spend: 0, revenue: 0, conversions: 0 }
    byCampaign.set(i.campaignId, {
      spend: existing.spend + i.spend,
      revenue: existing.revenue + i.revenue,
      conversions: existing.conversions + i.conversions,
    })
  }

  return campaigns.map((c) => {
    const period = byCampaign.get(c.id)
    const spend = period?.spend ?? 0
    const revenue = period?.revenue ?? 0
    return {
      id: c.id,
      name: c.name,
      status: c.status,
      dailyBudget: c.dailyBudget ?? 0,
      spend,
      roas: spend > 0 ? revenue / spend : 0,
      conversions: period?.conversions ?? 0,
      frequency: c.frequency,
      aiAutoPilot: c.aiAutoPilot,
      lastAiAction: c.lastAiAction,
      metaCampaignId: c.metaCampaignId,
    }
  })
}

// ─── Price Table ──────────────────────────────────────────────────────────────

export interface CompetitorRow {
  id: string
  name: string
  url: string
  lastPrice: number | null
  lastChecked: Date | null
}

export async function getCompetitorRows(opts?: {
  adAccountId?: string
}): Promise<CompetitorRow[]> {
  const adAccount = await getUserAdAccount(opts?.adAccountId)
  if (!adAccount) return []

  return prisma.competitor.findMany({
    where: { adAccountId: adAccount.id },
    orderBy: { lastChecked: 'desc' },
  })
}

// ─── Latest Strategic Insight ─────────────────────────────────────────────────

export interface LatestDiagnostic {
  id: string
  campaignId: string | null
  campaignName: string | null
  weekStart: Date
  rootCause: string
  executiveSummary: string | null
  bottleneck: string
  adScore: number
  priceScore: number
  siteScore: number
  createdAt: Date
}

export async function getLatestStrategicInsight(opts?: {
  adAccountId?: string
}): Promise<LatestDiagnostic | null> {
  const adAccount = await getUserAdAccount(opts?.adAccountId)
  if (!adAccount) return null

  const insight = await prisma.strategicInsight.findFirst({
    where: { adAccountId: adAccount.id },
    orderBy: { createdAt: 'desc' },
    include: { campaign: { select: { name: true } } },
  })

  if (!insight) return null

  const raw = insight.rawData as Record<string, unknown> | null
  const executiveSummary = typeof raw?.executiveSummary === 'string'
    ? raw.executiveSummary
    : null

  return {
    id: insight.id,
    campaignId: insight.campaignId,
    campaignName: insight.campaign?.name ?? null,
    weekStart: insight.weekStart,
    rootCause: insight.rootCause,
    executiveSummary,
    bottleneck: insight.bottleneck,
    adScore: insight.adScore,
    priceScore: insight.priceScore,
    siteScore: insight.siteScore,
    createdAt: insight.createdAt,
  }
}

// ─── ROI / Dinheiro Salvo pela IA ─────────────────────────────────────────────

export interface AiSavings {
  totalSaved: number
  pauseCount: number
  scaleCount: number
  totalDecisions: number
}

export async function getMoneySavedByAI(opts?: {
  adAccountId?: string
  days?: number
}): Promise<AiSavings> {
  const adAccount = await getUserAdAccount(opts?.adAccountId)
  if (!adAccount) return { totalSaved: 0, pauseCount: 0, scaleCount: 0, totalDecisions: 0 }

  const since = sinceDate(opts?.days ?? 30)

  const logs = await prisma.aiDecisionLog.findMany({
    where: {
      executed: true,
      createdAt: { gte: since },
      campaign: { adAccountId: adAccount.id },
      type: { in: ['PAUSE', 'SCALE', 'REDUCE_BUDGET'] },
    },
    include: {
      campaign: { select: { dailyBudget: true, roas: true, aiMinRoas: true } },
    },
  })

  let totalSaved = 0
  let pauseCount = 0
  let scaleCount = 0

  for (const log of logs) {
    const budget = log.campaign.dailyBudget ?? 0
    if (log.type === 'PAUSE') {
      totalSaved += budget * 0.5
      pauseCount++
    } else if (log.type === 'SCALE') {
      scaleCount++
    } else if (log.type === 'REDUCE_BUDGET') {
      totalSaved += budget * 0.2
    }
  }

  return { totalSaved, pauseCount, scaleCount, totalDecisions: logs.length }
}

export async function getAllStrategicInsights(limit = 10): Promise<LatestDiagnostic[]> {
  const adAccount = await getUserAdAccount()
  if (!adAccount) return []

  const insights = await prisma.strategicInsight.findMany({
    where: { adAccountId: adAccount.id },
    orderBy: { createdAt: 'desc' },
    take: limit,
    include: { campaign: { select: { name: true } } },
  })

  return insights.map((insight) => {
    const raw = insight.rawData as Record<string, unknown> | null
    const executiveSummary = typeof raw?.executiveSummary === 'string'
      ? raw.executiveSummary
      : null

    return {
      id: insight.id,
      campaignId: insight.campaignId,
      campaignName: insight.campaign?.name ?? null,
      weekStart: insight.weekStart,
      rootCause: insight.rootCause,
      executiveSummary,
      bottleneck: insight.bottleneck,
      adScore: insight.adScore,
      priceScore: insight.priceScore,
      siteScore: insight.siteScore,
      createdAt: insight.createdAt,
    }
  })
}
