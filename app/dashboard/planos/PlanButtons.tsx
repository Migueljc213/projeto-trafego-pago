'use client'

import { useTransition } from 'react'
import { createCheckoutSession, createPortalSession } from '@/actions/billing'
import type { PlanKey } from '@/lib/stripe'
import { Loader2 } from 'lucide-react'

export function CheckoutButton({ plan, isPro }: { plan: PlanKey; isPro: boolean }) {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => createCheckoutSession(plan))}
      className={`w-full py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
        isPro
          ? 'bg-neon-cyan text-black hover:bg-neon-cyan/90'
          : 'bg-white/10 text-white hover:bg-white/15 border border-gray-700'
      } disabled:opacity-60 disabled:cursor-not-allowed`}
    >
      {pending && <Loader2 className="w-4 h-4 animate-spin" />}
      {pending ? 'Redirecionando...' : 'Assinar agora'}
    </button>
  )
}

export function PortalButton() {
  const [pending, startTransition] = useTransition()

  return (
    <button
      disabled={pending}
      onClick={() => startTransition(() => createPortalSession())}
      className="px-4 py-2 rounded-lg text-xs font-medium text-neon-cyan border border-neon-cyan/30 hover:bg-neon-cyan/10 transition-colors disabled:opacity-60 flex items-center gap-1.5"
    >
      {pending && <Loader2 className="w-3 h-3 animate-spin" />}
      {pending ? 'Abrindo...' : 'Gerenciar assinatura'}
    </button>
  )
}
