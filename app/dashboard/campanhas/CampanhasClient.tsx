'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import CampaignList from '@/components/dashboard/CampaignList'
import type { CampaignRow } from '@/lib/dashboard-data'
import { syncMetaCampaignsAction } from '@/actions/campaigns'

interface Props {
  campaigns: CampaignRow[]
}

export default function CampanhasClient({ campaigns }: Props) {
  const router = useRouter()
  const [syncing, startSyncTransition] = useTransition()
  const [syncMessage, setSyncMessage] = useState<string | null>(null)

  function handleSync() {
    setSyncMessage(null)
    startSyncTransition(async () => {
      const result = await syncMetaCampaignsAction()
      if (result.success && result.data) {
        setSyncMessage(`Sincronizado: ${result.data.synced} campanhas, ${result.data.updated} atualizadas`)
        router.refresh()
      } else {
        setSyncMessage(result.error ?? 'Erro ao sincronizar')
      }
    })
  }

  return (
    <>
      {syncMessage && (
        <div className={`px-4 py-2.5 rounded-lg text-xs font-medium border ${
          syncMessage.startsWith('Erro')
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-green-500/10 border-green-500/30 text-green-400'
        }`}>
          {syncMessage}
        </div>
      )}
      <CampaignList campaigns={campaigns} onSync={handleSync} syncing={syncing} />
    </>
  )
}
