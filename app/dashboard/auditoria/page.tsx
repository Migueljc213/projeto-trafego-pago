import FunnelVisualizer from '@/components/dashboard/FunnelVisualizer';
import AIInsightsFeed from '@/components/dashboard/AIInsightsFeed';

export const metadata = {
  title: 'Auditoria de Funil | FunnelGuard AI',
};

export default function AuditoriaPage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Auditoria de Funil</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Analise completa de cada etapa do funil de vendas
        </p>
      </div>

      {/* Alert Banner */}
      <div className="p-4 rounded-xl border border-orange-500/30 bg-orange-500/10 flex flex-wrap items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-orange-400 text-lg">⚠️</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-orange-300">2 problemas criticos detectados no funil</p>
          <p className="text-xs text-orange-400/70 mt-0.5">
            Alto custo de frete e botao CTA oculto em iOS estao causando perdas estimadas de{' '}
            <span className="font-bold text-orange-300">R$ 8.400/mes</span>
          </p>
        </div>
        <button className="px-3 py-1.5 rounded-lg bg-orange-500/20 border border-orange-500/30 text-xs text-orange-300 font-medium hover:bg-orange-500/30 transition-colors flex-shrink-0">
          Ver Correcoes
        </button>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-6">
          <FunnelVisualizer />

          {/* Recommendations */}
          <div className="glass-card rounded-xl p-5 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-4">Recomendacoes da IA</h3>
            <div className="space-y-3">
              {[
                {
                  priority: 'Alta',
                  priorityColor: 'text-red-400 bg-red-500/15 border-red-500/25',
                  title: 'Revisar politica de frete no checkout',
                  desc: 'Adicionar frete gratis acima de R$ 150 pode recuperar ate 40% dos carrinhos abandonados.',
                  impact: 'R$ 5.200/mes',
                },
                {
                  priority: 'Alta',
                  priorityColor: 'text-red-400 bg-red-500/15 border-red-500/25',
                  title: 'Corrigir CTA oculto no iOS Safari',
                  desc: 'O botao de compra fica invisivel no iOS Safari 17+ devido a um conflito de z-index.',
                  impact: 'R$ 2.340/dia',
                },
                {
                  priority: 'Media',
                  priorityColor: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/25',
                  title: 'Otimizar velocidade da landing page',
                  desc: 'Tempo de carregamento atual: 4.2s. Meta recomendada: abaixo de 2s para mobile.',
                  impact: '+15% conversao LP',
                },
              ].map((rec, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-gray-800">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium flex-shrink-0 mt-0.5 ${rec.priorityColor}`}>
                    {rec.priority}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-200">{rec.title}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{rec.desc}</p>
                  </div>
                  <span className="text-xs font-bold text-green-400 flex-shrink-0">+{rec.impact}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="xl:col-span-1">
          <AIInsightsFeed />
        </div>
      </div>
    </div>
  );
}
