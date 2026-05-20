const GOOGLE_ADS_BASE = 'https://googleads.googleapis.com/v19'

function googleAdsHeaders(accessToken: string, loginCustomerId?: string): Record<string, string> {
  const headers: Record<string, string> = {
    'Authorization': `Bearer ${accessToken}`,
    'developer-token': process.env.GOOGLE_ADS_DEVELOPER_TOKEN!,
    'Content-Type': 'application/json',
  }
  if (loginCustomerId) {
    headers['login-customer-id'] = loginCustomerId
  }
  return headers
}

export async function listAccessibleCustomers(accessToken: string): Promise<string[]> {
  const res = await fetch(
    `${GOOGLE_ADS_BASE}/customers:listAccessibleCustomers`,
    { headers: googleAdsHeaders(accessToken) }
  )
  const data = await res.json() as {
    resourceNames?: string[]
    error?: { message: string; code: number }
  }
  if (data.error) throw new Error(`Google Ads API: ${data.error.message}`)
  return (data.resourceNames ?? []).map(r => r.split('/')[1])
}

export async function getCustomerInfo(
  accessToken: string,
  customerId: string,
  loginCustomerId?: string
): Promise<{ id: string; name: string; currency: string; timeZone: string; isManager: boolean }> {
  const body = {
    query: `
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager
      FROM customer
      LIMIT 1
    `,
  }
  const res = await fetch(
    `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: googleAdsHeaders(accessToken, loginCustomerId),
      body: JSON.stringify(body),
    }
  )
  const data = await res.json() as {
    results?: Array<{
      customer: {
        id: string
        descriptiveName: string
        currencyCode: string
        timeZone: string
        manager: boolean
      }
    }>
    error?: { message: string }
  }
  if (data.error) throw new Error(`Google Ads API: ${data.error.message}`)
  const c = data.results?.[0]?.customer
  if (!c) throw new Error(`Conta ${customerId} não encontrada`)
  return {
    id: customerId,
    name: c.descriptiveName,
    currency: c.currencyCode,
    timeZone: c.timeZone,
    isManager: c.manager,
  }
}

export interface GoogleAdsCampaignData {
  campaignId: string
  name: string
  status: string
  channelType: string
  dailyBudgetMicros: number
  impressions: number
  clicks: number
  costMicros: number
  conversions: number
  conversionValue: number
  ctr: number
}

export async function getCampaignsWithMetrics(
  accessToken: string,
  customerId: string,
  loginCustomerId?: string,
  days = 30
): Promise<GoogleAdsCampaignData[]> {
  const dateRange = days <= 7 ? 'LAST_7_DAYS' : days <= 30 ? 'LAST_30_DAYS' : 'LAST_90_DAYS'
  const body = {
    query: `
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign_budget.amount_micros,
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.cost_micros,
        metrics.conversions,
        metrics.all_conversions_value
      FROM campaign
      WHERE campaign.status != 'REMOVED'
        AND segments.date DURING ${dateRange}
      ORDER BY metrics.cost_micros DESC
      LIMIT 100
    `,
  }
  const res = await fetch(
    `${GOOGLE_ADS_BASE}/customers/${customerId}/googleAds:search`,
    {
      method: 'POST',
      headers: googleAdsHeaders(accessToken, loginCustomerId),
      body: JSON.stringify(body),
    }
  )
  const data = await res.json() as {
    results?: Array<{
      campaign: { id: string; name: string; status: string; advertisingChannelType: string }
      campaignBudget?: { amountMicros: string }
      metrics: { impressions: string; clicks: string; ctr: string; costMicros: string; conversions: string; allConversionsValue: string }
    }>
    error?: { message: string; code: number }
  }
  if (data.error) throw new Error(`Google Ads API: ${data.error.message}`)
  if (!data.results) return []
  return data.results.map(r => ({
    campaignId: r.campaign.id,
    name: r.campaign.name,
    status: r.campaign.status,
    channelType: r.campaign.advertisingChannelType,
    dailyBudgetMicros: parseInt(r.campaignBudget?.amountMicros ?? '0'),
    impressions: parseInt(r.metrics.impressions),
    clicks: parseInt(r.metrics.clicks),
    costMicros: parseInt(r.metrics.costMicros),
    conversions: parseFloat(r.metrics.conversions),
    conversionValue: parseFloat(r.metrics.allConversionsValue),
    ctr: parseFloat(r.metrics.ctr),
  }))
}

export async function pauseGoogleAdsCampaign(
  accessToken: string,
  customerId: string,
  googleCampaignId: string,
  loginCustomerId?: string
): Promise<void> {
  const res = await fetch(
    `${GOOGLE_ADS_BASE}/customers/${customerId}/campaigns:mutate`,
    {
      method: 'POST',
      headers: googleAdsHeaders(accessToken, loginCustomerId),
      body: JSON.stringify({
        operations: [{
          update: {
            resourceName: `customers/${customerId}/campaigns/${googleCampaignId}`,
            status: 'PAUSED',
          },
          updateMask: 'status',
        }],
      }),
    }
  )
  const data = await res.json() as { error?: { message: string } }
  if (data.error) throw new Error(`Erro ao pausar campanha Google: ${data.error.message}`)
}

export async function enableGoogleAdsCampaign(
  accessToken: string,
  customerId: string,
  googleCampaignId: string,
  loginCustomerId?: string
): Promise<void> {
  const res = await fetch(
    `${GOOGLE_ADS_BASE}/customers/${customerId}/campaigns:mutate`,
    {
      method: 'POST',
      headers: googleAdsHeaders(accessToken, loginCustomerId),
      body: JSON.stringify({
        operations: [{
          update: {
            resourceName: `customers/${customerId}/campaigns/${googleCampaignId}`,
            status: 'ENABLED',
          },
          updateMask: 'status',
        }],
      }),
    }
  )
  const data = await res.json() as { error?: { message: string } }
  if (data.error) throw new Error(`Erro ao ativar campanha Google: ${data.error.message}`)
}

export function microsToDecimal(micros: number): number {
  return micros / 1_000_000
}

export function calcRoas(conversionValue: number, costMicros: number): number {
  const spend = microsToDecimal(costMicros)
  return spend > 0 ? conversionValue / spend : 0
}
