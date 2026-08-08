"use client";

import { motion } from "framer-motion";
import { useRef } from "react";
import { useInView } from "framer-motion";
import { X, Check, Minus, Zap, ArrowRight } from "lucide-react";
import AnimatedSection from "./AnimatedSection";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const rowStatuses = [
  { tradicional: "yes", funnelguard: "yes" },
  { tradicional: "no", funnelguard: "yes" },
  { tradicional: "no", funnelguard: "yes" },
  { tradicional: "no", funnelguard: "yes" },
  { tradicional: "partial", funnelguard: "yes" },
  { tradicional: "no", funnelguard: "yes" },
  { tradicional: "partial", funnelguard: "yes" },
  { tradicional: "partial", funnelguard: "yes" },
  { tradicional: "partial", funnelguard: "yes" },
  { tradicional: "no", funnelguard: "yes" },
];

const StatusIcon = ({ status }: { status: string }) => {
  if (status === "yes")
    return (
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-green-500/15">
        <Check className="w-3.5 h-3.5 text-green-400" />
      </div>
    );
  if (status === "no")
    return (
      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-red-500/15">
        <X className="w-3.5 h-3.5 text-red-400" />
      </div>
    );
  return (
    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-yellow-500/15">
      <Minus className="w-3.5 h-3.5 text-yellow-400" />
    </div>
  );
};

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, delay: i * 0.07, ease: "easeOut" },
  }),
};

export default function ComparisonSection() {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px 0px" });
  const { dict } = useLanguage();

  const comparisonRows = rowStatuses.map((status, i) => ({
    feature: dict.landing.comparison.rows[i].feature,
    tradicional: { status: status.tradicional, note: dict.landing.comparison.rows[i].traditionalNote },
    funnelguard: { status: status.funnelguard, note: dict.landing.comparison.rows[i].funnelguardNote },
  }));

  return (
    <section id="comparison" className="relative py-24 lg:py-32 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 grid-bg opacity-20" />
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-neon-purple/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section header */}
        <AnimatedSection className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-purple/30 bg-neon-purple/5 mb-6">
            <Zap className="w-3.5 h-3.5 text-neon-purple" />
            <span className="text-xs font-semibold text-neon-purple tracking-wider uppercase">
              {dict.landing.comparison.sectionBadge}
            </span>
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black leading-tight mb-6">
            <span className="text-white">{dict.landing.comparison.heading.part1}</span>
            <span className="text-gradient-cyan-purple">{dict.landing.comparison.heading.part2}</span>
          </h2>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            {dict.landing.comparison.description.prefix}{" "}
            <span className="text-white font-semibold">{dict.landing.comparison.description.bold1}</span>. {dict.landing.comparison.description.middle}{" "}
            <span className="text-neon-cyan font-semibold">{dict.landing.comparison.description.bold2}</span> {dict.landing.comparison.description.suffix}
          </p>
        </AnimatedSection>

        {/* Comparison Table */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="min-w-[640px]">
            {/* Table header */}
            <AnimatedSection>
              <div className="grid grid-cols-[1fr_180px_180px] gap-3 mb-3 px-4">
                <div className="text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {dict.landing.comparison.table.capability}
                </div>
                <div className="text-center">
                  <div className="glass-card border border-dark-border rounded-xl px-4 py-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                      {dict.landing.comparison.table.traditional}
                    </div>
                    <div className="text-xs text-gray-600 mt-0.5">{dict.landing.comparison.table.traditionalSub}</div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="relative rounded-xl px-4 py-3 border border-neon-cyan/30 bg-neon-cyan/5">
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-neon-cyan to-neon-purple text-xs font-bold text-white whitespace-nowrap">
                      {dict.landing.comparison.table.recommended}
                    </div>
                    <div className="flex items-center justify-center gap-1.5 mt-1">
                      <Zap className="w-3 h-3 text-neon-cyan" />
                      <span className="text-xs font-bold text-neon-cyan">FunnelGuard AI</span>
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{dict.landing.comparison.table.funnelguardSub}</div>
                  </div>
                </div>
              </div>
            </AnimatedSection>

            {/* Table rows */}
            <div ref={ref} className="space-y-2">
              {comparisonRows.map((row, i) => (
                <motion.div
                  key={i}
                  custom={i}
                  variants={rowVariants}
                  initial="hidden"
                  animate={isInView ? "visible" : "hidden"}
                  className={`grid grid-cols-[1fr_180px_180px] gap-3 items-center px-4 py-3.5 rounded-xl border transition-all duration-200 ${
                    i % 2 === 0
                      ? "bg-dark-card/40 border-dark-border/40"
                      : "bg-transparent border-transparent"
                  } hover:bg-dark-card/60 hover:border-dark-border/60`}
                >
                  <div className="text-sm text-gray-300 font-medium">{row.feature}</div>

                  {/* Tradicional */}
                  <div className="flex items-center justify-center gap-2">
                    <StatusIcon status={row.tradicional.status} />
                    <span className="text-xs text-gray-600 hidden sm:block">{row.tradicional.note}</span>
                  </div>

                  {/* FunnelGuard */}
                  <div className="flex items-center justify-center gap-2">
                    <StatusIcon status={row.funnelguard.status} />
                    <span
                      className={`text-xs hidden sm:block ${
                        row.funnelguard.status === "yes" ? "text-neon-cyan/70" : "text-gray-600"
                      }`}
                    >
                      {row.funnelguard.note}
                    </span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Score summary */}
        <AnimatedSection delay={0.4} className="mt-10">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="glass-card rounded-2xl border border-dark-border p-6 text-center">
              <div className="text-4xl font-black text-gray-600 mb-1">3/10</div>
              <div className="text-sm text-gray-500">{dict.landing.comparison.score.traditionalLabel}</div>
              <div className="text-xs text-gray-600 mt-2">
                {dict.landing.comparison.score.traditionalNote}
              </div>
            </div>
            <div className="relative glass-card rounded-2xl border border-neon-cyan/30 bg-neon-cyan/5 p-6 text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-radial from-neon-cyan/10 via-transparent to-transparent" />
              <div className="relative text-4xl font-black text-gradient-cyan-purple mb-1">10/10</div>
              <div className="relative text-sm text-gray-300 font-semibold">FunnelGuard AI</div>
              <div className="relative text-xs text-gray-500 mt-2">
                {dict.landing.comparison.score.funnelguardNote}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <motion.a
              href="#waitlist"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm font-bold text-dark-base bg-gradient-to-r from-neon-cyan to-neon-purple hover:opacity-90 transition-opacity"
            >
              {dict.landing.comparison.cta}
              <ArrowRight className="w-4 h-4" />
            </motion.a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
