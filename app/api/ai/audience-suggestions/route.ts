import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export interface AudienceSuggestion {
  interests: string[]
  ageRange: { min: number; max: number }
  gender: 'all' | 'male' | 'female'
  placements: string[]
  lookalikes: Array<{ source: string; reason: string }>
  reasoning: string
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json() as { productDescription?: string }

  const adAccount = await prisma.adAccount.findFirst({
    where: { businessManager: { userId: session.user.id } },
    include: {
      campaigns: {
        orderBy: { roas: 'desc' },
        take: 10,
        select: {
          name: true, status: true, spend: true, roas: true,
          impressions: true, clicks: true, conversions: true, frequency: true,
          aiMinRoas: true,
        },
      },
    },
  })

  const campaigns = adAccount?.campaigns ?? []
  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE')

  const campaignContext = campaigns
    .map(c => {
      const ctr = c.impressions > 0 ? (c.clicks / c.impressions * 100).toFixed(2) : '0'
      const cpa = c.conversions > 0 ? (c.spend / c.conversions).toFixed(2) : 'N/A'
      return `- ${c.name} | Status: ${c.status} | ROAS: ${c.roas.toFixed(2)}x | CTR: ${ctr}% | CPA: R$${cpa} | Spend: R$${c.spend.toFixed(0)} | Frequência: ${c.frequency.toFixed(1)}`
    })
    .join('\n')

  const bestCampaign = campaigns.find(c => c.roas > 0)
  const avgRoas = campaigns.length > 0
    ? campaigns.reduce((s, c) => s + c.roas, 0) / campaigns.length
    : 0

  const systemPrompt = `Você é um especialista sênior em tráfego pago no Meta Ads, focado no mercado brasileiro.
Sua tarefa é analisar o desempenho das campanhas fornecidas e sugerir a melhor estratégia de segmentação de público.
Responda EXCLUSIVAMENTE em JSON válido, sem texto extra antes ou depois.`

  const userPrompt = `Analise estas campanhas do Meta Ads e gere sugestões de segmentação de público:

CAMPANHAS (ordenadas por ROAS):
${campaignContext || 'Nenhuma campanha encontrada.'}

${body.productDescription ? `DESCRIÇÃO DO PRODUTO/SERVIÇO:\n${body.productDescription}\n` : ''}
CONTEXTO:
- ${activeCampaigns.length} campanhas ativas
- ROAS médio: ${avgRoas.toFixed(2)}x
${bestCampaign ? `- Melhor campanha: "${bestCampaign.name}" (${bestCampaign.roas.toFixed(2)}x ROAS)` : ''}

Retorne um JSON com esta estrutura EXATA:
{
  "interests": ["interesse1", "interesse2", ... (10 a 15 interesses específicos do Facebook, em português)],
  "ageRange": { "min": 18, "max": 65 },
  "gender": "all" | "male" | "female",
  "placements": ["facebook_feed", "instagram_feed", "instagram_reels", "instagram_stories", "facebook_stories", "audience_network"],
  "lookalikes": [
    { "source": "descrição da fonte do público semente", "reason": "por que este público semente geraria bom LAL" },
    { "source": "...", "reason": "..." },
    { "source": "...", "reason": "..." }
  ],
  "reasoning": "Explicação em 2-3 frases sobre as escolhas de segmentação baseadas nos dados das campanhas"
}`

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      max_tokens: 800,
      temperature: 0.3,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content ?? '{}'
    const suggestion = JSON.parse(raw) as AudienceSuggestion
    return NextResponse.json({ suggestion })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro na IA: ${msg}` }, { status: 500 })
  }
}
