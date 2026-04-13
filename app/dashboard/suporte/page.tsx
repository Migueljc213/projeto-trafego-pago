import WhiteGloveChecklist from '@/components/dashboard/WhiteGloveChecklist';
import { Headphones, MessageCircle, Calendar, BookOpen } from 'lucide-react';
import { getOnboardingStatusAction } from '@/actions/onboarding';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const metadata = {
  title: 'Suporte White Glove | FunnelGuard AI',
};

export default async function SuportePage() {
  const session = await getServerSession(authOptions);
  const onboarding = await getOnboardingStatusAction();

  const hasAudit = session?.user?.id
    ? (await prisma.funnelAudit.count({
        where: { adAccount: { businessManager: { userId: session.user.id } } },
      })) > 0
    : false;

  const hasAutoPilot = session?.user?.id
    ? (await prisma.campaign.count({
        where: {
          aiAutoPilot: true,
          adAccount: { businessManager: { userId: session.user.id } },
        },
      })) > 0
    : false;

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
          <WhiteGloveChecklist
            hasFacebookConnected={onboarding.hasFacebookConnected}
            hasAdAccount={onboarding.hasAdAccount}
            hasCompetitors={onboarding.hasCompetitors}
            hasAudit={hasAudit}
            hasAutoPilot={hasAutoPilot}
          />
        </div>

        {/* Timeline + Resources */}
        <div className="xl:col-span-2 space-y-6">
          {/* Recent Interactions */}
          <div className="glass-card rounded-xl p-5 border border-gray-800">
            <h3 className="text-sm font-semibold text-white mb-4">Histórico de Atendimento</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <MessageCircle className="w-8 h-8 text-gray-700" />
              <p className="text-sm text-gray-500">Nenhum atendimento registrado ainda.</p>
              <p className="text-xs text-gray-600">Agende uma call para iniciar seu onboarding personalizado.</p>
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
