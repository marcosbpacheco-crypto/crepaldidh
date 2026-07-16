'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

const TABLES = ['client_list', 'client_contacts', 'client_interactions', 'client_documents', 'client_feedbacks']

export function useClientsRealtime() {
  const qc = useQueryClient()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const existing = supabase.getChannels().find((c: any) => c.topic === 'realtime:clients-module')
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel('clients-module')
    TABLES.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        qc.invalidateQueries({ queryKey: ['clients'] })
      })
    })
    channel.subscribe()

    channelRef.current = channel

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])
}