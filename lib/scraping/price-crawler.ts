/**
 * Price Intelligence Crawler — extrai preços de concorrentes via fetch + cheerio.
 * Sem dependências de browser — compatível com Vercel/serverless.
 */

import * as cheerio from 'cheerio'

// ─── User Agents reais ────────────────────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
]

function randomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)]
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CompetitorPriceResult {
  url: string
  competitorName: string
  price: number | null
  currency: string
  extractionMethod: 'json-ld' | 'opengraph' | 'css-selector' | 'not-found'
  error?: string
  checkedAt: Date
}

export interface PriceComparisonResult {
  myProduct: {
    name: string
    price: number
    currency: string
  }
  competitors: CompetitorPriceResult[]
  alert: 'HIGH_PRICE_RISK' | 'COMPETITIVE' | 'PRICE_LEADER'
  alertMessage: string
  minCompetitorPrice: number | null
  priceDiffPercent: number | null
}

// ─── robots.txt check ─────────────────────────────────────────────────────────

async function isAllowedByRobots(url: string): Promise<boolean> {
  try {
    const { hostname, protocol } = new URL(url)
    const robotsUrl = `${protocol}//${hostname}/robots.txt`
    const res = await fetch(robotsUrl, {
      headers: { 'User-Agent': randomUserAgent() },
      signal: AbortSignal.timeout(5000),
    })
    if (!res.ok) return true

    const text = await res.text()
    const lines = text.split('\n')
    let isOurAgent = false

    for (const line of lines) {
      const trimmed = line.trim().toLowerCase()
      if (trimmed.startsWith('user-agent:')) {
        const agent = trimmed.replace('user-agent:', '').trim()
        isOurAgent = agent === '*' || agent === 'googlebot'
      }
      if (isOurAgent && trimmed.startsWith('disallow:')) {
        const disallowed = trimmed.replace('disallow:', '').trim()
        if (disallowed === '/' || new URL(url).pathname.startsWith(disallowed)) {
          return false
        }
      }
    }
    return true
  } catch {
    return true
  }
}

// ─── Extratores de preço ──────────────────────────────────────────────────────

function extractFromJsonLd($: cheerio.CheerioAPI): number | null {
  let price: number | null = null

  $('script[type="application/ld+json"]').each((_, el) => {
    if (price !== null) return
    try {
      const data = JSON.parse($(el).html() ?? '{}')
      const items = Array.isArray(data) ? data : [data]
      for (const item of items) {
        if (item['@type'] === 'Product') {
          const offer = item.offers ?? item.offer
          if (offer) {
            const raw = Array.isArray(offer) ? offer[0]?.price : offer.price
            if (raw) {
              const num = parseFloat(String(raw).replace(/[^\d.,]/g, '').replace(',', '.'))
              if (!isNaN(num) && num > 0) { price = num; return }
            }
          }
        }
      }
    } catch { /* ignora JSON inválido */ }
  })

  return price
}

function extractFromOpenGraph($: cheerio.CheerioAPI): number | null {
  const selectors = [
    'meta[property="product:price:amount"]',
    'meta[property="og:price:amount"]',
    'meta[name="price"]',
  ]
  for (const sel of selectors) {
    const content = $(sel).attr('content')
    if (content) {
      const num = parseFloat(content.replace(/[^\d.,]/g, '').replace(',', '.'))
      if (!isNaN(num) && num > 0) return num
    }
  }
  return null
}

function extractFromCssSelectors($: cheerio.CheerioAPI): number | null {
  const selectors = [
    // Shopify
    '.price__current', '.price-item--regular', '[data-product-price]',
    // WooCommerce
    '.woocommerce-Price-amount', '.price ins .amount', '.summary .price .amount',
    // VTEX
    '.vtex-product-price', '[class*="sellingPrice"]', '[class*="selling-price"]',
    // Genéricos
    '[itemprop="price"]', '[class*="price"][class*="current"]',
    '[class*="product-price"]', '[id*="product-price"]',
    '[class*="sale-price"]', '[class*="preco"]',
    // Mercado Livre / Americanas
    '.andes-money-amount__fraction', '.selling-price',
  ]

  for (const sel of selectors) {
    const el = $(sel).first()
    if (!el.length) continue
    const text = el.attr('content') ?? el.text() ?? ''
    const cleaned = text
      .replace(/R\$|USD|\$|€/g, '')
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3})/g, '')
      .replace(',', '.')
      .trim()
    const num = parseFloat(cleaned)
    if (!isNaN(num) && num > 0 && num < 1_000_000) return num
  }
  return null
}

// ─── Crawler principal ────────────────────────────────────────────────────────

export async function crawlCompetitorPrice(
  url: string,
  competitorName: string,
): Promise<CompetitorPriceResult> {
  const result: CompetitorPriceResult = {
    url,
    competitorName,
    price: null,
    currency: 'BRL',
    extractionMethod: 'not-found',
    checkedAt: new Date(),
  }

  const allowed = await isAllowedByRobots(url)
  if (!allowed) {
    result.error = 'Bloqueado por robots.txt'
    return result
  }

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': randomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
      signal: AbortSignal.timeout(20_000),
      redirect: 'follow',
    })

    if (!res.ok) {
      result.error = `HTTP ${res.status}`
      return result
    }

    const html = await res.text()
    const $ = cheerio.load(html)

    let price = extractFromJsonLd($)
    if (price) {
      result.extractionMethod = 'json-ld'
    } else {
      price = extractFromOpenGraph($)
      if (price) {
        result.extractionMethod = 'opengraph'
      } else {
        price = extractFromCssSelectors($)
        if (price) result.extractionMethod = 'css-selector'
      }
    }

    result.price = price
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Erro desconhecido'
  }

  return result
}

// ─── Comparação e alerta de preço ─────────────────────────────────────────────

export function comparePrices(
  myPrice: number,
  myProductName: string,
  competitors: CompetitorPriceResult[],
  currency = 'BRL'
): PriceComparisonResult {
  const validPrices = competitors
    .filter((c) => c.price !== null)
    .map((c) => c.price as number)

  const minCompetitorPrice = validPrices.length > 0 ? Math.min(...validPrices) : null
  const priceDiffPercent =
    minCompetitorPrice !== null
      ? ((myPrice - minCompetitorPrice) / minCompetitorPrice) * 100
      : null

  let alert: PriceComparisonResult['alert']
  let alertMessage: string

  if (minCompetitorPrice === null) {
    alert = 'COMPETITIVE'
    alertMessage = 'Nenhum preço de concorrente disponível para comparação.'
  } else if (priceDiffPercent! > 10) {
    alert = 'HIGH_PRICE_RISK'
    alertMessage = `Seu preço (R$${myPrice.toFixed(2)}) está ${priceDiffPercent!.toFixed(1)}% acima do concorrente mais barato (R$${minCompetitorPrice.toFixed(2)}). Risco alto de abandono no checkout.`
  } else if (priceDiffPercent! < -5) {
    alert = 'PRICE_LEADER'
    alertMessage = `Seu preço (R$${myPrice.toFixed(2)}) está ${Math.abs(priceDiffPercent!).toFixed(1)}% abaixo do concorrente mais barato. Você lidera o mercado em preço.`
  } else {
    alert = 'COMPETITIVE'
    alertMessage = `Seu preço está competitivo (diferença de ${priceDiffPercent!.toFixed(1)}% em relação ao concorrente mais barato).`
  }

  return {
    myProduct: { name: myProductName, price: myPrice, currency },
    competitors,
    alert,
    alertMessage,
    minCompetitorPrice,
    priceDiffPercent,
  }
}

// ─── Orquestrador ─────────────────────────────────────────────────────────────

export async function runPriceIntelligence(
  myPrice: number,
  myProductName: string,
  competitors: Array<{ name: string; url: string }>
): Promise<PriceComparisonResult> {
  const results = await Promise.all(
    competitors.map((c) => crawlCompetitorPrice(c.url, c.name))
  )

  return comparePrices(myPrice, myProductName, results)
}
