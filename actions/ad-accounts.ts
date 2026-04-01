'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getAdAccounts } from '@/lib/meta-api'
import { ConnectAdAccountSchema } from '@/lib/validations'
import type { z } from 'zod'

export interface ActionResult<T> {
  success: boolean
  data?: T
  error?: string
}

/**
 * Lista as contas de anúncio disponíveis na Business Manager do usuário logado.
 * Descriptografa o token apenas no servidor — nunca exposto ao cliente.
 */
export async function listAdAccountsAction(): Promise<
  ActionResult<
    Array<{
      id: string
      metaAccountId: string
      name: string
      currency: string
      timezone: string
      status: number
    }>
  >
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: 'Não autenticado' }
  }

  try {
    const bm = await prisma.businessManager.findFirst({
      where: { userId: session.user.id },
    })

    if (!bm) {
      return { success: false, error: 'Nenhuma Business Manager conectada' }
    }

    // Descriptografa token — apenas no servidor
    const accessToken = decrypt(bm.accessTokenEnc)

    // Busca contas na Meta API
    const metaAccounts = await getAdAccounts(bm.metaBmId, accessToken)

    // Salva/atualiza no banco
    const savedAccounts = await Promise.all(
      metaAccounts.map(async (acc) => {
        return prisma.adAccount.upsert({
          where: { metaAccountId: acc.id },
          create: {
            businessManagerId: bm.id,
            metaAccountId: acc.id,
            name: acc.name,
            currency: acc.currency ?? 'BRL',
            timezone: acc.timezone_name ?? 'America/Sao_Paulo',
            status: acc.account_status ?? 1,
          },
          update: {
            name: acc.name,
            status: acc.account_status ?? 1,
          },
        })
      })
    )

    return {
      success: true,
      data: savedAccounts.map((a) => ({
        id: a.id,
        metaAccountId: a.metaAccountId,
        name: a.name,
        currency: a.currency,
        timezone: a.timezone,
        status: a.status,
      })),
    }
  } catch (error) {
    console.error('[listAdAccounts]', error)
    if (error instanceof Error && error.name === 'MetaRateLimitError') {
      return {
        success: false,
        error:
          'Limite de requisições da Meta atingido. Tente novamente em instantes.',
      }
    }
    return { success: false, error: 'Erro ao buscar contas de anúncio' }
  }
}

/**
 * Conecta manualmente uma conta de anúncio específica ao usuário.
 */
export async function connectAdAccountAction(
  input: z.infer<typeof ConnectAdAccountSchema>
): Promise<ActionResult<{ id: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: 'Não autenticado' }
  }

  const validated = ConnectAdAccountSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  try {
    const bm = await prisma.businessManager.findFirst({
      where: { userId: session.user.id },
    })
    if (!bm) {
      return { success: false, error: 'Nenhuma Business Manager conectada' }
    }

    const account = await prisma.adAccount.upsert({
      where: { metaAccountId: validated.data.metaAccountId },
      create: {
        businessManagerId: bm.id,
        metaAccountId: validated.data.metaAccountId,
        name: validated.data.name,
        currency: validated.data.currency,
        timezone: validated.data.timezone,
        status: 1,
      },
      update: { name: validated.data.name },
    })

    return { success: true, data: { id: account.id } }
  } catch (error) {
    console.error('[connectAdAccount]', error)
    return { success: false, error: 'Erro ao conectar conta' }
  }
}
