import Stripe from 'stripe'

// Lazy init — evita erro no build quando STRIPE_SECRET_KEY não está definida
let _stripe: Stripe | null = null
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('STRIPE_SECRET_KEY não configurada')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-03-31.basil',
    })
  }
  return _stripe
}

// Mantém export direto para compatibilidade com código existente (só usa em runtime)
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return (getStripe() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export const PLANS = {
  starter: {
    name: 'Starter',
    priceId: process.env.STRIPE_PRICE_STARTER ?? '',
    maxAdAccounts: 1,
    price: 'R$ 197/mês',
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_PRO ?? '',
    maxAdAccounts: 5,
    price: 'R$ 397/mês',
  },
  agency: {
    name: 'Agency',
    priceId: process.env.STRIPE_PRICE_AGENCY ?? '',
    maxAdAccounts: 999,
    price: 'R$ 797/mês',
  },
} as const

export type PlanKey = keyof typeof PLANS
