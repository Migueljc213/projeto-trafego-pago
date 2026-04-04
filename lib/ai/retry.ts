/**
 * Sistema de retry com backoff exponencial para chamadas instáveis à Meta API.
 * Usa p-retry com lógica customizada para rate limits.
 */

import pRetry, { AbortError } from 'p-retry'
import { MetaRateLimitError, MetaApiError } from '@/lib/meta-api'

export interface RetryOptions {
  maxAttempts?: number
  initialDelay?: number  // ms
  label?: string         // Para logs
}

/**
 * Executa uma função com retry automático.
 *
 * - Rate limit (429 / MetaRateLimitError): aguarda `retryAfter` segundos antes de tentar novamente
 * - Erros transitórios (5xx): backoff exponencial com jitter
 * - Erros permanentes (4xx que não sejam 429): AbortError (sem retry)
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 4,
    initialDelay = 1000,
    label = 'meta-api',
  } = options

  return pRetry(
    async (attempt) => {
      try {
        return await fn()
      } catch (err) {
        // Rate limit: aguarda o tempo especificado pela Meta
        if (err instanceof MetaRateLimitError) {
          const waitMs = err.retryAfter * 1000
          console.warn(`[${label}] Rate limit atingido. Aguardando ${err.retryAfter}s antes da tentativa ${attempt + 1}/${maxAttempts}`)
          await sleep(waitMs)
          throw err // p-retry vai tentar novamente
        }

        // Erro permanente da Meta (ex: token inválido, permissão negada)
        if (err instanceof MetaApiError) {
          const permanentCodes = [100, 190, 200, 294, 10, 200]
          if (permanentCodes.includes(err.code)) {
            console.error(`[${label}] Erro permanente (${err.code}): ${err.message}`)
            throw new AbortError(err.message) // Cancela retries
          }
        }

        // Erro genérico: backoff exponencial com jitter
        const backoff = initialDelay * Math.pow(2, attempt - 1) + jitter(200)
        console.warn(`[${label}] Tentativa ${attempt}/${maxAttempts} falhou. Retry em ${backoff}ms`, err)
        await sleep(backoff)
        throw err
      }
    },
    {
      retries: maxAttempts - 1,
      onFailedAttempt: (error) => {
        console.warn(
          `[${label}] Tentativa ${error.attemptNumber}/${maxAttempts} falhou`
        )
      },
    }
  )
}

/**
 * Variante com retry para atualizações de orçamento na Meta API.
 * Usa configurações mais agressivas pois orçamento é crítico.
 */
export async function withBudgetRetry<T>(fn: () => Promise<T>): Promise<T> {
  return withRetry(fn, {
    maxAttempts: 5,
    initialDelay: 2000,
    label: 'meta-budget',
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function jitter(maxMs: number): number {
  return Math.floor(Math.random() * maxMs)
}
