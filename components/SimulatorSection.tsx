"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingUp, DollarSign, Zap, ArrowRight, Info } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const MIN_BUDGET = 3000;
const MAX_BUDGET = 100000;

function formatCurrency(value: number): string {
  if (value >= 1000) {
    return `$${(value / 1000).toFixed(value % 1000 === 0 ? 0 : 1)}k`;
  }
  return `$${value}`;
}

function formatCurrencyFull(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

interface SimResult {
  currentROAS: number;
  projectedROAS: number;
  currentRevenue: number;
  projectedRevenue: number;
  revenueGain: number;
  lpFixGain: number;
  checkoutFixGain: number;
  pixelFixGain: number;
  competitorFixGain: number;
}

function calculateResults(budget: number): SimResult {
  const currentROAS = 2.1 + (budget > 30000 ? 0.4 : 0);
  const currentRevenue = budget * currentROAS;

  // Each fix adds a percentage improvement
  const lpFixPct = 0.18; // 18% improvement from LP fixes
  const checkoutFixPct = 0.12; // 12% from checkout
  const pixelFixPct = 0.09; // 9% from pixel/CAPI
  const competitorFixPct = 0.06; // 6% from competitor intel

  const totalImprovement = lpFixPct + checkoutFixPct + pixelFixPct + competitorFixPct;
  const projectedROAS = currentROAS * (1 + totalImprovement);
  const projectedRevenue = budget * projectedROAS;
  const revenueGain = projectedRevenue - currentRevenue;

  return {
    currentROAS: Math.round(currentROAS * 10) / 10,
    projectedROAS: Math.round(projectedROAS * 10) / 10,
    currentRevenue,
    projectedRevenue,
    revenueGain,
    lpFixGain: currentRevenue * lpFixPct,
    checkoutFixGain: currentRevenue * checkoutFixPct,
    pixelFixGain: currentRevenue * pixelFixPct,
    competitorFixGain: currentRevenue * competitorFixPct,
  };
}

const leaks = [
  { label: "LP UX Fix", color: "bg-neon-cyan", key: "lpFixGain" as const },
  { label: "Checkout Fix", color: "bg-neon-purple", key: "checkoutFixGain" as const },
  { label: "CAPI/Pixel", color: "bg-blue-500", key: "pixelFixGain" as const },
  { label: "Competitor Intel", color: "bg-emerald-500", key: "competitorFixGain" as const },
];

export default function SimulatorSection() {
  const [budget, setBudget] = useState(15000);
  const [result, setResult] = useState<SimResult>(calculateResults(15000));
  const [isAnimating, setIsAnimating] = useState(false);
  const [prevGain, setPrevGain] = useState(0);

  const handleBudgetChange = useCallback((value: number) => {
    setBudget(value);
    setPrevGain(result.revenueGain);
    setIsAnimating(true);
    const newResult = calculateResults(value);
    setResult(newResult);
    setTimeout(() => setIsAnimating(false), 600);
  }, [result.revenueGain]);

  // Update CSS variable for range track fill
  useEffect(() => {
    const percentage = ((budget - MIN_BUDGET) / (MAX_BUDGET - MIN_BUDGET)) * 100;
    document.documentElement.style.setProperty("--range-progress", `${percentage}%`);
  }, [budget]);

  return (
    <section id="simulator" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[900px] h-[400px] bg-neon-cyan/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="text-center mb-14">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 mb-6">
            <TrendingUp className="w-3.5 h-3.5 text-neon-cyan" />
            <span className="text-xs font-semibold text-neon-cyan tracking-wider uppercase">
              Simulador de IA Interativo
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-4">
            <span className="text-white">O Simulador de Lucro</span>{" "}
            <span className="text-gradient-cyan-purple">com IA</span>
          </h2>
          <p className="text-lg text-gray-400 max-w-xl mx-auto">
            Arraste o controle para ver quanta receita você está deixando na mesa — e quanto vale
            corrigir cada vazamento do seu funil.
          </p>
        </AnimatedSection>

        {/* Main simulator card */}
        <AnimatedSection delay={0.1}>
          <div className="glass-card rounded-3xl border border-dark-border/60 overflow-hidden">
            {/* Top: Slider */}
            <div className="p-6 lg:p-8 border-b border-dark-border/60">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <label className="text-sm font-semibold text-gray-400 uppercase tracking-wider block mb-1">
                    Orçamento Mensal de Ads
                  </label>
                  <motion.div
                    key={budget}
                    initial={{ scale: 0.95, opacity: 0.7 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    className="text-3xl font-black text-white font-mono"
                  >
                    {formatCurrencyFull(budget)}
                    <span className="text-base text-gray-500 font-sans font-normal ml-1">/mo</span>
                  </motion.div>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20">
                  <Info className="w-3.5 h-3.5 text-neon-cyan" />
                  <span className="text-xs text-neon-cyan font-medium">Baseado em benchmarks da indústria</span>
                </div>
              </div>

              <input
                type="range"
                min={MIN_BUDGET}
                max={MAX_BUDGET}
                step={500}
                value={budget}
                onChange={(e) => handleBudgetChange(Number(e.target.value))}
                className="w-full"
                aria-label="Monthly ad budget slider"
              />

              <div className="flex justify-between text-xs text-gray-600 mt-2 font-mono">
                <span>{formatCurrency(MIN_BUDGET)}</span>
                <span>{formatCurrency(MAX_BUDGET)}</span>
              </div>
            </div>

            {/* Middle: ROAS comparison */}
            <div className="grid sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-dark-border/60">
              {/* Current ROAS */}
              <div className="p-6 text-center">
                <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">
                  ROAS Atual
                </div>
                <div className="text-3xl font-black text-gray-400 font-mono mb-1">
                  {result.currentROAS}x
                </div>
                <div className="text-sm text-gray-600">
                  {formatCurrencyFull(result.currentRevenue)}/mo
                </div>
              </div>

              {/* Arrow */}
              <div className="hidden sm:flex items-center justify-center p-6">
                <div className="flex flex-col items-center gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-px w-8 bg-gradient-to-r from-transparent to-neon-cyan" />
                    <ArrowRight className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <div className="text-xs text-neon-cyan font-semibold bg-neon-cyan/10 border border-neon-cyan/20 px-2.5 py-1 rounded-full">
                    +{(((result.projectedROAS - result.currentROAS) / result.currentROAS) * 100).toFixed(0)}%
                  </div>
                </div>
              </div>

              {/* Projected ROAS */}
              <div className="p-6 text-center bg-neon-cyan/5">
                <div className="text-xs text-neon-cyan uppercase tracking-wider mb-2 font-semibold">
                  Com FunnelGuard AI
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={result.projectedROAS}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.3 }}
                    className="text-3xl font-black text-neon-cyan font-mono mb-1"
                  >
                    {result.projectedROAS}x
                  </motion.div>
                </AnimatePresence>
                <div className="text-sm text-gray-400">
                  {formatCurrencyFull(result.projectedRevenue)}/mo
                </div>
              </div>
            </div>

            {/* Bottom: Revenue gain breakdown */}
            <div className="p-6 lg:p-8 border-t border-dark-border/60">
              {/* Total gain */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Receita Adicional / Mês</div>
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={Math.round(result.revenueGain)}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.35 }}
                      className="flex items-center gap-2"
                    >
                      <DollarSign className="w-6 h-6 text-green-400" />
                      <span className="text-4xl font-black text-green-400 font-mono">
                        {formatCurrencyFull(result.revenueGain)}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
                <div className="text-right hidden sm:block">
                  <div className="text-xs text-gray-600 mb-1">Ganho anual</div>
                  <div className="text-xl font-bold text-green-400/70 font-mono">
                    {formatCurrencyFull(result.revenueGain * 12)}/yr
                  </div>
                </div>
              </div>

              {/* Leak breakdown bars */}
              <div className="space-y-3">
                <div className="text-xs text-gray-600 uppercase tracking-wider mb-4">
                  Detalhamento por tipo de correção
                </div>
                {leaks.map((leak) => {
                  const gainValue = result[leak.key];
                  const percentage = (gainValue / result.revenueGain) * 100;
                  return (
                    <div key={leak.key} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-400 font-medium">{leak.label}</span>
                        <span className="text-gray-300 font-mono">
                          +{formatCurrencyFull(gainValue)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-dark-surface rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full ${leak.color} rounded-full`}
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Disclaimer */}
              <p className="text-xs text-gray-700 mt-6 leading-relaxed">
                * Estimativas baseadas em melhorias médias de taxa de conversão da indústria. Os resultados
                reais variam conforme a saúde atual do funil, nicho e qualidade do tráfego. Resultados
                geralmente observados entre 30 e 90 dias após a implementação.
              </p>
            </div>
          </div>
        </AnimatedSection>

        {/* Bottom CTA */}
        <AnimatedSection delay={0.2} className="mt-10 text-center">
          <p className="text-gray-500 text-sm mb-5">
            Pronto para descobrir seus números reais? Vamos rodar um diagnóstico ao vivo no seu funil.
          </p>
          <motion.a
            href="#waitlist"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            className="inline-flex items-center gap-2.5 px-8 py-4 rounded-xl text-sm font-bold text-dark-base bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 transition-opacity shadow-neon-cyan"
          >
            <Zap className="w-4 h-4" />
            Reivindique Seu Diagnóstico de Funil Gratuito
          </motion.a>
        </AnimatedSection>
      </div>
    </section>
  );
}
