/**
 * Price Intelligence Crawler — extrai preços de concorrentes via Playwright.
 * Respeita robots.txt e usa User-Agents reais para evitar bloqueios.
 */

import type { Browser, Page } from 'playwright'

// ─── User Agents reais (desktop + mobile) ─────────────────────────────────────

const USER_AGENTS = [
  // Chrome Desktop
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  // Firefox Desktop
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0',
  // Safari Mac
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_4_1) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Safari/605.1.15',
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
    if (!res.ok) return true // Se não conseguir ler, assume permitido

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
    return true // Em caso de erro, assume permitido
  }
}

// ─── Extratores de preço ──────────────────────────────────────────────────────

/**
 * Tenta extrair preço via JSON-LD (schema.org/Product).
 * Método mais confiável para e-commerces modernos.
 */
async function extractFromJsonLd(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
    for (const script of scripts) {
      try {
        const data = JSON.parse(script.textContent ?? '{}')
        const items = Array.isArray(data) ? data : [data]
        for (const item of items) {
          // schema.org/Product
          if (item['@type'] === 'Product') {
            const offer = item.offers ?? item.offer
            if (offer) {
              const price = Array.isArray(offer)
                ? offer[0]?.price
                : offer.price
              if (price) return parseFloat(String(price).replace(/[^\d.,]/g, '').replace(',', '.'))
            }
          }
        }
      } catch { /* ignora JSON inválido */ }
    }
    return null
  })
}

/**
 * Tenta extrair preço via meta tags OpenGraph (og:price:amount).
 */
async function extractFromOpenGraph(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const selectors = [
      'meta[property="product:price:amount"]',
      'meta[property="og:price:amount"]',
      'meta[name="price"]',
    ]
    for (const sel of selectors) {
      const el = document.querySelector(sel)
      const content = el?.getAttribute('content')
      if (content) {
        const num = parseFloat(content.replace(/[^\d.,]/g, '').replace(',', '.'))
        if (!isNaN(num)) return num
      }
    }
    return null
  })
}

/**
 * Tenta extrair preço via seletores CSS comuns de e-commerces.
 * Cobre Shopify, WooCommerce, VTEX, Magento e lojas customizadas.
 */
async function extractFromCssSelectors(page: Page): Promise<number | null> {
  return page.evaluate(() => {
    const selectors = [
      // Shopify
      '.price__current', '.price-item--regular', '[data-product-price]',
      // WooCommerce
      '.woocommerce-Price-amount', '.price ins .amount', '.summary .price .amount',
      // VTEX
      '.vtex-product-price', '[class*="sellingPrice"]', '[class*="selling-price"]',
      // Genéricos de e-commerce
      '[itemprop="price"]', '[class*="price"][class*="current"]',
      '[class*="product-price"]', '[id*="product-price"]',
      '[class*="sale-price"]', '[class*="preco"]',
      // Mercado Livre / Americanas style
      '.andes-money-amount__fraction', '.selling-price',
    ]

    for (const sel of selectors) {
      const el = document.querySelector(sel)
      if (!el) continue
      const text = el.getAttribute('content') ?? el.textContent ?? ''
      // Remove R$, $, espaços, pontos de milhar e normaliza vírgula decimal
      const cleaned = text
        .replace(/R\$|USD|\$|€/g, '')
        .replace(/\s/g, '')
        .replace(/\.(?=\d{3})/g, '')  // Remove ponto de milhar
        .replace(',', '.')
        .trim()
      const num = parseFloat(cleaned)
      if (!isNaN(num) && num > 0 && num < 1_000_000) return num
    }
    return null
  })
}

// ─── Crawler principal ────────────────────────────────────────────────────────

/**
 * Extrai o preço de um produto em uma URL de concorrente.
 */
export async function crawlCompetitorPrice(
  url: string,
  competitorName: string,
  browser: Browser
): Promise<CompetitorPriceResult> {
  const result: CompetitorPriceResult = {
    url,
    competitorName,
    price: null,
    currency: 'BRL',
    extractionMethod: 'not-found',
    checkedAt: new Date(),
  }

  // Verifica robots.txt
  const allowed = await isAllowedByRobots(url)
  if (!allowed) {
    result.error = 'Bloqueado por robots.txt'
    return result
  }

  const context = await browser.newContext({
    userAgent: randomUserAgent(),
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    viewport: { width: 1366, height: 768 },
    extraHTTPHeaders: {
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    },
  })

  const page = await context.newPage()

  try {
    // Bloqueia recursos desnecessários para acelerar
    await page.route('**/*.{png,jpg,jpeg,gif,webp,svg,woff,woff2,ttf,mp4,mp3}', (route) =>
      route.abort()
    )

    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 20_000,
    })

    // Aguarda um pouco para SPAs renderizarem
    await page.waitForTimeout(1500)

    // Tenta cada método em ordem de confiabilidade
    let price = await extractFromJsonLd(page)
    if (price) {
      result.extractionMethod = 'json-ld'
    } else {
      price = await extractFromOpenGraph(page)
      if (price) {
        result.extractionMethod = 'opengraph'
      } else {
        price = await extractFromCssSelectors(page)
        if (price) result.extractionMethod = 'css-selector'
      }
    }

    result.price = price
  } catch (err) {
    result.error = err instanceof Error ? err.message : 'Erro desconhecido'
  } finally {
    await context.close()
  }

  return result
}

// ─── Comparação e alerta de preço ─────────────────────────────────────────────

/**
 * Compara o preço do cliente com os concorrentes e gera alerta.
 * Regra: Se preço_cliente > min(concorrentes) * 1.10 → HIGH_PRICE_RISK
 */
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

/**
 * Executa o crawler para todos os concorrentes de uma conta de anúncio.
 * Cria uma instância de browser compartilhada para eficiência.
 */
export async function runPriceIntelligence(
  myPrice: number,
  myProductName: string,
  competitors: Array<{ name: string; url: string }>
): Promise<PriceComparisonResult> {
  // Import dinâmico para não quebrar o build em ambientes sem Playwright
  const { chromium } = await import('playwright')

  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  try {
    // Executa crawlers em paralelo (max 3 simultâneos para não sobrecarregar)
    const results = await Promise.all(
      competitors.map((c) => crawlCompetitorPrice(c.url, c.name, browser))
    )

    return comparePrices(myPrice, myProductName, results)
  } finally {
    await browser.close()
  }
}
