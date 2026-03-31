"use client";

import { motion } from "framer-motion";
import { ArrowRight, Zap, Shield, TrendingUp } from "lucide-react";
import FunnelVisual from "./FunnelVisual";

const badgeItems = [
  { icon: Shield, label: "White Glove CAPI Setup" },
  { icon: TrendingUp, label: "Full Funnel AI Diagnosis" },
  { icon: Zap, label: "Real-time Leak Detection" },
];

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      {/* Background effects */}
      <div className="absolute inset-0 grid-bg opacity-40" />
      <div className="absolute top-0 left-0 right-0 h-[70vh] bg-hero-gradient pointer-events-none" />
      <div className="absolute top-1/4 -left-40 w-80 h-80 bg-neon-purple/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 -right-40 w-96 h-96 bg-neon-cyan/8 rounded-full blur-[120px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left: Text Content */}
          <div>
            {/* Top badge */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-neon-cyan/30 bg-neon-cyan/5 mb-6"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon-cyan opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-neon-cyan" />
              </span>
              <span className="text-xs font-semibold text-neon-cyan tracking-wider uppercase">
                Now Accepting Beta Applications
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
              className="text-4xl sm:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight mb-6"
            >
              <span className="text-white">STOP BURNING</span>
              <br />
              <span className="text-gradient-cyan-purple">AD SPEND.</span>
              <br />
              <span className="text-white text-3xl sm:text-4xl lg:text-5xl font-bold">
                UNCOVER THE{" "}
                <span className="relative inline-block">
                  <span className="text-neon-cyan">&ldquo;WHY&rdquo;</span>
                  <motion.span
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-neon-cyan"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                  />
                </span>
                <br />
                BEHIND EVERY LOST SALE.
              </span>
            </motion.h1>

            {/* Subheadline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-lg text-gray-400 leading-relaxed mb-8 max-w-xl"
            >
              Our AI diagnoses your{" "}
              <span className="text-white font-semibold">funnel, not just your ads</span>. Instantly
              identify leaks in your{" "}
              <span className="text-neon-cyan font-semibold">Landing Page</span>,{" "}
              <span className="text-neon-purple font-semibold">Cart</span>, and{" "}
              <span className="text-white font-semibold">Competitor pricing</span>.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.45 }}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-10"
            >
              <motion.a
                href="#waitlist"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="relative inline-flex items-center gap-3 px-7 py-4 rounded-xl text-base font-bold text-white overflow-hidden group shadow-neon-cyan"
              >
                <span className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple" />
                <span className="absolute inset-0 bg-gradient-to-r from-neon-cyan via-blue-500 to-neon-purple opacity-0 group-hover:opacity-100 blur-xl transition-opacity duration-500" />
                <Zap className="relative w-5 h-5" />
                <span className="relative">Get Your Free Funnel Diagnosis</span>
                <ArrowRight className="relative w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
              </motion.a>

              <div className="flex items-center gap-2">
                <div className="flex -space-x-2">
                  {["#00D4FF", "#8B5CF6", "#3B82F6"].map((color, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-dark-base"
                      style={{ backgroundColor: color, opacity: 0.7 + i * 0.1 }}
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-500">
                  <span className="text-white font-semibold">47 brands</span> on waitlist
                </span>
              </div>
            </motion.div>

            {/* Badge pills */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              className="flex flex-wrap gap-3"
            >
              {badgeItems.map((item, i) => {
                const Icon = item.icon;
                return (
                  <div
                    key={i}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-dark-border bg-dark-card/60 text-xs text-gray-400"
                  >
                    <Icon className="w-3.5 h-3.5 text-neon-cyan" />
                    <span>{item.label}</span>
                  </div>
                );
              })}
            </motion.div>
          </div>

          {/* Right: Funnel Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            className="relative"
          >
            {/* Card wrapper */}
            <div className="relative glass-card rounded-2xl border border-dark-border/60 p-6 lg:p-8">
              {/* Top bar */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    {["bg-red-500", "bg-yellow-500", "bg-green-500"].map((c, i) => (
                      <div key={i} className={`w-2.5 h-2.5 rounded-full ${c} opacity-80`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600 font-mono ml-1">funnel_diagnosis.ai</span>
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-green-500/10 border border-green-500/20">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-400" />
                  </span>
                  <span className="text-xs text-green-400 font-mono">AI Active</span>
                </div>
              </div>

              <FunnelVisual />

              {/* Bottom stat row */}
              <div className="mt-6 grid grid-cols-3 gap-3 border-t border-dark-border/60 pt-5">
                {[
                  { label: "Revenue Leaked", value: "$23,400", color: "text-red-400" },
                  { label: "Issues Found", value: "7 Critical", color: "text-yellow-400" },
                  { label: "Potential ROAS", value: "+4.1x", color: "text-neon-cyan" },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <div className={`text-base font-bold font-mono ${stat.color}`}>{stat.value}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative glow */}
            <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-neon-cyan/20 via-transparent to-neon-purple/20 blur-sm -z-10" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
