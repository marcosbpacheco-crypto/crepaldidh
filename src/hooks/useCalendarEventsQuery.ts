'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '@/services/calendarService'
import type { CalendarEvent, CalendarParticipant } from '@/types/calendar'

const CALENDAR_KEY = ['calendar']

export function useCalendarEvents() {
  const qc = useQueryClient()

  const eventsQuery = useQuery({
    queryKey: [...CALENDAR_KEY, 'events'],
    queryFn: () => calendarService.list(),
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const participantsQuery = useQuery({
    queryKey: [...CALENDAR_KEY, 'participants'],
    queryFn: () => calendarService.listParticipants(),
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: CALENDAR_KEY })

  const createEventMut = useMutation({
    mutationFn: (input: any) => calendarService.create(input),
    onSuccess: invalidate,
  })

  const updateEventMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & any) => calendarService.update(id, input),
    onSuccess: invalidate,
  })

  const deleteEventMut = useMutation({
    mutationFn: (id: string) => calendarService.remove(id),
    onSuccess: invalidate,
  })

  return {
    events: eventsQuery.data ?? [],
    participants: participantsQuery.data ?? [],
    isLoading: eventsQuery.isLoading,
    isError: eventsQuery.isError,
    error: eventsQuery.error,
    refresh: invalidate,
    addEvent: (input: any) => createEventMut.mutateAsync(input),
    updateEvent: (id: string, input: any) => updateEventMut.mutateAsync({ id, ...input }),
    deleteEvent: (id: string) => deleteEventMut.mutateAsync(id),
  }
}