import { prisma } from '@/lib/prisma'
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  CreditCard,
  AlertTriangle,
  Wifi,
  WifiOff,
} from 'lucide-react'
import AdminLogsModal from './AdminLogsModal'

export const dynamic = 'force-dynamic'

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface UserHealthRow {
  id: string
  name: string | null
  email: string | null
  createdAt: Date
  tokenStatus: 'valid' | 'expiring' | 'expired' | 'none'
  tokenExpiresAt: Date | null
  lastSync: Date | null
  lastSyncOk: boolean
  stripeStatus: string
  stripePlan: string
  campaignCount: number
  lastErrorLog: string | null
  lastErrorAt: Date | null
}

// ─── Query ────────────────────────────────────────────────────────────────────

async function getAllUsersHealth(): Promise<UserHealthRow[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: 'desc' },
    include: {
      subscription: true,
      businessManagers: {
        include: {
          adAccounts: {
            include: {
              campaigns: {
                select: {
                  id: true,
                  metricsUpdatedAt: true,
                  decisionLogs: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                    select: { reason: true, createdAt: true, type: true },
                  },
                },
                orderBy: { metricsUpdatedAt: 'desc' },
                take: 5,
              },
            },
          },
        },
      },
    },
  })

  const now = Date.now()

  return users.map((user) => {
    const allBMs = user.businessManagers
    const firstBM = allBMs[0]

    // Token status
    let tokenStatus: UserHealthRow['tokenStatus'] = 'none'
    let tokenExpiresAt: Date | null = null
    if (firstBM?.tokenExpiresAt) {
      tokenExpiresAt = firstBM.tokenExpiresAt
      const msLeft = firstBM.tokenExpiresAt.getTime() - now
      const daysLeft = msLeft / (1000 * 60 * 60 * 24)
      if (msLeft < 0) tokenStatus = 'expired'
      else if (daysLeft <= 5) tokenStatus = 'expiring'
      else tokenStatus = 'valid'
    }

    // Last sync
    const allCampaigns = allBMs.flatMap((bm) =>
      bm.adAccounts.flatMap((aa) => aa.campaigns)
    )
    const campaignCount = allCampaigns.length
    const lastUpdated = allCampaigns
      .map((c) => c.metricsUpdatedAt)
      .filter(Boolean)
      .sort((a, b) => b!.getTime() - a!.getTime())[0] ?? null

    const syncAgeMs = lastUpdated ? now - lastUpdated.getTime() : null
    const lastSyncOk = syncAgeMs !== null && syncAgeMs < 25 * 60 * 60 * 1000 // < 25h

    // Last AI error log
    const lastLog = allCampaigns
      .flatMap((c) => c.decisionLogs)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())[0] ?? null

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt,
      tokenStatus,
      tokenExpiresAt,
      lastSync: lastUpdated ?? null,
      lastSyncOk,
      stripeStatus: user.subscription?.status ?? 'none',
      stripePlan: user.subscription?.plan ?? '—',
      campaignCount,
      lastErrorLog: lastLog?.reason ?? null,
      lastErrorAt: lastLog?.createdAt ?? null,
    }
  })
}

// ─── Helpers de Badge ─────────────────────────────────────────────────────────

function TokenBadge({ status, expiresAt }: { status: UserHealthRow['tokenStatus']; expiresAt: Date | null }) {
  if (status === 'none') return <span className="text-xs text-gray-600">—</span>

  const configs = {
    valid: { color: 'text-green-400 bg-green-500/10 border-green-500/25', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Válido' },
    expiring: { color: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/25', icon: <Clock className="w-3 h-3" />, label: 'Expirando' },
    expired: { color: 'text-red-400 bg-red-500/10 border-red-500/25', icon: <XCircle className="w-3 h-3" />, label: 'Expirado' },
  }
  const { color, icon, label } = configs[status]
  const daysLabel = expiresAt
    ? ` (${Math.ceil((expiresAt.getTime() - Date.now()) / 86_400_000)}d)`
    : ''

  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium ${color}`}>
      {icon}{label}{daysLabel}
    </span>
  )
}

function SyncBadge({ ok, lastSync }: { ok: boolean; lastSync: Date | null }) {
  if (!lastSync) return <span className="text-xs text-gray-600">Nunca</span>
  const label = lastSync.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  return (
    <span className={`inline-flex items-center gap-1 text-xs ${ok ? 'text-green-400' : 'text-red-400'}`}>
      {ok ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
      {label}
    </span>
  )
}

function StripeBadge({ status, plan }: { status: string; plan: string }) {
  const isActive = status === 'active'
  const isTrial = status === 'trialing'
  const color = isActive
    ? 'text-green-400 bg-green-500/10 border-green-500/25'
    : isTrial
    ? 'text-blue-400 bg-blue-500/10 border-blue-500/25'
    : 'text-gray-500 bg-gray-700/20 border-gray-700/30'

  return (
    <div className="flex flex-col">
      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border font-medium w-fit ${color}`}>
        <CreditCard className="w-3 h-3" />
        {status === 'none' ? 'Free' : status}
      </span>
      {plan !== '—' && <span className="text-[10px] text-gray-600 mt-0.5">{plan}</span>}
    </div>
  )
}

// ─── Estatísticas resumidas ───────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string | number; sub?: string; accent?: string }) {
  return (
    <div className="glass-card rounded-xl border border-gray-800 p-4">
      <p className="text-xs text-gray-500 mb-1">{label}</p>
      <p className={`text-2xl font-bold font-mono ${accent ?? 'text-white'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
    </div>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default async function AdminPage() {
  const rows = await getAllUsersHealth()

  const totalUsers = rows.length
  const activeTokens = rows.filter((r) => r.tokenStatus === 'valid').length
  const expiringTokens = rows.filter((r) => r.tokenStatus === 'expiring').length
  const expiredTokens = rows.filter((r) => r.tokenStatus === 'expired').length
  const paidUsers = rows.filter((r) => r.stripeStatus === 'active' || r.stripeStatus === 'trialing').length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-red-400" />
          Super Admin — Saúde das Contas
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {totalUsers} usuário{totalUsers !== 1 ? 's' : ''} cadastrado{totalUsers !== 1 ? 's' : ''} · dados em tempo real
        </p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total de Usuários" value={totalUsers} />
        <StatCard label="Tokens Válidos" value={activeTokens} accent="text-green-400" sub={`${expiredTokens} expirado${expiredTokens !== 1 ? 's' : ''}`} />
        <StatCard label="Expirando em 5d" value={expiringTokens} accent={expiringTokens > 0 ? 'text-yellow-400' : 'text-gray-400'} />
        <StatCard label="Assinantes Ativos" value={paidUsers} accent="text-neon-cyan" sub="Stripe active/trialing" />
      </div>

      {/* Alerta de tokens expirando */}
      {expiringTokens > 0 && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-yellow-500/30 bg-yellow-500/5">
          <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-yellow-300">
            <strong>{expiringTokens} token{expiringTokens > 1 ? 's' : ''}</strong> expira{expiringTokens === 1 ? '' : 'm'} em menos de 5 dias.
            O cron já enviou alertas automáticos. Verifique se os clientes reconectaram.
          </p>
        </div>
      )}

      {/* Tabela */}
      <div className="glass-card rounded-xl border border-gray-800 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-800 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Todos os Usuários</p>
          <p className="text-xs text-gray-500">Atualizado agora</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                {['Usuário', 'Token Meta', 'Última Sync', 'Stripe', 'Campanhas', 'Último Log IA', 'Ações'].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-white/2 transition-colors">
                  {/* Usuário */}
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-200 truncate max-w-[160px]">
                      {row.name ?? 'Sem nome'}
                    </p>
                    <p className="text-xs text-gray-500 truncate max-w-[160px]">{row.email ?? '—'}</p>
                    <p className="text-[10px] text-gray-700 font-mono mt-0.5">{row.id.slice(0, 8)}…</p>
                  </td>

                  {/* Token Meta */}
                  <td className="px-4 py-3">
                    <TokenBadge status={row.tokenStatus} expiresAt={row.tokenExpiresAt} />
                  </td>

                  {/* Última Sync */}
                  <td className="px-4 py-3">
                    <SyncBadge ok={row.lastSyncOk} lastSync={row.lastSync} />
                  </td>

                  {/* Stripe */}
                  <td className="px-4 py-3">
                    <StripeBadge status={row.stripeStatus} plan={row.stripePlan} />
                  </td>

                  {/* Campanhas */}
                  <td className="px-4 py-3 text-center">
                    <span className={`font-mono text-sm ${row.campaignCount > 0 ? 'text-white' : 'text-gray-600'}`}>
                      {row.campaignCount}
                    </span>
                  </td>

                  {/* Último log IA */}
                  <td className="px-4 py-3 max-w-[200px]">
                    {row.lastErrorLog ? (
                      <div>
                        <p className="text-xs text-gray-400 truncate">{row.lastErrorLog.slice(0, 60)}…</p>
                        {row.lastErrorAt && (
                          <p className="text-[10px] text-gray-600 mt-0.5">
                            {row.lastErrorAt.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs text-gray-600">—</span>
                    )}
                  </td>

                  {/* Ações */}
                  <td className="px-4 py-3">
                    <AdminLogsModal userId={row.id} userName={row.name ?? row.email ?? row.id} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {rows.length === 0 && (
            <div className="py-16 text-center text-gray-600 text-sm">
              Nenhum usuário cadastrado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
