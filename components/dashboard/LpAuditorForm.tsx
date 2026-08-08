'use client'

import { useState, useTransition } from 'react'
import { Search, CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { runLpAuditAction } from '@/actions/price-intelligence'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface AuditIssue {
  type: string
  severity: string
  title: string
  description: string
  estimatedImpact: string
}

interface AuditResult {
  hasPixel: boolean
  lcpSeconds: number | null
  hasCta: boolean
  issues: AuditIssue[]
  rootCauseInsight: string | null
  savedIssues: number
}

export default function LpAuditorForm({ adAccountId }: { adAccountId: string }) {
  const { dict } = useLanguage()
  const [url, setUrl] = useState('')
  const [ctr, setCtr] = useState('')
  const [result, setResult] = useState<AuditResult | null>(null)
  const [error, setError] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setResult(null)

    if (!adAccountId) {
      setError(dict.audit.lpAuditorForm.noAdAccount)
      return
    }

    startTransition(async () => {
      const res = await runLpAuditAction(adAccountId, url, ctr ? parseFloat(ctr) : undefined)
      if (res.success && res.data) {
        setResult(res.data as unknown as AuditResult)
      } else {
        setError(res.error ?? dict.audit.lpAuditorForm.genericError)
      }
    })
  }

  const severityColor: Record<string, string> = {
    CRITICAL: 'text-red-400 bg-red-500/10 border-red-500/20',
    HIGH: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
    MEDIUM: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
    LOW: 'text-gray-400 bg-gray-500/10 border-gray-700',
  }

  return (
    <div className="glass-card rounded-xl p-5 border border-gray-800">
      <h3 className="text-sm font-semibold text-white mb-1">{dict.audit.lpAuditorForm.title}</h3>
      <p className="text-xs text-gray-500 mb-4">
        {dict.audit.lpAuditorForm.description}
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="url"
          required
          placeholder={dict.audit.lpAuditorForm.urlPlaceholder}
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/50"
        />
        <div className="flex gap-2">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder={dict.audit.lpAuditorForm.ctrPlaceholder}
            value={ctr}
            onChange={e => setCtr(e.target.value)}
            className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-neon-cyan/50"
          />
          <button
            type="submit"
            disabled={isPending || !url}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-neon-cyan text-gray-950 font-semibold text-sm hover:bg-neon-cyan/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            {isPending ? dict.audit.lpAuditorForm.analyzing : dict.audit.lpAuditorForm.auditButton}
          </button>
        </div>
      </form>

      {error && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-5 space-y-4">
          {/* Status rápido */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-3 rounded-lg border text-center ${result.hasPixel ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              {result.hasPixel ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" /> : <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />}
              <p className="text-xs font-medium text-gray-300">{dict.audit.lpAuditorForm.metaPixel}</p>
              <p className={`text-xs ${result.hasPixel ? 'text-green-400' : 'text-red-400'}`}>{result.hasPixel ? dict.audit.lpAuditorForm.detected : dict.audit.lpAuditorForm.absent}</p>
            </div>
            <div className={`p-3 rounded-lg border text-center ${result.lcpSeconds !== null && result.lcpSeconds <= 2.5 ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20'}`}>
              {result.lcpSeconds !== null && result.lcpSeconds <= 2.5
                ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
                : <AlertTriangle className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              }
              <p className="text-xs font-medium text-gray-300">{dict.audit.lpAuditorForm.speed}</p>
              <p className={`text-xs ${result.lcpSeconds !== null && result.lcpSeconds <= 2.5 ? 'text-green-400' : 'text-orange-400'}`}>
                {result.lcpSeconds !== null ? `${result.lcpSeconds.toFixed(1)}s LCP` : dict.audit.lpAuditorForm.notAvailable}
              </p>
            </div>
            <div className={`p-3 rounded-lg border text-center ${result.hasCta ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
              {result.hasCta ? <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" /> : <XCircle className="w-5 h-5 text-red-400 mx-auto mb-1" />}
              <p className="text-xs font-medium text-gray-300">{dict.audit.lpAuditorForm.cta}</p>
              <p className={`text-xs ${result.hasCta ? 'text-green-400' : 'text-red-400'}`}>{result.hasCta ? dict.audit.lpAuditorForm.visible : dict.audit.lpAuditorForm.hidden}</p>
            </div>
          </div>

          {/* Insight raiz */}
          {result.rootCauseInsight && (
            <div className="p-3 rounded-lg bg-neon-cyan/5 border border-neon-cyan/20">
              <p className="text-xs text-neon-cyan font-medium mb-1">{dict.audit.lpAuditorForm.aiAnalysis}</p>
              <p className="text-xs text-gray-300">{result.rootCauseInsight}</p>
            </div>
          )}

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-gray-400">{dict.audit.lpAuditorForm.issuesFound(result.issues.length)}</p>
              {result.issues.map((issue, i) => (
                <div key={i} className={`p-3 rounded-lg border ${severityColor[issue.severity] ?? severityColor.LOW}`}>
                  <p className="text-xs font-semibold">{issue.title}</p>
                  <p className="text-xs opacity-80 mt-0.5">{issue.description}</p>
                  <p className="text-xs opacity-60 mt-1 font-mono">{issue.estimatedImpact}</p>
                </div>
              ))}
            </div>
          )}

          {result.issues.length === 0 && (
            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-center">
              <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-sm font-medium text-green-400">{dict.audit.lpAuditorForm.noIssuesFound}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
