import Link from 'next/link'
import { Shield } from 'lucide-react'
import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export default async function LegalLayout({ children }: { children: React.ReactNode }) {
  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.legalLayout

  return (
    <div className="min-h-screen bg-dark-base text-gray-100">
      <header className="border-b border-gray-800 bg-dark-card/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-neon-cyan to-neon-purple flex items-center justify-center">
              <Shield className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-sm font-bold text-white">FunnelGuard AI</span>
          </Link>
          <nav className="flex items-center gap-4 text-xs text-gray-400">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">{t.navPrivacy}</Link>
            <Link href="/terms-of-service" className="hover:text-white transition-colors">{t.navTerms}</Link>
            <Link href="/data-deletion" className="hover:text-white transition-colors">{t.navDataDeletion}</Link>
          </nav>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        {children}
      </main>

      <footer className="border-t border-gray-800 py-6 text-center text-xs text-gray-600">
        © {new Date().getFullYear()} FunnelGuard AI. {t.cnpjLabel} {t.allRightsReserved}
      </footer>
    </div>
  )
}
