import WhiteGloveChecklist from '@/components/dashboard/WhiteGloveChecklist';
import { Headphones, MessageCircle, Calendar, BookOpen } from 'lucide-react';
import { getOnboardingStatusAction } from '@/actions/onboarding';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getDictionary, getServerLanguage } from '@/lib/i18n/language';

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

  const dict = getDictionary(await getServerLanguage());
  const d = dict.account.suportePage;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white">{d.title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {d.subtitle}
        </p>
      </div>

      {/* Support Banner */}
      <div className="glass-card rounded-xl p-6 border border-neon-purple/20 bg-gradient-to-br from-neon-purple/5 to-neon-cyan/5">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-neon-purple/20 border border-neon-purple/30 flex items-center justify-center flex-shrink-0">
            <Headphones className="w-7 h-7 text-neon-purple" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-bold text-white">{d.expertTitle}</h2>
            <p className="text-sm text-gray-400 mt-0.5">
              {d.expertDesc}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-neon-purple text-white text-sm font-medium hover:bg-neon-purple/90 transition-colors">
              <Calendar className="w-4 h-4" />
              {d.scheduleCall}
            </button>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg glass-card border border-gray-700 text-gray-300 text-sm font-medium hover:border-gray-600 transition-colors">
              <MessageCircle className="w-4 h-4" />
              {d.liveChat}
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
            <h3 className="text-sm font-semibold text-white mb-4">{d.historyTitle}</h3>
            <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
              <MessageCircle className="w-8 h-8 text-gray-700" />
              <p className="text-sm text-gray-500">{d.noHistory}</p>
              <p className="text-xs text-gray-600">{d.scheduleToStart}</p>
            </div>
          </div>

          {/* Knowledge Base */}
          <div className="glass-card rounded-xl p-5 border border-gray-800">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-4 h-4 text-neon-cyan" />
              <h3 className="text-sm font-semibold text-white">{d.knowledgeBase}</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {d.articles.map((article, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-lg bg-white/3 border border-gray-800 hover:border-gray-700 transition-colors cursor-pointer group">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-200 group-hover:text-white transition-colors">{article.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-neon-cyan/70">{article.category}</span>
                      <span className="text-xs text-gray-600">&bull; {d.readingTime.replace('{time}', article.time)}</span>
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
