import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "neon-cyan": "#00D4FF",
        "neon-purple": "#8B5CF6",
        "neon-blue": "#3B82F6",
        "dark-base": "#030712",
        "dark-card": "#0D1117",
        "dark-border": "#1F2937",
        "dark-surface": "#111827",
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        "hero-gradient": "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(0,212,255,0.15) 0%, transparent 60%)",
        "card-gradient": "linear-gradient(135deg, rgba(0,212,255,0.05) 0%, rgba(139,92,246,0.05) 100%)",
        "cta-gradient": "linear-gradient(135deg, #00D4FF 0%, #8B5CF6 100%)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
        "float": "float 3s ease-in-out infinite",
      },
      keyframes: {
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0,212,255,0.3), 0 0 10px rgba(0,212,255,0.1)" },
          "100%": { boxShadow: "0 0 20px rgba(0,212,255,0.6), 0 0 40px rgba(0,212,255,0.2)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      boxShadow: {
        "neon-cyan": "0 0 20px rgba(0,212,255,0.4)",
        "neon-purple": "0 0 20px rgba(139,92,246,0.4)",
        "card-hover": "0 0 30px rgba(0,212,255,0.15), 0 0 60px rgba(139,92,246,0.1)",
      },
    },
  },
  plugins: [],
};

export default config;
