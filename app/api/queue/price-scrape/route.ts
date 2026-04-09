/**
 * Worker Route: Price Scrape
 *
 * Chamado pelo QStash (ou diretamente em dev) para executar o scraping
 * de preço de um concorrente. QStash faz até 3 retries automáticos.
 *
 * Timeout: até 5 min (Vercel Pro) / 60s (Hobby)
 */

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { crawlCompetitorPrice } from '@/lib/scraping/price-crawler'
import { verifyQueueRequest } from '@/lib/queue'
import type { PriceScrapeJob } from '@/lib/queue'
import type { Browser } from 'playwright'

export const maxDuration = 60 // segundos (Vercel Hobby limit)

export async function POST(request: NextRequest) {
  if (!verifyQueueRequest(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let job: PriceScrapeJob
  try {
    job = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
  }

  const { competitorId, url } = job

  let browser: Browser | null = null
  try {
    const { chromium } = await import('playwright')
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    })
    const result = await crawlCompetitorPrice(url, 'Concorrente', browser)

    if (!result.price) {
      console.warn(`[price-scrape] Preço não encontrado para ${url}`)
      return NextResponse.json({ ok: true, found: false })
    }

    // Salva o preço no histórico
    await prisma.competitorPrice.create({
      data: {
        competitorId,
        price: result.price,
        currency: result.currency ?? 'BRL',
      },
    })

    // Atualiza lastPrice no Competitor
    await prisma.competitor.update({
      where: { id: competitorId },
      data: {
        lastPrice: result.price,
        lastChecked: new Date(),
      },
    })

    console.log(`[price-scrape] ✓ ${url} → R$ ${result.price}`)
    return NextResponse.json({ ok: true, found: true, price: result.price })
  } catch (error) {
    console.error(`[price-scrape] Erro em ${url}:`, error)
    // Retorna 500 para o QStash tentar novamente (retry)
    return NextResponse.json(
      { error: 'Scrape failed', detail: String(error) },
      { status: 500 }
    )
  } finally {
    await browser?.close()
  }
}
