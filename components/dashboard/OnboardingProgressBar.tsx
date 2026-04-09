'use client'

import { CheckCircle2, Circle } from 'lucide-react'

interface Props {
  step: number
  hasCompletedOnboarding: boolean
}

const STEPS = [
  { label: 'Conectar Facebook' },
  { label: 'Conta de Anúncios' },
  { label: 'Concorrentes' },
]

export default function OnboardingProgressBar({ step, hasCompletedOnboarding }: Props) {
  if (hasCompletedOnboarding) return null

  const pct = Math.min(Math.round(((step - 1) / STEPS.length) * 100), 100)

  return (
    <div className="w-full mb-6 glass-card border border-neon-cyan/30 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-semibold text-white">Setup do FunnelGuard</p>
          <p className="text-xs text-gray-400 mt-0.5">
            Complete a configuração para ativar o monitoramento total
          </p>
        </div>
        <span className="text-xs font-bold text-neon-cyan font-mono">{pct}%</span>
      </div>

      {/* Barra de progresso */}
      <div className="h-1.5 rounded-full bg-gray-800 mb-4">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-500"
          style={{ width: `${Math.max(pct, 4)}%` }}
        />
      </div>

      {/* Passos */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => {
          const stepNum = i + 1
          const done = step > stepNum
          const active = step === stepNum
          return (
            <div key={i} className="flex items-center gap-2 flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-neon-cyan flex-shrink-0" />
                ) : (
                  <Circle
                    className={`w-4 h-4 flex-shrink-0 ${active ? 'text-neon-cyan' : 'text-gray-600'}`}
                  />
                )}
                <span
                  className={`text-xs truncate ${
                    done
                      ? 'text-neon-cyan line-through'
                      : active
                      ? 'text-white font-medium'
                      : 'text-gray-500'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-px ${done ? 'bg-neon-cyan/40' : 'bg-gray-700'}`} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
