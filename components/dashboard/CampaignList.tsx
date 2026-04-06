'use client'

import { useState } from 'react'
import { Zap, Pause, Clock, TrendingUp, TrendingDown } from 'lucide-react'
import type { CampaignRow } from '@/lib/dashboard-data'

function StatusBadge({ status }: { status: string }) {
  if (status === 'ACTIVE') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
        Ativa
      </span>
    )
  }
  if (status === 'PAUSED') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-600/25">
        <Pause className="w-3 h-3" /> Pausada
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
      <Clock className="w-3 h-3" /> Em Processo
    </span>
  )
}

function CampaignCard({ campaign }: { campaign: CampaignRow }) {
  const [autoPilot, setAutoPilot] = useState(campaign.aiAutoPilot)
  const isGood = campaign.roas >= 3.0

  return (
    <div className={`glass-card rounded-xl p-4 border transition-all duration-300 ${
      autoPilot ? 'border-neon-cyan/30 bg-neon-cyan/3'
      : campaign.status === 'PAUSED' ? 'border-gray-700/50 opacity-70'
      : 'border-gray-800 hover:border-gray-700'
    }`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
          campaign.status === 'ACTIVE' ? (isGood ? 'bg-green-400' : 'bg-orange-400')
          : campaign.status === 'PAUSED' ? 'bg-gray-600' : 'bg-yellow-400'
        }`} />

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-100 truncate">{campaign.name}</h4>
            {autoPilot && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                <Zap className="w-3 h-3" /> IA gerenciando
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={campaign.status} />
            {campaign.lastAiAction && (
              <span className="text-xs text-gray-500 font-mono">
                última ação: {campaign.lastAiAction}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 text-right">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Spend</p>
            <p className="text-sm font-semibold font-mono text-gray-200">
              R$ {campaign.spend.toFixed(0)}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">ROAS</p>
            <div className="flex items-center gap-1 justify-end">
              {campaign.roas >= 2
                ? <TrendingUp className="w-3 h-3 text-green-400" />
                : <TrendingDown className="w-3 h-3 text-red-400" />
              }
              <p className={`text-sm font-bold font-mono ${campaign.roas >= 2 ? 'text-green-400' : 'text-red-400'}`}>
                {campaign.roas.toFixed(1)}x
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Conversões</p>
            <p className="text-sm font-semibold font-mono text-gray-200">{campaign.conversions}</p>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-gray-500">Auto-Pilot</p>
            <button
              onClick={() => setAutoPilot(!autoPilot)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${autoPilot ? 'bg-neon-cyan' : 'bg-gray-700'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${autoPilot ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function CampaignList({ campaigns }: { campaigns: CampaignRow[] }) {
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length
  const autoPilotCount = campaigns.filter(c => c.aiAutoPilot).length

  if (campaigns.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-gray-800 p-8 text-center">
        <p className="text-gray-500 text-sm">Nenhuma campanha encontrada.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-white">Campanhas Meta</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {activeCount} ativas &bull; {autoPilotCount} com AI Auto-Pilot
          </p>
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
          <Zap className="w-3.5 h-3.5 text-neon-purple" />
          <span className="text-xs font-medium text-neon-purple">{autoPilotCount} em Auto-Pilot</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
      </div>
    </div>
  )
}
