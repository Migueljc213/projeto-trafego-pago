// Núcleo client-safe do sistema de idiomas — sem next/headers, pode ser importado por Client Components.
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
