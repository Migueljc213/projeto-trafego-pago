const META_GRAPH_URL = 'https://graph.facebook.com/v21.0'

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

interface MetaCampaignInsight {
  campaign_id: string
  spend: string
  impressions: string
  clicks: string
  actions?: Array<{ action_type: string; value: string }>
  purchase_roas?: Array<{ action_type: string; value: string }>
  frequency: string
  cpm: string
  date_start: string
  date_stop: string
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

/**
 * Busca os insights dos últimos 30 dias de uma campanha específica.
 */
export async function getCampaignInsights(
  campaignId: string,
  accessToken: string
): Promise<MetaCampaignInsight | null> {
  const data = await metaFetch<{ data: MetaCampaignInsight[] }>(
    `/${campaignId}/insights?fields=spend,impressions,clicks,actions,purchase_roas,frequency,cpm&date_preset=last_30d`,
    accessToken
  )
  return data.data?.[0] ?? null
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
