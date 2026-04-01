import { z } from 'zod'

// Para toggle de auto-pilot
export const ToggleAutoPilotSchema = z.object({
  campaignId: z.string().min(1, 'Campaign ID obrigatório'),
  enabled: z.boolean(),
})

// Para adicionar competidor
export const AddCompetitorSchema = z.object({
  adAccountId: z.string().min(1),
  name: z.string().min(1).max(100),
  url: z.string().url('URL inválida'),
})

// Para webhook da Meta (verificação de assinatura)
export const MetaWebhookEntrySchema = z.object({
  id: z.string(),
  time: z.number(),
  changes: z.array(
    z.object({
      value: z.record(z.string(), z.unknown()),
      field: z.string(),
    })
  ),
})

export const MetaWebhookPayloadSchema = z.object({
  object: z.string(),
  entry: z.array(MetaWebhookEntrySchema),
})

// Para conectar conta de anúncio
export const ConnectAdAccountSchema = z.object({
  metaAccountId: z
    .string()
    .regex(/^act_\d+$/, 'Formato inválido (esperado: act_XXXXXXX)'),
  name: z.string().min(1),
  currency: z.string().length(3).default('BRL'),
  timezone: z.string().default('America/Sao_Paulo'),
})
