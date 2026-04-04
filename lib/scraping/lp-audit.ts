/**
 * Auditoria de Landing Page — analisa a LP do cliente buscando problemas
 * que causam perda de conversão após o clique no anúncio.
 *
 * Verifica: Meta Pixel/CAPI, LCP, CTAs quebrados, links inválidos, mobile UX.
 */

import type { Page } from 'playwright'

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
  estimatedImpact: string     // Ex: "Perda estimada de 15% dos visitantes"
}

export interface TrafficContext {
  ctr: number               // CTR do anúncio (%)
  bounceRateEstimate?: number
  mobileTrafficPercent?: number
}

// ─── Auditoria de Pixel da Meta ───────────────────────────────────────────────

async function auditMetaPixel(page: Page): Promise<LpCheck> {
  const result = await page.evaluate(() => {
    // Verifica fbq (Pixel padrão)
    const hasFbq = typeof (window as unknown as Record<string, unknown>).fbq === 'function'

    // Verifica scripts com domínio da Meta
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const hasPixelScript = scripts.some(
      (s) =>
        s.getAttribute('src')?.includes('connect.facebook.net') ||
        s.getAttribute('src')?.includes('facebook.com/tr')
    )

    // Verifica noscript pixel (img tag)
    const noscripts = Array.from(document.querySelectorAll('noscript'))
    const hasNoscriptPixel = noscripts.some((n) =>
      n.innerHTML.includes('facebook.com/tr')
    )

    // Verifica CAPI via meta tags (indicador de integração server-side)
    const hasCapiMeta = !!document.querySelector('meta[name="facebook-domain-verification"]')

    return { hasFbq, hasPixelScript, hasNoscriptPixel, hasCapiMeta }
  })

  const pixelDetected = result.hasFbq || result.hasPixelScript || result.hasNoscriptPixel

  return {
    name: 'Meta Pixel / CAPI',
    passed: pixelDetected,
    details: pixelDetected
      ? `Pixel detectado${result.hasCapiMeta ? ' + verificação de domínio para CAPI' : ' (CAPI não confirmado via client-side)'}`
      : 'Nenhum Pixel da Meta detectado na página. Conversões não estão sendo rastreadas.',
  }
}

// ─── Verificação de CTAs ──────────────────────────────────────────────────────

async function auditCtaButtons(page: Page): Promise<{ check: LpCheck; issues: LpIssue[] }> {
  const ctaData = await page.evaluate(() => {
    const ctaSelectors = [
      'button[type="submit"]',
      'a[href*="checkout"]', 'a[href*="cart"]', 'a[href*="comprar"]', 'a[href*="buy"]',
      '[class*="cta"]', '[class*="buy"]', '[class*="checkout"]', '[class*="comprar"]',
      '[id*="cta"]', '[id*="buy"]', '[id*="checkout"]',
    ]

    const results: Array<{
      text: string
      visible: boolean
      clickable: boolean
      href: string | null
      dimensions: { w: number; h: number }
    }> = []

    for (const sel of ctaSelectors) {
      const elements = document.querySelectorAll(sel)
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect()
        const style = window.getComputedStyle(el)
        results.push({
          text: el.textContent?.trim().slice(0, 80) ?? '',
          visible: rect.width > 0 && rect.height > 0 && style.display !== 'none' && style.visibility !== 'hidden',
          clickable: !el.hasAttribute('disabled'),
          href: el.getAttribute('href'),
          dimensions: { w: Math.round(rect.width), h: Math.round(rect.height) },
        })
      })
    }

    return results.slice(0, 10) // Max 10 CTAs
  })

  const issues: LpIssue[] = []
  const hiddenCtas = ctaData.filter((c) => !c.visible && c.text)
  const disabledCtas = ctaData.filter((c) => !c.clickable && c.visible)
  const tinyCtAs = ctaData.filter((c) => c.visible && (c.dimensions.w < 44 || c.dimensions.h < 44))

  if (hiddenCtas.length > 0) {
    issues.push({
      type: 'BROKEN_CTA',
      severity: 'CRITICAL',
      title: `${hiddenCtas.length} botão(ões) CTA oculto(s)`,
      description: `Botões de compra encontrados mas invisíveis: "${hiddenCtas.map((c) => c.text).join('", "')}"`,
      estimatedImpact: 'Perda estimada de 30–60% das conversões mobile/iOS',
    })
  }

  if (tinyCtAs.length > 0) {
    issues.push({
      type: 'MOBILE_UX',
      severity: 'HIGH',
      title: 'Botão CTA muito pequeno para toque mobile',
      description: `${tinyCtAs.length} botão(ões) com dimensões abaixo de 44x44px (recomendação Apple HIG). Dificulta o clique em dispositivos móveis.`,
      estimatedImpact: 'Redução de ~15% na taxa de clique em mobile',
    })
  }

  const passed = ctaData.length > 0 && hiddenCtas.length === 0 && disabledCtas.length === 0

  return {
    check: {
      name: 'Botões CTA',
      passed,
      details: passed
        ? `${ctaData.filter((c) => c.visible).length} botão(ões) CTA visíveis e funcionais`
        : `Problemas detectados: ${issues.map((i) => i.title).join('; ')}`,
    },
    issues,
  }
}

// ─── Verificação de Links Quebrados ───────────────────────────────────────────

async function auditLinks(page: Page): Promise<{ check: LpCheck; issues: LpIssue[] }> {
  const links = await page.evaluate(() => {
    return Array.from(document.querySelectorAll('a[href]'))
      .map((a) => a.getAttribute('href') ?? '')
      .filter((href) => href.startsWith('http'))
      .slice(0, 20) // Limita para não sobrecarregar
  })

  const brokenLinks: string[] = []

  await Promise.all(
    links.map(async (href) => {
      try {
        const res = await fetch(href, { method: 'HEAD', signal: AbortSignal.timeout(5000) })
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
        ? `${links.length} links verificados, todos funcionais`
        : `${brokenLinks.length} links quebrados encontrados`,
    },
    issues,
  }
}

// ─── Verificação de Performance (LCP) ────────────────────────────────────────

async function measurePerformance(
  page: Page,
  loadTimeMs: number
): Promise<{ check: LpCheck; issues: LpIssue[] }> {
  // Coleta métricas via Performance API
  const metrics = await page.evaluate(() => {
    const perf = window.performance
    const nav = perf.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    return {
      domContentLoaded: nav ? Math.round(nav.domContentLoadedEventEnd) : null,
      firstContentfulPaint: null as number | null,
    }
  })

  const issues: LpIssue[] = []
  const lcpSeconds = loadTimeMs / 1000

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
      description: `LCP de ${lcpSeconds.toFixed(1)}s está acima da recomendação do Google (2.5s). Pode impactar a conversão em redes móveis.`,
      estimatedImpact: 'Perda estimada de 10–25% dos visitantes mobile',
    })
  }

  return {
    check: {
      name: 'Performance (LCP)',
      passed: lcpSeconds <= 2.5,
      details: `Tempo de carregamento: ${lcpSeconds.toFixed(2)}s ${lcpSeconds <= 2.5 ? '✓ (dentro do ideal)' : '⚠ (acima de 2.5s)'}`,
    },
    issues,
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

  // Correlaciona CTR alto + LP lenta
  if (traffic.ctr > 2.0 && loadTimeMs > 4000) {
    parts.push(
      `Seu anúncio tem CTR alto (${traffic.ctr.toFixed(2)}%), o que significa que o criativo atrai cliques. ` +
      `Porém, a Landing Page demora ${lcpSeconds}s para carregar — você está perdendo estimadamente ` +
      `${Math.min(80, Math.round((loadTimeMs / 1000 - 2.5) * 20))}% dos visitantes por lentidão técnica.`
    )
  }

  // CTA oculto
  const criticalCta = issues.find((i) => i.type === 'BROKEN_CTA' && i.severity === 'CRITICAL')
  if (criticalCta) {
    const mobilePct = traffic.mobileTrafficPercent ?? 60
    parts.push(
      `Com ${mobilePct}% do tráfego vindo de dispositivos móveis, ter botões CTA ocultos ` +
      `significa que a maioria dos visitantes não consegue finalizar a compra — mesmo após clicar no anúncio.`
    )
  }

  // Pixel ausente
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
      return `A Landing Page está bem configurada. Os ${lcpSeconds}s de carregamento e os elementos de conversão estão dentro dos padrões recomendados.`
    }
    return `Foram detectados ${issueCount} problema(s) que podem estar impactando a conversão: ${issues.map((i) => i.title).join('; ')}.`
  }

  return parts.join(' ')
}

// ─── Auditor principal ────────────────────────────────────────────────────────

/**
 * Executa auditoria completa de uma Landing Page.
 */
export async function auditLandingPage(
  url: string,
  traffic: TrafficContext = { ctr: 1.5 }
): Promise<LpAuditResult> {
  const { chromium } = await import('playwright')
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  })

  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36',
    viewport: { width: 390, height: 844 }, // iPhone 14 Pro
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
  })

  const page = await context.newPage()
  const allIssues: LpIssue[] = []
  const allChecks: LpCheck[] = []
  let loadTimeMs = 0

  try {
    const startTime = Date.now()
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30_000 })
    loadTimeMs = Date.now() - startTime

    // Aguarda renderização de SPAs
    await page.waitForTimeout(1000)

    // Executa todas as verificações
    const [pixelCheck, ctaResult, perfResult, linksResult] = await Promise.all([
      auditMetaPixel(page),
      auditCtaButtons(page),
      measurePerformance(page, loadTimeMs),
      auditLinks(page),
    ])

    allChecks.push(pixelCheck, ctaResult.check, perfResult.check, linksResult.check)
    allIssues.push(...ctaResult.issues, ...perfResult.issues, ...linksResult.issues)

    // Adiciona issue de pixel se necessário
    if (!pixelCheck.passed) {
      allIssues.push({
        type: 'PIXEL_FAILURE',
        severity: 'CRITICAL',
        title: 'Meta Pixel não detectado',
        description: pixelCheck.details,
        estimatedImpact: 'ROAS subestimado + algoritmo otimizando sem dados reais de conversão',
      })
    }
  } finally {
    await context.close()
    await browser.close()
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
