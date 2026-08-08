'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import type { Language } from '@/lib/i18n/language'

const OPTIONS: { code: Language; label: string }[] = [
  { code: 'pt', label: 'PT' },
  { code: 'en', label: 'EN' },
]

export default function LanguageSwitcher({ className = '' }: { className?: string }) {
  const { language, setLanguage, dict } = useLanguage()

  return (
    <div
      role="group"
      aria-label={dict.languageSwitcher.label}
      className={`inline-flex items-center rounded-lg border border-gray-700 bg-white/5 p-0.5 ${className}`}
    >
      {OPTIONS.map((opt) => (
        <button
          key={opt.code}
          type="button"
          onClick={() => setLanguage(opt.code)}
          aria-pressed={language === opt.code}
          className={`px-2 py-1 text-xs font-semibold rounded-md transition-colors ${
            language === opt.code
              ? 'bg-neon-cyan/10 text-neon-cyan border border-neon-cyan/30'
              : 'text-gray-400 hover:text-gray-200 border border-transparent'
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
