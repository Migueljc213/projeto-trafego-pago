import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { PLANS } from '@/lib/stripe'
import { CheckoutButton, PortalButton } from './PlanButtons'
import { Check, Zap } from 'lucide-react'

export const metadata = { title: 'Planos | FunnelGuard AI' }

export default async function PlanosPage() {
  const session = await getServerSession(authOptions)
  const subscription = session?.user?.id
    ? await prisma.subscription.findUnique({ where: { userId: session.user.id } })
    : null

  const currentPlan = subscription?.status === 'active' ? subscription.plan : null

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Escolha seu plano</h1>
        <p className="text-sm text-gray-400 mt-2">
          Cancele a qualquer momento. Sem multa.
        </p>
      </div>

      {/* Banner plano ativo */}
      {currentPlan && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-neon-cyan/10 border border-neon-cyan/20">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-neon-cyan" />
            <div>
              <p className="text-sm font-semibold text-white">
                Plano {PLANS[currentPlan as keyof typeof PLANS]?.name ?? currentPlan} ativo
              </p>
              {subscription?.currentPeriodEnd && (
                <p className="text-xs text-gray-400">
                  Renova em {subscription.currentPeriodEnd.toLocaleDateString('pt-BR')}
                </p>
              )}
            </div>
          </div>
          <PortalButton />
        </div>
      )}

      {/* Cards de planos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {(Object.entries(PLANS) as [keyof typeof PLANS, typeof PLANS[keyof typeof PLANS]][]).map(
          ([key, plan]) => {
            const isCurrentPlan = currentPlan === key
            const isPro = key === 'pro'

            return (
              <div
                key={key}
                className={`relative glass-card rounded-2xl p-6 border flex flex-col ${
                  isPro
                    ? 'border-neon-cyan/40 bg-gradient-to-b from-neon-cyan/5 to-transparent'
                    : 'border-gray-800'
                }`}
              >
                {isPro && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-neon-cyan text-black">
                      Mais popular
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <p className="text-sm font-medium text-gray-400 mb-1">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-4xl font-bold text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">/mês</span>
                  </div>
                  <p className="text-sm text-gray-400">{plan.description}</p>
                </div>

                <ul className="space-y-3 flex-1 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2.5">
                      <Check className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>

                {isCurrentPlan ? (
                  <div className="w-full py-3 rounded-xl text-center text-sm font-semibold bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20">
                    Plano atual
                  </div>
                ) : (
                  <CheckoutButton plan={key} isPro={isPro} />
                )}
              </div>
            )
          }
        )}
      </div>

      {/* Garantia */}
      <p className="text-center text-xs text-gray-500">
        🔒 Pagamento seguro via Stripe &nbsp;·&nbsp; Cancele em até 7 dias para reembolso total
      </p>
    </div>
  )
}
