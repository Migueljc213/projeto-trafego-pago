"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { BarChart2, Truck, LayoutDashboard, Search, Eye, TrendingDown } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const problems = [
  {
    icon: BarChart2,
    title: "Armadilha das Métricas de Vaidade",
    subtitle: "Muitos cliques, zero conversões",
    description:
      "Seu gestor comemora 5.000 cliques. Mas ninguém pergunta por que só 12 pessoas compraram. Clique é centro de custo, não KPI.",
    tag: "Ponto Cego do Gestor",
    tagColor: "text-red-400 bg-red-400/10 border-red-400/20",
    iconBg: "bg-red-500/10",
    iconColor: "text-red-400",
    borderGlow: "hover:border-red-500/40 hover:shadow-[0_0_30px_rgba(239,68,68,0.1)]",
  },
  {
    icon: Truck,
    title: "Choque do Frete",
    subtitle: "R$18 de frete num produto de R$35",
    description:
      "Seu concorrente oferece frete grátis acima de R$30. Você não sabe disso. O cliente adiciona ao carrinho, vê o frete e abandona. Em silêncio.",
    tag: "Perdido no Checkout",
    tagColor: "text-orange-400 bg-orange-400/10 border-orange-400/20",
    iconBg: "bg-orange-500/10",
    iconColor: "text-orange-400",
    borderGlow: "hover:border-orange-500/40 hover:shadow-[0_0_30px_rgba(249,115,22,0.1)]",
  },
  {
    icon: LayoutDashboard,
    title: "UX Quebrado no Mobile",
    subtitle: "Seu botão CTA está invisível no iOS",
    description:
      "Um conflito de CSS esconde seu botão de compra no Safari/iOS. 60% do seu tráfego é mobile. Você está pagando por anúncios que levam pessoas a uma página quebrada há 3 semanas.",
    tag: "LP UX Error",
    tagColor: "text-yellow-400 bg-yellow-400/10 border-yellow-400/20",
    iconBg: "bg-yellow-500/10",
    iconColor: "text-yellow-400",
    borderGlow: "hover:border-yellow-500/40 hover:shadow-[0_0_30px_rgba(234,179,8,0.1)]",
  },
  {
    icon: Search,
    title: "Zero Inteligência Competitiva",
    subtitle: "Navegando às cegas numa guerra de preços",
    description:
      "Você definiu seu preço uma vez e esqueceu. Enquanto isso, os concorrentes ajustam diariamente. Você é a opção mais cara da categoria e nem sabe disso.",
    tag: "Ponto Cego Competitivo",
    tagColor: "text-purple-400 bg-purple-400/10 border-purple-400/20",
    iconBg: "bg-purple-500/10",
    iconColor: "text-purple-400",
    borderGlow: "hover:border-purple-500/40 hover:shadow-[0_0_30px_rgba(168,85,247,0.1)]",
  },
  {
    icon: Eye,
    title: "Dados Fantasma (Falhas no Pixel)",
    subtitle: "Apenas 52% das conversões rastreadas",
    description:
      "O iOS 14+ destruiu seu pixel. Sem CAPI configurado, o algoritmo da Meta otimiza com metade dos dados — gastando orçamento total, aprendendo com ruído.",
    tag: "Integridade de Dados",
    tagColor: "text-blue-400 bg-blue-400/10 border-blue-400/20",
    iconBg: "bg-blue-500/10",
    iconColor: "text-blue-400",
    borderGlow: "hover:border-blue-500/40 hover:shadow-[0_0_30px_rgba(59,130,246,0.1)]",
  },
  {
    icon: TrendingDown,
    title: "Ad Fatigue Ignorado",
    subtitle: "Mesmo criativo por 60 dias",
    description:
      "A frequência chegou a 9,4. Cada nova impressão é um lembrete de algo que seu público já rejeitou. Mas seu dashboard só mostra o CPM subindo.",
    tag: "Performance do Criativo",
    tagColor: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
    iconBg: "bg-cyan-500/10",
    iconColor: "text-cyan-400",
    borderGlow: "hover:border-cyan-500/40 hover:shadow-[0_0_30px_rgba(0,212,255,0.1)]",
  },
];

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, delay: i * 0.1, ease: "easeOut" },
  }),
};

export default function ProblemSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-100px 0px" });

  return (
    <section id="features" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-neon-purple/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <AnimatedSection className="text-center mb-16 lg:mb-20">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-red-500/30 bg-red-500/5 mb-6">
            <TrendingDown className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-semibold text-red-400 tracking-wider uppercase">
              O Problema Real
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6">
            <span className="text-white">A Pergunta de R$10.000 Que Seu</span>
            <br />
            <span className="text-gradient-cyan-purple">Gestor Não Consegue Responder:</span>
            <br />
            <span className="text-white text-2xl sm:text-3xl lg:text-4xl font-bold">
              Por Que Não Compraram?
            </span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Seus anúncios estão fazendo o trabalho deles. O problema é tudo{" "}
            <span className="text-white font-semibold">depois do clique</span> — e ninguém está
            monitorando isso. Até agora.
          </p>
        </AnimatedSection>

        {/* Problem cards grid */}
        <div ref={ref} className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {problems.map((problem, i) => {
            const Icon = problem.icon;
            return (
              <motion.div
                key={i}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate={isInView ? "visible" : "hidden"}
                className={`group glass-card rounded-2xl border border-dark-border/60 p-6 cursor-default transition-all duration-300 ${problem.borderGlow}`}
              >
                {/* Icon + tag */}
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl ${problem.iconBg}`}>
                    <Icon className={`w-5 h-5 ${problem.iconColor}`} />
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${problem.tagColor}`}>
                    {problem.tag}
                  </span>
                </div>

                {/* Content */}
                <h3 className="text-lg font-bold text-white mb-1 group-hover:text-neon-cyan transition-colors duration-300">
                  {problem.title}
                </h3>
                <p className={`text-sm font-semibold mb-3 ${problem.iconColor}`}>
                  {problem.subtitle}
                </p>
                <p className="text-sm text-gray-500 leading-relaxed">{problem.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Bottom callout */}
        <AnimatedSection delay={0.3} className="mt-16 text-center">
          <div className="inline-block glass-card rounded-2xl border border-neon-cyan/20 bg-neon-cyan/5 px-8 py-6 max-w-2xl">
            <p className="text-lg font-semibold text-white">
              Todos esses problemas são{" "}
              <span className="text-neon-cyan">invisíveis para gestores de anúncios tradicionais.</span>
            </p>
            <p className="text-sm text-gray-400 mt-2">
              FunnelGuard AI os detecta. Automaticamente. Em tempo real.
            </p>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
