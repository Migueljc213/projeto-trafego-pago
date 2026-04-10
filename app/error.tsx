'use client'

import { useEffect } from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

interface Props {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      console.error('[Global Error Boundary]', error)
    }
  }, [error])

  return (
    <html lang="pt-BR" className="dark">
      <body className="bg-gray-950 text-gray-100 antialiased min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-sm text-center space-y-5">
          <div className="w-14 h-14 rounded-2xl mx-auto flex items-center justify-center bg-red-500/10 border border-red-500/25">
            <AlertTriangle className="w-7 h-7 text-red-400" />
          </div>

          <div>
            <h1 className="text-lg font-bold text-white mb-2">Erro crítico da aplicação</h1>
            <p className="text-sm text-gray-400">
              Um erro inesperado impediu o carregamento. Tente recarregar a página.
            </p>
          </div>

          {process.env.NODE_ENV !== 'production' && error.message && (
            <div className="p-3 rounded-lg bg-red-500/5 border border-red-500/20 text-left">
              <p className="text-xs font-mono text-red-400 break-all">{error.message}</p>
            </div>
          )}

          <div className="flex gap-3 justify-center">
            <button
              onClick={reset}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/15 text-sm font-medium text-white hover:bg-white/15 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Recarregar
            </button>
            <a
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-sm font-medium text-gray-400 hover:text-white hover:border-gray-500 transition-all"
            >
              <Home className="w-3.5 h-3.5" />
              Início
            </a>
          </div>
        </div>
      </body>
    </html>
  )
}
