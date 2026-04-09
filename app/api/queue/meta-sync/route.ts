/**
 * Worker Route: Meta Sync
 *
 * Sincroniza campanhas da Meta API para um usuário.
 * QStash faz até 3 retries em caso de falha (rate limit, timeout, etc).
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getCampaigns } from '@/lib/meta-api'
import { decrypt } from '@/lib/encryption'
import { verifyQueueRequest } from '@/lib/queue'
import type { MetaSyncJob } from '@/lib/queue'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!verifyQueueRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let job: MetaSyncJob
  try {
    job = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { userId } = job

  try {
    const bm = await prisma.businessManager.findFirst({
      where: { userId },
      include: { adAccounts: true },
    })

    if (!bm) {
      return NextResponse.json({ ok: true, skipped: 'no_bm' })
    }

    const accessToken = decrypt(bm.accessTokenEnc)
    let synced = 0

    for (const adAccount of bm.adAccounts) {
      try {
        const campaigns = await getCampaigns(adAccount.metaAccountId, accessToken)

        await Promise.all(
          campaigns.map((c) =>
            prisma.campaign.upsert({
              where: { metaCampaignId: c.id },
              create: {
                adAccountId: adAccount.id,
                metaCampaignId: c.id,
                name: c.name,
                status: c.status as 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED',
                dailyBudget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
              },
              update: {
                name: c.name,
                status: c.status as 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED',
                dailyBudget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
              },
            })
          )
        )
        synced += campaigns.length
      } catch (err) {
        console.error(`[meta-sync] Erro na conta ${adAccount.metaAccountId}:`, err)
      }
    }

    console.log(`[meta-sync] ✓ userId=${userId} → ${synced} campanhas sincronizadas`)
    return NextResponse.json({ ok: true, synced })
  } catch (error) {
    console.error(`[meta-sync] Erro para userId=${userId}:`, error)
    return NextResponse.json(
      { error: 'Sync failed', detail: String(error) },
      { status: 500 }
    )
  }
}
