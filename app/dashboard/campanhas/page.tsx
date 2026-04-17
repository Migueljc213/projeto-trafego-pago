import CampanhasClient from './CampanhasClient'
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed'
import AdAccountSwitcher from '@/components/dashboard/AdAccountSwitcher'
import DateRangePicker from '@/components/dashboard/DateRangePicker'
import { getCampaignRows, getAIInsightsFeed, getUserAdAccounts } from '@/lib/dashboard-data'

export const metadata = { title: 'Campanhas IA | FunnelGuard AI' }

const VALID_DAYS = [7, 30, 90] as const

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: { account?: string; days?: string }
}) {
  const adAccountId = searchParams.account
  const days = (VALID_DAYS as readonly number[]).includes(Number(searchParams.days))
    ? Number(searchParams.days)
    : 30

  const [campaigns, feedInsights, accounts] = await Promise.all([
    getCampaignRows({ adAccountId, days }),
    getAIInsightsFeed({ adAccountId }),
    getUserAdAccounts(),
  ])

  const effectiveAccountId = adAccountId ?? accounts[0]?.id ?? ''
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length
  const autoPilotCount = campaigns.filter(c => c.aiAutoPilot).length
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
  const avgRoas = campaigns.length > 0 && totalSpend > 0
    ? campaigns.reduce((s, c) => s + c.roas * c.spend, 0) / totalSpend
    : 0

  const DAYS_LABEL: Record<number, string> = {
    7: 'Últimos 7 dias',
    30: 'Últimos 30 dias',
    90: 'Últimos 90 dias',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Campanhas IA</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {DAYS_LABEL[days]} &bull; Gerenciamento inteligente de campanhas Meta Ads
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AdAccountSwitcher accounts={accounts} currentId={effectiveAccountId} />
          <DateRangePicker currentDays={days} />
          {autoPilotCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse block" />
              <span className="text-xs text-neon-cyan font-medium">{autoPilotCount} com AI Auto-Pilot</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Campanhas Ativas', value: String(activeCount), color: 'text-green-400' },
          { label: 'ROAS Médio', value: `${avgRoas.toFixed(1)}x`, color: 'text-neon-cyan' },
          { label: 'Gasto Total', value: `R$ ${totalSpend.toFixed(0)}`, color: 'text-white' },
          { label: 'Conversões', value: String(totalConversions), color: 'text-neon-purple' },
        ].map(item => (
          <div key={item.label} className="glass-card rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CampanhasClient campaigns={campaigns} />
        </div>
        <div className="xl:col-span-1">
          <AIInsightsFeed insights={feedInsights} />
        </div>
      </div>
    </div>
  )
}
