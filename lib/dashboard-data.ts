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

/** Retorna a primeira AdAccount do usuário logado, ou null. */
async function getUserAdAccount() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return null

  return prisma.adAccount.findFirst({
    where: { businessManager: { userId: session.user.id } },
  })
}

// ─── Stats Cards ──────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalSpend: number
  avgRoas: number
  totalConversions: number
  lostRevenue: number
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const adAccount = await getUserAdAccount()
  if (!adAccount) {
    return { totalSpend: 0, avgRoas: 0, totalConversions: 0, lostRevenue: 0 }
  }

  const campaigns = await prisma.campaign.findMany({
    where: { adAccountId: adAccount.id },
  })

  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalRevenue = campaigns.reduce((s, c) => s + c.revenue, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
  const avgRoas = totalSpend > 0 ? totalRevenue / totalSpend : 0

  // Receita perdida: campanhas pausadas com histórico de conversões
  const pausedWithHistory = campaigns.filter(
    (c) => c.status === 'PAUSED' && c.roas > 0
  )
  const lostRevenue = pausedWithHistory.reduce(
    (s, c) => s + c.dailyBudget! * c.roas,
    0
  )

  return { totalSpend, avgRoas, totalConversions, lostRevenue }
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

export async function getRevenueChartData(): Promise<RevenueDataPoint[]> {
  const adAccount = await getUserAdAccount()
  if (!adAccount) return []

  // Últimos 30 dias de DailyInsights, agrupados por data
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const insights = await prisma.dailyInsight.findMany({
    where: {
      campaign: { adAccountId: adAccount.id },
      date: { gte: thirtyDaysAgo },
    },
    orderBy: { date: 'asc' },
  })

  // Agrupa por data somando todas as campanhas
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

export async function getAIInsightsFeed(): Promise<FeedInsight[]> {
  const adAccount = await getUserAdAccount()
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
  spend: number
  roas: number
  conversions: number
  frequency: number
  aiAutoPilot: boolean
  lastAiAction: string | null
}

export async function getCampaignRows(): Promise<CampaignRow[]> {
  const adAccount = await getUserAdAccount()
  if (!adAccount) return []

  const campaigns = await prisma.campaign.findMany({
    where: { adAccountId: adAccount.id },
    orderBy: { spend: 'desc' },
  })

  return campaigns.map((c) => ({
    id: c.id,
    name: c.name,
    status: c.status,
    spend: c.spend,
    roas: c.roas,
    conversions: c.conversions,
    frequency: c.frequency,
    aiAutoPilot: c.aiAutoPilot,
    lastAiAction: c.lastAiAction,
  }))
}

// ─── Price Table ──────────────────────────────────────────────────────────────

export interface CompetitorRow {
  id: string
  name: string
  url: string
  lastPrice: number | null
  lastChecked: Date | null
}

export async function getCompetitorRows(): Promise<CompetitorRow[]> {
  const adAccount = await getUserAdAccount()
  if (!adAccount) return []

  return prisma.competitor.findMany({
    where: { adAccountId: adAccount.id },
    orderBy: { lastChecked: 'desc' },
  })
}
