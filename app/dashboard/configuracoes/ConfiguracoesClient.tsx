'use client'

import { useState, useTransition } from 'react'
import { signIn } from 'next-auth/react'
import { RefreshCw, Link2, AlertTriangle, CheckCircle, XCircle, Clock, Loader2, ChevronRight } from 'lucide-react'
import { listAdAccountsAction } from '@/actions/ad-accounts'
import { syncMetaCampaignsAction } from '@/actions/campaigns'
import { useRouter } from 'next/navigation'

interface BmData {
  name: string
  tokenExpiresAt: string | null
  adAccounts: Array<{ metaAccountId: string; name: string; currency: string; status: number }>
}

interface Props {
  bm: BmData | null
}

function TokenStatusBadge({ expiresAt }: { expiresAt: string | null }) {
  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-600/25">
        <Clock className="w-3 h-3" /> Sem data de expiração
      </span>
    )
  }

  const expiry = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
        <XCircle className="w-3 h-3" /> Token expirado
      </span>
    )
  }
  if (daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25">
        <AlertTriangle className="w-3 h-3" /> Expira em {daysLeft}d
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
      <CheckCircle className="w-3 h-3" /> Válido · {daysLeft}d restantes
    </span>
  )
}

export default function ConfiguracoesClient({ bm }: Props) {
  const router = useRouter()
  const [syncingAccounts, startSyncAccounts] = useTransition()
  const [syncingCampaigns, startSyncCampaigns] = useTransition()
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  function handleSyncAccounts() {
    setSyncMsg(null)
    startSyncAccounts(async () => {
      const result = await listAdAccountsAction()
      if (result.success) {
        setSyncMsg({ type: 'success', text: `${result.data?.length ?? 0} conta(s) de anúncio sincronizada(s)` })
        router.refresh()
      } else {
        setSyncMsg({ type: 'error', text: result.error ?? 'Erro ao sincronizar contas' })
      }
    })
  }

  function handleSyncCampaigns() {
    setSyncMsg(null)
    startSyncCampaigns(async () => {
      const result = await syncMetaCampaignsAction()
      if (result.success && result.data) {
        setSyncMsg({ type: 'success', text: `${result.data.synced} campanhas sincronizadas, ${result.data.updated} atualizadas` })
        router.refresh()
      } else {
        setSyncMsg({ type: 'error', text: result.error ?? 'Erro ao sincronizar campanhas' })
      }
    })
  }

  const pixelId = process.env.NEXT_PUBLIC_META_PIXEL_ID ?? '—'

  return (
    <div className="space-y-6">
      {syncMsg && (
        <div className={`px-4 py-2.5 rounded-lg text-xs font-medium border ${
          syncMsg.type === 'error'
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          {syncMsg.text}
        </div>
      )}

      {/* Meta Connection Card */}
      <div className="glass-card rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/25 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Conta Meta</h3>
            <p className="text-xs text-gray-500">Business Manager e token de acesso</p>
          </div>
        </div>

        {bm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/3 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Business Manager</p>
                <p className="text-sm font-medium text-gray-200 truncate">{bm.name}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/3 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">Status do Token</p>
                <TokenStatusBadge expiresAt={bm.tokenExpiresAt} />
              </div>
            </div>
            {bm.tokenExpiresAt && new Date(bm.tokenExpiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-xs text-orange-300">Token próximo do vencimento. Reconecte para gerar um novo token de 60 dias.</p>
                </div>
                <button
                  onClick={() => signIn('facebook')}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 transition-all"
                >
                  Reconectar
                </button>
              </div>
            )}
            <button
              onClick={() => signIn('facebook')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              <Link2 className="w-3.5 h-3.5" />
              Reconectar conta Meta
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/25 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">
                Nenhuma conta Meta conectada. Conecte sua conta para gerenciar campanhas e acessar dados de performance.
              </p>
            </div>
            <button
              onClick={() => signIn('facebook')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
            >
              <Link2 className="w-4 h-4" />
              Conectar conta Meta
            </button>
          </div>
        )}
      </div>

      {/* Ad Accounts */}
      {bm && (
        <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-white">Contas de Anúncio</h3>
              <p className="text-xs text-gray-500 mt-0.5">{bm.adAccounts.length} conta(s) sincronizada(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncAccounts}
                disabled={syncingAccounts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingAccounts ? 'animate-spin' : ''}`} />
                Sincronizar contas
              </button>
              <button
                onClick={handleSyncCampaigns}
                disabled={syncingCampaigns}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
              >
                {syncingCampaigns ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sincronizar campanhas
              </button>
            </div>
          </div>
          {bm.adAccounts.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">Nenhuma conta encontrada. Clique em "Sincronizar contas" para buscar da Meta.</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {bm.adAccounts.map(acc => (
                <div key={acc.metaAccountId} className="flex items-center gap-3 px-5 py-3">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${acc.status === 1 ? 'bg-green-400' : 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200 truncate">{acc.name}</p>
                    <p className="text-xs text-gray-500 font-mono">act_{acc.metaAccountId.replace(/^act_/, '')}</p>
                  </div>
                  <span className="text-xs text-gray-500 flex-shrink-0">{acc.currency}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full border flex-shrink-0 ${
                    acc.status === 1
                      ? 'bg-green-500/10 border-green-500/20 text-green-400'
                      : 'bg-gray-500/10 border-gray-600/20 text-gray-500'
                  }`}>
                    {acc.status === 1 ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CAPI & Pixel */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="glass-card rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-neon-cyan/15 border border-neon-cyan/25 flex items-center justify-center">
              <span className="text-neon-cyan text-xs font-bold">C</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Conversions API (CAPI)</h3>
              <p className="text-xs text-gray-500">Endpoint: /api/capi/event</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/3 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">Pixel ID</p>
              <p className="text-sm font-mono text-gray-200">{process.env.NEXT_PUBLIC_META_PIXEL_ID ?? 'Configure META_PIXEL_ID no .env'}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/3 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1.5">Eventos suportados</p>
              <div className="flex flex-wrap gap-1.5">
                {['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'].map(evt => (
                  <span key={evt} className="px-2 py-0.5 rounded bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-mono">
                    {evt}
                  </span>
                ))}
              </div>
            </div>
            <a
              href="/api/capi/event"
              target="_blank"
              className="flex items-center gap-2 text-xs text-gray-500 hover:text-neon-cyan transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
              Ver health check do endpoint CAPI
            </a>
          </div>
        </div>

        {/* AI Settings */}
        <div className="glass-card rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-neon-purple/15 border border-neon-purple/25 flex items-center justify-center">
              <span className="text-neon-purple text-xs font-bold">IA</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Parâmetros do Auto-Pilot</h3>
              <p className="text-xs text-gray-500">Thresholds usados pela IA</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'ROAS mínimo para pausar', value: '2.0x', color: 'text-red-400' },
              { label: 'ROAS para escalar (+25%)', value: '4.0x', color: 'text-green-400' },
              { label: 'Frequência máxima de alerta', value: '3.5', color: 'text-orange-400' },
              { label: 'Aumento máx. de budget/ação', value: '25%', color: 'text-neon-cyan' },
            ].map(s => (
              <div key={s.label} className="flex items-center justify-between p-2.5 rounded-lg bg-white/3 border border-gray-800">
                <p className="text-xs text-gray-400">{s.label}</p>
                <p className={`text-sm font-bold font-mono ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
