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
    priceId: process.env.STRIPE_PRICE_ID_STARTER ?? '',
    maxAdAccounts: 1,
    price: 'R$ 197',
    description: 'Para quem está começando a escalar',
    features: [
      '1 conta de anúncio',
      'AI Auto-Pilot (pause e escala automática)',
      'Monitor de preços (5 concorrentes)',
      'Auditoria de Landing Page',
      'Alertas por email',
      'Dashboard completo',
    ],
  },
  pro: {
    name: 'Pro',
    priceId: process.env.STRIPE_PRICE_ID_PRO ?? '',
    maxAdAccounts: 5,
    price: 'R$ 397',
    description: 'Para gestores e agências em crescimento',
    features: [
      '5 contas de anúncio',
      'Tudo do Starter',
      'Análise de criativos com GPT-4o Vision',
      'Monitor de preços ilimitado',
      'Relatórios avançados',
      'Suporte prioritário',
    ],
  },
} as const

export type PlanKey = keyof typeof PLANS
