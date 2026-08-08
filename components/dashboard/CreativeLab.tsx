'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Link2, Loader2, Copy, Check, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react'
import { generateCreativeBriefAction } from '@/actions/creative-lab'
import type { CreativeBriefResult, CreativeVariation } from '@/actions/creative-lab'
import { useLanguage } from '@/lib/i18n/LanguageContext'

const FRAMEWORK_COLORS = {
  AIDA: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', badge: 'bg-blue-500/20 text-blue-300' },
  PAS: { bg: 'bg-purple-500/10', border: 'border-purple-500/30', badge: 'bg-purple-500/20 text-purple-300' },
}

function VariationCard({ v, index }: { v: CreativeVariation; index: number }) {
  const { dict } = useLanguage()
  const d = dict.account.creativeLab
  const [copied, setCopied] = useState<'headline' | 'text' | null>(null)
  const [expanded, setExpanded] = useState(index < 2)

  const colors = FRAMEWORK_COLORS[v.framework]

  function copy(field: 'headline' | 'text', text: string) {
    navigator.clipboard.writeText(text)
    setCopied(field)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className={`rounded-xl border ${colors.border} ${colors.bg} overflow-hidden`}>
      {/* Header */}
      <button
        onClick={() => setExpanded((p) => !p)}
        className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${colors.badge}`}>
            {v.framework}
          </span>
          <span className="text-sm font-semibold text-white truncate pr-4">
            {v.headline}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation()
              copy('headline', v.headline)
            }}
            className="p-1.5 rounded text-gray-400 hover:text-neon-cyan transition-colors"
            title={d.copyHeadline}
          >
            {copied === 'headline' ? (
              <Check className="w-3.5 h-3.5 text-neon-cyan" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-gray-500" />
          ) : (
            <ChevronDown className="w-4 h-4 text-gray-500" />
          )}
        </div>
      </button>

      {/* Body */}
      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          <div className="h-px bg-white/5" />
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">
                {d.primaryText}
              </span>
              <button
                onClick={() => copy('text', v.primaryText)}
                className="flex items-center gap-1 text-xs text-gray-400 hover:text-neon-cyan transition-colors"
              >
                {copied === 'text' ? (
                  <><Check className="w-3 h-3 text-neon-cyan" /> {d.copied}</>
                ) : (
                  <><Copy className="w-3 h-3" /> {d.copy}</>
                )}
              </button>
            </div>
            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-line">
              {v.primaryText}
            </p>
          </div>

          {/* Copy Full */}
          <button
            onClick={() => copy('text', `HEADLINE:\n${v.headline}\n\n${d.primaryText.toUpperCase()}:\n${v.primaryText}`)}
            className="w-full py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-colors"
          >
            {d.copyAll}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CreativeLab() {
  const { dict } = useLanguage()
  const d = dict.account.creativeLab
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<CreativeBriefResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleGenerate() {
    setError(null)
    setResult(null)
    startTransition(async () => {
      const res = await generateCreativeBriefAction(url)
      if (res.success && res.data) {
        setResult(res.data)
      } else {
        setError(res.error ?? d.errorGeneric)
      }
    })
  }

  return (
    <div className="space-y-6">
      {/* Input */}
      <div className="glass-card border border-gray-800 rounded-xl p-5">
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-8 h-8 rounded-lg bg-neon-cyan/10 flex items-center justify-center">
            <Link2 className="w-4 h-4 text-neon-cyan" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white">{d.urlLabel}</p>
            <p className="text-xs text-gray-500">{d.urlDesc}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !isPending && handleGenerate()}
            placeholder={d.urlPlaceholder}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-colors"
          />
          <button
            onClick={handleGenerate}
            disabled={isPending || !url.startsWith('http')}
            className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-sm font-bold transition-all hover:opacity-90 disabled:opacity-50 flex items-center gap-2"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {d.generating}
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                {d.generateButton}
              </>
            )}
          </button>
        </div>

        {error && (
          <p className="mt-3 text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="glass-card border border-gray-800 rounded-xl p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-neon-cyan mx-auto mb-3" />
          <p className="text-sm text-gray-300 font-medium">{d.loadingTitle}</p>
          <p className="text-xs text-gray-500 mt-1">{d.loadingDesc}</p>
        </div>
      )}

      {/* Results */}
      {result && !isPending && (
        <div className="space-y-4">
          {/* Product Summary */}
          <div className="glass-card border border-gray-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                {d.productAnalyzed}
              </p>
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-neon-cyan transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                {d.regenerate}
              </button>
            </div>
            <p className="text-base font-bold text-white mb-1">{result.productName}</p>
            <p className="text-sm text-gray-400 mb-2">{result.productDescription}</p>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-neon-cyan/10 border border-neon-cyan/20">
              <span className="text-xs text-neon-cyan">{d.targetAudienceLabel}</span>
              <span className="text-xs text-gray-300">{result.targetAudience}</span>
            </div>
          </div>

          {/* Variations */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-neon-cyan" />
              <p className="text-sm font-semibold text-white">
                {d.variationsGenerated.replace('{count}', String(result.variations.length))}
              </p>
              <span className="text-xs text-gray-500">
                ({result.variations.filter(v => v.framework === 'AIDA').length} AIDA ·{' '}
                {result.variations.filter(v => v.framework === 'PAS').length} PAS)
              </span>
            </div>

            <div className="space-y-3">
              {result.variations.map((v, i) => (
                <VariationCard key={i} v={v} index={i} />
              ))}
            </div>
          </div>

          {/* Footer tip */}
          <div className="p-3 rounded-lg bg-gray-900 border border-gray-800 text-xs text-gray-500 leading-relaxed">
            💡 <strong className="text-gray-300">{d.abTestTipLabel}</strong> {d.abTestTipText}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!result && !isPending && !error && (
        <div className="glass-card border border-gray-800 rounded-xl p-10 text-center">
          <Sparkles className="w-10 h-10 text-neon-cyan/30 mx-auto mb-3" />
          <p className="text-sm text-gray-400 font-medium">
            {d.emptyStateTitle}
          </p>
          <p className="text-xs text-gray-600 mt-1">
            {d.emptyStateDesc}
          </p>
        </div>
      )}
    </div>
  )
}
