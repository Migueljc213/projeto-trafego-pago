import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface AdVariant {
  angle: string
  headline: string
  primaryText: string
  cta: 'SHOP_NOW' | 'LEARN_MORE' | 'SIGN_UP' | 'CONTACT_US' | 'GET_OFFER'
  ctaLabel: string
}

export interface RewriteAdResult {
  campaignName: string
  problem: string
  variants: AdVariant[]
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json() as { campaignId: string }
  if (!body.campaignId) {
    return NextResponse.json({ error: 'campaignId obrigatório' }, { status: 400 })
  }

  const campaign = await prisma.campaign.findFirst({
    where: {
      id: body.campaignId,
      adAccount: { businessManager: { userId: session.user.id } },
    },
    select: {
      name: true, status: true, spend: true, roas: true, aiMinRoas: true,
      impressions: true, clicks: true, conversions: true, frequency: true, cpm: true,
      decisionLogs: {
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { type: true, reason: true },
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  const ctr = campaign.impressions > 0
    ? (campaign.clicks / campaign.impressions * 100)
    : 0
  const cpa = campaign.conversions > 0 ? campaign.spend / campaign.conversions : null

  // Identify the main problem
  const problems: string[] = []
  if (ctr < 1) problems.push(`CTR muito baixo (${ctr.toFixed(2)}% — benchmark: >1%)`)
  if (campaign.roas < campaign.aiMinRoas) problems.push(`ROAS abaixo do mínimo (${campaign.roas.toFixed(2)}x vs target ${campaign.aiMinRoas.toFixed(2)}x)`)
  if (campaign.frequency > 3.5) problems.push(`Frequência alta (${campaign.frequency.toFixed(1)} — público saturado)`)
  if (problems.length === 0) problems.push(`Oportunidade de testar novas variações de copy para escalar performance`)

  const problemStr = problems.join('; ')

  const recentActions = campaign.decisionLogs
    .map(d => `${d.type}: ${d.reason.slice(0, 80)}`)
    .join(' | ') || 'Nenhuma ação recente'

  const prompt = `Você é um copywriter especialista em anúncios para Meta Ads no mercado brasileiro.

CAMPANHA: "${campaign.name}"
MÉTRICAS ATUAIS:
- ROAS: ${campaign.roas.toFixed(2)}x (target: ${campaign.aiMinRoas.toFixed(2)}x)
- CTR: ${ctr.toFixed(2)}%
- CPA: ${cpa ? `R$${cpa.toFixed(2)}` : 'N/A'}
- Frequência: ${campaign.frequency.toFixed(1)}
- CPM: R$${campaign.cpm.toFixed(2)}
- Spend total: R$${campaign.spend.toFixed(0)}
PROBLEMA IDENTIFICADO: ${problemStr}
AÇÕES RECENTES DA IA: ${recentActions}

Crie 3 variações de copy para um anúncio Meta Ads que corrija o problema identificado.
Cada variação deve usar um ângulo diferente e ser otimizada para o problema.

Retorne EXCLUSIVAMENTE JSON válido com esta estrutura:
{
  "variants": [
    {
      "angle": "nome do ângulo (ex: Urgência, Prova Social, Benefício Direto)",
      "headline": "título do anúncio (máximo 40 caracteres)",
      "primaryText": "texto principal do anúncio (2-3 frases impactantes, máximo 125 palavras)",
      "cta": "SHOP_NOW" | "LEARN_MORE" | "SIGN_UP" | "CONTACT_US" | "GET_OFFER",
      "ctaLabel": "tradução do CTA em português"
    }
  ]
}`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um copywriter especialista em performance marketing para o mercado brasileiro. Responda EXCLUSIVAMENTE com JSON válido.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 900,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as { variants: AdVariant[] }

    return NextResponse.json({
      result: {
        campaignName: campaign.name,
        problem: problemStr,
        variants: parsed.variants ?? [],
      } satisfies RewriteAdResult,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro na IA: ${msg}` }, { status: 500 })
  }
}
