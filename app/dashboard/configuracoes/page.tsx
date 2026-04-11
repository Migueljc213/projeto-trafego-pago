import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import ConfiguracoesClient from './ConfiguracoesClient'

export const metadata = { title: 'Configurações | FunnelGuard AI' }

export default async function ConfiguracoesPage() {
  const session = await getServerSession(authOptions)

  let bmData: {
    name: string
    tokenExpiresAt: string | null
    adAccounts: Array<{ metaAccountId: string; name: string; currency: string; status: number }>
  } | null = null

  if (session?.user?.id) {
    const bm = await prisma.businessManager.findFirst({
      where: { userId: session.user.id },
      include: { adAccounts: true },
    })

    if (bm) {
      bmData = {
        name: bm.name,
        tokenExpiresAt: bm.tokenExpiresAt?.toISOString() ?? null,
        adAccounts: bm.adAccounts.map(a => ({
          metaAccountId: a.metaAccountId,
          name: a.name,
          currency: a.currency,
          status: a.status,
        })),
      }
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Configurações</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gerencie sua conta Meta, token de acesso e parâmetros da IA
        </p>
      </div>

      {/* Status summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`glass-card rounded-xl p-4 border ${bmData ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20'}`}>
          <p className="text-xs text-gray-500 mb-1">Conta Meta</p>
          <p className={`text-sm font-bold ${bmData ? 'text-green-400' : 'text-yellow-400'}`}>
            {bmData ? 'Conectada' : 'Não conectada'}
          </p>
          {bmData && <p className="text-xs text-gray-600 mt-0.5 truncate">{bmData.name}</p>}
        </div>
        <div className={`glass-card rounded-xl p-4 border ${bmData?.adAccounts.length ? 'bg-green-500/5 border-green-500/20' : 'border-gray-800'}`}>
          <p className="text-xs text-gray-500 mb-1">Contas de Anúncio</p>
          <p className={`text-sm font-bold ${bmData?.adAccounts.length ? 'text-green-400' : 'text-gray-400'}`}>
            {bmData?.adAccounts.length ?? 0} sincronizada(s)
          </p>
          {bmData && bmData.adAccounts.length > 0 && (
            <p className="text-xs text-gray-600 mt-0.5 truncate">{bmData.adAccounts[0].name}</p>
          )}
        </div>
        <div className="glass-card rounded-xl p-4 border bg-neon-cyan/5 border-neon-cyan/20">
          <p className="text-xs text-gray-500 mb-1">FunnelGuard AI</p>
          <p className="text-sm font-bold text-neon-cyan">Ativo 24/7</p>
          <p className="text-xs text-gray-600 mt-0.5">Auto-Pilot disponível</p>
        </div>
      </div>

      <ConfiguracoesClient bm={bmData} />
    </div>
  )
}
