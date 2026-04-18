'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import type { ActionResult } from './ad-accounts'

/**
 * Salva o Pixel ID e nome na AdAccount do usuário.
 * adAccountId opcional — se omitido, usa a primeira conta do usuário.
 */
export async function savePixelAction(input: {
  pixelId: string
  pixelName: string
  adAccountId?: string
}): Promise<ActionResult<{ pixelId: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  if (!input.pixelId?.trim()) return { success: false, error: 'Pixel ID é obrigatório' }

  const adAccount = await prisma.adAccount.findFirst({
    where: input.adAccountId
      ? { id: input.adAccountId, businessManager: { userId: session.user.id } }
      : { businessManager: { userId: session.user.id } },
  })

  if (!adAccount) return { success: false, error: 'Conta de anúncio não encontrada' }

  await prisma.adAccount.update({
    where: { id: adAccount.id },
    data: {
      pixelId: input.pixelId.trim(),
      pixelName: input.pixelName.trim() || input.pixelId.trim(),
    },
  })

  return { success: true, data: { pixelId: input.pixelId.trim() } }
}

/** Remove o Pixel vinculado à conta de anúncio. */
export async function removePixelAction(adAccountId?: string): Promise<ActionResult<null>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const adAccount = await prisma.adAccount.findFirst({
    where: adAccountId
      ? { id: adAccountId, businessManager: { userId: session.user.id } }
      : { businessManager: { userId: session.user.id } },
  })

  if (!adAccount) return { success: false, error: 'Conta de anúncio não encontrada' }

  await prisma.adAccount.update({
    where: { id: adAccount.id },
    data: { pixelId: null, pixelName: null },
  })

  return { success: true, data: null }
}
