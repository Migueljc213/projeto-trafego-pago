'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getGoogleAdsAccessToken } from '@/lib/google-ads-auth'
import {
  listAccessibleCustomers,
  getCustomerInfo,
  getCampaignsWithMetrics,
  microsToDecimal,
  calcRoas,
} from '@/lib/google-ads-api'

export async function syncGoogleAdsAction(): Promise<{
  success: boolean
  data?: { accounts: number; campaigns: number }
  error?: string
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const connection = await prisma.googleAdsConnection.findUnique({
    where: { userId: session.user.id },
    include: { googleAdsAccounts: true },
  })

  if (!connection) return { success: false, error: 'Google Ads não conectado' }

  try {
    const refreshToken = decrypt(connection.encryptedRefreshToken)
    const accessToken = await getGoogleAdsAccessToken(refreshToken)
    const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

    const customerIds = await listAccessibleCustomers(accessToken)
    let totalCampaigns = 0
    let accountCount = 0

    for (const customerId of customerIds) {
      const info = await getCustomerInfo(accessToken, customerId, loginCustomerId)
      if (info.isManager) continue

      const account = await prisma.googleAdsAccount.upsert({
        where: { connectionId_customerId: { connectionId: connection.id, customerId } },
        create: {
          connectionId: connection.id,
          customerId,
          name: info.name,
          currencyCode: info.currency,
          timeZone: info.timeZone,
        },
        update: { name: info.name },
      })

      accountCount++

      const campaigns = await getCampaignsWithMetrics(accessToken, customerId, loginCustomerId)

      for (const c of campaigns) {
        const spend = microsToDecimal(c.costMicros)
        await prisma.googleAdsCampaign.upsert({
          where: { accountId_googleCampaignId: { accountId: account.id, googleCampaignId: c.campaignId } },
          create: {
            accountId: account.id,
            googleCampaignId: c.campaignId,
            name: c.name,
            status: c.status,
            channelType: c.channelType,
            dailyBudget: microsToDecimal(c.dailyBudgetMicros),
            spend,
            impressions: c.impressions,
            clicks: c.clicks,
            conversions: c.conversions,
            conversionValue: c.conversionValue,
            roas: calcRoas(c.conversionValue, c.costMicros),
            ctr: c.ctr * 100,
            metricsUpdatedAt: new Date(),
          },
          update: {
            status: c.status,
            spend,
            impressions: c.impressions,
            clicks: c.clicks,
            conversions: c.conversions,
            conversionValue: c.conversionValue,
            roas: calcRoas(c.conversionValue, c.costMicros),
            ctr: c.ctr * 100,
            metricsUpdatedAt: new Date(),
          },
        })
        totalCampaigns++
      }
    }

    return { success: true, data: { accounts: accountCount, campaigns: totalCampaigns } }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return { success: false, error: msg }
  }
}

export async function getGoogleAdsCampaigns(connectionId?: string): Promise<{
  campaigns: Array<{
    id: string
    googleCampaignId: string
    name: string
    status: string
    channelType: string
    dailyBudget: number
    spend: number
    impressions: number
    clicks: number
    conversions: number
    roas: number
    ctr: number
    metricsUpdatedAt: Date | null
    accountName: string
  }>
}> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { campaigns: [] }

  const connection = await prisma.googleAdsConnection.findUnique({
    where: { userId: session.user.id },
    include: {
      googleAdsAccounts: {
        include: {
          campaigns: { orderBy: { spend: 'desc' } },
        },
      },
    },
  })

  if (!connection) return { campaigns: [] }

  const campaigns = connection.googleAdsAccounts.flatMap(account =>
    account.campaigns.map(c => ({
      id: c.id,
      googleCampaignId: c.googleCampaignId,
      name: c.name,
      status: c.status,
      channelType: c.channelType,
      dailyBudget: c.dailyBudget,
      spend: c.spend,
      impressions: c.impressions,
      clicks: c.clicks,
      conversions: c.conversions,
      roas: c.roas,
      ctr: c.ctr,
      metricsUpdatedAt: c.metricsUpdatedAt,
      accountName: account.name,
    }))
  )

  return { campaigns }
}
