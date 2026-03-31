"use client";

import { motion } from "framer-motion";
import { MousePointerClick, FileText, ShoppingCart, CreditCard, AlertTriangle, DollarSign } from "lucide-react";

const funnelSteps = [
  {
    id: "ad",
    icon: MousePointerClick,
    label: "Ad Click",
    sublabel: "1,000 clicks",
    color: "from-neon-cyan to-blue-500",
    borderColor: "border-neon-cyan/40",
    bgColor: "bg-neon-cyan/10",
    width: "w-full",
    leak: null,
  },
  {
    id: "lp",
    icon: FileText,
    label: "Landing Page",
    sublabel: "340 visits",
    color: "from-yellow-400 to-orange-500",
    borderColor: "border-yellow-500/40",
    bgColor: "bg-yellow-500/10",
    width: "w-4/5",
    leak: {
      label: 'Error: Button Hidden (iOS)',
      sublabel: "-660 lost here",
    },
  },
  {
    id: "cart",
    icon: ShoppingCart,
    label: "Checkout",
    sublabel: "89 sessions",
    color: "from-orange-500 to-red-500",
    borderColor: "border-orange-500/40",
    bgColor: "bg-orange-500/10",
    width: "w-3/5",
    leak: {
      label: "Competitor 15% Cheaper",
      sublabel: "-251 abandoned",
    },
  },
  {
    id: "purchase",
    icon: CreditCard,
    label: "Purchase",
    sublabel: "24 conversions",
    color: "from-green-400 to-emerald-500",
    borderColor: "border-green-500/40",
    bgColor: "bg-green-500/10",
    width: "w-2/5",
    leak: null,
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.25,
    },
  },
};

const stepVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
};

const leakVariants = {
  hidden: { opacity: 0, x: 20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: "easeOut", delay: 0.3 },
  },
};

const moneyVariants = {
  initial: { opacity: 0, y: -5 },
  animate: {
    opacity: [0, 1, 1, 0],
    y: [0, 15, 25, 35],
    transition: {
      duration: 2,
      repeat: Infinity,
      repeatDelay: 0.5,
      ease: "easeIn",
    },
  },
};

export default function FunnelVisual() {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative w-full max-w-lg mx-auto"
    >
      {/* Glow background */}
      <div className="absolute inset-0 bg-gradient-radial from-neon-cyan/5 via-transparent to-transparent rounded-3xl pointer-events-none" />

      <div className="relative space-y-1">
        {funnelSteps.map((step, i) => {
          const Icon = step.icon;
          return (
            <motion.div key={step.id} variants={stepVariants} className="relative flex items-center gap-4">
              {/* Funnel step */}
              <div className={`relative ${step.width} transition-all duration-500`}>
                <div
                  className={`glass-card rounded-xl border ${step.borderColor} ${step.bgColor} p-3 flex items-center gap-3 group hover:scale-[1.02] transition-transform duration-200`}
                >
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${step.color} bg-opacity-20`}>
                    <Icon className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-white truncate">{step.label}</div>
                    <div className="text-xs text-gray-400">{step.sublabel}</div>
                  </div>
                  {/* ROAS indicator */}
                  {step.id === "purchase" && (
                    <div className="shrink-0 text-xs font-mono font-semibold text-green-400 bg-green-400/10 px-2 py-1 rounded-md">
                      ROAS 2.4x
                    </div>
                  )}
                </div>
              </div>

              {/* Leak badge */}
              {step.leak && (
                <motion.div
                  variants={leakVariants}
                  className="shrink-0 flex items-start gap-2"
                >
                  {/* Money drops */}
                  <div className="flex flex-col items-center gap-0.5 relative">
                    {[0, 0.6, 1.2].map((delay, di) => (
                      <motion.div
                        key={di}
                        variants={moneyVariants}
                        initial="initial"
                        animate="animate"
                        style={{ animationDelay: `${delay}s` } as React.CSSProperties}
                        className="text-red-400"
                      >
                        <DollarSign className="w-3.5 h-3.5" />
                      </motion.div>
                    ))}
                  </div>
                  <div className="glass-card border border-red-500/30 bg-red-500/5 rounded-lg px-3 py-2 max-w-[160px]">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <AlertTriangle className="w-3 h-3 text-red-400 shrink-0" />
                      <span className="text-xs font-mono font-semibold text-red-300 leading-tight">
                        {step.leak.label}
                      </span>
                    </div>
                    <span className="text-xs text-red-400/70">{step.leak.sublabel}</span>
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Bottom conversion rate */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5 }}
        className="mt-4 glass-card border border-dark-border rounded-xl p-3 flex items-center justify-between"
      >
        <span className="text-xs text-gray-500 font-mono">Actual Conversion Rate</span>
        <div className="flex items-center gap-3">
          <span className="text-xs text-red-400 font-mono line-through">Expected: 4.8%</span>
          <span className="text-sm font-bold text-red-400 font-mono">2.4%</span>
          <div className="text-xs text-neon-cyan font-mono bg-neon-cyan/10 px-2 py-0.5 rounded-md">
            AI Fix: +2.4%
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
