import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { exchangeForLongLivedToken } from '@/lib/meta-api'
import Sidebar from '@/components/dashboard/Sidebar'
import OnboardingProgressBar from '@/components/dashboard/OnboardingProgressBar'
import OnboardingWizard from '@/components/dashboard/OnboardingWizard'
import { getOnboardingStatusAction } from '@/actions/onboarding'

export const metadata = {
  title: 'Dashboard | FunnelGuard AI',
  description: 'Gerencie suas campanhas, funil e concorrentes com IA',
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const onboardingStatus = await getOnboardingStatusAction()

  // Cria/atualiza BusinessManager após user estar confirmado no banco
  const s = session as unknown as Record<string, unknown> | null
  const fbToken = s?.fbAccessToken as string | undefined
  const fbAccountId = s?.fbProviderAccountId as string | undefined
  const fbName = (s?.fbName ?? session?.user?.name) as string | undefined

  if (fbToken && fbAccountId && session?.user?.id) {
    try {
      // Tenta trocar por token de longa duração (60 dias)
      // Se falhar (app dev mode, credenciais inválidas), usa o token curto como fallback
      let tokenToSave = fbToken
      let tokenExpiresAt: Date | null = null

      try {
        const { access_token: longLivedToken, expires_in } = await exchangeForLongLivedToken(fbToken)
        tokenToSave = longLivedToken
        tokenExpiresAt = new Date(Date.now() + expires_in * 1000)
      } catch (exchangeError) {
        console.warn('[Dashboard] Token de longa duração indisponível, usando token curto:', exchangeError)
      }

      const encryptedToken = encrypt(tokenToSave)

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

  // Busca ad accounts para o Onboarding Wizard
  let adAccountsForWizard: Array<{ id: string; name: string; currency: string }> = []
  if (!onboardingStatus.hasCompletedOnboarding && session?.user?.id) {
    try {
      const bm = await prisma.businessManager.findFirst({
        where: { userId: session.user.id },
        include: { adAccounts: { select: { id: true, name: true, currency: true } } },
      })
      adAccountsForWizard = bm?.adAccounts ?? []
    } catch {
      // silencia — wizard ainda funciona sem contas listadas
    }
  }

  const showWizard = !onboardingStatus.hasCompletedOnboarding

  return (
    <div className="flex min-h-screen bg-dark-base">
      <Sidebar />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        <div className="p-4 sm:p-6 lg:p-8 pt-14 lg:pt-6">
          {/* Barra de progresso compacta (aparece em todas as páginas enquanto setup incompleto) */}
          <OnboardingProgressBar
            step={onboardingStatus.step}
            hasCompletedOnboarding={onboardingStatus.hasCompletedOnboarding}
          />
          {/* Wizard interativo (aparece apenas na página inicial) */}
          {showWizard && onboardingStatus.step > 0 && (
            <OnboardingWizard
              status={onboardingStatus}
              adAccounts={adAccountsForWizard}
            />
          )}
          {children}
        </div>
      </main>
    </div>
  )
}
