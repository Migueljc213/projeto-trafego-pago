'use client'

import { useState, useTransition } from 'react'
import { FileSearch, X, Loader2, AlertTriangle, CheckCircle2, PauseCircle, TrendingUp, TrendingDown } from 'lucide-react'

interface LogEntry {
  id: string
  campaignName: string
  type: string
  reason: string
  executed: boolean
  createdAt: string
}

interface Props {
  userId: string
  userName: string
}

const TYPE_ICONS: Record<string, React.ReactNode> = {
  PAUSE: <PauseCircle className="w-3.5 h-3.5 text-red-400" />,
  SCALE: <TrendingUp className="w-3.5 h-3.5 text-green-400" />,
  REDUCE_BUDGET: <TrendingDown className="w-3.5 h-3.5 text-orange-400" />,
  MONITOR: <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />,
  NO_ACTION: <CheckCircle2 className="w-3.5 h-3.5 text-gray-500" />,
}

export default function AdminLogsModal({ userId, userName }: Props) {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isPending, startTransition] = useTransition()

  function openModal() {
    setOpen(true)
    if (logs.length === 0) {
      startTransition(async () => {
        const res = await fetch(`/api/admin/user-logs?userId=${encodeURIComponent(userId)}`)
        if (res.ok) {
          const data = await res.json() as { logs: LogEntry[] }
          setLogs(data.logs)
        }
      })
    }
  }

  return (
    <>
      <button
        onClick={openModal}
        className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-500 transition-all"
      >
        <FileSearch className="w-3.5 h-3.5" />
        Logs
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-800">
              <div>
                <p className="text-sm font-bold text-white">Logs IA — {userName}</p>
                <p className="text-xs text-gray-500 mt-0.5">Últimas 20 decisões do Auto-Pilot</p>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg text-gray-500 hover:text-white hover:bg-white/5 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto p-4 space-y-2">
              {isPending && (
                <div className="flex items-center justify-center py-12 gap-3 text-gray-500">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Carregando logs…</span>
                </div>
              )}

              {!isPending && logs.length === 0 && (
                <div className="py-12 text-center text-sm text-gray-600">
                  Nenhum log de decisão encontrado para este usuário.
                </div>
              )}

              {!isPending && logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-gray-800 bg-white/2 hover:bg-white/3 transition-colors"
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {TYPE_ICONS[log.type] ?? <AlertTriangle className="w-3.5 h-3.5 text-gray-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-gray-300 truncate">{log.campaignName}</span>
                      <span className="text-[10px] font-bold text-gray-600 ml-auto flex-shrink-0">{log.type}</span>
                      {log.executed && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 flex-shrink-0">
                          Executado
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{log.reason}</p>
                    <p className="text-[10px] text-gray-700 mt-1 font-mono">{log.createdAt}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-800 flex justify-end">
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-white hover:border-gray-600 transition-all"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
