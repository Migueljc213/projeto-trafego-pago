import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Shield, Users } from 'lucide-react'
import Link from 'next/link'
import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export const metadata = { title: 'Admin | FunnelGuard AI' }

// Segunda camada de proteção server-side (middleware é a primeira)
async function assertAdmin() {
  const session = await getServerSession(authOptions)
  const adminEmail = process.env.ADMIN_EMAIL
  if (!session?.user?.email || session.user.email !== adminEmail) {
    redirect('/dashboard')
  }
  return session
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await assertAdmin()
  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.adminLayout

  return (
    <div className="min-h-screen bg-dark-base text-gray-100">
      {/* Top bar */}
      <header className="sticky top-0 z-40 border-b border-gray-800 bg-dark-card/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-red-400" />
            </div>
            <span className="text-sm font-bold text-white">FunnelGuard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-400 font-semibold">
              {t.badge}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {t.navAccounts}
            </Link>
            <Link
              href="/admin/waitlist"
              className="text-xs text-gray-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <Users className="w-3 h-3" />
              {t.navWaitlist}
            </Link>
            <span className="text-xs text-gray-500">{session.user.email}</span>
            <Link
              href="/dashboard"
              className="text-xs text-gray-400 hover:text-white transition-colors"
            >
              {t.navDashboard}
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  )
}
