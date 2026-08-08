import CreativeLab from '@/components/dashboard/CreativeLab'
import AudienceSuggestions from '@/components/dashboard/AudienceSuggestions'
import { Sparkles, Lightbulb } from 'lucide-react'
import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export const metadata = {
  title: 'Laboratório de Criativos | FunnelGuard AI',
}

export default async function LaboratorioPage() {
  const dict = getDictionary(await getServerLanguage())
  const d = dict.account.laboratorioPage

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-neon-cyan" />
            <h1 className="text-xl font-bold text-white">{d.title}</h1>
          </div>
          <p className="text-sm text-gray-500">
            {d.subtitle}
          </p>
        </div>

        {/* Frameworks badge */}
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-500/15 text-blue-400 border border-blue-500/25">
            AIDA
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-purple-500/15 text-purple-400 border border-purple-500/25">
            PAS
          </span>
        </div>
      </div>

      {/* Info cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: '🎯',
            title: d.cards.frameworks.title,
            desc: d.cards.frameworks.desc,
          },
          {
            icon: '⚡',
            title: d.cards.autoAnalysis.title,
            desc: d.cards.autoAnalysis.desc,
          },
          {
            icon: '🧪',
            title: d.cards.abTest.title,
            desc: d.cards.abTest.desc,
          },
        ].map((card) => (
          <div key={card.title} className="glass-card border border-gray-800 rounded-xl p-4">
            <span className="text-2xl mb-2 block">{card.icon}</span>
            <p className="text-sm font-semibold text-white mb-1">{card.title}</p>
            <p className="text-xs text-gray-500 leading-relaxed">{card.desc}</p>
          </div>
        ))}
      </div>

      {/* Main component */}
      <CreativeLab />

      {/* Audience Suggestions */}
      <AudienceSuggestions />

      {/* Bottom tip */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-neon-cyan/5 border border-neon-cyan/15">
        <Lightbulb className="w-4 h-4 text-neon-cyan flex-shrink-0 mt-0.5" />
        <p className="text-xs text-gray-400 leading-relaxed">
          <strong className="text-gray-200">{d.workflowTip.label}</strong> {d.workflowTip.text}
        </p>
      </div>
    </div>
  )
}
