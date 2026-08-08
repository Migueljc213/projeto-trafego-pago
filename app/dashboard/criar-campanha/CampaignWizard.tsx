'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import {
  Megaphone, Users, ImageIcon, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, Zap,
  ExternalLink, AlertTriangle, X, Search, Video,
} from 'lucide-react'
import { createCampaignAction } from '@/actions/create-campaign'
import type { CreateCampaignInput } from '@/actions/create-campaign'
import type { CampaignObjective, OptimizationGoal, CallToActionType } from '@/lib/meta-api'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Dictionary } from '@/lib/i18n/language'

// ─── Dados dos selects ────────────────────────────────────────────────────────

function useObjectives(dict: Dictionary): { value: CampaignObjective; label: string; desc: string; icon: string }[] {
  const t = dict.campaigns.campaignWizard.objectives
  return [
    { value: 'OUTCOME_TRAFFIC', label: t.trafego.label, desc: t.trafego.desc, icon: '🌐' },
    { value: 'OUTCOME_SALES', label: t.vendas.label, desc: t.vendas.desc, icon: '🛒' },
    { value: 'OUTCOME_LEADS', label: t.leads.label, desc: t.leads.desc, icon: '📋' },
    { value: 'OUTCOME_AWARENESS', label: t.reconhecimento.label, desc: t.reconhecimento.desc, icon: '📢' },
    { value: 'OUTCOME_ENGAGEMENT', label: t.engajamento.label, desc: t.engajamento.desc, icon: '❤️' },
  ]
}

function useOptimizationGoals(dict: Dictionary): Record<CampaignObjective, { value: OptimizationGoal; label: string; warning?: string }[]> {
  const t = dict.campaigns.campaignWizard.optimizationGoals
  return {
    OUTCOME_TRAFFIC: [
      { value: 'LINK_CLICKS', label: t.linkClicks },
      { value: 'LANDING_PAGE_VIEWS', label: t.landingPageViews },
    ],
    OUTCOME_SALES: [
      { value: 'LINK_CLICKS', label: t.linkClicks },
      { value: 'LANDING_PAGE_VIEWS', label: t.landingPageViews },
      { value: 'CONVERSIONS', label: t.conversions, warning: t.pixelWarning },
    ],
    OUTCOME_LEADS: [
      { value: 'LINK_CLICKS', label: t.linkClicks },
      { value: 'LANDING_PAGE_VIEWS', label: t.landingPageViews },
      { value: 'CONVERSIONS', label: t.conversions, warning: t.pixelWarning },
    ],
    OUTCOME_AWARENESS: [
      { value: 'REACH', label: t.reach },
      { value: 'IMPRESSIONS', label: t.impressions },
    ],
    OUTCOME_ENGAGEMENT: [
      { value: 'IMPRESSIONS', label: t.impressions },
      { value: 'REACH', label: t.reach },
    ],
    OUTCOME_APP_PROMOTION: [
      { value: 'LINK_CLICKS', label: t.linkClicks },
    ],
  }
}

function useCtaOptions(dict: Dictionary): { value: CallToActionType; label: string }[] {
  const t = dict.campaigns.campaignWizard.ctaOptions
  return [
    { value: 'LEARN_MORE', label: t.learnMore },
    { value: 'SHOP_NOW', label: t.shopNow },
    { value: 'SIGN_UP', label: t.signUp },
    { value: 'CONTACT_US', label: t.contactUs },
    { value: 'GET_OFFER', label: t.getOffer },
    { value: 'SUBSCRIBE', label: t.subscribe },
    { value: 'DOWNLOAD', label: t.download },
  ]
}

// ─── Componente de step indicator ─────────────────────────────────────────────

function StepIndicator({ current, steps }: { current: number; steps: { label: string; icon: typeof Megaphone }[] }) {
  return (
    <div className="flex items-center gap-0">
      {steps.map((step, i) => {
        const Icon = step.icon
        const done = i < current
        const active = i === current
        return (
          <div key={i} className="flex items-center">
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all ${
              active ? 'bg-neon-cyan/15 border border-neon-cyan/30' :
              done ? 'text-green-400' : 'text-gray-600'
            }`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                done ? 'bg-green-500/20 text-green-400' :
                active ? 'bg-neon-cyan text-black' :
                'bg-gray-800 text-gray-600'
              }`}>
                {done ? '✓' : i + 1}
              </div>
              <Icon className={`w-3.5 h-3.5 ${active ? 'text-neon-cyan' : done ? 'text-green-400' : 'text-gray-600'}`} />
              <span className={`text-xs font-medium hidden sm:block ${
                active ? 'text-neon-cyan' : done ? 'text-green-400' : 'text-gray-600'
              }`}>{step.label}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-px mx-1 ${i < current ? 'bg-green-500/40' : 'bg-gray-800'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ─── Inputs reutilizáveis ─────────────────────────────────────────────────────

function Field({ label, hint, error, warning, children }: {
  label: string; hint?: string; error?: string; warning?: string; children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      {hint && <p className="text-xs text-gray-500">{hint}</p>}
      {children}
      {error && <p className="text-xs text-red-400">{error}</p>}
      {!error && warning && <p className="text-xs text-yellow-400">{warning}</p>}
    </div>
  )
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-colors ${props.className ?? ''}`}
    />
  )
}

function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white focus:border-neon-cyan focus:outline-none transition-colors ${props.className ?? ''}`}
    />
  )
}

function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={`w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-colors resize-none ${props.className ?? ''}`}
    />
  )
}

// ─── Interest search typeahead ────────────────────────────────────────────────

interface Interest { id: string; name: string; path?: string; audienceSize?: number | null }

function InterestSearch({
  selected,
  onChange,
}: {
  selected: Interest[]
  onChange: (interests: Interest[]) => void
}) {
  const { dict } = useLanguage()
  const t = dict.campaigns.campaignWizard.step2
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Interest[]>([])
  const [loading, setLoading] = useState(false)
  const [open, setOpen] = useState(false)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 2) { setResults([]); setOpen(false); return }
    setLoading(true)
    try {
      const res = await fetch(`/api/meta/interests?q=${encodeURIComponent(q)}`)
      const data = await res.json() as { data?: Interest[]; error?: string }
      setResults(data.data ?? [])
      setOpen(true)
    } catch {
      setResults([])
    } finally {
      setLoading(false)
    }
  }, [])

  function handleInput(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => search(val), 350)
  }

  function add(interest: Interest) {
    if (!selected.find(s => s.id === interest.id)) {
      onChange([...selected, interest])
    }
    setQuery('')
    setResults([])
    setOpen(false)
  }

  function remove(id: string) {
    onChange(selected.filter(s => s.id !== id))
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div ref={containerRef} className="space-y-2">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/25 text-neon-cyan text-xs">
              {s.name}
              <button onClick={() => remove(s.id)} className="hover:text-white transition-colors">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-500 pointer-events-none" />
        <input
          type="text"
          value={query}
          onChange={handleInput}
          placeholder={t.interestSearchPlaceholder}
          className="w-full bg-gray-900 border border-gray-700 rounded-lg pl-9 pr-3 py-2.5 text-sm text-white placeholder-gray-500 focus:border-neon-cyan focus:outline-none transition-colors"
        />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 animate-spin" />}
        {open && results.length > 0 && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden">
            {results.map(r => (
              <button
                key={r.id}
                type="button"
                onClick={() => add(r)}
                className="w-full text-left px-3 py-2.5 hover:bg-gray-800 transition-colors border-b border-gray-800 last:border-0"
              >
                <p className="text-sm text-gray-200">{r.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.path && <span>{r.path} · </span>}
                  {r.audienceSize ? t.interestAudienceSize((r.audienceSize / 1_000_000).toFixed(1)) : t.interestIdPrefix + r.id}
                </p>
              </button>
            ))}
          </div>
        )}
        {open && !loading && results.length === 0 && query.length >= 2 && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 shadow-xl">
            <p className="text-xs text-gray-500">{t.interestNoneFound(query)}</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

interface Props {
  pages: Array<{ id: string; name: string; fanCount?: number; engagementCount?: number }>
}

type FormData = Omit<CreateCampaignInput, 'dailyBudgetBRL'> & { dailyBudgetBRL: string; mediaType: 'image' | 'video' }

export default function CampaignWizard({ pages }: Props) {
  const { dict } = useLanguage()
  const wt = dict.campaigns.campaignWizard
  const OBJECTIVES = useObjectives(dict)
  const OPTIMIZATION_GOALS = useOptimizationGoals(dict)
  const CTA_OPTIONS = useCtaOptions(dict)
  const STEPS = [
    { label: wt.steps[0], icon: Megaphone },
    { label: wt.steps[1], icon: Users },
    { label: wt.steps[2], icon: ImageIcon },
    { label: wt.steps[3], icon: CheckCircle2 },
  ]

  const [step, setStep] = useState(0)
  const [isPending, startTransition] = useTransition()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [result, setResult] = useState<{ metaCampaignId: string; dashboardUrl: string } | null>(null)

  const [form, setForm] = useState<FormData>({
    campaignName: '',
    objective: 'OUTCOME_TRAFFIC',
    dailyBudgetBRL: '50',
    startPaused: true,
    ageMin: 18,
    ageMax: 65,
    genders: 'all',
    countries: ['BR'],
    interests: [],
    optimizationGoal: 'LINK_CLICKS',
    pageId: pages[0]?.id ?? '',
    headline: '',
    primaryText: '',
    destinationUrl: '',
    description: '',
    callToAction: 'LEARN_MORE',
    imageUrl: '',
    videoUrl: '',
    mediaType: 'image',
  })

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const optimizationOptions = OPTIMIZATION_GOALS[form.objective] ?? []

  function handleSubmit() {
    setSubmitError(null)
    startTransition(async () => {
      const { mediaType, ...formData } = form
      const res = await createCampaignAction({
        ...formData,
        dailyBudgetBRL: parseFloat(form.dailyBudgetBRL) || 50,
      })
      if (res.success && res.data) {
        setResult({ metaCampaignId: res.data.metaCampaignId, dashboardUrl: res.data.dashboardUrl })
      } else {
        setSubmitError(res.error ?? wt.submitErrorDefault)
      }
    })
  }

  // ── Sucesso ──────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="glass-card rounded-2xl border border-green-500/30 bg-green-500/5 p-8 text-center space-y-5">
        <div className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-8 h-8 text-green-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">{wt.sucesso.titulo}</h2>
          <p className="text-sm text-gray-400">
            {wt.sucesso.idMeta} <code className="font-mono text-neon-cyan">{result.metaCampaignId}</code>
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <a
            href={result.dashboardUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-cyan text-black text-sm font-bold hover:opacity-90 transition-all"
          >
            <Zap className="w-4 h-4" />
            {wt.sucesso.verCampanhas}
          </a>
          <a
            href={`https://business.facebook.com/adsmanager/manage/campaigns`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            {wt.sucesso.abrirMetaAdsManager}
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header com steps */}
      <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <StepIndicator current={step} steps={STEPS} />
        <p className="text-xs text-gray-600">{wt.stepCounter(step + 1, STEPS.length)}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* ── PASSO 1: Campanha ────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <Field label={wt.step1.nomeCampanhaLabel} hint={wt.step1.nomeCampanhaHint}>
              <Input
                value={form.campaignName}
                onChange={e => update('campaignName', e.target.value)}
                placeholder={wt.step1.nomeCampanhaPlaceholder}
              />
            </Field>

            <Field label={wt.step1.objetivoLabel}>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {OBJECTIVES.map(obj => (
                  <button
                    key={obj.value}
                    type="button"
                    onClick={() => {
                      update('objective', obj.value)
                      update('optimizationGoal', OPTIMIZATION_GOALS[obj.value]?.[0]?.value ?? 'LINK_CLICKS')
                    }}
                    className={`flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all ${
                      form.objective === obj.value
                        ? 'border-neon-cyan/50 bg-neon-cyan/8'
                        : 'border-gray-800 hover:border-gray-700'
                    }`}
                  >
                    <span className="text-xl">{obj.icon}</span>
                    <div>
                      <p className={`text-sm font-semibold ${form.objective === obj.value ? 'text-neon-cyan' : 'text-gray-200'}`}>
                        {obj.label}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">{obj.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={wt.step1.orcamentoLabel} hint={wt.step1.orcamentoHint}>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                  <Input
                    type="number"
                    min="5"
                    step="5"
                    value={form.dailyBudgetBRL}
                    onChange={e => update('dailyBudgetBRL', e.target.value)}
                    className="pl-9"
                  />
                </div>
              </Field>

              <Field label={wt.step1.iniciarComoLabel}>
                <Select
                  value={form.startPaused ? 'paused' : 'active'}
                  onChange={e => update('startPaused', e.target.value === 'paused')}
                >
                  <option value="paused">{wt.step1.pausada}</option>
                  <option value="active">{wt.step1.ativaAgora}</option>
                </Select>
              </Field>
            </div>
          </div>
        )}

        {/* ── PASSO 2: Público ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label={wt.step2.idadeMinLabel}>
                <Input type="number" min="18" max="65" value={form.ageMin}
                  onChange={e => update('ageMin', parseInt(e.target.value) || 18)} />
              </Field>
              <Field label={wt.step2.idadeMaxLabel}>
                <Input type="number" min="18" max="65" value={form.ageMax}
                  onChange={e => update('ageMax', parseInt(e.target.value) || 65)} />
              </Field>
            </div>

            <Field label={wt.step2.generoLabel}>
              <div className="flex gap-3">
                {[
                  { value: 'all', label: wt.step2.generoTodos },
                  { value: 'male', label: wt.step2.generoMasculino },
                  { value: 'female', label: wt.step2.generoFeminino },
                ].map(g => (
                  <button
                    key={g.value}
                    type="button"
                    onClick={() => update('genders', g.value as 'all' | 'male' | 'female')}
                    className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all ${
                      form.genders === g.value
                        ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                        : 'border-gray-800 text-gray-400 hover:border-gray-700'
                    }`}
                  >
                    {g.label}
                  </button>
                ))}
              </div>
            </Field>

            <Field
              label={wt.step2.otimizacaoLabel}
              warning={optimizationOptions.find(o => o.value === form.optimizationGoal)?.warning}
            >
              <Select
                value={form.optimizationGoal}
                onChange={e => update('optimizationGoal', e.target.value as OptimizationGoal)}
              >
                {optimizationOptions.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </Select>
            </Field>

            <div className="p-4 rounded-xl border border-gray-800 bg-gray-900/40">
              <p className="text-xs font-semibold text-gray-400 mb-2 flex items-center gap-1.5">
                <span>🌍</span> {wt.step2.localizacaoTitulo}
              </p>
              <p className="text-sm text-gray-300">{wt.step2.localizacaoValor}</p>
              <p className="text-xs text-gray-600 mt-1">
                {wt.step2.localizacaoHint}
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> {wt.step2.interessesTitulo}
              </p>
              <p className="text-xs text-gray-500 mb-3">
                {wt.step2.interessesHint}
              </p>
              <InterestSearch
                selected={form.interests ?? []}
                onChange={interests => update('interests', interests)}
              />
            </div>
          </div>
        )}

        {/* ── PASSO 3: Criativo ────────────────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-5">
            {pages.length > 0 ? (
              <Field label={wt.step3.paginaFacebookLabel} hint={wt.step3.paginaFacebookHint}>
                <Select value={form.pageId} onChange={e => update('pageId', e.target.value)}>
                  {pages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </Select>
                {(() => {
                  const selectedPage = pages.find(p => p.id === form.pageId)
                  if (!selectedPage || (selectedPage.fanCount == null && selectedPage.engagementCount == null)) return null
                  return (
                    <div className="flex items-center gap-4 mt-2 px-3 py-2 rounded-lg bg-blue-500/5 border border-blue-500/15">
                      <Users className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
                      <p className="text-xs text-gray-400">
                        {selectedPage.fanCount != null && (
                          <span>{wt.step3.curtidas(selectedPage.fanCount.toLocaleString('pt-BR'))}</span>
                        )}
                        {selectedPage.fanCount != null && selectedPage.engagementCount != null && ' · '}
                        {selectedPage.engagementCount != null && (
                          <span>{wt.step3.pessoasEngajando(selectedPage.engagementCount.toLocaleString('pt-BR'))}</span>
                        )}
                      </p>
                    </div>
                  )
                })()}
              </Field>
            ) : (
              <Field
                label={wt.step3.idPaginaLabel}
                hint={wt.step3.idPaginaHint}
                error={step === 2 && !form.pageId.trim() ? wt.step3.idPaginaError : undefined}
              >
                <div className="space-y-2">
                  <Input
                    value={form.pageId}
                    onChange={e => update('pageId', e.target.value.trim())}
                    placeholder={wt.step3.idPaginaPlaceholder}
                  />
                  <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-300">
                      {wt.step3.paginaNaoEncontradaPart1}{' '}
                      <a href="/dashboard/configuracoes" className="underline hover:text-yellow-200">{wt.step3.paginaNaoEncontradaLink}</a>{' '}
                      {wt.step3.paginaNaoEncontradaPart2}
                    </p>
                  </div>
                </div>
              </Field>
            )}

            <Field label={wt.step3.headlineLabel} hint={wt.step3.headlineHint}>
              <Input
                value={form.headline}
                onChange={e => update('headline', e.target.value)}
                maxLength={40}
                placeholder={wt.step3.headlinePlaceholder}
              />
              <p className="text-xs text-gray-600 text-right">{form.headline.length}/40</p>
            </Field>

            <Field label={wt.step3.textoPrincipalLabel} hint={wt.step3.textoPrincipalHint}>
              <Textarea
                rows={4}
                value={form.primaryText}
                onChange={e => update('primaryText', e.target.value)}
                placeholder={wt.step3.textoPrincipalPlaceholder}
              />
            </Field>

            <Field
              label={wt.step3.urlDestinoLabel}
              hint={wt.step3.urlDestinoHint}
              error={
                form.destinationUrl && !form.destinationUrl.startsWith('https://')
                  ? wt.step3.urlDestinoError
                  : undefined
              }
            >
              <Input
                type="url"
                value={form.destinationUrl}
                onChange={e => update('destinationUrl', e.target.value)}
                placeholder={wt.step3.urlDestinoPlaceholder}
              />
            </Field>

            <Field label={wt.step3.ctaLabel}>
              <Select
                value={form.callToAction}
                onChange={e => update('callToAction', e.target.value as CallToActionType)}
              >
                {CTA_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </Select>
            </Field>

            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-300">{wt.step3.midiaLabel}</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { update('mediaType', 'image'); update('videoUrl', '') }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.mediaType === 'image'
                      ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <ImageIcon className="w-4 h-4" />
                  {wt.step3.imagemBtn}
                </button>
                <button
                  type="button"
                  onClick={() => { update('mediaType', 'video'); update('imageUrl', '') }}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                    form.mediaType === 'video'
                      ? 'border-neon-cyan/50 bg-neon-cyan/10 text-neon-cyan'
                      : 'border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}
                >
                  <Video className="w-4 h-4" />
                  {wt.step3.videoBtn}
                </button>
              </div>

              {form.mediaType === 'image' ? (
                <Field
                  label=""
                  hint={wt.step3.imagemHint}
                  error={
                    form.imageUrl && !/\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i.test(form.imageUrl)
                      ? wt.step3.imagemError
                      : undefined
                  }
                >
                  <Input
                    type="url"
                    value={form.imageUrl}
                    onChange={e => update('imageUrl', e.target.value)}
                    placeholder={wt.step3.imagemPlaceholder}
                  />
                </Field>
              ) : (
                <Field
                  label=""
                  hint={wt.step3.videoHint}
                  error={
                    form.videoUrl && !/\.(mp4|mov|avi|mkv|wmv|flv|webm)(\?.*)?$/i.test(form.videoUrl)
                      ? wt.step3.videoError
                      : undefined
                  }
                >
                  <Input
                    type="url"
                    value={form.videoUrl ?? ''}
                    onChange={e => update('videoUrl', e.target.value)}
                    placeholder={wt.step3.videoPlaceholder}
                  />
                </Field>
              )}
            </div>
          </div>
        )}

        {/* ── PASSO 4: Revisar ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              {wt.step4.revisarIntro}
            </p>

            {[
              {
                title: wt.step4.campanhaSectionTitulo,
                items: [
                  [wt.step4.labelNome, form.campaignName],
                  [wt.step4.labelObjetivo, OBJECTIVES.find(o => o.value === form.objective)?.label ?? form.objective],
                  [wt.step4.labelOrcamentoDiario, `R$ ${parseFloat(form.dailyBudgetBRL || '0').toFixed(2)}`],
                  [wt.step4.labelInicio, form.startPaused ? wt.step4.valorPausada : wt.step4.valorAtivaImediatamente],
                ],
              },
              {
                title: wt.step4.publicoSectionTitulo,
                items: [
                  [wt.step4.labelFaixaEtaria, wt.step4.faixaEtariaValor(form.ageMin, form.ageMax)],
                  [wt.step4.labelGenero, form.genders === 'all' ? wt.step2.generoTodos : form.genders === 'male' ? wt.step2.generoMasculino : wt.step2.generoFeminino],
                  [wt.step4.labelLocalizacao, 'Brasil (BR)'],
                  [wt.step4.labelOtimizacao, form.optimizationGoal ?? 'LINK_CLICKS'],
                ],
              },
              {
                title: wt.step4.criativoSectionTitulo,
                items: [
                  [wt.step4.labelPagina, pages.find(p => p.id === form.pageId)?.name ?? form.pageId],
                  [wt.step4.labelHeadline, form.headline],
                  [wt.step4.labelUrl, form.destinationUrl],
                  [wt.step4.labelCta, CTA_OPTIONS.find(c => c.value === form.callToAction)?.label ?? form.callToAction ?? '—'],
                  [wt.step4.labelMidia, form.mediaType === 'video' ? wt.step4.midiaVideoValor(form.videoUrl || '—') : wt.step4.midiaImagemValor(form.imageUrl || '—')],
                ],
              },
            ].map(section => (
              <div key={section.title} className="glass-card rounded-xl border border-gray-800 p-4">
                <p className="text-sm font-semibold text-white mb-3">{section.title}</p>
                <dl className="space-y-1.5">
                  {section.items.map(([k, v]) => (
                    <div key={k} className="flex gap-3">
                      <dt className="text-xs text-gray-500 w-28 flex-shrink-0">{k}</dt>
                      <dd className="text-xs text-gray-300 truncate">{v || '—'}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            ))}

            {submitError && (
              <div className="flex items-start gap-3 p-4 rounded-xl border border-red-500/30 bg-red-500/5">
                <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-300">{submitError}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer de navegação */}
      <div className="px-6 py-4 border-t border-gray-800 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setStep(s => Math.max(0, s - 1))}
          disabled={step === 0 || isPending}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-700 text-sm text-gray-400 hover:text-white hover:border-gray-500 transition-all disabled:opacity-40"
        >
          <ChevronLeft className="w-4 h-4" />
          {wt.footer.anterior}
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 0 && (!form.campaignName.trim() || !form.dailyBudgetBRL)) ||
              (step === 2 && (
                !form.headline.trim() ||
                !form.primaryText.trim() ||
                !form.destinationUrl ||
                !form.destinationUrl.startsWith('https://') ||
                !form.pageId.trim() ||
                (form.mediaType === 'image' ? !form.imageUrl?.trim() : !form.videoUrl?.trim())
              ))
            }
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-semibold hover:bg-neon-cyan/20 transition-all disabled:opacity-40"
          >
            {wt.footer.proximo}
            <ChevronRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-neon-cyan to-neon-purple text-black text-sm font-bold hover:opacity-90 transition-all disabled:opacity-50"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> {wt.footer.criandoNaMeta}</>
            ) : (
              <><Zap className="w-4 h-4" /> {wt.footer.criarCampanha}</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
