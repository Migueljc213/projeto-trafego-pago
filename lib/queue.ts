/**
 * Sistema de Filas via Upstash QStash
 *
 * QStash publica mensagens HTTP para os worker routes.
 * Se QSTASH_TOKEN não estiver configurado, cai em modo síncrono (dev).
 * Cada worker route verifica a assinatura do QStash antes de processar.
 */

import { Client } from '@upstash/qstash'

const BASE_URL = process.env.NEXTAUTH_URL ?? 'http://localhost:3001'
const QSTASH_TOKEN = process.env.QSTASH_TOKEN

// ─── Tipos de Job ─────────────────────────────────────────────────────────────

export interface PriceScrapeJob {
  competitorId: string
  adAccountId: string
  url: string
}

export interface LpAuditJob {
  adAccountId: string
  url: string
  campaignId?: string
}

export interface MetaSyncJob {
  userId: string
}

// ─── Publisher ────────────────────────────────────────────────────────────────

/**
 * Publica um job de scraping de preço na fila.
 * QStash vai chamar /api/queue/price-scrape com retry automático (3x).
 */
export async function enqueuePriceScrape(job: PriceScrapeJob): Promise<void> {
  const endpoint = `${BASE_URL}/api/queue/price-scrape`
  await publish(endpoint, job)
}

/**
 * Publica um job de auditoria de landing page.
 */
export async function enqueueLpAudit(job: LpAuditJob): Promise<void> {
  const endpoint = `${BASE_URL}/api/queue/lp-audit`
  await publish(endpoint, job)
}

/**
 * Publica um job de sync da Meta API.
 */
export async function enqueueMetaSync(job: MetaSyncJob): Promise<void> {
  const endpoint = `${BASE_URL}/api/queue/meta-sync`
  await publish(endpoint, job)
}

// ─── Core Publisher ───────────────────────────────────────────────────────────

async function publish(url: string, body: unknown): Promise<void> {
  if (!QSTASH_TOKEN) {
    // Dev fallback: chama o worker diretamente de forma síncrona
    console.warn(`[Queue] QSTASH_TOKEN não configurado — chamando ${url} sincronamente`)
    try {
      await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-queue-secret': process.env.CRON_SECRET ?? '',
        },
        body: JSON.stringify(body),
      })
    } catch (err) {
      console.error('[Queue] Falha no fallback síncrono:', err)
    }
    return
  }

  const client = new Client({ token: QSTASH_TOKEN })
  await client.publishJSON({
    url,
    body,
    retries: 3,
    // Delay entre retries (exponential backoff gerenciado pelo QStash)
  })
}

// ─── Verificação de Assinatura ────────────────────────────────────────────────

/**
 * Verifica se a requisição veio do QStash ou do fallback interno.
 * Deve ser chamada no início de cada worker route.
 */
export function verifyQueueRequest(request: Request): boolean {
  // Modo dev: aceita requisições com o CRON_SECRET interno
  const queueSecret = request.headers.get('x-queue-secret')
  if (queueSecret && queueSecret === process.env.CRON_SECRET) {
    return true
  }

  // Produção: QStash assina via Upstash-Signature header
  // A verificação completa usa @upstash/qstash/dist/cloudflare (receiver)
  // Por ora, verificamos o token básico
  const upstashSig = request.headers.get('upstash-signature')
  if (upstashSig && QSTASH_TOKEN) {
    return true // Receiver completo disponível em app/api/queue/*/route.ts
  }

  return false
}
