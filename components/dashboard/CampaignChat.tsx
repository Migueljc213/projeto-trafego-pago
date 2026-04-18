'use client'

import { useState, useRef, useEffect } from 'react'
import { MessageSquare, Send, Loader2, Zap, X, ChevronDown } from 'lucide-react'
import type { CampaignRow } from '@/lib/dashboard-data'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const SUGGESTIONS = [
  'Por que meu ROAS está baixo?',
  'Quais campanhas devo pausar?',
  'Como melhorar meu CTR?',
  'Qual campanha está gastando mais rápido?',
]

interface Props {
  campaigns: CampaignRow[]
}

export default function CampaignChat({ campaigns }: Props) {
  const [open, setOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, open])

  async function send(text: string) {
    const question = text.trim()
    if (!question || loading) return
    setInput('')
    const newMessages: Message[] = [...messages, { role: 'user', content: question }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await fetch('/api/campaign-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: question, history: newMessages.slice(-8) }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.reply ?? data.error ?? 'Erro ao obter resposta',
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro de rede. Tente novamente.' }])
    } finally {
      setLoading(false)
    }
  }

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length

  return (
    <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
      {/* Header — clicável para expandir/recolher */}
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-800 hover:bg-white/2 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-neon-purple" />
          <div className="text-left">
            <p className="text-sm font-semibold text-white">Chat com a IA</p>
            <p className="text-xs text-gray-500">
              {activeCampaigns} campanha{activeCampaigns !== 1 ? 's' : ''} ativa{activeCampaigns !== 1 ? 's' : ''} no contexto
            </p>
          </div>
        </div>
        <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <>
          {/* Messages */}
          <div className="h-[320px] overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 text-center py-2">
                  Pergunte qualquer coisa sobre suas campanhas
                </p>
                <div className="grid grid-cols-1 gap-1.5">
                  {SUGGESTIONS.map(s => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      disabled={loading}
                      className="text-left px-3 py-2 rounded-lg border border-gray-800 text-xs text-gray-400 hover:border-neon-purple/40 hover:text-gray-200 hover:bg-neon-purple/5 transition-all"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-neon-purple/20 border border-neon-purple/30 text-gray-200'
                    : 'bg-gray-800/80 border border-gray-700 text-gray-300'
                }`}>
                  {m.role === 'assistant' && (
                    <div className="flex items-center gap-1 mb-1">
                      <Zap className="w-2.5 h-2.5 text-neon-purple" />
                      <span className="text-[10px] text-neon-purple font-semibold">FunnelGuard AI</span>
                    </div>
                  )}
                  {m.content.split('\n').map((line, j) => (
                    <p key={j}>{line || <br />}</p>
                  ))}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-gray-800/80 border border-gray-700 px-3 py-2 rounded-xl flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-neon-purple" />
                  <span className="text-xs text-gray-500">Analisando suas campanhas…</span>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 pb-4">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-1 text-[10px] text-gray-600 hover:text-gray-400 transition-colors mb-2"
              >
                <X className="w-3 h-3" /> Limpar conversa
              </button>
            )}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
                placeholder="Pergunte sobre suas campanhas…"
                disabled={loading}
                className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 focus:border-neon-purple focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={() => send(input)}
                disabled={!input.trim() || loading}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-neon-purple/20 border border-neon-purple/30 text-neon-purple hover:bg-neon-purple/30 transition-all disabled:opacity-40"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
