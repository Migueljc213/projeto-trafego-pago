'use client'

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { RevenueDataPoint } from '@/lib/types'

function formatCurrency(value: number): string {
  return `R$ ${value.toLocaleString('pt-BR')}`
}

interface CustomTooltipProps {
  active?: boolean
  payload?: Array<{ name: string; value: number; color: string }>
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  const investment = payload.find(p => p.name === 'Investimento')
  const revenue = payload.find(p => p.name === 'Retorno')
  const roas = investment && revenue && investment.value > 0
    ? (revenue.value / investment.value).toFixed(1) : '—'
  return (
    <div className="bg-dark-card border border-gray-700 rounded-lg px-3 py-2.5 text-xs shadow-xl">
      <p className="text-gray-400 font-mono mb-2 font-medium">{label}</p>
      {revenue && <p style={{ color: '#00D4FF' }} className="font-semibold mb-0.5">Retorno: {formatCurrency(revenue.value)}</p>}
      {investment && <p style={{ color: '#8B5CF6' }} className="font-medium mb-0.5">Invest.: {formatCurrency(investment.value)}</p>}
      <p className="text-gray-400 mt-1">ROAS: <span className="text-white font-bold">{roas}x</span></p>
    </div>
  )
}

export default function RevenueChart({ data }: { data: RevenueDataPoint[] }) {
  if (data.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5 border border-gray-800 flex items-center justify-center h-64">
        <p className="text-gray-500 text-sm">Nenhum dado disponível ainda.</p>
      </div>
    )
  }

  const totalInvestment = data.reduce((s, d) => s + d.investment, 0)
  const totalRevenue = data.reduce((s, d) => s + d.revenue, 0)
  const avgRoas = totalInvestment > 0 ? totalRevenue / totalInvestment : 0
  const tickStep = Math.max(1, Math.floor(data.length / 6))

  return (
    <div className="glass-card rounded-xl p-5 border border-gray-800">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Investimento vs. Retorno</h3>
          <p className="text-xs text-gray-500 mt-0.5">Últimos 30 dias</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
          <span className="text-xs text-gray-400">Total Retorno: </span>
          <span className="text-xs font-semibold text-neon-cyan">{formatCurrency(totalRevenue)}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
          <span className="text-xs text-gray-400">Total Invest.: </span>
          <span className="text-xs font-semibold text-neon-purple">{formatCurrency(totalInvestment)}</span>
        </div>
        <div className="px-3 py-1.5 rounded-lg bg-white/5 border border-gray-700">
          <span className="text-xs text-gray-400">ROAS Médio: </span>
          <span className="text-xs font-semibold text-white">{avgRoas.toFixed(1)}x</span>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="cyanGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#00D4FF" stopOpacity={0.25} />
              <stop offset="95%" stopColor="#00D4FF" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="purpleGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.20} />
              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
          <XAxis dataKey="date" tick={{ fontSize: 10, fill: 'rgba(156,163,175,0.7)', fontFamily: 'monospace' }} tickLine={false} axisLine={false} interval={tickStep} />
          <YAxis tick={{ fontSize: 10, fill: 'rgba(156,163,175,0.7)', fontFamily: 'monospace' }} tickLine={false} axisLine={false} tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '12px' }} formatter={(value: string) => (
            <span style={{ color: value === 'Retorno' ? '#00D4FF' : '#8B5CF6', fontSize: '12px' }}>{value}</span>
          )} />
          <Area type="monotone" dataKey="investment" name="Investimento" stroke="#8B5CF6" strokeWidth={1.5} fill="url(#purpleGradient)" dot={false} activeDot={{ r: 4, fill: '#8B5CF6', stroke: '#030712', strokeWidth: 2 }} />
          <Area type="monotone" dataKey="revenue" name="Retorno" stroke="#00D4FF" strokeWidth={2} fill="url(#cyanGradient)" dot={false} activeDot={{ r: 4, fill: '#00D4FF', stroke: '#030712', strokeWidth: 2 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
