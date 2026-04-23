'use client'

import { useState } from 'react'
import { TrendingUp, TrendingDown, Award, ChevronUp, ChevronDown } from 'lucide-react'
import type { CreativeRankRow } from '@/lib/dashboard-data'

type SortKey = 'score' | 'roas' | 'ctr' | 'cpa' | 'cpc' | 'spend' | 'conversions'

const SORT_LABELS: Record<SortKey, string> = {
  score: 'Score IA',
  roas: 'ROAS',
  ctr: 'CTR',
  cpa: 'CPA',
  cpc: 'CPC',
  spend: 'Gasto',
  conversions: 'Conversões',
}

function ScoreBadge({ score }: { score: number }) {
  const color =
    score >= 70 ? 'text-green-400 bg-green-400/10 border-green-400/20'
    : score >= 40 ? 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20'
    : 'text-red-400 bg-red-400/10 border-red-400/20'
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold border ${color}`}>
      {score}
    </span>
  )
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 70 ? 'bg-green-400' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
  return (
    <div className="w-16 h-1.5 bg-gray-700 rounded-full overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${score}%` }} />
    </div>
  )
}

function fmt(val: number, type: 'currency' | 'pct' | 'number'): string {
  if (type === 'currency') return `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  if (type === 'pct') return `${val.toFixed(2)}%`
  return val.toLocaleString('pt-BR')
}

const MEDAL_COLORS = ['text-yellow-400', 'text-gray-300', 'text-amber-600']

export default function CreativeRanking({ rows }: { rows: CreativeRankRow[] }) {
  const [sortKey, setSortKey] = useState<SortKey>('score')
  const [asc, setAsc] = useState(false)

  const sorted = [...rows].sort((a, b) => {
    const diff = a[sortKey] - b[sortKey]
    return asc ? diff : -diff
  })

  function handleSort(key: SortKey) {
    if (key === sortKey) setAsc((v) => !v)
    else { setSortKey(key); setAsc(false) }
  }

  function SortBtn({ col }: { col: SortKey }) {
    const active = col === sortKey
    return (
      <button
        onClick={() => handleSort(col)}
        className={`flex items-center gap-1 text-xs font-medium transition-colors ${active ? 'text-neon-cyan' : 'text-gray-500 hover:text-gray-300'}`}
      >
        {SORT_LABELS[col]}
        {active ? (asc ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />) : null}
      </button>
    )
  }

  if (rows.length === 0) {
    return (
      <div className="glass-card rounded-xl p-5 border border-gray-800 flex flex-col items-center justify-center gap-2 min-h-[200px]">
        <Award className="w-6 h-6 text-gray-700" />
        <p className="text-gray-500 text-sm">Sem dados de campanhas ainda</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            Ranking de Criativos
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Score composto: ROAS 40% · CTR 25% · CPA 25% · Gasto 10%</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(['score', 'roas', 'ctr', 'cpa'] as SortKey[]).map((k) => (
            <SortBtn key={k} col={k} />
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-gray-800/60">
              <th className="px-4 py-2.5 text-left text-gray-500 font-medium w-6">#</th>
              <th className="px-4 py-2.5 text-left text-gray-500 font-medium">Campanha</th>
              <th className="px-4 py-2.5 text-right text-gray-500 font-medium">Score</th>
              <th className="px-4 py-2.5 text-right text-gray-500 font-medium">ROAS</th>
              <th className="px-4 py-2.5 text-right text-gray-500 font-medium hidden sm:table-cell">CTR</th>
              <th className="px-4 py-2.5 text-right text-gray-500 font-medium hidden sm:table-cell">CPA</th>
              <th className="px-4 py-2.5 text-right text-gray-500 font-medium hidden md:table-cell">Gasto</th>
              <th className="px-4 py-2.5 text-right text-gray-500 font-medium hidden md:table-cell">Conv.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/40">
            {sorted.map((row, idx) => {
              const rank = idx + 1
              const isTop = rank <= 3
              return (
                <tr key={row.id} className={`transition-colors ${isTop ? 'hover:bg-white/3' : 'hover:bg-white/2 opacity-90'}`}>
                  <td className="px-4 py-3 text-center">
                    {rank <= 3 ? (
                      <span className={`text-sm ${MEDAL_COLORS[rank - 1]}`}>
                        {rank === 1 ? '🥇' : rank === 2 ? '🥈' : '🥉'}
                      </span>
                    ) : (
                      <span className="text-gray-600 font-mono">{rank}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 max-w-[180px]">
                      <span className="text-gray-200 font-medium truncate text-xs leading-tight">{row.name}</span>
                      <ScoreBar score={row.score} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <ScoreBadge score={row.score} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {row.roas >= 2 ? (
                        <TrendingUp className="w-3 h-3 text-green-400" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-red-400" />
                      )}
                      <span className={`font-bold font-mono ${row.roas >= 2 ? 'text-green-400' : 'text-red-400'}`}>
                        {row.roas.toFixed(1)}x
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className="text-gray-300 font-mono">{fmt(row.ctr, 'pct')}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden sm:table-cell">
                    <span className={`font-mono ${row.cpa > 0 && row.cpa < 100 ? 'text-green-400' : 'text-gray-400'}`}>
                      {row.cpa > 0 ? fmt(row.cpa, 'currency') : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-gray-300 font-mono">{fmt(row.spend, 'currency')}</span>
                  </td>
                  <td className="px-4 py-3 text-right hidden md:table-cell">
                    <span className="text-gray-300 font-mono">{row.conversions}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
