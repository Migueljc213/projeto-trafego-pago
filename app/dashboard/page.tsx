import { Suspense } from 'react'
import StatCards from '@/components/dashboard/StatCards'
import RevenueChart from '@/components/dashboard/RevenueChart'
import RoasChart from '@/components/dashboard/RoasChart'
import FunnelVisualizer from '@/components/dashboard/FunnelVisualizer'
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed'
import PriceTable from '@/components/dashboard/PriceTable'
import DiagnosticCenter from '@/components/dashboard/DiagnosticCenter'
import ROISavingsCard from '@/components/dashboard/ROISavingsCard'
import AdAccountSwitcher from '@/components/dashboard/AdAccountSwitcher'
import DateRangePicker from '@/components/dashboard/DateRangePicker'
import CampanhasClient from '@/app/dashboard/campanhas/CampanhasClient'
import type { DiagnosticData } from '@/components/dashboard/DiagnosticCenter'
import { SkeletonStatCard, SkeletonChartCard, SkeletonFeedItem } from '@/components/dashboard/SkeletonCards'
import {
  getDashboardStats,
  getRevenueChartData,
  getRoasByCampaign,
  getAIInsightsFeed,
  getCampaignRows,
  getCompetitorRows,
  getLatestStrategicInsight,
  getMoneySavedByAI,
  getUserAdAccounts,
} from '@/lib/dashboard-data'

const VALID_DAYS = [7, 30, 90] as const
type Days = typeof VALID_DAYS[number]

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: { account?: string; days?: string }
}) {
  const adAccountId = searchParams.account
  const days = (VALID_DAYS as readonly number[]).includes(Number(searchParams.days))
    ? (Number(searchParams.days) as Days)
    : 30

  const opts = { adAccountId, days }

  const [stats, chartData, roasData, feedInsights, campaigns, competitors, latestInsight, savings, accounts] =
    await Promise.all([
      getDashboardStats(opts),
      getRevenueChartData(opts),
      getRoasByCampaign(opts),
      getAIInsightsFeed({ adAccountId }),
      getCampaignRows(opts),
      getCompetitorRows({ adAccountId }),
      getLatestStrategicInsight({ adAccountId }),
      getMoneySavedByAI(opts),
      getUserAdAccounts(),
    ])

  const effectiveAccountId = adAccountId ?? accounts[0]?.id ?? ''

  const diagnosticData: DiagnosticData | null = latestInsight
    ? {
        campaignName: latestInsight.campaignName,
        bottleneck: latestInsight.bottleneck as DiagnosticData['bottleneck'],
        adScore: latestInsight.adScore,
        priceScore: latestInsight.priceScore,
        siteScore: latestInsight.siteScore,
        rootCause: latestInsight.rootCause,
        executiveSummary: latestInsight.executiveSummary,
        createdAt: new Date(latestInsight.createdAt),
      }
    : null

  const DAYS_LABEL: Record<number, string> = {
    7: 'Últimos 7 dias',
    30: 'Últimos 30 dias',
    90: 'Últimos 90 dias',
  }

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white capitalize">Visão Geral</h1>
          <p className="text-sm text-gray-500 mt-0.5">{DAYS_LABEL[days]} &bull; Todas as campanhas</p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AdAccountSwitcher accounts={accounts} currentId={effectiveAccountId} />
          <DateRangePicker currentDays={days} />
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-neon-cyan/20">
            <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse block" />
            <span className="text-xs font-medium text-neon-cyan">IA monitorando em tempo real</span>
          </div>
        </div>
      </div>

      {/* Top: Stat Cards */}
      <Suspense fallback={
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)}
        </div>
      }>
        <StatCards stats={stats} />
      </Suspense>

      {/* Middle grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <Suspense fallback={<SkeletonChartCard />}>
            <RevenueChart data={chartData} />
          </Suspense>
          <RoasChart data={roasData} />
          <FunnelVisualizer stages={[]} />
        </div>
        <div className="xl:col-span-1">
          <Suspense fallback={<div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <SkeletonFeedItem key={i} />)}</div>}>
            <AIInsightsFeed insights={feedInsights} />
          </Suspense>
        </div>
      </div>

      {/* ROI Counter */}
      <ROISavingsCard savings={savings} />

      {/* Bottom: Campanhas + Preços */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CampanhasClient campaigns={campaigns} />
        <PriceTable competitors={competitors} />
      </div>

      {/* Diagnóstico */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <DiagnosticCenter data={diagnosticData} />
        <div className="glass-card rounded-xl border border-gray-800 p-5 flex flex-col justify-center items-center gap-3 text-center min-h-[200px]">
          <p className="text-sm font-semibold text-white">Diagnóstico Completo</p>
          <p className="text-xs text-gray-500 max-w-[260px]">
            Selecione uma campanha e execute o motor de correlação multivariável para ver a análise completa com resumo executivo.
          </p>
          <a
            href="/dashboard/diagnostico"
            className="mt-1 px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all"
          >
            Abrir Centro de Diagnóstico →
          </a>
        </div>
      </div>
    </div>
  )
}
