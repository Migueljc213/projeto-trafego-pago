import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { sendAutoPilotAlert } from '@/lib/email'

export async function GET() {
  const session = await getServerSession(authOptions)
  const adminEmail = process.env.ADMIN_EMAIL
  if (!session?.user?.email || !adminEmail || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

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
