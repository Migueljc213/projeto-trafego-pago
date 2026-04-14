'use client'

import { useState, useTransition, useRef, useEffect, useCallback } from 'react'
import {
  Megaphone, Users, ImageIcon, CheckCircle2,
  ChevronRight, ChevronLeft, Loader2, Zap,
  ExternalLink, AlertTriangle, X, Search,
} from 'lucide-react'
import { createCampaignAction } from '@/actions/create-campaign'
import type { CreateCampaignInput } from '@/actions/create-campaign'
import type { CampaignObjective, OptimizationGoal, CallToActionType } from '@/lib/meta-api'

// ─── Dados dos selects ────────────────────────────────────────────────────────

const OBJECTIVES: { value: CampaignObjective; label: string; desc: string; icon: string }[] = [
  { value: 'OUTCOME_TRAFFIC', label: 'Tráfego', desc: 'Direcionar pessoas para seu site ou app', icon: '🌐' },
  { value: 'OUTCOME_SALES', label: 'Vendas', desc: 'Maximizar conversões e receita', icon: '🛒' },
  { value: 'OUTCOME_LEADS', label: 'Geração de Leads', desc: 'Capturar contatos qualificados', icon: '📋' },
  { value: 'OUTCOME_AWARENESS', label: 'Reconhecimento', desc: 'Ampliar o alcance da marca', icon: '📢' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engajamento', desc: 'Mais curtidas, comentários e compartilhamentos', icon: '❤️' },
]

const OPTIMIZATION_GOALS: Record<CampaignObjective, { value: OptimizationGoal; label: string; warning?: string }[]> = {
  OUTCOME_TRAFFIC: [
    { value: 'LINK_CLICKS', label: 'Cliques no Link' },
    { value: 'LANDING_PAGE_VIEWS', label: 'Visualizações de Landing Page' },
  ],
  OUTCOME_SALES: [
    { value: 'LINK_CLICKS', label: 'Cliques no Link' },
    { value: 'LANDING_PAGE_VIEWS', label: 'Visualizações de Landing Page' },
    { value: 'CONVERSIONS', label: 'Conversões ⚠️', warning: 'Requer Pixel Meta configurado. Acesse Configurações → Pixel antes de usar.' },
  ],
  OUTCOME_LEADS: [
    { value: 'LINK_CLICKS', label: 'Cliques no Link' },
    { value: 'LANDING_PAGE_VIEWS', label: 'Visualizações de Landing Page' },
    { value: 'CONVERSIONS', label: 'Conversões ⚠️', warning: 'Requer Pixel Meta configurado. Acesse Configurações → Pixel antes de usar.' },
  ],
  OUTCOME_AWARENESS: [
    { value: 'REACH', label: 'Alcance' },
    { value: 'IMPRESSIONS', label: 'Impressões' },
  ],
  OUTCOME_ENGAGEMENT: [
    { value: 'IMPRESSIONS', label: 'Impressões' },
    { value: 'REACH', label: 'Alcance' },
  ],
  OUTCOME_APP_PROMOTION: [
    { value: 'LINK_CLICKS', label: 'Cliques no Link' },
  ],
}

const CTA_OPTIONS: { value: CallToActionType; label: string }[] = [
  { value: 'LEARN_MORE', label: 'Saiba Mais' },
  { value: 'SHOP_NOW', label: 'Comprar Agora' },
  { value: 'SIGN_UP', label: 'Cadastre-se' },
  { value: 'CONTACT_US', label: 'Fale Conosco' },
  { value: 'GET_OFFER', label: 'Ver Oferta' },
  { value: 'SUBSCRIBE', label: 'Assinar' },
  { value: 'DOWNLOAD', label: 'Baixar' },
]

// ─── Componente de step indicator ─────────────────────────────────────────────

const STEPS = [
  { label: 'Campanha', icon: Megaphone },
  { label: 'Público', icon: Users },
  { label: 'Criativo', icon: ImageIcon },
  { label: 'Revisar', icon: CheckCircle2 },
]

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center gap-0">
      {STEPS.map((step, i) => {
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
            {i < STEPS.length - 1 && (
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
          placeholder="Buscar interesse: ex. Empreendedorismo, Marketing..."
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
                  {r.audienceSize ? `~${(r.audienceSize / 1_000_000).toFixed(1)}M pessoas` : 'ID: ' + r.id}
                </p>
              </button>
            ))}
          </div>
        )}
        {open && !loading && results.length === 0 && query.length >= 2 && (
          <div className="absolute z-50 left-0 right-0 mt-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-3 shadow-xl">
            <p className="text-xs text-gray-500">Nenhum interesse encontrado para "{query}"</p>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Wizard principal ─────────────────────────────────────────────────────────

interface Props {
  pages: Array<{ id: string; name: string }>
}

type FormData = Omit<CreateCampaignInput, 'dailyBudgetBRL'> & { dailyBudgetBRL: string }

export default function CampaignWizard({ pages }: Props) {
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
  })

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  const optimizationOptions = OPTIMIZATION_GOALS[form.objective] ?? []

  function handleSubmit() {
    setSubmitError(null)
    startTransition(async () => {
      const res = await createCampaignAction({
        ...form,
        dailyBudgetBRL: parseFloat(form.dailyBudgetBRL) || 50,
      })
      if (res.success && res.data) {
        setResult({ metaCampaignId: res.data.metaCampaignId, dashboardUrl: res.data.dashboardUrl })
      } else {
        setSubmitError(res.error ?? 'Erro desconhecido')
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
          <h2 className="text-xl font-bold text-white mb-2">Campanha criada com sucesso!</h2>
          <p className="text-sm text-gray-400">
            ID Meta: <code className="font-mono text-neon-cyan">{result.metaCampaignId}</code>
          </p>
        </div>
        <div className="flex items-center justify-center gap-3">
          <a
            href={result.dashboardUrl}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-neon-cyan text-black text-sm font-bold hover:opacity-90 transition-all"
          >
            <Zap className="w-4 h-4" />
            Ver Campanhas
          </a>
          <a
            href={`https://business.facebook.com/adsmanager/manage/campaigns`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-500 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            Abrir no Meta Ads Manager
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-2xl border border-gray-800 overflow-hidden">
      {/* Header com steps */}
      <div className="px-6 py-4 border-b border-gray-800 flex flex-wrap items-center justify-between gap-4">
        <StepIndicator current={step} />
        <p className="text-xs text-gray-600">Passo {step + 1} de {STEPS.length}</p>
      </div>

      <div className="p-6 space-y-6">
        {/* ── PASSO 1: Campanha ────────────────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-5">
            <Field label="Nome da Campanha" hint="Use um nome descritivo que identifique o produto e o objetivo">
              <Input
                value={form.campaignName}
                onChange={e => update('campaignName', e.target.value)}
                placeholder="Ex: Produto X — Tráfego Brasil Abril/2026"
              />
            </Field>

            <Field label="Objetivo">
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
              <Field label="Orçamento Diário (R$)" hint="Mínimo: R$5,00/dia">
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

              <Field label="Iniciar como">
                <Select
                  value={form.startPaused ? 'paused' : 'active'}
                  onChange={e => update('startPaused', e.target.value === 'paused')}
                >
                  <option value="paused">Pausada (revisar antes)</option>
                  <option value="active">Ativa (iniciar agora)</option>
                </Select>
              </Field>
            </div>
          </div>
        )}

        {/* ── PASSO 2: Público ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Idade Mínima">
                <Input type="number" min="18" max="65" value={form.ageMin}
                  onChange={e => update('ageMin', parseInt(e.target.value) || 18)} />
              </Field>
              <Field label="Idade Máxima">
                <Input type="number" min="18" max="65" value={form.ageMax}
                  onChange={e => update('ageMax', parseInt(e.target.value) || 65)} />
              </Field>
            </div>

            <Field label="Gênero">
              <div className="flex gap-3">
                {[
                  { value: 'all', label: 'Todos' },
                  { value: 'male', label: 'Masculino' },
                  { value: 'female', label: 'Feminino' },
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
              label="Otimização de Entrega"
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
                <span>🌍</span> Localização
              </p>
              <p className="text-sm text-gray-300">Brasil (BR) — padrão</p>
              <p className="text-xs text-gray-600 mt-1">
                Para segmentação geográfica avançada, ajuste diretamente no Meta Ads Manager após a criação.
              </p>
            </div>

            <div className="p-4 rounded-xl border border-blue-500/20 bg-blue-500/5">
              <p className="text-xs font-semibold text-blue-400 mb-1 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5" /> Interesses (opcional)
              </p>
              <p className="text-xs text-gray-500 mb-3">
                Busque interesses pelo nome. Deixe vazio para alcance amplo.
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
              <Field label="Página do Facebook" hint="O anúncio será veiculado em nome desta página">
                <Select value={form.pageId} onChange={e => update('pageId', e.target.value)}>
                  {pages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.id})</option>)}
                </Select>
              </Field>
            ) : (
              <Field
                label="ID da Página do Facebook"
                hint="Cole o ID numérico da sua Página. Encontre em: facebook.com/sua-pagina → Sobre → ID da Página"
                error={step === 2 && !form.pageId.trim() ? 'Campo obrigatório para criar o criativo' : undefined}
              >
                <div className="space-y-2">
                  <Input
                    value={form.pageId}
                    onChange={e => update('pageId', e.target.value.trim())}
                    placeholder="Ex: 123456789012345"
                  />
                  <div className="flex items-start gap-2 p-3 rounded-lg border border-yellow-500/20 bg-yellow-500/5">
                    <AlertTriangle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-300">
                      Não encontramos páginas automaticamente. Cole o ID da sua Página do Facebook acima ou reconecte sua conta Meta em{' '}
                      <a href="/dashboard/configuracoes" className="underline hover:text-yellow-200">Configurações</a>{' '}
                      para tentar buscar novamente.
                    </p>
                  </div>
                </div>
              </Field>
            )}

            <Field label="Headline" hint="Máximo 40 caracteres — aparece em destaque no anúncio">
              <Input
                value={form.headline}
                onChange={e => update('headline', e.target.value)}
                maxLength={40}
                placeholder="Ex: Economize 50% em Softwares de IA"
              />
              <p className="text-xs text-gray-600 text-right">{form.headline.length}/40</p>
            </Field>

            <Field label="Texto Principal" hint="Máximo 150 palavras — o corpo do anúncio">
              <Textarea
                rows={4}
                value={form.primaryText}
                onChange={e => update('primaryText', e.target.value)}
                placeholder="Descreva a proposta de valor, use gatilhos mentais e finalize com uma chamada para ação."
              />
            </Field>

            <Field
              label="URL de Destino"
              hint="Página para onde o usuário será direcionado ao clicar"
              error={
                form.destinationUrl && !form.destinationUrl.startsWith('https://')
                  ? 'A URL deve começar com https:// (exigido pela Meta)'
                  : undefined
              }
            >
              <Input
                type="url"
                value={form.destinationUrl}
                onChange={e => update('destinationUrl', e.target.value)}
                placeholder="https://seu-site.com/produto"
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Chamada para Ação (CTA)">
                <Select
                  value={form.callToAction}
                  onChange={e => update('callToAction', e.target.value as CallToActionType)}
                >
                  {CTA_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </Select>
              </Field>
              <Field
                label="URL da Imagem"
                hint="Opcional — link direto para imagem (.jpg, .png, .webp)"
                error={
                  form.imageUrl && !/\.(jpe?g|png|gif|webp|bmp)(\?.*)?$/i.test(form.imageUrl)
                    ? 'Use o link direto de uma imagem (.jpg, .png, .webp), não uma URL de página web'
                    : undefined
                }
              >
                <Input
                  type="url"
                  value={form.imageUrl}
                  onChange={e => update('imageUrl', e.target.value)}
                  placeholder="https://cdn.exemplo.com/imagem.jpg"
                />
              </Field>
            </div>
          </div>
        )}

        {/* ── PASSO 4: Revisar ─────────────────────────────────────────────── */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-gray-400">
              Revise todos os detalhes antes de publicar. A campanha será criada diretamente no Meta Ads Manager.
            </p>

            {[
              {
                title: '📣 Campanha',
                items: [
                  ['Nome', form.campaignName],
                  ['Objetivo', OBJECTIVES.find(o => o.value === form.objective)?.label ?? form.objective],
                  ['Orçamento Diário', `R$ ${parseFloat(form.dailyBudgetBRL || '0').toFixed(2)}`],
                  ['Início', form.startPaused ? 'Pausada (ativar manualmente)' : 'Ativa imediatamente'],
                ],
              },
              {
                title: '👥 Público',
                items: [
                  ['Faixa Etária', `${form.ageMin} – ${form.ageMax} anos`],
                  ['Gênero', form.genders === 'all' ? 'Todos' : form.genders === 'male' ? 'Masculino' : 'Feminino'],
                  ['Localização', 'Brasil (BR)'],
                  ['Otimização', form.optimizationGoal ?? 'LINK_CLICKS'],
                ],
              },
              {
                title: '🎨 Criativo',
                items: [
                  ['Página', pages.find(p => p.id === form.pageId)?.name ?? form.pageId],
                  ['Headline', form.headline],
                  ['URL', form.destinationUrl],
                  ['CTA', CTA_OPTIONS.find(c => c.value === form.callToAction)?.label ?? form.callToAction ?? '—'],
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
          Anterior
        </button>

        {step < STEPS.length - 1 ? (
          <button
            type="button"
            onClick={() => setStep(s => s + 1)}
            disabled={
              (step === 0 && (!form.campaignName.trim() || !form.dailyBudgetBRL)) ||
              (step === 2 && (!form.headline.trim() || !form.primaryText.trim() || !form.destinationUrl || !form.destinationUrl.startsWith('https://') || !form.pageId.trim()))
            }
            className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-neon-cyan/10 border border-neon-cyan/30 text-neon-cyan text-sm font-semibold hover:bg-neon-cyan/20 transition-all disabled:opacity-40"
          >
            Próximo
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
              <><Loader2 className="w-4 h-4 animate-spin" /> Criando na Meta…</>
            ) : (
              <><Zap className="w-4 h-4" /> Criar Campanha</>
            )}
          </button>
        )}
      </div>
    </div>
  )
}
