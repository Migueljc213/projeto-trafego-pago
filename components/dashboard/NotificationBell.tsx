'use client'

import { useEffect, useRef, useState } from 'react'
import { Bell, Zap, Pause, TrendingUp, AlertTriangle, Eye, X } from 'lucide-react'

interface Notification {
  id: string
  type: 'pause' | 'scale' | 'alert' | 'insight'
  title: string
  description: string
  value?: string
  createdAt: string
  executed: boolean
}

const TYPE_ICON: Record<string, React.ReactNode> = {
  pause: <Pause className="w-3 h-3 text-gray-400" />,
  scale: <TrendingUp className="w-3 h-3 text-green-400" />,
  alert: <AlertTriangle className="w-3 h-3 text-orange-400" />,
  insight: <Eye className="w-3 h-3 text-neon-cyan" />,
}

const TYPE_DOT: Record<string, string> = {
  pause: 'bg-gray-400',
  scale: 'bg-green-400',
  alert: 'bg-orange-400',
  insight: 'bg-neon-cyan',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins}min atrás`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h atrás`
  return `${Math.floor(hrs / 24)}d atrás`
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  async function fetchNotifications() {
    setLoading(true)
    try {
      const res = await fetch('/api/notifications', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setNotifications(data.notifications ?? [])
        setUnread(data.unread ?? 0)
      }
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount + every 60s
  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 60_000)
    return () => clearInterval(interval)
  }, [])

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function handleOpen() {
    setOpen((v) => !v)
    if (!open) setUnread(0) // clear badge on open
  }

  return (
    <div ref={ref} className="relative">
      {/* Bell button */}
      <button
        onClick={handleOpen}
        title="Notificações da IA"
        className="relative flex items-center justify-center w-8 h-8 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-white/5 transition-all duration-200"
      >
        <Bell className="w-4 h-4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center rounded-full bg-neon-cyan text-[9px] font-bold text-dark-base leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-10 w-[320px] z-50 glass-card border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 text-neon-cyan" />
              <span className="text-sm font-semibold text-white">Decisões da IA</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="text-gray-600 hover:text-gray-300 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[380px] overflow-y-auto">
            {loading && notifications.length === 0 ? (
              <div className="flex items-center justify-center py-10">
                <div className="w-4 h-4 rounded-full border-2 border-neon-cyan border-t-transparent animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="w-6 h-6 text-gray-700 mx-auto mb-2" />
                <p className="text-xs text-gray-500">Nenhuma decisão da IA ainda</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-800/60">
                {notifications.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-white/3 transition-colors">
                    <span className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${TYPE_DOT[n.type] ?? 'bg-gray-500'}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {TYPE_ICON[n.type]}
                        <p className="text-xs font-semibold text-gray-200 truncate">{n.title}</p>
                      </div>
                      <p className="text-xs text-gray-500 leading-relaxed line-clamp-2">{n.description}</p>
                      <div className="flex items-center justify-between mt-1">
                        {n.value && (
                          <span className="text-[10px] text-neon-cyan/70 font-mono">{n.value}</span>
                        )}
                        <span className="text-[10px] text-gray-600 ml-auto">{timeAgo(n.createdAt)}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-800 text-center">
            <a href="/dashboard/campanhas" className="text-xs text-neon-cyan/70 hover:text-neon-cyan transition-colors">
              Ver todas as campanhas →
            </a>
          </div>
        </div>
      )}
    </div>
  )
}
