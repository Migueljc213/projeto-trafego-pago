'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { runPriceIntelligence } from '@/lib/scraping/price-crawler'
import { auditLandingPage } from '@/lib/scraping/lp-audit'
import { sendPredictivePriceDropAlert } from '@/lib/email'
import type { ActionResult } from './ad-accounts'
import type { PriceComparisonResult } from '@/lib/scraping/price-crawler'
import type { LpAuditResult } from '@/lib/scraping/lp-audit'

// ─── Price Intelligence ───────────────────────────────────────────────────────

/**
 * Executa o crawler de preços para todos os concorrentes de uma conta de anúncio.
 * Persiste os preços encontrados no banco e gera alertas automaticamente.
 */
export async function runPriceIntelligenceAction(
  adAccountId: string,
  myPrice: number,
  myProductName: string
): Promise<ActionResult<PriceComparisonResult & { savedAlerts: number }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  // Verifica que a conta pertence ao usuário
  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: adAccountId,
      businessManager: { userId: session.user.id },
    },
    include: { competitors: true },
  })

  if (!adAccount) return { success: false, error: 'Conta de anúncio não encontrada' }
  if (adAccount.competitors.length === 0) {
    return { success: false, error: 'Nenhum concorrente cadastrado para esta conta' }
  }

  try {
    // Executa o crawler
    const result = await runPriceIntelligence(
      myPrice,
      myProductName,
      adAccount.competitors.map((c: (typeof adAccount.competitors)[number]) => ({ name: c.name, url: c.url }))
    )

    // Busca o usuário para alertas por email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, name: true },
    })

    // Atualiza preços no banco + dispara alertas preditivos se o concorrente baixou o preço
    await Promise.all(
      result.competitors.map(async (crawled) => {
        const competitor = adAccount.competitors.find((c: (typeof adAccount.competitors)[number]) => c.url === crawled.url)
        if (competitor && crawled.price !== null) {
          // Detecção de queda de preço do concorrente (alerta preditivo)
          const oldPrice = competitor.lastPrice
          if (oldPrice && oldPrice > 0) {
            const dropPct = ((oldPrice - crawled.price) / oldPrice) * 100
            // Se o concorrente baixou o preço em >5%, dispara alerta antes do ROAS cair
            if (dropPct >= 5 && user?.email) {
              sendPredictivePriceDropAlert({
                to: user.email,
                userName: user.name ?? 'Usuário',
                competitorName: competitor.name,
                productContext: myProductName,
                previousPrice: oldPrice,
                newPrice: crawled.price,
                dropPercent: dropPct,
              }).catch((e) => console.error('[price-drop-alert]', e))
            }
          }

          await prisma.competitor.update({
            where: { id: competitor.id },
            data: {
              lastPrice: crawled.price,
              lastChecked: crawled.checkedAt,
            },
          })
        }
      })
    )

    // Salva alerta no FunnelAudit se houver risco de preço
    let savedAlerts = 0
    if (result.alert === 'HIGH_PRICE_RISK') {
      await prisma.funnelAudit.create({
        data: {
          adAccountId,
          type: 'HIGH_PRICE',
          severity: result.priceDiffPercent! > 20 ? 'CRITICAL' : 'HIGH',
          url: adAccount.competitors[0]?.url ?? '',
          title: 'Risco de Preço Alto Detectado',
          description: result.alertMessage,
          estimatedRevenueLoss: myPrice * 0.15, // Estimativa conservadora
        },
      })
      savedAlerts++
    }

    return {
      success: true,
      data: { ...result, savedAlerts },
    }
  } catch (err) {
    console.error('[runPriceIntelligence]', err)
    return { success: false, error: 'Erro ao executar Price Intelligence' }
  }
}

// ─── LP Audit ─────────────────────────────────────────────────────────────────

/**
 * Executa auditoria completa de uma Landing Page.
 * Persiste os problemas encontrados no banco como FunnelAudits.
 */
export async function runLpAuditAction(
  adAccountId: string,
  url: string,
  ctr?: number
): Promise<ActionResult<LpAuditResult & { savedIssues: number }>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  // Verifica ownership
  const adAccount = await prisma.adAccount.findFirst({
    where: {
      id: adAccountId,
      businessManager: { userId: session.user.id },
    },
  })

  if (!adAccount) return { success: false, error: 'Conta de anúncio não encontrada' }

  try {
    const result = await auditLandingPage(url, {
      ctr: ctr ?? 1.5,
      mobileTrafficPercent: 65,
    })

    // Persiste cada issue crítico/alto no banco
    const issuesToSave = result.issues.filter(
      (i) => i.severity === 'CRITICAL' || i.severity === 'HIGH'
    )

    await Promise.all(
      issuesToSave.map((issue) =>
        prisma.funnelAudit.create({
          data: {
            adAccountId,
            type: issue.type as never,
            severity: issue.severity as never,
            url,
            title: issue.title,
            description: issue.description,
            device: 'mobile',
            browser: 'chromium',
            estimatedRevenueLoss: parseImpactToNumber(issue.estimatedImpact),
          },
        })
      )
    )

    return {
      success: true,
      data: { ...result, savedIssues: issuesToSave.length },
    }
  } catch (err) {
    console.error('[runLpAudit]', err)
    return {
      success: false,
      error: `Erro ao auditar Landing Page: ${err instanceof Error ? err.message : 'Erro desconhecido'}`,
    }
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Extrai número de uma string de impacto como "Perda de R$ 2.340/mês" */
function parseImpactToNumber(impact: string): number | null {
  const match = impact.match(/R\$\s*([\d.,]+)/)
  if (!match) return null
  return parseFloat(match[1].replace(/\./g, '').replace(',', '.'))
}
