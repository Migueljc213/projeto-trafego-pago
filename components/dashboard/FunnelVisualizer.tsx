'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, ChevronDown, BarChart3 } from 'lucide-react';
import type { FunnelStage } from '@/lib/types';

function StageBar({ stage, isLast }: { stage: FunnelStage; isLast: boolean }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);

  const colorMap = {
    green: {
      bar: 'from-green-500 to-emerald-400',
      badge: 'bg-green-500/20 text-green-400 border-green-500/30',
      border: 'border-green-500/20',
      text: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    yellow: {
      bar: 'from-yellow-500 to-amber-400',
      badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      border: 'border-yellow-500/20',
      text: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    red: {
      bar: 'from-red-500 to-rose-400',
      badge: 'bg-red-500/20 text-red-400 border-red-500/30',
      border: 'border-red-500/20',
      text: 'text-red-400',
      bg: 'bg-red-500/10',
    },
  };

  const colors = colorMap[stage.color];
  const pct = stage.id === '1' ? 100 : stage.conversionRate;

  return (
    <div className="relative">
      <div
        className={`
          glass-card rounded-xl p-4 border transition-all duration-300
          ${stage.hasIssue ? colors.border : 'border-gray-800'}
          ${stage.hasIssue ? colors.bg : ''}
        `}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${stage.color === 'green' ? 'bg-green-400' : stage.color === 'yellow' ? 'bg-yellow-400' : 'bg-red-400'}`}></div>
            <span className="text-sm font-medium text-gray-200">{stage.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-sm font-bold ${colors.text}`}>
              {stage.conversionRate}%
            </span>
            {stage.hasIssue && (
              <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${colors.badge}`}>
                <AlertTriangle className="w-3 h-3" />
                Problema
              </span>
            )}
          </div>
        </div>

        <div className="h-2 rounded-full bg-gray-800 mb-3 overflow-hidden">
          <div
            className={`h-full rounded-full bg-gradient-to-r ${colors.bar} transition-all duration-1000 ease-out`}
            style={{ width: animated ? `${pct}%` : '0%' }}
          ></div>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-400">
            <span className="font-mono font-semibold text-gray-200">
              {stage.visitors.toLocaleString('pt-BR')}
            </span>{' '}
            visitantes
          </span>
          {stage.id !== '1' && (
            <span className="text-gray-500">
              <span className="font-mono text-gray-400">{stage.conversions.toLocaleString('pt-BR')}</span> convertidos
            </span>
          )}
        </div>

        {stage.hasIssue && stage.issueReason && (
          <div className={`mt-3 flex items-start gap-2 px-3 py-2 rounded-lg border ${colors.badge}`}>
            <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
            <p className="text-xs leading-relaxed">{stage.issueReason}</p>
          </div>
        )}
      </div>

      {!isLast && (
        <div className="flex justify-center py-1.5">
          <ChevronDown className="w-4 h-4 text-gray-600" />
        </div>
      )}
    </div>
  );
}

interface Props {
  stages?: FunnelStage[]
}

export default function FunnelVisualizer({ stages = [] }: Props) {
  if (stages.length === 0) {
    return (
      <div className="glass-card rounded-xl p-8 border border-gray-800 flex flex-col items-center justify-center text-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-gray-800 border border-gray-700 flex items-center justify-center">
          <BarChart3 className="w-6 h-6 text-gray-600" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-400">Nenhum dado de funil disponível</p>
          <p className="text-xs text-gray-600 mt-1">
            Execute uma auditoria de LP para visualizar as etapas do funil com dados reais.
          </p>
        </div>
      </div>
    );
  }

  const firstStage = stages[0];
  const lastStage = stages[stages.length - 1];
  const overallRate = firstStage
    ? ((lastStage.conversions / firstStage.visitors) * 100).toFixed(1)
    : '0';

  return (
    <div className="glass-card rounded-xl p-5 border border-gray-800">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-base font-semibold text-white">Auditoria de Funil</h3>
          <p className="text-xs text-gray-500 mt-0.5">Taxa geral de conversao</p>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-neon-cyan font-mono">{overallRate}%</span>
          <p className="text-xs text-gray-500 mt-0.5">Anuncio → Compra</p>
        </div>
      </div>

      <div className="space-y-0">
        {stages.map((stage: FunnelStage, idx: number) => (
          <StageBar
            key={stage.id}
            stage={stage}
            isLast={idx === stages.length - 1}
          />
        ))}
      </div>

      {stages.filter(s => s.hasIssue).length > 0 && (
        <div className="mt-4 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
          <p className="text-xs text-orange-300">
            <span className="font-bold">{stages.filter(s => s.hasIssue).length} problema{stages.filter(s => s.hasIssue).length > 1 ? 's' : ''} detectado{stages.filter(s => s.hasIssue).length > 1 ? 's' : ''}</span>
            {' '}no funil. Corrigindo os gargalos identificados, estima-se recuperar{' '}
            <span className="font-bold text-orange-200">
              R$ {stages.reduce((s, st) => s + (st.hasIssue ? (st.visitors * 0.1) : 0), 0).toFixed(0)}/mês
            </span>{' '}
            em receita perdida.
          </p>
        </div>
      )}
    </div>
  );
}
