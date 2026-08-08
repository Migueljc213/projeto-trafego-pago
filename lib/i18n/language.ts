// Núcleo do sistema de idiomas — sem 'use client', pode ser importado em Server Components.
import { cookies } from 'next/headers'
import { dictionaries } from './dictionaries'

export type Language = 'pt' | 'en'

export const LANGUAGE_COOKIE = 'fg_lang'
export const DEFAULT_LANGUAGE: Language = 'pt'

export type Dictionary = typeof dictionaries.pt

export function getDictionary(language: Language): Dictionary {
  return dictionaries[language]
}

export function parseLanguage(value: string | undefined | null): Language {
  return value === 'en' ? 'en' : DEFAULT_LANGUAGE
}

// Uso em Server Components / layouts para renderizar texto já no idioma correto.
export async function getServerLanguage(): Promise<Language> {
  const store = await cookies()
  return parseLanguage(store.get(LANGUAGE_COOKIE)?.value)
}
