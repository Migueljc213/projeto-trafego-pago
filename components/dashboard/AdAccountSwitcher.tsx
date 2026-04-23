'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { ChevronDown, Building2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import type { AdAccountInfo } from '@/lib/dashboard-data'

interface Props {
  accounts: AdAccountInfo[]
  currentId: string
}

export default function AdAccountSwitcher({ accounts, currentId }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const current = accounts.find((a) => a.id === currentId) ?? accounts[0]

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  if (accounts.length <= 1) return null

  function select(id: string) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('account', id)
    router.push(`${pathname}?${params.toString()}`)
    setOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 px-3 py-2 rounded-lg glass-card border border-gray-700 hover:border-gray-500 transition-all text-sm text-gray-300"
      >
        <Building2 className="w-3.5 h-3.5 text-neon-cyan flex-shrink-0" />
        <span className="max-w-[160px] truncate">{current?.name ?? 'Selecionar conta'}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-64 glass-card border border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
          <p className="px-3 py-2 text-xs text-gray-500 border-b border-gray-800">
            Contas de Anúncio
          </p>
          {accounts.map((acc) => (
            <button
              key={acc.id}
              onClick={() => select(acc.id)}
              className={`w-full flex items-start gap-2 px-3 py-2.5 text-left hover:bg-white/5 transition-colors ${
                acc.id === currentId ? 'bg-neon-cyan/10' : ''
              }`}
            >
              <Building2 className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${acc.id === currentId ? 'text-neon-cyan' : 'text-gray-500'}`} />
              <div className="min-w-0">
                <p className={`text-sm truncate ${acc.id === currentId ? 'text-neon-cyan font-medium' : 'text-gray-300'}`}>
                  {acc.name}
                </p>
                <p className="text-xs text-gray-600 font-mono">{acc.metaAccountId}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
