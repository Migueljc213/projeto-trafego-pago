import type {
  Campaign,
  FunnelStage,
  PriceProduct,
  WhiteGloveStep,
  AIInsight,
  RevenueDataPoint,
  MockStats,
} from './types';

// ─── Stat Cards ───────────────────────────────────────────────────────────────

export const mockStats: MockStats = {
  totalInvestment: {
    value: 'R$ 42.800',
    change: 12.4,
    changeLabel: 'vs. mês anterior',
  },
  currentRoas: {
    value: '3.2x',
    change: 8.7,
    changeLabel: 'vs. mês anterior',
  },
  conversions: {
    value: '1.347',
    change: 5.2,
    changeLabel: 'vs. mês anterior',
    target: '1.500',
  },
  lostRevenue: {
    value: 'R$ 8.400',
    change: 0,
    changeLabel: 'estimativa mensal em gargalos',
  },
};

// ─── Campaigns ───────────────────────────────────────────────────────────────

export const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Black Friday - Lookalike 3%',
    status: 'ativa',
    dailySpend: 850,
    roas: 4.2,
    autoPilot: true,
    alerts: [{ type: 'escalavel' }],
  },
  {
    id: '2',
    name: 'Remarketing 30d - Abandono Cart',
    status: 'ativa',
    dailySpend: 320,
    roas: 6.7,
    autoPilot: true,
    alerts: [{ type: 'escalavel' }],
  },
  {
    id: '3',
    name: 'Prospeccao - Broad - Produto A',
    status: 'ativa',
    dailySpend: 1200,
    roas: 1.8,
    autoPilot: false,
    alerts: [{ type: 'roas_baixo' }, { type: 'frequencia_alta' }],
  },
  {
    id: '4',
    name: 'Catalogo Dinamico - Todos Produtos',
    status: 'aprendizado',
    dailySpend: 450,
    roas: 2.4,
    autoPilot: false,
    alerts: [],
  },
  {
    id: '5',
    name: 'Cold - Video - UGC v3',
    status: 'pausada',
    dailySpend: 0,
    roas: 1.2,
    autoPilot: false,
    alerts: [{ type: 'roas_baixo' }],
  },
  {
    id: '6',
    name: 'Remarketing 7d - Visitantes LP',
    status: 'ativa',
    dailySpend: 280,
    roas: 5.1,
    autoPilot: true,
    alerts: [],
  },
];

// ─── Funnel Stages ────────────────────────────────────────────────────────────

export const mockFunnelStages: FunnelStage[] = [
  {
    id: '1',
    name: 'Clique no Anúncio',
    visitors: 12400,
    conversions: 12400,
    conversionRate: 100,
    color: 'green',
    hasIssue: false,
  },
  {
    id: '2',
    name: 'Landing Page',
    visitors: 12400,
    conversions: 7440,
    conversionRate: 60,
    color: 'yellow',
    hasIssue: true,
    issueReason: '⚠️ Queda de 40% — Botão CTA oculto no iOS/Safari. Estimativa: R$ 3.200 perdidos.',
  },
  {
    id: '3',
    name: 'Checkout',
    visitors: 7440,
    conversions: 2232,
    conversionRate: 30,
    color: 'red',
    hasIssue: true,
    issueReason: '⚠️ Queda de 70% — Concorrente principal 15% mais barato. Alto custo de frete acima de R$ 50.',
  },
  {
    id: '4',
    name: 'Compra Finalizada',
    visitors: 2232,
    conversions: 1347,
    conversionRate: 60,
    color: 'green',
    hasIssue: false,
  },
];

// ─── Price Products ───────────────────────────────────────────────────────────

export const mockPriceProducts: PriceProduct[] = [
  {
    id: '1',
    name: 'Tênis Runner Pro X2',
    category: 'Calçados Esportivos',
    myPrice: 289.90,
    competitors: [
      { name: 'Concorrente A', price: 249.90 },
      { name: 'Concorrente B', price: 259.00 },
      { name: 'Concorrente C', price: 299.00 },
    ],
    status: 'risco',
  },
  {
    id: '2',
    name: 'Camiseta Dry-Fit Elite',
    category: 'Roupas Esportivas',
    myPrice: 89.90,
    competitors: [
      { name: 'Concorrente A', price: 94.90 },
      { name: 'Concorrente B', price: 99.00 },
      { name: 'Concorrente C', price: 92.00 },
    ],
    status: 'competitivo',
  },
  {
    id: '3',
    name: 'Kit Suplemento Whey + Creatina',
    category: 'Suplementos',
    myPrice: 199.90,
    competitors: [
      { name: 'Concorrente A', price: 189.90 },
      { name: 'Concorrente B', price: 194.90 },
      { name: 'Concorrente C', price: 209.00 },
    ],
    status: 'risco',
  },
  {
    id: '4',
    name: 'Mochila Urban 30L',
    category: 'Acessórios',
    myPrice: 159.90,
    competitors: [
      { name: 'Concorrente A', price: 169.00 },
      { name: 'Concorrente B', price: 155.00 },
      { name: 'Concorrente C', price: 172.00 },
    ],
    status: 'competitivo',
  },
  {
    id: '5',
    name: 'Smartwatch Fit Band Pro',
    category: 'Eletrônicos',
    myPrice: 349.90,
    competitors: [
      { name: 'Concorrente A', price: 319.90 },
      { name: 'Concorrente B', price: 329.00 },
      { name: 'Concorrente C', price: 359.00 },
    ],
    status: 'risco',
  },
];

// ─── White Glove Steps ────────────────────────────────────────────────────────

export const mockWhiteGloveSteps: WhiteGloveStep[] = [
  {
    id: '1',
    title: 'Discovery Call realizada',
    description: 'Stack mapeada: Shopify + Meta Ads + Google Analytics',
    completed: true,
    inProgress: false,
    date: '28/03',
  },
  {
    id: '2',
    title: 'CAPI configurado e validado',
    description: '98,4% de match rate — deduplicação ativa',
    completed: true,
    inProgress: false,
    date: '29/03',
  },
  {
    id: '3',
    title: 'Meta Pixel auditado',
    description: 'Pixel disparando corretamente em todos os eventos',
    completed: true,
    inProgress: false,
    date: '30/03',
  },
  {
    id: '4',
    title: 'Auditoria de Funil em progresso',
    description: 'Analisando LP, Checkout e preços dos concorrentes...',
    completed: false,
    inProgress: true,
  },
  {
    id: '5',
    title: 'Monitor de concorrentes ativo',
    description: 'Aguardando conclusão da auditoria de funil',
    completed: false,
    inProgress: false,
  },
  {
    id: '6',
    title: 'Relatório semanal configurado',
    description: 'Envio automático toda segunda-feira às 08h',
    completed: false,
    inProgress: false,
  },
];

// ─── AI Insights Feed ─────────────────────────────────────────────────────────

export const mockAIInsights: AIInsight[] = [
  {
    id: '1',
    type: 'pause',
    timestamp: '14:32',
    title: 'Campanha "Prospeccao - Broad" pausada',
    description: 'ROAS caiu para 1.8 (abaixo do mínimo configurado de 2.0). Concorrente principal reduziu preço em 10% às 13h.',
    value: 'ROAS: 1.8x → limite: 2.0x',
  },
  {
    id: '2',
    type: 'alert',
    timestamp: '14:15',
    title: 'UX Error detectado na Landing Page',
    description: 'Botão CTA "Comprar Agora" oculto em iOS 17 / Safari. 60% do tráfego é mobile. Correção urgente recomendada.',
    value: 'Estimativa: R$ 2.340 perdidos hoje',
  },
  {
    id: '3',
    type: 'scale',
    timestamp: '13:50',
    title: 'Campanha "Remarketing 7d" escalada',
    description: 'ROAS mantido em 5.1x por 3 dias consecutivos. Budget aumentado em 25% automaticamente.',
    value: 'Budget: R$ 280 → R$ 350/dia',
  },
  {
    id: '4',
    type: 'insight',
    timestamp: '12:20',
    title: 'Oportunidade de preço identificada',
    description: 'Tênis Runner Pro X2 está R$ 40 mais caro que a média dos concorrentes. Redução de R$ 20 pode aumentar conversão em ~18%.',
    value: 'Impacto estimado: +R$ 1.800/mês',
  },
  {
    id: '5',
    type: 'alert',
    timestamp: '11:05',
    title: 'Frequência alta detectada',
    description: 'Campanha "Cold - Video - UGC v3" com frequência 9.4. Público esgotado. Recomendado novo criativo ou expansão de audiência.',
    value: 'Frequência: 9.4 (limite: 4.0)',
  },
  {
    id: '6',
    type: 'scale',
    timestamp: '09:30',
    title: 'Campanha "Lookalike 3%" escalada',
    description: 'Performance estável com ROAS 4.2x há 5 dias. Budget diário aumentado de R$ 650 para R$ 850.',
    value: 'ROAS: 4.2x estável',
  },
];

// ─── Revenue Chart (últimos 30 dias) ─────────────────────────────────────────

function generateRevenueData(): RevenueDataPoint[] {
  const data: RevenueDataPoint[] = [];
  const today = new Date();

  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const label = date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });

    const base = 1200 + Math.sin(i * 0.3) * 300;
    const investment = Math.round(base + (Math.random() * 200 - 100));
    const roasFactor = 2.8 + Math.sin(i * 0.2) * 0.8 + Math.random() * 0.5;
    const revenue = Math.round(investment * roasFactor);

    data.push({ date: label, investment, revenue });
  }

  return data;
}

export const mockRevenueData: RevenueDataPoint[] = generateRevenueData();
