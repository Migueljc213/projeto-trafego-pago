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

// Only callable in Server Components — cookies() is a server-only API.
export async function getServerLanguage(): Promise<Language> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  return parseLanguage(store.get(LANGUAGE_COOKIE)?.value)
}
