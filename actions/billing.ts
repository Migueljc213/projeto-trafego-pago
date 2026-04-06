'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, PLANS, type PlanKey } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'

export async function createCheckoutSession(plan: PlanKey) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Não autenticado')

  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) throw new Error('Usuário não encontrado')

  const priceId = PLANS[plan].priceId
  if (!priceId) throw new Error(`Preço do plano ${plan} não configurado`)

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    payment_method_types: ['card'],
    customer_email: user.email ?? undefined,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${process.env.NEXTAUTH_URL}/dashboard?upgraded=true`,
    cancel_url: `${process.env.NEXTAUTH_URL}/dashboard/configuracoes`,
    metadata: {
      userId: session.user.id,
      plan,
      priceId,
    },
  })

  redirect(checkoutSession.url!)
}

export async function createPortalSession() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) throw new Error('Não autenticado')

  const subscription = await prisma.subscription.findUnique({
    where: { userId: session.user.id },
  })
  if (!subscription?.stripeCustomerId) throw new Error('Sem assinatura ativa')

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: subscription.stripeCustomerId,
    return_url: `${process.env.NEXTAUTH_URL}/dashboard/configuracoes`,
  })

  redirect(portalSession.url)
}

export async function getUserPlan(userId: string) {
  const sub = await prisma.subscription.findUnique({ where: { userId } })
  if (!sub || sub.status !== 'active') return null
  return sub.plan as PlanKey
}
