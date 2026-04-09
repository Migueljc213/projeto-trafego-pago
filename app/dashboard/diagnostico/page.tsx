/**
 * /dashboard/diagnostico
 *
 * Centro de Diagnóstico — mostra o último StrategicInsight e permite
 * executar um novo diagnóstico on-demand para qualquer campanha.
 */

import { Suspense } from 'react'
import DiagnosticCenterShell from './DiagnosticCenterShell'
import { getAllStrategicInsights, getLatestStrategicInsight } from '@/lib/dashboard-data'
import { getCampaignRows } from '@/lib/dashboard-data'
import { SkeletonChartCard } from '@/components/dashboard/SkeletonCards'

export default async function DiagnosticoPage() {
  const [latestInsight, recentInsights, campaigns] = await Promise.all([
    getLatestStrategicInsight(),
    getAllStrategicInsights(5),
    getCampaignRows(),
  ])

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Centro de Diagnóstico</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Motor de Causa Raiz · Cruzamento de Meta Ads + Preços + LP Audit
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-purple-500/20">
          <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse block" />
          <span className="text-xs font-medium text-purple-400">IA analisando funil completo</span>
        </div>
      </div>

      {/* Main content */}
      <Suspense fallback={<SkeletonChartCard />}>
        <DiagnosticCenterShell
          latestInsight={latestInsight}
          recentInsights={recentInsights}
          campaigns={campaigns}
        />
      </Suspense>
    </div>
  )
}
