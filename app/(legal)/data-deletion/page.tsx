import { Trash2, CheckCircle2, Clock, Mail } from 'lucide-react'
import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export async function generateMetadata() {
  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.dataDeletion
  return {
    title: t.metaTitle,
    description: t.metaDescription,
  }
}

export default async function DataDeletionPage() {
  const dict = getDictionary(await getServerLanguage())
  const t = dict.adminLoginLegal.dataDeletion

  const steps = [
    { icon: Mail, title: t.steps[0].title, description: t.steps[0].description },
    { icon: CheckCircle2, title: t.steps[1].title, description: t.steps[1].description },
    { icon: Clock, title: t.steps[2].title, description: t.steps[2].description },
  ]

  const whatIsDeleted = t.deletedItems
  const whatIsRetained = t.retainedItems

  return (
    <article>
      {/* Header */}
      <div className="mb-10">
        <p className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-2">{t.badge}</p>
        <h1 className="text-3xl font-extrabold text-white mb-3 flex items-center gap-3">
          <Trash2 className="w-7 h-7 text-red-400" />
          {t.title}
        </h1>
        <p className="text-sm text-gray-400 max-w-2xl leading-relaxed">
          {t.intro}
        </p>
      </div>

      {/* Aviso Meta */}
      <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 mb-8 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
          <span className="text-base">ℹ️</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-blue-300 mb-1">{t.metaNoteTitle}</p>
          <p className="text-sm text-gray-400 leading-relaxed">
            {t.metaNoteBefore}
            <strong className="text-gray-300">{t.metaNoteBold}</strong>
            {t.metaNoteAfter}
          </p>
        </div>
      </div>

      {/* Steps */}
      <div className="mb-10">
        <h2 className="text-base font-bold text-white mb-5 border-l-2 border-red-500 pl-3">
          {t.stepsTitle}
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div key={i} className="glass-card rounded-xl border border-gray-800 p-4">
                <div className="w-9 h-9 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 flex items-center justify-center mb-3">
                  <Icon className="w-4 h-4 text-neon-cyan" />
                </div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-xs font-bold text-gray-600 font-mono">0{i + 1}</span>
                  <p className="text-sm font-semibold text-white">{step.title}</p>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">{step.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* CTA Email */}
      <div className="p-5 rounded-xl border border-neon-cyan/25 bg-neon-cyan/5 mb-10 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-white">{t.ctaTitle}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {t.ctaBefore}<span className="font-mono text-neon-cyan">{t.ctaCode}</span>
          </p>
        </div>
        <a
          href="mailto:privacidade@funnelguard.ai?subject=Exclusão%20de%20Dados%20—%20FunnelGuard%20AI"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-neon-cyan text-black text-sm font-bold hover:opacity-90 transition-opacity"
        >
          <Mail className="w-4 h-4" />
          privacidade@funnelguard.ai
        </a>
      </div>

      {/* O que é excluído */}
      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <div>
          <h2 className="text-base font-bold text-white mb-4 border-l-2 border-red-500 pl-3">
            {t.deletedTitle}
          </h2>
          <ul className="space-y-2">
            {whatIsDeleted.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                <Trash2 className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-base font-bold text-white mb-4 border-l-2 border-yellow-500 pl-3">
            {t.retainedTitle}
          </h2>
          <ul className="space-y-2">
            {whatIsRetained.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-gray-400">
                <Clock className="w-3.5 h-3.5 text-yellow-400 mt-0.5 flex-shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-xs text-gray-600 mt-4">
            {t.retainedNote}
          </p>
        </div>
      </div>

      {/* Confirmation URL para o Meta */}
      <div className="p-4 rounded-xl border border-gray-800 bg-white/2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
          {t.confirmationTitle}
        </p>
        <p className="text-sm text-gray-400 leading-relaxed">
          {t.confirmationBefore}
          <code className="text-neon-cyan font-mono text-xs bg-neon-cyan/10 px-2 py-0.5 rounded">
            https://funnelguard.ai/data-deletion
          </code>
          {t.confirmationAfter}
        </p>
      </div>
    </article>
  )
}
