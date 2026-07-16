'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

const TABLES = ['crm_companies', 'crm_contacts', 'crm_deals', 'crm_proposals', 'crm_contracts', 'crm_activities', 'crm_tasks']

export function useCrmRealtime() {
  const qc = useQueryClient()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const existing = supabase.getChannels().find((c: any) => c.topic === 'realtime:crm-module')
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel('crm-module')
    TABLES.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        qc.invalidateQueries({ queryKey: ['crm'] })
      })
    })
    channel.subscribe()

    channelRef.current = channel

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])
}