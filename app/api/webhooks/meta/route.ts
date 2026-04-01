import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { z } from 'zod'
import { MetaWebhookPayloadSchema } from '@/lib/validations'
import { prisma } from '@/lib/prisma'

// GET: Verificação inicial da Meta (hub challenge)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')

  if (mode === 'subscribe' && token === process.env.META_WEBHOOK_VERIFY_TOKEN) {
    console.log('[Webhook] Meta verification successful')
    return new NextResponse(challenge, { status: 200 })
  }

  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

// POST: Receber eventos da Meta
export async function POST(request: NextRequest) {
  // 1. Verificar assinatura HMAC-SHA256
  const rawBody = await request.text()
  const signature = request.headers.get('x-hub-signature-256')

  if (!signature || !verifySignature(rawBody, signature)) {
    console.warn('[Webhook] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  // 2. Parsear e validar payload com Zod
  let payload: z.infer<typeof MetaWebhookPayloadSchema>
  try {
    const json = JSON.parse(rawBody)
    payload = MetaWebhookPayloadSchema.parse(json)
  } catch (err) {
    console.error('[Webhook] Invalid payload:', err)
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 })
  }

  // 3. Processar eventos assincronamente (não bloqueia resposta)
  processWebhookEvents(payload).catch((err) =>
    console.error('[Webhook] Processing error:', err)
  )

  // 4. Responder imediatamente com 200 (Meta exige resposta rápida)
  return NextResponse.json({ received: true }, { status: 200 })
}

function verifySignature(rawBody: string, signature: string): boolean {
  const appSecret = process.env.META_APP_SECRET
  if (!appSecret) return false

  const expectedSignature =
    'sha256=' +
    crypto.createHmac('sha256', appSecret).update(rawBody).digest('hex')

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

async function processWebhookEvents(
  payload: z.infer<typeof MetaWebhookPayloadSchema>
) {
  if (payload.object !== 'ad_campaign') return

  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      if (change.field === 'campaign_status') {
        const value = change.value as { campaign_id?: string; status?: string }
        if (value.campaign_id && value.status) {
          // Mapeia status da Meta para nosso enum
          const statusMap: Record<string, string> = {
            ACTIVE: 'ACTIVE',
            PAUSED: 'PAUSED',
            DELETED: 'DELETED',
            ARCHIVED: 'ARCHIVED',
          }
          const mappedStatus = statusMap[value.status]
          if (mappedStatus) {
            await prisma.campaign.updateMany({
              where: { metaCampaignId: value.campaign_id },
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              data: { status: mappedStatus as any },
            })
            console.log(
              `[Webhook] Campaign ${value.campaign_id} → ${mappedStatus}`
            )
          }
        }
      }
    }
  }
}
