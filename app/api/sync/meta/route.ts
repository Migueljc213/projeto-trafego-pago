import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getAdAccounts, getCampaigns } from '@/lib/meta-api'

const STATUS_MAP: Record<string, 'ACTIVE' | 'PAUSED' | 'DELETED' | 'ARCHIVED' | 'IN_PROCESS' | 'WITH_ISSUES'> = {
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  DELETED: 'DELETED',
  ARCHIVED: 'ARCHIVED',
  IN_PROCESS: 'IN_PROCESS',
  WITH_ISSUES: 'WITH_ISSUES',
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const bm = await prisma.businessManager.findFirst({
    where: { userId: session.user.id },
  })

  if (!bm) {
    return NextResponse.json(
      { error: 'Nenhuma conta Meta conectada. Faça login com Facebook primeiro.' },
      { status: 404 }
    )
  }

  let accessToken: string
  try {
    accessToken = decrypt(bm.accessTokenEnc)
  } catch {
    return NextResponse.json(
      { error: 'Token Meta inválido. Faça logout e login novamente.' },
      { status: 401 }
    )
  }

  const results = {
    adAccounts: 0,
    campaigns: 0,
    errors: [] as string[],
  }

  // 1. Busca Ad Accounts do usuário
  let adAccountsData
  try {
    adAccountsData = await getAdAccounts('me', accessToken)
  } catch (err) {
    return NextResponse.json(
      { error: `Erro ao buscar Ad Accounts: ${String(err)}` },
      { status: 500 }
    )
  }

  // 2. Salva cada Ad Account no banco
  for (const account of adAccountsData) {
    try {
      await prisma.adAccount.upsert({
        where: { metaAccountId: account.id },
        create: {
          businessManagerId: bm.id,
          metaAccountId: account.id,
          name: account.name,
          currency: account.currency ?? 'BRL',
          timezone: account.timezone_name ?? 'America/Sao_Paulo',
          status: account.account_status ?? 1,
        },
        update: {
          name: account.name,
          currency: account.currency ?? 'BRL',
          timezone: account.timezone_name ?? 'America/Sao_Paulo',
          status: account.account_status ?? 1,
        },
      })
      results.adAccounts++
    } catch (err) {
      results.errors.push(`AdAccount ${account.id}: ${String(err)}`)
      continue
    }

    // 3. Busca campanhas desta Ad Account
    let campaigns
    try {
      campaigns = await getCampaigns(account.id, accessToken)
    } catch (err) {
      results.errors.push(`Campanhas de ${account.id}: ${String(err)}`)
      continue
    }

    // 4. Busca o registro salvo para pegar o id interno
    const savedAccount = await prisma.adAccount.findUnique({
      where: { metaAccountId: account.id },
    })
    if (!savedAccount) continue

    // 5. Salva cada campanha
    for (const campaign of campaigns) {
      try {
        const status = STATUS_MAP[campaign.status] ?? 'PAUSED'
        const dailyBudget = campaign.daily_budget
          ? parseFloat(campaign.daily_budget) / 100
          : null

        await prisma.campaign.upsert({
          where: { metaCampaignId: campaign.id },
          create: {
            adAccountId: savedAccount.id,
            metaCampaignId: campaign.id,
            name: campaign.name,
            status,
            dailyBudget,
          },
          update: {
            name: campaign.name,
            status,
            dailyBudget,
          },
        })
        results.campaigns++
      } catch (err) {
        results.errors.push(`Campaign ${campaign.id}: ${String(err)}`)
      }
    }
  }

  return NextResponse.json({
    ok: true,
    synced: {
      adAccounts: results.adAccounts,
      campaigns: results.campaigns,
    },
    errors: results.errors.length > 0 ? results.errors : undefined,
  })
}
