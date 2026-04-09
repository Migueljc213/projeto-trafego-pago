'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Megaphone,
  Globe,
  Tag,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  FileText,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingDown,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface DiagnosticData {
  campaignName: string | null
  bottleneck: 'AD' | 'PRICE' | 'SITE' | 'MIXED' | 'HEALTHY'
  adScore: number        // 0–100
  priceScore: number     // 0–100
  siteScore: number      // 0–100
  rootCause: string      // Insight técnico (1 parágrafo)
  executiveSummary: string | null  // Resumo executivo (3 parágrafos)
  createdAt: Date
}

interface DiagnosticCenterProps {
  data: DiagnosticData | null
  onRunDiagnosis?: () => void
  loading?: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getBarColor(score: number, isBottleneck: boolean): string {
  if (isBottleneck) return 'bg-red-500'
  if (score >= 80) return 'bg-green-500'
  if (score >= 60) return 'bg-yellow-500'
  if (score >= 40) return 'bg-orange-500'
  return 'bg-red-500'
}

function getTextColor(score: number, isBottleneck: boolean): string {
  if (isBottleneck) return 'text-red-400'
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Saudável'
  if (score >= 60) return 'Atenção'
  if (score >= 40) return 'Risco'
  return 'Crítico'
}

function getBottleneckMeta(bottleneck: DiagnosticData['bottleneck']) {
  const map = {
    AD: { label: 'Gargalo nos Criativos', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
    PRICE: { label: 'Gargalo no Preço', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/30' },
    SITE: { label: 'Gargalo no Site', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/30' },
    MIXED: { label: 'Múltiplos Gargalos', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/30' },
    HEALTHY: { label: 'Funil Saudável', color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/30' },
  }
  return map[bottleneck]
}

// ─── Barra Horizontal de Score ────────────────────────────────────────────────

function HealthBar({
  label,
  score,
  icon: Icon,
  isBottleneck,
}: {
  label: string
  score: number
  icon: React.ElementType
  isBottleneck: boolean
}) {
  const barColor = getBarColor(score, isBottleneck)
  const textColor = getTextColor(score, isBottleneck)
  const scoreLabel = getScoreLabel(score)

  return (
    <div className={`p-4 rounded-xl border transition-all ${
      isBottleneck
        ? 'border-red-500/40 bg-red-500/5 ring-1 ring-red-500/15'
        : 'border-gray-800 bg-white/2'
    }`}>
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          {isBottleneck && (
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />
          )}
          <Icon className={`w-3.5 h-3.5 ${isBottleneck ? 'text-red-400' : 'text-gray-400'}`} />
          <span className={`text-sm font-medium ${isBottleneck ? 'text-red-300' : 'text-gray-300'}`}>
            {label}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${textColor}`}
            style={{ backgroundColor: isBottleneck ? '#ef444415' : undefined }}>
            {scoreLabel}
          </span>
          <span className={`text-base font-bold font-mono ${textColor}`}>{score}</span>
          <span className="text-xs text-gray-600">/100</span>
        </div>
      </div>

      {/* Barra de progresso */}
      <div className="h-2 rounded-full bg-gray-800 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${barColor}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.1 }}
        />
      </div>
    </div>
  )
}

// ─── Executive Summary Expandível ────────────────────────────────────────────

function ExecutiveSummary({ summary }: { summary: string }) {
  const [expanded, setExpanded] = useState(false)
  const paragraphs = summary.split(/\n\n+/).filter(Boolean)

  return (
    <div className="rounded-xl border border-gray-800 bg-white/2 overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-white/3 transition-colors"
      >
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-neon-cyan" />
          <span className="text-sm font-semibold text-white">Resumo Executivo</span>
          <span className="text-xs text-gray-500 ml-1">3 parágrafos · foco em lucro</span>
        </div>
        {expanded
          ? <ChevronUp className="w-4 h-4 text-gray-400" />
          : <ChevronDown className="w-4 h-4 text-gray-400" />
        }
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-800 pt-4">
              {paragraphs.map((para, i) => (
                <p key={i} className="text-sm text-gray-300 leading-relaxed">
                  {i === 0 && <span className="text-neon-cyan font-semibold mr-1">Situação:</span>}
                  {i === 1 && <span className="text-yellow-400 font-semibold mr-1">Causa Raiz:</span>}
                  {i === 2 && <span className="text-green-400 font-semibold mr-1">Ações:</span>}
                  {para}
                </p>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function DiagnosticCenter({
  data,
  onRunDiagnosis,
  loading = false,
}: DiagnosticCenterProps) {
  if (!data) {
    return (
      <div className="glass-card rounded-xl border border-gray-800 p-6 flex flex-col items-center justify-center gap-4 min-h-[280px]">
        <TrendingDown className="w-10 h-10 text-gray-700" />
        <div className="text-center">
          <p className="text-sm font-medium text-gray-400">Sem diagnóstico disponível</p>
          <p className="text-xs text-gray-600 mt-1">
            Execute o Auto-Pilot Correlacionado em uma campanha para gerar o primeiro diagnóstico.
          </p>
        </div>
        {onRunDiagnosis && (
          <button
            onClick={onRunDiagnosis}
            disabled={loading}
            className="px-4 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-medium hover:bg-neon-cyan/20 transition-all disabled:opacity-40"
          >
            {loading ? 'Diagnosticando...' : 'Gerar Primeiro Diagnóstico'}
          </button>
        )}
      </div>
    )
  }

  const bottleneckMeta = getBottleneckMeta(data.bottleneck)
  const isAdBottleneck = data.bottleneck === 'AD' || data.bottleneck === 'MIXED'
  const isPriceBottleneck = data.bottleneck === 'PRICE' || data.bottleneck === 'MIXED'
  const isSiteBottleneck = data.bottleneck === 'SITE' || data.bottleneck === 'MIXED'

  const updatedLabel = data.createdAt.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card rounded-xl border border-gray-800 p-5 space-y-5"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-neon-cyan" />
            Centro de Diagnóstico
          </h3>
          {data.campaignName && (
            <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">
              {data.campaignName}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${bottleneckMeta.color} ${bottleneckMeta.bg}`}>
            {data.bottleneck === 'HEALTHY'
              ? <CheckCircle2 className="w-3 h-3 inline mr-1" />
              : <AlertTriangle className="w-3 h-3 inline mr-1" />
            }
            {bottleneckMeta.label}
          </span>
          <span className="text-xs text-gray-600 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {updatedLabel}
          </span>
        </div>
      </div>

      {/* Gráfico de Saúde do Funil — 3 Barras */}
      <div className="space-y-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Saúde do Funil
        </p>
        <HealthBar
          label="Criativos"
          score={data.adScore}
          icon={Megaphone}
          isBottleneck={isAdBottleneck}
        />
        <HealthBar
          label="Site / LP"
          score={data.siteScore}
          icon={Globe}
          isBottleneck={isSiteBottleneck}
        />
        <HealthBar
          label="Preço"
          score={data.priceScore}
          icon={Tag}
          isBottleneck={isPriceBottleneck}
        />
      </div>

      {/* Root Cause Insight (técnico, 1 parágrafo) */}
      <div className="p-3.5 rounded-xl border border-neon-cyan/20 bg-neon-cyan/5">
        <div className="flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 text-neon-cyan mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-neon-cyan mb-1">Causa Raiz (IA)</p>
            <p className="text-xs text-gray-300 leading-relaxed">{data.rootCause}</p>
          </div>
        </div>
      </div>

      {/* Executive Summary (expandível) */}
      {data.executiveSummary && (
        <ExecutiveSummary summary={data.executiveSummary} />
      )}

      {/* Botão de Rediagnóstico */}
      {onRunDiagnosis && (
        <button
          onClick={onRunDiagnosis}
          disabled={loading}
          className="w-full py-2.5 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <TrendingDown className={`w-3.5 h-3.5 ${loading ? 'animate-pulse' : ''}`} />
          {loading ? 'Diagnosticando...' : 'Atualizar Diagnóstico'}
        </button>
      )}
    </motion.div>
  )
}
