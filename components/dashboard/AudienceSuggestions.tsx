'use client'

import { useState } from 'react'
import { Users, Loader2, Sparkles, ChevronRight, RefreshCw } from 'lucide-react'
import type { AudienceSuggestion } from '@/app/api/ai/audience-suggestions/route'

const PLACEMENT_LABEL: Record<string, string> = {
  facebook_feed: 'Facebook Feed',
  instagram_feed: 'Instagram Feed',
  instagram_reels: 'Instagram Reels',
  instagram_stories: 'Instagram Stories',
  facebook_stories: 'Facebook Stories',
  audience_network: 'Audience Network',
  messenger_inbox: 'Messenger',
}

const GENDER_LABEL: Record<string, string> = {
  all: 'Todos os gêneros',
  male: 'Masculino',
  female: 'Feminino',
}

export default function AudienceSuggestions() {
  const [productDescription, setProductDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AudienceSuggestion | null>(null)

  async function generate() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/audience-suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productDescription }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data.suggestion)
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
          <Users className="w-4 h-4 text-neon-cyan" />
          <h3 className="text-sm font-semibold text-white">Sugestão de Público via IA</h3>
        </div>
        <p className="text-xs text-gray-500">
          Analisa suas campanhas e sugere interesses, faixa etária, posicionamentos e públicos semente para LAL
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Optional product description */}
        <div>
          <label className="block text-xs text-gray-400 mb-1.5 font-medium">
            Descrição do produto/serviço <span className="text-gray-600">(opcional — melhora a precisão)</span>
          </label>
          <textarea
            value={productDescription}
            onChange={e => setProductDescription(e.target.value)}
            placeholder="Ex: Curso online de marketing digital para empreendedores iniciantes, foco em Instagram e Meta Ads, R$497"
            rows={2}
            disabled={loading}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-neon-cyan focus:outline-none transition-colors resize-none disabled:opacity-50"
          />
        </div>

        <button
          onClick={generate}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-cyan/15 border border-neon-cyan/30 text-neon-cyan text-xs font-semibold hover:bg-neon-cyan/25 transition-all disabled:opacity-40"
        >
          {loading
            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Analisando campanhas…</>
            : <><Sparkles className="w-3.5 h-3.5" /> {result ? 'Regenerar sugestões' : 'Gerar sugestões de público'}</>
          }
        </button>

        {error && (
          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">{error}</div>
        )}

        {result && !loading && (
          <div className="space-y-5">
            {/* Reasoning */}
            <div className="p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/15">
              <p className="text-xs text-gray-300 leading-relaxed">
                <span className="text-neon-cyan font-semibold">Análise da IA: </span>
                {result.reasoning}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Interests */}
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Interesses sugeridos ({result.interests?.length ?? 0})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {(result.interests ?? []).map(interest => (
                    <span
                      key={interest}
                      className="px-2 py-1 rounded-full text-[11px] bg-neon-purple/10 border border-neon-purple/20 text-neon-purple"
                    >
                      {interest}
                    </span>
                  ))}
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Demográfico</p>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Faixa etária</span>
                      <span className="text-white font-semibold font-mono">
                        {result.ageRange?.min ?? 18}–{result.ageRange?.max ?? 65} anos
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">Gênero</span>
                      <span className="text-white font-semibold">
                        {GENDER_LABEL[result.gender ?? 'all']}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Placements */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Posicionamentos</p>
                  <div className="flex flex-wrap gap-1.5">
                    {(result.placements ?? []).map(p => (
                      <span key={p} className="px-2 py-1 rounded-full text-[11px] bg-green-500/10 border border-green-500/20 text-green-400">
                        {PLACEMENT_LABEL[p] ?? p}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Lookalikes */}
            {result.lookalikes?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
                  Públicos semente para LAL (Lookalike)
                </p>
                <div className="space-y-2">
                  {result.lookalikes.map((lal, i) => (
                    <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50">
                      <ChevronRight className="w-3.5 h-3.5 text-neon-cyan flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-white">{lal.source}</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">{lal.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={generate}
              disabled={loading}
              className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-400 transition-colors"
            >
              <RefreshCw className="w-3 h-3" /> Regenerar com dados atualizados
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
