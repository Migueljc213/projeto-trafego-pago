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
  for (const entry of payload.entry) {
    for (const change of entry.changes) {
      await handleChange(change.field, change.value).catch((err) =>
        console.error(`[Webhook] Erro ao processar field=${change.field}:`, err)
      )
    }
  }
}

async function handleChange(field: string, value: Record<string, unknown>) {
  // ── campaign_status: sincroniza status da campanha no banco ──────────────────
  if (field === 'campaign_status') {
    const campaignId = value.campaign_id as string | undefined
    const status = value.status as string | undefined
    if (!campaignId || !status) return

    const statusMap: Record<string, string> = {
      ACTIVE: 'ACTIVE',
      PAUSED: 'PAUSED',
      DELETED: 'DELETED',
      ARCHIVED: 'ARCHIVED',
    }
    const mappedStatus = statusMap[status]
    if (mappedStatus) {
      await prisma.campaign.updateMany({
        where: { metaCampaignId: campaignId },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        data: { status: mappedStatus as any },
      })
      console.log(`[Webhook] campaign_status ${campaignId} → ${mappedStatus}`)
    }
    return
  }

  // ── creative_fatigue: cria FunnelAudit para campanha com fadiga confirmada ───
  // A Meta envia este evento quando um anúncio entra em nível de fadiga High/Medium.
  // Fadiga = mesmo público viu o anúncio muitas vezes, performance cai.
  if (field === 'creative_fatigue') {
    const campaignId = value.campaign_id as string | undefined
    const adAccountId = value.ad_account_id as string | undefined
    const fatigueLevel = (value.fatigue_level as string | undefined) ?? 'MEDIUM'
    if (!adAccountId) return

    // Só registra fadiga High — Medium é ruído
    if (fatigueLevel !== 'HIGH') return

    const adAccount = await prisma.adAccount.findUnique({
      where: { metaAccountId: adAccountId },
    })
    if (!adAccount) return

    const campaign = campaignId
      ? await prisma.campaign.findFirst({ where: { metaCampaignId: campaignId } })
      : null

    await prisma.funnelAudit.create({
      data: {
        adAccountId: adAccount.id,
        type: 'BROKEN_CTA',
        severity: 'HIGH',
        title: 'Fadiga de criativo detectada pela Meta',
        description: `A Meta sinalizou fadiga de criativo (nível: ${fatigueLevel}). O público já viu o anúncio muitas vezes e a performance está caindo. Troque ou renove os criativos.`,
        url: '',
      },
    })
    console.log(`[Webhook] creative_fatigue registrado — adAccount ${adAccountId}`)
    return
  }

  // ── with_issues_ad_objects: registra objetos com problema reportados pela Meta ─
  // A Meta envia quando uma campanha/ad set/ad muda para status WITH_ISSUES.
  if (field === 'with_issues_ad_objects') {
    const adAccountId = value.ad_account_id as string | undefined
    const issues = value.issues as Array<{ error_code?: number; error_message?: string }> | undefined
    if (!adAccountId || !issues?.length) return

    const adAccount = await prisma.adAccount.findUnique({
      where: { metaAccountId: adAccountId },
    })
    if (!adAccount) return

    const description = issues
      .map((i) => `[${i.error_code ?? '?'}] ${i.error_message ?? 'Problema desconhecido'}`)
      .join(' | ')

    await prisma.funnelAudit.create({
      data: {
        adAccountId: adAccount.id,
        type: 'CHECKOUT_ERROR',
        severity: 'HIGH',
        title: 'Objetos com problema reportados pela Meta',
        description: `Meta reportou objetos com problemas na conta: ${description}`,
        url: '',
      },
    })
    console.log(`[Webhook] with_issues_ad_objects registrado — adAccount ${adAccountId}`)
    return
  }

  // ── in_process_ad_objects: atualiza campanha para status IN_PROCESS ──────────
  if (field === 'in_process_ad_objects') {
    const campaignId = value.campaign_id as string | undefined
    if (!campaignId) return

    await prisma.campaign.updateMany({
      where: { metaCampaignId: campaignId },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { status: 'IN_PROCESS' as any },
    })
    console.log(`[Webhook] in_process_ad_objects ${campaignId}`)
  }
}
