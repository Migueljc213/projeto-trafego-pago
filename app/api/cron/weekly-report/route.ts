/**
 * Cron Job: Relatório Semanal por Email
 *
 * Vercel Hobby: 1 cron/dia → agendar toda segunda-feira às 09:00
 * vercel.json: { "crons": [{ "path": "/api/cron/weekly-report", "schedule": "0 9 * * 1" }] }
 *
 * Compila métricas dos últimos 7 dias + decisões da IA + dinheiro economizado.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendWeeklyReport } from '@/lib/email'

export const maxDuration = 60

export async function GET(request: NextRequest) {
  const secret = request.headers.get('x-cron-secret') ?? request.nextUrl.searchParams.get('secret')
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - 7)
  weekStart.setHours(0, 0, 0, 0)

  // Formata label da semana: "7 a 13 de Abril"
  const fmt = (d: Date) =>
    d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })
  const weekLabel = `${fmt(weekStart)} a ${fmt(now)}`

  // Busca todos os usuários com email e pelo menos uma campanha ativa
  const users = await prisma.user.findMany({
    where: {
      email: { not: null },
      businessManagers: {
        some: {
          adAccounts: {
            some: { campaigns: { some: {} } },
          },
        },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      businessManagers: {
        select: {
          adAccounts: {
            select: {
              id: true,
              competitors: { select: { id: true } },
              campaigns: {
                select: {
                  id: true,
                  name: true,
                  roas: true,
                  spend: true,
                  revenue: true,
                  dailyBudget: true,
                  decisionLogs: {
                    where: { createdAt: { gte: weekStart } },
                    select: {
                      type: true,
                      reason: true,
                      metrics: true,
                      executed: true,
                      createdAt: true,
                    },
                    orderBy: { createdAt: 'desc' },
                    take: 20,
                  },
                  dailyInsights: {
                    where: { date: { gte: weekStart } },
                    select: { spend: true, revenue: true, roas: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  })

  let sent = 0
  let skipped = 0

  for (const user of users) {
    if (!user.email) { skipped++; continue }

    const allCampaigns = user.businessManagers.flatMap((bm) =>
      bm.adAccounts.flatMap((aa) => aa.campaigns)
    )
    const allCompetitors = user.businessManagers.flatMap((bm) =>
      bm.adAccounts.flatMap((aa) => aa.competitors)
    )

    if (allCampaigns.length === 0) { skipped++; continue }

    // Agrega métricas semanais dos DailyInsights
    let totalSpend = 0
    let totalRevenue = 0
    let roasSum = 0
    let roasCount = 0

    const campaignStats = allCampaigns.map((c) => {
      const weekSpend = c.dailyInsights.reduce((s, d) => s + d.spend, 0)
      const weekRevenue = c.dailyInsights.reduce((s, d) => s + d.revenue, 0)
      const weekRoas = weekSpend > 0 ? weekRevenue / weekSpend : c.roas

      totalSpend += weekSpend || c.spend
      totalRevenue += weekRevenue || c.revenue

      if (weekRoas > 0) {
        roasSum += weekRoas
        roasCount++
      }

      return {
        name: c.name,
        roas: weekRoas > 0 ? weekRoas : c.roas,
        spend: weekSpend > 0 ? weekSpend : c.spend,
        revenue: weekRevenue > 0 ? weekRevenue : c.revenue,
      }
    })

    const avgRoas = roasCount > 0 ? roasSum / roasCount : 0

    // Compila decisões da IA
    const allDecisions = allCampaigns.flatMap((c) =>
      c.decisionLogs.map((d) => ({
        campaignName: c.name,
        type: d.type,
        reason: d.reason,
        // Estima budget preservado: pausar = economiza dailyBudget dos dias restantes da semana
        savedBudget:
          d.type === 'PAUSE' && d.executed && c.dailyBudget
            ? c.dailyBudget * 2 // estimativa conservadora: 2 dias de budget preservados
            : undefined,
      }))
    )

    // Total dinheiro economizado = soma dos budgets preservados pelas pausas
    const moneySaved = allDecisions.reduce((acc, d) => acc + (d.savedBudget ?? 0), 0)

    // Top 3 campanhas por receita
    const topCampaigns = [...campaignStats]
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)

    try {
      await sendWeeklyReport({
        to: user.email,
        userName: user.name ?? 'Usuário',
        weekLabel,
        totalSpend,
        totalRevenue,
        avgRoas,
        moneySaved,
        topCampaigns,
        aiDecisions: allDecisions.slice(0, 8),
        activeCompetitors: allCompetitors.length,
      })
      sent++
    } catch (err) {
      console.error(`[weekly-report] Erro ao enviar para ${user.email}:`, err)
      skipped++
    }
  }

  console.log(`[weekly-report] ✓ Enviados: ${sent}, Pulados: ${skipped}`)
  return NextResponse.json({ ok: true, sent, skipped, weekLabel })
}
