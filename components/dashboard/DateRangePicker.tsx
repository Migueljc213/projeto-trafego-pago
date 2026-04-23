'use client'

import { useRouter, usePathname, useSearchParams } from 'next/navigation'

const OPTIONS = [
  { label: '7d', days: 7 },
  { label: '30d', days: 30 },
  { label: '90d', days: 90 },
] as const

interface Props {
  currentDays: number
}

export default function DateRangePicker({ currentDays }: Props) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  function select(days: number) {
    const params = new URLSearchParams(searchParams.toString())
    params.set('days', String(days))
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="flex items-center gap-1 p-1 rounded-lg glass-card border border-gray-800">
      {OPTIONS.map((opt) => (
        <button
          key={opt.days}
          onClick={() => select(opt.days)}
          className={`px-3 py-1 rounded-md text-xs font-medium transition-all ${
            currentDays === opt.days
              ? 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
