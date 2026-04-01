'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, BarChart2, ShoppingCart, AlertTriangle } from 'lucide-react';
import { mockStats } from '@/lib/mock-data';
import { SkeletonStatCard } from './SkeletonCards';

interface StatCardData {
  id: string;
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  type: 'currency' | 'percentage' | 'number' | 'warning';
  icon: React.ElementType;
  extra?: string;
}

const cards: StatCardData[] = [
  {
    id: 'investment',
    title: 'Investimento Total',
    value: mockStats.totalInvestment.value,
    change: mockStats.totalInvestment.change,
    changeLabel: mockStats.totalInvestment.changeLabel,
    type: 'currency',
    icon: DollarSign,
  },
  {
    id: 'roas',
    title: 'ROAS Atual',
    value: mockStats.currentRoas.value,
    change: mockStats.currentRoas.change,
    changeLabel: mockStats.currentRoas.changeLabel,
    type: 'percentage',
    icon: BarChart2,
  },
  {
    id: 'conversions',
    title: 'Conversoes',
    value: mockStats.conversions.value,
    change: mockStats.conversions.change,
    changeLabel: mockStats.conversions.changeLabel,
    type: 'number',
    icon: ShoppingCart,
    extra: `Meta: ${mockStats.conversions.target} este mes`,
  },
  {
    id: 'lost',
    title: 'Receita Potencial Perdida',
    value: mockStats.lostRevenue.value,
    change: mockStats.lostRevenue.change,
    changeLabel: mockStats.lostRevenue.changeLabel,
    type: 'warning',
    icon: AlertTriangle,
  },
];

function StatCardItem({ card }: { card: StatCardData }) {
  const isWarning = card.type === 'warning';
  const isPositive = card.change > 0;

  return (
    <div
      className={`
        glass-card rounded-xl p-5 border transition-all duration-300 hover:shadow-card-hover
        ${isWarning
          ? 'border-orange-500/30 bg-gradient-to-br from-orange-950/30 to-red-950/20'
          : 'border-gray-800 hover:border-neon-cyan/20'
        }
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <p className={`text-sm font-medium ${isWarning ? 'text-orange-400' : 'text-gray-400'}`}>
          {card.title}
        </p>
        <div
          className={`
            w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0
            ${isWarning
              ? 'bg-orange-500/20 text-orange-400'
              : 'bg-neon-cyan/10 text-neon-cyan'
            }
          `}
        >
          <card.icon className="w-4 h-4" />
        </div>
      </div>

      <p
        className={`text-2xl font-bold mb-1.5 ${isWarning ? 'text-orange-400' : 'text-white'}`}
      >
        {card.value}
      </p>

      {card.extra && (
        <p className="text-xs text-gray-500 mb-1">{card.extra}</p>
      )}

      <div className="flex items-center gap-1.5">
        {!isWarning && (
          isPositive ? (
            <TrendingUp className="w-3 h-3 text-green-400 flex-shrink-0" />
          ) : (
            <TrendingDown className="w-3 h-3 text-red-400 flex-shrink-0" />
          )
        )}
        {isWarning && <AlertTriangle className="w-3 h-3 text-orange-400 flex-shrink-0" />}
        <span
          className={`text-xs font-medium ${
            isWarning ? 'text-orange-400/80' : isPositive ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {!isWarning && (isPositive ? '+' : '')}{!isWarning && `${card.change}%`}
        </span>
        <span className="text-xs text-gray-500">{card.changeLabel}</span>
      </div>
    </div>
  );
}

export default function StatCards() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {cards.map((card) => (
        <StatCardItem key={card.id} card={card} />
      ))}
    </div>
  );
}
