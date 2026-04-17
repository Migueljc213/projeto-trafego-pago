'use client'

import { useState, useTransition } from 'react'
import { Zap, Pause, Play, Clock, TrendingUp, TrendingDown, Loader2, RefreshCw, Plus, Pencil, Check, X } from 'lucide-react'
import Link from 'next/link'
import type { CampaignRow } from '@/lib/dashboard-data'
import { toggleAutoPilotAction, updateCampaignBudgetAction, toggleCampaignStatusAction } from '@/actions/campaigns'

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
  const [status, setStatus] = useState(campaign.status)
  const [isPending, startTransition] = useTransition()
  const [statusPending, startStatusTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [editingBudget, setEditingBudget] = useState(false)
  const [budgetInput, setBudgetInput] = useState(String(campaign.dailyBudget ?? ''))
  const [budgetPending, startBudgetTransition] = useTransition()
  const isGood = campaign.roas >= 3.0

  function handleToggleStatus() {
    const newStatus = status === 'ACTIVE' ? 'PAUSED' : 'ACTIVE'
    setStatus(newStatus) // optimistic
    setError(null)
    startStatusTransition(async () => {
      const result = await toggleCampaignStatusAction({
        campaignId: campaign.id,
        newStatus,
      })
      if (!result.success) {
        setStatus(status) // rollback
        setError(result.error ?? 'Erro ao atualizar status')
      }
    })
  }

  function handleSaveBudget() {
    const val = parseFloat(budgetInput)
    if (isNaN(val) || val < 5) {
      setError('Orçamento mínimo: R$5,00/dia')
      return
    }
    setError(null)
    startBudgetTransition(async () => {
      const result = await updateCampaignBudgetAction({ campaignId: campaign.id, dailyBudgetBRL: val })
      if (result.success) {
        setEditingBudget(false)
      } else {
        setError(result.error ?? 'Erro ao atualizar orçamento')
      }
    })
  }

  function handleToggle() {
    const newValue = !autoPilot
    setAutoPilot(newValue) // optimistic update
    setError(null)

    startTransition(async () => {
      const result = await toggleAutoPilotAction({
        campaignId: campaign.id,
        enabled: newValue,
      })
      if (!result.success) {
        setAutoPilot(!newValue) // rollback
        setError(result.error ?? 'Erro ao atualizar Auto-Pilot')
      }
    })
  }

  return (
    <div className={`glass-card rounded-xl p-4 border transition-all duration-300 ${
      autoPilot ? 'border-neon-cyan/30 bg-neon-cyan/3'
      : status === 'PAUSED' ? 'border-gray-700/50 opacity-70'
      : 'border-gray-800 hover:border-gray-700'
    }`}>
      <div className="flex flex-wrap items-start gap-3">
        <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${
          status === 'ACTIVE' ? (isGood ? 'bg-green-400' : 'bg-orange-400')
          : status === 'PAUSED' ? 'bg-gray-600' : 'bg-yellow-400'
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
            <StatusBadge status={status} />
            {campaign.lastAiAction && (
              <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                última ação: {campaign.lastAiAction}
              </span>
            )}
          </div>
          {error && (
            <p className="text-xs text-red-400 mt-1">{error}</p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-4 text-right">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Orçamento/dia</p>
            {editingBudget ? (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-400">R$</span>
                <input
                  type="number"
                  min={5}
                  step={1}
                  value={budgetInput}
                  onChange={e => setBudgetInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleSaveBudget(); if (e.key === 'Escape') setEditingBudget(false) }}
                  autoFocus
                  className="w-16 bg-gray-800 border border-neon-cyan/40 rounded px-1.5 py-0.5 text-xs text-white font-mono focus:outline-none"
                />
                <button onClick={handleSaveBudget} disabled={budgetPending} className="text-green-400 hover:text-green-300 disabled:opacity-50">
                  {budgetPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
                <button onClick={() => setEditingBudget(false)} className="text-gray-500 hover:text-gray-300">
                  <X className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 justify-end">
                <p className="text-sm font-semibold font-mono text-gray-200">
                  R$ {(campaign.dailyBudget ?? 0).toFixed(0)}
                </p>
                <button onClick={() => { setEditingBudget(true); setBudgetInput(String(campaign.dailyBudget ?? '')) }} className="text-gray-600 hover:text-gray-400 transition-colors">
                  <Pencil className="w-3 h-3" />
                </button>
              </div>
            )}
          </div>
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
            <p className="text-xs text-gray-500">Status</p>
            <button
              onClick={handleToggleStatus}
              disabled={statusPending || status === 'DELETED' || status === 'ARCHIVED'}
              title={status === 'ACTIVE' ? 'Pausar campanha' : 'Ativar campanha'}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all disabled:opacity-50 ${
                status === 'ACTIVE'
                  ? 'bg-gray-700 hover:bg-red-500/20 hover:text-red-400 text-gray-300 border border-gray-600'
                  : 'bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/30'
              }`}
            >
              {statusPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : status === 'ACTIVE' ? (
                <><Pause className="w-3 h-3" /> Pausar</>
              ) : (
                <><Play className="w-3 h-3" /> Ativar</>
              )}
            </button>
          </div>
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-gray-500">Auto-Pilot</p>
            <button
              onClick={handleToggle}
              disabled={isPending}
              title={autoPilot ? 'Desativar Auto-Pilot' : 'Ativar Auto-Pilot'}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 disabled:opacity-60 ${
                autoPilot ? 'bg-neon-cyan' : 'bg-gray-700'
              }`}
            >
              {isPending ? (
                <Loader2 className="w-3 h-3 text-white absolute left-1 animate-spin" />
              ) : (
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${
                  autoPilot ? 'translate-x-[18px]' : 'translate-x-0.5'
                }`} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

interface Props {
  campaigns: CampaignRow[]
  onSync?: () => void
  syncing?: boolean
}

export default function CampaignList({ campaigns, onSync, syncing }: Props) {
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length
  const autoPilotCount = campaigns.filter(c => c.aiAutoPilot).length

  if (campaigns.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-gray-800 p-10 text-center space-y-4">
        <p className="text-gray-400 text-sm font-medium">Nenhuma campanha encontrada</p>
        <p className="text-gray-600 text-xs">
          Conecte sua conta Meta ou crie sua primeira campanha para começar.
        </p>
        <div className="flex items-center justify-center gap-3">
          {onSync && (
            <button
              onClick={onSync}
              disabled={syncing}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar com Meta
            </button>
          )}
          <Link
            href="/dashboard/criar-campanha"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-semibold hover:bg-neon-cyan/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Campanha
          </Link>
        </div>
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
        <div className="flex items-center gap-2">
          {onSync && (
            <button
              onClick={onSync}
              disabled={syncing}
              title="Sincronizar campanhas com a Meta agora"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              Sincronizar
            </button>
          )}
          <Link
            href="/dashboard/criar-campanha"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-xs font-semibold hover:bg-neon-cyan/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            Nova Campanha
          </Link>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
            <Zap className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-xs font-medium text-neon-purple">{autoPilotCount} em Auto-Pilot</span>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {campaigns.map(c => <CampaignCard key={c.id} campaign={c} />)}
      </div>
    </div>
  )
}
