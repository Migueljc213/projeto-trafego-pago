'use client';

import { useState, useEffect } from 'react';
import { Zap, Pause, Clock, TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';
import { mockCampaigns } from '@/lib/mock-data';
import type { Campaign, CampaignAlertType } from '@/lib/types';
import { SkeletonCampaignRow } from './SkeletonCards';

function StatusBadge({ status }: { status: Campaign['status'] }) {
  if (status === 'ativa') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium bg-green-500/15 text-green-400 border border-green-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse inline-block"></span>
        Ativa
      </span>
    );
  }
  if (status === 'pausada') {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-gray-500/15 text-gray-400 border border-gray-600/25">
        <Pause className="w-3 h-3" />
        Pausada
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-yellow-500/15 text-yellow-400 border border-yellow-500/25">
      <Clock className="w-3 h-3" />
      Aprendizado
    </span>
  );
}

const alertConfig: Record<CampaignAlertType, { label: string; className: string }> = {
  frequencia_alta: {
    label: 'Frequencia Alta',
    className: 'bg-orange-500/15 text-orange-400 border-orange-500/25',
  },
  roas_baixo: {
    label: 'ROAS Baixo',
    className: 'bg-red-500/15 text-red-400 border-red-500/25',
  },
  escalavel: {
    label: 'Escalavel',
    className: 'bg-neon-cyan/10 text-neon-cyan border-neon-cyan/20',
  },
  orcamento_esgotado: {
    label: 'Orcamento Esgotado',
    className: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  },
};

function CampaignCard({ campaign }: { campaign: Campaign }) {
  const [autoPilot, setAutoPilot] = useState(campaign.autoPilot);
  const isGood = campaign.roas >= 3.0;

  return (
    <div
      className={`
        glass-card rounded-xl p-4 border transition-all duration-300
        ${autoPilot
          ? 'border-neon-cyan/30 bg-neon-cyan/3'
          : campaign.status === 'pausada'
          ? 'border-gray-700/50 opacity-70'
          : 'border-gray-800 hover:border-gray-700'
        }
      `}
    >
      <div className="flex flex-wrap items-start gap-3">
        {/* Status indicator */}
        <div
          className={`w-1 self-stretch rounded-full flex-shrink-0 ${
            campaign.status === 'ativa'
              ? isGood ? 'bg-green-400' : 'bg-orange-400'
              : campaign.status === 'aprendizado'
              ? 'bg-yellow-400'
              : 'bg-gray-600'
          }`}
        ></div>

        {/* Campaign info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h4 className="text-sm font-semibold text-gray-100 truncate">{campaign.name}</h4>
            {autoPilot && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30">
                <Zap className="w-3 h-3" />
                IA gerenciando
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={campaign.status} />
            {campaign.alerts.map(alert => (
              <span
                key={alert.type}
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${alertConfig[alert.type].className}`}
              >
                <AlertCircle className="w-3 h-3" />
                {alertConfig[alert.type].label}
              </span>
            ))}
          </div>
        </div>

        {/* Metrics */}
        <div className="flex flex-wrap items-center gap-4 text-right">
          <div>
            <p className="text-xs text-gray-500 mb-0.5">Spend/dia</p>
            <p className="text-sm font-semibold font-mono text-gray-200">
              {campaign.status === 'pausada'
                ? '—'
                : `R$ ${campaign.dailySpend.toFixed(0)}`
              }
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-0.5">ROAS</p>
            <div className="flex items-center gap-1 justify-end">
              {campaign.roas >= 3 ? (
                <TrendingUp className="w-3 h-3 text-green-400" />
              ) : (
                <TrendingDown className="w-3 h-3 text-red-400" />
              )}
              <p className={`text-sm font-bold font-mono ${campaign.roas >= 3 ? 'text-green-400' : 'text-red-400'}`}>
                {campaign.roas.toFixed(1)}x
              </p>
            </div>
          </div>

          {/* Auto-Pilot Toggle */}
          <div className="flex flex-col items-end gap-1">
            <p className="text-xs text-gray-500">AI Auto-Pilot</p>
            <button
              onClick={() => setAutoPilot(!autoPilot)}
              className={`
                relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 focus:outline-none
                ${autoPilot ? 'bg-neon-cyan' : 'bg-gray-700'}
              `}
            >
              <span
                className={`
                  inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300
                  ${autoPilot ? 'translate-x-4.5' : 'translate-x-0.5'}
                `}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CampaignList() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCampaigns(mockCampaigns);
      setLoading(false);
    }, 750);
    return () => clearTimeout(t);
  }, []);

  const activeCount = campaigns.filter(c => c.status === 'ativa').length;
  const autoPilotCount = campaigns.filter(c => c.autoPilot).length;

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-gray-800">
        <div>
          <h3 className="text-base font-semibold text-white">Campanhas Meta</h3>
          {!loading && (
            <p className="text-xs text-gray-500 mt-0.5">
              {activeCount} ativas &bull; {autoPilotCount} com AI Auto-Pilot
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-purple/10 border border-neon-purple/20">
            <Zap className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-xs font-medium text-neon-purple">{autoPilotCount} em Auto-Pilot</span>
          </div>
        </div>
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCampaignRow key={i} />)
        ) : (
          campaigns.map(campaign => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))
        )}
      </div>
    </div>
  );
}
