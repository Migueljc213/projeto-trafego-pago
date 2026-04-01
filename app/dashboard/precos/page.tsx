import PriceTable from '@/components/dashboard/PriceTable';
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed';

export const metadata = {
  title: 'Monitor de Precos | FunnelGuard AI',
};

export default function PrecosPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-white">Monitor de Precos</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Acompanhamento de precos dos concorrentes em tempo real
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg glass-card border border-gray-700">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse block"></span>
          <span className="text-xs text-gray-400 font-medium">Atualizando a cada 30min</span>
        </div>
      </div>

      {/* Stat Pills */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Produtos Monitorados', value: '5', color: 'text-white' },
          { label: 'Competitivos', value: '3', color: 'text-green-400' },
          { label: 'Em Risco', value: '2', color: 'text-red-400' },
          { label: 'Concorrentes Rastreados', value: '3', color: 'text-neon-cyan' },
        ].map(item => (
          <div key={item.label} className="glass-card rounded-xl p-4 border border-gray-800">
            <p className="text-xs text-gray-500 mb-1">{item.label}</p>
            <p className={`text-2xl font-bold font-mono ${item.color}`}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <PriceTable />
        </div>
        <div className="xl:col-span-1">
          <AIInsightsFeed />
        </div>
      </div>

      {/* Info Panel */}
      <div className="glass-card rounded-xl p-5 border border-gray-800">
        <h3 className="text-sm font-semibold text-white mb-3">Como funciona o Monitor de Precos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Rastreamento Automatico',
              desc: 'A IA monitora os precos dos concorrentes configurados a cada 30 minutos',
            },
            {
              step: '02',
              title: 'Alerta Inteligente',
              desc: 'Quando um concorrente reduz o preco, voce recebe alerta imediato no feed da IA',
            },
            {
              step: '03',
              title: 'Recomendacao de Preco',
              desc: 'A IA sugere ajustes de preco para manter competitividade sem sacrificar margem',
            },
          ].map(item => (
            <div key={item.step} className="flex gap-3">
              <span className="text-2xl font-black text-gray-700 flex-shrink-0 font-mono">{item.step}</span>
              <div>
                <p className="text-sm font-medium text-gray-200 mb-1">{item.title}</p>
                <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
