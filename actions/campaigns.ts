'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { updateCampaignStatus, updateCampaignBudget, getCampaigns, getCampaignInsights, getDailyCampaignInsights, MetaRateLimitError, type InsightDateRange } from '@/lib/meta-api'
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
 * Sincroniza campanhas e métricas da Meta API para o banco local.
 * Substitui o botão "Sincronizar Agora" na página de Campanhas.
 */
export async function syncMetaCampaignsAction(): Promise<
  ActionResult<{ synced: number; updated: number }>
> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  try {
    const bm = await prisma.businessManager.findFirst({
      where: { userId: session.user.id },
      include: { adAccounts: true },
    })

    if (!bm) return { success: false, error: 'Nenhuma conta Meta conectada' }

    if (!bm.accessTokenEnc) {
      return { success: false, error: 'Token Meta não configurado — conecte sua conta nas Configurações' }
    }

    let accessToken: string
    try {
      accessToken = decrypt(bm.accessTokenEnc)
    } catch {
      return { success: false, error: 'Token Meta inválido — reconecte sua conta nas Configurações' }
    }

    let synced = 0
    let updated = 0

    // Últimos 30 dias como janela padrão de métricas
    const now = new Date()
    const thirtyDaysAgo = new Date(now)
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    const dateRange: InsightDateRange = {
      since: thirtyDaysAgo.toISOString().split('T')[0],
      until: now.toISOString().split('T')[0],
    }

    for (const adAccount of bm.adAccounts) {
      const campaigns = await getCampaigns(adAccount.metaAccountId, accessToken)

      for (const c of campaigns) {
        // Busca insights agregados com date range e campos expandidos
        const insights = await getCampaignInsights(c.id, accessToken, dateRange).catch(() => null)

        const spend = insights ? parseFloat(insights.spend ?? '0') : 0
        const impressions = insights ? parseInt(insights.impressions ?? '0', 10) : 0
        const clicks = insights ? parseInt(insights.clicks ?? '0', 10) : 0
        const conversions = insights
          ? parseInt(
              (insights.actions?.find(
                a => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
              ))?.value ?? '0',
              10
            )
          : 0
        const revenue = insights
          ? parseFloat(insights.purchase_roas?.[0]?.value ?? '0') * spend
          : 0
        const roas = spend > 0 ? revenue / spend : 0
        const frequency = insights ? parseFloat(insights.frequency ?? '0') : 0
        const cpm = insights ? parseFloat(insights.cpm ?? '0') : 0

        const existing = await prisma.campaign.findUnique({
          where: { metaCampaignId: c.id },
        })

        let campaignDbId: string

        if (existing) {
          await prisma.campaign.update({
            where: { metaCampaignId: c.id },
            data: {
              name: c.name,
              status: c.status as 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED',
              dailyBudget: c.daily_budget ? Number(c.daily_budget) / 100 : existing.dailyBudget,
              spend, impressions, clicks, conversions, revenue, roas, frequency, cpm,
              metricsUpdatedAt: new Date(),
            },
          })
          campaignDbId = existing.id
          updated++
        } else {
          const created = await prisma.campaign.create({
            data: {
              adAccountId: adAccount.id,
              metaCampaignId: c.id,
              name: c.name,
              status: c.status as 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED',
              dailyBudget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
              spend, impressions, clicks, conversions, revenue, roas, frequency, cpm,
              metricsUpdatedAt: new Date(),
            },
          })
          campaignDbId = created.id
          synced++
        }

        // Busca e salva série temporal diária (últimos 30 dias)
        const dailyData = await getDailyCampaignInsights(c.id, accessToken, dateRange).catch(() => [])
        for (const day of dailyData) {
          const daySpend = parseFloat(day.spend ?? '0')
          const dayConversions = parseInt(
            (day.actions?.find(
              a => a.action_type === 'purchase' || a.action_type === 'offsite_conversion.fb_pixel_purchase'
            ))?.value ?? '0',
            10
          )
          const dayRevenue = parseFloat(day.purchase_roas?.[0]?.value ?? '0') * daySpend
          await prisma.dailyInsight.upsert({
            where: { campaignId_date: { campaignId: campaignDbId, date: new Date(day.date_start) } },
            create: {
              campaignId: campaignDbId,
              date: new Date(day.date_start),
              spend: daySpend,
              impressions: parseInt(day.impressions ?? '0', 10),
              clicks: parseInt(day.clicks ?? '0', 10),
              conversions: dayConversions,
              revenue: dayRevenue,
              roas: daySpend > 0 ? dayRevenue / daySpend : 0,
              cpa: dayConversions > 0 ? daySpend / dayConversions : 0,
              frequency: parseFloat(day.frequency ?? '0'),
            },
            update: {
              spend: daySpend,
              impressions: parseInt(day.impressions ?? '0', 10),
              clicks: parseInt(day.clicks ?? '0', 10),
              conversions: dayConversions,
              revenue: dayRevenue,
              roas: daySpend > 0 ? dayRevenue / daySpend : 0,
              cpa: dayConversions > 0 ? daySpend / dayConversions : 0,
              frequency: parseFloat(day.frequency ?? '0'),
            },
          })
        }
      }
    }

    return { success: true, data: { synced, updated } }
  } catch (error) {
    if (error instanceof MetaRateLimitError) {
      return { success: false, error: `Rate limit da Meta. Tente em ${error.retryAfter}s` }
    }
    console.error('[syncMetaCampaigns]', error)
    return { success: false, error: 'Erro ao sincronizar campanhas com a Meta' }
  }
}

/**
 * Atualiza o orçamento diário de uma campanha (no banco e na Meta API).
 */
export async function updateCampaignBudgetAction(input: {
  campaignId: string
  dailyBudgetBRL: number
}): Promise<ActionResult<{ campaignId: string; dailyBudget: number }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  if (input.dailyBudgetBRL < 5) {
    return { success: false, error: 'Orçamento mínimo é R$5,00/dia' }
  }

  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: input.campaignId,
        adAccount: { businessManager: { userId: session.user.id } },
      },
      include: {
        adAccount: { include: { businessManager: true } },
      },
    })

    if (!campaign) return { success: false, error: 'Campanha não encontrada' }

    const bm = campaign.adAccount.businessManager
    const budgetCents = Math.round(input.dailyBudgetBRL * 100)

    // Atualiza na Meta API
    let syncedWithMeta = false
    if (bm.accessTokenEnc) {
      try {
        const accessToken = decrypt(bm.accessTokenEnc)
        syncedWithMeta = await updateCampaignBudget(campaign.metaCampaignId, budgetCents, accessToken)
      } catch {
        // Não falha se a Meta rejeitar — persiste localmente mesmo assim
      }
    }

    // Atualiza no banco
    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: { dailyBudget: input.dailyBudgetBRL },
    })

    return {
      success: true,
      data: { campaignId: updated.id, dailyBudget: updated.dailyBudget ?? input.dailyBudgetBRL },
    }
  } catch (err) {
    if (err instanceof MetaRateLimitError) {
      return { success: false, error: `Rate limit da Meta. Tente em ${err.retryAfter}s` }
    }
    console.error('[updateCampaignBudget]', err)
    return { success: false, error: 'Erro ao atualizar orçamento' }
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
      data: campaigns.map((c: (typeof campaigns)[number]) => ({
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

/**
 * Pausa ou ativa uma campanha manualmente pelo usuário.
 * Sincroniza com a Meta API e atualiza o banco.
 */
export async function toggleCampaignStatusAction(input: {
  campaignId: string
  newStatus: 'ACTIVE' | 'PAUSED'
}): Promise<ActionResult<{ campaignId: string; status: string }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  try {
    const campaign = await prisma.campaign.findFirst({
      where: {
        id: input.campaignId,
        adAccount: { businessManager: { userId: session.user.id } },
      },
      include: { adAccount: { include: { businessManager: true } } },
    })

    if (!campaign) return { success: false, error: 'Campanha não encontrada' }

    const encryptedToken = campaign.adAccount.businessManager.accessTokenEnc
    if (encryptedToken) {
      try {
        const accessToken = decrypt(encryptedToken)
        await updateCampaignStatus(campaign.metaCampaignId, input.newStatus, accessToken)
      } catch (metaErr) {
        if (metaErr instanceof MetaRateLimitError) {
          return { success: false, error: `Rate limit da Meta. Tente em ${metaErr.retryAfter}s` }
        }
        console.warn('[toggleCampaignStatus] Meta sync failed:', metaErr)
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: campaign.id },
      data: {
        status: input.newStatus,
        lastAiAction: input.newStatus === 'PAUSED'
          ? 'Pausada manualmente pelo usuário'
          : 'Ativada manualmente pelo usuário',
        lastAiActionAt: new Date(),
      },
    })

    return { success: true, data: { campaignId: updated.id, status: updated.status } }
  } catch (err) {
    console.error('[toggleCampaignStatus]', err)
    return { success: false, error: 'Erro ao atualizar status da campanha' }
  }
}
