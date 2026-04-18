import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getAudienceBreakdown, getPlatformBreakdown } from '@/lib/meta-api'
import { NextResponse } from 'next/server'

/**
 * GET /api/meta/audience-insights?campaignId=xxx&days=30
 * Retorna breakdown demográfico (idade/gênero) e por plataforma
 * de uma campanha específica.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const url = new URL(request.url)
  const campaignId = url.searchParams.get('campaignId')
  const days = parseInt(url.searchParams.get('days') ?? '30')

  if (!campaignId) {
    return NextResponse.json({ error: 'campaignId obrigatório' }, { status: 400 })
  }

  // Verifica ownership da campanha
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      adAccount: { businessManager: { userId: session.user.id } },
    },
    select: { metaCampaignId: true },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  const bm = await prisma.businessManager.findFirst({
    where: { userId: session.user.id },
  })
  if (!bm) {
    return NextResponse.json({ error: 'Conta Meta não conectada' }, { status: 404 })
  }

  const accessToken = decrypt(bm.accessTokenEnc)
  const since = new Date()
  since.setDate(since.getDate() - days)
  const dateRange = {
    since: since.toISOString().split('T')[0],
    until: new Date().toISOString().split('T')[0],
  }

  try {
    const [demographics, platforms] = await Promise.all([
      getAudienceBreakdown(campaign.metaCampaignId, accessToken, dateRange),
      getPlatformBreakdown(campaign.metaCampaignId, accessToken, dateRange),
    ])
    return NextResponse.json({ demographics, platforms })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao buscar insights: ${msg}` }, { status: 500 })
  }
}
