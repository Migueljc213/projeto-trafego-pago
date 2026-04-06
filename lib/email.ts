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
    from: 'FunnelGuard AI <alertas@funnelguard.ai>',
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
    from: 'FunnelGuard AI <alertas@funnelguard.ai>',
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
