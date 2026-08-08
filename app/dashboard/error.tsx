'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Wifi, WifiOff } from 'lucide-react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function DashboardError({ error, reset }: Props) {
  const { dict } = useLanguage()
  const t = dict.dashboardHome.errorPage

  useEffect(() => {
    // Loga o erro para auditoria (sem expor no console de produção)
    if (process.env.NODE_ENV === 'production') {
      // Aqui poderia enviar para um serviço de monitoramento (Sentry, etc.)
    } else {
      console.error('[Dashboard Error Boundary]', error)
    }
  }, [error])

  const isMetaError =
    error.message?.includes('Meta') ||
    error.message?.includes('Facebook') ||
    error.message?.includes('graph.facebook') ||
    error.message?.includes('OAuthException') ||
    error.digest?.includes('meta')

  const isNetworkError =
    error.message?.includes('fetch') ||
    error.message?.includes('network') ||
    error.message?.includes('ECONNREFUSED') ||
    error.message?.includes('timeout')

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="w-full max-w-md text-center space-y-6">
        {/* Ícone dinâmico */}
        <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center bg-orange-500/10 border border-orange-500/25">
          {isNetworkError ? (
            <WifiOff className="w-8 h-8 text-orange-400" />
          ) : isMetaError ? (
            <Wifi className="w-8 h-8 text-orange-400" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-orange-400" />
          )}
        </div>

        {/* Mensagem principal */}
        <div>
          <h2 className="text-lg font-bold text-white mb-2">
            {isMetaError
              ? t.titleMeta
              : isNetworkError
              ? t.titleNetwork
              : t.titleGeneric}
          </h2>
          <p className="text-sm text-gray-400 leading-relaxed">
            {isMetaError
              ? t.descMeta
              : isNetworkError
              ? t.descNetwork
              : t.descGeneric}
          </p>
        </div>

        {/* Detalhes técnicos (apenas dev) */}
        {process.env.NODE_ENV !== 'production' && error.message && (
          <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-left">
            <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
            {error.digest && (
              <p className="text-xs font-mono text-gray-600 mt-1">{t.digestPrefix} {error.digest}</p>
            )}
          </div>
        )}

        {/* Ações */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-semibold hover:bg-neon-cyan/20 transition-all"
          >
            <RefreshCw className="w-4 h-4" />
            {t.retryButton}
          </button>
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-gray-700 text-gray-400 text-sm font-medium hover:text-white hover:border-gray-500 transition-all"
          >
            {t.goHome}
          </a>
        </div>

        {isMetaError && (
          <div className="p-3 rounded-xl border border-yellow-500/20 bg-yellow-500/5">
            <p className="text-xs text-yellow-300 font-medium mb-1">{t.reconnectTitle}</p>
            <a
              href="/dashboard/configuracoes?reconnect=meta"
              className="text-xs text-yellow-400 hover:text-yellow-300 underline transition-colors"
            >
              {t.reconnectLink}
            </a>
          </div>
        )}
      </div>
    </div>
  )
}
