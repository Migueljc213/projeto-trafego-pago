import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL('/login', process.env.NEXTAUTH_URL!))
  }

  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')

  const redirectBase = `${process.env.NEXTAUTH_URL}/dashboard/configuracoes`

  if (error || !code) {
    return NextResponse.redirect(`${redirectBase}?error=google-ads-denied`)
  }

  // Valida CSRF state
  const cookieStore = cookies()
  const savedState = cookieStore.get('google_ads_state')?.value
  if (!savedState || savedState !== state) {
    return NextResponse.redirect(`${redirectBase}?error=google-ads-invalid-state`)
  }

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_ADS_CLIENT_ID!,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET!,
      redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/google-ads`,
      grant_type: 'authorization_code',
    }),
  })

  const tokens = await tokenRes.json() as {
    access_token?: string
    refresh_token?: string
    expires_in?: number
    error?: string
  }

  if (!tokens.refresh_token) {
    return NextResponse.redirect(`${redirectBase}?error=google-ads-no-refresh-token`)
  }

  await prisma.googleAdsConnection.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      encryptedRefreshToken: encrypt(tokens.refresh_token),
    },
    update: {
      encryptedRefreshToken: encrypt(tokens.refresh_token),
      connectedAt: new Date(),
    },
  })

  const response = NextResponse.redirect(`${redirectBase}?success=google-ads-connected`)
  response.cookies.delete('google_ads_state')
  return response
}
