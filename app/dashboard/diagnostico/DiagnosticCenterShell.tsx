'use client'

import { useState, useTransition } from 'react'
import DiagnosticCenter, { type DiagnosticData } from '@/components/dashboard/DiagnosticCenter'
import type { LatestDiagnostic, CampaignRow } from '@/lib/dashboard-data'
import { History, ChevronRight, Megaphone } from 'lucide-react'

interface Props {
  latestInsight: LatestDiagnostic | null
  recentInsights: LatestDiagnostic[]
  campaigns: CampaignRow[]
}

function insightToData(insight: LatestDiagnostic): DiagnosticData {
  return {
    campaignName: insight.campaignName,
    bottleneck: insight.bottleneck as DiagnosticData['bottleneck'],
    adScore: insight.adScore,
    priceScore: insight.priceScore,
    siteScore: insight.siteScore,
    rootCause: insight.rootCause,
    executiveSummary: insight.executiveSummary,
    createdAt: new Date(insight.createdAt),
  }
}

export default function DiagnosticCenterShell({ latestInsight, recentInsights, campaigns }: Props) {
  const [currentData, setCurrentData] = useState<DiagnosticData | null>(
    latestInsight ? insightToData(latestInsight) : null
  )
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>(
    latestInsight?.campaignId ?? campaigns[0]?.id ?? ''
  )
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function runDiagnosis() {
    if (!selectedCampaignId) return
    setError(null)

    startTransition(async () => {
      try {
        const res = await fetch(`/api/diagnose/${selectedCampaignId}`, { method: 'POST' })
        const json = await res.json()

        if (!res.ok || json.error) {
          setError(json.error ?? 'Falha ao executar diagnóstico')
          return
        }

        const d = json.insight
        setCurrentData({
          campaignName: d.campaignName,
          bottleneck: d.bottleneck,
          adScore: d.adScore,
          priceScore: d.priceScore,
          siteScore: d.siteScore,
          rootCause: d.rootCause,
          executiveSummary: d.executiveSummary ?? null,
          createdAt: new Date(d.createdAt),
        })
      } catch (e) {
        setError('Erro de conexão. Tente novamente.')
        console.error(e)
      }
    })
  }

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

      {/* Panel Principal — DiagnosticCenter */}
      <div className="xl:col-span-2 space-y-5">

        {/* Seletor de campanha */}
        <div className="glass-card rounded-xl border border-gray-800 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Megaphone className="w-4 h-4" />
              <span>Diagnosticar campanha:</span>
            </div>
            <select
              value={selectedCampaignId}
              onChange={(e) => setSelectedCampaignId(e.target.value)}
              className="flex-1 min-w-[200px] bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-neon-cyan/50 transition-colors"
            >
              {campaigns.length === 0 && (
                <option value="">Nenhuma campanha disponível</option>
              )}
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} · ROAS {c.roas.toFixed(1)}x
                </option>
              ))}
            </select>
            <button
              onClick={runDiagnosis}
              disabled={isPending || !selectedCampaignId}
              className="px-4 py-2 rounded-lg bg-neon-cyan text-black text-sm font-semibold hover:bg-neon-cyan/90 transition-all disabled:opacity-40 whitespace-nowrap"
            >
              {isPending ? 'Analisando...' : 'Executar Diagnóstico'}
            </button>
          </div>

          {error && (
            <p className="mt-2 text-xs text-red-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
              {error}
            </p>
          )}
        </div>

        {/* DiagnosticCenter Component */}
        <DiagnosticCenter
          data={currentData}
          onRunDiagnosis={runDiagnosis}
          loading={isPending}
        />
      </div>

      {/* Sidebar — Histórico de Diagnósticos */}
      <div className="xl:col-span-1">
        <div className="glass-card rounded-xl border border-gray-800 p-5">
          <h3 className="text-sm font-semibold text-white flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-gray-400" />
            Histórico de Diagnósticos
          </h3>

          {recentInsights.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-8">
              Nenhum diagnóstico gerado ainda.
            </p>
          ) : (
            <div className="space-y-2">
              {recentInsights.map((insight) => {
                const isActive = currentData?.createdAt.getTime() === new Date(insight.createdAt).getTime()
                const bottleneckColors: Record<string, string> = {
                  AD: 'text-purple-400',
                  PRICE: 'text-orange-400',
                  SITE: 'text-red-400',
                  MIXED: 'text-yellow-400',
                  HEALTHY: 'text-green-400',
                }
                const scoreMin = Math.min(insight.adScore, insight.priceScore, insight.siteScore)

                return (
                  <button
                    key={insight.id}
                    onClick={() => setCurrentData(insightToData(insight))}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      isActive
                        ? 'border-neon-cyan/40 bg-neon-cyan/5'
                        : 'border-gray-800 hover:border-gray-600 bg-white/2'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-300 truncate">
                          {insight.campaignName ?? 'Campanha'}
                        </p>
                        <p className={`text-xs font-semibold mt-0.5 ${bottleneckColors[insight.bottleneck] ?? 'text-gray-400'}`}>
                          {insight.bottleneck}
                        </p>
                        <p className="text-xs text-gray-600 mt-1">
                          {new Date(insight.createdAt).toLocaleDateString('pt-BR', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <span className={`text-sm font-bold font-mono ${scoreMin >= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {scoreMin}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
