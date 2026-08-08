'use client'

import { useState, useEffect } from 'react'
import { Users, Loader2, RefreshCw, Monitor, Smartphone } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface DemoRow {
  age?: string
  gender?: string
  publisherPlatform?: string
  impressionDevice?: string
  impressions: number
  clicks: number
  spend: number
  ctr: number
  cpm: number
}

interface Props {
  campaignId: string
  campaignName: string
  days?: number
}

function BarRow({ label, value, max, secondary }: {
  label: string; value: number; max: number; secondary?: string
}) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-300 font-medium">{label}</span>
        <div className="flex items-center gap-2 text-gray-500">
          {secondary && <span>{secondary}</span>}
          <span className="font-mono text-neon-cyan">{pct}%</span>
        </div>
      </div>
      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full bg-neon-cyan/60 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export default function AudienceInsights({ campaignId, campaignName, days = 30 }: Props) {
  const { dict } = useLanguage()
  const t = dict.campaigns.audienceInsights
  const GENDER_LABEL = t.genderLabel
  const PLATFORM_LABEL = t.platformLabel
  const DEVICE_LABEL = t.deviceLabel
  const [tab, setTab] = useState<'demo' | 'platform'>('demo')
  const [demographics, setDemographics] = useState<DemoRow[]>([])
  const [platforms, setPlatforms] = useState<DemoRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loaded, setLoaded] = useState(false)

  async function fetchInsights() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/meta/audience-insights?campaignId=${campaignId}&days=${days}`)
      const data = await res.json()
      if (!res.ok || data.error) {
        const msg: string = data.error ?? ''
        if (res.status === 401 || res.status === 403 || /token|auth|oauth|permission/i.test(msg)) {
          setError(t.tokenInvalido)
        } else {
          setError(msg || t.erroBuscarInsights)
        }
      } else {
        setDemographics(data.demographics ?? [])
        setPlatforms(data.platforms ?? [])
        setLoaded(true)
      }
    } catch {
      setError(t.erroConexao)
    } finally {
      setLoading(false)
    }
  }

  // Aggregate demographics: group by age, sum impressions per gender
  const byAge = demographics.reduce<Record<string, { male: number; female: number; total: number }>>((acc, r) => {
    const age = r.age ?? t.faixaEtariaDesconhecida
    if (!acc[age]) acc[age] = { male: 0, female: 0, total: 0 }
    if (r.gender === 'male') acc[age].male += r.impressions
    else if (r.gender === 'female') acc[age].female += r.impressions
    acc[age].total += r.impressions
    return acc
  }, {})

  const ageEntries = Object.entries(byAge).sort((a, b) => a[0].localeCompare(b[0]))
  const maxAge = Math.max(...ageEntries.map(([, v]) => v.total), 1)

  // Aggregate by gender
  const byGender = demographics.reduce<Record<string, number>>((acc, r) => {
    const g = r.gender ?? 'unknown'
    acc[g] = (acc[g] ?? 0) + r.impressions
    return acc
  }, {})
  const totalGender = Object.values(byGender).reduce((s, v) => s + v, 0)

  // Aggregate by platform
  const byPlatform = platforms.reduce<Record<string, number>>((acc, r) => {
    const p = r.publisherPlatform ?? 'unknown'
    acc[p] = (acc[p] ?? 0) + r.impressions
    return acc
  }, {})
  const maxPlatform = Math.max(...Object.values(byPlatform), 1)

  // Aggregate by device
  const byDevice = platforms.reduce<Record<string, number>>((acc, r) => {
    const d = r.impressionDevice ?? 'unknown'
    acc[d] = (acc[d] ?? 0) + r.impressions
    return acc
  }, {})
  const maxDevice = Math.max(...Object.values(byDevice), 1)

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-neon-cyan" />
          <div>
            <h3 className="text-sm font-semibold text-white">{t.titulo}</h3>
            <p className="text-xs text-gray-500 truncate max-w-[220px]">{campaignName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {loaded && (
            <div className="flex rounded-lg border border-gray-700 overflow-hidden text-xs">
              <button
                onClick={() => setTab('demo')}
                className={`px-3 py-1.5 transition-colors ${tab === 'demo' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {t.demografico}
              </button>
              <button
                onClick={() => setTab('platform')}
                className={`px-3 py-1.5 transition-colors ${tab === 'platform' ? 'bg-neon-cyan/15 text-neon-cyan' : 'text-gray-400 hover:text-gray-200'}`}
              >
                {t.plataforma}
              </button>
            </div>
          )}
          <button
            onClick={fetchInsights}
            disabled={loading}
            title={t.tooltipCarregar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            {loaded ? t.atualizar : t.carregarInsights}
          </button>
        </div>
      </div>

      <div className="p-5">
        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">
            {error}
          </div>
        )}

        {!loaded && !loading && !error && (
          <p className="text-xs text-gray-500 text-center py-6">
            {t.clickCarregar(days)}
          </p>
        )}

        {loading && (
          <div className="flex items-center justify-center py-8 gap-2 text-gray-500 text-xs">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.buscandoDadosMeta}
          </div>
        )}

        {loaded && !loading && tab === 'demo' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Faixa etária */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t.faixaEtariaImpressoes}</p>
              {ageEntries.length === 0 ? (
                <p className="text-xs text-gray-600">{t.semDados}</p>
              ) : (
                <div className="space-y-2.5">
                  {ageEntries.map(([age, v]) => (
                    <BarRow
                      key={age}
                      label={age}
                      value={v.total}
                      max={maxAge}
                      secondary={`${v.total.toLocaleString('pt-BR')}`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Gênero */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide">{t.generoImpressoes}</p>
              {Object.keys(byGender).length === 0 ? (
                <p className="text-xs text-gray-600">{t.semDados}</p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(byGender).sort((a, b) => b[1] - a[1]).map(([gender, imp]) => (
                    <BarRow
                      key={gender}
                      label={GENDER_LABEL[gender] ?? gender}
                      value={imp}
                      max={totalGender}
                      secondary={`${imp.toLocaleString('pt-BR')}`}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {loaded && !loading && tab === 'platform' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Plataforma */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                <Monitor className="w-3 h-3" /> {t.plataformaImpressoes}
              </p>
              {Object.keys(byPlatform).length === 0 ? (
                <p className="text-xs text-gray-600">{t.semDados}</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(byPlatform).sort((a, b) => b[1] - a[1]).map(([p, imp]) => (
                    <BarRow
                      key={p}
                      label={PLATFORM_LABEL[p] ?? p}
                      value={imp}
                      max={maxPlatform}
                      secondary={imp.toLocaleString('pt-BR')}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Dispositivo */}
            <div>
              <p className="text-xs font-semibold text-gray-400 mb-3 uppercase tracking-wide flex items-center gap-1.5">
                <Smartphone className="w-3 h-3" /> {t.dispositivoImpressoes}
              </p>
              {Object.keys(byDevice).length === 0 ? (
                <p className="text-xs text-gray-600">{t.semDados}</p>
              ) : (
                <div className="space-y-2.5">
                  {Object.entries(byDevice).sort((a, b) => b[1] - a[1]).map(([d, imp]) => (
                    <BarRow
                      key={d}
                      label={DEVICE_LABEL[d] ?? d}
                      value={imp}
                      max={maxDevice}
                      secondary={imp.toLocaleString('pt-BR')}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
