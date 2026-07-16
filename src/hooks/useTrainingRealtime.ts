'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

const TABLES = ['training_events', 'training_participants', 'training_certificates', 'training_feedbacks']

export function useTrainingRealtime() {
  const qc = useQueryClient()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const existing = supabase.getChannels().find((c: any) => c.topic === 'realtime:training-module')
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel('training-module')
    TABLES.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        qc.invalidateQueries({ queryKey: ['trainings'] })
      })
    })
    channel.subscribe()

    channelRef.current = channel

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])
}