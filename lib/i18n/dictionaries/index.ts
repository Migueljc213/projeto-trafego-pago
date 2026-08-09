import * as common from './common'
import * as shell from './shell'
import * as account from './account'
import * as audit from './audit'
import * as campaigns from './campaigns'
import * as dashboardHome from './dashboardHome'
import * as landing from './landing'
import * as adminLoginLegal from './adminLoginLegal'

// Cada agente/feature adiciona seu próprio arquivo de namespace aqui.
export const dictionaries = {
  pt: {
    common: common.pt,
    ...shell.pt,
    account: account.pt,
    audit: audit.pt,
    campaigns: campaigns.pt,
    dashboardHome: dashboardHome.pt,
    landing: landing.pt,
    adminLoginLegal: adminLoginLegal.pt,
  },
  en: {
    common: common.en,
    ...shell.en,
    account: account.en,
    audit: audit.en,
    campaigns: campaigns.en,
    dashboardHome: dashboardHome.en,
    landing: landing.en,
    adminLoginLegal: adminLoginLegal.en,
  },
} as const
