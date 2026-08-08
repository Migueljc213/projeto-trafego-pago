'use client';

import { useState, useEffect } from 'react';
import { Check, Clock, Loader2, Headphones } from 'lucide-react';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface SetupStep {
  id: string
  title: string
  description: string
  completed: boolean
  inProgress: boolean
}

function StepItem({ step, index }: { step: SetupStep; index: number }) {
  const { dict } = useLanguage();
  const d = dict.account.whiteGloveChecklist;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), index * 120);
    return () => clearTimeout(t);
  }, [index]);

  return (
    <div
      className={`flex items-start gap-3 transition-all duration-500 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
      }`}
    >
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 border transition-all duration-300
          ${step.completed
            ? 'bg-green-500/20 border-green-500/40 text-green-400'
            : step.inProgress
            ? 'bg-neon-cyan/10 border-neon-cyan/30 text-neon-cyan'
            : 'bg-gray-800 border-gray-700 text-gray-600'
          }
        `}
      >
        {step.completed ? (
          <Check className="w-3 h-3" />
        ) : step.inProgress ? (
          <Loader2 className="w-3 h-3 animate-spin" />
        ) : (
          <Clock className="w-3 h-3" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p
            className={`text-sm font-medium ${
              step.completed
                ? 'text-gray-200'
                : step.inProgress
                ? 'text-neon-cyan'
                : 'text-gray-500'
            }`}
          >
            {step.title}
          </p>
          {step.inProgress && (
            <span className="text-xs px-1.5 py-0.5 rounded bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/20 font-medium">
              {d.inProgress}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{step.description}</p>
      </div>
    </div>
  );
}

interface Props {
  hasFacebookConnected: boolean
  hasAdAccount: boolean
  hasCompetitors: boolean
  hasAudit: boolean
  hasAutoPilot: boolean
}

export default function WhiteGloveChecklist({
  hasFacebookConnected,
  hasAdAccount,
  hasCompetitors,
  hasAudit,
  hasAutoPilot,
}: Props) {
  const { dict } = useLanguage();
  const d = dict.account.whiteGloveChecklist;

  const steps: SetupStep[] = [
    {
      id: '1',
      title: d.steps[0].title,
      description: d.steps[0].description,
      completed: hasFacebookConnected,
      inProgress: false,
    },
    {
      id: '2',
      title: d.steps[1].title,
      description: d.steps[1].description,
      completed: hasAdAccount,
      inProgress: hasFacebookConnected && !hasAdAccount,
    },
    {
      id: '3',
      title: d.steps[2].title,
      description: d.steps[2].description,
      completed: hasCompetitors,
      inProgress: hasAdAccount && !hasCompetitors,
    },
    {
      id: '4',
      title: d.steps[3].title,
      description: d.steps[3].description,
      completed: hasAudit,
      inProgress: hasAdAccount && !hasAudit,
    },
    {
      id: '5',
      title: d.steps[4].title,
      description: d.steps[4].description,
      completed: hasAutoPilot,
      inProgress: hasAdAccount && !hasAutoPilot,
    },
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progressPct = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="glass-card rounded-xl p-5 border border-gray-800">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-neon-purple/15 border border-neon-purple/25 flex items-center justify-center">
            <Headphones className="w-4 h-4 text-neon-purple" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">{d.setupTitle}</h3>
            <p className="text-xs text-gray-500">{d.stepsCompleted.replace('{completed}', String(completedCount)).replace('{total}', String(steps.length))}</p>
          </div>
        </div>
        <span className="text-lg font-bold font-mono text-neon-purple">{progressPct}%</span>
      </div>

      <div className="h-1.5 rounded-full bg-gray-800 mb-5 overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple transition-all duration-1000 ease-out"
          style={{ width: `${progressPct}%` }}
        ></div>
      </div>

      <div className="space-y-4">
        {steps.map((step, idx) => (
          <StepItem key={step.id} step={step} index={idx} />
        ))}
      </div>

      <div className="mt-5 p-3 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
        <p className="text-xs text-gray-400">
          {d.needHelp}{' '}
          <span className="text-neon-purple font-medium cursor-pointer hover:underline">
            {d.scheduleCallWithExpert}
          </span>
        </p>
      </div>
    </div>
  );
}
