import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import PriceIntelligenceForm from '@/components/dashboard/PriceIntelligenceForm'
import { getCompetitorRows, getAIInsightsFeed } from '@/lib/dashboard-data'
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed'

export const metadata = { title: 'Monitor de Preços | FunnelGuard AI' }

export default async function PrecosPage() {
  const session = await getServerSession(authOptions)
  const adAccount = session?.user?.id
    ? await prisma.adAccount.findFirst({
        where: { businessManager: { userId: session.user.id } },
      })
    : null

  const [competitors, feedInsights] = await Promise.all([
    getCompetitorRows(),
    getAIInsightsFeed(),
  ])

  const priceAlerts = adAccount
    ? await prisma.funnelAudit.count({
        where: { adAccountId: adAccount.id, type: 'HIGH_PRICE', resolved: false },
      })
    : 0

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Monitor de Preços</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vigile concorrentes e reaja antes de perder vendas</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card border border-gray-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse block" />
          <span className="text-xs text-gray-400 font-medium">Crawler ativo</span>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Concorrentes Monitorados</p>
          <p className="text-2xl font-bold font-mono text-neon-cyan">{competitors.length}</p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Com Preço Coletado</p>
          <p className="text-2xl font-bold font-mono text-green-400">
            {competitors.filter(c => c.lastPrice !== null).length}
          </p>
        </div>
        <div className="glass-card rounded-xl p-4 border border-gray-800">
          <p className="text-xs text-gray-500 mb-1">Alertas de Preço</p>
          <p className={`text-2xl font-bold font-mono ${priceAlerts > 0 ? 'text-red-400' : 'text-gray-400'}`}>
            {priceAlerts}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Formulário para executar coleta */}
          <PriceIntelligenceForm adAccountId={adAccount?.id ?? ''} />

          {/* Tabela de concorrentes */}
          {competitors.length > 0 && (
            <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-800">
                <h3 className="text-sm font-semibold text-white">Concorrentes Cadastrados</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800 bg-white/2">
                      <th className="text-left px-5 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Nome</th>
                      <th className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">URL</th>
                      <th className="text-right px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Último Preço</th>
                      <th className="text-center px-4 py-3 text-xs font-medium text-gray-500 uppercase tracking-wide">Verificado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {competitors.map((comp, idx) => (
                      <tr key={comp.id} className={`border-b border-gray-800/50 ${idx % 2 === 0 ? 'hover:bg-white/2' : ''}`}>
                        <td className="px-5 py-3.5 font-medium text-gray-200">{comp.name}</td>
                        <td className="px-4 py-3.5">
                          <a href={comp.url} target="_blank" rel="noopener noreferrer" className="text-xs text-neon-cyan/70 hover:text-neon-cyan truncate block max-w-[180px] font-mono">
                            {comp.url}
                          </a>
                        </td>
                        <td className="px-4 py-3.5 text-right font-mono font-semibold text-white">
                          {comp.lastPrice !== null
                            ? `R$ ${comp.lastPrice.toFixed(2).replace('.', ',')}`
                            : <span className="text-gray-600 text-xs">Pendente</span>
                          }
                        </td>
                        <td className="px-4 py-3.5 text-center text-xs text-gray-500 font-mono">
                          {comp.lastChecked
                            ? new Date(comp.lastChecked).toLocaleDateString('pt-BR')
                            : '—'
                          }
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="xl:col-span-1">
          <AIInsightsFeed insights={feedInsights} />
        </div>
      </div>
    </div>
  )
}
