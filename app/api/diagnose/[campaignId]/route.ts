/**
 * /api/diagnose/[campaignId]
 *
 * GET  — Retorna o último StrategicInsight salvo para a campanha.
 * POST — Executa o Motor de Correlação on-demand para a campanha e salva o resultado.
 *
 * Diferente do Auto-Pilot, não executa ações na Meta API.
 * Serve o painel DiagnosticCenter no dashboard.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getStrategicInsight, type CorrelationPayload } from '@/lib/ai/correlation-engine'

export const runtime = 'nodejs'
export const maxDuration = 30

type Params = { params: { campaignId: string } }

// ─── GET: último diagnóstico salvo ───────────────────────────────────────────

export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { campaignId } = params

  const insight = await prisma.strategicInsight.findFirst({
    where: {
      campaignId,
      adAccount: { businessManager: { userId: session.user.id } },
    },
    orderBy: { createdAt: 'desc' },
    include: { campaign: { select: { name: true } } },
  })

  if (!insight) {
    return NextResponse.json({ insight: null })
  }

  const raw = insight.rawData as Record<string, unknown> | null

  return NextResponse.json({
    insight: {
      id: insight.id,
      campaignId: insight.campaignId,
      campaignName: insight.campaign?.name ?? null,
      weekStart: insight.weekStart,
      rootCause: insight.rootCause,
      executiveSummary: typeof raw?.executiveSummary === 'string' ? raw.executiveSummary : null,
      bottleneck: insight.bottleneck,
      adScore: insight.adScore,
      priceScore: insight.priceScore,
      siteScore: insight.siteScore,
      createdAt: insight.createdAt,
    },
  })
}

// ─── POST: diagnóstico on-demand ──────────────────────────────────────────────

export async function POST(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { campaignId } = params

  // Busca campanha + relacionamentos (mesmo padrão do runCorrelatedAutoPilotAction)
  const campaign = await prisma.campaign.findFirst({
    where: {
      id: campaignId,
      adAccount: { businessManager: { userId: session.user.id } },
    },
    include: {
      adAccount: {
        include: {
          competitors: true,
          funnelAudits: {
            where: { resolved: false },
            orderBy: { createdAt: 'desc' },
            take: 20,
          },
        },
      },
    },
  })

  if (!campaign) {
    return NextResponse.json({ error: 'Campanha não encontrada ou sem permissão' }, { status: 404 })
  }

  // Monta payload de correlação
  const competitorPrices: CorrelationPayload['competitorPrices'] = campaign.adAccount.competitors.map((c) => {
    const isStale = c.lastChecked
      ? Date.now() - c.lastChecked.getTime() > 24 * 60 * 60 * 1000
      : true
    const scrapeFailed = !c.lastPrice || isStale
    return {
      competitorId: c.id,
      competitorName: c.name,
      price: scrapeFailed ? null : c.lastPrice,
      myPrice: null,
      currency: c.currency,
      scrapedAt: c.lastChecked,
      scrapeFailed,
    }
  })

  const audits = campaign.adAccount.funnelAudits
  const spendThreshold = (campaign.dailyBudget ?? 100) * 0.3
  const cpa = campaign.conversions > 0 ? campaign.spend / campaign.conversions : 9999

  const correlationPayload: CorrelationPayload = {
    campaign: {
      campaignId: campaign.id,
      campaignName: campaign.name,
      roas: campaign.roas,
      targetRoas: campaign.aiMinRoas,
      spend: campaign.spend,
      spendThreshold,
      cpa,
      cpaLimit: campaign.conversions > 0 ? cpa * 1.5 : 999,
      frequency: campaign.frequency,
      clicks: campaign.clicks,
      impressions: campaign.impressions,
      conversions: campaign.conversions,
    },
    competitorPrices,
    lpAudit: {
      hasCheckoutError: audits.some((a) => a.type === 'CHECKOUT_ERROR' && a.severity === 'CRITICAL'),
      hasPixelFailure: audits.some((a) => a.type === 'PIXEL_FAILURE'),
      hasSlowPage: audits.some((a) => a.type === 'SLOW_PAGE' && (a.severity === 'HIGH' || a.severity === 'CRITICAL')),
      hasBrokenCta: audits.some((a) => a.type === 'BROKEN_CTA' && a.severity !== 'LOW'),
      criticalIssueCount: audits.filter((a) => a.severity === 'CRITICAL').length,
      highIssueCount: audits.filter((a) => a.severity === 'HIGH').length,
      auditScore: null,
      lastAuditedAt: audits[0]?.createdAt ?? null,
      topIssueDescription: audits.find((a) => a.severity === 'CRITICAL')?.description ?? audits[0]?.description ?? null,
    },
  }

  try {
    const correlation = await getStrategicInsight(correlationPayload)

    // Persiste no banco
    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    weekStart.setHours(0, 0, 0, 0)

    const saved = await prisma.strategicInsight.create({
      data: {
        adAccountId: campaign.adAccountId,
        campaignId: campaign.id,
        weekStart,
        rootCause: correlation.rootCauseInsight,
        bottleneck: correlation.bottleneck,
        adScore: correlation.adScore,
        priceScore: correlation.priceScore,
        siteScore: correlation.siteScore,
        rawData: {
          ...(correlationPayload as object),
          executiveSummary: correlation.executiveSummary,
        },
      },
    })

    return NextResponse.json({
      insight: {
        id: saved.id,
        campaignId: saved.campaignId,
        campaignName: campaign.name,
        weekStart: saved.weekStart,
        rootCause: correlation.rootCauseInsight,
        executiveSummary: correlation.executiveSummary,
        bottleneck: correlation.bottleneck,
        adScore: correlation.adScore,
        priceScore: correlation.priceScore,
        siteScore: correlation.siteScore,
        createdAt: saved.createdAt,
        trigger: correlation.trigger,
        confidence: correlation.confidence,
        details: correlation.details,
      },
    })
  } catch (err) {
    console.error('[diagnose] Erro ao executar diagnóstico:', err)
    return NextResponse.json(
      { error: `Falha ao diagnosticar: ${err instanceof Error ? err.message : 'Erro desconhecido'}` },
      { status: 500 }
    )
  }
}
