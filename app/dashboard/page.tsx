import StatCards from '@/components/dashboard/StatCards';
import RevenueChart from '@/components/dashboard/RevenueChart';
import FunnelVisualizer from '@/components/dashboard/FunnelVisualizer';
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed';
import CampaignList from '@/components/dashboard/CampaignList';
import PriceTable from '@/components/dashboard/PriceTable';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Visao Geral</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Novembro 2025 &bull; Todas as campanhas
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-neon-cyan/20">
          <span className="w-2 h-2 rounded-full bg-neon-cyan animate-pulse block"></span>
          <span className="text-xs font-medium text-neon-cyan">IA monitorando em tempo real</span>
        </div>
      </div>

      {/* Top: Stat Cards */}
      <StatCards />

      {/* Middle grid: Chart + Funnel | AI Feed */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left 2/3 */}
        <div className="xl:col-span-2 space-y-6">
          <RevenueChart />
          <FunnelVisualizer />
        </div>

        {/* Right 1/3 */}
        <div className="xl:col-span-1">
          <AIInsightsFeed />
        </div>
      </div>

      {/* Bottom: Campaigns + Price Table */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CampaignList />
        <PriceTable />
      </div>
    </div>
  );
}
