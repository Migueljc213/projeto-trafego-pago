'use client'

import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, ShoppingCart, AlertTriangle } from 'lucide-react'
import type { DashboardStats, StatChange } from '@/lib/dashboard-data'

function fmt(value: number, type: 'currency' | 'roas' | 'number') {
  if (type === 'currency') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (type === 'roas') return `${value.toFixed(1)}x`
  return value.toLocaleString('pt-BR')
}

function ChangeBadge({ change }: { change: StatChange | undefined }) {
  if (!change || !change.hasData) {
    return <span className="text-xs text-gray-600">vs. período anterior</span>
  }
  const isPositive = change.value > 0
  const isNeutral = change.value === 0
  return (
    <div className="flex items-center gap-1">
      {isNeutral ? null : isPositive
        ? <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
        : <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
      }
      <span className={`text-xs font-medium ${
        isNeutral ? 'text-gray-500' : isPositive ? 'text-green-400' : 'text-red-400'
      }`}>
        {isPositive ? '+' : ''}{change.value}%
      </span>
      <span className="text-xs text-gray-600">vs. período anterior</span>
    </div>
  )
}

export default function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Investimento */}
      <div className="glass-card rounded-xl p-5 border border-gray-800 hover:border-neon-cyan/20 transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-gray-400">Investimento Total</p>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-neon-cyan/10 text-neon-cyan flex-shrink-0">
            <DollarSign className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-1.5">{fmt(stats.totalSpend, 'currency')}</p>
        <ChangeBadge change={stats.spendChange} />
      </div>

      {/* ROAS */}
      <div className="glass-card rounded-xl p-5 border border-gray-800 hover:border-neon-cyan/20 transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-gray-400">ROAS Médio</p>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-neon-cyan/10 text-neon-cyan flex-shrink-0">
            <BarChart2 className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-1.5">{fmt(stats.avgRoas, 'roas')}</p>
        <ChangeBadge change={stats.roasChange} />
      </div>

      {/* Conversões */}
      <div className="glass-card rounded-xl p-5 border border-gray-800 hover:border-neon-cyan/20 transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-gray-400">Conversões</p>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-neon-cyan/10 text-neon-cyan flex-shrink-0">
            <ShoppingCart className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-white mb-1.5">{fmt(stats.totalConversions, 'number')}</p>
        <ChangeBadge change={stats.conversionsChange} />
      </div>

      {/* Receita perdida */}
      <div className="glass-card rounded-xl p-5 border border-orange-500/30 bg-gradient-to-br from-orange-950/30 to-red-950/20 transition-all duration-300 hover:shadow-card-hover">
        <div className="flex items-start justify-between mb-4">
          <p className="text-sm font-medium text-orange-400">Receita Potencial Perdida</p>
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-orange-500/20 text-orange-400 flex-shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <p className="text-2xl font-bold text-orange-400 mb-1.5">{fmt(stats.lostRevenue, 'currency')}</p>
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />
          <span className="text-xs text-gray-500">em campanhas pausadas</span>
        </div>
      </div>
    </div>
  )
}
