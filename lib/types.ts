// ─── Campaigns ───────────────────────────────────────────────────────────────

export type CampaignStatus = 'ativa' | 'pausada' | 'aprendizado';

export type CampaignAlertType =
  | 'frequencia_alta'
  | 'roas_baixo'
  | 'escalavel'
  | 'orcamento_esgotado';

export interface CampaignAlert {
  type: CampaignAlertType;
}

export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  dailySpend: number;
  roas: number;
  autoPilot: boolean;
  alerts: CampaignAlert[];
}

// ─── Funnel ───────────────────────────────────────────────────────────────────

export type FunnelStageColor = 'green' | 'yellow' | 'red';

export interface FunnelStage {
  id: string;
  name: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
  color: FunnelStageColor;
  hasIssue: boolean;
  issueReason?: string;
}

// ─── Price Intelligence ───────────────────────────────────────────────────────

export type ProductStatus = 'competitivo' | 'risco';

export interface Competitor {
  name: string;
  price: number;
}

export interface PriceProduct {
  id: string;
  name: string;
  category: string;
  myPrice: number;
  competitors: Competitor[];
  status: ProductStatus;
}

// ─── White Glove ──────────────────────────────────────────────────────────────

export interface WhiteGloveStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  inProgress: boolean;
  date?: string;
}

// ─── AI Insights Feed ─────────────────────────────────────────────────────────

export type AIInsightType = 'pause' | 'alert' | 'scale' | 'insight';

export interface AIInsight {
  id: string;
  type: AIInsightType;
  timestamp: string;
  title: string;
  description: string;
  value?: string;
}

// ─── Revenue Chart ────────────────────────────────────────────────────────────

export interface RevenueDataPoint {
  date: string;
  investment: number;
  revenue: number;
}

// ─── Stat Cards ───────────────────────────────────────────────────────────────

export interface StatEntry {
  value: string;
  change: number;
  changeLabel: string;
  target?: string;
}

export interface MockStats {
  totalInvestment: StatEntry;
  currentRoas: StatEntry;
  conversions: StatEntry & { target: string };
  lostRevenue: StatEntry;
}
