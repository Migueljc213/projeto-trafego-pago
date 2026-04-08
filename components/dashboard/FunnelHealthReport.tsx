'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Megaphone,
  Tag,
  Globe,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  TrendingDown,
  Lightbulb,
  RefreshCw,
} from 'lucide-react'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface FunnelHealthData {
  adScore: number        // 0–100
  priceScore: number     // 0–100
  siteScore: number      // 0–100
  bottleneck: 'AD' | 'PRICE' | 'SITE' | 'MIXED' | 'HEALTHY'
  rootCauseInsight: string
  trigger: string
  details: string[]
  campaignName: string
  roas: number
  targetRoas: number
  updatedAt?: Date
}

interface FunnelHealthReportProps {
  data: FunnelHealthData
  onRefresh?: () => void
  loading?: boolean
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getScoreColor(score: number): string {
  if (score >= 80) return 'text-green-400'
  if (score >= 60) return 'text-yellow-400'
  if (score >= 40) return 'text-orange-400'
  return 'text-red-400'
}

function getScoreRingColor(score: number): string {
  if (score >= 80) return '#22c55e'
  if (score >= 60) return '#eab308'
  if (score >= 40) return '#f97316'
  return '#ef4444'
}

function getScoreLabel(score: number): string {
  if (score >= 80) return 'Saudável'
  if (score >= 60) return 'Atenção'
  if (score >= 40) return 'Risco'
  return 'Crítico'
}

function getBottleneckBadge(bottleneck: FunnelHealthData['bottleneck']) {
  const map = {
    AD: { label: 'Gargalo: Anúncio', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    PRICE: { label: 'Gargalo: Preço', color: 'bg-orange-500/20 text-orange-400 border-orange-500/30' },
    SITE: { label: 'Gargalo: Site', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
    MIXED: { label: 'Múltiplos Gargalos', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
    HEALTHY: { label: 'Funil Saudável', color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  }
  return map[bottleneck]
}

// ─── Score Ring (SVG circular) ────────────────────────────────────────────────

function ScoreRing({
  score,
  label,
  icon: Icon,
  isBottleneck,
}: {
  score: number
  label: string
  icon: React.ElementType
  isBottleneck: boolean
}) {
  const radius = 28
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const color = getScoreRingColor(score)

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
        isBottleneck
          ? 'border-red-500/40 bg-red-500/5 ring-1 ring-red-500/20'
          : 'border-gray-800 bg-white/2'
      }`}
    >
      {/* SVG Ring */}
      <div className="relative w-16 h-16">
        <svg className="w-16 h-16 -rotate-90" viewBox="0 0 72 72">
          {/* Track */}
          <circle cx="36" cy="36" r={radius} fill="none" stroke="#1f2937" strokeWidth="5" />
          {/* Progress */}
          <motion.circle
            cx="36"
            cy="36"
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
          />
        </svg>
        {/* Score text */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold font-mono ${getScoreColor(score)}`}>{score}</span>
        </div>
        {/* Bottleneck indicator */}
        {isBottleneck && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>

      {/* Icon + Label */}
      <div className="flex items-center gap-1.5">
        <Icon className={`w-3.5 h-3.5 ${isBottleneck ? 'text-red-400' : 'text-gray-400'}`} />
        <span className={`text-xs font-medium ${isBottleneck ? 'text-red-400' : 'text-gray-400'}`}>
          {label}
        </span>
      </div>

      {/* Status badge */}
      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${getScoreColor(score)} bg-current/10`}
        style={{ backgroundColor: `${getScoreRingColor(score)}15` }}>
        {getScoreLabel(score)}
      </span>
    </motion.div>
  )
}

// ─── Componente Principal ─────────────────────────────────────────────────────

export default function FunnelHealthReport({
  data,
  onRefresh,
  loading = false,
}: FunnelHealthReportProps) {
  const [showDetails, setShowDetails] = useState(false)
  const badge = getBottleneckBadge(data.bottleneck)

  const roasOk = data.roas >= data.targetRoas
  const roasPct = ((data.roas / data.targetRoas - 1) * 100).toFixed(0)
  const roasLabel = roasOk ? `+${roasPct}% acima do alvo` : `${roasPct}% abaixo do alvo`

  return (
    <div className="glass-card rounded-xl border border-gray-800 p-5">
      {/* Header */}
      <div className="flex items-start justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white flex items-center gap-2">
            <TrendingDown className="w-4 h-4 text-neon-cyan" />
            Relatório de Saúde do Funil
          </h3>
          <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{data.campaignName}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2.5 py-1 rounded-full border font-medium ${badge.color}`}>
            {badge.label}
          </span>
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-1.5 rounded-lg border border-gray-800 hover:border-gray-600 text-gray-400 hover:text-white transition-all disabled:opacity-40"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {/* ROAS Bar */}
      <div className="mb-5 p-3 rounded-lg bg-white/3 border border-gray-800">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">ROAS atual</span>
          <span className={`text-xs font-medium ${roasOk ? 'text-green-400' : 'text-red-400'}`}>
            {roasOk ? <CheckCircle2 className="w-3 h-3 inline mr-1" /> : <XCircle className="w-3 h-3 inline mr-1" />}
            {roasLabel}
          </span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className={`text-2xl font-bold font-mono ${roasOk ? 'text-green-400' : 'text-red-400'}`}>
            {data.roas.toFixed(2)}x
          </span>
          <span className="text-xs text-gray-500">alvo: {data.targetRoas}x</span>
        </div>
        <div className="mt-2 h-1.5 rounded-full bg-gray-800 overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${roasOk ? 'bg-green-500' : 'bg-red-500'}`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (data.roas / (data.targetRoas * 2)) * 100)}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Score Rings — 3 colunas */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <ScoreRing
          score={data.adScore}
          label="Anúncio"
          icon={Megaphone}
          isBottleneck={data.bottleneck === 'AD' || data.bottleneck === 'MIXED'}
        />
        <ScoreRing
          score={data.priceScore}
          label="Preço"
          icon={Tag}
          isBottleneck={data.bottleneck === 'PRICE' || data.bottleneck === 'MIXED'}
        />
        <ScoreRing
          score={data.siteScore}
          label="Site"
          icon={Globe}
          isBottleneck={data.bottleneck === 'SITE' || data.bottleneck === 'MIXED'}
        />
      </div>

      {/* Root Cause Insight (GPT-4o) */}
      {data.rootCauseInsight && (
        <div className="mb-4 p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
          <div className="flex items-start gap-2">
            <Lightbulb className="w-3.5 h-3.5 text-neon-cyan mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs font-semibold text-neon-cyan mb-1">Causa Raiz (IA)</p>
              <p className="text-xs text-gray-300 leading-relaxed">{data.rootCauseInsight}</p>
            </div>
          </div>
        </div>
      )}

      {/* Detalhes técnicos (expansível) */}
      {data.details.length > 0 && (
        <div>
          <button
            onClick={() => setShowDetails((v) => !v)}
            className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
          >
            <span>{showDetails ? 'Ocultar' : 'Ver'} sinais detectados ({data.details.length})</span>
          </button>

          {showDetails && (
            <motion.ul
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mt-2 space-y-1"
            >
              {data.details.map((detail, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-gray-400">
                  <span className="w-1 h-1 rounded-full bg-gray-600 mt-1.5 flex-shrink-0" />
                  {detail}
                </li>
              ))}
            </motion.ul>
          )}
        </div>
      )}
    </div>
  )
}
