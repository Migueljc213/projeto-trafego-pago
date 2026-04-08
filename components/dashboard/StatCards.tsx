'use client'

import React from 'react'
import { TrendingUp, TrendingDown, DollarSign, BarChart2, ShoppingCart, AlertTriangle } from 'lucide-react'
import type { DashboardStats } from '@/lib/dashboard-data'

function fmt(value: number, type: 'currency' | 'roas' | 'number') {
  if (type === 'currency') return `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  if (type === 'roas') return `${value.toFixed(1)}x`
  return value.toLocaleString('pt-BR')
}

interface StatCard {
  id: string
  title: string
  value: string
  change: number | null
  changeLabel: string
  type: 'currency' | 'percentage' | 'number' | 'warning'
  icon: React.ElementType
}

export default function StatCards({ stats }: { stats: DashboardStats }) {
  const cards: StatCard[] = [
    {
      id: 'investment',
      title: 'Investimento Total',
      value: fmt(stats.totalSpend, 'currency'),
      change: stats.totalSpend > 0 ? null : null,
      changeLabel: stats.totalSpend > 0 ? 'vs. mês anterior' : 'sem dados ainda',
      type: 'currency' as const,
      icon: DollarSign,
    },
    {
      id: 'roas',
      title: 'ROAS Médio',
      value: fmt(stats.avgRoas, 'roas'),
      change: stats.avgRoas > 0 ? null : null,
      changeLabel: stats.avgRoas > 0 ? 'vs. mês anterior' : 'sem dados ainda',
      type: 'percentage' as const,
      icon: BarChart2,
    },
    {
      id: 'conversions',
      title: 'Conversões',
      value: fmt(stats.totalConversions, 'number'),
      change: stats.totalConversions > 0 ? null : null,
      changeLabel: stats.totalConversions > 0 ? 'vs. mês anterior' : 'sem dados ainda',
      type: 'number' as const,
      icon: ShoppingCart,
    },
    {
      id: 'lost',
      title: 'Receita Potencial Perdida',
      value: fmt(stats.lostRevenue, 'currency'),
      change: 0,
      changeLabel: 'em campanhas pausadas',
      type: 'warning' as const,
      icon: AlertTriangle,
    },
  ]

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => {
        const isWarning = card.type === 'warning'
        const isPositive = (card.change ?? 0) > 0
        return (
          <div
            key={card.id}
            className={`glass-card rounded-xl p-5 border transition-all duration-300 hover:shadow-card-hover ${
              isWarning
                ? 'border-orange-500/30 bg-gradient-to-br from-orange-950/30 to-red-950/20'
                : 'border-gray-800 hover:border-neon-cyan/20'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <p className={`text-sm font-medium ${isWarning ? 'text-orange-400' : 'text-gray-400'}`}>
                {card.title}
              </p>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                isWarning ? 'bg-orange-500/20 text-orange-400' : 'bg-neon-cyan/10 text-neon-cyan'
              }`}>
                <card.icon className="w-4 h-4" />
              </div>
            </div>

            <p className={`text-2xl font-bold mb-1.5 ${isWarning ? 'text-orange-400' : 'text-white'}`}>
              {card.value}
            </p>

            <div className="flex items-center gap-1.5">
              {isWarning && <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />}
              {!isWarning && card.change !== null && (
                card.change > 0
                  ? <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
                  : <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
              )}
              {!isWarning && card.change !== null && (
                <span className={`text-xs font-medium ${card.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {card.change > 0 ? '+' : ''}{card.change}%
                </span>
              )}
              <span className="text-xs text-gray-500">{card.changeLabel}</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}
