import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  // Verifica se quem chama é o admin
  const session = await getServerSession(authOptions)
  const adminEmail = process.env.ADMIN_EMAIL
  if (!session?.user?.email || session.user.email !== adminEmail) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const userId = req.nextUrl.searchParams.get('userId')
  if (!userId) {
    return NextResponse.json({ error: 'userId is required' }, { status: 400 })
  }

  const logs = await prisma.aiDecisionLog.findMany({
    where: { campaign: { adAccount: { businessManager: { userId } } } },
    orderBy: { createdAt: 'desc' },
    take: 20,
    include: {
      campaign: { select: { name: true } },
    },
  })

  return NextResponse.json({
    logs: logs.map((l) => ({
      id: l.id,
      campaignName: l.campaign.name,
      type: l.type,
      reason: l.reason,
      executed: l.executed,
      createdAt: l.createdAt.toLocaleString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    })),
  })
}
