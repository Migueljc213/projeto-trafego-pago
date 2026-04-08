/**
 * Motor de decisão do AI Auto-Pilot.
 * Toda lógica roda no servidor — nunca exposta ao cliente.
 *
 * v2: Aceita CorrelationContext opcional para decisões multivariáveis
 * que combinam ROAS, Price Intelligence e LP Audit em um único julgamento.
 */

import type { CorrelationResult } from './correlation-engine'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface CampaignMetrics {
  campaignId: string
  campaignName: string
  // Métricas da campanha
  spend: number           // Gasto total no período
  conversions: number
  roas: number            // Return on Ad Spend
  cpa: number             // Custo por aquisição
  frequency: number       // Frequência média de exibição
  impressions: number
  clicks: number
  ctr: number             // Click-through rate (%)
  // Limites configurados pelo usuário/IA
  targetRoas: number      // ROAS mínimo desejado
  spendThreshold: number  // Gasto mínimo antes de tomar ação (evita decisões prematuras)
  cpaLimit: number        // CPA máximo tolerado
  dailyBudget: number     // Orçamento diário atual (em centavos ou unidade da moeda)
}

export type DecisionType = 'PAUSE' | 'SCALE' | 'REDUCE_BUDGET' | 'MONITOR' | 'NO_ACTION'

export interface AutoPilotDecision {
  type: DecisionType
  reason: string          // Texto humano explicando o "porquê"
  confidence: number      // 0–100
  suggestedBudget?: number // Novo orçamento sugerido (apenas em SCALE ou REDUCE_BUDGET)
  urgent: boolean         // Acão imediata necessária?
  metrics: CampaignMetrics // Snapshot das métricas usadas
}

// ─── Stop-Loss ────────────────────────────────────────────────────────────────

/**
 * Avalia se a campanha deve ser pausada.
 *
 * Regras:
 * 1. ROAS < targetRoas E Spend > spendThreshold → PAUSE (urgente)
 * 2. Frequência > aiMaxFrequency → PAUSE (fadiga de criativo)
 * 3. CPA > cpaLimit * 1.5 → PAUSE (CPA crítico)
 */
export function evaluateStopLoss(
  metrics: CampaignMetrics,
  aiMaxFrequency: number = 4.0
): AutoPilotDecision | null {
  const { spend, roas, targetRoas, spendThreshold, cpa, cpaLimit, frequency } = metrics

  // Sem dados suficientes para decidir
  if (spend < spendThreshold) return null

  // Regra 1: ROAS abaixo do alvo com gasto acima do limiar
  if (roas < targetRoas) {
    const deficit = ((targetRoas - roas) / targetRoas) * 100
    return {
      type: 'PAUSE',
      reason: `ROAS atual (${roas.toFixed(2)}x) está ${deficit.toFixed(0)}% abaixo do alvo (${targetRoas}x) com R$${spend.toFixed(2)} investidos. Campanha pausada para evitar desperdício.`,
      confidence: Math.min(95, 60 + deficit),
      urgent: deficit > 30,
      metrics,
    }
  }

  // Regra 2: Frequência excessiva (fadiga de criativo)
  if (frequency > aiMaxFrequency) {
    return {
      type: 'PAUSE',
      reason: `Frequência de ${frequency.toFixed(1)} está acima do limite de ${aiMaxFrequency}. O público já viu o anúncio muitas vezes — novos criativos são necessários.`,
      confidence: 80,
      urgent: frequency > aiMaxFrequency * 1.5,
      metrics,
    }
  }

  // Regra 3: CPA crítico (50% acima do limite)
  if (cpa > cpaLimit * 1.5) {
    return {
      type: 'PAUSE',
      reason: `CPA de R$${cpa.toFixed(2)} está ${(((cpa - cpaLimit) / cpaLimit) * 100).toFixed(0)}% acima do limite de R$${cpaLimit.toFixed(2)}. Campanha não é lucrativa.`,
      confidence: 88,
      urgent: true,
      metrics,
    }
  }

  return null
}

// ─── Scaling ──────────────────────────────────────────────────────────────────

/**
 * Avalia se o orçamento deve ser escalado ou reduzido.
 *
 * Regras:
 * 1. ROAS > targetRoas * 1.5 E CPA < cpaLimit → SCALE (+25% orçamento)
 * 2. ROAS entre targetRoas e targetRoas * 1.5 → MONITOR
 * 3. CPA entre cpaLimit e cpaLimit * 1.5 → REDUCE_BUDGET (-20%)
 */
export function evaluateScaling(metrics: CampaignMetrics): AutoPilotDecision | null {
  const { spend, roas, targetRoas, cpa, cpaLimit, dailyBudget, spendThreshold } = metrics

  if (spend < spendThreshold) return null

  // Regra 1: Performance excelente — escalar
  if (roas >= targetRoas * 1.5 && cpa <= cpaLimit) {
    const increase = 0.25 // 25%
    const suggestedBudget = Math.round(dailyBudget * (1 + increase))
    return {
      type: 'SCALE',
      reason: `ROAS de ${roas.toFixed(2)}x está ${((roas / targetRoas - 1) * 100).toFixed(0)}% acima do alvo e CPA (R$${cpa.toFixed(2)}) dentro do limite. Orçamento aumentado em 25%: R$${(dailyBudget / 100).toFixed(2)} → R$${(suggestedBudget / 100).toFixed(2)}.`,
      confidence: 85,
      suggestedBudget,
      urgent: false,
      metrics,
    }
  }

  // Regra 2: CPA um pouco acima — reduzir gradualmente
  if (cpa > cpaLimit && cpa <= cpaLimit * 1.5) {
    const reduction = 0.20 // 20%
    const suggestedBudget = Math.round(dailyBudget * (1 - reduction))
    return {
      type: 'REDUCE_BUDGET',
      reason: `CPA de R$${cpa.toFixed(2)} está ${(((cpa - cpaLimit) / cpaLimit) * 100).toFixed(0)}% acima do limite. Reduzindo orçamento em 20% para estabilizar antes de pausar.`,
      confidence: 72,
      suggestedBudget,
      urgent: false,
      metrics,
    }
  }

  // Regra 3: Performance boa mas não excelente — monitorar
  if (roas >= targetRoas && roas < targetRoas * 1.5) {
    return {
      type: 'MONITOR',
      reason: `ROAS de ${roas.toFixed(2)}x está dentro do alvo mas ainda não atingiu o limiar de escala (${(targetRoas * 1.5).toFixed(1)}x). Monitorando.`,
      confidence: 60,
      urgent: false,
      metrics,
    }
  }

  return null
}

// ─── Motor Principal ──────────────────────────────────────────────────────────

/**
 * Executa o ciclo completo de avaliação do Auto-Pilot para uma campanha.
 * Stop-loss tem prioridade sobre scaling.
 */
export function runAutoPilot(
  metrics: CampaignMetrics,
  aiMaxFrequency: number = 4.0
): AutoPilotDecision {
  // 1. Verifica stop-loss primeiro (evita perda)
  const stopLoss = evaluateStopLoss(metrics, aiMaxFrequency)
  if (stopLoss) return stopLoss

  // 2. Avalia oportunidade de scaling
  const scaling = evaluateScaling(metrics)
  if (scaling) return scaling

  // 3. Nenhuma ação necessária
  return {
    type: 'NO_ACTION',
    reason: `Campanha com performance estável. ROAS: ${metrics.roas.toFixed(2)}x | CPA: R$${metrics.cpa.toFixed(2)} | Frequência: ${metrics.frequency.toFixed(1)}`,
    confidence: 90,
    urgent: false,
    metrics,
  }
}

// ─── Motor Multivariável com Correlação ───────────────────────────────────────

/**
 * Versão aprimorada do Auto-Pilot que incorpora o resultado do Motor de
 * Correlação Estratégica antes de tomar uma decisão.
 *
 * Regras de prioridade:
 * 1. Cenários A/B/C da correlação têm prioridade total (causa raiz identificada)
 * 2. Stop-loss clássico como fallback quando correlação não encontra gargalo
 * 3. Scaling apenas quando correlação confirma que o funil está saudável
 */
export function runCorrelatedAutoPilot(
  metrics: CampaignMetrics,
  correlation: CorrelationResult,
  aiMaxFrequency: number = 4.0
): AutoPilotDecision {
  // Dados insuficientes — aguardar
  if (correlation.trigger === 'INSUFFICIENT_DATA') {
    return {
      type: 'NO_ACTION',
      reason: `Dados insuficientes para análise correlacionada. Aguardando mais spend para avaliação segura.`,
      confidence: 20,
      urgent: false,
      metrics,
    }
  }

  // Cenário B: Checkout quebrado — pausa imediata (urgente)
  if (correlation.trigger === 'SCENARIO_B_CHECKOUT_BROKEN' && correlation.shouldPause) {
    return {
      type: 'PAUSE',
      reason: `[Motor de Correlação] ${correlation.alertEmailBody}`,
      confidence: correlation.confidence,
      urgent: true,
      metrics,
    }
  }

  // Cenário A: Concorrência agressiva — pausa com alerta de preço
  if (correlation.trigger === 'SCENARIO_A_AGGRESSIVE_COMPETITOR' && correlation.shouldPause) {
    return {
      type: 'PAUSE',
      reason: `[Motor de Correlação] ${correlation.alertEmailBody}`,
      confidence: correlation.confidence,
      urgent: false,
      metrics,
    }
  }

  // Cenário C: Pixel com falha — não pausa, mas alerta (dados comprometidos)
  if (correlation.trigger === 'SCENARIO_C_PIXEL_FAILURE') {
    return {
      type: 'MONITOR',
      reason: `[Motor de Correlação] Pixel da Meta com falha detectado. ${correlation.details.join(' | ')}`,
      confidence: correlation.confidence,
      urgent: true,
      metrics,
    }
  }

  // Cenário D: Página lenta — reduz orçamento para minimizar desperdício
  if (correlation.trigger === 'SCENARIO_D_SLOW_PAGE') {
    const suggestedBudget = Math.round(metrics.dailyBudget * 0.7) // Reduz 30%
    return {
      type: 'REDUCE_BUDGET',
      reason: `[Motor de Correlação] Página lenta identificada como gargalo. Reduzindo orçamento em 30% até correção técnica.`,
      confidence: correlation.confidence,
      urgent: false,
      suggestedBudget,
      metrics,
    }
  }

  // Funil saudável — avalia scaling normalmente (não existe risco de site/preço)
  if (correlation.trigger === 'HEALTHY' && correlation.siteScore >= 70 && correlation.priceScore >= 70) {
    const scaling = evaluateScaling(metrics)
    if (scaling) return scaling
  }

  // Fallback: stop-loss clássico para casos não cobertos pela correlação
  const stopLoss = evaluateStopLoss(metrics, aiMaxFrequency)
  if (stopLoss) return stopLoss

  return {
    type: 'NO_ACTION',
    reason: `Campanha estável. ROAS: ${metrics.roas.toFixed(2)}x | Anúncio: ${correlation.adScore}/100 | Preço: ${correlation.priceScore}/100 | Site: ${correlation.siteScore}/100`,
    confidence: 85,
    urgent: false,
    metrics,
  }
}
