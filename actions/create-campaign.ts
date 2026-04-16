'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import {
  getMyPages,
  createCampaign,
  createAdSet,
  createAdCreative,
  createAd,
  uploadAdImage,
  assertAdAccountReady,
  MetaRateLimitError,
  MetaApiError,
  translateMetaError,
  type CampaignCreationStep,
  type CampaignObjective,
  type OptimizationGoal,
  type CallToActionType,
  type MetaFacebookPage,
} from '@/lib/meta-api'
import type { ActionResult } from './ad-accounts'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreateCampaignInput {
  // Passo 1: Detalhes da campanha
  campaignName: string
  objective: CampaignObjective
  dailyBudgetBRL: number           // em R$ (ex: 50 = R$50/dia)
  startPaused?: boolean            // padrão false — cria ativa

  // Passo 2: Público-alvo
  ageMin?: number
  ageMax?: number
  genders?: ('all' | 'male' | 'female')
  countries?: string[]
  interests?: Array<{ id: string; name: string }>
  optimizationGoal?: OptimizationGoal

  // Passo 3: Criativo
  pageId: string
  headline: string
  primaryText: string
  destinationUrl: string
  description?: string
  callToAction?: CallToActionType
  imageUrl?: string               // URL de imagem para upload; opcional
}

export interface CreateCampaignResult {
  metaCampaignId: string
  metaAdSetId: string
  metaCreativeId: string
  metaAdId: string
  campaignDbId: string            // ID no banco do FunnelGuard
  dashboardUrl: string
}

// ─── Buscar páginas disponíveis ───────────────────────────────────────────────

export async function getMyPagesAction(): Promise<ActionResult<MetaFacebookPage[]>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const bm = await prisma.businessManager.findFirst({
    where: { userId: session.user.id },
  })
  if (!bm) return { success: false, error: 'Nenhuma conta Meta conectada. Conecte sua conta em Configurações.' }

  try {
    const token = decrypt(bm.accessTokenEnc)
    const pages = await getMyPages(token, bm.metaBmId)
    return { success: true, data: pages }
  } catch (err) {
    return { success: false, error: `Erro ao buscar páginas: ${err instanceof Error ? err.message : String(err)}` }
  }
}

// ─── Action principal — cria campanha completa na Meta ────────────────────────

export async function createCampaignAction(
  input: CreateCampaignInput
): Promise<ActionResult<CreateCampaignResult>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  // Validações básicas
  if (!input.campaignName?.trim()) return { success: false, error: 'Nome da campanha é obrigatório' }
  if (!input.pageId) return { success: false, error: 'Selecione uma Página do Facebook' }
  if (!input.headline?.trim()) return { success: false, error: 'Headline é obrigatória' }
  if (!input.primaryText?.trim()) return { success: false, error: 'Texto principal é obrigatório' }
  if (!input.destinationUrl?.startsWith('https://')) return { success: false, error: 'URL de destino deve começar com https:// (exigido pela Meta)' }
  if (input.dailyBudgetBRL < 5) return { success: false, error: 'Orçamento mínimo: R$5,00/dia' }
  if (input.imageUrl) {
    const isImageUrl = /\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i.test(input.imageUrl)
    if (!isImageUrl) {
      return { success: false, error: 'A URL da imagem deve apontar diretamente para um arquivo de imagem (.jpg, .png, .webp, etc.). Não use links de páginas web.' }
    }
  }

  // Objetivos de otimização que requerem configuração extra não disponível
  if (input.optimizationGoal === 'LEAD_GENERATION') {
    return { success: false, error: 'O objetivo "Geração de Leads" requer um Formulário de Lead vinculado, que ainda não é suportado nesta versão. Use "Cliques no Link" ou crie a campanha diretamente no Meta Ads Manager.' }
  }
  if (input.optimizationGoal === 'CONVERSIONS') {
    return { success: false, error: 'O objetivo "Conversões" requer um Pixel Meta configurado na conta. Acesse Configurações → Pixel para conectar seu pixel antes de usar este objetivo.' }
  }

  // Busca conta Meta do usuário
  const bm = await prisma.businessManager.findFirst({
    where: { userId: session.user.id },
    include: { adAccounts: { take: 1 } },
  })

  if (!bm) return { success: false, error: 'Nenhuma conta Meta conectada. Vá em Configurações e conecte sua conta.' }
  if (!bm.adAccounts.length) return { success: false, error: 'Nenhuma conta de anúncio encontrada. Sincronize suas Ad Accounts primeiro.' }

  const adAccount = bm.adAccounts[0]
  const metaAccountId = adAccount.metaAccountId
  // Meta exige formato "act_XXXXX"
  const actAccountId = metaAccountId.startsWith('act_') ? metaAccountId : `act_${metaAccountId}`
  const accessToken = decrypt(bm.accessTokenEnc)

  const budgetCents = Math.round(input.dailyBudgetBRL * 100)
  const campaignStatus = input.startPaused ? 'PAUSED' : 'ACTIVE'

  const genderMap = {
    all: undefined,
    male: [1] as (1 | 2)[],
    female: [2] as (1 | 2)[],
  }

  let step: CampaignCreationStep = 'campanha'
  let metaCampaignId = ''
  let metaAdSetId = ''
  let metaCreativeId = ''
  let metaAdId = ''

  try {
    // ── 0. Verificar conta antes de qualquer chamada de criação ────────────
    await assertAdAccountReady(actAccountId, accessToken)

    // ── 1. Criar Campanha ──────────────────────────────────────────────────
    step = 'campanha'
    metaCampaignId = await createCampaign(
      actAccountId,
      {
        name: input.campaignName,
        objective: input.objective,
        status: campaignStatus,
        specialAdCategories: [],
      },
      accessToken
    )

    // ── 2. Criar Conjunto de Anúncios ──────────────────────────────────────
    step = 'conjunto de anúncios'
    metaAdSetId = await createAdSet(
      actAccountId,
      {
        name: `${input.campaignName} — Conjunto 1`,
        campaignId: metaCampaignId,
        dailyBudgetCents: budgetCents,
        optimizationGoal: input.optimizationGoal ?? 'LINK_CLICKS',
        status: campaignStatus,
        targeting: {
          ageMin: input.ageMin ?? 18,
          ageMax: input.ageMax ?? 65,
          genders: genderMap[input.genders ?? 'all'],
          countries: input.countries ?? ['BR'],
          interests: input.interests,
        },
      },
      accessToken
    )

    // ── 3. Upload de imagem (opcional) ────────────────────────────────────
    let imageHash: string | undefined
    if (input.imageUrl) {
      try {
        imageHash = await uploadAdImage(actAccountId, input.imageUrl, accessToken)
      } catch {
        // Não falha a criação por erro de imagem — continua sem ela
        console.warn('[createCampaign] Falha ao fazer upload de imagem; continuando sem ela')
      }
    }

    // ── 4. Criar Criativo ─────────────────────────────────────────────────
    step = 'criativo'
    metaCreativeId = await createAdCreative(
      actAccountId,
      {
        name: `${input.campaignName} — Criativo 1`,
        pageId: input.pageId,
        message: input.primaryText,
        link: input.destinationUrl,
        headline: input.headline,
        description: input.description,
        callToAction: input.callToAction ?? 'LEARN_MORE',
        imageHash,
      },
      accessToken
    )

    // ── 5. Criar Anúncio ──────────────────────────────────────────────────
    step = 'anúncio'
    metaAdId = await createAd(
      actAccountId,
      {
        name: `${input.campaignName} — Anúncio 1`,
        adSetId: metaAdSetId,
        creativeId: metaCreativeId,
        status: campaignStatus,
      },
      accessToken
    )

    // ── 6. Salvar no banco local ───────────────────────────────────────────
    const dbCampaign = await prisma.campaign.create({
      data: {
        adAccountId: adAccount.id,
        metaCampaignId,
        name: input.campaignName,
        status: campaignStatus,
        dailyBudget: input.dailyBudgetBRL,
        spend: 0,
        impressions: 0,
        clicks: 0,
        conversions: 0,
        revenue: 0,
        roas: 0,
        cpm: 0,
        frequency: 0,
        aiAutoPilot: false, // usuário ativa manualmente
        metricsUpdatedAt: new Date(),
        lastAiAction: 'Campanha criada pelo FunnelGuard AI',
        lastAiActionAt: new Date(),
      },
    })

    return {
      success: true,
      data: {
        metaCampaignId,
        metaAdSetId,
        metaCreativeId,
        metaAdId,
        campaignDbId: dbCampaign.id,
        dashboardUrl: `/dashboard/campanhas`,
      },
    }
  } catch (err) {
    if (err instanceof MetaRateLimitError) {
      return { success: false, error: `Rate limit da Meta. Aguarde ${err.retryAfter}s e tente novamente.` }
    }
    if (err instanceof MetaApiError) {
      const friendly = translateMetaError(err.code, err.subcode, step)
      const traceInfo = err.fbtrace ? ` (trace: ${err.fbtrace})` : ''
      console.error(`[createCampaignAction] Falha na etapa "${step}" — code=${err.code} subcode=${err.subcode}${err.fbtrace ? ` trace=${err.fbtrace}` : ''}`)
      return {
        success: false,
        error: friendly
          ? `Erro na etapa "${step}": ${friendly} | Detalhe Meta: ${err.message}`
          : `Erro ao criar ${step} na Meta: ${err.message}`,
      }
    }
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[createCampaignAction] Falha na etapa "${step}":`, err)
    return { success: false, error: `Erro ao criar ${step} na Meta: ${msg}` }
  }
}
