/**
 * Meta Conversions API (CAPI) — Server-Side Event Handler
 *
 * Recebe eventos de conversão do frontend ou de sistemas externos e os
 * encaminha diretamente para a Meta Graph API via server-side, contornando
 * bloqueadores de anúncios que impediriam o Pixel de disparar no browser.
 *
 * Endpoint: POST /api/capi/event
 *
 * Corpo esperado:
 * {
 *   event_name: "Purchase" | "Lead" | "PageView" | "InitiateCheckout" | "AddToCart",
 *   event_source_url: "https://...",
 *   value?: number,
 *   currency?: "BRL",
 *   order_id?: string,
 *   user_data: {
 *     email?: string      // será hash-ificado SHA-256
 *     phone?: string      // será hash-ificado SHA-256
 *     ip?: string
 *     user_agent?: string
 *     fbc?: string        // fbclid cookie
 *     fbp?: string        // _fbp cookie
 *   }
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import crypto from 'crypto'

export const runtime = 'nodejs'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function sha256(value: string): string {
  return crypto.createHash('sha256').update(value.trim().toLowerCase()).digest('hex')
}

function hashIfPresent(value: string | undefined): string | undefined {
  return value ? sha256(value) : undefined
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

type MetaEventName =
  | 'Purchase'
  | 'Lead'
  | 'PageView'
  | 'InitiateCheckout'
  | 'AddToCart'
  | 'ViewContent'
  | 'CompleteRegistration'
  | 'Contact'
  | 'CustomizeProduct'
  | 'Donate'
  | 'FindLocation'
  | 'Schedule'
  | 'Search'
  | 'StartTrial'
  | 'SubmitApplication'
  | 'Subscribe'

interface CAPIRequestBody {
  event_name: MetaEventName
  event_source_url?: string
  value?: number
  currency?: string
  order_id?: string
  content_ids?: string[]
  content_category?: string
  content_name?: string
  num_items?: number
  user_data?: {
    email?: string
    phone?: string
    ip?: string
    user_agent?: string
    fbc?: string
    fbp?: string
    client_ip_address?: string
    client_user_agent?: string
  }
  test_event_code?: string // Para testar no Event Manager da Meta
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as CAPIRequestBody

    if (!body.event_name) {
      return NextResponse.json({ error: 'event_name é obrigatório' }, { status: 400 })
    }

    // Determina o access token a usar:
    // 1. Token do usuário autenticado (sessão)
    // 2. Fallback: META_SYSTEM_USER_TOKEN do env (para uso externo)
    let accessToken: string | null = null
    let pixelId: string | null = process.env.META_PIXEL_ID ?? null

    const session = await getServerSession(authOptions)
    if (session?.user?.id) {
      const bm = await prisma.businessManager.findFirst({
        where: { userId: session.user.id },
        select: { accessTokenEnc: true },
      })
      if (bm?.accessTokenEnc) {
        try {
          accessToken = decrypt(bm.accessTokenEnc)
        } catch {
          // Token corrompido — fallback para system token
        }
      }

      // Busca pixel ID configurado na primeira AdAccount
      if (!pixelId) {
        const adAccount = await prisma.adAccount.findFirst({
          where: { businessManager: { userId: session.user.id } },
          select: { metaAccountId: true },
        })
        // Usa o ID de conta como proxy se não tiver pixel separado configurado
        pixelId = adAccount?.metaAccountId ?? null
      }
    }

    // Fallback para system user token (server-to-server sem sessão)
    if (!accessToken) {
      accessToken = process.env.META_SYSTEM_USER_TOKEN ?? null
    }

    if (!accessToken || !pixelId) {
      return NextResponse.json(
        { error: 'Sem token de acesso ou Pixel ID configurado. Configure META_PIXEL_ID e META_SYSTEM_USER_TOKEN no ambiente.' },
        { status: 503 }
      )
    }

    // Constrói o payload de evento para a Meta CAPI
    const eventTime = Math.floor(Date.now() / 1000)
    const clientIp = body.user_data?.ip
      ?? body.user_data?.client_ip_address
      ?? req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? undefined
    const clientUserAgent = body.user_data?.user_agent
      ?? body.user_data?.client_user_agent
      ?? req.headers.get('user-agent')
      ?? undefined

    const userData: Record<string, string | undefined> = {
      em: hashIfPresent(body.user_data?.email),
      ph: hashIfPresent(body.user_data?.phone),
      client_ip_address: clientIp,
      client_user_agent: clientUserAgent,
      fbc: body.user_data?.fbc,
      fbp: body.user_data?.fbp,
    }

    // Remove campos undefined
    const cleanUserData = Object.fromEntries(
      Object.entries(userData).filter(([, v]) => v !== undefined)
    )

    const customData: Record<string, unknown> = {}
    if (body.value !== undefined) customData.value = body.value
    if (body.currency) customData.currency = body.currency.toUpperCase()
    if (body.order_id) customData.order_id = body.order_id
    if (body.content_ids?.length) customData.content_ids = body.content_ids
    if (body.content_category) customData.content_category = body.content_category
    if (body.content_name) customData.content_name = body.content_name
    if (body.num_items !== undefined) customData.num_items = body.num_items

    const eventPayload: Record<string, unknown> = {
      event_name: body.event_name,
      event_time: eventTime,
      action_source: 'website',
      event_source_url: body.event_source_url,
      user_data: cleanUserData,
    }

    if (Object.keys(customData).length > 0) {
      eventPayload.custom_data = customData
    }

    const capiBody: Record<string, unknown> = {
      data: [eventPayload],
    }

    if (body.test_event_code) {
      capiBody.test_event_code = body.test_event_code
    }

    // Envia para a Meta CAPI
    const metaRes = await fetch(
      `https://graph.facebook.com/v19.0/${encodeURIComponent(pixelId)}/events?access_token=${accessToken}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(capiBody),
        signal: AbortSignal.timeout(10_000),
      }
    )

    const metaData = await metaRes.json() as Record<string, unknown>

    if (!metaRes.ok) {
      console.error('[CAPI] Erro da Meta:', metaData)
      return NextResponse.json(
        { error: 'Erro ao enviar evento para a Meta', meta_error: metaData },
        { status: metaRes.status }
      )
    }

    return NextResponse.json({
      ok: true,
      event_name: body.event_name,
      events_received: (metaData as { events_received?: number }).events_received ?? 1,
      fbtrace_id: (metaData as { fbtrace_id?: string }).fbtrace_id,
    })
  } catch (err) {
    console.error('[CAPI] Erro interno:', err)
    return NextResponse.json(
      { error: 'Erro interno ao processar evento CAPI' },
      { status: 500 }
    )
  }
}

// ─── GET: Health check do endpoint CAPI ──────────────────────────────────────

export async function GET() {
  const hasPixel = !!process.env.META_PIXEL_ID
  const hasSystemToken = !!process.env.META_SYSTEM_USER_TOKEN

  return NextResponse.json({
    status: 'ok',
    capi_ready: hasPixel && hasSystemToken,
    meta_pixel_configured: hasPixel,
    system_token_configured: hasSystemToken,
    api_version: 'v19.0',
    supported_events: [
      'Purchase', 'Lead', 'PageView', 'InitiateCheckout',
      'AddToCart', 'ViewContent', 'CompleteRegistration',
    ],
  })
}
