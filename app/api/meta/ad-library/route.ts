import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getAdLibraryAds, MetaApiError } from '@/lib/meta-api'
import { decrypt } from '@/lib/encryption'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const searchTerms = searchParams.get('q')?.trim()
  const pageIds = searchParams.get('pageIds')?.split(',').filter(Boolean)

  if (!searchTerms && (!pageIds || pageIds.length === 0)) {
    return NextResponse.json({ error: 'Forneça um termo de busca ou Page IDs' }, { status: 400 })
  }

  const bm = await prisma.businessManager.findFirst({
    where: { userId: session.user.id },
    select: { accessTokenEnc: true },
  })

  if (!bm?.accessTokenEnc) {
    return NextResponse.json({ error: 'Conta Meta não conectada' }, { status: 400 })
  }

  const accessToken = decrypt(bm.accessTokenEnc)

  try {
    const ads = await getAdLibraryAds({
      accessToken,
      searchTerms: searchTerms || undefined,
      searchPageIds: pageIds,
      countries: ['BR'],
      limit: 24,
    })
    return NextResponse.json({ ads })
  } catch (err) {
    if (err instanceof MetaApiError) {
      return NextResponse.json({ error: err.message }, { status: 400 })
    }
    return NextResponse.json({ error: 'Erro ao buscar anúncios' }, { status: 500 })
  }
}
