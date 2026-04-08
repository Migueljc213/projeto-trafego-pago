/**
 * Ad Creation Helper — FunnelGuard AI
 *
 * 1. Usa Playwright para raspar a URL do produto (título, descrição, preço, benefícios).
 * 2. Envia os dados para o GPT-4o e retorna 3 variações de Headlines + 3 de Primary Texts
 *    otimizadas para conversão no Meta Ads.
 *
 * Roda apenas no servidor — nunca exposto ao cliente.
 */

import { chromium } from 'playwright'
import OpenAI from 'openai'
import { z } from 'zod'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface ProductData {
  title: string
  description: string
  price: string | null
  benefits: string[]
  imageUrl: string | null
  url: string
}

export interface AdCopyVariation {
  headline: string      // Máximo 40 caracteres (Meta Ads limit)
  primaryText: string   // Máximo 125 caracteres (recomendado)
}

export interface AdCreationResult {
  product: ProductData
  headlines: AdCopyVariation[]      // 3 variações de headlines
  primaryTexts: AdCopyVariation[]   // 3 variações de primary texts
  generatedAt: Date
}

// ─── Zod Schema da resposta do GPT-4o ────────────────────────────────────────

const AdCopyResponseSchema = z.object({
  headlines: z.array(z.object({
    headline: z.string().max(60),
    primaryText: z.string(),
  })).length(3),
  primaryTexts: z.array(z.object({
    headline: z.string().max(60),
    primaryText: z.string(),
  })).length(3),
})

// ─── Playwright: Raspagem do Produto ─────────────────────────────────────────

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
]

/**
 * Raspa a URL do produto e extrai dados estruturados para geração de copy.
 * Tenta JSON-LD (schema.org) primeiro, depois meta tags e seletores HTML.
 */
export async function scrapeProductData(url: string): Promise<ProductData> {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu'],
  })

  const context = await browser.newContext({
    userAgent: USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)],
    viewport: { width: 1280, height: 800 },
    locale: 'pt-BR',
  })

  const page = await context.newPage()

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await page.waitForTimeout(1500) // Aguarda renderização de JS

    const data = await page.evaluate(() => {
      // ── Tenta JSON-LD primeiro (mais confiável) ──────────────────────────
      const jsonLdScripts = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
      for (const script of jsonLdScripts) {
        try {
          const json = JSON.parse(script.textContent ?? '')
          const product = json['@type'] === 'Product' ? json
            : json['@graph']?.find((g: Record<string, unknown>) => g['@type'] === 'Product')
          if (product) {
            return {
              title: product.name ?? '',
              description: product.description ?? '',
              price: product.offers?.price
                ? `${product.offers.priceCurrency ?? 'R$'} ${product.offers.price}`
                : null,
              benefits: [],
              imageUrl: product.image?.[0] ?? product.image ?? null,
            }
          }
        } catch { /* continua */ }
      }

      // ── Fallback: meta tags + HTML ───────────────────────────────────────
      const getMeta = (name: string) =>
        document.querySelector(`meta[property="${name}"], meta[name="${name}"]`)
          ?.getAttribute('content') ?? null

      const title =
        getMeta('og:title') ??
        document.querySelector('h1')?.textContent?.trim() ??
        document.title

      const description =
        getMeta('og:description') ??
        getMeta('description') ??
        document.querySelector('meta[name="description"]')?.getAttribute('content') ??
        Array.from(document.querySelectorAll('p'))
          .map(p => p.textContent?.trim())
          .filter(Boolean)
          .slice(0, 3)
          .join(' ')

      const priceEl = document.querySelector(
        '[itemprop="price"], .price, .product-price, .precio, .preco, [data-price], .woocommerce-Price-amount'
      )
      const price = getMeta('product:price:amount')
        ?? getMeta('og:price:amount')
        ?? priceEl?.textContent?.trim()
        ?? null

      // Tenta extrair benefícios de bullets/listas próximas ao CTA
      const listItems = Array.from(document.querySelectorAll('ul li, .benefits li, .features li, .vantagens li'))
        .slice(0, 6)
        .map(li => li.textContent?.trim())
        .filter((t): t is string => Boolean(t) && t.length > 10 && t.length < 150)

      const imageUrl = getMeta('og:image') ?? null

      return { title: title ?? '', description: description ?? '', price, benefits: listItems, imageUrl }
    })

    return { ...data, url }
  } finally {
    await browser.close()
  }
}

// ─── GPT-4o: Geração de Copy ──────────────────────────────────────────────────

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não definida')
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

function buildCopyPrompt(product: ProductData): string {
  const benefitsText = product.benefits.length > 0
    ? `\nBenefícios listados no site:\n${product.benefits.map(b => `- ${b}`).join('\n')}`
    : ''

  const priceText = product.price ? `\nPreço: ${product.price}` : ''

  return `Você é um especialista em copywriting para Meta Ads (Facebook e Instagram) com foco em alta conversão para e-commerce.

Com base nos dados abaixo, crie variações de copy para anúncios de performance:

PRODUTO:
- Nome: ${product.title}
- Descrição: ${product.description}${priceText}${benefitsText}
- URL: ${product.url}

REGRAS OBRIGATÓRIAS:
- Headlines: máximo 40 caracteres, impactantes, com gatilho de conversão
- Primary Texts: máximo 125 caracteres na primeira frase, pode continuar depois
- Use linguagem brasileira natural (não português europeu)
- Varie as abordagens: Urgência, Benefício direto, Prova social/autoridade
- Não mencione "clique aqui" ou termos genéricos
- Adapte para audiência quente (conhece o produto) e fria (descoberta)

RESPONDA em JSON estrito, sem markdown:
{
  "headlines": [
    {"headline": "...", "primaryText": "..."},
    {"headline": "...", "primaryText": "..."},
    {"headline": "...", "primaryText": "..."}
  ],
  "primaryTexts": [
    {"headline": "...", "primaryText": "..."},
    {"headline": "...", "primaryText": "..."},
    {"headline": "...", "primaryText": "..."}
  ]
}

Onde:
- "headlines": 3 variações onde o HEADLINE é o diferencial (copy focado no título)
- "primaryTexts": 3 variações onde o PRIMARY TEXT é o diferencial (copy focado no corpo)`
}

/**
 * Gera 3 variações de Headlines e 3 de Primary Texts para um produto.
 */
export async function generateAdCopy(product: ProductData): Promise<{
  headlines: AdCopyVariation[]
  primaryTexts: AdCopyVariation[]
}> {
  const res = await getOpenAI().chat.completions.create({
    model: 'gpt-4o',
    max_tokens: 1000,
    temperature: 0.8, // Criatividade alta para variações distintas
    messages: [
      {
        role: 'system',
        content: 'Você responde APENAS em JSON válido, sem markdown, sem explicações.',
      },
      { role: 'user', content: buildCopyPrompt(product) },
    ],
    response_format: { type: 'json_object' },
  })

  const raw = res.choices[0]?.message?.content ?? '{}'

  try {
    const parsed = AdCopyResponseSchema.parse(JSON.parse(raw))
    return { headlines: parsed.headlines, primaryTexts: parsed.primaryTexts }
  } catch (err) {
    console.error('[ad-creation-helper] Falha ao parsear resposta GPT-4o:', err, raw)
    // Fallback com 3 cópias genéricas baseadas no título
    const fallback: AdCopyVariation[] = [
      {
        headline: product.title.slice(0, 40),
        primaryText: product.description.slice(0, 125),
      },
      {
        headline: `Conheça: ${product.title.slice(0, 30)}`,
        primaryText: `${product.title} — a solução que você procurava. Acesse agora.`,
      },
      {
        headline: `Oferta: ${product.title.slice(0, 30)}`,
        primaryText: `Aproveite ${product.title}. Entrega rápida e garantia incluída.`,
      },
    ]
    return { headlines: fallback, primaryTexts: fallback }
  }
}

// ─── Função Principal ─────────────────────────────────────────────────────────

/**
 * Dada a URL de um produto, raspa os dados e gera variações de copy para Meta Ads.
 * Fluxo completo: Playwright scrape → GPT-4o generation → resultado estruturado.
 */
export async function createAdCopyFromUrl(productUrl: string): Promise<AdCreationResult> {
  const normalizedUrl = productUrl.startsWith('http') ? productUrl : `https://${productUrl}`

  // Etapa 1: Raspar dados do produto
  const product = await scrapeProductData(normalizedUrl)

  if (!product.title || product.title.length < 3) {
    throw new Error('Não foi possível extrair informações do produto nesta URL. Verifique se a página está acessível.')
  }

  // Etapa 2: Gerar copy com GPT-4o
  const { headlines, primaryTexts } = await generateAdCopy(product)

  return {
    product,
    headlines,
    primaryTexts,
    generatedAt: new Date(),
  }
}
