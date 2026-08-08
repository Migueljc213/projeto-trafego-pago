import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decrypt } from '@/lib/encryption'
import { getMyPages } from '@/lib/meta-api'
import CampaignWizard from './CampaignWizard'
import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export const metadata = { title: 'Nova Campanha | FunnelGuard AI' }

export default async function CriarCampanhaPage() {
  const dict = getDictionary(await getServerLanguage())
  const session = await getServerSession(authOptions)

  // Busca páginas disponíveis para o criativo
  let pages: Array<{ id: string; name: string; fanCount?: number; engagementCount?: number }> = []
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
        const fetched = await getMyPages(token, bm.metaBmId)
        pages = fetched.map(p => ({
          id: p.id,
          name: p.name,
          fanCount: p.fan_count,
          engagementCount: p.engagement?.count,
        }))
      } catch {
        // Silencia — wizard avisa sobre a falta de páginas
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{dict.campaigns.campaignWizard.page.titulo}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {dict.campaigns.campaignWizard.page.subtitulo}
        </p>
      </div>

      {!hasMeta && (
        <div className="p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5 text-sm text-yellow-300">
          {dict.campaigns.campaignWizard.page.metaWarningPart1}{' '}
          <a href="/dashboard/configuracoes" className="underline">{dict.campaigns.campaignWizard.page.metaWarningLink}</a>{' '}
          {dict.campaigns.campaignWizard.page.metaWarningPart2}
        </div>
      )}

      <CampaignWizard pages={pages} />
    </div>
  )
}
