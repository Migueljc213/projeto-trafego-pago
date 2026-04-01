import CampaignList from '@/components/dashboard/CampaignList';
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed';

export const metadata = {
  title: 'Campanhas IA | FunnelGuard AI',
};

export default function CampanhasPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Campanhas IA</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Gerenciamento inteligente de campanhas Meta Ads
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
            <span className="w-1.5 h-1.5 rounded-full bg-neon-cyan animate-pulse block"></span>
            <span className="text-xs text-neon-cyan font-medium">3 campanhas com AI Auto-Pilot</span>
          </div>
        </div>
      </div>

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Campanhas Ativas', value: '4', color: 'text-green-400' },
          { label: 'ROAS Medio', value: '3.8x', color: 'text-neon-cyan' },
          { label: 'Gasto Hoje', value: 'R$ 1.250', color: 'text-white' },
          { label: 'Conversoes Hoje', value: '42', color: 'text-neon-purple' },
        ].map(item => (
          <div key={item.label} className="glass-card rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={`text-xl font-bold font-mono ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <CampaignList />
        </div>
        <div className="xl:col-span-1">
          <AIInsightsFeed />
        </div>
      </div>
    </div>
  );
}
