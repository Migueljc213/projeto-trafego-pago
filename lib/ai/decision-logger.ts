/**
 * Persiste cada decisão do AI Auto-Pilot na tabela AiDecisionLog do Prisma.
 * Garante rastreabilidade total de cada ação tomada pela IA.
 */

import { prisma } from '@/lib/prisma'
import type { AutoPilotDecision } from './auto-pilot'
import type { DecisionType } from '@prisma/client'

// ─── Mappers ──────────────────────────────────────────────────────────────────

const DECISION_TYPE_MAP: Record<string, DecisionType> = {
  PAUSE: 'PAUSE',
  SCALE: 'SCALE',
  REDUCE_BUDGET: 'REDUCE_BUDGET',
  MONITOR: 'MONITOR',
  NO_ACTION: 'NO_ACTION',
}

// ─── Logger Principal ─────────────────────────────────────────────────────────

/**
 * Salva uma decisão do Auto-Pilot no banco de dados.
 *
 * @param campaignId - ID interno da campanha (Prisma)
 * @param decision - Decisão gerada pelo `runAutoPilot`
 * @returns O ID do registro criado
 */
export async function logDecision(
  campaignId: string,
  decision: AutoPilotDecision
): Promise<string> {
  const type = DECISION_TYPE_MAP[decision.type] ?? 'NO_ACTION'

  const log = await prisma.aiDecisionLog.create({
    data: {
      campaignId,
      type,
      reason: decision.reason,
      confidence: decision.confidence,
      // Salva snapshot das métricas como JSON para auditoria futura
      metrics: {
        spend: decision.metrics.spend,
        roas: decision.metrics.roas,
        cpa: decision.metrics.cpa,
        conversions: decision.metrics.conversions,
        frequency: decision.metrics.frequency,
        ctr: decision.metrics.ctr,
        impressions: decision.metrics.impressions,
        clicks: decision.metrics.clicks,
        targetRoas: decision.metrics.targetRoas,
        dailyBudget: decision.metrics.dailyBudget,
        evaluatedAt: new Date().toISOString(),
      },
      executed: false,
    },
  })

  return log.id
}

/**
 * Marca um log como executado (após a ação ser aplicada na Meta API).
 */
export async function markDecisionExecuted(logId: string): Promise<void> {
  await prisma.aiDecisionLog.update({
    where: { id: logId },
    data: {
      executed: true,
      executedAt: new Date(),
    },
  })
}

/**
 * Atualiza o campo `lastAiAction` da campanha para exibição no dashboard.
 */
export async function updateCampaignAiStatus(
  campaignId: string,
  action: string
): Promise<void> {
  await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      lastAiAction: action,
      lastAiActionAt: new Date(),
    },
  })
}

/**
 * Retorna os últimos N logs de decisão de uma campanha.
 * Usado pelo dashboard para popular o AIInsightsFeed.
 */
export async function getDecisionHistory(
  campaignId: string,
  limit = 20
): Promise<Array<{
  id: string
  type: DecisionType
  reason: string
  confidence: number
  executed: boolean
  createdAt: Date
}>> {
  return prisma.aiDecisionLog.findMany({
    where: { campaignId },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      reason: true,
      confidence: true,
      executed: true,
      createdAt: true,
    },
  })
}

/**
 * Retorna os logs de todos os campaigns de uma adAccount (para o feed global).
 */
export async function getAdAccountDecisionFeed(
  adAccountId: string,
  limit = 30
): Promise<Array<{
  id: string
  type: DecisionType
  reason: string
  confidence: number
  executed: boolean
  createdAt: Date
  campaign: { id: string; name: string }
}>> {
  return prisma.aiDecisionLog.findMany({
    where: {
      campaign: { adAccountId },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
    select: {
      id: true,
      type: true,
      reason: true,
      confidence: true,
      executed: true,
      createdAt: true,
      campaign: {
        select: { id: true, name: true },
      },
    },
  })
}
