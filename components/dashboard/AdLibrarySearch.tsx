'use client'

import { useState } from 'react'
import { Search, Loader2, ExternalLink, Facebook, Instagram, Monitor } from 'lucide-react'
import type { AdLibraryAd } from '@/lib/meta-api'

const PLATFORM_ICON: Record<string, React.ReactNode> = {
  facebook: <Facebook className="w-3 h-3" />,
  instagram: <Instagram className="w-3 h-3" />,
  messenger: <Monitor className="w-3 h-3" />,
}

function AdCard({ ad }: { ad: AdLibraryAd }) {
  const startDate = ad.deliveryStartTime
    ? new Date(ad.deliveryStartTime).toLocaleDateString('pt-BR')
    : null

  const impressionRange = (ad.impressionsLower != null && ad.impressionsUpper != null)
    ? `${ad.impressionsLower.toLocaleString('pt-BR')} – ${ad.impressionsUpper.toLocaleString('pt-BR')}`
    : null

  const spendRange = (ad.spendLower != null && ad.spendUpper != null)
    ? `${ad.currency ?? ''} ${ad.spendLower.toLocaleString('pt-BR')} – ${ad.spendUpper.toLocaleString('pt-BR')}`
    : null

  return (
    <div className="glass-card rounded-xl border border-gray-800 p-4 flex flex-col gap-3 hover:border-gray-700 transition-colors">
      {/* Header: page + platforms */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-white truncate">{ad.pageName}</p>
          {startDate && (
            <p className="text-[10px] text-gray-600 mt-0.5">Ativo desde {startDate}</p>
          )}
        </div>
        <div className="flex items-center gap-1 text-gray-500 flex-shrink-0">
          {ad.platforms.map(p => (
            <span key={p} title={p}>{PLATFORM_ICON[p] ?? null}</span>
          ))}
        </div>
      </div>

      {/* Ad title */}
      {ad.title && (
        <p className="text-xs font-semibold text-neon-cyan leading-snug line-clamp-2">{ad.title}</p>
      )}

      {/* Ad body */}
      {ad.body && (
        <p className="text-xs text-gray-400 leading-relaxed line-clamp-4">{ad.body}</p>
      )}

      {/* Description */}
      {ad.description && (
        <p className="text-[10px] text-gray-600 line-clamp-2">{ad.description}</p>
      )}

      {/* Stats + link */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-gray-800">
        <div className="flex flex-col gap-0.5">
          {impressionRange && (
            <span className="text-[10px] text-gray-500">
              <span className="text-gray-400 font-medium">Impressões:</span> {impressionRange}
            </span>
          )}
          {spendRange && (
            <span className="text-[10px] text-gray-500">
              <span className="text-gray-400 font-medium">Gasto:</span> {spendRange}
            </span>
          )}
        </div>
        {ad.snapshotUrl && (
          <a
            href={ad.snapshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[10px] text-neon-purple hover:text-neon-purple/80 transition-colors flex-shrink-0"
          >
            Ver anúncio <ExternalLink className="w-2.5 h-2.5" />
          </a>
        )}
      </div>
    </div>
  )
}

export default function AdLibrarySearch() {
  const [query, setQuery] = useState('')
  const [ads, setAds] = useState<AdLibraryAd[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  async function search() {
    const q = query.trim()
    if (!q || loading) return
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const res = await fetch(`/api/meta/ad-library?q=${encodeURIComponent(q)}`)
      const data = await res.json()
      if (data.error) {
        setError(data.error)
        setAds([])
      } else {
        setAds(data.ads ?? [])
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2 mb-1">
          <Search className="w-4 h-4 text-neon-purple" />
          <h3 className="text-sm font-semibold text-white">Meta Ad Library</h3>
        </div>
        <p className="text-xs text-gray-500">
          Veja os anúncios ativos dos seus concorrentes no Brasil
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Search input */}
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') search() }}
            placeholder="Ex: Hotmart, Kiwify, nome da marca…"
            disabled={loading}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-colors disabled:opacity-50"
          />
          <button
            onClick={search}
            disabled={!query.trim() || loading}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-neon-purple/20 border border-neon-purple/30 text-neon-purple text-xs font-medium hover:bg-neon-purple/30 transition-all disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
            Buscar
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            Buscando na Meta Ad Library…
          </div>
        )}

        {/* Empty state */}
        {!loading && searched && !error && ads.length === 0 && (
          <p className="text-xs text-gray-500 text-center py-6">
            Nenhum anúncio ativo encontrado no Brasil para este termo.
          </p>
        )}

        {/* Initial state */}
        {!searched && !loading && (
          <p className="text-xs text-gray-500 text-center py-4">
            Pesquise pelo nome de uma marca ou concorrente para ver os anúncios que estão rodando agora.
          </p>
        )}

        {/* Results grid */}
        {!loading && ads.length > 0 && (
          <>
            <p className="text-xs text-gray-500">{ads.length} anúncio{ads.length !== 1 ? 's' : ''} encontrado{ads.length !== 1 ? 's' : ''}</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ads.map(ad => (
                <AdCard key={ad.id} ad={ad} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
