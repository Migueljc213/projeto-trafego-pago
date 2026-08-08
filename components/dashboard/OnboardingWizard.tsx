'use client'

import { useState, useTransition } from 'react'
import { Facebook, Target, Globe, CheckCircle2, Plus, Trash2, X, Loader2 } from 'lucide-react'
import {
  advanceToStep2Action,
  completeStep2Action,
  completeStep3Action,
  skipOnboardingAction,
} from '@/actions/onboarding'
import type { OnboardingStatus } from '@/actions/onboarding'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Props {
  status: OnboardingStatus
  adAccounts: Array<{ id: string; name: string; currency: string }>
}

export default function OnboardingWizard({ status, adAccounts }: Props) {
  const { dict } = useLanguage()
  const t = dict.dashboardHome.onboardingWizard
  const [currentStep, setCurrentStep] = useState(Math.max(status.step, 1))
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Step 2 state
  const [selectedAccountId, setSelectedAccountId] = useState(adAccounts[0]?.id ?? '')
  const [targetRoas, setTargetRoas] = useState(status.targetRoas ?? 3.0)

  // Step 3 state
  const [competitors, setCompetitors] = useState([{ name: '', url: '' }])

  function addCompetitor() {
    setCompetitors((prev) => [...prev, { name: '', url: '' }])
  }

  function removeCompetitor(idx: number) {
    setCompetitors((prev) => prev.filter((_, i) => i !== idx))
  }

  function updateCompetitor(idx: number, field: 'name' | 'url', value: string) {
    setCompetitors((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    )
  }

  function handleStep1Done() {
    if (!status.hasFacebookConnected) {
      window.location.href = '/api/auth/signin/facebook'
      return
    }
    startTransition(async () => {
      await advanceToStep2Action()
      setCurrentStep(2)
    })
  }

  function handleStep2Done() {
    setError(null)
    if (!selectedAccountId) {
      setError(t.step2.selectAccountError)
      return
    }
    startTransition(async () => {
      const result = await completeStep2Action({
        adAccountId: selectedAccountId,
        targetRoas,
      })
      if (result.success) {
        setCurrentStep(3)
      } else {
        setError(result.error ?? t.step2.unknownError)
      }
    })
  }

  function handleStep3Done() {
    setError(null)
    const validCompetitors = competitors.filter((c) => c.name.trim() && c.url.trim())
    if (validCompetitors.length === 0) {
      setError(t.step3.addAtLeastOneError)
      return
    }

    const primaryAccountId = selectedAccountId || adAccounts[0]?.id
    if (!primaryAccountId) {
      setError(t.step3.noAccountError)
      return
    }

    startTransition(async () => {
      const result = await completeStep3Action({
        competitorUrls: validCompetitors,
        adAccountId: primaryAccountId,
      })
      if (!result.success) {
        setError(result.error ?? t.step3.unknownError)
      }
    })
  }

  return (
    <div className="glass-card border border-neon-cyan/30 rounded-xl p-6 mb-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-base font-bold text-white">{t.headerTitle}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {t.stepPrefix(currentStep)} {t.stepNames[currentStep - 1]}
          </p>
        </div>
        <button
          onClick={() => startTransition(() => skipOnboardingAction())}
          className="text-xs text-gray-500 hover:text-gray-300 transition-colors flex items-center gap-1"
        >
          <X className="w-3 h-3" />
          {t.skip}
        </button>
      </div>

      {/* Step Indicators */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div
              className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                s < currentStep
                  ? 'bg-neon-cyan text-black'
                  : s === currentStep
                  ? 'bg-neon-cyan/20 border border-neon-cyan text-neon-cyan'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {s < currentStep ? <CheckCircle2 className="w-4 h-4" /> : s}
            </div>
            {s < 3 && (
              <div className={`flex-1 h-px ${s < currentStep ? 'bg-neon-cyan/50' : 'bg-gray-700'}`} />
            )}
          </div>
        ))}
      </div>

      {/* ── Step 1: Facebook ── */}
      {currentStep === 1 && (
        <div className="space-y-4">
          <div className="flex items-start gap-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20">
            <Facebook className="w-8 h-8 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-white mb-1">{t.step1.connectFacebookTitle}</p>
              <p className="text-xs text-gray-400 leading-relaxed">
                {t.step1.connectFacebookDesc}
              </p>
            </div>
          </div>

          {status.hasFacebookConnected && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20 text-sm text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              {t.step1.alreadyConnected}
            </div>
          )}

          <button
            onClick={handleStep1Done}
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Facebook className="w-4 h-4" />
            )}
            {status.hasFacebookConnected ? t.step1.continueButton : t.step1.connectButton}
          </button>
        </div>
      )}

      {/* ── Step 2: Ad Account + ROAS ── */}
      {currentStep === 2 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400">{t.step2.primaryAccountLabel}</label>
            {adAccounts.length > 0 ? (
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-neon-cyan focus:outline-none"
              >
                {adAccounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} ({acc.currency})
                  </option>
                ))}
              </select>
            ) : (
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20 text-xs text-yellow-400">
                {t.step2.noAccountsFound}
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
              <Target className="w-3.5 h-3.5" />
              {t.step2.targetRoasLabel}
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0.5"
                max="10"
                step="0.1"
                value={targetRoas}
                onChange={(e) => setTargetRoas(Number(e.target.value))}
                className="flex-1 accent-neon-cyan"
              />
              <div className="w-16 bg-gray-900 border border-gray-700 rounded-lg px-2 py-1.5 text-center">
                <span className="text-sm font-bold text-neon-cyan font-mono">{targetRoas.toFixed(1)}x</span>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              {t.step2.targetRoasHelp}
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleStep2Done}
            disabled={isPending || adAccounts.length === 0}
            className="w-full py-2.5 rounded-lg bg-neon-cyan text-black text-sm font-semibold transition-colors flex items-center justify-center gap-2 disabled:opacity-50 hover:bg-neon-cyan/90"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
            {t.step2.saveAndContinue}
          </button>
        </div>
      )}

      {/* ── Step 3: Concorrentes ── */}
      {currentStep === 3 && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20">
            <Globe className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-300 leading-relaxed">
              {t.step3.intro}
            </p>
          </div>

          <div className="space-y-2.5">
            {competitors.map((c, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  placeholder={t.step3.namePlaceholder}
                  value={c.name}
                  onChange={(e) => updateCompetitor(i, 'name', e.target.value)}
                  className="w-1/3 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none"
                />
                <input
                  placeholder={t.step3.urlPlaceholder}
                  value={c.url}
                  onChange={(e) => updateCompetitor(i, 'url', e.target.value)}
                  className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none"
                />
                {competitors.length > 1 && (
                  <button
                    onClick={() => removeCompetitor(i)}
                    className="p-1.5 text-gray-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={addCompetitor}
            className="flex items-center gap-1.5 text-xs text-neon-cyan hover:text-neon-cyan/80 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            {t.step3.addCompetitor}
          </button>

          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            onClick={handleStep3Done}
            disabled={isPending}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-sm font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:opacity-90"
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {t.step3.finishSetup}
          </button>
        </div>
      )}
    </div>
  )
}
