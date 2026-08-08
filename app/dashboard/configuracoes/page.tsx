import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ConfiguracoesClient from './ConfiguracoesClient'
import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export const metadata = { title: 'Configurações | FunnelGuard AI' }

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)

  let bmData: {
    name: string
    metaBmId: string
    tokenExpiresAt: string | null
    adAccounts: Array<{ id: string; metaAccountId: string; name: string; currency: string; status: number; pixelId: string | null; pixelName: string | null }>
  } | null = null

  let googleAdsConnected = false

  if (session?.user?.id) {
    const [bm, googleAds] = await Promise.all([
      prisma.businessManager.findFirst({
        where: { userId: session.user.id },
        include: { adAccounts: true },
      }),
      prisma.googleAdsConnection.findUnique({ where: { userId: session.user.id } }),
    ])

    if (bm) {
      bmData = {
        name: bm.name,
        metaBmId: bm.metaBmId,
        tokenExpiresAt: bm.tokenExpiresAt?.toISOString() ?? null,
        adAccounts: bm.adAccounts.map(a => ({
          id: a.id,
          metaAccountId: a.metaAccountId,
          name: a.name,
          currency: a.currency,
          status: a.status,
          pixelId: a.pixelId ?? null,
          pixelName: a.pixelName ?? null,
        })),
      }
    }

    googleAdsConnected = !!googleAds
  }

  const dict = getDictionary(await getServerLanguage())
  const d = dict.account.configuracoesPage

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">{d.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {d.subtitle}
        </p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`glass-card rounded-xl p-4 border ${bmData ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
          <p className="text-xs text-gray-500 mb-1">{d.metaAccount}</p>
          <p className={`text-sm font-bold ${bmData ? 'text-green-400' : 'text-yellow-400'}`}>
            {bmData ? d.connected : d.notConnected}
          </p>
          {bmData && <p className="text-xs text-gray-600 mt-0.5 truncate">{bmData.name}</p>}
        </div>
        <div className={`glass-card rounded-xl p-4 border ${bmData?.adAccounts.length ? 'bg-green-500/5 border-green-500/20' : 'border-gray-800'}`}>
          <p className="text-xs text-gray-500 mb-1">{d.adAccounts}</p>
          <p className={`text-sm font-bold ${bmData?.adAccounts.length ? 'text-green-400' : 'text-gray-400'}`}>
            {d.syncedCount.replace('{count}', String(bmData?.adAccounts.length ?? 0))}
          </p>
          {bmData && bmData.adAccounts.length > 0 && (
            <p className="text-xs text-gray-600 mt-0.5 truncate">{bmData.adAccounts[0].name}</p>
          )}
        </div>
        <div className="glass-card rounded-xl p-4 border bg-neon-cyan/5 border-neon-cyan/20">
          <p className="text-xs text-gray-500 mb-1">{d.funnelGuardAI}</p>
          <p className="text-sm font-bold text-neon-cyan">{d.active247}</p>
          <p className="text-xs text-gray-600 mt-0.5">{d.autoPilotAvailable}</p>
        </div>
      </div>

      <ConfiguracoesClient bm={bmData} googleAdsConnected={googleAdsConnected} />
    </div>
  )
}
