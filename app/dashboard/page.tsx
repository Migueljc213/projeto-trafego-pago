import { Suspense } from 'react'
import StatCards from '@/components/dashboard/StatCards'
import RevenueChart from '@/components/dashboard/RevenueChart'
import FunnelVisualizer from '@/components/dashboard/FunnelVisualizer'
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed'
import CampaignList from '@/components/dashboard/CampaignList'
import PriceTable from '@/components/dashboard/PriceTable'
import DiagnosticCenter from '@/components/dashboard/DiagnosticCenter'
import ROISavingsCard from '@/components/dashboard/ROISavingsCard'
import type { DiagnosticData } from '@/components/dashboard/DiagnosticCenter'
import { SkeletonStatCard, SkeletonChartCard, SkeletonFeedItem } from '@/components/dashboard/SkeletonCards'
import {
  getDashboardStats,
  getRevenueChartData,
  getAIInsightsFeed,
  getCampaignRows,
  getCompetitorRows,
  getLatestStrategicInsight,
  getMoneySavedByAI,
} from '@/lib/dashboard-data'

export default async function DashboardPage() {
  // Busca dados em paralelo no servidor
  const [stats, chartData, feedInsights, campaigns, competitors, latestInsight, savings] = await Promise.all([
    getDashboardStats(),
    getRevenueChartData(),
    getAIInsightsFeed(),
    getCampaignRows(),
    getCompetitorRows(),
    getLatestStrategicInsight(),
    getMoneySavedByAI(),
  ])

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

  const now = new Date()
  const monthLabel = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white capitalize">Visão Geral</h1>
          <p className="text-sm text-gray-500 mt-0.5 capitalize">
            {monthLabel} &bull; Todas as campanhas
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-neon-cyan/20">
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse block"></span>
          <span className="text-xs font-medium text-neon-cyan">IA monitorando em tempo real</span>
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
          <FunnelVisualizer />
        </div>
        <div className="xl:col-span-1">
          <Suspense fallback={<div className="space-y-2">{Array.from({length:4}).map((_,i)=><SkeletonFeedItem key={i}/>)}</div>}>
            <AIInsightsFeed insights={feedInsights} />
          </Suspense>
        </div>
      </div>

      {/* ROI Counter — Dinheiro Salvo pela IA */}
      <ROISavingsCard savings={savings} />

      {/* Bottom: Campanhas + Preços */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CampaignList campaigns={campaigns} />
        <PriceTable competitors={competitors} />
      </div>

      {/* Diagnóstico de Causa Raiz */}
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
