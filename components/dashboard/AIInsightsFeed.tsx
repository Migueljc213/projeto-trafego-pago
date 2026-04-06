'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { XOctagon, AlertTriangle, TrendingUp, Search, Bell } from 'lucide-react'
import type { FeedInsight } from '@/lib/dashboard-data'
import { SkeletonFeedItem } from './SkeletonCards'

const insightConfig = {
  pause: { icon: XOctagon, label: 'PAUSE', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20', dotColor: 'bg-red-400' },
  alert: { icon: AlertTriangle, label: 'ALERTA', color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', dotColor: 'bg-orange-400' },
  scale: { icon: TrendingUp, label: 'SCALE', color: 'text-green-400', bg: 'bg-green-500/10', border: 'border-green-500/20', dotColor: 'bg-green-400' },
  insight: { icon: Search, label: 'INSIGHT', color: 'text-neon-cyan', bg: 'bg-neon-cyan/10', border: 'border-neon-cyan/20', dotColor: 'bg-neon-cyan' },
}

function InsightItem({ insight, isNew }: { insight: FeedInsight; isNew?: boolean }) {
  const cfg = insightConfig[insight.type]
  const Icon = cfg.icon
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`p-3 rounded-lg border transition-all duration-200 ${cfg.bg} ${cfg.border} ${isNew ? 'ring-1 ring-neon-cyan/30' : ''}`}
    >
      <div className="flex items-start gap-2">
        <div className="flex items-center gap-1 flex-shrink-0 mt-0.5">
          <div className={`w-1.5 h-1.5 rounded-full ${cfg.dotColor} flex-shrink-0`} />
          <Icon className={`w-3.5 h-3.5 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs text-gray-500">[{insight.timestamp}]</span>
            <span className={`text-xs font-bold tracking-wider ${cfg.color}`}>{cfg.label}</span>
            {isNew && <span className="text-xs px-1 py-0.5 rounded bg-neon-cyan/20 text-neon-cyan font-medium border border-neon-cyan/30">NOVO</span>}
          </div>
          <p className="text-xs font-semibold text-gray-200 leading-snug mb-1">{insight.title}</p>
          <p className="text-xs text-gray-400 leading-relaxed">{insight.description}</p>
          {insight.value && (
            <div className={`mt-1.5 inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono font-medium ${cfg.color} bg-black/20`}>
              {insight.value}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

export default function AIInsightsFeed({ insights }: { insights: FeedInsight[] }) {
  const [unreadCount, setUnreadCount] = useState(Math.min(2, insights.length))
  const [newIds, setNewIds] = useState<Set<string>>(new Set(insights.slice(0, 2).map(i => i.id)))
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = 0
  }, [])

  if (insights.length === 0) {
    return (
      <div className="glass-card rounded-xl border border-gray-800 flex items-center justify-center min-h-[200px]">
        <p className="text-gray-500 text-sm">Nenhuma decisão da IA ainda.</p>
      </div>
    )
  }

  return (
    <div className="glass-card rounded-xl border border-gray-800 flex flex-col h-full min-h-[500px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 bg-black/30 rounded-t-xl flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70" />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70" />
            <div className="w-3 h-3 rounded-full bg-green-500/70" />
          </div>
          <span className="font-mono text-xs text-gray-500 ml-1">ai-insights.log</span>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <button
              onClick={() => { setUnreadCount(0); setNewIds(new Set()) }}
              className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-neon-cyan/10 border border-neon-cyan/20 text-neon-cyan text-xs font-medium hover:bg-neon-cyan/20 transition-colors"
            >
              <Bell className="w-3 h-3" />
              <span>{unreadCount} novos</span>
            </button>
          )}
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse block" />
            <span className="font-mono text-xs text-green-400">LIVE</span>
          </div>
        </div>
      </div>

      <div className="px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <h3 className="text-sm font-semibold text-white">Feed de Insights da IA</h3>
        <p className="text-xs text-gray-500 mt-0.5">Ações e alertas em tempo real</p>
      </div>

      <div ref={feedRef} className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin" style={{ maxHeight: '420px' }}>
        <AnimatePresence initial={false}>
          {insights.map(insight => (
            <InsightItem key={insight.id} insight={insight} isNew={newIds.has(insight.id)} />
          ))}
        </AnimatePresence>
      </div>

      <div className="px-4 py-2.5 border-t border-gray-800 bg-black/20 rounded-b-xl flex-shrink-0">
        <div className="flex items-center justify-between">
          <span className="font-mono text-xs text-gray-600">{insights.length} eventos</span>
          <span className="font-mono text-xs text-green-400/60">&gt; monitorando 24/7_</span>
        </div>
      </div>
    </div>
  )
}
