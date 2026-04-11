import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'

/**
 * GET /api/meta/interests?q=empreendedorismo
 *
 * Busca interesses de targeting na Meta API (targeting search).
 * Requer que o usuário tenha uma conta Meta conectada.
 */
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const q = req.nextUrl.searchParams.get('q')?.trim()
  if (!q || q.length < 2) {
    return NextResponse.json({ data: [] })
  }

  const bm = await prisma.businessManager.findFirst({
    where: { userId: session.user.id },
    include: { adAccounts: { take: 1 } },
  })

  if (!bm) {
    return NextResponse.json({ error: 'Nenhuma conta Meta conectada' }, { status: 400 })
  }

  const adAccount = bm.adAccounts[0]
  if (!adAccount) {
    return NextResponse.json({ error: 'Nenhuma conta de anúncio encontrada' }, { status: 400 })
  }

  try {
    const token = decrypt(bm.accessTokenEnc)
    const actId = adAccount.metaAccountId.startsWith('act_')
      ? adAccount.metaAccountId
      : `act_${adAccount.metaAccountId}`

    const params = new URLSearchParams({
      q,
      type: 'adinterest',
      limit: '10',
      access_token: token,
    })

    const res = await fetch(
      `https://graph.facebook.com/v21.0/search?${params.toString()}`,
      { signal: AbortSignal.timeout(8_000) }
    )

    const data = await res.json() as {
      data?: Array<{ id: string; name: string; audience_size_lower_bound?: number; path?: string[] }>
      error?: { message: string }
    }

    if (data.error) {
      return NextResponse.json({ error: data.error.message }, { status: 400 })
    }

    const interests = (data.data ?? []).map(item => ({
      id: item.id,
      name: item.name,
      path: item.path?.join(' > ') ?? '',
      audienceSize: item.audience_size_lower_bound ?? null,
    }))

    return NextResponse.json({ data: interests })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao buscar interesses: ${msg}` }, { status: 500 })
  }
}
