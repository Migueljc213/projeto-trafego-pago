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
  status?: 'ACTIVE' | 'PAUSED'   // padrão PAUSED
  destinationType?: 'WEBSITE' | 'APP' | 'MESSENGER_INBOX' | 'INSTAGRAM_PROFILE' | 'FACEBOOK'
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
  subcode?: number
  fbtrace?: string

  constructor(code: number, message: string, subcode?: number, fbtrace?: string) {
    const extras = [
      subcode ? `subcode=${subcode}` : '',
      fbtrace ? `trace=${fbtrace}` : '',
    ].filter(Boolean).join(', ')
    super(extras ? `${message} (${extras})` : message)
    this.name = 'MetaApiError'
    this.code = code
    this.subcode = subcode
    this.fbtrace = fbtrace
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

// Status codes da conta de anúncio da Meta
const AD_ACCOUNT_STATUS: Record<number, string> = {
  1: 'ACTIVE',
  2: 'DISABLED',
  3: 'UNSETTLED',
  7: 'PENDING_RISK_REVIEW',
  8: 'PENDING_SETTLEMENT',
  9: 'IN_GRACE_PERIOD',
  100: 'PENDING_CLOSURE',
  101: 'CLOSED',
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
    error_subcode?: number
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
    const { code, message, error_subcode, fbtrace_id } = data.error

    // Rate limit error codes
    if ([17, 32, 80004].includes(code)) {
      throw new MetaRateLimitError(60)
    }

    throw new MetaApiError(code, message, error_subcode, fbtrace_id)
  }

  return data
}

// ──────────────────────────────────────────
// Exported API functions
// ──────────────────────────────────────────

/**
 * Verifica se o token tem acesso ao ad account e se a conta está apta para criar campanhas.
 * Lança MetaApiError com mensagem descritiva se algo estiver errado.
 */
export async function assertAdAccountReady(
  adAccountId: string,
  accessToken: string
): Promise<void> {
  const data = await metaFetch<{
    id: string
    name: string
    account_status: number
    disable_reason?: number
    capabilities?: string[]
  }>(
    `/${adAccountId}?fields=id,name,account_status,disable_reason,capabilities`,
    accessToken
  )

  const statusCode = data.account_status
  const statusName = AD_ACCOUNT_STATUS[statusCode] ?? `UNKNOWN(${statusCode})`

  if (statusCode !== 1) {
    const reasons: Record<number, string> = {
      2: 'A conta de anúncio está desativada.',
      3: 'A conta está com pagamento pendente (UNSETTLED). Verifique o método de pagamento no Meta Ads Manager.',
      7: 'A conta está em revisão de risco pela Meta (PENDING_RISK_REVIEW). Aguarde a aprovação.',
      8: 'A conta está aguardando liquidação de pagamento (PENDING_SETTLEMENT).',
      9: 'A conta está em período de carência (IN_GRACE_PERIOD). Regularize o pagamento.',
      100: 'A conta está em processo de encerramento (PENDING_CLOSURE).',
      101: 'A conta de anúncio está encerrada (CLOSED).',
    }
    const msg = reasons[statusCode] ?? `A conta de anúncio está em estado "${statusName}" e não pode criar campanhas.`
    throw new MetaApiError(100, `[AdAccount ${adAccountId}] ${msg}`)
  }
}

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
// Error translation
// ──────────────────────────────────────────

export type CampaignCreationStep = 'campanha' | 'conjunto de anúncios' | 'criativo' | 'anúncio'

/**
 * Converte códigos de erro da Meta API em mensagens amigáveis em português.
 * O parâmetro `step` permite contextualizar erros ambíguos (ex: 4834011 tem causas
 * diferentes dependendo de onde ocorre). Retorna null quando não há tradução conhecida.
 */
export function translateMetaError(
  code: number,
  subcode?: number,
  step?: CampaignCreationStep
): string | null {
  if (subcode) {
    // 4834011 — causas diferentes por etapa
    if (subcode === 4834011) {
      if (step === 'campanha' || step === 'conjunto de anúncios') {
        return (
          'Parâmetro inválido na criação da campanha (código Meta: 4834011). ' +
          'Possíveis causas: (1) A conta de anúncio pode estar com restrições ou em revisão — acesse o Meta Ads Manager para verificar. ' +
          '(2) Verifique se a conta tem permissão para o objetivo selecionado. ' +
          '(3) Se o anúncio envolve crédito, emprego, imóveis ou política, pode ser necessário declarar uma Categoria Especial no Meta Ads Manager.'
        )
      }
      // criativo ou anúncio — problema de URL
      return (
        'A URL de destino é inválida ou inacessível pela Meta. ' +
        'Verifique se o endereço começa com https://, está acessível publicamente sem login e não é uma página de desenvolvimento/staging.'
      )
    }

    const bySubcode: Record<number, string> = {
      4837043: 'O domínio da URL de destino não está verificado nesta conta Meta. Adicione e verifique o domínio no Meta Business Manager → Configurações → Domínios.',
      1815745: 'O evento de cobrança (billing_event) é incompatível com o objetivo de otimização escolhido.',
      2446094: 'O objetivo de otimização não é compatível com o objetivo da campanha. Altere um dos dois e tente novamente.',
      1885217: 'Configuração de segmentação de público inválida. Verifique os interesses selecionados.',
      1487394: 'Esta campanha requer declaração de Categoria Especial de Anúncio (crédito, emprego, habitação ou política). Edite no Meta Ads Manager.',
      2446090: 'Orçamento insuficiente para o objetivo selecionado. O mínimo diário pode ser maior que o valor informado.',
      1391705: 'A conta de anúncio não tem um método de pagamento válido cadastrado no Meta.',
    }
    if (bySubcode[subcode]) return bySubcode[subcode]
  }

  const byCode: Record<number, string> = {
    100: 'Parâmetro inválido enviado à Meta. Verifique os dados e tente novamente.',
    190: 'Token de acesso inválido ou expirado. Reconecte sua conta Meta em Configurações.',
    200: 'Permissão negada. Verifique se sua conta tem permissão de gerenciamento de anúncios (ads_management).',
    294: 'Gerenciamento de anúncios não está habilitado para este app Meta. Entre em contato com o suporte.',
    368: 'Conta temporariamente bloqueada pela Meta por violação de políticas. Verifique o Meta Ads Manager.',
    803: 'Objeto não encontrado. Verifique se o ID da Página ou da conta de anúncio estão corretos.',
    2635: 'A conta de anúncio está desativada ou com restrições. Acesse o Meta Ads Manager para verificar.',
    2041: 'Sua conta de anúncio atingiu o limite de campanhas ativas permitidas pela Meta.',
    1487137: 'Limite de criativos atingido para este conjunto de anúncios.',
  }
  return byCode[code] ?? null
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
    // Orçamento definido no AdSet (ABO), não na campanha (CBO)
    is_adset_budget_sharing_enabled: false,
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

  // billing_event must be compatible with optimization_goal:
  // LINK_CLICKS optimization → bill per LINK_CLICKS
  // everything else → bill per IMPRESSIONS
  const derivedBillingEvent: 'IMPRESSIONS' | 'LINK_CLICKS' =
    params.billingEvent ?? (params.optimizationGoal === 'LINK_CLICKS' ? 'LINK_CLICKS' : 'IMPRESSIONS')

  const body: Record<string, unknown> = {
    name: params.name,
    campaign_id: params.campaignId,
    daily_budget: params.dailyBudgetCents,
    optimization_goal: params.optimizationGoal,
    billing_event: derivedBillingEvent,
    bid_strategy: params.bidStrategy ?? 'LOWEST_COST_WITHOUT_CAP',
    // Obrigatório na API v17+ para objetivos de tráfego/vendas/leads
    destination_type: params.destinationType ?? 'WEBSITE',
    targeting,
    // Obrigatório declarar explicitamente na API v17+ — 0 = targeting manual (sem Advantage Audience IA)
    targeting_automation: { advantage_audience: 0 },
    status: params.status ?? 'PAUSED',
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
    link: params.link,
    name: params.headline,         // headline (title below image)
    message: params.message,       // primary text (above image)
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

  const body: Record<string, unknown> = {
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
