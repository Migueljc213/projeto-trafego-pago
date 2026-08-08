// Sidebar, Header (landing) e layout do dashboard.
export const pt = {
  sidebar: {
    nav: {
      overview: 'Visão Geral',
      campaigns: 'Campanhas IA',
      diagnostics: 'Centro de Diagnóstico',
      funnelAudit: 'Auditoria de Funil',
      priceMonitor: 'Monitor de Preços',
      newCampaign: 'Nova Campanha',
      creativeLab: 'Lab de Criativos',
      plans: 'Planos',
      settings: 'Configurações',
      support: 'Suporte White Glove',
    },
    badgeNew: 'NOVO',
    aiActive: 'IA Ativa',
    viewProfile: 'Ver perfil',
    defaultUserName: 'Usuário',
    superAdmin: 'Super Admin',
    signOut: 'Sair',
  },
  header: {
    login: 'Entrar',
    getStarted: 'Começar Agora',
    navHow: 'Como Funciona',
    navFeatures: 'Recursos',
    navPricing: 'Preços',
  },
  dashboardLayout: {
    title: 'Dashboard | FunnelGuard AI',
    description: 'Gerencie suas campanhas, funil e concorrentes com IA',
  },
  languageSwitcher: {
    label: 'Idioma',
  },
} as const

export const en = {
  sidebar: {
    nav: {
      overview: 'Overview',
      campaigns: 'AI Campaigns',
      diagnostics: 'Diagnostic Center',
      funnelAudit: 'Funnel Audit',
      priceMonitor: 'Price Monitor',
      newCampaign: 'New Campaign',
      creativeLab: 'Creative Lab',
      plans: 'Plans',
      settings: 'Settings',
      support: 'White Glove Support',
    },
    badgeNew: 'NEW',
    aiActive: 'AI Active',
    viewProfile: 'View profile',
    defaultUserName: 'User',
    superAdmin: 'Super Admin',
    signOut: 'Sign out',
  },
  header: {
    login: 'Log in',
    getStarted: 'Get Started',
    navHow: 'How It Works',
    navFeatures: 'Features',
    navPricing: 'Pricing',
  },
  dashboardLayout: {
    title: 'Dashboard | FunnelGuard AI',
    description: 'Manage your campaigns, funnel and competitors with AI',
  },
  languageSwitcher: {
    label: 'Language',
  },
} satisfies typeof pt
