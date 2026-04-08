import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import Image from 'next/image'

export const metadata = { title: 'Meu Perfil | FunnelGuard AI' }

export default async function PerfilPage() {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) redirect('/login')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      businessManagers: {
        include: { adAccounts: true },
      },
      subscription: true,
    },
  })

  if (!user) redirect('/login')

  const bm = user.businessManagers[0]
  const adAccounts = bm?.adAccounts ?? []
  const sub = user.subscription

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-white">Meu Perfil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Dados da sua conta conectada ao Facebook</p>
      </div>

      {/* Avatar + nome */}
      <div className="glass-card rounded-xl p-6 border border-gray-800 flex items-center gap-5">
        {user.image ? (
          <Image
            src={user.image}
            alt={user.name ?? 'Avatar'}
            width={72}
            height={72}
            className="rounded-full border-2 border-neon-cyan/30"
          />
        ) : (
          <div className="w-[72px] h-[72px] rounded-full bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center text-2xl font-bold text-white flex-shrink-0">
            {(user.name ?? 'U').charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <p className="text-lg font-semibold text-white">{user.name ?? '—'}</p>
          <p className="text-sm text-gray-400">{user.email ?? 'Email não disponível'}</p>
          <p className="text-xs text-gray-600 mt-1">
            Conta criada em {user.createdAt.toLocaleDateString('pt-BR')}
          </p>
        </div>
      </div>

      {/* Plano */}
      <div className="glass-card rounded-xl p-5 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">Assinatura</h2>
        {sub ? (
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-semibold capitalize">{sub.plan} Plan</p>
              <p className={`text-xs mt-1 ${sub.status === 'active' ? 'text-green-400' : 'text-red-400'}`}>
                {sub.status === 'active' ? 'Ativa' : 'Inativa'}
              </p>
            </div>
            {sub.currentPeriodEnd && (
              <p className="text-xs text-gray-500">
                Renova em {sub.currentPeriodEnd.toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma assinatura ativa.</p>
        )}
      </div>

      {/* Business Manager */}
      <div className="glass-card rounded-xl p-5 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Conta Meta conectada
        </h2>
        {bm ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">Business Manager</p>
              <p className="text-sm text-white font-medium">{bm.name}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">ID</p>
              <p className="text-xs font-mono text-gray-400">{bm.metaBmId}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-300">Token expira em</p>
              <p className="text-xs text-gray-400">
                {bm.tokenExpiresAt
                  ? bm.tokenExpiresAt.toLocaleDateString('pt-BR')
                  : '—'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma conta Meta conectada.</p>
        )}
      </div>

      {/* Ad Accounts */}
      <div className="glass-card rounded-xl p-5 border border-gray-800">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
          Contas de Anúncio ({adAccounts.length})
        </h2>
        {adAccounts.length > 0 ? (
          <div className="space-y-2">
            {adAccounts.map((acc) => (
              <div key={acc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-gray-800">
                <p className="text-sm text-white">{acc.name}</p>
                <p className="text-xs font-mono text-gray-500">{acc.metaAccountId}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Nenhuma conta de anúncio sincronizada ainda.
          </p>
        )}
      </div>
    </div>
  )
}
