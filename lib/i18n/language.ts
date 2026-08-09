// Núcleo server-only do sistema de idiomas — usa next/headers, só pode ser importado em Server Components.
import { cookies } from 'next/headers'
import { LANGUAGE_COOKIE, parseLanguage, type Language } from './dictionary'

export { LANGUAGE_COOKIE, DEFAULT_LANGUAGE, getDictionary, parseLanguage } from './dictionary'
export type { Language, Dictionary } from './dictionary'

// Uso em Server Components / layouts para renderizar texto já no idioma correto.
export async function getServerLanguage(): Promise<Language> {
  const { cookies } = await import('next/headers')
  const store = await cookies()
  return parseLanguage(store.get(LANGUAGE_COOKIE)?.value)
}
