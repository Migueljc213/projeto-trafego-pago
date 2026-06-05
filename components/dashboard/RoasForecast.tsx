'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Minus, Loader2, Sparkles, RefreshCw, AlertCircle } from 'lucide-react'
import type { RoasForecast, RoasForecastDay } from '@/app/api/ai/roas-forecast/route'

const TREND_CONFIG = {
  UP: {
    icon: TrendingUp,
    color: 'text-green-400',
    bg: 'bg-green-500/10 border-green-500/20',
    label: 'Tendência de alta',
  },
  DOWN: {
    icon: TrendingDown,
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    label: 'Tendência de queda',
  },
  STABLE: {
    icon: Minus,
    color: 'text-blue-400',
    bg: 'bg-blue-500/10 border-blue-500/20',
    label: 'Estável',
  },
}

const CONFIDENCE_LABEL: Record<string, string> = {
  high: 'Alta confiança',
  medium: 'Confiança média',
  low: 'Baixa confiança',
}

const CONFIDENCE_COLOR: Record<string, string> = {
  high: 'text-green-400',
  medium: 'text-yellow-400',
  low: 'text-gray-500',
}

function DayBar({ day, maxRoas, minRoas }: { day: RoasForecastDay; maxRoas: number; minRoas: number }) {
  const range = maxRoas - minRoas || 1
  const pct = Math.max(10, ((day.predictedRoas - minRoas) / range) * 100)
  const isGood = day.predictedRoas >= 2

  return (
    <div className="flex flex-col items-center gap-1 flex-1 min-w-0">
      <span className={`text-[10px] font-bold font-mono ${isGood ? 'text-green-400' : 'text-red-400'}`}>
        {day.predictedRoas.toFixed(1)}x
      </span>
      <div className="w-full flex flex-col justify-end h-16 bg-gray-800/50 rounded-sm overflow-hidden">
        <div
          className={`w-full rounded-sm transition-all ${isGood ? 'bg-neon-cyan/60' : 'bg-red-500/50'}`}
          style={{ height: `${pct}%` }}
        />
      </div>
      <span className="text-[9px] text-gray-600 text-center leading-tight truncate w-full text-center">
        {day.label.split(' ')[0]}
      </span>
    </div>
  )
}

interface Props {
  campaignId: string
  campaignName: string
}

export default function RoasForecast({ campaignId, campaignName }: Props) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [forecast, setForecast] = useState<RoasForecast | null>(null)

  async function generate() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/roas-forecast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setForecast(data.forecast)
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  const trendCfg = forecast ? TREND_CONFIG[forecast.trend] : null
  const maxRoas = forecast ? Math.max(...forecast.days.map(d => d.predictedRoas)) : 0
  const minRoas = forecast ? Math.min(...forecast.days.map(d => d.predictedRoas)) : 0

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-neon-purple" />
          <div>
            <h3 className="text-sm font-semibold text-white">Previsão de ROAS — próximos 7 dias</h3>
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">{campaignName}</p>
          </div>
        </div>
        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/15 border border-neon-purple/30 text-neon-purple text-xs font-semibold hover:bg-neon-purple/25 transition-all disabled:opacity-40"
        >
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Prevendo…</>
            : forecast
              ? <><RefreshCw className="w-3.5 h-3.5" /> Atualizar previsão</>
              : <><Sparkles className="w-3.5 h-3.5" /> Gerar previsão</>
          }
        </button>
      </div>

      {error && (
        <div className="mx-5 mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/25 flex items-start gap-2">
          <AlertCircle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-400">{error}</p>
        </div>
      )}

      {!forecast && !loading && !error && (
        <div className="p-5 text-center">
          <p className="text-xs text-gray-600">
            Clique em "Gerar previsão" para que a IA analise o histórico da campanha e projete o ROAS dos próximos 7 dias.
          </p>
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-xs">
          <Loader2 className="w-4 h-4 animate-spin text-neon-purple" />
          Analisando histórico de {campaignName}…
        </div>
      )}

      {forecast && !loading && (
        <div className="p-5 space-y-4">
          {/* Trend + confidence */}
          <div className={`flex items-center justify-between p-3 rounded-lg border ${trendCfg!.bg}`}>
            <div className="flex items-center gap-2">
              {(() => {
                const Icon = trendCfg!.icon
                return <Icon className={`w-4 h-4 ${trendCfg!.color}`} />
              })()}
              <span className={`text-sm font-semibold ${trendCfg!.color}`}>
                {trendCfg!.label}
              </span>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold text-white font-mono">{forecast.predictedAvgRoas.toFixed(2)}x</p>
              <p className={`text-[10px] ${CONFIDENCE_COLOR[forecast.confidence]}`}>
                {CONFIDENCE_LABEL[forecast.confidence]}
              </p>
            </div>
          </div>

          {/* Day bars */}
          <div className="flex items-end gap-1">
            {forecast.days.map(day => (
              <DayBar key={day.offset} day={day} maxRoas={maxRoas} minRoas={minRoas} />
            ))}
          </div>

          {/* Summary */}
          <div className="p-3 rounded-lg bg-gray-800/40 border border-gray-700/50 space-y-2">
            <p className="text-xs text-gray-300 leading-relaxed">{forecast.weekSummary}</p>
            <p className="text-xs text-neon-cyan font-medium">
              Recomendação: {forecast.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
