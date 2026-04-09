import { Resend } from 'resend'

export const resend = new Resend(process.env.RESEND_API_KEY)

// ─── Templates ────────────────────────────────────────────────────────────────

interface AutoPilotAlertParams {
  to: string
  userName: string
  campaignName: string
  action: 'PAUSE' | 'SCALE' | 'REDUCE_BUDGET'
  reason: string
  roas: number
  spend: number
}

export async function sendAutoPilotAlert({
  to,
  userName,
  campaignName,
  action,
  reason,
  roas,
  spend,
}: AutoPilotAlertParams) {
  const actionLabels = {
    PAUSE: { emoji: '⏸️', label: 'PAUSADA', color: '#ef4444' },
    SCALE: { emoji: '📈', label: 'ESCALADA', color: '#22c55e' },
    REDUCE_BUDGET: { emoji: '📉', label: 'ORÇAMENTO REDUZIDO', color: '#f97316' },
  }
  const { emoji, label, color } = actionLabels[action]

  await resend.emails.send({
    from: 'FunnelGuard AI <onboarding@resend.dev>',
    to,
    subject: `${emoji} Campanha ${label}: ${campaignName}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px;">FunnelGuard AI · Auto-Pilot</p>

        <h1 style="font-size: 22px; margin: 0 0 8px;">Olá, ${userName} 👋</h1>
        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 24px;">
          Sua campanha foi automaticamente <strong style="color: ${color};">${label}</strong> pelo Auto-Pilot.
        </p>

        <div style="background: #111; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Campanha</p>
          <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">${campaignName}</p>

          <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Motivo</p>
          <p style="margin: 0 0 16px; font-size: 14px; color: #d1d5db;">${reason}</p>

          <div style="display: flex; gap: 24px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">ROAS</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; font-family: monospace; color: ${roas >= 2 ? '#22c55e' : '#ef4444'};">${roas.toFixed(1)}x</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Spend</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; font-family: monospace;">R$ ${spend.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/dashboard/campanhas" style="display: inline-block; background: #00D4FF; color: #000; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
          Ver no Dashboard →
        </a>

        <p style="margin-top: 32px; font-size: 12px; color: #374151;">
          Você recebe este email porque tem o Auto-Pilot ativo. Para desativar, acesse as configurações da campanha.
        </p>
      </div>
    `,
  })
}

// ─── Correlation Engine Alerts ────────────────────────────────────────────────

interface CorrelationAlertParams {
  to: string
  userName: string
  campaignName: string
  subject: string
  body: string
  roas: number
  spend: number
  trigger: string
  details: string[]
}

export async function sendCorrelationAlert({
  to,
  userName,
  campaignName,
  subject,
  body,
  roas,
  spend,
  trigger,
  details,
}: CorrelationAlertParams) {
  const isScenarioB = trigger === 'SCENARIO_B_CHECKOUT_BROKEN'
  const isScenarioA = trigger === 'SCENARIO_A_AGGRESSIVE_COMPETITOR'
  const accentColor = isScenarioB ? '#ef4444' : isScenarioA ? '#f97316' : '#eab308'
  const icon = isScenarioB ? '🚨' : isScenarioA ? '⏸️' : '⚠️'

  const detailsHtml = details.length > 0
    ? `<ul style="margin: 0; padding: 0 0 0 16px; color: #9ca3af; font-size: 13px;">${details.map(d => `<li style="margin-bottom: 4px;">${d}</li>`).join('')}</ul>`
    : ''

  await resend.emails.send({
    from: 'FunnelGuard AI <onboarding@resend.dev>',
    to,
    subject: `${icon} ${subject}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px;">FunnelGuard AI · Motor de Correlação Estratégica</p>

        <h1 style="font-size: 20px; margin: 0 0 8px;">Olá, ${userName} ${icon}</h1>
        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 24px;">${body}</p>

        <div style="background: #111; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 4px; font-size: 13px; color: #6b7280;">Campanha afetada</p>
          <p style="margin: 0 0 16px; font-size: 16px; font-weight: 600;">${campaignName}</p>

          <div style="display: flex; gap: 24px; margin-bottom: ${detailsHtml ? '16px' : '0'};">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">ROAS</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; font-family: monospace; color: ${roas >= 2 ? '#22c55e' : '#ef4444'};">${roas.toFixed(2)}x</p>
            </div>
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Gasto</p>
              <p style="margin: 0; font-size: 20px; font-weight: 700; font-family: monospace;">R$ ${spend.toFixed(2)}</p>
            </div>
          </div>

          ${detailsHtml ? `
          <div style="margin-top: 16px; padding: 12px; background: ${accentColor}18; border-radius: 6px; border-left: 3px solid ${accentColor};">
            <p style="margin: 0 0 8px; font-size: 12px; font-weight: 600; color: ${accentColor};">Sinais detectados:</p>
            ${detailsHtml}
          </div>` : ''}
        </div>

        <a href="${process.env.NEXTAUTH_URL}/dashboard/campanhas" style="display: inline-block; background: #00D4FF; color: #000; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
          Ver no Dashboard →
        </a>

        <p style="margin-top: 32px; font-size: 12px; color: #374151;">
          Ação executada automaticamente pelo Motor de Correlação Estratégica. Para ajustar sensibilidade, acesse Configurações → Auto-Pilot.
        </p>
      </div>
    `,
  })
}

// ─── Predictive Price Drop Alert ─────────────────────────────────────────────

interface PredictivePriceDropAlertParams {
  to: string
  userName: string
  competitorName: string
  productContext: string        // Produto/categoria que o concorrente vende
  previousPrice: number        // Preço anterior do concorrente
  newPrice: number             // Novo preço (mais baixo)
  dropPercent: number          // Quanto o concorrente baixou (%)
}

/**
 * Alerta preditivo disparado quando o scraper detecta que um concorrente
 * BAIXOU o preço. O cliente é alertado ANTES do ROAS cair.
 */
export async function sendPredictivePriceDropAlert({
  to,
  userName,
  competitorName,
  productContext,
  previousPrice,
  newPrice,
  dropPercent,
}: PredictivePriceDropAlertParams) {
  await resend.emails.send({
    from: 'FunnelGuard AI <onboarding@resend.dev>',
    to,
    subject: `🔔 Alerta Preditivo: ${competitorName} baixou o preço ${dropPercent.toFixed(0)}%`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px;">FunnelGuard AI · Alertas Preditivos</p>

        <h1 style="font-size: 20px; margin: 0 0 8px;">Concorrente Baixou o Preço 🔔</h1>
        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 24px;">
          Olá, ${userName}. O <strong style="color: #f97316;">${competitorName}</strong> acabou de reduzir o preço de <strong>${productContext}</strong>. Seu ROAS pode cair nos próximos dias se você não ajustar a estratégia.
        </p>

        <div style="background: #111; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Preço anterior</p>
              <p style="margin: 0; font-size: 22px; font-weight: 700; font-family: monospace; color: #9ca3af; text-decoration: line-through;">R$ ${previousPrice.toFixed(2)}</p>
            </div>
            <div style="font-size: 22px; color: #ef4444;">→</div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Novo preço</p>
              <p style="margin: 0; font-size: 22px; font-weight: 700; font-family: monospace; color: #22c55e;">R$ ${newPrice.toFixed(2)}</p>
            </div>
          </div>
          <div style="background: #ef444418; border-radius: 6px; border-left: 3px solid #ef4444; padding: 10px 14px;">
            <p style="margin: 0; font-size: 13px; color: #ef4444; font-weight: 600;">
              ⬇ Redução de ${dropPercent.toFixed(1)}% — seu anúncio pode perder competitividade
            </p>
          </div>
        </div>

        <div style="background: #00D4FF10; border: 1px solid #00D4FF30; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #00D4FF;">Sugestões de ação imediata:</p>
          <ul style="margin: 0; padding: 0 0 0 16px; color: #d1d5db; font-size: 13px; line-height: 1.7;">
            <li>Crie um cupom ou oferta temporária para manter a competitividade</li>
            <li>Destaque diferenciais do produto no criativo do anúncio (frete, prazo, garantia)</li>
            <li>Monitore o ROAS das próximas 48h e acione o Auto-Pilot se cair</li>
          </ul>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/dashboard/precos" style="display: inline-block; background: #00D4FF; color: #000; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
          Ver Monitor de Preços →
        </a>

        <p style="margin-top: 32px; font-size: 12px; color: #374151;">
          Alerta gerado automaticamente pelo sistema de Price Intelligence do FunnelGuard AI.
        </p>
      </div>
    `,
  })
}

// ─── Weekly Report ────────────────────────────────────────────────────────────

interface WeeklyReportCampaignStat {
  name: string
  roas: number
  spend: number
  revenue: number
}

interface WeeklyReportDecision {
  campaignName: string
  type: string
  reason: string
  savedBudget?: number
}

interface WeeklyReportParams {
  to: string
  userName: string
  weekLabel: string               // ex: "7 a 13 de Abril"
  totalSpend: number
  totalRevenue: number
  avgRoas: number
  moneySaved: number              // Budget estimado economizado pelas pausas da IA
  topCampaigns: WeeklyReportCampaignStat[]
  aiDecisions: WeeklyReportDecision[]
  activeCompetitors: number
}

export async function sendWeeklyReport({
  to,
  userName,
  weekLabel,
  totalSpend,
  totalRevenue,
  avgRoas,
  moneySaved,
  topCampaigns,
  aiDecisions,
  activeCompetitors,
}: WeeklyReportParams) {
  const roasColor = avgRoas >= 3 ? '#22c55e' : avgRoas >= 2 ? '#f97316' : '#ef4444'

  const topCampaignsHtml = topCampaigns
    .slice(0, 3)
    .map(
      (c) => `
      <tr>
        <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; font-size: 13px; color: #d1d5db;">${c.name}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; font-size: 13px; font-family: monospace; color: ${c.roas >= 2 ? '#22c55e' : '#ef4444'}; text-align: right;">${c.roas.toFixed(1)}x</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; font-size: 13px; font-family: monospace; color: #9ca3af; text-align: right;">R$ ${c.spend.toFixed(0)}</td>
        <td style="padding: 10px 0; border-bottom: 1px solid #1f2937; font-size: 13px; font-family: monospace; color: #22c55e; text-align: right;">R$ ${c.revenue.toFixed(0)}</td>
      </tr>`
    )
    .join('')

  const aiDecisionsHtml = aiDecisions
    .slice(0, 5)
    .map((d) => {
      const icons: Record<string, string> = {
        PAUSE: '⏸️',
        SCALE: '📈',
        REDUCE_BUDGET: '📉',
        MONITOR: '👁️',
        NO_ACTION: '✅',
      }
      return `
      <li style="margin-bottom: 8px; font-size: 13px; color: #9ca3af; line-height: 1.5;">
        ${icons[d.type] ?? '🤖'} <strong style="color: #d1d5db;">${d.campaignName}</strong> — ${d.reason.slice(0, 80)}${d.reason.length > 80 ? '...' : ''}
        ${d.savedBudget ? `<span style="color: #22c55e; font-size: 12px;"> · R$ ${d.savedBudget.toFixed(0)} preservados</span>` : ''}
      </li>`
    })
    .join('')

  await resend.emails.send({
    from: 'FunnelGuard AI <onboarding@resend.dev>',
    to,
    subject: `📊 Relatório Semanal FunnelGuard — ${weekLabel}`,
    html: `
      <div style="font-family: sans-serif; max-width: 580px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 0; border-radius: 16px; overflow: hidden;">

        <!-- Header -->
        <div style="background: linear-gradient(135deg, #00D4FF15, #8B5CF615); padding: 32px; border-bottom: 1px solid #1f2937;">
          <p style="color: #6b7280; font-size: 12px; margin: 0 0 12px; text-transform: uppercase; letter-spacing: 1px;">FunnelGuard AI · Relatório Semanal</p>
          <h1 style="font-size: 24px; margin: 0 0 4px; font-weight: 800;">Olá, ${userName} 👋</h1>
          <p style="color: #9ca3af; font-size: 14px; margin: 0;">Aqui está o resumo da semana <strong style="color: #e5e7eb;">${weekLabel}</strong></p>
        </div>

        <div style="padding: 32px;">

          <!-- KPI Grid -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 28px;">
            <div style="background: #111; border: 1px solid #1f2937; border-radius: 10px; padding: 16px;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Receita Total</p>
              <p style="margin: 0; font-size: 24px; font-weight: 800; font-family: monospace; color: #22c55e;">R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
            </div>
            <div style="background: #111; border: 1px solid #1f2937; border-radius: 10px; padding: 16px;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">ROAS Médio</p>
              <p style="margin: 0; font-size: 24px; font-weight: 800; font-family: monospace; color: ${roasColor};">${avgRoas.toFixed(2)}x</p>
            </div>
            <div style="background: #111; border: 1px solid #1f2937; border-radius: 10px; padding: 16px;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">Investimento</p>
              <p style="margin: 0; font-size: 24px; font-weight: 800; font-family: monospace; color: #e5e7eb;">R$ ${totalSpend.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
            </div>
            <div style="background: linear-gradient(135deg, #22c55e15, #16a34a10); border: 1px solid #22c55e30; border-radius: 10px; padding: 16px;">
              <p style="margin: 0 0 4px; font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.5px;">💰 Dinheiro Economizado pela IA</p>
              <p style="margin: 0; font-size: 24px; font-weight: 800; font-family: monospace; color: #22c55e;">R$ ${moneySaved.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}</p>
            </div>
          </div>

          <!-- Top Campaigns -->
          ${topCampaigns.length > 0 ? `
          <div style="margin-bottom: 28px;">
            <h2 style="font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 12px; border-left: 3px solid #00D4FF; padding-left: 10px;">Top Campanhas</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align: left; font-size: 11px; color: #6b7280; padding-bottom: 8px; font-weight: 500;">Campanha</th>
                  <th style="text-align: right; font-size: 11px; color: #6b7280; padding-bottom: 8px; font-weight: 500;">ROAS</th>
                  <th style="text-align: right; font-size: 11px; color: #6b7280; padding-bottom: 8px; font-weight: 500;">Gasto</th>
                  <th style="text-align: right; font-size: 11px; color: #6b7280; padding-bottom: 8px; font-weight: 500;">Receita</th>
                </tr>
              </thead>
              <tbody>${topCampaignsHtml}</tbody>
            </table>
          </div>` : ''}

          <!-- AI Decisions -->
          ${aiDecisions.length > 0 ? `
          <div style="margin-bottom: 28px;">
            <h2 style="font-size: 14px; font-weight: 700; color: #fff; margin: 0 0 12px; border-left: 3px solid #8B5CF6; padding-left: 10px;">Decisões do Auto-Pilot esta semana</h2>
            <div style="background: #111; border: 1px solid #1f2937; border-radius: 8px; padding: 16px;">
              <ul style="margin: 0; padding: 0; list-style: none;">${aiDecisionsHtml}</ul>
            </div>
          </div>` : ''}

          <!-- Monitoring Summary -->
          <div style="background: #00D4FF10; border: 1px solid #00D4FF25; border-radius: 8px; padding: 16px; margin-bottom: 28px;">
            <p style="margin: 0 0 6px; font-size: 13px; font-weight: 600; color: #00D4FF;">🛡️ Monitoramento Ativo</p>
            <p style="margin: 0; font-size: 13px; color: #9ca3af;">
              ${activeCompetitors} concorrente${activeCompetitors !== 1 ? 's' : ''} monitorado${activeCompetitors !== 1 ? 's' : ''} pelo Price Intelligence. Auto-Pilot funcionando 24/7.
            </p>
          </div>

          <!-- CTA -->
          <a href="${process.env.NEXTAUTH_URL}/dashboard" style="display: block; text-align: center; background: linear-gradient(90deg, #00D4FF, #8B5CF6); color: #000; font-weight: 700; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-size: 14px; margin-bottom: 24px;">
            Ver Dashboard Completo →
          </a>

          <p style="margin: 0; font-size: 11px; color: #374151; text-align: center;">
            Você recebe este relatório toda segunda-feira. Para desativar, acesse Configurações.
          </p>
        </div>
      </div>
    `,
  })
}

// ─── Token Expiry Alert ───────────────────────────────────────────────────────

interface TokenExpiryAlertParams {
  to: string
  userName: string
  businessManagerName: string
  daysRemaining: number
  reconnectUrl: string
}

/**
 * Enviado quando o token Meta de um BusinessManager vai expirar em < 5 dias.
 * CTA direciona para reconexão OAuth para evitar interrupção do Auto-Pilot.
 */
export async function sendTokenExpiryAlert({
  to,
  userName,
  businessManagerName,
  daysRemaining,
  reconnectUrl,
}: TokenExpiryAlertParams) {
  const urgencyColor = daysRemaining <= 1 ? '#ef4444' : daysRemaining <= 3 ? '#f97316' : '#eab308'
  const urgencyLabel = daysRemaining <= 1 ? 'URGENTE' : daysRemaining <= 3 ? 'ATENÇÃO' : 'AVISO'
  const urgencyIcon = daysRemaining <= 1 ? '🚨' : daysRemaining <= 3 ? '⚠️' : '🔔'

  await resend.emails.send({
    from: 'FunnelGuard AI <onboarding@resend.dev>',
    to,
    subject: `${urgencyIcon} ${urgencyLabel}: Sua conexão com a Meta expira em ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px;">FunnelGuard AI · Monitor de Segurança de Token</p>

        <h1 style="font-size: 22px; margin: 0 0 8px;">Olá, ${userName} ${urgencyIcon}</h1>
        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 24px;">
          Sua conexão com a Meta Ads (<strong style="color: #e5e7eb;">${businessManagerName}</strong>) vai expirar em
          <strong style="color: ${urgencyColor};"> ${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''}</strong>.
          Sem reconectar, o Auto-Pilot ficará <strong style="color: #ef4444;">desligado</strong> e seus anúncios não serão mais monitorados.
        </p>

        <div style="background: ${urgencyColor}12; border: 1px solid ${urgencyColor}40; border-radius: 10px; padding: 20px; margin-bottom: 24px;">
          <p style="margin: 0 0 12px; font-size: 13px; font-weight: 700; color: ${urgencyColor}; text-transform: uppercase; letter-spacing: 0.5px;">
            ${urgencyLabel} — Token expirando
          </p>

          <div style="display: flex; align-items: center; gap: 16px;">
            <div>
              <p style="margin: 0; font-size: 11px; color: #6b7280;">Business Manager</p>
              <p style="margin: 4px 0 0; font-size: 15px; font-weight: 600; color: #e5e7eb;">${businessManagerName}</p>
            </div>
            <div style="margin-left: auto; text-align: right;">
              <p style="margin: 0; font-size: 11px; color: #6b7280;">Expira em</p>
              <p style="margin: 4px 0 0; font-size: 28px; font-weight: 800; font-family: monospace; color: ${urgencyColor};">${daysRemaining}d</p>
            </div>
          </div>
        </div>

        <div style="background: #111; border: 1px solid #1f2937; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
          <p style="margin: 0 0 8px; font-size: 13px; font-weight: 600; color: #fff;">O que acontece se você não reconectar:</p>
          <ul style="margin: 0; padding: 0 0 0 16px; color: #9ca3af; font-size: 13px; line-height: 1.8;">
            <li>O Auto-Pilot para de executar ações nas suas campanhas</li>
            <li>Campanhas com baixo ROAS não serão mais pausadas automaticamente</li>
            <li>O Price Intelligence não conseguirá comparar preços em tempo real</li>
            <li>Você perde a proteção 24/7 do FunnelGuard AI</li>
          </ul>
        </div>

        <a href="${reconnectUrl}" style="display: block; text-align: center; background: linear-gradient(90deg, #00D4FF, #8B5CF6); color: #000; font-weight: 700; padding: 14px 24px; border-radius: 10px; text-decoration: none; font-size: 15px; margin-bottom: 16px;">
          🔗 Reconectar com a Meta Agora →
        </a>

        <p style="color: #6b7280; font-size: 12px; text-align: center; margin: 0 0 24px;">
          O processo leva menos de 1 minuto. Sua proteção será restaurada imediatamente.
        </p>

        <p style="margin: 0; font-size: 12px; color: #374151;">
          Você recebe este alerta porque o FunnelGuard AI monitora a saúde dos seus tokens de acesso.
          Para dúvidas, acesse o Suporte White Glove no dashboard.
        </p>
      </div>
    `,
  })
}

interface PriceAlertParams {
  to: string
  userName: string
  productName: string
  myPrice: number
  competitorPrice: number
  competitorName: string
  diffPercent: number
}

export async function sendPriceAlert({
  to,
  userName,
  productName,
  myPrice,
  competitorPrice,
  competitorName,
  diffPercent,
}: PriceAlertParams) {
  await resend.emails.send({
    from: 'FunnelGuard AI <onboarding@resend.dev>',
    to,
    subject: `🔴 Alerta de Preço: ${productName} está ${diffPercent.toFixed(0)}% mais caro`,
    html: `
      <div style="font-family: sans-serif; max-width: 560px; margin: 0 auto; background: #0a0a0a; color: #fff; padding: 32px; border-radius: 12px;">
        <p style="color: #6b7280; font-size: 13px; margin: 0 0 24px;">FunnelGuard AI · Price Intelligence</p>

        <h1 style="font-size: 22px; margin: 0 0 8px;">Alerta de Preço 🔴</h1>
        <p style="color: #9ca3af; font-size: 15px; margin: 0 0 24px;">
          Olá, ${userName}. Um concorrente está vendendo <strong>${productName}</strong> mais barato que você.
        </p>

        <div style="background: #111; border: 1px solid #1f2937; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 16px;">
            <div>
              <p style="margin: 0; font-size: 12px; color: #6b7280;">Seu preço</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; font-family: monospace; color: #f97316;">R$ ${myPrice.toFixed(2)}</p>
            </div>
            <div style="text-align: right;">
              <p style="margin: 0; font-size: 12px; color: #6b7280;">${competitorName}</p>
              <p style="margin: 0; font-size: 24px; font-weight: 700; font-family: monospace; color: #22c55e;">R$ ${competitorPrice.toFixed(2)}</p>
            </div>
          </div>
          <p style="margin: 0; background: #ef4444; color: #fff; border-radius: 6px; padding: 8px 12px; font-size: 13px; font-weight: 600;">
            ⚠️ Você está ${diffPercent.toFixed(1)}% mais caro
          </p>
        </div>

        <a href="${process.env.NEXTAUTH_URL}/dashboard/precos" style="display: inline-block; background: #00D4FF; color: #000; font-weight: 600; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px;">
          Ver Monitor de Preços →
        </a>
      </div>
    `,
  })
}
