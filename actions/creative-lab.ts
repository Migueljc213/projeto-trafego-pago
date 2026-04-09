'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CreativeVariation {
  framework: 'AIDA' | 'PAS'
  headline: string
  primaryText: string
}

export interface CreativeBriefResult {
  productName: string
  productDescription: string
  targetAudience: string
  variations: CreativeVariation[]
}

export interface CreativeBriefActionResult {
  success: boolean
  data?: CreativeBriefResult
  error?: string
}

// ─── Scraper simples via fetch ────────────────────────────────────────────────

async function scrapeProductPage(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(15_000),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const html = await response.text()

    // Extrai texto útil sem depender do Playwright (evita timeout na Vercel)
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    const descMatch =
      html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i) ??
      html.match(/<meta[^>]*content=["']([^"']+)["'][^>]*name=["']description["']/i)
    const ogTitleMatch = html.match(/<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']+)["']/i)
    const ogDescMatch = html.match(/<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']+)["']/i)
    const priceMatch = html.match(/(?:R\$|BRL)\s*[\d.,]+/g)

    // Remove tags HTML e extrai texto corrido (primeiros 3000 chars)
    const plainText = html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 3000)

    const context = [
      `URL: ${url}`,
      titleMatch ? `Título: ${titleMatch[1]}` : '',
      ogTitleMatch ? `OG Título: ${ogTitleMatch[1]}` : '',
      descMatch ? `Descrição: ${descMatch[1]}` : '',
      ogDescMatch ? `OG Descrição: ${ogDescMatch[1]}` : '',
      priceMatch ? `Preços encontrados: ${priceMatch.slice(0, 5).join(', ')}` : '',
      `Conteúdo da página:\n${plainText}`,
    ]
      .filter(Boolean)
      .join('\n')

    return context
  } catch (error) {
    throw new Error(`Não foi possível acessar a página: ${String(error)}`)
  }
}

// ─── Action Principal ─────────────────────────────────────────────────────────

export async function generateCreativeBriefAction(
  productUrl: string
): Promise<CreativeBriefActionResult> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return { success: false, error: 'Não autenticado' }
  }

  if (!productUrl || !productUrl.startsWith('http')) {
    return { success: false, error: 'URL inválida. Use https://...' }
  }

  let pageContext: string
  try {
    pageContext = await scrapeProductPage(productUrl)
  } catch (err) {
    return { success: false, error: String(err) }
  }

  const systemPrompt = `Você é um especialista em copywriting de performance para anúncios de Facebook/Instagram.
Você analisa páginas de produto e cria variações de copy altamente persuasivas usando os frameworks:

**AIDA:** Attention (chamar atenção) → Interest (criar interesse) → Desire (despertar desejo) → Action (CTA claro)
**PAS:** Problem (identificar dor) → Agitation (amplificar a dor) → Solution (apresentar o produto como solução)

Regras de ouro:
- Headlines: máximo 10 palavras, direto ao ponto, provocativo ou baseado em benefício/dor
- Primary Text: máximo 150 palavras, linguagem coloquial brasileira, uma CTA clara no final
- Nunca mencione o nome da empresa diretamente nos criativos (fica impessoal)
- Use gatilhos mentais: urgência, prova social, exclusividade, medo de perder (FOMO)
- Escreva como se fosse um amigo recomendando um produto

Retorne SEMPRE um JSON válido, sem markdown, com este formato exato:
{
  "productName": "...",
  "productDescription": "...",
  "targetAudience": "...",
  "variations": [
    { "framework": "AIDA", "headline": "...", "primaryText": "..." },
    { "framework": "AIDA", "headline": "...", "primaryText": "..." },
    { "framework": "AIDA", "headline": "...", "primaryText": "..." },
    { "framework": "PAS", "headline": "...", "primaryText": "..." },
    { "framework": "PAS", "headline": "...", "primaryText": "..." }
  ]
}`

  const userPrompt = `Analise esta página de produto e crie 5 variações de copy para anúncios (3 AIDA + 2 PAS):

${pageContext}`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.8,
      max_tokens: 2000,
      response_format: { type: 'json_object' },
    })

    const raw = completion.choices[0]?.message?.content
    if (!raw) {
      return { success: false, error: 'IA não retornou conteúdo' }
    }

    const parsed = JSON.parse(raw) as CreativeBriefResult

    if (!parsed.variations || parsed.variations.length === 0) {
      return { success: false, error: 'IA não gerou variações' }
    }

    return { success: true, data: parsed }
  } catch (err) {
    console.error('[creative-lab] Erro na IA:', err)
    return { success: false, error: 'Erro ao gerar criativos. Tente novamente.' }
  }
}
