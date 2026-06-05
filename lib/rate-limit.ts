/**
 * Rate limiter em memória por IP.
 *
 * Funciona dentro de uma instância serverless. Cada cold start reseta o store —
 * para rate limiting cross-instance em produção, substitua por Upstash Redis
 * (@upstash/ratelimit) apontando para UPSTASH_REDIS_REST_URL/TOKEN.
 */

interface Entry {
  count: number
  resetAt: number
}

const store = new Map<string, Entry>()

// Limpa entradas expiradas a cada 5 min para evitar leak de memória
setInterval(() => {
  const now = Date.now()
  store.forEach((entry, key) => {
    if (now > entry.resetAt) store.delete(key)
  })
}, 5 * 60 * 1000)

/**
 * @param key      Identificador (ex: `${ip}:${route}`)
 * @param limit    Máximo de requisições na janela
 * @param windowMs Janela em ms (ex: 60_000 = 1 minuto)
 * @returns true se permitido, false se rate limit excedido
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) return false
  entry.count++
  return true
}

/** Extrai IP real considerando proxies (Vercel, Cloudflare). */
export function getClientIp(request: Request): string {
  const headers = request instanceof Request ? request.headers : new Headers()
  return (
    headers.get('x-real-ip') ??
    headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    'unknown'
  )
}
