"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { Shield, CheckCircle, Code2, BarChart3, Headphones, Lock } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

const steps = [
  {
    step: "01",
    icon: Headphones,
    title: "Discovery Call (30 min)",
    description:
      "Um especialista dedicado mapeia toda a sua stack: CRM, plataforma de e-commerce, contas de anúncios e configuração atual do pixel. Sem formulários, sem bots.",
    highlight: "Conduzido por humanos",
    color: "neon-cyan",
  },
  {
    step: "02",
    icon: Code2,
    title: "CAPI + Pixel Setup",
    description:
      "Configuramos manualmente sua integração server-side com a Conversions API, garantindo 100% de deduplicação de eventos e precisão de dados à prova de iOS. Escrevemos o código. Verificamos cada evento.",
    highlight: "Feito para você",
    color: "neon-purple",
  },
  {
    step: "03",
    icon: BarChart3,
    title: "Funnel Baseline Audit",
    description:
      "Nossa IA executa um diagnóstico completo nas suas landing pages, fluxo de checkout e preços dos concorrentes. Você recebe uma lista priorizada de correções em até 24h.",
    highlight: "AI-powered",
    color: "blue-500",
  },
  {
    step: "04",
    icon: Shield,
    title: "Go Live & Monitoramento",
    description:
      "FunnelGuard AI entra em operação monitorando seu funil 24/7. Você recebe relatórios semanais de lucro com ações específicas. Sem dashboards para verificar — a gente traz o que importa.",
    highlight: "Automatizado",
    color: "emerald-500",
  },
];

const guarantees = [
  {
    icon: Lock,
    title: "Garantia de 100% de Precisão nos Dados",
    description:
      "Se o seu CAPI setup não capturar pelo menos 95% dos seus eventos de compra reais em 7 dias, corrigimos gratuitamente — sem perguntas.",
  },
  {
    icon: CheckCircle,
    title: "Sem Contratos de Fidelidade",
    description:
      "Cancele quando quiser. O código do CAPI, a configuração do pixel e os relatórios de auditoria são seus. Ganhamos sua fidelidade entregando resultados, não te prendendo.",
  },
  {
    icon: Shield,
    title: "Conformidade SOC 2 no Tratamento de Dados",
    description:
      "Seus dados empresariais nunca treinam modelos públicos de IA. Todo o processamento é isolado por conta com criptografia de nível empresarial.",
  },
];

const stepVariants = {
  hidden: { opacity: 0, x: -30 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, delay: i * 0.15, ease: "easeOut" },
  }),
};

const colorMap: Record<string, string> = {
  "neon-cyan": "text-neon-cyan bg-neon-cyan/10 border-neon-cyan/20",
  "neon-purple": "text-neon-purple bg-neon-purple/10 border-neon-purple/20",
  "blue-500": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  "emerald-500": "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
};

const iconColorMap: Record<string, string> = {
  "neon-cyan": "text-neon-cyan",
  "neon-purple": "text-neon-purple",
  "blue-500": "text-blue-400",
  "emerald-500": "text-emerald-400",
};

const iconBgMap: Record<string, string> = {
  "neon-cyan": "bg-neon-cyan/10",
  "neon-purple": "bg-neon-purple/10",
  "blue-500": "bg-blue-500/10",
  "emerald-500": "bg-emerald-500/10",
};

export default function WhiteGloveSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px 0px" });

  return (
    <section className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-1/4 -left-60 w-[500px] h-[500px] bg-neon-purple/8 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-purple/30 bg-neon-purple/5 mb-6">
            <Shield className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-xs font-semibold text-neon-purple tracking-wider uppercase">
              White Glove Onboarding
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6">
            <span className="text-white">Não Entregamos um Login.</span>
            <br />
            <span className="text-gradient-cyan-purple">Configuramos Tudo.</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            A maioria das ferramentas te joga num dashboard e te deseja boa sorte. FunnelGuard AI é diferente:{" "}
            <span className="text-white font-semibold">
              um especialista humano configura seu CAPI e Pixel manualmente
            </span>{" "}
            para garantir 100% de precisão nos dados antes de a IA assumir.
          </p>
        </AnimatedSection>

        {/* Steps */}
        <div ref={ref} className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute left-[39px] top-[60px] bottom-[60px] w-px bg-gradient-to-b from-neon-cyan/40 via-neon-purple/40 to-emerald-500/40" />

          <div className="space-y-6">
            {steps.map((step, i) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={i}
                  custom={i}
                  variants={stepVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  className="flex gap-5 lg:gap-8"
                >
                  {/* Step number + icon */}
                  <div className="flex flex-col items-center gap-0 shrink-0">
                    <div
                      className={`relative z-10 w-[52px] h-[52px] rounded-xl flex items-center justify-center ${iconBgMap[step.color]} border border-dark-border`}
                    >
                      <Icon className={`w-5 h-5 ${iconColorMap[step.color]}`} />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 glass-card rounded-2xl border border-dark-border/60 p-5 lg:p-6 hover:border-dark-border transition-colors duration-300 group">
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div>
                        <span className="text-xs font-mono text-gray-600 mb-1 block">
                          Etapa {step.step}
                        </span>
                        <h3 className="text-lg font-bold text-white group-hover:text-neon-cyan transition-colors duration-300">
                          {step.title}
                        </h3>
                      </div>
                      <span
                        className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full border ${colorMap[step.color]}`}
                      >
                        {step.highlight}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 leading-relaxed">{step.description}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Guarantees */}
        <AnimatedSection delay={0.3} className="mt-16">
          <div className="text-center mb-8">
            <h3 className="text-xl font-bold text-white">Nossas Garantias</h3>
          </div>
          <div className="grid sm:grid-cols-3 gap-5">
            {guarantees.map((g, i) => {
              const Icon = g.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.12, duration: 0.5 }}
                  className="glass-card rounded-2xl border border-dark-border/60 p-5 text-center hover:border-neon-cyan/20 transition-colors duration-300"
                >
                  <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-neon-cyan/10 mb-4">
                    <Icon className="w-5 h-5 text-neon-cyan" />
                  </div>
                  <h4 className="text-sm font-bold text-white mb-2">{g.title}</h4>
                  <p className="text-xs text-gray-500 leading-relaxed">{g.description}</p>
                </motion.div>
              );
            })}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
