'use client'

import { useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

const TABLES = ['calendar_events', 'calendar_participants']

export function useCalendarRealtime() {
  const qc = useQueryClient()
  const channelRef = useRef<ReturnType<ReturnType<typeof createClient>['channel']> | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) return

    const existing = supabase.getChannels().find((c: any) => c.topic === 'realtime:calendar-module')
    if (existing) supabase.removeChannel(existing)

    const channel = supabase
      .channel('calendar-module')
    TABLES.forEach(table => {
      channel.on('postgres_changes', { event: '*', schema: 'public', table }, () => {
        qc.invalidateQueries({ queryKey: ['calendar'] })
      })
    })
    channel.subscribe()

    channelRef.current = channel

    return () => {
      try { supabase.removeChannel(channel) } catch {}
    }
  }, [qc])
}