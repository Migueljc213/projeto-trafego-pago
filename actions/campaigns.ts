'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { updateCampaignStatus, MetaRateLimitError } from '@/lib/meta-api'
import { ToggleAutoPilotSchema } from '@/lib/validations'
import type { z } from 'zod'
import type { ActionResult } from './ad-accounts'

/**
 * Ativa ou desativa o AI Auto-Pilot de uma campanha.
 * Quando desativado: pausa a campanha na Meta se estiver ativa.
 * Quando ativado: retoma a campanha na Meta.
 * Token de acesso NUNCA é enviado ao cliente.
 */
export async function toggleAutoPilotAction(
  input: z.infer<typeof ToggleAutoPilotSchema>
): Promise<
  ActionResult<{
    campaignId: string
    enabled: boolean
    syncedWithMeta: boolean
  }>
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: 'Não autenticado' }
  }

  const validated = ToggleAutoPilotSchema.safeParse(input)
  if (!validated.success) {
    return { success: false, error: validated.error.issues[0]?.message ?? 'Dados inválidos' }
  }

  const { campaignId, enabled } = validated.data

  try {
    // Verifica que a campanha pertence ao usuário logado
    const campaign = await prisma.campaign.findFirst({
      where: { id: campaignId },
      include: {
        adAccount: {
          include: {
            businessManager: true,
          },
        },
      },
    })

    if (
      !campaign ||
      campaign.adAccount.businessManager.userId !== session.user.id
    ) {
      return {
        success: false,
        error: 'Campanha não encontrada ou sem permissão',
      }
    }

    let syncedWithMeta = false

    // Sincroniza status com a Meta API
    try {
      const accessToken = decrypt(
        campaign.adAccount.businessManager.accessTokenEnc
      )
      const metaStatus = enabled ? 'ACTIVE' : 'PAUSED'
      syncedWithMeta = await updateCampaignStatus(
        campaign.metaCampaignId,
        metaStatus,
        accessToken
      )
    } catch (metaError) {
      if (metaError instanceof MetaRateLimitError) {
        return {
          success: false,
          error: `Rate limit da Meta. Tente novamente em ${metaError.retryAfter}s`,
        }
      }
      // Não falha a operação por erro de sync — atualiza DB mesmo assim
      console.warn('[toggleAutoPilot] Meta sync failed:', metaError)
    }

    // Atualiza no banco com registro da ação da IA
    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        aiAutoPilot: enabled,
        status: enabled ? 'ACTIVE' : 'PAUSED',
        lastAiAction: enabled
          ? 'Auto-Pilot ativado pelo usuário'
          : 'Auto-Pilot desativado — campanha pausada',
        lastAiActionAt: new Date(),
      },
    })

    return {
      success: true,
      data: {
        campaignId: updated.id,
        enabled: updated.aiAutoPilot,
        syncedWithMeta,
      },
    }
  } catch (error) {
    console.error('[toggleAutoPilot]', error)
    return { success: false, error: 'Erro interno ao atualizar campanha' }
  }
}

/**
 * Lista todas as campanhas de uma conta de anúncio do usuário logado.
 */
export async function listCampaignsAction(
  adAccountId: string
): Promise<
  ActionResult<
    Array<{
      id: string
      name: string
      status: string
      roas: number
      spend: number
      clicks: number
      conversions: number
      frequency: number
      aiAutoPilot: boolean
      lastAiAction: string | null
      lastAiActionAt: Date | null
    }>
  >
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: 'Não autenticado' }
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: {
        adAccountId,
        adAccount: {
          businessManager: {
            userId: session.user.id,
          },
        },
      },
      orderBy: { spend: 'desc' },
    })

    return {
      success: true,
      data: campaigns.map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        roas: c.roas,
        spend: c.spend,
        clicks: c.clicks,
        conversions: c.conversions,
        frequency: c.frequency,
        aiAutoPilot: c.aiAutoPilot,
        lastAiAction: c.lastAiAction,
        lastAiActionAt: c.lastAiActionAt,
      })),
    }
  } catch (error) {
    console.error('[listCampaigns]', error)
    return { success: false, error: 'Erro ao buscar campanhas' }
  }
}
