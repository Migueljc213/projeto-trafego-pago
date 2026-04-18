'use client'

import { useState } from 'react'
import { Wand2, Loader2, Copy, Check, ChevronDown, AlertTriangle } from 'lucide-react'
import type { RewriteAdResult, AdVariant } from '@/app/api/ai/rewrite-ad/route'

const ANGLE_COLOR: Record<string, string> = {
  'Urgência': 'text-red-400 border-red-400/25 bg-red-500/5',
  'Prova Social': 'text-blue-400 border-blue-400/25 bg-blue-500/5',
  'Benefício Direto': 'text-green-400 border-green-400/25 bg-green-500/5',
  'Escassez': 'text-orange-400 border-orange-400/25 bg-orange-500/5',
  'Curiosidade': 'text-neon-purple border-neon-purple/25 bg-neon-purple/5',
  'Dor e Solução': 'text-yellow-400 border-yellow-400/25 bg-yellow-500/5',
}

function VariantCard({ variant }: { variant: AdVariant }) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const angleClass = ANGLE_COLOR[variant.angle] ?? 'text-neon-cyan border-neon-cyan/25 bg-neon-cyan/5'

  function copy(text: string, field: string) {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedField(field)
      setTimeout(() => setCopiedField(null), 1800)
    })
  }

  return (
    <div className="rounded-xl border border-gray-700 bg-gray-900/50 overflow-hidden">
      {/* Angle badge */}
      <div className="px-4 py-2.5 border-b border-gray-700/50 flex items-center justify-between">
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${angleClass}`}>
          {variant.angle}
        </span>
        <span className="text-[10px] text-gray-600 font-mono">CTA: {variant.ctaLabel}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Headline */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Título</span>
            <button
              onClick={() => copy(variant.headline, 'headline')}
              className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-300 transition-colors"
            >
              {copiedField === 'headline'
                ? <><Check className="w-3 h-3 text-green-400" /> Copiado</>
                : <><Copy className="w-3 h-3" /> Copiar</>
              }
            </button>
          </div>
          <p className="text-sm font-semibold text-white leading-snug">{variant.headline}</p>
          <p className="text-[10px] text-gray-600 mt-0.5">{variant.headline.length}/40 chars</p>
        </div>

        {/* Primary text */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] text-gray-500 uppercase font-semibold tracking-wide">Texto Principal</span>
            <button
              onClick={() => copy(variant.primaryText, 'body')}
              className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-300 transition-colors"
            >
              {copiedField === 'body'
                ? <><Check className="w-3 h-3 text-green-400" /> Copiado</>
                : <><Copy className="w-3 h-3" /> Copiar</>
              }
            </button>
          </div>
          <p className="text-xs text-gray-300 leading-relaxed whitespace-pre-line">{variant.primaryText}</p>
        </div>
      </div>
    </div>
  )
}

interface Props {
  campaignId: string
  campaignName: string
  roas: number
  minRoas: number
  ctr?: number
  frequency?: number
}

export default function AdRewriter({ campaignId, campaignName, roas, minRoas, ctr = 0, frequency = 0 }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<RewriteAdResult | null>(null)

  const hasIssue = roas < minRoas || ctr < 1 || frequency > 3.5

  async function generate() {
    if (loading) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/ai/rewrite-ad', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignId }),
      })
      const data = await res.json()
      if (data.error) {
        setError(data.error)
      } else {
        setResult(data.result)
      }
    } catch {
      setError('Erro de rede. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mt-3 rounded-xl border border-gray-700/50 overflow-hidden">
      {/* Toggle header */}
      <button
        onClick={() => {
          setOpen(v => !v)
          if (!open && !result) generate()
        }}
        className="w-full flex items-center justify-between gap-2 px-3 py-2 bg-gray-800/40 hover:bg-gray-800/60 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Wand2 className="w-3.5 h-3.5 text-neon-purple" />
          <span className="text-xs font-medium text-gray-300">Reescrever Criativo com IA</span>
          {hasIssue && (
            <span className="flex items-center gap-1 text-[10px] text-yellow-400">
              <AlertTriangle className="w-3 h-3" /> Problema detectado
            </span>
          )}
        </div>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-3 space-y-3 border-t border-gray-700/50">
          {error && (
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/25 text-xs text-red-400">{error}</div>
          )}

          {loading && (
            <div className="flex items-center justify-center py-6 gap-2 text-gray-500 text-xs">
              <Loader2 className="w-4 h-4 animate-spin text-neon-purple" />
              Gerando variações de copy para "{campaignName}"…
            </div>
          )}

          {result && !loading && (
            <>
              <div className="p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                <p className="text-[11px] text-yellow-400">
                  <span className="font-semibold">Problema: </span>{result.problem}
                </p>
              </div>
              <div className="space-y-3">
                {result.variants.map((v, i) => (
                  <VariantCard key={i} variant={v} />
                ))}
              </div>
              <button
                onClick={generate}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] text-gray-600 hover:text-gray-400 transition-colors mt-1"
              >
                <Wand2 className="w-3 h-3" /> Regenerar variações
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
