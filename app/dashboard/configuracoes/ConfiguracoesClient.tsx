'use client'

import { useState, useTransition, useEffect } from 'react'
import { signIn } from 'next-auth/react'
import { RefreshCw, Link2, AlertTriangle, CheckCircle, XCircle, Clock, Loader2, ChevronRight, Zap, Trash2, BarChart2, Building2 } from 'lucide-react'
import { listAdAccountsAction } from '@/actions/ad-accounts'
import { syncMetaCampaignsAction } from '@/actions/campaigns'
import { savePixelAction, removePixelAction } from '@/actions/pixel'
import { listBusinessesAction, selectBusinessManagerAction } from '@/actions/business'
import { useRouter } from 'next/navigation'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface MetaBusinessOption {
  id: string
  name: string
}

interface BmData {
  name: string
  metaBmId: string
  tokenExpiresAt: string | null
  adAccounts: Array<{
    id: string
    metaAccountId: string
    name: string
    currency: string
    status: number
    pixelId: string | null
    pixelName: string | null
  }>
}

interface MetaPixelOption {
  id: string
  name: string
  lastFiredTime?: string
}

interface Props {
  bm: BmData | null
  googleAdsConnected: boolean
}

function TokenStatusBadge({ expiresAt }: { expiresAt: string | null }) {
  const { dict } = useLanguage()
  const d = dict.account.configuracoesClient.tokenBadge

  if (!expiresAt) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-600/25">
        <Clock className="w-3 h-3" /> {d.noExpiry}
      </span>
    )
  }

  const expiry = new Date(expiresAt)
  const now = new Date()
  const daysLeft = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

  if (daysLeft < 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-500/15 text-red-400 border border-red-500/25">
        <XCircle className="w-3 h-3" /> {d.expired}
      </span>
    )
  }
  if (daysLeft <= 7) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-500/15 text-orange-400 border border-orange-500/25">
        <AlertTriangle className="w-3 h-3" /> {d.expiresInDays.replace('{days}', String(daysLeft))}
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
      <CheckCircle className="w-3 h-3" /> {d.validDaysLeft.replace('{days}', String(daysLeft))}
    </span>
  )
}

export default function ConfiguracoesClient({ bm, googleAdsConnected }: Props) {
  const { dict } = useLanguage()
  const d = dict.account.configuracoesClient
  const router = useRouter()
  const [syncingAccounts, startSyncAccounts] = useTransition()
  const [syncingCampaigns, startSyncCampaigns] = useTransition()
  const [syncMsg, setSyncMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Business Manager selection state
  const [businesses, setBusinesses] = useState<MetaBusinessOption[] | null>(null)
  const [loadingBusinesses, setLoadingBusinesses] = useState(false)
  const [selectingBmId, startSelectingBm] = useTransition()
  const [bmMsg, setBmMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  async function handleLoadBusinesses() {
    setLoadingBusinesses(true)
    setBmMsg(null)
    try {
      const result = await listBusinessesAction()
      if (result.success) {
        setBusinesses(result.data ?? [])
        if (!result.data?.length) setBmMsg({ type: 'error', text: d.messages.noBusinessFound })
      } else {
        setBmMsg({ type: 'error', text: result.error ?? d.messages.errorFetchingBusinesses })
      }
    } finally {
      setLoadingBusinesses(false)
    }
  }

  function handleSelectBusiness(id: string, name: string) {
    setBmMsg(null)
    startSelectingBm(async () => {
      const result = await selectBusinessManagerAction(id, name)
      if (result.success) {
        setBmMsg({ type: 'success', text: d.messages.businessConnected.replace('{name}', name) })
        setBusinesses(null)
        router.refresh()
      } else {
        setBmMsg({ type: 'error', text: result.error ?? d.messages.errorSelectingBusiness })
      }
    })
  }

  // Pixel state
  const firstAccount = bm?.adAccounts[0] ?? null
  const [pixelOptions, setPixelOptions] = useState<MetaPixelOption[]>([])
  const [loadingPixels, setLoadingPixels] = useState(false)
  const [selectedPixelId, setSelectedPixelId] = useState(firstAccount?.pixelId ?? '')
  const [pixelMsg, setPixelMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [savingPixel, startSavePixel] = useTransition()
  const [removingPixel, startRemovePixel] = useTransition()

  useEffect(() => {
    if (firstAccount?.pixelId) setSelectedPixelId(firstAccount.pixelId)
  }, [firstAccount?.pixelId])

  async function loadPixels() {
    setLoadingPixels(true)
    setPixelMsg(null)
    try {
      const params = firstAccount?.id ? `?adAccountId=${firstAccount.id}` : ''
      const res = await fetch(`/api/meta/pixels${params}`)
      const data = await res.json()
      if (data.pixels) {
        setPixelOptions(data.pixels)
        if (data.pixels.length === 0) setPixelMsg({ type: 'error', text: d.messages.noPixelsFound })
      } else {
        setPixelMsg({ type: 'error', text: data.error ?? d.messages.errorFetchingPixels })
      }
    } finally {
      setLoadingPixels(false)
    }
  }

  function handleSavePixel() {
    const pixel = pixelOptions.find(p => p.id === selectedPixelId)
    if (!selectedPixelId) { setPixelMsg({ type: 'error', text: d.messages.selectAPixel }); return }
    setPixelMsg(null)
    startSavePixel(async () => {
      const result = await savePixelAction({
        pixelId: selectedPixelId,
        pixelName: pixel?.name ?? selectedPixelId,
        adAccountId: firstAccount?.id,
      })
      if (result.success) {
        setPixelMsg({ type: 'success', text: d.messages.pixelLinked })
        router.refresh()
      } else {
        setPixelMsg({ type: 'error', text: result.error ?? d.messages.errorSavingPixel })
      }
    })
  }

  function handleRemovePixel() {
    setPixelMsg(null)
    startRemovePixel(async () => {
      const result = await removePixelAction(firstAccount?.id)
      if (result.success) {
        setSelectedPixelId('')
        setPixelOptions([])
        setPixelMsg({ type: 'success', text: d.messages.pixelRemoved })
        router.refresh()
      } else {
        setPixelMsg({ type: 'error', text: result.error ?? d.messages.errorRemovingPixel })
      }
    })
  }

  function handleSyncAccounts() {
    setSyncMsg(null)
    startSyncAccounts(async () => {
      const result = await listAdAccountsAction()
      if (result.success) {
        setSyncMsg({ type: 'success', text: d.messages.accountsSynced.replace('{count}', String(result.data?.length ?? 0)) })
        router.refresh()
      } else {
        setSyncMsg({ type: 'error', text: result.error ?? d.messages.errorSyncingAccounts })
      }
    })
  }

  function handleSyncCampaigns() {
    setSyncMsg(null)
    startSyncCampaigns(async () => {
      const result = await syncMetaCampaignsAction()
      if (result.success && result.data) {
        setSyncMsg({ type: 'success', text: d.messages.campaignsSynced.replace('{synced}', String(result.data.synced)).replace('{updated}', String(result.data.updated)) })
        router.refresh()
      } else {
        setSyncMsg({ type: 'error', text: result.error ?? d.messages.errorSyncingCampaigns })
      }
    })
  }

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
            <h3 className="text-sm font-semibold text-white">{d.metaCard.title}</h3>
            <p className="text-xs text-gray-500">{d.metaCard.subtitle}</p>
          </div>
        </div>

        {bm ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-white/3 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">{d.metaCard.businessManagerLabel}</p>
                <p className="text-sm font-medium text-gray-200 truncate">{bm.name}</p>
                <p className="text-xs text-gray-600 font-mono truncate">{bm.metaBmId}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/3 border border-gray-800">
                <p className="text-xs text-gray-500 mb-1">{d.metaCard.tokenStatusLabel}</p>
                <TokenStatusBadge expiresAt={bm.tokenExpiresAt} />
              </div>
            </div>

            {bmMsg && (
              <div className={`px-3 py-2 rounded-lg text-xs border ${
                bmMsg.type === 'error'
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-green-500/10 border-green-500/30 text-green-400'
              }`}>
                {bmMsg.text}
              </div>
            )}

            {businesses === null ? (
              <button
                onClick={handleLoadBusinesses}
                disabled={loadingBusinesses}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
              >
                {loadingBusinesses ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Building2 className="w-3.5 h-3.5" />}
                {d.metaCard.selectBusinessManager}
              </button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-500">{d.metaCard.chooseBusinessManager}</p>
                  <button
                    onClick={() => { setBusinesses(null); setBmMsg(null) }}
                    className="text-xs text-gray-600 hover:text-gray-300"
                  >
                    {d.metaCard.cancel}
                  </button>
                </div>
                <div className="divide-y divide-gray-800 rounded-lg border border-gray-800 overflow-hidden">
                  {businesses.map(b => (
                    <button
                      key={b.id}
                      onClick={() => handleSelectBusiness(b.id, b.name)}
                      disabled={selectingBmId}
                      className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left transition-all disabled:opacity-50 ${
                        b.id === bm.metaBmId ? 'bg-neon-cyan/5' : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 truncate">{b.name}</p>
                        <p className="text-xs text-gray-600 font-mono">{b.id}</p>
                      </div>
                      {b.id === bm.metaBmId ? (
                        <CheckCircle className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                      ) : selectingBmId ? (
                        <Loader2 className="w-4 h-4 text-gray-500 animate-spin flex-shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {bm.tokenExpiresAt && new Date(bm.tokenExpiresAt) <= new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) && (
              <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-orange-400 flex-shrink-0" />
                  <p className="text-xs text-orange-300">{d.metaCard.tokenExpiringWarning}</p>
                </div>
                <button
                  onClick={() => signIn('facebook')}
                  className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-semibold bg-orange-500/20 border border-orange-500/40 text-orange-300 hover:bg-orange-500/30 transition-all"
                >
                  {d.metaCard.reconnect}
                </button>
              </div>
            )}
            <button
              onClick={() => signIn('facebook')}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              <Link2 className="w-3.5 h-3.5" />
              {d.metaCard.reconnectMetaAccount}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/25 flex items-start gap-3">
              <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-300">
                {d.metaCard.noAccountConnected}
              </p>
            </div>
            <button
              onClick={() => signIn('facebook')}
              className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all"
            >
              <Link2 className="w-4 h-4" />
              {d.metaCard.connectMetaAccount}
            </button>
          </div>
        )}
      </div>

      {/* Google Ads Connection */}
      <div className="glass-card rounded-xl p-5 border border-gray-800">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-green-500/15 border border-green-500/25 flex items-center justify-center">
            <BarChart2 className="w-4 h-4 text-green-400" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{d.googleAdsCard.title}</h3>
            <p className="text-xs text-gray-500">{d.googleAdsCard.subtitle}</p>
          </div>
        </div>

        {googleAdsConnected ? (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-green-500/8 border border-green-500/20 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <p className="text-sm font-medium text-green-400">{d.googleAdsCard.connected}</p>
              </div>
              <span className="text-xs text-gray-500">{d.googleAdsCard.tokenSaved}</span>
            </div>
            <a
              href="/api/auth/google-ads"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              <Link2 className="w-3.5 h-3.5" />
              {d.googleAdsCard.reconnect}
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-blue-500/8 border border-blue-500/20">
              <p className="text-xs text-gray-400 leading-relaxed">
                {d.googleAdsCard.description}
              </p>
            </div>
            <a
              href="/api/auth/google-ads"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition-all"
            >
              <BarChart2 className="w-4 h-4" />
              {d.googleAdsCard.connect}
            </a>
            <a
              href="/docs/integracao-google-ads.md"
              className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-neon-cyan transition-colors"
            >
              <ChevronRight className="w-3 h-3" />
              {d.googleAdsCard.configGuide}
            </a>
          </div>
        )}
      </div>

      {/* Ad Accounts */}
      {bm && (
        <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
            <div>
              <h3 className="text-sm font-semibold text-white">{d.adAccountsCard.title}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{d.adAccountsCard.syncedCount.replace('{count}', String(bm.adAccounts.length))}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSyncAccounts}
                disabled={syncingAccounts}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncingAccounts ? 'animate-spin' : ''}`} />
                {d.adAccountsCard.syncAccounts}
              </button>
              <button
                onClick={handleSyncCampaigns}
                disabled={syncingCampaigns}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
              >
                {syncingCampaigns ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                {d.adAccountsCard.syncCampaigns}
              </button>
            </div>
          </div>
          {bm.adAccounts.length === 0 ? (
            <div className="p-6 text-center">
              <p className="text-sm text-gray-500">{d.adAccountsCard.noAccountsFound}</p>
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
                    {acc.status === 1 ? d.adAccountsCard.active : d.adAccountsCard.inactive}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Pixel Meta + CAPI */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Pixel Meta */}
        <div className="glass-card rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-neon-purple/15 border border-neon-purple/25 flex items-center justify-center">
              <Zap className="w-3.5 h-3.5 text-neon-purple" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{d.pixelCard.title}</h3>
              <p className="text-xs text-gray-500">{d.pixelCard.subtitle}</p>
            </div>
          </div>

          {pixelMsg && (
            <div className={`mb-3 px-3 py-2 rounded-lg text-xs border ${
              pixelMsg.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-green-500/10 border-green-500/30 text-green-400'
            }`}>
              {pixelMsg.text}
            </div>
          )}

          {firstAccount?.pixelId ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-green-500/8 border border-green-500/20 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">{d.pixelCard.pixelLinked}</p>
                  <p className="text-sm font-semibold text-green-400">{firstAccount.pixelName ?? firstAccount.pixelId}</p>
                  <p className="text-xs text-gray-600 font-mono">{firstAccount.pixelId}</p>
                </div>
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
              </div>
              <button
                onClick={handleRemovePixel}
                disabled={removingPixel}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/20 text-xs text-red-400 hover:bg-red-500/10 transition-all disabled:opacity-50"
              >
                {removingPixel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                {d.pixelCard.unlinkPixel}
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-gray-500">
                {d.pixelCard.linkPixelDesc}
              </p>
              {pixelOptions.length === 0 ? (
                <button
                  onClick={loadPixels}
                  disabled={loadingPixels || !bm}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
                >
                  {loadingPixels ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {d.pixelCard.fetchPixels}
                </button>
              ) : (
                <div className="space-y-2">
                  <select
                    value={selectedPixelId}
                    onChange={e => setSelectedPixelId(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:border-neon-cyan focus:outline-none"
                  >
                    <option value="">{d.pixelCard.selectPixelOption}</option>
                    {pixelOptions.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.id})
                      </option>
                    ))}
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePixel}
                      disabled={savingPixel || !selectedPixelId}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-neon-purple/10 border border-neon-purple/30 text-neon-purple text-xs font-semibold hover:bg-neon-purple/20 transition-all disabled:opacity-50"
                    >
                      {savingPixel ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                      {d.pixelCard.linkPixel}
                    </button>
                    <button
                      onClick={loadPixels}
                      disabled={loadingPixels}
                      className="px-2.5 py-2 rounded-lg border border-gray-700 text-gray-500 hover:text-gray-300 transition-all disabled:opacity-50"
                      title={d.pixelCard.reloadList}
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${loadingPixels ? 'animate-spin' : ''}`} />
                    </button>
                  </div>
                </div>
              )}
              <a
                href="https://business.facebook.com/events_manager"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-neon-cyan transition-colors"
              >
                <ChevronRight className="w-3 h-3" />
                {d.pixelCard.createPixelLink}
              </a>
            </div>
          )}
        </div>

        {/* CAPI */}
        <div className="glass-card rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-neon-cyan/15 border border-neon-cyan/25 flex items-center justify-center">
              <span className="text-neon-cyan text-xs font-bold">C</span>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">{d.capiCard.title}</h3>
              <p className="text-xs text-gray-500">{d.capiCard.subtitle}</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-lg bg-white/3 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1">{d.capiCard.pixelIdLabel}</p>
              <p className="text-sm font-mono text-gray-200">{process.env.NEXT_PUBLIC_META_PIXEL_ID ?? d.capiCard.pixelIdMissing}</p>
            </div>
            <div className="p-3 rounded-lg bg-white/3 border border-gray-800">
              <p className="text-xs text-gray-500 mb-1.5">{d.capiCard.supportedEvents}</p>
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
              {d.capiCard.viewHealthCheck}
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
              <h3 className="text-sm font-semibold text-white">{d.aiSettingsCard.title}</h3>
              <p className="text-xs text-gray-500">{d.aiSettingsCard.subtitle}</p>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: d.aiSettingsCard.minRoasToPause, value: '2.0x', color: 'text-red-400' },
              { label: d.aiSettingsCard.roasToScale, value: '4.0x', color: 'text-green-400' },
              { label: d.aiSettingsCard.maxAlertFrequency, value: '3.5', color: 'text-orange-400' },
              { label: d.aiSettingsCard.maxBudgetIncrease, value: '25%', color: 'text-neon-cyan' },
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
