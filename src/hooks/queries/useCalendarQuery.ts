import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '@/services/calendarService'
import type { CalendarEvent, CalendarParticipant, CalendarReminder } from '@/types/calendar'

const BASE_KEY = ['calendar']

export function useCalendarEventsQuery() { return useQuery({ queryKey: [...BASE_KEY, 'events'], queryFn: () => calendarService.list() }) }
export function useCreateCalendarEvent() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<CalendarEvent>) => calendarService.create(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'events'] }) }) }
export function useUpdateCalendarEvent() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<CalendarEvent>) => calendarService.update(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'events'] }) }) }
export function useDeleteCalendarEvent() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => calendarService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'events'] }) }) }

export function useCalendarParticipantsQuery(eventId: string) { return useQuery({ queryKey: [...BASE_KEY, 'participants', eventId], queryFn: () => calendarService.listParticipants(eventId), enabled: !!eventId }) }
export function useCreateCalendarParticipant() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<CalendarParticipant>) => calendarService.createParticipant(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'participants'] }) }) }
export function useDeleteCalendarParticipant() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => calendarService.removeParticipant(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'participants'] }) }) }

export function useCalendarRemindersQuery(eventId: string) { return useQuery({ queryKey: [...BASE_KEY, 'reminders', eventId], queryFn: () => calendarService.listReminders(eventId), enabled: !!eventId }) }
export function useCreateCalendarReminder() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<CalendarReminder>) => calendarService.createReminder(i), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'reminders'] }) }) }
export function useDeleteCalendarReminder() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => calendarService.removeReminder(id), onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'reminders'] }) }) }
