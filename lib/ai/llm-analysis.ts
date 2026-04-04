/**
 * Integração com OpenAI para análise qualitativa de criativos e copy de anúncios.
 * Roda apenas no servidor — a API key NUNCA é exposta ao cliente.
 */

import OpenAI from 'openai'
import type { CampaignMetrics } from './auto-pilot'

// ─── Cliente OpenAI (singleton) ───────────────────────────────────────────────

let _client: OpenAI | null = null

function getOpenAIClient(): OpenAI {
  if (!_client) {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY não definida nas variáveis de ambiente.')
    }
    _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  }
  return _client
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export interface AdCreative {
  headline: string          // Título principal do anúncio
  primaryText: string       // Texto principal
  description?: string      // Descrição (call-to-action)
  imageUrl?: string         // URL da imagem (para análise visual via Vision)
  videoThumbnailUrl?: string
  ctaButton?: string        // Ex: "Comprar Agora", "Saiba Mais"
  destinationUrl: string    // URL de destino
}

export interface AdAnalysisResult {
  insight: string           // Observação principal sobre o criativo
  action_score: number      // 0–100 (100 = precisa de ação imediata)
  issues: AdIssue[]         // Lista de problemas específicos
  suggestions: string[]     // Sugestões de melhoria
  urgency: 'low' | 'medium' | 'high' | 'critical'
}

export interface AdIssue {
  type: 'copy' | 'creative' | 'cta' | 'landing_page' | 'targeting'
  description: string
  impact: 'low' | 'medium' | 'high'
}

// ─── Prompt de análise de copy + criativo ─────────────────────────────────────

function buildAnalysisPrompt(creative: AdCreative, metrics: CampaignMetrics): string {
  const ctr = metrics.ctr.toFixed(2)
  const roasVsTarget = ((metrics.roas / metrics.targetRoas - 1) * 100).toFixed(0)
  const roasStatus = metrics.roas >= metrics.targetRoas ? `+${roasVsTarget}% acima do alvo` : `${roasVsTarget}% abaixo do alvo`

  return `Você é um especialista sênior em performance de mídia paga e copywriting para e-commerce.

Analise o seguinte anúncio do Meta Ads e correlacione com as métricas de performance:

## CRIATIVO DO ANÚNCIO
- **Título (Headline):** "${creative.headline}"
- **Texto Principal:** "${creative.primaryText}"
${creative.description ? `- **Descrição:** "${creative.description}"` : ''}
${creative.ctaButton ? `- **Botão CTA:** "${creative.ctaButton}"` : ''}
- **URL de Destino:** ${creative.destinationUrl}

## MÉTRICAS DE PERFORMANCE (últimos 30 dias)
- ROAS: ${metrics.roas.toFixed(2)}x (alvo: ${metrics.targetRoas}x | ${roasStatus})
- CTR: ${ctr}% | Cliques: ${metrics.clicks.toLocaleString('pt-BR')}
- CPA: R$${metrics.cpa.toFixed(2)} (limite: R$${metrics.cpaLimit.toFixed(2)})
- Frequência: ${metrics.frequency.toFixed(1)} (limite: 4.0)
- Conversões: ${metrics.conversions} de ${metrics.impressions.toLocaleString('pt-BR')} impressões
- Gasto total: R$${metrics.spend.toFixed(2)}

## TAREFA
Identifique os problemas na copy e criativo que podem estar causando baixa performance.
Considere: comprimento do texto para mobile, clareza do CTA, alinhamento com intenção de compra,
proposta de valor, urgência, prova social, e qualquer inconsistência que impacte conversão.

## RESPOSTA (JSON estrito, sem markdown, sem explicações fora do JSON)
{
  "insight": "Observação principal em 1–2 frases explicando o problema mais crítico",
  "action_score": número de 0 a 100 (0=perfeito, 100=pausar imediatamente),
  "issues": [
    {
      "type": "copy|creative|cta|landing_page|targeting",
      "description": "Descrição específica do problema",
      "impact": "low|medium|high"
    }
  ],
  "suggestions": ["Sugestão concreta 1", "Sugestão concreta 2"],
  "urgency": "low|medium|high|critical"
}`
}

// ─── Análise de criativo (texto + opcionalmente imagem) ───────────────────────

/**
 * Analisa o copy e criativo de um anúncio usando GPT-4o.
 * Se `creative.imageUrl` for fornecido, usa GPT-4o Vision para análise visual.
 */
export async function analyzeAdCreative(
  creative: AdCreative,
  metrics: CampaignMetrics
): Promise<AdAnalysisResult> {
  const client = getOpenAIClient()
  const prompt = buildAnalysisPrompt(creative, metrics)

  let response: OpenAI.Chat.ChatCompletion

  // Com imagem: usa Vision
  if (creative.imageUrl || creative.videoThumbnailUrl) {
    const imageUrl = creative.imageUrl ?? creative.videoThumbnailUrl!
    response = await client.chat.completions.create({
      model: 'gpt-4o',
      max_tokens: 1000,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: imageUrl,
                detail: 'low', // Reduz custo — suficiente para análise de criativo
              },
            },
          ],
        },
      ],
      response_format: { type: 'json_object' },
    })
  } else {
    // Só texto
    response = await client.chat.completions.create({
      model: 'gpt-4o-mini', // Mais barato para análise só de texto
      max_tokens: 800,
      messages: [
        { role: 'system', content: 'Você responde APENAS em JSON válido, sem markdown.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    })
  }

  const raw = response.choices[0]?.message?.content ?? '{}'

  try {
    const parsed = JSON.parse(raw) as AdAnalysisResult

    // Garante que action_score está no intervalo correto
    parsed.action_score = Math.max(0, Math.min(100, parsed.action_score ?? 50))
    parsed.issues = parsed.issues ?? []
    parsed.suggestions = parsed.suggestions ?? []
    parsed.urgency = parsed.urgency ?? 'medium'

    return parsed
  } catch {
    console.error('[llm-analysis] Falha ao parsear resposta da OpenAI:', raw)
    return {
      insight: 'Não foi possível analisar o criativo no momento.',
      action_score: 0,
      issues: [],
      suggestions: [],
      urgency: 'low',
    }
  }
}

// ─── Geração de insight textual para o AI Feed ────────────────────────────────

/**
 * Gera um insight curto e legível para exibir no AIInsightsFeed do dashboard.
 * Mais barato — usa GPT-4o-mini.
 */
export async function generateInsightSummary(
  decision: { type: string; reason: string },
  campaignName: string
): Promise<string> {
  const client = getOpenAIClient()

  const res = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    max_tokens: 120,
    messages: [
      {
        role: 'system',
        content:
          'Você reescreve alertas técnicos de marketing digital em linguagem humana, direta e empática. Máximo 2 frases.',
      },
      {
        role: 'user',
        content: `Reescreva este alerta de forma simples:\nCampanha: "${campaignName}"\nAção: ${decision.type}\nMotivo: ${decision.reason}`,
      },
    ],
  })

  return res.choices[0]?.message?.content?.trim() ?? decision.reason
}
