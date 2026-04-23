'use client'

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend, ReferenceLine,
} from 'recharts'
import type { RoasByCampaignData } from '@/lib/dashboard-data'

// Palette cycles through these for each campaign line
const PALETTE = [
  '#00D4FF', // neon-cyan
  '#8B5CF6', // neon-purple
  '#22C55E', // green
  '#F59E0B', // amber
  '#EC4899', // pink
]

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div className="bg-dark-card border border-gray-700 rounded-lg px-3 py-2.5 text-xs shadow-xl min-w-[160px]">
      <p className="text-gray-400 font-mono mb-2 font-medium">{label}</p>
      {payload
        .filter((p) => p.value > 0)
        .sort((a, b) => b.value - a.value)
        .map((p) => (
          <p key={p.name} className="mb-0.5 font-semibold truncate" style={{ color: p.color }}>
            {p.name.length > 22 ? p.name.slice(0, 20) + '…' : p.name}: {p.value.toFixed(1)}x
          </p>
        ))}
    </div>
  )
}

export default function RoasChart({ data }: { data: RoasByCampaignData }) {
  const { points, campaignNames, predKeys = [] } = data

  if (points.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5 border border-gray-800 flex flex-col items-center justify-center h-64 gap-2">
        <p className="text-gray-500 text-sm">Sem dados de ROAS por campanha</p>
        <p className="text-gray-600 text-xs">Aguardando insights diários sincronizados</p>
      </div>
    )
  }

  // Índice da primeira data prevista para a ReferenceLine vertical
  const firstPredIdx = points.findIndex(p => p.predicted)
  const firstPredDate = firstPredIdx >= 0 ? points[firstPredIdx].date as string : null
  const tickStep = Math.max(1, Math.floor(points.length / 8))

  return (
    <div className="glass-card rounded-xl p-5 border border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">ROAS por Campanha</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Top {campaignNames.length} campanhas por gasto
            {predKeys.length > 0 && <span className="ml-2 text-neon-purple/70">· previsão 7 dias</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {predKeys.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="w-4 border-t border-dashed border-neon-purple/50 inline-block" />
              <span className="text-[10px] text-neon-purple/70">Previsão</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" />
            <span className="text-xs text-green-400 font-medium">Meta ROAS: 3x</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={230}>
        <LineChart data={points} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 10, fill: 'rgba(156,163,175,0.7)', fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            interval={tickStep}
          />
          <YAxis
            tick={{ fontSize: 10, fill: 'rgba(156,163,175,0.7)', fontFamily: 'monospace' }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: number) => `${v}x`}
          />
          <ReferenceLine
            y={3}
            stroke="rgba(34,197,94,0.4)"
            strokeDasharray="4 4"
            label={{ value: 'Meta 3x', position: 'right', fontSize: 9, fill: 'rgba(34,197,94,0.6)' }}
          />
          {firstPredDate && (
            <ReferenceLine
              x={firstPredDate}
              stroke="rgba(139,92,246,0.3)"
              strokeDasharray="2 3"
              label={{ value: 'hoje', position: 'insideTopLeft', fontSize: 9, fill: 'rgba(139,92,246,0.5)' }}
            />
          )}
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
            formatter={(value: string) => {
              const isPred = value.endsWith('_pred')
              const baseName = isPred ? value.slice(0, -5) : value
              const idx = campaignNames.indexOf(baseName)
              const color = PALETTE[idx % PALETTE.length]
              if (isPred) return null // não aparece na legenda
              const label = baseName.length > 18 ? baseName.slice(0, 16) + '…' : baseName
              return <span style={{ color, fontSize: '11px' }}>{label}</span>
            }}
          />
          {campaignNames.map((name, i) => (
            <Line
              key={name}
              type="monotone"
              dataKey={name}
              stroke={PALETTE[i % PALETTE.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, stroke: '#030712', strokeWidth: 2 }}
              connectNulls
            />
          ))}
          {predKeys.map((key) => {
            const baseName = key.slice(0, -5)
            const i = campaignNames.indexOf(baseName)
            return (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={PALETTE[i % PALETTE.length]}
                strokeWidth={1.5}
                strokeDasharray="4 3"
                strokeOpacity={0.5}
                dot={false}
                activeDot={false}
                connectNulls
                legendType="none"
              />
            )
          })}
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
