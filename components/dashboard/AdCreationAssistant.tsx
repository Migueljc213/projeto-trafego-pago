'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Wand2,
  Link2,
  Copy,
  Check,
  Loader2,
  Package,
  Type,
  AlignLeft,
  ChevronDown,
  ChevronUp,
  Sparkles,
  ExternalLink,
} from 'lucide-react'
import { generateAdCopyAction } from '@/actions/ad-creation'
import type { AdCreationResult, AdCopyVariation } from '@/lib/ai/ad-creation-helper'

// ─── Copy Card ────────────────────────────────────────────────────────────────

function CopyCard({
  variation,
  index,
  type,
}: {
  variation: AdCopyVariation
  index: number
  type: 'headline' | 'primaryText'
}) {
  const [copiedHeadline, setCopiedHeadline] = useState(false)
  const [copiedText, setCopiedText] = useState(false)

  const copyToClipboard = async (text: string, setter: (v: boolean) => void) => {
    await navigator.clipboard.writeText(text)
    setter(true)
    setTimeout(() => setter(false), 2000)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className="p-4 rounded-xl border border-gray-800 bg-white/2 hover:border-gray-700 transition-all group"
    >
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          Variação {index + 1}
        </span>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
          type === 'headline'
            ? 'bg-purple-500/20 text-purple-400'
            : 'bg-blue-500/20 text-blue-400'
        }`}>
          {type === 'headline' ? 'Foco no Título' : 'Foco no Texto'}
        </span>
      </div>

      {/* Headline */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Type className="w-3 h-3" /> Headline
            <span className="text-gray-700">({variation.headline.length} chars)</span>
          </span>
          <button
            onClick={() => copyToClipboard(variation.headline, setCopiedHeadline)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white"
          >
            {copiedHeadline ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <p className="text-sm font-semibold text-white leading-snug">{variation.headline}</p>
      </div>

      {/* Primary Text */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <AlignLeft className="w-3 h-3" /> Primary Text
            <span className="text-gray-700">({variation.primaryText.length} chars)</span>
          </span>
          <button
            onClick={() => copyToClipboard(variation.primaryText, setCopiedText)}
            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/5 text-gray-500 hover:text-white"
          >
            {copiedText ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
        <p className="text-xs text-gray-300 leading-relaxed">{variation.primaryText}</p>
      </div>
    </motion.div>
  )
}

// ─── Produto Preview ──────────────────────────────────────────────────────────

function ProductPreview({ product, expanded, onToggle }: {
  product: AdCreationResult['product']
  expanded: boolean
  onToggle: () => void
}) {
  return (
    <div className="mb-4 rounded-xl border border-gray-800 bg-white/2 overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 text-left hover:bg-white/2 transition"
      >
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-medium text-white truncate max-w-[220px]">{product.title}</span>
          {product.price && (
            <span className="text-xs font-mono text-green-400 bg-green-500/10 px-2 py-0.5 rounded-full">
              {product.price}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5">
          <a
            href={product.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="p-1 text-gray-500 hover:text-white transition"
          >
            <ExternalLink className="w-3 h-3" />
          </a>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </div>
      </button>
      {expanded && (
        <div className="px-4 pb-4 border-t border-gray-800 pt-3">
          <p className="text-xs text-gray-400 leading-relaxed mb-3">{product.description.slice(0, 300)}{product.description.length > 300 ? '…' : ''}</p>
          {product.benefits.length > 0 && (
            <ul className="space-y-1">
              {product.benefits.map((b, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                  <span className="w-1 h-1 rounded-full bg-neon-cyan mt-1.5 flex-shrink-0" />
                  {b}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function AdCreationAssistant() {
  const [url, setUrl] = useState('')
  const [result, setResult] = useState<AdCreationResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [productExpanded, setProductExpanded] = useState(false)
  const [activeTab, setActiveTab] = useState<'headlines' | 'primaryTexts'>('headlines')

  const handleGenerate = () => {
    if (!url.trim()) return
    setError(null)
    setResult(null)

    startTransition(async () => {
      const res = await generateAdCopyAction({ productUrl: url.trim() })
      if (res.success && res.data) {
        setResult(res.data)
        setProductExpanded(false)
      } else {
        setError(res.error ?? 'Erro desconhecido')
      }
    })
  }

  const activeVariations = result
    ? activeTab === 'headlines' ? result.headlines : result.primaryTexts
    : []

  return (
    <div className="glass-card rounded-xl border border-gray-800 p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
          <Wand2 className="w-4 h-4 text-purple-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">Assistente de Criação</h3>
          <p className="text-xs text-gray-500">Cole a URL do produto — a IA gera 6 variações de copy</p>
        </div>
      </div>

      {/* Input */}
      <div className="flex gap-2 mb-5">
        <div className="relative flex-1">
          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
            placeholder="https://loja.com/produto/nome-do-produto"
            className="w-full pl-9 pr-3 py-2.5 bg-white/3 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/50 focus:ring-1 focus:ring-neon-cyan/20 transition"
            disabled={isPending}
          />
        </div>
        <button
          onClick={handleGenerate}
          disabled={isPending || !url.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-800 disabled:text-gray-600 text-white rounded-lg text-sm font-medium transition-all"
        >
          {isPending ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Gerando…
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              Gerar Copy
            </>
          )}
        </button>
      </div>

      {/* Loading state */}
      {isPending && (
        <div className="text-center py-8">
          <Loader2 className="w-8 h-8 text-purple-400 animate-spin mx-auto mb-3" />
          <p className="text-sm text-gray-400">Analisando produto e gerando copy…</p>
          <p className="text-xs text-gray-600 mt-1">Isso pode levar até 15 segundos</p>
        </div>
      )}

      {/* Error */}
      <AnimatePresence>
        {error && !isPending && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-sm text-red-400 mb-4"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <AnimatePresence>
        {result && !isPending && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Product preview */}
            <ProductPreview
              product={result.product}
              expanded={productExpanded}
              onToggle={() => setProductExpanded((v) => !v)}
            />

            {/* Tab switcher */}
            <div className="flex gap-1 p-1 bg-white/3 rounded-lg border border-gray-800 mb-4">
              <button
                onClick={() => setActiveTab('headlines')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'headlines'
                    ? 'bg-purple-600/80 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <Type className="w-3 h-3" />
                Headlines (3)
              </button>
              <button
                onClick={() => setActiveTab('primaryTexts')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                  activeTab === 'primaryTexts'
                    ? 'bg-blue-600/80 text-white'
                    : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <AlignLeft className="w-3 h-3" />
                Primary Texts (3)
              </button>
            </div>

            {/* Variations */}
            <div className="space-y-3">
              {activeVariations.map((v, i) => (
                <CopyCard
                  key={`${activeTab}-${i}`}
                  variation={v}
                  index={i}
                  type={activeTab === 'headlines' ? 'headline' : 'primaryText'}
                />
              ))}
            </div>

            {/* Footer */}
            <p className="mt-3 text-xs text-gray-600 text-center">
              Gerado em {result.generatedAt instanceof Date
                ? result.generatedAt.toLocaleTimeString('pt-BR')
                : new Date(result.generatedAt).toLocaleTimeString('pt-BR')} · Passe o mouse para copiar
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
