import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getMyPages } from '@/lib/meta-api'
import CampaignWizard from './CampaignWizard'

export const metadata = { title: 'Nova Campanha | FunnelGuard AI' }

export default async function CriarCampanhaPage() {
  const session = await getServerSession(authOptions)

  // Busca páginas disponíveis para o criativo
  let pages: Array<{ id: string; name: string }> = []
  let hasMeta = false

  if (session?.user?.id) {
    const bm = await prisma.businessManager.findFirst({
      where: { userId: session.user.id },
      include: { adAccounts: { take: 1 } },
    })

    hasMeta = !!bm

    if (bm?.accessTokenEnc) {
      try {
        const token = decrypt(bm.accessTokenEnc)
        const fetched = await getMyPages(token)
        pages = fetched.map(p => ({ id: p.id, name: p.name }))
      } catch {
        // Silencia — wizard avisa sobre a falta de páginas
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Nova Campanha</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Crie uma campanha completa na Meta Ads em 4 passos
        </p>
      </div>

      {!hasMeta && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-300">
          Sua conta Meta não está conectada. Vá em{' '}
          <a href="/dashboard/configuracoes" className="underline">Configurações</a>{' '}
          e conecte sua conta antes de criar campanhas.
        </div>
      )}

      <CampaignWizard pages={pages} />
    </div>
  )
}
