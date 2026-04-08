import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { exchangeForLongLivedToken } from '@/lib/meta-api'
import Sidebar from '@/components/dashboard/Sidebar'

export const metadata = {
  title: 'Dashboard | FunnelGuard AI',
  description: 'Gerencie suas campanhas, funil e concorrentes com IA',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  // Cria/atualiza BusinessManager após user estar confirmado no banco
  const fbToken = (session as Record<string, unknown>)?.fbAccessToken as string | undefined
  const fbAccountId = (session as Record<string, unknown>)?.fbProviderAccountId as string | undefined
  const fbName = ((session as Record<string, unknown>)?.fbName ?? session?.user?.name) as string | undefined

  if (fbToken && fbAccountId && session?.user?.id) {
    try {
      const { access_token: longLivedToken, expires_in } = await exchangeForLongLivedToken(fbToken)
      const encryptedToken = encrypt(longLivedToken)
      const tokenExpiresAt = new Date(Date.now() + expires_in * 1000)

      await prisma.businessManager.upsert({
        where: { metaBmId: fbAccountId },
        create: {
          userId: session.user.id,
          metaBmId: fbAccountId,
          name: fbName ?? 'Minha Conta',
          accessTokenEnc: encryptedToken,
          tokenExpiresAt,
        },
        update: {
          accessTokenEnc: encryptedToken,
          tokenExpiresAt,
        },
      })
    } catch (error) {
      console.error('[Dashboard] Falha ao sincronizar token Meta:', error)
    }
  }

  return (
    <div className="flex min-h-screen bg-dark-base">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-6">
          {children}
        </div>
      </main>
    </div>
  )
}
