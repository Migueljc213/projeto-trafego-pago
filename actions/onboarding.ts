'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface OnboardingStatus {
  step: number                 // 0 = não iniciado, 1, 2, 3 = completo
  hasCompletedOnboarding: boolean
  hasFacebookConnected: boolean
  hasAdAccount: boolean
  hasTargetRoas: boolean
  hasCompetitors: boolean
  targetRoas: number | null
}

// ─── Query ────────────────────────────────────────────────────────────────────

export async function getOnboardingStatusAction(): Promise<OnboardingStatus> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return {
      step: 0,
      hasCompletedOnboarding: false,
      hasFacebookConnected: false,
      hasAdAccount: false,
      hasTargetRoas: false,
      hasCompetitors: false,
      targetRoas: null,
    }
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      hasCompletedOnboarding: true,
      onboardingStep: true,
      targetRoas: true,
      businessManagers: {
        select: {
          id: true,
          adAccounts: {
            select: {
              id: true,
              competitors: { select: { id: true }, take: 1 },
            },
            take: 1,
          },
        },
        take: 1,
      },
    },
  })

  if (!user) {
    return {
      step: 0,
      hasCompletedOnboarding: false,
      hasFacebookConnected: false,
      hasAdAccount: false,
      hasTargetRoas: false,
      hasCompetitors: false,
      targetRoas: null,
    }
  }

  const bm = user.businessManagers[0]
  const adAccount = bm?.adAccounts[0]

  const hasFacebookConnected = !!bm
  const hasAdAccount = !!adAccount
  const hasTargetRoas = user.targetRoas != null
  const hasCompetitors = (adAccount?.competitors.length ?? 0) > 0

  return {
    step: user.onboardingStep,
    hasCompletedOnboarding: user.hasCompletedOnboarding,
    hasFacebookConnected,
    hasAdAccount,
    hasTargetRoas,
    hasCompetitors,
    targetRoas: user.targetRoas,
  }
}

// ─── Step 1: Facebook Connected ───────────────────────────────────────────────

/**
 * Chamado automaticamente quando o OAuth do Facebook é detectado no layout.
 * Avança o usuário para o passo 2 se ele estiver no passo 0 ou 1.
 */
export async function advanceToStep2Action(): Promise<{ success: boolean }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { onboardingStep: 2 },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Step 2: Ad Account + Target ROAS ────────────────────────────────────────

export interface Step2Payload {
  adAccountId: string   // id interno (prisma) da AdAccount selecionada
  targetRoas: number
}

export async function completeStep2Action(
  payload: Step2Payload
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  if (payload.targetRoas < 0.5 || payload.targetRoas > 50) {
    return { success: false, error: 'Target ROAS deve estar entre 0.5 e 50' }
  }

  // Verifica que a conta pertence ao usuário
  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: payload.adAccountId,
      businessManager: { userId: session.user.id },
    },
  })

  if (!adAccount) {
    return { success: false, error: 'Conta de anúncio não encontrada' }
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      targetRoas: payload.targetRoas,
      onboardingStep: 3,
    },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Step 3: Adicionar Concorrentes ──────────────────────────────────────────

export interface Step3Payload {
  competitorUrls: Array<{ name: string; url: string }>
  adAccountId: string
}

export async function completeStep3Action(
  payload: Step3Payload
): Promise<{ success: boolean; error?: string }> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  if (payload.competitorUrls.length === 0) {
    return { success: false, error: 'Adicione pelo menos 1 concorrente' }
  }

  // Verifica que a conta pertence ao usuário
  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: payload.adAccountId,
      businessManager: { userId: session.user.id },
    },
  })

  if (!adAccount) {
    return { success: false, error: 'Conta não encontrada' }
  }

  // Cria os concorrentes
  await prisma.competitor.createMany({
    data: payload.competitorUrls.map((c) => ({
      adAccountId: payload.adAccountId,
      name: c.name,
      url: c.url,
    })),
    skipDuplicates: true,
  })

  // Marca onboarding como completo
  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      onboardingStep: 3,
      hasCompletedOnboarding: true,
    },
  })

  revalidatePath('/dashboard')
  return { success: true }
}

// ─── Skip ─────────────────────────────────────────────────────────────────────

export async function skipOnboardingAction(): Promise<void> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return

  await prisma.user.update({
    where: { id: session.user.id },
    data: { hasCompletedOnboarding: true },
  })

  revalidatePath('/dashboard')
}
