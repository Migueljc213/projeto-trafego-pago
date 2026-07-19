'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getBusinesses, type MetaBusiness } from '@/lib/meta-api'
import type { ActionResult } from './ad-accounts'

/**
 * Lista as Business Managers reais do usuário na Meta (próprias ou como parceiro/agência).
 * Usada para o usuário escolher qual BM conectar ao FunnelGuard AI.
 */
export async function listBusinessesAction(): Promise<ActionResult<MetaBusiness[]>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  try {
    const bm = await prisma.businessManager.findFirst({
      where: { userId: session.user.id },
    })
    if (!bm) return { success: false, error: 'Nenhuma conta Meta conectada. Conecte sua conta primeiro.' }

    const accessToken = decrypt(bm.accessTokenEnc)
    const businesses = await getBusinesses(accessToken)
    return { success: true, data: businesses }
  } catch (error) {
    console.error('[listBusinesses]', error)
    return { success: false, error: 'Erro ao buscar Business Managers na Meta' }
  }
}

/**
 * Define qual Business Manager real fica vinculada ao usuário.
 * Substitui o metaBmId (inicialmente o ID do perfil pessoal) pelo ID real do BM escolhido.
 */
export async function selectBusinessManagerAction(
  businessId: string,
  businessName: string
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  if (!businessId?.trim() || !businessName?.trim()) {
    return { success: false, error: 'Business Manager inválida' }
  }

  try {
    const bm = await prisma.businessManager.findFirst({
      where: { userId: session.user.id },
    })
    if (!bm) return { success: false, error: 'Nenhuma conta Meta conectada' }

    const updated = await prisma.businessManager.update({
      where: { id: bm.id },
      data: { metaBmId: businessId, name: businessName },
    })

    return { success: true, data: { id: updated.id } }
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as { code?: string }).code === 'P2002') {
      return { success: false, error: 'Este Business Manager já está conectado a outra conta FunnelGuard AI.' }
    }
    console.error('[selectBusinessManager]', error)
    return { success: false, error: 'Erro ao selecionar Business Manager' }
  }
}
