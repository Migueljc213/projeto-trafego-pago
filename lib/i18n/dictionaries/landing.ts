// Landing page (marketing): Hero, Problem, Comparison, Simulator, White Glove, Waitlist,
// FunnelVisual, Demo/Facebook login buttons and the global error page.
export const pt = {
  hero: {
    badges: {
      whiteGlove: 'White Glove CAPI Setup',
      fullFunnel: 'Full Funnel AI Diagnosis',
      leakDetection: 'Detecção de Vazamentos em Tempo Real',
    },
    betaBadge: 'Aceitando Inscrições para o Beta',
    headline: {
      line1: 'PARE DE QUEIMAR',
      line2: 'VERBA DE ADS.',
      line3Prefix: 'DESCUBRA O',
      why: '“PORQUÊ”',
      line3Suffix: 'DE CADA VENDA PERDIDA.',
    },
    subheadline: {
      prefix: 'Nossa IA diagnostica seu',
      boldFunnel: 'funil, não só seus anúncios',
      middle: 'Identifique instantaneamente os vazamentos na sua',
      lp: 'Landing Page',
      cart: 'Carrinho',
      and: 'e',
      boldCompetitor: 'preços dos concorrentes',
    },
    ctaButton: 'Receba Seu Diagnóstico de Funil Gratuito',
    waitlistCount: '47 marcas',
    waitlistSuffix: 'na lista de espera',
    stats: {
      lostRevenueLabel: 'Receita Perdida',
      lostRevenueValue: '$23.400',
      issuesLabel: 'Problemas Encontrados',
      issuesValue: '7 Críticos',
      roasLabel: 'ROAS Potencial',
      roasValue: '+4.1x',
    },
  },
  problem: {
    sectionBadge: 'O Problema Real',
    heading: {
      line1: 'A Pergunta de R$10.000 Que Seu',
      line2: 'Gestor Não Consegue Responder:',
      line3: 'Por Que Não Compraram?',
    },
    description: {
      prefix: 'Seus anúncios estão fazendo o trabalho deles. O problema é tudo',
      bold: 'depois do clique',
      suffix: '— e ninguém está monitorando isso. Até agora.',
    },
    items: [
      {
        title: 'Armadilha das Métricas de Vaidade',
        subtitle: 'Muitos cliques, zero conversões',
        description:
          'Seu gestor comemora 5.000 cliques. Mas ninguém pergunta por que só 12 pessoas compraram. Clique é centro de custo, não KPI.',
        tag: 'Ponto Cego do Gestor',
      },
      {
        title: 'Choque do Frete',
        subtitle: 'R$18 de frete num produto de R$35',
        description:
          'Seu concorrente oferece frete grátis acima de R$30. Você não sabe disso. O cliente adiciona ao carrinho, vê o frete e abandona. Em silêncio.',
        tag: 'Perdido no Checkout',
      },
      {
        title: 'UX Quebrado no Mobile',
        subtitle: 'Seu botão CTA está invisível no iOS',
        description:
          'Um conflito de CSS esconde seu botão de compra no Safari/iOS. 60% do seu tráfego é mobile. Você está pagando por anúncios que levam pessoas a uma página quebrada há 3 semanas.',
        tag: 'LP UX Error',
      },
      {
        title: 'Zero Inteligência Competitiva',
        subtitle: 'Navegando às cegas numa guerra de preços',
        description:
          'Você definiu seu preço uma vez e esqueceu. Enquanto isso, os concorrentes ajustam diariamente. Você é a opção mais cara da categoria e nem sabe disso.',
        tag: 'Ponto Cego Competitivo',
      },
      {
        title: 'Dados Fantasma (Falhas no Pixel)',
        subtitle: 'Apenas 52% das conversões rastreadas',
        description:
          'O iOS 14+ destruiu seu pixel. Sem CAPI configurado, o algoritmo da Meta otimiza com metade dos dados — gastando orçamento total, aprendendo com ruído.',
        tag: 'Integridade de Dados',
      },
      {
        title: 'Ad Fatigue Ignorado',
        subtitle: 'Mesmo criativo por 60 dias',
        description:
          'A frequência chegou a 9,4. Cada nova impressão é um lembrete de algo que seu público já rejeitou. Mas seu dashboard só mostra o CPM subindo.',
        tag: 'Performance do Criativo',
      },
    ],
    callout: {
      part1: 'Todos esses problemas são',
      highlight: 'invisíveis para gestores de anúncios tradicionais.',
      part2: 'FunnelGuard AI os detecta. Automaticamente. Em tempo real.',
    },
  },
  comparison: {
    sectionBadge: 'A Vantagem Injusta',
    heading: { part1: 'Nossa Solução', part2: ' vs. Ferramentas Tradicionais' },
    description: {
      prefix: 'Ferramentas tradicionais são ótimas',
      bold1: 'dentro da plataforma de anúncios',
      middle: 'FunnelGuard AI cobre os outros',
      bold2: '80% do seu funil',
      suffix: 'que elas ignoram.',
    },
    table: {
      capability: 'Capacidade',
      traditional: 'Tradicional',
      traditionalSub: 'Foco Apenas em Ads',
      recommended: 'Recomendado',
      funnelguardSub: 'Diagnóstico de Funil Completo',
    },
    rows: [
      { feature: 'Monitoramento de Performance de Ads', traditionalNote: 'Funcionalidade principal', funnelguardNote: 'Incluído' },
      { feature: 'Landing Page UX Analysis', traditionalNote: 'Indisponível', funnelguardNote: 'AI-powered audit' },
      { feature: 'Mobile/iOS Rendering Check', traditionalNote: 'Indisponível', funnelguardNote: 'Monitoramento em tempo real' },
      { feature: 'Monitoramento de Preços dos Concorrentes', traditionalNote: 'Indisponível', funnelguardNote: 'Benchmarking diário' },
      { feature: 'Diagnóstico de Abandono de Checkout', traditionalNote: 'Limitado', funnelguardNote: 'Análise de causa raiz' },
      { feature: 'CAPI Setup (White Glove)', traditionalNote: 'DIY only', funnelguardNote: 'Feito para você' },
      { feature: 'Meta Pixel Audit & Repair', traditionalNote: 'Verificação básica', funnelguardNote: 'Setup completo + validação' },
      { feature: 'Atribuição de Receita do Funil Completo', traditionalNote: 'Apenas nível de ad', funnelguardNote: 'Do clique à compra' },
      { feature: 'Recomendações de Correção por IA', traditionalNote: 'Sugestões de ads', funnelguardNote: 'Correções de funil completo' },
      { feature: 'Especialista de Onboarding Dedicado', traditionalNote: 'Self-serve', funnelguardNote: 'White glove only' },
    ],
    score: {
      traditionalLabel: 'Ferramenta / Gestor Tradicional',
      traditionalNote: 'Excelente em otimização de ads. Cego para tudo mais.',
      funnelguardNote: 'Cobertura total do funil, do clique à conversão.',
    },
    cta: 'Obtenha Cobertura Total do Funil',
  },
  simulator: {
    sectionBadge: 'Simulador de IA Interativo',
    heading: { part1: 'O Simulador de Lucro', part2: 'com IA' },
    description:
      'Arraste o controle para ver quanta receita você está deixando na mesa — e quanto vale corrigir cada vazamento do seu funil.',
    budgetLabel: 'Orçamento Mensal de Ads',
    benchmarkNote: 'Baseado em benchmarks da indústria',
    currentRoasLabel: 'ROAS Atual',
    projectedRoasLabel: 'Com FunnelGuard AI',
    revenueGainLabel: 'Receita Adicional / Mês',
    annualGainLabel: 'Ganho anual',
    breakdownLabel: 'Detalhamento por tipo de correção',
    disclaimer:
      '* Estimativas baseadas em melhorias médias de taxa de conversão da indústria. Os resultados reais variam conforme a saúde atual do funil, nicho e qualidade do tráfego. Resultados geralmente observados entre 30 e 90 dias após a implementação.',
    bottomCtaText:
      'Pronto para descobrir seus números reais? Vamos rodar um diagnóstico ao vivo no seu funil.',
    bottomCtaButton: 'Reivindique Seu Diagnóstico de Funil Gratuito',
  },
  whiteGlove: {
    sectionBadge: 'White Glove Onboarding',
    heading: { part1: 'Não Entregamos um Login.', part2: 'Configuramos Tudo.' },
    description: {
      prefix:
        'A maioria das ferramentas te joga num dashboard e te deseja boa sorte. FunnelGuard AI é diferente:',
      bold: 'um especialista humano configura seu CAPI e Pixel manualmente',
      suffix: 'para garantir 100% de precisão nos dados antes de a IA assumir.',
    },
    stepLabel: 'Etapa',
    steps: [
      {
        title: 'Discovery Call (30 min)',
        description:
          'Um especialista dedicado mapeia toda a sua stack: CRM, plataforma de e-commerce, contas de anúncios e configuração atual do pixel. Sem formulários, sem bots.',
        highlight: 'Conduzido por humanos',
      },
      {
        title: 'CAPI + Pixel Setup',
        description:
          'Configuramos manualmente sua integração server-side com a Conversions API, garantindo 100% de deduplicação de eventos e precisão de dados à prova de iOS. Escrevemos o código. Verificamos cada evento.',
        highlight: 'Feito para você',
      },
      {
        title: 'Funnel Baseline Audit',
        description:
          'Nossa IA executa um diagnóstico completo nas suas landing pages, fluxo de checkout e preços dos concorrentes. Você recebe uma lista priorizada de correções em até 24h.',
        highlight: 'AI-powered',
      },
      {
        title: 'Go Live & Monitoramento',
        description:
          'FunnelGuard AI entra em operação monitorando seu funil 24/7. Você recebe relatórios semanais de lucro com ações específicas. Sem dashboards para verificar — a gente traz o que importa.',
        highlight: 'Automatizado',
      },
    ],
    guaranteesTitle: 'Nossas Garantias',
    guarantees: [
      {
        title: 'Garantia de 100% de Precisão nos Dados',
        description:
          'Se o seu CAPI setup não capturar pelo menos 95% dos seus eventos de compra reais em 7 dias, corrigimos gratuitamente — sem perguntas.',
      },
      {
        title: 'Sem Contratos de Fidelidade',
        description:
          'Cancele quando quiser. O código do CAPI, a configuração do pixel e os relatórios de auditoria são seus. Ganhamos sua fidelidade entregando resultados, não te prendendo.',
      },
      {
        title: 'Conformidade SOC 2 no Tratamento de Dados',
        description:
          'Seus dados empresariais nunca treinam modelos públicos de IA. Todo o processamento é isolado por conta com criptografia de nível empresarial.',
      },
    ],
  },
  waitlist: {
    submittingText: 'Processando sua inscrição...',
    submitButton: 'Solicitar Acesso Beta',
    limitedBetaBadge: 'Beta Limitado — 47 Vagas Restantes',
    heading: { part1: 'Pare de Adivinhar.', part2: 'Comece a Diagnosticar.' },
    description: {
      prefix: 'Solicite acesso beta e ganhe um',
      bold: 'White Glove onboarding gratuito',
      suffix:
        '— configuramos seu CAPI, auditamos seu funil e mostramos exatamente onde você está perdendo dinheiro.',
    },
    successTitle: 'Você está na lista!',
    successNote: 'Verifique seu e-mail para confirmação',
    emailLabel: 'E-mail Corporativo',
    websiteLabel: 'URL do Site / Loja',
    privacy: {
      prefix: 'Não é necessário cartão de crédito. Ao se inscrever, você concorda com nossa',
      link: 'Política de Privacidade',
    },
    trustBadges: {
      whiteGlove: 'White Glove Setup Incluído',
      noLockIn: 'Sem Contratos de Fidelidade',
      soc2: 'SOC 2 Compliant',
      response: 'Resposta em até 48h',
    },
  },
  funnelVisual: {
    steps: {
      ad: { label: 'Clique no Ad', sublabel: '1.000 cliques' },
      lp: {
        label: 'Landing Page',
        sublabel: '340 visitas',
        leakLabel: 'Erro: Botão Oculto (iOS)',
        leakSublabel: '-660 perdidos aqui',
      },
      cart: {
        label: 'Checkout',
        sublabel: '89 sessões',
        leakLabel: 'Concorrente 15% Mais Barato',
        leakSublabel: '-251 abandonaram',
      },
      purchase: { label: 'Compra', sublabel: '24 conversões' },
    },
    conversionRateLabel: 'Taxa de Conversão Real',
    expectedLabel: 'Esperado: 4.8%',
  },
  demoLogin: {
    loading: 'Entrando...',
    default: 'Entrar em Modo Demo',
  },
  facebookLogin: {
    loading: 'Conectando...',
    default: 'Continuar com Facebook',
  },
  errorPage: {
    title: 'Erro crítico da aplicação',
    description: 'Um erro inesperado impediu o carregamento. Tente recarregar a página.',
    reload: 'Recarregar',
    home: 'Início',
  },
}

export const en = {
  hero: {
    badges: {
      whiteGlove: 'White Glove CAPI Setup',
      fullFunnel: 'Full Funnel AI Diagnosis',
      leakDetection: 'Real-Time Leak Detection',
    },
    betaBadge: 'Now Accepting Beta Signups',
    headline: {
      line1: 'STOP BURNING',
      line2: 'AD BUDGET.',
      line3Prefix: 'DISCOVER THE',
      why: '“WHY”',
      line3Suffix: 'BEHIND EVERY LOST SALE.',
    },
    subheadline: {
      prefix: 'Our AI diagnoses your',
      boldFunnel: 'funnel, not just your ads',
      middle: 'Instantly identify the leaks in your',
      lp: 'Landing Page',
      cart: 'Cart',
      and: 'and',
      boldCompetitor: 'competitor pricing',
    },
    ctaButton: 'Get Your Free Funnel Diagnosis',
    waitlistCount: '47 brands',
    waitlistSuffix: 'on the waitlist',
    stats: {
      lostRevenueLabel: 'Lost Revenue',
      lostRevenueValue: '$23,400',
      issuesLabel: 'Issues Found',
      issuesValue: '7 Critical',
      roasLabel: 'Potential ROAS',
      roasValue: '+4.1x',
    },
  },
  problem: {
    sectionBadge: 'The Real Problem',
    heading: {
      line1: 'The $10,000 Question Your',
      line2: "Manager Can't Answer:",
      line3: "Why Didn't They Buy?",
    },
    description: {
      prefix: 'Your ads are doing their job. The problem is everything',
      bold: 'after the click',
      suffix: '— and no one is monitoring it. Until now.',
    },
    items: [
      {
        title: 'The Vanity Metrics Trap',
        subtitle: 'Lots of clicks, zero conversions',
        description:
          "Your manager celebrates 5,000 clicks. But nobody asks why only 12 people bought. A click is a cost center, not a KPI.",
        tag: "Manager's Blind Spot",
      },
      {
        title: 'Shipping Sticker Shock',
        subtitle: '$18 shipping on a $35 product',
        description:
          "Your competitor offers free shipping above $30. You don't know that. The customer adds to cart, sees the shipping cost, and abandons. Silently.",
        tag: 'Lost at Checkout',
      },
      {
        title: 'Broken Mobile UX',
        subtitle: 'Your CTA button is invisible on iOS',
        description:
          "A CSS conflict hides your buy button on Safari/iOS. 60% of your traffic is mobile. You've been paying for ads that send people to a broken page for 3 weeks.",
        tag: 'LP UX Error',
      },
      {
        title: 'Zero Competitive Intelligence',
        subtitle: 'Flying blind in a pricing war',
        description:
          "You set your price once and forgot about it. Meanwhile, competitors adjust daily. You're the most expensive option in your category and don't even know it.",
        tag: 'Competitive Blind Spot',
      },
      {
        title: 'Ghost Data (Pixel Failures)',
        subtitle: 'Only 52% of conversions tracked',
        description:
          "iOS 14+ destroyed your pixel. Without CAPI set up, Meta's algorithm optimizes on half the data — spending your full budget while learning from noise.",
        tag: 'Data Integrity',
      },
      {
        title: 'Ignored Ad Fatigue',
        subtitle: 'Same creative for 60 days',
        description:
          'Frequency hit 9.4. Every new impression is a reminder of something your audience already rejected. But your dashboard just shows CPM climbing.',
        tag: 'Creative Performance',
      },
    ],
    callout: {
      part1: 'All of these problems are',
      highlight: 'invisible to traditional ad managers.',
      part2: 'FunnelGuard AI detects them. Automatically. In real time.',
    },
  },
  comparison: {
    sectionBadge: 'The Unfair Advantage',
    heading: { part1: 'Our Solution', part2: ' vs. Traditional Tools' },
    description: {
      prefix: 'Traditional tools are great',
      bold1: 'inside the ad platform',
      middle: 'FunnelGuard AI covers the other',
      bold2: '80% of your funnel',
      suffix: 'that they ignore.',
    },
    table: {
      capability: 'Capability',
      traditional: 'Traditional',
      traditionalSub: 'Ads-Only Focus',
      recommended: 'Recommended',
      funnelguardSub: 'Full Funnel Diagnosis',
    },
    rows: [
      { feature: 'Ad Performance Monitoring', traditionalNote: 'Core feature', funnelguardNote: 'Included' },
      { feature: 'Landing Page UX Analysis', traditionalNote: 'Unavailable', funnelguardNote: 'AI-powered audit' },
      { feature: 'Mobile/iOS Rendering Check', traditionalNote: 'Unavailable', funnelguardNote: 'Real-time monitoring' },
      { feature: 'Competitor Price Monitoring', traditionalNote: 'Unavailable', funnelguardNote: 'Daily benchmarking' },
      { feature: 'Checkout Abandonment Diagnosis', traditionalNote: 'Limited', funnelguardNote: 'Root cause analysis' },
      { feature: 'CAPI Setup (White Glove)', traditionalNote: 'DIY only', funnelguardNote: 'Done for you' },
      { feature: 'Meta Pixel Audit & Repair', traditionalNote: 'Basic check', funnelguardNote: 'Full setup + validation' },
      { feature: 'Full-Funnel Revenue Attribution', traditionalNote: 'Ad-level only', funnelguardNote: 'From click to purchase' },
      { feature: 'AI-Powered Fix Recommendations', traditionalNote: 'Ad suggestions', funnelguardNote: 'Full-funnel fixes' },
      { feature: 'Dedicated Onboarding Specialist', traditionalNote: 'Self-serve', funnelguardNote: 'White glove only' },
    ],
    score: {
      traditionalLabel: 'Traditional Tool / Manager',
      traditionalNote: 'Excellent at ad optimization. Blind to everything else.',
      funnelguardNote: 'Full funnel coverage, from click to conversion.',
    },
    cta: 'Get Full Funnel Coverage',
  },
  simulator: {
    sectionBadge: 'Interactive AI Simulator',
    heading: { part1: 'The Profit Simulator', part2: 'with AI' },
    description:
      "Drag the slider to see how much revenue you're leaving on the table — and what it's worth to fix each leak in your funnel.",
    budgetLabel: 'Monthly Ad Budget',
    benchmarkNote: 'Based on industry benchmarks',
    currentRoasLabel: 'Current ROAS',
    projectedRoasLabel: 'With FunnelGuard AI',
    revenueGainLabel: 'Additional Revenue / Month',
    annualGainLabel: 'Annual gain',
    breakdownLabel: 'Breakdown by fix type',
    disclaimer:
      "* Estimates based on average industry conversion rate improvements. Actual results vary based on your funnel's current health, niche, and traffic quality. Results are typically observed between 30 and 90 days after implementation.",
    bottomCtaText:
      "Ready to find out your real numbers? Let's run a live diagnosis on your funnel.",
    bottomCtaButton: 'Claim Your Free Funnel Diagnosis',
  },
  whiteGlove: {
    sectionBadge: 'White Glove Onboarding',
    heading: { part1: "We Don't Just Hand You a Login.", part2: 'We Set Up Everything.' },
    description: {
      prefix:
        'Most tools drop you into a dashboard and wish you luck. FunnelGuard AI is different:',
      bold: 'a human specialist manually sets up your CAPI and Pixel',
      suffix: 'to guarantee 100% data accuracy before the AI takes over.',
    },
    stepLabel: 'Step',
    steps: [
      {
        title: 'Discovery Call (30 min)',
        description:
          'A dedicated specialist maps your entire stack: CRM, e-commerce platform, ad accounts, and current pixel setup. No forms, no bots.',
        highlight: 'Human-led',
      },
      {
        title: 'CAPI + Pixel Setup',
        description:
          'We manually configure your server-side integration with the Conversions API, ensuring 100% event deduplication and iOS-proof data accuracy. We write the code. We verify every event.',
        highlight: 'Done for you',
      },
      {
        title: 'Funnel Baseline Audit',
        description:
          'Our AI runs a full diagnosis on your landing pages, checkout flow, and competitor pricing. You get a prioritized fix list within 24h.',
        highlight: 'AI-powered',
      },
      {
        title: 'Go Live & Monitoring',
        description:
          'FunnelGuard AI goes live monitoring your funnel 24/7. You get weekly profit reports with specific actions. No dashboards to check — we bring you what matters.',
        highlight: 'Automated',
      },
    ],
    guaranteesTitle: 'Our Guarantees',
    guarantees: [
      {
        title: '100% Data Accuracy Guarantee',
        description:
          "If your CAPI setup doesn't capture at least 95% of your real purchase events within 7 days, we fix it for free — no questions asked.",
      },
      {
        title: 'No Lock-In Contracts',
        description:
          'Cancel anytime. The CAPI code, pixel configuration, and audit reports are yours. We earn your loyalty by delivering results, not by locking you in.',
      },
      {
        title: 'SOC 2 Compliant Data Handling',
        description:
          'Your business data never trains public AI models. All processing is account-isolated with enterprise-grade encryption.',
      },
    ],
  },
  waitlist: {
    submittingText: 'Processing your signup...',
    submitButton: 'Request Beta Access',
    limitedBetaBadge: 'Limited Beta — 47 Spots Left',
    heading: { part1: 'Stop Guessing.', part2: 'Start Diagnosing.' },
    description: {
      prefix: 'Request beta access and get a',
      bold: 'free White Glove onboarding',
      suffix:
        "— we set up your CAPI, audit your funnel, and show you exactly where you're losing money.",
    },
    successTitle: "You're on the list!",
    successNote: 'Check your email for confirmation',
    emailLabel: 'Work Email',
    websiteLabel: 'Website / Store URL',
    privacy: {
      prefix: 'No credit card required. By signing up, you agree to our',
      link: 'Privacy Policy',
    },
    trustBadges: {
      whiteGlove: 'White Glove Setup Included',
      noLockIn: 'No Lock-In Contracts',
      soc2: 'SOC 2 Compliant',
      response: 'Response within 48h',
    },
  },
  funnelVisual: {
    steps: {
      ad: { label: 'Ad Click', sublabel: '1,000 clicks' },
      lp: {
        label: 'Landing Page',
        sublabel: '340 visits',
        leakLabel: 'Error: Hidden Button (iOS)',
        leakSublabel: '-660 lost here',
      },
      cart: {
        label: 'Checkout',
        sublabel: '89 sessions',
        leakLabel: 'Competitor 15% Cheaper',
        leakSublabel: '-251 abandoned',
      },
      purchase: { label: 'Purchase', sublabel: '24 conversions' },
    },
    conversionRateLabel: 'Real Conversion Rate',
    expectedLabel: 'Expected: 4.8%',
  },
  demoLogin: {
    loading: 'Signing in...',
    default: 'Enter Demo Mode',
  },
  facebookLogin: {
    loading: 'Connecting...',
    default: 'Continue with Facebook',
  },
  errorPage: {
    title: 'Critical Application Error',
    description: 'An unexpected error prevented the app from loading. Try reloading the page.',
    reload: 'Reload',
    home: 'Home',
  },
} satisfies typeof pt
