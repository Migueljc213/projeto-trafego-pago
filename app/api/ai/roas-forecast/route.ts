import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'
import { checkRateLimit } from '@/lib/rate-limit'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface RoasForecastDay {
  offset: number      // 1–7
  label: string       // ex: "Seg 19/05"
  predictedRoas: number
}

export interface RoasForecast {
  campaignName: string
  trend: 'UP' | 'DOWN' | 'STABLE'
  predictedAvgRoas: number
  confidence: 'high' | 'medium' | 'low'
  weekSummary: string
  recommendation: string
  days: RoasForecastDay[]
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  // 5 forecasts por minuto por usuário
  if (!checkRateLimit(`roas-forecast:${session.user.id}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas requisições. Aguarde um momento.' }, { status: 429 })
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
      name: true,
      status: true,
      roas: true,
      aiMinRoas: true,
      spend: true,
      impressions: true,
      clicks: true,
      conversions: true,
      frequency: true,
      dailyInsights: {
        orderBy: { date: 'asc' },
        take: 60,
        select: { date: true, roas: true, spend: true, clicks: true, impressions: true, conversions: true },
      },
      decisionLogs: {
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { type: true, reason: true, createdAt: true },
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campanha não encontrada' }, { status: 404 })
  }

  if (campaign.dailyInsights.length < 3) {
    return NextResponse.json({ error: 'Dados insuficientes: são necessários pelo menos 3 dias de histórico para gerar previsão.' }, { status: 422 })
  }

  const historicalData = campaign.dailyInsights
    .map(d => {
      const dateStr = new Date(d.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })
      const ctr = d.impressions > 0 ? (d.clicks / d.impressions * 100).toFixed(2) : '0.00'
      return `${dateStr}: ROAS=${d.roas.toFixed(2)}x, Spend=R$${d.spend.toFixed(0)}, CTR=${ctr}%, Conv=${d.conversions}`
    })
    .join('\n')

  const recentActions = campaign.decisionLogs
    .map(d => `${d.type}: ${d.reason.slice(0, 100)}`)
    .join(' | ') || 'Nenhuma ação recente'

  const ctr = campaign.impressions > 0 ? (campaign.clicks / campaign.impressions * 100).toFixed(2) : '0'

  const prompt = `Você é um analista sênior de tráfego pago especializado em previsão de performance para Meta Ads no mercado brasileiro.

CAMPANHA: "${campaign.name}"
STATUS: ${campaign.status}
MÉTRICAS ATUAIS (período):
- ROAS atual: ${campaign.roas.toFixed(2)}x (target: ${campaign.aiMinRoas.toFixed(2)}x)
- CTR: ${ctr}%
- Frequência: ${campaign.frequency.toFixed(1)}
- Conversões: ${campaign.conversions}
- Gasto total: R$${campaign.spend.toFixed(0)}

HISTÓRICO DIÁRIO (últimos ${campaign.dailyInsights.length} dias):
${historicalData}

AÇÕES RECENTES DA IA AUTO-PILOT:
${recentActions}

Com base neste histórico real de performance, gere uma previsão fundamentada para os próximos 7 dias.
Analise tendências, sazonalidade, variações recentes e o comportamento do ROAS ao longo do tempo.

Retorne EXCLUSIVAMENTE JSON válido com esta estrutura:
{
  "trend": "UP" | "DOWN" | "STABLE",
  "predictedAvgRoas": number (ex: 3.2),
  "confidence": "high" | "medium" | "low",
  "weekSummary": "frase explicando a tendência identificada e por que (2-3 frases)",
  "recommendation": "ação prática recomendada (1 frase)",
  "days": [
    { "offset": 1, "label": "nome do dia da semana + data", "predictedRoas": number },
    { "offset": 2, "label": "...", "predictedRoas": number },
    { "offset": 3, "label": "...", "predictedRoas": number },
    { "offset": 4, "label": "...", "predictedRoas": number },
    { "offset": 5, "label": "...", "predictedRoas": number },
    { "offset": 6, "label": "...", "predictedRoas": number },
    { "offset": 7, "label": "...", "predictedRoas": number }
  ]
}
Hoje é ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}.`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'Você é um analista de dados de tráfego pago. Responda EXCLUSIVAMENTE com JSON válido, sem texto adicional.' },
        { role: 'user', content: prompt },
      ],
      max_tokens: 600,
      temperature: 0.2,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const parsed = JSON.parse(raw) as Omit<RoasForecast, 'campaignName'>

    return NextResponse.json({
      forecast: {
        campaignName: campaign.name,
        ...parsed,
      } satisfies RoasForecast,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro na IA: ${msg}` }, { status: 500 })
  }
}
