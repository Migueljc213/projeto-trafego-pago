import { NextResponse } from 'next/server'
import { sendAutoPilotAlert } from '@/lib/email'

export async function GET() {
  try {
    await sendAutoPilotAlert({
      to: 'delivered@resend.dev',
      userName: 'Miguel',
      campaignName: 'Campanha Teste Black Friday',
      action: 'PAUSE',
      reason: 'ROAS abaixo de 1.5x por 3 dias consecutivos',
      roas: 1.2,
      spend: 350.0,
    })

    return NextResponse.json({ ok: true, message: 'Email enviado! Veja em resend.com/emails' })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ ok: false, error: String(error) }, { status: 500 })
  }
}
