'use client'

import { SessionProvider } from 'next-auth/react'
import { LanguageProvider } from '@/lib/i18n/LanguageContext'
import type { Language } from '@/lib/i18n/language'

export default function Providers({
  initialLanguage,
  children,
}: {
  initialLanguage: Language
  children: React.ReactNode
}) {
  return (
    <SessionProvider>
      <LanguageProvider initialLanguage={initialLanguage}>{children}</LanguageProvider>
    </SessionProvider>
  )
}
