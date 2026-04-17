import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

const TYPE_MAP: Record<string, string> = {
  PAUSE: 'pause',
  SCALE: 'scale',
  REDUCE_BUDGET: 'alert',
  MONITOR: 'insight',
  NO_ACTION: 'insight',
}

const TITLE_MAP: Record<string, string> = {
  PAUSE: 'Campanha pausada',
  SCALE: 'Campanha escalada',
  REDUCE_BUDGET: 'Orçamento reduzido',
  MONITOR: 'Em monitoramento',
  NO_ACTION: 'Sem ação',
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.id) {
    return NextResponse.json({ notifications: [], unread: 0 }, { status: 401 })
  }

  const url = new URL(request.url)
  const since = url.searchParams.get('since')
  const sinceDate = since ? new Date(since) : undefined

  // Get most recent 15 AI decisions across all ad accounts of this user
  const logs = await prisma.aiDecisionLog.findMany({
    where: {
      campaign: { adAccount: { businessManager: { userId: session.user.id } } },
      ...(sinceDate ? { createdAt: { gt: sinceDate } } : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 15,
    include: {
      campaign: { select: { name: true } },
    },
  })

  const notifications = logs.map((log) => ({
    id: log.id,
    type: TYPE_MAP[log.type] ?? 'insight',
    title: `${TITLE_MAP[log.type] ?? log.type} — ${log.campaign.name}`,
    description: log.reason,
    value: log.confidence ? `Confiança: ${log.confidence}%` : undefined,
    createdAt: log.createdAt.toISOString(),
    executed: log.executed,
  }))

  // Unread = logs from last 24h
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const unread = notifications.filter((n) => new Date(n.createdAt) > cutoff).length

  return NextResponse.json({ notifications, unread })
}
