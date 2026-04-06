/**
 * Seed do banco de dados com dados fictícios para desenvolvimento e demo.
 * Execute com: npx prisma db seed
 */

import { config } from 'dotenv'
import { resolve } from 'path'

// Carrega .env.local antes de qualquer import que use process.env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

import { PrismaClient } from '@prisma/client'
import { PrismaNeon } from '@prisma/adapter-neon'

const adapter = new PrismaNeon({
  connectionString: process.env.DATABASE_URL!,
})
const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('🌱 Iniciando seed...')

  // ─── Usuário Demo ─────────────────────────────────────────────────────────
  const user = await prisma.user.upsert({
    where: { email: 'demo@funnelguard.ai' },
    update: {},
    create: {
      name: 'Demo User',
      email: 'demo@funnelguard.ai',
      image: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    },
  })
  console.log('✅ Usuário criado:', user.email)

  // ─── Business Manager ─────────────────────────────────────────────────────
  const bm = await prisma.businessManager.upsert({
    where: { metaBmId: 'bm_demo_123' },
    update: {},
    create: {
      userId: user.id,
      metaBmId: 'bm_demo_123',
      name: 'Loja Demo LTDA',
      accessTokenEnc: 'demo_token_encrypted',
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    },
  })
  console.log('✅ Business Manager criado:', bm.name)

  // ─── Ad Account ───────────────────────────────────────────────────────────
  const adAccount = await prisma.adAccount.upsert({
    where: { metaAccountId: 'act_demo_456' },
    update: {},
    create: {
      businessManagerId: bm.id,
      metaAccountId: 'act_demo_456',
      name: 'Conta Principal - Loja Demo',
      currency: 'BRL',
      timezone: 'America/Sao_Paulo',
      status: 1,
    },
  })
  console.log('✅ Ad Account criada:', adAccount.name)

  // ─── Campanhas ────────────────────────────────────────────────────────────
  const campanhas = [
    {
      metaCampaignId: 'camp_demo_001',
      name: 'Black Friday - Produto Principal',
      status: 'ACTIVE' as const,
      dailyBudget: 200,
      spend: 185.4,
      impressions: 18500,
      clicks: 320,
      conversions: 2,
      revenue: 222.48,
      roas: 1.2,
      cpm: 10.02,
      frequency: 5.2,
      aiAutoPilot: true,
      aiMinRoas: 2.0,
      aiMaxFrequency: 4.0,
    },
    {
      metaCampaignId: 'camp_demo_002',
      name: 'Remarketing - Carrinho Abandonado',
      status: 'ACTIVE' as const,
      dailyBudget: 80,
      spend: 76.2,
      impressions: 6300,
      clicks: 210,
      conversions: 3,
      revenue: 533.4,
      roas: 7.0,
      cpm: 12.1,
      frequency: 2.1,
      aiAutoPilot: true,
      aiMinRoas: 2.0,
      aiMaxFrequency: 4.0,
    },
    {
      metaCampaignId: 'camp_demo_003',
      name: 'Prospecção - Lookalike 1%',
      status: 'ACTIVE' as const,
      dailyBudget: 150,
      spend: 143.0,
      impressions: 32000,
      clicks: 415,
      conversions: 3,
      revenue: 343.2,
      roas: 2.4,
      cpm: 4.47,
      frequency: 1.8,
      aiAutoPilot: true,
      aiMinRoas: 2.0,
      aiMaxFrequency: 4.0,
    },
    {
      metaCampaignId: 'camp_demo_004',
      name: 'Topo de Funil - Vídeo Views',
      status: 'PAUSED' as const,
      dailyBudget: 50,
      spend: 12.0,
      impressions: 9800,
      clicks: 45,
      conversions: 0,
      revenue: 0,
      roas: 0,
      cpm: 1.22,
      frequency: 3.9,
      aiAutoPilot: false,
      aiMinRoas: 2.0,
      aiMaxFrequency: 4.0,
      lastAiAction: 'PAUSE',
      lastAiActionAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    },
    {
      metaCampaignId: 'camp_demo_005',
      name: 'Lançamento - Novo Produto',
      status: 'ACTIVE' as const,
      dailyBudget: 300,
      spend: 287.0,
      impressions: 41000,
      clicks: 890,
      conversions: 12,
      revenue: 1722.0,
      roas: 6.0,
      cpm: 7.0,
      frequency: 1.4,
      aiAutoPilot: true,
      aiMinRoas: 2.0,
      aiMaxFrequency: 4.0,
      lastAiAction: 'SCALE',
      lastAiActionAt: new Date(Date.now() - 30 * 60 * 1000),
    },
  ]

  const createdCampaigns = []
  for (const camp of campanhas) {
    const created = await prisma.campaign.upsert({
      where: { metaCampaignId: camp.metaCampaignId },
      update: {},
      create: { adAccountId: adAccount.id, ...camp },
    })
    createdCampaigns.push(created)
  }
  console.log(`✅ ${createdCampaigns.length} campanhas criadas`)

  // ─── DailyInsights (últimos 30 dias) ──────────────────────────────────────
  for (const campaign of createdCampaigns) {
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)

      const baseSpend = (campaign.spend / 30) * (0.7 + Math.random() * 0.6)
      const baseRoas = campaign.roas * (0.8 + Math.random() * 0.4)
      const conversions = Math.floor(Math.random() * 5)
      const revenue = baseSpend * baseRoas

      await prisma.dailyInsight.upsert({
        where: { campaignId_date: { campaignId: campaign.id, date } },
        update: {},
        create: {
          campaignId: campaign.id,
          date,
          spend: parseFloat(baseSpend.toFixed(2)),
          revenue: parseFloat(revenue.toFixed(2)),
          roas: parseFloat(baseRoas.toFixed(2)),
          cpa: conversions > 0 ? parseFloat((baseSpend / conversions).toFixed(2)) : 0,
          clicks: Math.floor((campaign.clicks / 30) * (0.7 + Math.random() * 0.6)),
          impressions: Math.floor((campaign.impressions / 30) * (0.7 + Math.random() * 0.6)),
          conversions,
          frequency: parseFloat((campaign.frequency * (0.8 + Math.random() * 0.4)).toFixed(2)),
        },
      })
    }
  }
  console.log('✅ DailyInsights criados (30 dias × 5 campanhas)')

  // ─── AiDecisionLogs ───────────────────────────────────────────────────────
  const logs = [
    {
      campaign: createdCampaigns[0],
      type: 'PAUSE' as const,
      reason: 'ROAS 1.2 abaixo do mínimo de 2.0 com spend R$185 — pausando para evitar prejuízo.',
      confidence: 92,
      executed: true,
    },
    {
      campaign: createdCampaigns[1],
      type: 'SCALE' as const,
      reason: 'ROAS 7.0 acima de 3.0 (1.5× o mínimo) com CPA R$25 dentro do limite — escalando +25%.',
      confidence: 88,
      executed: true,
    },
    {
      campaign: createdCampaigns[4],
      type: 'SCALE' as const,
      reason: 'ROAS 6.0 consistente há 3 dias — orçamento aumentado de R$300 para R$375.',
      confidence: 95,
      executed: true,
    },
    {
      campaign: createdCampaigns[2],
      type: 'MONITOR' as const,
      reason: 'ROAS 2.4 dentro da faixa aceitável. Aguardando mais dados antes de escalar.',
      confidence: 70,
      executed: false,
    },
  ]

  for (const log of logs) {
    await prisma.aiDecisionLog.create({
      data: {
        campaignId: log.campaign.id,
        type: log.type,
        reason: log.reason,
        confidence: log.confidence,
        executed: log.executed,
        executedAt: log.executed ? new Date(Date.now() - Math.random() * 5 * 60 * 60 * 1000) : null,
        metrics: {
          spend: log.campaign.spend,
          roas: log.campaign.roas,
          cpa: log.campaign.conversions > 0 ? log.campaign.spend / log.campaign.conversions : 0,
          conversions: log.campaign.conversions,
          frequency: log.campaign.frequency,
          ctr: parseFloat(((log.campaign.clicks / log.campaign.impressions) * 100).toFixed(2)),
          impressions: log.campaign.impressions,
          clicks: log.campaign.clicks,
          targetRoas: 2.0,
          dailyBudget: log.campaign.dailyBudget,
        },
      },
    })
  }
  console.log(`✅ ${logs.length} AiDecisionLogs criados`)

  // ─── Concorrentes ─────────────────────────────────────────────────────────
  const competitors = [
    { name: 'Concorrente A', url: 'https://concorrente-a.com.br', lastPrice: 189.9 },
    { name: 'Concorrente B', url: 'https://concorrente-b.com.br', lastPrice: 175.0 },
    { name: 'Concorrente C', url: 'https://concorrente-c.com.br', lastPrice: 210.0 },
  ]

  for (const comp of competitors) {
    await prisma.competitor.create({
      data: {
        adAccountId: adAccount.id,
        name: comp.name,
        url: comp.url,
        lastPrice: comp.lastPrice,
        lastChecked: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
      },
    })
  }
  console.log(`✅ ${competitors.length} concorrentes criados`)

  // ─── FunnelAudits ─────────────────────────────────────────────────────────
  await prisma.funnelAudit.createMany({
    data: [
      {
        adAccountId: adAccount.id,
        type: 'SLOW_PAGE',
        severity: 'CRITICAL',
        url: 'https://minhaloja.com.br/produto',
        title: 'LCP crítico: 5.2s no mobile',
        description: 'Seu anúncio tem CTR 3.2% mas a LP demora 5.2s — você perde ~68% dos visitantes por lentidão.',
        device: 'mobile',
        browser: 'chromium',
        estimatedRevenueLoss: 2340,
      },
      {
        adAccountId: adAccount.id,
        type: 'PIXEL_FAILURE',
        severity: 'HIGH',
        url: 'https://minhaloja.com.br/checkout',
        title: 'Meta Pixel não detectado na página de checkout',
        description: 'O evento Purchase não está sendo disparado. Você está otimizando às cegas.',
        device: 'mobile',
        browser: 'chromium',
        estimatedRevenueLoss: 890,
      },
      {
        adAccountId: adAccount.id,
        type: 'HIGH_PRICE',
        severity: 'HIGH',
        url: 'https://concorrente-a.com.br',
        title: 'Seu preço está 12% acima do mercado',
        description: 'Concorrente A vende o mesmo produto por R$189,90 enquanto você cobra R$213,00.',
        estimatedRevenueLoss: 1100,
      },
    ],
  })
  console.log('✅ FunnelAudits criados')

  console.log('\n🎉 Seed concluído com sucesso!')
  console.log('   Login demo: demo@funnelguard.ai / demo123')
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
