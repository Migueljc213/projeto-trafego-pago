import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import OpenAI from 'openai'
import { NextResponse } from 'next/server'

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

/**
 * POST /api/campaign-chat
 * Body: { message: string; history?: { role: 'user'|'assistant'; content: string }[] }
 * Responde perguntas sobre as campanhas do usuário usando GPT-4o-mini.
 */
export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json() as {
    message: string
    history?: { role: 'user' | 'assistant'; content: string }[]
  }

  if (!body.message?.trim()) {
    return NextResponse.json({ error: 'Mensagem vazia' }, { status: 400 })
  }

  // Busca dados das campanhas e insights recentes do usuário
  const adAccount = await prisma.adAccount.findFirst({
    where: { businessManager: { userId: session.user.id } },
    include: {
      campaigns: {
        orderBy: { spend: 'desc' },
        take: 10,
        include: {
          decisionLogs: {
            orderBy: { createdAt: 'desc' },
            take: 3,
            select: { type: true, reason: true, createdAt: true },
          },
        },
      },
    },
  })

  const today = new Date()
  const since30d = new Date(today)
  since30d.setDate(since30d.getDate() - 30)

  const dailyInsights = adAccount
    ? await prisma.dailyInsight.findMany({
        where: {
          campaign: { adAccountId: adAccount.id },
          date: { gte: since30d },
        },
        orderBy: { date: 'desc' },
        take: 100,
        include: { campaign: { select: { name: true } } },
      })
    : []

  // Monta resumo das campanhas para o contexto
  const campaignSummary = (adAccount?.campaigns ?? []).map(c => {
    const recentDecisions = c.decisionLogs.map(d =>
      `  - ${d.type} em ${new Date(d.createdAt).toLocaleDateString('pt-BR')}: ${d.reason.slice(0, 100)}`
    ).join('\n')

    return `Campanha: ${c.name}
  Status: ${c.status}
  Orçamento diário: R$${c.dailyBudget ?? 0}
  Spend total: R$${c.spend.toFixed(2)}
  ROAS: ${c.roas.toFixed(2)}x
  Conversões: ${c.conversions}
  Frequência: ${c.frequency.toFixed(1)}
  CPM: R$${c.cpm.toFixed(2)}
  Auto-Pilot: ${c.aiAutoPilot ? 'Ativo' : 'Inativo'}
  Últimas decisões da IA:
${recentDecisions || '  Nenhuma decisão registrada'}`
  }).join('\n\n')

  // Agrega insights dos últimos 7 dias
  const last7 = new Date(today)
  last7.setDate(last7.getDate() - 7)
  const recent = dailyInsights.filter(i => new Date(i.date) >= last7)
  const spendLast7 = recent.reduce((s, i) => s + i.spend, 0)
  const revenueLast7 = recent.reduce((s, i) => s + i.revenue, 0)
  const roasLast7 = spendLast7 > 0 ? revenueLast7 / spendLast7 : 0

  const systemPrompt = `Você é um especialista em tráfego pago Meta Ads integrado ao FunnelGuard AI.
Responda perguntas sobre as campanhas do usuário de forma direta, prática e em português.
Use os dados abaixo para embasar sua resposta. Dê recomendações concretas e acionáveis.
Se não houver dados suficientes, diga claramente e sugira como obter mais informações.
Não invente métricas — use apenas o que foi fornecido.

DATA ATUAL: ${today.toLocaleDateString('pt-BR')}

RESUMO DOS ÚLTIMOS 7 DIAS (todas as campanhas):
  Spend: R$${spendLast7.toFixed(2)}
  Receita estimada: R$${revenueLast7.toFixed(2)}
  ROAS médio: ${roasLast7.toFixed(2)}x

CAMPANHAS (top 10 por gasto):
${campaignSummary || 'Nenhuma campanha encontrada.'}`

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...(body.history ?? []).slice(-8).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user', content: body.message },
  ]

  try {
    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 600,
      temperature: 0.4,
    })

    const reply = completion.choices[0]?.message?.content ?? 'Sem resposta'
    return NextResponse.json({ reply })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro na IA: ${msg}` }, { status: 500 })
  }
}
