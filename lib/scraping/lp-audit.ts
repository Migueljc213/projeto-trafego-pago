/**
 * Auditoria de Landing Page — analisa a LP do cliente buscando problemas
 * que causam perda de conversão após o clique no anúncio.
 *
 * Verifica: Meta Pixel/CAPI, tempo de resposta, CTAs, links inválidos.
 * Usa fetch + cheerio (sem Playwright) para compatibilidade com Vercel/serverless.
 */

import * as cheerio from 'cheerio'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface LpAuditResult {
  url: string
  auditedAt: Date
  loadTimeMs: number
  checks: LpCheck[]
  issues: LpIssue[]
  score: number               // 0–100 (100 = perfeito)
  rootCauseInsight: string    // Insight final correlacionando tráfego + LP
}

export interface LpCheck {
  name: string
  passed: boolean
  details: string
}

export interface LpIssue {
  type: 'PIXEL_FAILURE' | 'SLOW_PAGE' | 'BROKEN_CTA' | 'MOBILE_UX' | 'CHECKOUT_ERROR' | 'HIGH_SHIPPING' | 'BROKEN_LINKS'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  title: string
  description: string
  estimatedImpact: string
}

export interface TrafficContext {
  ctr: number
  bounceRateEstimate?: number
  mobileTrafficPercent?: number
}

// ─── Fetch com timeout e User-Agent mobile ────────────────────────────────────

const MOBILE_UA = 'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36'

async function fetchPage(url: string): Promise<{ html: string; loadTimeMs: number; status: number }> {
  const start = Date.now()
  const res = await fetch(url, {
    headers: {
      'User-Agent': MOBILE_UA,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    },
    signal: AbortSignal.timeout(20_000),
    redirect: 'follow',
  })
  const html = await res.text()
  const loadTimeMs = Date.now() - start
  return { html, loadTimeMs, status: res.status }
}

// ─── Auditoria de Pixel da Meta ───────────────────────────────────────────────

function auditMetaPixel($: cheerio.CheerioAPI): LpCheck {
  // Verifica scripts com domínio da Meta
  let hasPixelScript = false
  $('script[src]').each((_, el) => {
    const src = $(el).attr('src') ?? ''
    if (src.includes('connect.facebook.net') || src.includes('facebook.com/tr')) {
      hasPixelScript = true
    }
  })

  // Verifica inline scripts com fbq
  let hasFbqInline = false
  $('script:not([src])').each((_, el) => {
    const text = $(el).html() ?? ''
    if (text.includes('fbq(') || text.includes('fbevents.js')) {
      hasFbqInline = true
    }
  })

  // Verifica noscript pixel (img tag)
  let hasNoscriptPixel = false
  $('noscript').each((_, el) => {
    const html = $(el).html() ?? ''
    if (html.includes('facebook.com/tr')) {
      hasNoscriptPixel = true
    }
  })

  // Verifica verificação de domínio (CAPI)
  const hasCapiMeta = !!$('meta[name="facebook-domain-verification"]').length

  const pixelDetected = hasPixelScript || hasFbqInline || hasNoscriptPixel

  return {
    name: 'Meta Pixel / CAPI',
    passed: pixelDetected,
    details: pixelDetected
      ? `Pixel detectado${hasCapiMeta ? ' + verificação de domínio para CAPI' : ' (CAPI não confirmado via client-side)'}`
      : 'Nenhum Pixel da Meta detectado na página. Conversões não estão sendo rastreadas.',
  }
}

// ─── Verificação de CTAs ──────────────────────────────────────────────────────

function auditCtaButtons($: cheerio.CheerioAPI): { check: LpCheck; issues: LpIssue[] } {
  const ctaKeywords = ['comprar', 'buy', 'checkout', 'cart', 'compre', 'adquira', 'pedir', 'order', 'assinar', 'subscribe']
  const issues: LpIssue[] = []

  // Busca botões e links de CTA
  const ctaElements: string[] = []

  $('button[type="submit"], button').each((_, el) => {
    const text = $(el).text().trim().toLowerCase()
    if (text.length > 0 && text.length < 60) ctaElements.push(text)
  })

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    const text = $(el).text().trim().toLowerCase()
    if (ctaKeywords.some(k => href.includes(k) || text.includes(k))) {
      ctaElements.push(text || href)
    }
  })

  // Verifica CTAs com classes específicas
  $('[class*="cta"],[class*="buy"],[class*="checkout"],[class*="comprar"],[id*="cta"],[id*="buy"]').each((_, el) => {
    const text = $(el).text().trim()
    if (text.length > 0 && text.length < 60) ctaElements.push(text)
  })

  const uniqueCtas = Array.from(new Set(ctaElements)).slice(0, 10)

  if (uniqueCtas.length === 0) {
    issues.push({
      type: 'BROKEN_CTA',
      severity: 'HIGH',
      title: 'Nenhum botão CTA encontrado',
      description: 'Nenhum botão de compra/ação identificado na página. Isso pode indicar que a LP usa JavaScript para renderizar o CTA (verifique manualmente).',
      estimatedImpact: 'Potencial perda de 20–40% das conversões se o CTA não estiver visível',
    })
  }

  const passed = uniqueCtas.length > 0 && issues.length === 0

  return {
    check: {
      name: 'Botões CTA',
      passed,
      details: passed
        ? `${uniqueCtas.length} botão(ões) CTA identificado(s): "${uniqueCtas.slice(0, 3).join('", "')}"${uniqueCtas.length > 3 ? '...' : ''}`
        : issues.map(i => i.title).join('; '),
    },
    issues,
  }
}

// ─── Verificação de Links Quebrados ───────────────────────────────────────────

async function auditLinks($: cheerio.CheerioAPI): Promise<{ check: LpCheck; issues: LpIssue[] }> {
  const links: string[] = []

  $('a[href]').each((_, el) => {
    const href = $(el).attr('href') ?? ''
    if (href.startsWith('http')) links.push(href)
  })

  const uniqueLinks = Array.from(new Set(links)).slice(0, 15)
  const brokenLinks: string[] = []

  await Promise.all(
    uniqueLinks.map(async (href) => {
      try {
        const res = await fetch(href, {
          method: 'HEAD',
          signal: AbortSignal.timeout(5000),
          headers: { 'User-Agent': MOBILE_UA },
        })
        if (res.status >= 400) brokenLinks.push(href)
      } catch { /* ignora erros de rede */ }
    })
  )

  const issues: LpIssue[] = []
  if (brokenLinks.length > 0) {
    issues.push({
      type: 'BROKEN_LINKS',
      severity: 'MEDIUM',
      title: `${brokenLinks.length} link(s) quebrado(s)`,
      description: `Links com erro 4xx/5xx: ${brokenLinks.slice(0, 3).join(', ')}${brokenLinks.length > 3 ? '...' : ''}`,
      estimatedImpact: 'Prejudica a experiência do usuário e o SEO da página',
    })
  }

  return {
    check: {
      name: 'Links da Página',
      passed: brokenLinks.length === 0,
      details: brokenLinks.length === 0
        ? `${uniqueLinks.length} links verificados, todos funcionais`
        : `${brokenLinks.length} links quebrados encontrados`,
    },
    issues,
  }
}

// ─── Verificação de Performance ───────────────────────────────────────────────

function auditPerformance(loadTimeMs: number): { check: LpCheck; issues: LpIssue[] } {
  const lcpSeconds = loadTimeMs / 1000
  const issues: LpIssue[] = []

  if (lcpSeconds > 4) {
    issues.push({
      type: 'SLOW_PAGE',
      severity: 'CRITICAL',
      title: `Página muito lenta: ${lcpSeconds.toFixed(1)}s de carregamento`,
      description: `Google recomenda LCP abaixo de 2.5s. Páginas acima de 4s perdem até 80% dos visitantes mobile. Considere otimizar imagens, remover scripts bloqueantes e usar CDN.`,
      estimatedImpact: `Perda estimada de ${Math.min(80, Math.round((lcpSeconds - 2.5) * 20))}% dos visitantes`,
    })
  } else if (lcpSeconds > 2.5) {
    issues.push({
      type: 'SLOW_PAGE',
      severity: 'HIGH',
      title: `Tempo de carregamento acima do ideal: ${lcpSeconds.toFixed(1)}s`,
      description: `Tempo de resposta de ${lcpSeconds.toFixed(1)}s está acima da recomendação do Google (2.5s). Pode impactar a conversão em redes móveis.`,
      estimatedImpact: 'Perda estimada de 10–25% dos visitantes mobile',
    })
  }

  return {
    check: {
      name: 'Performance',
      passed: lcpSeconds <= 2.5,
      details: `Tempo de resposta: ${lcpSeconds.toFixed(2)}s ${lcpSeconds <= 2.5 ? '✓ (dentro do ideal)' : '⚠ (acima de 2.5s)'}`,
    },
    issues,
  }
}

// ─── Verificação de Meta Tags básicas ─────────────────────────────────────────

function auditMetaTags($: cheerio.CheerioAPI): LpCheck {
  const title = $('title').text().trim()
  const description = $('meta[name="description"]').attr('content') ?? ''
  const ogTitle = $('meta[property="og:title"]').attr('content') ?? ''

  const hasMeta = title.length > 0 && description.length > 0
  const hasOg = ogTitle.length > 0

  return {
    name: 'Meta Tags',
    passed: hasMeta,
    details: hasMeta
      ? `Title: "${title.slice(0, 40)}${title.length > 40 ? '...' : ''}"${hasOg ? ' + Open Graph presente' : ''}`
      : 'Title ou description ausentes — prejudica SEO e compartilhamentos',
  }
}

// ─── Gerador de Root Cause Insight ────────────────────────────────────────────

function generateRootCauseInsight(
  issues: LpIssue[],
  loadTimeMs: number,
  traffic: TrafficContext
): string {
  const parts: string[] = []
  const lcpSeconds = (loadTimeMs / 1000).toFixed(1)

  if (traffic.ctr > 2.0 && loadTimeMs > 4000) {
    parts.push(
      `Seu anúncio tem CTR alto (${traffic.ctr.toFixed(2)}%), o que significa que o criativo atrai cliques. ` +
      `Porém, a Landing Page demora ${lcpSeconds}s para responder — você está perdendo estimadamente ` +
      `${Math.min(80, Math.round((loadTimeMs / 1000 - 2.5) * 20))}% dos visitantes por lentidão técnica.`
    )
  }

  const criticalCta = issues.find((i) => i.type === 'BROKEN_CTA' && i.severity === 'CRITICAL')
  if (criticalCta) {
    const mobilePct = traffic.mobileTrafficPercent ?? 60
    parts.push(
      `Com ${mobilePct}% do tráfego vindo de dispositivos móveis, ter botões CTA ocultos ` +
      `significa que a maioria dos visitantes não consegue finalizar a compra — mesmo após clicar no anúncio.`
    )
  }

  const pixelIssue = issues.find((i) => i.type === 'PIXEL_FAILURE')
  if (pixelIssue) {
    parts.push(
      `Sem o Pixel da Meta funcionando, o algoritmo está otimizando seus anúncios sem dados reais de conversão. ` +
      `Isso aumenta o CPA e reduz a eficiência do ROAS ao longo do tempo.`
    )
  }

  if (parts.length === 0) {
    const issueCount = issues.filter((i) => i.severity !== 'LOW').length
    if (issueCount === 0) {
      return `A Landing Page está bem configurada. O tempo de resposta de ${lcpSeconds}s e os elementos de conversão estão dentro dos padrões recomendados.`
    }
    return `Foram detectados ${issueCount} problema(s) que podem estar impactando a conversão: ${issues.map((i) => i.title).join('; ')}.`
  }

  return parts.join(' ')
}

// ─── Auditor principal ────────────────────────────────────────────────────────

export async function auditLandingPage(
  url: string,
  traffic: TrafficContext = { ctr: 1.5 }
): Promise<LpAuditResult> {
  // Faz o fetch da página
  const { html, loadTimeMs, status } = await fetchPage(url)

  if (status >= 400) {
    throw new Error(`A página retornou status HTTP ${status}. Verifique se a URL está correta e acessível.`)
  }

  const $ = cheerio.load(html)

  const allIssues: LpIssue[] = []
  const allChecks: LpCheck[] = []

  // Executa verificações
  const pixelCheck = auditMetaPixel($)
  const ctaResult = auditCtaButtons($)
  const perfResult = auditPerformance(loadTimeMs)
  const metaCheck = auditMetaTags($)
  const linksResult = await auditLinks($)

  allChecks.push(pixelCheck, ctaResult.check, perfResult.check, metaCheck, linksResult.check)
  allIssues.push(...ctaResult.issues, ...perfResult.issues, ...linksResult.issues)

  if (!pixelCheck.passed) {
    allIssues.push({
      type: 'PIXEL_FAILURE',
      severity: 'CRITICAL',
      title: 'Meta Pixel não detectado',
      description: pixelCheck.details,
      estimatedImpact: 'ROAS subestimado + algoritmo otimizando sem dados reais de conversão',
    })
  }

  // Calcula score
  const criticalCount = allIssues.filter((i) => i.severity === 'CRITICAL').length
  const highCount = allIssues.filter((i) => i.severity === 'HIGH').length
  const mediumCount = allIssues.filter((i) => i.severity === 'MEDIUM').length
  const score = Math.max(0, 100 - criticalCount * 30 - highCount * 15 - mediumCount * 5)

  const rootCauseInsight = generateRootCauseInsight(allIssues, loadTimeMs, traffic)

  return {
    url,
    auditedAt: new Date(),
    loadTimeMs,
    checks: allChecks,
    issues: allIssues,
    score,
    rootCauseInsight,
  }
}
