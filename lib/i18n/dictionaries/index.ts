import * as common from './common'
import * as shell from './shell'

// Cada agente/feature adiciona seu próprio arquivo de namespace aqui.
export const dictionaries = {
  pt: {
    common: common.pt,
    ...shell.pt,
  },
  en: {
    common: common.en,
    ...shell.en,
  },
} as const
