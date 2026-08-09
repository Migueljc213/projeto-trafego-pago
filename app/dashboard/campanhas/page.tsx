import CampanhasClient from './CampanhasClient'
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed'
import AdAccountSwitcher from '@/components/dashboard/AdAccountSwitcher'
import DateRangePicker from '@/components/dashboard/DateRangePicker'
import RoasChart from '@/components/dashboard/RoasChart'
import CreativeRanking from '@/components/dashboard/CreativeRanking'
import AudienceInsights from '@/components/dashboard/AudienceInsights'
import CampaignChat from '@/components/dashboard/CampaignChat'
import RoasForecast from '@/components/dashboard/RoasForecast'
import GoogleAdsCampaignList from '@/components/dashboard/GoogleAdsCampaignList'
import { getCampaignRows, getAIInsightsFeed, getUserAdAccounts, getRoasByCampaign, getCreativeRanking } from '@/lib/dashboard-data'
import { getGoogleAdsCampaigns } from '@/actions/sync-google-ads'
import { getDictionary, getServerLanguage } from '@/lib/i18n/language'

export const metadata = { title: 'Campanhas IA | FunnelGuard AI' }

const VALID_DAYS = [7, 30, 90] as const

export default async function CampanhasPage({
  searchParams,
}: {
  searchParams: { account?: string; days?: string }
}) {
  const dict = getDictionary(await getServerLanguage())
  const adAccountId = searchParams.account
  const days = (VALID_DAYS as readonly number[]).includes(Number(searchParams.days))
    ? Number(searchParams.days)
    : 30

  const [campaigns, feedInsights, accounts, roasData, rankingRows, googleAdsData] = await Promise.all([
    getCampaignRows({ adAccountId, days }),
    getAIInsightsFeed({ adAccountId }),
    getUserAdAccounts(),
    getRoasByCampaign({ adAccountId, days }),
    getCreativeRanking({ adAccountId, days }),
    getGoogleAdsCampaigns(),
  ])

  const effectiveAccountId = adAccountId ?? accounts[0]?.id ?? ''
  const activeCount = campaigns.filter(c => c.status === 'ACTIVE').length
  const autoPilotCount = campaigns.filter(c => c.aiAutoPilot).length
  const totalSpend = campaigns.reduce((s, c) => s + c.spend, 0)
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0)
  const avgRoas = campaigns.length > 0 && totalSpend > 0
    ? campaigns.reduce((s, c) => s + c.roas * c.spend, 0) / totalSpend
    : 0

  const DAYS_LABEL = dict.campaigns.campanhasPage.diasLabel

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">{dict.campaigns.campanhasPage.titulo}</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {DAYS_LABEL[days]} &bull; {dict.campaigns.campanhasPage.subtituloSufixo}
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <AdAccountSwitcher accounts={accounts} currentId={effectiveAccountId} />
          <DateRangePicker currentDays={days} />
          {autoPilotCount > 0 && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
              <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse block" />
              <span className="text-xs text-neon-cyan font-medium">{dict.campaigns.campanhasPage.autoPilotBadge(autoPilotCount)}</span>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: dict.campaigns.campanhasPage.statCampanhasAtivas, value: String(activeCount), color: 'text-green-400' },
          { label: dict.campaigns.campanhasPage.statRoasMedio, value: `${avgRoas.toFixed(1)}x`, color: 'text-neon-cyan' },
          { label: dict.campaigns.campanhasPage.statGastoTotal, value: `R$ ${totalSpend.toFixed(0)}`, color: 'text-white' },
          { label: dict.campaigns.campanhasPage.statConversoes, value: String(totalConversions), color: 'text-neon-purple' },
        ].map(item => (
          <div key={item.label} className="glass-card rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      <RoasChart data={roasData} />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <CampanhasClient campaigns={campaigns} />
          {/* Google Ads — só exibe se o usuário conectou a conta */}
          {googleAdsData.campaigns.length > 0 && (
            <GoogleAdsCampaignList campaigns={googleAdsData.campaigns} />
          )}
          <CreativeRanking rows={rankingRows} />
          {/* Audience Insights — mostra a campanha com mais gasto */}
          {campaigns[0] && (
            <AudienceInsights
              campaignId={campaigns[0].id}
              campaignName={campaigns[0].name}
              days={days}
            />
          )}
          {/* Previsão de ROAS — campanha com mais spend */}
          {campaigns[0] && (
            <RoasForecast
              campaignId={campaigns[0].id}
              campaignName={campaigns[0].name}
            />
          )}
        </div>
        <div className="xl:col-span-1 space-y-6">
          <AIInsightsFeed insights={feedInsights} />
          <CampaignChat campaigns={campaigns} />
        </div>
      </div>
    </div>
  )
}
