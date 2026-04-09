/**
 * Worker Route: LP Audit
 *
 * Executa auditoria de landing page de forma assíncrona.
 * QStash faz até 3 retries em caso de falha.
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auditLandingPage } from '@/lib/scraping/lp-audit'
import { verifyQueueRequest } from '@/lib/queue'
import type { LpAuditJob } from '@/lib/queue'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  if (!verifyQueueRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let job: LpAuditJob
  try {
    job = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { adAccountId, url, campaignId } = job

  try {
    const auditResult = await auditLandingPage(url)

    // Persiste os issues encontrados (mapeia tipos da auditoria → enum do Prisma)
    const VALID_TYPES = new Set([
      'BROKEN_CTA', 'HIGH_PRICE', 'SLOW_PAGE', 'MOBILE_UX',
      'CHECKOUT_ERROR', 'PIXEL_FAILURE', 'HIGH_SHIPPING', 'COMPETITOR_CHEAPER',
    ])

    const validIssues = (auditResult.issues ?? []).filter((i) => VALID_TYPES.has(i.type))

    if (validIssues.length > 0) {
      await prisma.funnelAudit.createMany({
        data: validIssues.map((issue) => ({
          adAccountId,
          type: issue.type as 'BROKEN_CTA' | 'HIGH_PRICE' | 'SLOW_PAGE' | 'MOBILE_UX' | 'CHECKOUT_ERROR' | 'PIXEL_FAILURE' | 'HIGH_SHIPPING' | 'COMPETITOR_CHEAPER',
          severity: issue.severity,
          url,
          title: issue.title,
          description: issue.description,
        })),
        skipDuplicates: true,
      })
    }

    console.log(
      `[lp-audit] ✓ ${url} → ${auditResult.issues?.length ?? 0} issues encontrados (${validIssues.length} salvos)`
    )
    return NextResponse.json({
      ok: true,
      issuesFound: auditResult.issues?.length ?? 0,
      campaignId,
    })
  } catch (error) {
    console.error(`[lp-audit] Erro em ${url}:`, error)
    return NextResponse.json(
      { error: 'Audit failed', detail: String(error) },
      { status: 500 }
    )
  }
}
