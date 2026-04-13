import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import FunnelVisualizer from '@/components/dashboard/FunnelVisualizer'
import LpAuditorForm from '@/components/dashboard/LpAuditorForm'

export const metadata = { title: 'Auditoria de Funil | FunnelGuard AI' }

export default async function AuditoriaPage() {
  const session = await getServerSession(authOptions)
  const adAccount = session?.user?.id
    ? await prisma.adAccount.findFirst({
        where: { businessManager: { userId: session.user.id } },
      })
    : null

  const audits = adAccount
    ? await prisma.funnelAudit.findMany({
        where: { adAccountId: adAccount.id, resolved: false },
        orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        take: 10,
      })
    : []

  const criticalCount = audits.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').length
  const totalLoss = audits.reduce((s, a) => s + (a.estimatedRevenueLoss ?? 0), 0)

  const severityColor: Record<string, string> = {
    CRITICAL: 'text-red-400 bg-red-500/15 border-red-500/25',
    HIGH: 'text-orange-400 bg-orange-500/15 border-orange-500/25',
    MEDIUM: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/25',
    LOW: 'text-gray-400 bg-gray-500/15 border-gray-600/25',
  }

  const severityLabel: Record<string, string> = {
    CRITICAL: 'Crítico', HIGH: 'Alto', MEDIUM: 'Médio', LOW: 'Baixo',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Auditoria de Funil</h1>
        <p className="text-sm text-gray-500 mt-0.5">Análise completa da sua Landing Page e rastreamento</p>
      </div>

      {criticalCount > 0 && (
        <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10 flex flex-wrap items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
            <span className="text-orange-400 text-lg">⚠️</span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-orange-300">
              {criticalCount} problema{criticalCount > 1 ? 's' : ''} crítico{criticalCount > 1 ? 's' : ''} detectado{criticalCount > 1 ? 's' : ''}
            </p>
            <p className="text-xs text-orange-400/70 mt-0.5">
              Perda estimada de{' '}
              <span className="font-bold text-orange-300">
                R$ {totalLoss.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}/mês
              </span>
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          {/* Formulário para auditar nova LP */}
          <LpAuditorForm adAccountId={adAccount?.id ?? ''} />

          {/* Problemas encontrados */}
          {audits.length > 0 && (
            <div className="glass-card rounded-xl p-5 border border-gray-800">
              <h3 className="text-sm font-semibold text-white mb-4">Problemas Detectados</h3>
              <div className="space-y-3">
                {audits.map(audit => (
                  <div key={audit.id} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-gray-800">
                    <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${severityColor[audit.severity]}`}>
                      {severityLabel[audit.severity]}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-200">{audit.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{audit.description}</p>
                      {audit.url && (
                        <p className="text-xs text-gray-600 mt-1 truncate font-mono">{audit.url}</p>
                      )}
                    </div>
                    {audit.estimatedRevenueLoss && (
                      <span className="text-xs font-bold text-red-400 flex-shrink-0">
                        -{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(audit.estimatedRevenueLoss)}/mês
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <FunnelVisualizer stages={[]} />
        </div>

        <div className="xl:col-span-1">
          <div className="glass-card rounded-xl p-5 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-4">O que a IA verifica</h3>
            <ul className="space-y-3 text-sm text-gray-400">
              {[
                { icon: '📡', label: 'Meta Pixel instalado e disparando' },
                { icon: '📱', label: 'Experiência mobile (iPhone 14 Pro)' },
                { icon: '⚡', label: 'LCP — velocidade de carregamento' },
                { icon: '🎯', label: 'CTA visível e clicável (min 44×44px)' },
                { icon: '🔗', label: 'Links quebrados na página' },
                { icon: '📊', label: 'Correlação CTR × taxa de conversão' },
              ].map(({ icon, label }) => (
                <li key={label} className="flex items-center gap-2">
                  <span>{icon}</span>
                  <span>{label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
