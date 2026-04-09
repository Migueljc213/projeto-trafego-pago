'use client'

import { motion } from 'framer-motion'
import { TrendingDown, Zap, BarChart2, PauseCircle } from 'lucide-react'
import type { AiSavings } from '@/lib/dashboard-data'

interface ROISavingsCardProps {
  savings: AiSavings
}

function AnimatedCurrency({ value }: { value: number }) {
  const formatted = value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return <span>{formatted}</span>
}

export default function ROISavingsCard({ savings }: ROISavingsCardProps) {
  const hasSavings = savings.totalSaved > 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative overflow-hidden rounded-xl border border-green-500/30 bg-gradient-to-br from-green-950/60 via-emerald-950/40 to-gray-900/80 p-5"
    >
      {/* Glow de fundo */}
      <div className="pointer-events-none absolute inset-0 rounded-xl bg-green-500/5" />
      <div className="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-green-500/10 blur-3xl" />

      {/* Header */}
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-500/15 ring-1 ring-green-500/30">
            <TrendingDown className="h-4 w-4 text-green-400" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-green-400/80">
              Economia da IA — 30 dias
            </p>
            <p className="text-[11px] text-gray-500">Baseado em campanhas pausadas / orçamentos reduzidos</p>
          </div>
        </div>
        <div className="flex items-center gap-1 rounded-full border border-green-500/25 bg-green-500/10 px-2.5 py-0.5">
          <Zap className="h-3 w-3 text-green-400" />
          <span className="text-[10px] font-bold text-green-400">AUTO-PILOT</span>
        </div>
      </div>

      {/* Número Principal */}
      <div className="mb-5">
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-green-400/70">R$</span>
          <motion.span
            className="font-mono text-5xl font-extrabold text-green-400 tabular-nums"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.1, type: 'spring' }}
          >
            <AnimatedCurrency value={savings.totalSaved} />
          </motion.span>
        </div>
        <p className="mt-1.5 text-sm text-gray-400">
          economizados em gasto que não converteria
        </p>
      </div>

      {/* Stats secundários */}
      <div className="grid grid-cols-3 gap-3">
        <StatPill
          icon={PauseCircle}
          label="Pausas"
          value={savings.pauseCount}
          color="text-red-400"
          bg="bg-red-500/10 border-red-500/20"
        />
        <StatPill
          icon={BarChart2}
          label="Decisões"
          value={savings.totalDecisions}
          color="text-neon-cyan"
          bg="bg-neon-cyan/10 border-neon-cyan/20"
        />
        <StatPill
          icon={TrendingDown}
          label="Escaladas"
          value={savings.scaleCount}
          color="text-purple-400"
          bg="bg-purple-500/10 border-purple-500/20"
        />
      </div>

      {/* Rodapé: vazio state */}
      {!hasSavings && (
        <div className="mt-4 rounded-lg border border-gray-700 bg-gray-900/60 px-3 py-2.5 text-center">
          <p className="text-xs text-gray-500">
            Ative o Auto-Pilot em suas campanhas para começar a registrar economia.
          </p>
        </div>
      )}

      {hasSavings && (
        <p className="mt-4 text-[11px] text-gray-600">
          Estimativa: cada pausa equivale a 50% do orçamento diário economizado.
          Valores reais podem variar conforme performance histórica.
        </p>
      )}
    </motion.div>
  )
}

function StatPill({
  icon: Icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ElementType
  label: string
  value: number
  color: string
  bg: string
}) {
  return (
    <div className={`flex flex-col items-center rounded-lg border px-2 py-2.5 ${bg}`}>
      <Icon className={`mb-1 h-3.5 w-3.5 ${color}`} />
      <span className={`font-mono text-lg font-bold ${color}`}>{value}</span>
      <span className="text-[10px] text-gray-500">{label}</span>
    </div>
  )
}
