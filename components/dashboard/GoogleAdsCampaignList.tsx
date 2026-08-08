'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { TrendingUp, TrendingDown, RefreshCw, Loader2, Monitor, Search, ShoppingBag, Play, Video } from 'lucide-react'
import { syncGoogleAdsAction } from '@/actions/sync-google-ads'
import { useToast } from '@/lib/toast'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Dictionary } from '@/lib/i18n/language'

const CHANNEL_ICON: Record<string, React.ReactNode> = {
  SEARCH: <Search className="w-3 h-3" />,
  DISPLAY: <Monitor className="w-3 h-3" />,
  SHOPPING: <ShoppingBag className="w-3 h-3" />,
  VIDEO: <Video className="w-3 h-3" />,
  PERFORMANCE_MAX: <Play className="w-3 h-3" />,
}

interface Campaign {
  id: string
  googleCampaignId: string
  name: string
  status: string
  channelType: string
  dailyBudget: number
  spend: number
  impressions: number
  clicks: number
  conversions: number
  roas: number
  ctr: number
  metricsUpdatedAt: Date | null
  accountName: string
}

function StatusDot({ status }: { status: string }) {
  if (status === 'ENABLED') return <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block" />
  if (status === 'PAUSED') return <span className="w-1.5 h-1.5 rounded-full bg-gray-500 inline-block" />
  return <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
  const isGood = campaign.roas >= 2
  return (
    <div className="flex flex-wrap items-center gap-3 px-5 py-3 border-b border-gray-800/50 last:border-0 hover:bg-white/2 transition-colors">
      <StatusDot status={campaign.status} />

      <div className="flex-1 min-w-[180px]">
        <p className="text-sm font-medium text-gray-200 truncate">{campaign.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-800 text-gray-400 border border-gray-700">
            {CHANNEL_ICON[campaign.channelType] ?? <Play className="w-3 h-3" />}
            {CHANNEL_LABEL[campaign.channelType] ?? campaign.channelType}
          </span>
          <span className="text-[10px] text-gray-600 truncate">{campaign.accountName}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-right">
        <div>
          <p className="text-[10px] text-gray-500">Orçamento/dia</p>
          <p className="text-xs font-semibold font-mono text-gray-300">R$ {campaign.dailyBudget.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Gasto</p>
          <p className="text-xs font-semibold font-mono text-gray-300">R$ {campaign.spend.toFixed(0)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">ROAS</p>
          <div className="flex items-center gap-1 justify-end">
            {isGood
              ? <TrendingUp className="w-3 h-3 text-green-400" />
              : <TrendingDown className="w-3 h-3 text-red-400" />
            }
            <p className={`text-xs font-bold font-mono ${isGood ? 'text-green-400' : 'text-red-400'}`}>
              {campaign.roas.toFixed(1)}x
            </p>
          </div>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">CTR</p>
          <p className="text-xs font-semibold font-mono text-gray-300">{campaign.ctr.toFixed(2)}%</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-500">Conv.</p>
          <p className="text-xs font-semibold font-mono text-gray-300">{campaign.conversions.toFixed(0)}</p>
        </div>
      </div>
    </div>
  )
}

interface Props {
  campaigns: Campaign[]
}

export default function GoogleAdsCampaignList({ campaigns }: Props) {
  const { toast } = useToast()
  const router = useRouter()
  const [syncing, startSync] = useTransition()
  const [syncMsg, setSyncMsg] = useState<string | null>(null)

  function handleSync() {
    setSyncMsg(null)
    startSync(async () => {
      const result = await syncGoogleAdsAction()
      if (result.success && result.data) {
        setSyncMsg(`Sincronizado: ${result.data.accounts} conta(s), ${result.data.campaigns} campanhas`)
        toast({ type: 'success', title: 'Google Ads sincronizado', description: `${result.data.campaigns} campanhas atualizadas` })
        router.refresh()
      } else {
        setSyncMsg(result.error ?? 'Erro ao sincronizar')
        toast({ type: 'error', title: 'Erro ao sincronizar Google Ads', description: result.error })
      }
    })
  }

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-white">Campanhas Google Ads</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {campaigns.filter(c => c.status === 'ENABLED').length} ativas &bull; {campaigns.length} total
          </p>
        </div>
        <button
          onClick={handleSync}
          disabled={syncing}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
        >
          {syncing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
          Sincronizar
        </button>
      </div>

      {syncMsg && (
        <div className={`mx-5 mt-3 px-3 py-2 rounded-lg text-xs border ${
          syncMsg.startsWith('Erro') || syncMsg.startsWith('invalid') || syncMsg.startsWith('Google')
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          {syncMsg}
        </div>
      )}

      {campaigns.length === 0 ? (
        <div className="p-8 text-center space-y-2">
          <p className="text-sm text-gray-500">Nenhuma campanha encontrada.</p>
          <p className="text-xs text-gray-600">Clique em "Sincronizar" para buscar campanhas do Google Ads.</p>
        </div>
      ) : (
        <div>
          {campaigns.map(c => <CampaignRow key={c.id} campaign={c} />)}
        </div>
      )}
    </div>
  )
}
