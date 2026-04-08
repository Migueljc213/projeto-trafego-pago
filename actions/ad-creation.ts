'use server'

import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createAdCopyFromUrl, type AdCreationResult } from '@/lib/ai/ad-creation-helper'
import { z } from 'zod'
import type { ActionResult } from './ad-accounts'

// ─── Schema de validação ──────────────────────────────────────────────────────

const AdCreationInputSchema = z.object({
  productUrl: z.string().url('URL de produto inválida'),
})

// ─── Server Action ────────────────────────────────────────────────────────────

/**
 * Raspa a URL do produto com Playwright e gera 3 variações de Headlines
 * e 3 de Primary Texts otimizadas para conversão via GPT-4o.
 *
 * Requer autenticação — nunca expõe a OpenAI key ao cliente.
 */
export async function generateAdCopyAction(
  input: unknown
): Promise<ActionResult<AdCreationResult>> {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) return { success: false, error: 'Não autenticado' }

  const parsed = AdCreationInputSchema.safeParse(input)
  if (!parsed.success) {
    return {
      success: false,
      error: parsed.error.issues[0]?.message ?? 'URL inválida',
    }
  }

  try {
    const result = await createAdCopyFromUrl(parsed.data.productUrl)
    return { success: true, data: result }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erro ao gerar copy'
    console.error('[generateAdCopyAction]', err)
    return { success: false, error: message }
  }
}
