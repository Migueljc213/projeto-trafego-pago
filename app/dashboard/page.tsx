import { Suspense } from 'react'
import StatCards from '@/components/dashboard/StatCards'
import RevenueChart from '@/components/dashboard/RevenueChart'
import FunnelVisualizer from '@/components/dashboard/FunnelVisualizer'
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed'
import CampaignList from '@/components/dashboard/CampaignList'
import PriceTable from '@/components/dashboard/PriceTable'
import { SkeletonStatCard, SkeletonChartCard, SkeletonFeedItem } from '@/components/dashboard/SkeletonCards'
import {
  getDashboardStats,
  getRevenueChartData,
  getAIInsightsFeed,
  getCampaignRows,
  getCompetitorRows,
} from '@/lib/dashboard-data'

export default async function DashboardPage() {
  // Busca dados em paralelo no servidor
  const [stats, chartData, feedInsights, campaigns, competitors] = await Promise.all([
    getDashboardStats(),
    getRevenueChartData(),
    getAIInsightsFeed(),
    getCampaignRows(),
    getCompetitorRows(),
  ])

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

      {/* Bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CampaignList campaigns={campaigns} />
        <PriceTable competitors={competitors} />
      </div>
    </div>
  )
}
