import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { FacebookLoginButton } from '@/components/FacebookLoginButton'
import { DemoLoginButton } from '@/components/DemoLoginButton'
import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export const metadata = { title: 'Login — FunnelGuard AI' }

export default async function LoginPage() {
  const session = await getServerSession(authOptions)
  if (session) redirect('/dashboard')

  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.loginPage

  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-950 px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Logo */}
        <div className="text-center">
          <span className="text-2xl font-bold text-white">
            Funnel<span className="text-blue-500">Guard</span>{' '}
            <span className="text-blue-400">AI</span>
          </span>
          <p className="mt-2 text-sm text-gray-400">
            {t.tagline}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl border border-gray-800 bg-gray-900 p-8 shadow-xl">
          <h1 className="mb-1 text-xl font-semibold text-white">{t.cardTitle}</h1>
          <p className="mb-6 text-sm text-gray-400">
            {t.cardSubtitle}
          </p>

          <FacebookLoginButton />

          <div className="relative my-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-700" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-gray-900 px-2 text-gray-500">{t.or}</span>
            </div>
          </div>

          <DemoLoginButton />

          <p className="mt-4 text-center text-xs text-gray-500">
            {t.termsPrefix}
            <a href="#" className="underline hover:text-gray-300">
              {t.termsLinkLabel}
            </a>
            {t.termsSuffix}
          </p>
        </div>

        {/* Permissões solicitadas */}
        <div className="rounded-xl border border-gray-800 bg-gray-900/50 p-4">
          <p className="mb-3 text-xs font-medium uppercase tracking-wider text-gray-500">
            {t.permissionsTitle}
          </p>
          <ul className="space-y-2">
            {[
              { icon: '👤', label: t.permProfileEmail },
              { icon: '📊', label: t.permAdMetrics },
              { icon: '⚙️', label: t.permCampaignMgmt },
              { icon: '🏢', label: t.permBusinessManager },
            ].map(({ icon, label }) => (
              <li key={label} className="flex items-center gap-2 text-sm text-gray-300">
                <span>{icon}</span>
                <span>{label}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </main>
  )
}
