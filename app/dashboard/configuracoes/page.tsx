'use client';

import { useState } from 'react';
import { Check, Copy, Settings, Zap, Shield, Code } from 'lucide-react';

export default function ConfiguracoesPage() {
  const [capiCopied, setCapiCopied] = useState(false);
  const [pixelVerified, setPixelVerified] = useState(true);
  const [capiActive, setCapiActive] = useState(true);

  const handleCopy = () => {
    setCapiCopied(true);
    setTimeout(() => setCapiCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-white">Configuracoes</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Gerencie integracao CAPI, Pixel e preferencias da plataforma
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          {
            icon: Zap,
            title: 'Conversions API',
            status: capiActive ? 'Ativo' : 'Inativo',
            statusColor: capiActive ? 'text-green-400' : 'text-red-400',
            bg: capiActive ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20',
            metric: 'Match Rate: 87%',
          },
          {
            icon: Code,
            title: 'Meta Pixel',
            status: pixelVerified ? 'Verificado' : 'Com erros',
            statusColor: pixelVerified ? 'text-green-400' : 'text-orange-400',
            bg: pixelVerified ? 'bg-green-500/10 border-green-500/20' : 'bg-orange-500/10 border-orange-500/20',
            metric: '12 eventos mapeados',
          },
          {
            icon: Shield,
            title: 'FunnelGuard AI',
            status: 'Ativo 24/7',
            statusColor: 'text-neon-cyan',
            bg: 'bg-neon-cyan/10 border-neon-cyan/20',
            metric: 'Todos os modulos ON',
          },
        ].map(card => (
          <div key={card.title} className={`glass-card rounded-xl p-4 border ${card.bg}`}>
            <div className="flex items-center gap-2 mb-2">
              <card.icon className={`w-4 h-4 ${card.statusColor}`} />
              <span className="text-sm font-medium text-gray-200">{card.title}</span>
            </div>
            <p className={`text-sm font-bold ${card.statusColor} mb-1`}>{card.status}</p>
            <p className="text-xs text-gray-500">{card.metric}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* CAPI Config */}
        <div className="glass-card rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/15 border border-neon-cyan/25 flex items-center justify-center">
              <Zap className="w-4 h-4 text-neon-cyan" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Conversions API (CAPI)</h3>
              <p className="text-xs text-gray-500">Configuracao server-side de eventos</p>
            </div>
            <div className="ml-auto">
              <button
                onClick={() => setCapiActive(!capiActive)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-300 ${capiActive ? 'bg-neon-cyan' : 'bg-gray-700'}`}
              >
                <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow-sm transition-transform duration-300 ${capiActive ? 'translate-x-4.5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Access Token</label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-gray-700 font-mono text-xs text-gray-400 truncate">
                  EAABwzLixnjYBO3ZB...Xk8ZD
                </div>
                <button
                  onClick={handleCopy}
                  className="p-2 rounded-lg bg-white/5 border border-gray-700 text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                >
                  {capiCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Pixel ID</label>
              <div className="px-3 py-2 rounded-lg bg-black/40 border border-gray-700 font-mono text-xs text-gray-300">
                1234567890123456
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1.5">Eventos Configurados</label>
              <div className="flex flex-wrap gap-2">
                {['PageView', 'ViewContent', 'AddToCart', 'InitiateCheckout', 'Purchase', 'Lead'].map(evt => (
                  <span key={evt} className="px-2 py-1 rounded-md bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-mono">
                    {evt}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <div className="flex items-center gap-2">
                <Check className="w-4 h-4 text-green-400" />
                <p className="text-xs text-green-400 font-medium">CAPI validado com sucesso</p>
              </div>
              <p className="text-xs text-green-400/60 mt-1 pl-6">Match rate de 87% — acima da media do setor (70%)</p>
            </div>
          </div>
        </div>

        {/* Pixel Config */}
        <div className="glass-card rounded-xl p-5 border border-gray-800">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-neon-purple/15 border border-neon-purple/25 flex items-center justify-center">
              <Code className="w-4 h-4 text-neon-purple" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white">Meta Pixel</h3>
              <p className="text-xs text-gray-500">Rastreamento client-side</p>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { page: 'Home', events: ['PageView'], status: 'ok' },
              { page: 'Produto', events: ['PageView', 'ViewContent'], status: 'ok' },
              { page: 'Carrinho', events: ['AddToCart', 'InitiateCheckout'], status: 'ok' },
              { page: 'Checkout', events: ['InitiateCheckout', 'AddPaymentInfo'], status: 'warning' },
              { page: 'Obrigado', events: ['Purchase'], status: 'ok' },
            ].map(item => (
              <div key={item.page} className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-gray-800">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${item.status === 'ok' ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
                <span className="text-xs font-medium text-gray-300 w-20 flex-shrink-0">{item.page}</span>
                <div className="flex flex-wrap gap-1">
                  {item.events.map(evt => (
                    <span key={evt} className="px-1.5 py-0.5 rounded bg-gray-800 text-gray-400 text-xs font-mono">{evt}</span>
                  ))}
                </div>
                {item.status === 'warning' && (
                  <span className="ml-auto text-xs text-yellow-400 flex-shrink-0">Verificar</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* AI Settings */}
        <div className="glass-card rounded-xl p-5 border border-gray-800 xl:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 rounded-lg bg-neon-cyan/15 border border-neon-cyan/25 flex items-center justify-center">
              <Settings className="w-4 h-4 text-neon-cyan" />
            </div>
            <h3 className="text-sm font-semibold text-white">Configuracoes da IA</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'ROAS Minimo para pausa', value: '2.0', unit: 'x', desc: 'Campanha sera pausada automaticamente abaixo deste ROAS' },
              { label: 'Frequencia maxima', value: '3.5', unit: '', desc: 'Alerta emitido quando frequencia ultrapassar este valor' },
              { label: 'ROAS para escala', value: '4.0', unit: 'x', desc: 'Budget aumentado em 25% quando ROAS ultrapassar este valor' },
              { label: 'Aumento max. de budget', value: '25', unit: '%', desc: 'Percentual maximo de aumento de budget por acao da IA' },
              { label: 'Janela de atribuicao', value: '7', unit: 'dias', desc: 'Janela de atribuicao usada para calculo de ROAS' },
              { label: 'Intervalo de verificacao', value: '15', unit: 'min', desc: 'Frequencia com que a IA verifica as campanhas' },
            ].map(setting => (
              <div key={setting.label} className="p-3 rounded-lg bg-white/3 border border-gray-800">
                <p className="text-xs text-gray-400 mb-2">{setting.label}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-lg font-bold font-mono text-white">{setting.value}</span>
                  <span className="text-sm text-gray-500">{setting.unit}</span>
                </div>
                <p className="text-xs text-gray-600 leading-relaxed">{setting.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
