const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'

// ──────────────────────────────────────────
// Campaign creation types
// ──────────────────────────────────────────

export type CampaignObjective =
  | 'OUTCOME_TRAFFIC'
  | 'OUTCOME_SALES'
  | 'OUTCOME_LEADS'
  | 'OUTCOME_AWARENESS'
  | 'OUTCOME_ENGAGEMENT'
  | 'OUTCOME_APP_PROMOTION'

export type OptimizationGoal =
  | 'LINK_CLICKS'
  | 'LANDING_PAGE_VIEWS'
  | 'CONVERSIONS'
  | 'REACH'
  | 'IMPRESSIONS'
  | 'LEAD_GENERATION'

export type CallToActionType =
  | 'SHOP_NOW'
  | 'LEARN_MORE'
  | 'SIGN_UP'
  | 'CONTACT_US'
  | 'SUBSCRIBE'
  | 'DOWNLOAD'
  | 'GET_OFFER'
  | 'BOOK_TRAVEL'

export interface CreateCampaignParams {
  name: string
  objective: CampaignObjective
  status: 'ACTIVE' | 'PAUSED'
  specialAdCategories?: string[] // ex: ['CREDIT', 'EMPLOYMENT', 'HOUSING'] — deixe [] para evitar restrições
}

export interface CreateAdSetParams {
  name: string
  campaignId: string
  dailyBudgetCents: number        // ex: 5000 = R$50,00
  optimizationGoal: OptimizationGoal
  billingEvent?: 'IMPRESSIONS' | 'LINK_CLICKS'
  bidStrategy?: 'LOWEST_COST_WITHOUT_CAP' | 'COST_CAP'
  targeting: {
    ageMin?: number               // padrão 18
    ageMax?: number               // padrão 65
    genders?: (1 | 2)[]           // 1=masculino, 2=feminino, omitir para ambos
    countries?: string[]          // ex: ['BR']
    interests?: Array<{ id: string; name: string }>
  }
  startTime?: string              // ISO 8601; omitir para iniciar imediatamente
}

export interface CreateAdCreativeParams {
  name: string
  pageId: string                  // ID da Página do Facebook do anunciante
  message: string                 // Primary text
  link: string                    // URL de destino
  headline: string
  description?: string
  callToAction?: CallToActionType
  imageHash?: string              // Hash da imagem previamente carregada via uploadAdImage
}

export interface CreateAdParams {
  name: string
  adSetId: string
  creativeId: string
  status: 'ACTIVE' | 'PAUSED'
}

export interface MetaFacebookPage {
  id: string
  name: string
  access_token?: string
  category?: string
}

// ──────────────────────────────────────────
// Custom error classes
// ──────────────────────────────────────────

export class MetaRateLimitError extends Error {
  retryAfter: number

  constructor(retryAfter = 60) {
    super(`Meta API rate limit reached. Retry after ${retryAfter}s.`)
    this.name = 'MetaRateLimitError'
    this.retryAfter = retryAfter
  }
}

export class MetaApiError extends Error {
  code: number

  constructor(code: number, message: string) {
    super(message)
    this.name = 'MetaApiError'
    this.code = code
  }
}

// ──────────────────────────────────────────
// Response types
// ──────────────────────────────────────────

interface MetaAdAccount {
  id: string
  name: string
  currency: string
  timezone_name: string
  account_status: number
}

interface MetaCampaign {
  id: string
  name: string
  status: string
  objective: string
  daily_budget?: string
  lifetime_budget?: string
}

export interface MetaCampaignInsight {
  campaign_id: string
  spend: string
  impressions: string
  clicks: string
  reach: string
  actions?: Array<{ action_type: string; value: string }>
  purchase_roas?: Array<{ action_type: string; value: string }>
  video_thruplay_watched_actions?: Array<{ action_type: string; value: string }>
  estimated_ad_recallers?: string
  cost_per_estimated_ad_recallers?: string
  frequency: string
  cpm: string
  date_start: string
  date_stop: string
}

/**
 * Intervalo de datas para consulta de insights.
 * Formato: 'YYYY-MM-DD'
 */
export interface InsightDateRange {
  since: string
  until: string
}

interface MetaErrorResponse {
  error?: {
    message: string
    type: string
    code: number
    fbtrace_id?: string
  }
}

// ──────────────────────────────────────────
// Central fetch function
// ──────────────────────────────────────────

async function metaFetch<T>(
  path: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${META_GRAPH_URL}${path}`

  const response = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  })

  // Handle rate limiting via HTTP status
  if (response.status === 429) {
    const retryAfterHeader = response.headers.get('retry-after')
    const retryAfter = retryAfterHeader ? parseInt(retryAfterHeader, 10) : 60
    throw new MetaRateLimitError(retryAfter)
  }

  const data = (await response.json()) as T & MetaErrorResponse

  // Handle Meta API errors in response body
  if (data.error) {
    const { code, message } = data.error

    // Rate limit error codes
    if ([17, 32, 80004].includes(code)) {
      throw new MetaRateLimitError(60)
    }

    throw new MetaApiError(code, message)
  }

  return data
}

// ──────────────────────────────────────────
// Exported API functions
// ──────────────────────────────────────────

/**
 * Busca as contas de anúncio vinculadas ao usuário na Business Manager.
 */
export async function getAdAccounts(
  userId: string,
  accessToken: string
): Promise<MetaAdAccount[]> {
  const data = await metaFetch<{ data: MetaAdAccount[] }>(
    `/${userId}/adaccounts?fields=id,name,currency,timezone_name,account_status`,
    accessToken
  )
  return data.data ?? []
}

/**
 * Busca as campanhas de uma conta de anúncio.
 */
export async function getCampaigns(
  adAccountId: string,
  accessToken: string
): Promise<MetaCampaign[]> {
  const data = await metaFetch<{ data: MetaCampaign[] }>(
    `/${adAccountId}/campaigns?fields=id,name,status,objective,daily_budget,lifetime_budget`,
    accessToken
  )
  return data.data ?? []
}

const INSIGHT_FIELDS = [
  'spend', 'impressions', 'clicks', 'reach',
  'actions', 'purchase_roas', 'frequency', 'cpm',
  'video_thruplay_watched_actions',
  'estimated_ad_recallers', 'cost_per_estimated_ad_recallers',
].join(',')

/**
 * Busca os insights agregados de uma campanha.
 * @param dateRange Intervalo customizado. Se omitido, usa os últimos 30 dias.
 */
export async function getCampaignInsights(
  campaignId: string,
  accessToken: string,
  dateRange?: InsightDateRange
): Promise<MetaCampaignInsight | null> {
  const timeParam = dateRange
    ? `time_range=${encodeURIComponent(JSON.stringify({ since: dateRange.since, until: dateRange.until }))}`
    : 'date_preset=last_30d'

  const data = await metaFetch<{ data: MetaCampaignInsight[] }>(
    `/${campaignId}/insights?fields=${INSIGHT_FIELDS}&${timeParam}`,
    accessToken
  )
  return data.data?.[0] ?? null
}

/**
 * Busca os insights diários de uma campanha (série temporal).
 * Retorna um registro por dia no intervalo informado.
 */
export async function getDailyCampaignInsights(
  campaignId: string,
  accessToken: string,
  dateRange: InsightDateRange
): Promise<MetaCampaignInsight[]> {
  const timeRange = encodeURIComponent(
    JSON.stringify({ since: dateRange.since, until: dateRange.until })
  )
  const data = await metaFetch<{ data: MetaCampaignInsight[] }>(
    `/${campaignId}/insights?fields=${INSIGHT_FIELDS},date_start,date_stop&time_range=${timeRange}&time_increment=1&limit=90`,
    accessToken
  )
  return data.data ?? []
}

/**
 * Atualiza o status de uma campanha na Meta (ACTIVE ou PAUSED).
 */
export async function updateCampaignStatus(
  campaignId: string,
  status: 'ACTIVE' | 'PAUSED',
  accessToken: string
): Promise<boolean> {
  const data = await metaFetch<{ success: boolean }>(
    `/${campaignId}`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ status }),
    }
  )
  return data.success === true
}

/**
 * Troca um token de curta duração por um token de longa duração (60 dias).
 */
export async function exchangeForLongLivedToken(
  shortLivedToken: string
): Promise<{ access_token: string; expires_in: number }> {
  const clientId = process.env.FACEBOOK_CLIENT_ID
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error(
      '[meta-api] FACEBOOK_CLIENT_ID e FACEBOOK_CLIENT_SECRET devem estar definidos'
    )
  }

  const params = new URLSearchParams({
    grant_type: 'fb_exchange_token',
    client_id: clientId,
    client_secret: clientSecret,
    fb_exchange_token: shortLivedToken,
  })

  const response = await fetch(
    `${META_GRAPH_URL}/oauth/access_token?${params.toString()}`,
    { method: 'GET' }
  )

  const data = (await response.json()) as {
    access_token?: string
    expires_in?: number
    error?: { message: string; code: number }
  }

  if (data.error) {
    if ([17, 32, 80004].includes(data.error.code)) {
      throw new MetaRateLimitError(60)
    }
    throw new MetaApiError(data.error.code, data.error.message)
  }

  if (!data.access_token) {
    throw new MetaApiError(0, 'Token de longa duração não retornado pela Meta')
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in ?? 5184000, // 60 dias em segundos
  }
}

// ──────────────────────────────────────────
// Budget update
// ──────────────────────────────────────────

// ──────────────────────────────────────────
// Campaign creation API
// ──────────────────────────────────────────

/**
 * Busca as Páginas do Facebook associadas ao token do usuário.
 * Necessário para criar criativos — o page_id é obrigatório.
 */
export async function getMyPages(accessToken: string): Promise<MetaFacebookPage[]> {
  const data = await metaFetch<{ data: MetaFacebookPage[] }>(
    `/me/accounts?fields=id,name,category`,
    accessToken
  )
  return data.data ?? []
}

/**
 * Cria uma Campanha na conta de anúncio.
 * Retorna o ID da campanha criada.
 */
export async function createCampaign(
  adAccountId: string,
  params: CreateCampaignParams,
  accessToken: string
): Promise<string> {
  const body = {
    name: params.name,
    objective: params.objective,
    status: params.status,
    special_ad_categories: params.specialAdCategories ?? [],
  }

  const data = await metaFetch<{ id: string }>(
    `/${adAccountId}/campaigns`,
    accessToken,
    { method: 'POST', body: JSON.stringify(body) }
  )
  return data.id
}

/**
 * Cria um Conjunto de Anúncios (AdSet) dentro de uma campanha.
 * Define orçamento, público-alvo e otimização.
 */
export async function createAdSet(
  adAccountId: string,
  params: CreateAdSetParams,
  accessToken: string
): Promise<string> {
  const targeting: Record<string, unknown> = {
    age_min: params.targeting.ageMin ?? 18,
    age_max: params.targeting.ageMax ?? 65,
    geo_locations: {
      countries: params.targeting.countries ?? ['BR'],
    },
  }

  if (params.targeting.genders?.length) {
    targeting.genders = params.targeting.genders
  }

  if (params.targeting.interests?.length) {
    targeting.interests = params.targeting.interests
  }

  const body: Record<string, unknown> = {
    name: params.name,
    campaign_id: params.campaignId,
    daily_budget: params.dailyBudgetCents,
    optimization_goal: params.optimizationGoal,
    billing_event: params.billingEvent ?? 'IMPRESSIONS',
    bid_strategy: params.bidStrategy ?? 'LOWEST_COST_WITHOUT_CAP',
    targeting,
    status: 'PAUSED', // sempre começa pausado; ativado depois junto com o anúncio
  }

  if (params.startTime) {
    body.start_time = params.startTime
  }

  const data = await metaFetch<{ id: string }>(
    `/${adAccountId}/adsets`,
    accessToken,
    { method: 'POST', body: JSON.stringify(body) }
  )
  return data.id
}

/**
 * Cria um Criativo de Anúncio com copy e link.
 * Suporta link ads com imagem existente (via imageHash) ou sem imagem.
 */
export async function createAdCreative(
  adAccountId: string,
  params: CreateAdCreativeParams,
  accessToken: string
): Promise<string> {
  const linkData: Record<string, unknown> = {
    message: params.message,
    link: params.link,
    name: params.headline,
    call_to_action: {
      type: params.callToAction ?? 'LEARN_MORE',
      value: { link: params.link },
    },
  }

  if (params.description) {
    linkData.description = params.description
  }

  if (params.imageHash) {
    linkData.image_hash = params.imageHash
  }

  const body = {
    name: params.name,
    object_story_spec: {
      page_id: params.pageId,
      link_data: linkData,
    },
  }

  const data = await metaFetch<{ id: string }>(
    `/${adAccountId}/adcreatives`,
    accessToken,
    { method: 'POST', body: JSON.stringify(body) }
  )
  return data.id
}

/**
 * Cria o Anúncio final vinculando AdSet + Creative.
 */
export async function createAd(
  adAccountId: string,
  params: CreateAdParams,
  accessToken: string
): Promise<string> {
  const body = {
    name: params.name,
    adset_id: params.adSetId,
    creative: { creative_id: params.creativeId },
    status: params.status,
  }

  const data = await metaFetch<{ id: string }>(
    `/${adAccountId}/ads`,
    accessToken,
    { method: 'POST', body: JSON.stringify(body) }
  )
  return data.id
}

/**
 * Faz upload de uma imagem para a biblioteca de mídia da conta de anúncio.
 * Retorna o hash da imagem para usar em createAdCreative.
 */
export async function uploadAdImage(
  adAccountId: string,
  imageUrl: string,
  accessToken: string
): Promise<string> {
  // Baixa a imagem e converte para base64
  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })
  if (!imgRes.ok) throw new MetaApiError(0, `Não foi possível baixar a imagem: ${imgRes.status}`)

  const buffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const bytes = JSON.stringify({ bytes: base64 })

  const data = await metaFetch<{ images: Record<string, { hash: string }> }>(
    `/${adAccountId}/adimages`,
    accessToken,
    { method: 'POST', body: bytes }
  )

  const hash = Object.values(data.images ?? {})[0]?.hash
  if (!hash) throw new MetaApiError(0, 'Meta não retornou hash da imagem')
  return hash
}

/**
 * Atualiza o orçamento diário de uma campanha na Meta API.
 * @param campaignId - Meta campaign ID
 * @param dailyBudgetCents - Novo orçamento em centavos (ex: 50000 = R$500,00)
 */
export async function updateCampaignBudget(
  campaignId: string,
  dailyBudgetCents: number,
  accessToken: string
): Promise<boolean> {
  const result = await metaFetch<{ success: boolean }>(
    `${campaignId}`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify({ daily_budget: dailyBudgetCents }),
    }
  )
  return result.success === true
}
