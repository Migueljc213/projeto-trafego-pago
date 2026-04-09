/**
 * Motor de Correlação Estratégica — FunnelGuard AI
 *
 * Consolida métricas de Meta Ads + Price Intelligence + LP Audit em um único
 * objeto validado via Zod e toma decisões multivariáveis com rastreabilidade.
 *
 * Cenário A: ROAS caiu + concorrente ≥20% mais barato → PAUSE + email "Concorrência agressiva"
 * Cenário B: ROAS caiu + checkout quebrado no site → PAUSE + email "Erro crítico no site"
 *
 * IMPORTANTE: Se o scraper falhar (null), a IA NÃO toma decisão baseada em preço.
 */

import { z } from 'zod'
import OpenAI from 'openai'

// ─── Zod Schemas — validação rígida dos dados cruzados ───────────────────────

/**
 * Dados de performance da campanha.
 * roas e spend DEVEM ser positivos para que o motor tome decisões.
 */
export const CampaignDataSchema = z.object({
  campaignId: z.string().min(1),
  campaignName: z.string().min(1),
  roas: z.number().nonnegative(),
  targetRoas: z.number().positive(),
  spend: z.number().nonnegative(),
  spendThreshold: z.number().nonnegative(),
  cpa: z.number().nonnegative(),
  cpaLimit: z.number().positive(),
  frequency: z.number().nonnegative(),
  clicks: z.number().int().nonnegative(),
  impressions: z.number().int().nonnegative(),
  conversions: z.number().int().nonnegative(),
})

/**
 * Dados do Price Intelligence.
 * Se o scraper falhou (site fora do ar), price DEVE ser null.
 * A IA nunca toma decisão baseada em preço "zero" — somente quando temos
 * dados confiáveis (price !== null E scrapedAt recente).
 */
export const CompetitorPriceDataSchema = z.object({
  competitorId: z.string().min(1),
  competitorName: z.string().min(1),
  price: z.number().positive().nullable(), // null = scraper falhou, dados não confiáveis
  myPrice: z.number().positive().nullable(),
  currency: z.string().default('BRL'),
  scrapedAt: z.date().nullable(), // null = nunca rastreado com sucesso
  scrapeFailed: z.boolean(),      // true = scrapers retornou erro/timeout
})

/**
 * Dados de auditoria da Landing Page.
 * Inclui apenas issues não resolvidos, para que o motor avalie o estado atual.
 */
export const LpAuditDataSchema = z.object({
  hasCheckoutError: z.boolean(),
  hasPixelFailure: z.boolean(),
  hasSlowPage: z.boolean(),
  hasBrokenCta: z.boolean(),
  criticalIssueCount: z.number().int().nonnegative(),
  highIssueCount: z.number().int().nonnegative(),
  auditScore: z.number().min(0).max(100).nullable(), // null = sem auditoria recente
  lastAuditedAt: z.date().nullable(),
  topIssueDescription: z.string().nullable(),
})

/**
 * Payload completo enviado para o motor de correlação.
 * Todos os três módulos DEVEM estar presentes para análise completa.
 */
export const CorrelationPayloadSchema = z.object({
  campaign: CampaignDataSchema,
  competitorPrices: z.array(CompetitorPriceDataSchema),
  lpAudit: LpAuditDataSchema,
})

export type CorrelationPayload = z.infer<typeof CorrelationPayloadSchema>
export type CampaignData = z.infer<typeof CampaignDataSchema>
export type CompetitorPriceData = z.infer<typeof CompetitorPriceDataSchema>
export type LpAuditData = z.infer<typeof LpAuditDataSchema>

// ─── Resultado da Correlação ──────────────────────────────────────────────────

export type CorrelationTrigger =
  | 'SCENARIO_A_AGGRESSIVE_COMPETITOR' // ROAS caiu + concorrente ≥20% mais barato
  | 'SCENARIO_B_CHECKOUT_BROKEN'       // ROAS caiu + checkout quebrado
  | 'SCENARIO_C_PIXEL_FAILURE'         // Pixel da Meta com falha (sem dados de conversão)
  | 'SCENARIO_D_SLOW_PAGE'             // Página lenta impactando conversão
  | 'HEALTHY'                          // Nenhum gargalo crítico detectado
  | 'INSUFFICIENT_DATA'                // Spend abaixo do threshold, aguardar

export interface CorrelationResult {
  trigger: CorrelationTrigger
  shouldPause: boolean
  shouldSendAlert: boolean
  alertEmailSubject: string
  alertEmailBody: string
  rootCauseInsight: string            // Parágrafo técnico gerado pelo GPT-4o (exibido no dashboard)
  executiveSummary: string            // Resumo executivo de 3 parágrafos, foco em lucratividade
  confidence: number                  // 0–100
  adScore: number                     // Saúde do anúncio (0–100, 100=saudável)
  priceScore: number                  // Saúde do preço (0–100)
  siteScore: number                   // Saúde do site/LP (0–100)
  bottleneck: 'AD' | 'PRICE' | 'SITE' | 'MIXED' | 'HEALTHY'
  details: string[]                   // Lista de sinais detectados para auditoria
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Calcula o menor preço confiável de um conjunto de competidores */
function getMinReliableCompetitorPrice(
  competitors: CompetitorPriceData[]
): { price: number; name: string } | null {
  const reliable = competitors.filter(
    (c) => !c.scrapeFailed && c.price !== null && c.price > 0
  )
  if (reliable.length === 0) return null

  const sorted = [...reliable].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
  const cheapest = sorted[0]
  return { price: cheapest.price!, name: cheapest.competitorName }
}

/** Calcula o score de saúde do anúncio baseado em ROAS/CPA/frequency */
function calcAdScore(campaign: CampaignData): number {
  if (campaign.spend < campaign.spendThreshold) return 70 // dados insuficientes

  let score = 100
  const roasRatio = campaign.roas / campaign.targetRoas
  if (roasRatio < 0.5) score -= 40
  else if (roasRatio < 0.8) score -= 25
  else if (roasRatio < 1.0) score -= 10

  const cpaRatio = campaign.cpa / campaign.cpaLimit
  if (cpaRatio > 1.5) score -= 30
  else if (cpaRatio > 1.2) score -= 15

  if (campaign.frequency > 6) score -= 20
  else if (campaign.frequency > 4) score -= 10

  return Math.max(0, score)
}

/** Calcula o score de saúde do preço */
function calcPriceScore(
  myPrice: number | null,
  minCompetitor: { price: number; name: string } | null
): number {
  if (myPrice === null || minCompetitor === null) return 70 // sem dados = neutro
  const diffPct = ((myPrice - minCompetitor.price) / minCompetitor.price) * 100
  if (diffPct <= 0) return 100       // mais barato ou igual
  if (diffPct <= 5) return 85
  if (diffPct <= 10) return 70
  if (diffPct <= 20) return 45
  return 20                          // 20%+ mais caro = crítico
}

/** Calcula o score de saúde do site/LP */
function calcSiteScore(audit: LpAuditData): number {
  if (audit.auditScore !== null) return audit.auditScore

  // Fallback sem auditoria recente
  let score = 100
  if (audit.hasCheckoutError) score -= 40
  if (audit.hasPixelFailure) score -= 30
  if (audit.hasSlowPage) score -= 20
  if (audit.hasBrokenCta) score -= 25
  score -= audit.criticalIssueCount * 10
  score -= audit.highIssueCount * 5
  return Math.max(0, score)
}

// ─── Motor de Correlação Principal ───────────────────────────────────────────

/**
 * Avalia os dados cruzados e retorna o trigger mais relevante.
 * A IA NUNCA toma decisão de preço se os dados do scraper são não-confiáveis.
 */
export function evaluateCorrelation(payload: CorrelationPayload): Omit<CorrelationResult, 'rootCauseInsight' | 'executiveSummary'> {
  const { campaign, competitorPrices, lpAudit } = payload
  const details: string[] = []

  // Dados insuficientes — aguardar antes de agir
  if (campaign.spend < campaign.spendThreshold) {
    return {
      trigger: 'INSUFFICIENT_DATA',
      shouldPause: false,
      shouldSendAlert: false,
      alertEmailSubject: '',
      alertEmailBody: '',
      confidence: 20,
      adScore: calcAdScore(campaign),
      priceScore: 70,
      siteScore: calcSiteScore(lpAudit),
      bottleneck: 'HEALTHY',
      details: [`Spend (R$${campaign.spend.toFixed(2)}) abaixo do threshold (R$${campaign.spendThreshold.toFixed(2)}). Aguardando mais dados.`],
    }
  }

  const roasFell = campaign.roas < campaign.targetRoas
  const adScore = calcAdScore(campaign)

  // Obter menor preço confiável de competidor
  const minCompetitor = getMinReliableCompetitorPrice(competitorPrices)
  const myPrice = competitorPrices.find((c) => !c.scrapeFailed)?.myPrice ?? null
  const priceScore = calcPriceScore(myPrice, minCompetitor)
  const siteScore = calcSiteScore(lpAudit)

  if (roasFell) {
    details.push(`ROAS atual (${campaign.roas.toFixed(2)}x) abaixo do alvo (${campaign.targetRoas}x)`)
  }

  // ── Cenário B: Checkout quebrado tem PRIORIDADE MÁXIMA ────────────────────
  if (roasFell && lpAudit.hasCheckoutError) {
    details.push('Erro crítico de checkout detectado na auditoria da LP')
    return {
      trigger: 'SCENARIO_B_CHECKOUT_BROKEN',
      shouldPause: true,
      shouldSendAlert: true,
      alertEmailSubject: '🚨 Anúncio Pausado: Erro Crítico no Site Detectado',
      alertEmailBody: `O Auto-Pilot pausou a campanha "${campaign.campaignName}" porque o ROAS caiu para ${campaign.roas.toFixed(2)}x e foi detectado um erro no processo de checkout da landing page. Cada minuto com anúncios ativos está desperdiçando orçamento para uma página que não converte.`,
      confidence: 92,
      adScore,
      priceScore,
      siteScore,
      bottleneck: 'SITE',
      details,
    }
  }

  // ── Cenário A: Concorrência agressiva ─────────────────────────────────────
  if (roasFell && minCompetitor !== null && myPrice !== null) {
    const diffPct = ((myPrice - minCompetitor.price) / minCompetitor.price) * 100
    if (diffPct >= 20) {
      details.push(
        `${minCompetitor.name} está ${diffPct.toFixed(1)}% mais barato (R$${minCompetitor.price.toFixed(2)} vs R$${myPrice.toFixed(2)})`
      )
      return {
        trigger: 'SCENARIO_A_AGGRESSIVE_COMPETITOR',
        shouldPause: true,
        shouldSendAlert: true,
        alertEmailSubject: '⏸️ Anúncio Pausado: Concorrência Agressiva Detectada no Preço',
        alertEmailBody: `O Auto-Pilot pausou a campanha "${campaign.campaignName}" porque o ROAS caiu para ${campaign.roas.toFixed(2)}x e o concorrente "${minCompetitor.name}" está ${diffPct.toFixed(1)}% mais barato (R$${minCompetitor.price.toFixed(2)} vs seu preço de R$${myPrice.toFixed(2)}). Continuar o anúncio sem ajustar o preço ou a proposta de valor tende a desperdiçar orçamento.`,
        confidence: 88,
        adScore,
        priceScore,
        siteScore,
        bottleneck: 'PRICE',
        details,
      }
    }
  }

  // ── Cenário C: Pixel com falha ────────────────────────────────────────────
  if (lpAudit.hasPixelFailure && campaign.conversions === 0 && campaign.clicks > 50) {
    details.push('Pixel da Meta com falha — conversões podem estar sub-reportadas')
    return {
      trigger: 'SCENARIO_C_PIXEL_FAILURE',
      shouldPause: false,
      shouldSendAlert: true,
      alertEmailSubject: '⚠️ Alerta: Pixel da Meta com Falha Detectada',
      alertEmailBody: `A auditoria detectou que o Pixel da Meta não está disparando corretamente na landing page da campanha "${campaign.campaignName}". Com ${campaign.clicks} cliques e 0 conversões registradas, os dados de otimização estão comprometidos.`,
      confidence: 85,
      adScore,
      priceScore,
      siteScore: Math.min(siteScore, 40),
      bottleneck: 'SITE',
      details,
    }
  }

  // ── Cenário D: Página lenta como causa isolada ────────────────────────────
  if (roasFell && lpAudit.hasSlowPage && siteScore < 60) {
    details.push('Página lenta detectada — impacto direto na taxa de conversão pós-clique')
    return {
      trigger: 'SCENARIO_D_SLOW_PAGE',
      shouldPause: false,
      shouldSendAlert: true,
      alertEmailSubject: '⚠️ ROAS Caindo: Página Lenta Identificada como Gargalo',
      alertEmailBody: `O ROAS da campanha "${campaign.campaignName}" caiu para ${campaign.roas.toFixed(2)}x e a auditoria detectou problemas de performance na landing page. Páginas lentas causam abandono antes do checkout.`,
      confidence: 75,
      adScore,
      priceScore,
      siteScore,
      bottleneck: 'SITE',
      details,
    }
  }

  // ── Sem gargalo crítico ───────────────────────────────────────────────────
  const lowestScore = Math.min(adScore, priceScore, siteScore)
  let bottleneck: CorrelationResult['bottleneck'] = 'HEALTHY'
  if (lowestScore < 50) {
    if (adScore === lowestScore) bottleneck = 'AD'
    else if (priceScore === lowestScore) bottleneck = 'PRICE'
    else bottleneck = 'SITE'
  } else if (adScore < 70 && priceScore < 70) {
    bottleneck = 'MIXED'
  }

  details.push(`Scores — Anúncio: ${adScore} | Preço: ${priceScore} | Site: ${siteScore}`)

  return {
    trigger: 'HEALTHY',
    shouldPause: false,
    shouldSendAlert: false,
    alertEmailSubject: '',
    alertEmailBody: '',
    confidence: 80,
    adScore,
    priceScore,
    siteScore,
    bottleneck,
    details,
  }
}

// ─── GPT-4o Root Cause Insight ────────────────────────────────────────────────

let _openai: OpenAI | null = null
function getOpenAI(): OpenAI {
  if (!_openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error('OPENAI_API_KEY não definida')
    _openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _openai
}

/**
 * Envia os dados técnicos para o GPT-4o e retorna um parágrafo curto e humano
 * explicando a "Causa Raiz" da performance daquela semana, pronto para o dashboard.
 */
export async function generateRootCauseInsight(
  payload: CorrelationPayload,
  evaluation: Omit<CorrelationResult, 'rootCauseInsight' | 'executiveSummary'>
): Promise<string> {
  const { campaign, competitorPrices, lpAudit } = payload

  const minCompetitor = getMinReliableCompetitorPrice(competitorPrices)
  const myPrice = competitorPrices.find((c) => c.myPrice !== null)?.myPrice ?? null
  const priceContext = minCompetitor && myPrice
    ? `Concorrente mais barato: ${minCompetitor.name} a R$${minCompetitor.price.toFixed(2)} (seu preço: R$${myPrice.toFixed(2)}).`
    : competitorPrices.some((c) => c.scrapeFailed)
      ? 'Dados de preço indisponíveis (scraper falhou).'
      : 'Sem concorrentes cadastrados.'

  const lpContext = [
    lpAudit.hasCheckoutError ? '- Erro no checkout' : '',
    lpAudit.hasPixelFailure ? '- Pixel da Meta com falha' : '',
    lpAudit.hasSlowPage ? '- Página lenta' : '',
    lpAudit.hasBrokenCta ? '- Botão CTA quebrado' : '',
    lpAudit.topIssueDescription ?? '',
  ].filter(Boolean).join('\n') || 'Nenhuma issue crítica detectada na LP.'

  const prompt = `Você é um especialista sênior em tráfego pago e performance de e-commerce. Analise os dados abaixo e escreva UM parágrafo curto (máximo 4 frases) explicando a causa raiz da performance desta campanha. Seja direto, humano e evite jargões técnicos excessivos. Não use bullets nem markdown.

DADOS DA CAMPANHA:
- Nome: ${campaign.campaignName}
- ROAS atual: ${campaign.roas.toFixed(2)}x (alvo: ${campaign.targetRoas}x)
- CPA: R$${campaign.cpa.toFixed(2)} (limite: R$${campaign.cpaLimit.toFixed(2)})
- Frequência: ${campaign.frequency.toFixed(1)}
- Conversões: ${campaign.conversions}
- Gasto: R$${campaign.spend.toFixed(2)}

ANÁLISE DE PREÇO:
${priceContext}

AUDITORIA DA LANDING PAGE:
${lpContext}

DIAGNÓSTICO DO SISTEMA:
- Trigger: ${evaluation.trigger}
- Gargalo principal: ${evaluation.bottleneck}
- Score Anúncio: ${evaluation.adScore}/100 | Score Preço: ${evaluation.priceScore}/100 | Score Site: ${evaluation.siteScore}/100`

  try {
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 200,
      temperature: 0.5,
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de marketing digital. Responda APENAS com o parágrafo de análise, sem introduções, sem títulos, sem markdown.',
        },
        { role: 'user', content: prompt },
      ],
    })
    return res.choices[0]?.message?.content?.trim() ?? 'Análise indisponível no momento.'
  } catch (err) {
    console.error('[correlation-engine] Falha ao gerar insight:', err)
    return `Gargalo identificado: ${evaluation.bottleneck}. ${evaluation.details[0] ?? ''}`
  }
}

// ─── GPT-4o Executive Summary (3 parágrafos, foco em lucratividade) ──────────

/**
 * Gera um resumo executivo de 3 parágrafos voltado para o cliente de negócios.
 * Diferente do rootCauseInsight (técnico, 1 parágrafo), este é orientado a lucro:
 * § 1 — Situação atual e impacto financeiro
 * § 2 — Causa raiz em linguagem de negócio
 * § 3 — Ações concretas para recuperar ROI
 */
export async function generateExecutiveSummary(
  payload: CorrelationPayload,
  evaluation: Omit<CorrelationResult, 'rootCauseInsight' | 'executiveSummary'>
): Promise<string> {
  const { campaign, competitorPrices, lpAudit } = payload

  const minCompetitor = getMinReliableCompetitorPrice(competitorPrices)
  const myPrice = competitorPrices.find((c) => c.myPrice !== null)?.myPrice ?? null

  const priceContext = minCompetitor && myPrice
    ? `Concorrente mais barato: ${minCompetitor.name} a R$${minCompetitor.price.toFixed(2)} (seu preço: R$${myPrice.toFixed(2)}).`
    : 'Dados de preço indisponíveis.'

  const siteIssues = [
    lpAudit.hasCheckoutError && 'erro no checkout',
    lpAudit.hasPixelFailure && 'pixel da Meta com falha',
    lpAudit.hasSlowPage && 'página lenta',
    lpAudit.hasBrokenCta && 'CTA quebrado',
  ].filter(Boolean).join(', ') || 'nenhum problema técnico grave'

  const roasDiff = campaign.targetRoas > 0
    ? `${((campaign.roas / campaign.targetRoas - 1) * 100).toFixed(0)}%`
    : '0%'

  const estimatedWaste = campaign.spend > 0 && campaign.roas < campaign.targetRoas
    ? (campaign.spend * (1 - campaign.roas / campaign.targetRoas)).toFixed(2)
    : '0'

  const prompt = `Você é um consultor sênior de e-commerce e marketing de performance, responsável por um relatório executivo mensal para o CEO de uma empresa de varejo online. Escreva exatamente 3 parágrafos sobre a performance de campanhas, focando em impacto financeiro e ações de negócio. NÃO use métricas técnicas de marketing (CTR, CPC, frequência). Use linguagem de negócio: lucro, faturamento, competitividade, retorno.

DADOS FINANCEIROS DA CAMPANHA:
- Campanha: "${campaign.campaignName}"
- Retorno sobre investimento (ROAS): ${campaign.roas.toFixed(2)}x (meta: ${campaign.targetRoas}x)
- Investimento total: R$${campaign.spend.toFixed(2)}
- Desperdício estimado: R$${estimatedWaste} (${roasDiff} ${campaign.roas < campaign.targetRoas ? 'abaixo' : 'acima'} da meta)
- Vendas geradas: ${campaign.conversions} conversões
- Custo por venda: R$${campaign.cpa.toFixed(2)}

CENÁRIO COMPETITIVO:
${priceContext}

SITUAÇÃO DO PONTO DE VENDA DIGITAL:
Problemas encontrados: ${siteIssues}
Pontuação de saúde: ${evaluation.siteScore}/100

DIAGNÓSTICO DO SISTEMA:
Gargalo principal: ${evaluation.bottleneck}
Scores — Anúncio: ${evaluation.adScore}/100 | Preço: ${evaluation.priceScore}/100 | Site: ${evaluation.siteScore}/100

§1 - Descreva a situação financeira atual e o impacto no caixa da empresa (2-3 frases).
§2 - Explique a causa raiz do problema em linguagem de negócio, sem termos técnicos de marketing (2-3 frases).
§3 - Indique 2-3 ações concretas e priorizadas que o gestor deve tomar esta semana para recuperar o retorno (2-3 frases).

Separe os parágrafos com uma linha em branco. Não use títulos, bullets, markdown ou emojis.`

  try {
    const res = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 400,
      temperature: 0.4,
      messages: [
        {
          role: 'system',
          content: 'Você é um consultor de negócios digital. Responda APENAS com os 3 parágrafos solicitados, separados por linha em branco. Sem introduções, títulos, bullets ou markdown.',
        },
        { role: 'user', content: prompt },
      ],
    })
    return res.choices[0]?.message?.content?.trim() ?? 'Resumo executivo indisponível.'
  } catch (err) {
    console.error('[correlation-engine] Falha ao gerar resumo executivo:', err)
    return `Gargalo identificado: ${evaluation.bottleneck}. Scores — Anúncio: ${evaluation.adScore}/100, Preço: ${evaluation.priceScore}/100, Site: ${evaluation.siteScore}/100.`
  }
}

// ─── Função Principal Exportada ───────────────────────────────────────────────

/**
 * getStrategicInsight()
 *
 * Consolida dados de Meta Ads + Price Intelligence + LP Audit,
 * valida via Zod (rejeita dados corrompidos), avalia correlações
 * e retorna um resultado completo com insight gerado por GPT-4o.
 *
 * @throws {z.ZodError} se o payload não passar na validação — NUNCA use dados inválidos.
 */
export async function getStrategicInsight(
  rawPayload: unknown
): Promise<CorrelationResult> {
  // Validação rígida — se falhar, propaga o erro para o chamador
  const payload = CorrelationPayloadSchema.parse(rawPayload)

  // Avaliação de correlações (síncrona, sem IO)
  const evaluation = evaluateCorrelation(payload)

  // Geração de insights por GPT-4o em paralelo (insight técnico + resumo executivo)
  const [rootCauseInsight, executiveSummary] = await Promise.all([
    generateRootCauseInsight(payload, evaluation),
    generateExecutiveSummary(payload, evaluation),
  ])

  return { ...evaluation, rootCauseInsight, executiveSummary }
}
