'use client'

import { TrendingDown } from 'lucide-react'
import type { CompetitorRow } from '@/lib/dashboard-data'

function formatPrice(value: number): string {
  return `R$ ${value.toFixed(2).replace('.', ',')}`
}

export default function PriceTable({ competitors }: { competitors: CompetitorRow[] }) {
  if (competitors.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-gray-800 p-8 text-center">
        <p className="text-gray-500 text-sm">Nenhum concorrente monitorado ainda.</p>
        <p className="text-gray-600 text-xs mt-1">Adicione concorrentes na aba Preços.</p>
      </div>
    )
  }

  const lastUpdated = competitors[0]?.lastChecked
    ? new Date(competitors[0].lastChecked).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-white">Monitor de Preços</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {lastUpdated ? `Atualizado às ${lastUpdated}` : 'Aguardando primeira coleta'}
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 bg-white/2">
              <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Concorrente</th>
              <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Último Preço</th>
              <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Atualizado</th>
            </tr>
          </thead>
          <tbody>
            {competitors.map((comp, idx) => (
              <tr key={comp.id} className={`border-b border-gray-800/50 transition-colors ${idx === 0 ? 'bg-neon-cyan/3' : 'hover:bg-white/2'}`}>
                <td className="px-5 py-3.5">
                  <div>
                    <p className="font-medium text-gray-100 text-sm">{comp.name}</p>
                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[180px]">{comp.url}</p>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  {comp.lastPrice !== null ? (
                    <span className="font-semibold font-mono text-sm text-white">
                      {formatPrice(comp.lastPrice)}
                    </span>
                  ) : (
                    <span className="text-gray-600 text-xs">Não coletado</span>
                  )}
                </td>
                <td className="px-4 py-3.5 text-center">
                  {comp.lastChecked ? (
                    <span className="text-xs text-gray-500 font-mono">
                      {new Date(comp.lastChecked).toLocaleDateString('pt-BR')}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/15 text-orange-400 border border-orange-500/25">
                      <TrendingDown className="w-3 h-3" /> Pendente
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-5 py-3 border-t border-gray-800 bg-white/2">
        <p className="text-xs text-gray-500">
          <span className="text-neon-cyan/70 font-medium">{competitors.length} concorrentes</span> monitorados.
          Use a aba Preços para executar uma nova coleta.
        </p>
      </div>
    </div>
  )
}
