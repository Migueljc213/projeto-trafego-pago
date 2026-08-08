'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import CampaignList from '@/components/dashboard/CampaignList'
import type { CampaignRow } from '@/lib/dashboard-data'
import { syncMetaCampaignsAction } from '@/actions/campaigns'
import { useLanguage } from '@/lib/i18n/LanguageContext'

interface Props {
  campaigns: CampaignRow[]
}

export default function CampanhasClient({ campaigns }: Props) {
  const { dict } = useLanguage()
  const router = useRouter()
  const [syncing, startSyncTransition] = useTransition()
  const [syncMessage, setSyncMessage] = useState<string | null>(null)
  const [syncIsError, setSyncIsError] = useState(false)

  function handleSync() {
    setSyncMessage(null)
    startSyncTransition(async () => {
      const result = await syncMetaCampaignsAction()
      if (result.success && result.data) {
        setSyncIsError(false)
        setSyncMessage(dict.campaigns.campanhasPage.syncSuccess(result.data.synced, result.data.updated))
        router.refresh()
      } else {
        setSyncIsError(true)
        setSyncMessage(result.error ?? dict.campaigns.campanhasPage.syncError)
      }
    })
  }

  return (
    <>
      {syncMessage && (
        <div className={`px-4 py-2.5 rounded-lg text-xs font-medium border ${
          syncIsError
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
