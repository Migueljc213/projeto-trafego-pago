'use client'

import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { LANGUAGE_COOKIE, type Language, type Dictionary, getDictionary } from './language'

interface LanguageContextValue {
  language: Language
  setLanguage: (language: Language) => void
  dict: Dictionary
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({
  initialLanguage,
  children,
}: {
  initialLanguage: Language
  children: React.ReactNode
}) {
  const [language, setLanguageState] = useState<Language>(initialLanguage)

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next)
    document.cookie = `${LANGUAGE_COOKIE}=${next}; path=/; max-age=31536000; samesite=lax`
  }, [])

  const value = useMemo<LanguageContextValue>(
    () => ({ language, setLanguage, dict: getDictionary(language) }),
    [language, setLanguage]
  )

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used inside LanguageProvider')
  return ctx
}
