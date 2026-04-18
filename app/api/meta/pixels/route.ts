import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getAdAccountPixels } from '@/lib/meta-api'
import { NextResponse } from 'next/server'

/**
 * GET /api/meta/pixels?adAccountId=xxx
 * Busca os Pixels Meta vinculados à conta de anúncio do usuário.
 * Retorna id, name, lastFiredTime.
 */
export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const url = new URL(request.url)
  const adAccountId = url.searchParams.get('adAccountId')

  const bm = await prisma.businessManager.findFirst({
    where: { userId: session.user.id },
    include: {
      adAccounts: adAccountId
        ? { where: { id: adAccountId } }
        : { take: 1 },
    },
  })

  if (!bm || !bm.adAccounts.length) {
    return NextResponse.json({ error: 'Conta de anúncio não encontrada' }, { status: 404 })
  }

  const adAccount = bm.adAccounts[0]
  const accessToken = decrypt(bm.accessTokenEnc)
  const metaAccountId = adAccount.metaAccountId.startsWith('act_')
    ? adAccount.metaAccountId
    : `act_${adAccount.metaAccountId}`

  try {
    const pixels = await getAdAccountPixels(metaAccountId, accessToken)
    return NextResponse.json({ pixels, adAccountId: adAccount.id })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Erro ao buscar pixels: ${msg}` }, { status: 500 })
  }
}
