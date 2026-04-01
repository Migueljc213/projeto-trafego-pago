import WhiteGloveChecklist from '@/components/dashboard/WhiteGloveChecklist';
import { Headphones, MessageCircle, Calendar, BookOpen } from 'lucide-react';

export const metadata = {
  title: 'Suporte White Glove | FunnelGuard AI',
};

export default function SuportePage() {
  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Suporte White Glove</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Atendimento dedicado e onboarding personalizado
        </p>
      </div>

      {/* Support Banner */}
      <div className="glass-card rounded-xl p-6 border border-neon-purple/20 bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
            <Headphones className="w-7 h-7 text-neon-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white">Seu Especialista Dedicado</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              Voce tem acesso prioritario ao nosso time de especialistas em trafego pago e otimizacao de funil
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-purple text-white text-sm font-medium hover:bg-neon-purple/90 transition-colors">
              <Calendar className="w-4 h-4" />
              Agendar Call
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-600 transition-colors">
              <MessageCircle className="w-4 h-4" />
              Chat ao Vivo
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Checklist */}
        <div className="xl:col-span-1">
          <WhiteGloveChecklist />
        </div>

        {/* Timeline + Resources */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Interactions */}
          <div className="glass-card rounded-xl p-5 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-4">Historico de Atendimento</h3>
            <div className="space-y-3">
              {[
                {
                  date: '18 Nov, 10:30',
                  type: 'Video Call',
                  specialist: 'Ana Costa',
                  topic: 'Configuracao do CAPI e validacao de eventos',
                  duration: '45 min',
                  color: 'text-green-400 bg-green-500/15 border-green-500/25',
                },
                {
                  date: '17 Nov, 14:00',
                  type: 'Auditoria',
                  specialist: 'Pedro Alves',
                  topic: 'Revisao completa do Meta Pixel em todas as paginas',
                  duration: '60 min',
                  color: 'text-neon-cyan bg-neon-cyan/15 border-neon-cyan/25',
                },
                {
                  date: '15 Nov, 09:00',
                  type: 'Discovery',
                  specialist: 'Ana Costa',
                  topic: 'Discovery call inicial — objetivos e estrutura de campanhas',
                  duration: '30 min',
                  color: 'text-neon-purple bg-neon-purple/15 border-neon-purple/25',
                },
              ].map((item, i) => (
                <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-white/3 border border-gray-800">
                  <span className={`text-xs px-2 py-1 rounded-full border font-medium flex-shrink-0 ${item.color}`}>
                    {item.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium text-gray-200">{item.topic}</p>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.specialist} &bull; {item.date} &bull; {item.duration}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="glass-card rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-neon-cyan" />
              <h3 className="text-sm font-semibold text-white">Base de Conhecimento</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { title: 'Guia de Configuracao do CAPI', category: 'Configuracao', time: '5 min' },
                { title: 'Otimizando o ROAS com IA', category: 'Performance', time: '8 min' },
                { title: 'Como interpretar a auditoria de funil', category: 'Auditoria', time: '6 min' },
                { title: 'Monitor de Precos: primeiros passos', category: 'Precos', time: '4 min' },
                { title: 'AI Auto-Pilot: entendendo as acoes', category: 'Campanhas', time: '7 min' },
                { title: 'Melhores praticas para Meta Ads', category: 'Estrategia', time: '10 min' },
              ].map((article, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/3 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors">{article.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neon-cyan/70">{article.category}</span>
                      <span className="text-xs text-gray-600">&bull; {article.time} de leitura</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
