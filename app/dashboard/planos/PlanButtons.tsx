'use client'

import { useState, useTransition } from 'react'
import { createCheckoutSession, createPortalSession } from '@/actions/billing'
import type { PlanKey } from '@/lib/stripe'
import { Loader2 } from 'lucide-react'

export function CheckoutButton({ plan, isPro }: { plan: PlanKey; isPro: boolean }) {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      try {
        await createCheckoutSession(plan)
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao iniciar checkout'
        setError(msg)
      }
    })
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        disabled={pending}
        onClick={handleClick}
        className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
          isPro
            ? 'bg-neon-cyan text-black hover:bg-neon-cyan/90'
            : 'bg-white/10 text-white hover:bg-white/15 border border-gray-700'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {pending && <Loader2 className="w-4 h-4 animate-spin" />}
        {pending ? 'Redirecionando...' : 'Assinar agora'}
      </button>
      {error && <p className="text-xs text-red-400 text-center">{error}</p>}
    </div>
  )
}

export function PortalButton() {
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleClick() {
    setError(null)
    startTransition(async () => {
      try {
        await createPortalSession()
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Erro ao abrir portal'
        setError(msg)
      }
    })
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        disabled={pending}
        onClick={handleClick}
        className="px-4 py-2 rounded-lg text-xs font-medium text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/10 transition-colors disabled:opacity-60 flex items-center gap-1.5"
      >
        {pending && <Loader2 className="w-3 h-3 animate-spin" />}
        {pending ? 'Abrindo...' : 'Gerenciar assinatura'}
      </button>
      {error && <p className="text-xs text-red-400 text-right">{error}</p>}
    </div>
  )
}
