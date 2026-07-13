'use client'

import React, { createContext, useContext, useState, useMemo, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { calendarService } from '@/services/calendarService'
import type { CalendarEvent, CalendarParticipant, CalendarReminder, CalendarDay, CalendarWeekDay } from '@/types/calendar'

// ==========================================
// TYPES (kept for backward compat)
// ==========================================

export type EventType =
  | 'commercial_meeting' | 'client_meeting' | 'mentoring' | 'training'
  | 'lecture' | 'sipat' | 'nr01_interview' | 'technical_visit' | 'internal_activity'

export type EventStatus = 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'rescheduled'
export type ReminderMethod = 'notification' | 'email' | 'whatsapp'
export type CalendarView = 'day' | 'week' | 'month' | 'agenda'

export type { CalendarEvent, CalendarParticipant, CalendarReminder, CalendarDay, CalendarWeekDay }

interface CalendarContextType {
  events: CalendarEvent[]; participants: CalendarParticipant[]; reminders: CalendarReminder[]
  currentDate: Date; view: CalendarView
  setCurrentDate: (d: Date) => void; setView: (v: CalendarView) => void
  goToday: () => void; goNext: () => void; goPrev: () => void
  monthDays: CalendarDay[]; weekDays: CalendarWeekDay[]; dayEvents: CalendarEvent[]
  agendaEvents: CalendarEvent[]; todayEvents: CalendarEvent[]; upcomingEvents: CalendarEvent[]
  overdueEvents: CalendarEvent[]; weekHours: number
  typeDistribution: { type: string; label: string; count: number }[]
  eventsByDate: (date: string) => CalendarEvent[]
  addEvent: (e: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => CalendarEvent
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void; completeEvent: (id: string) => void; cancelEvent: (id: string) => void
  addParticipant: (p: Omit<CalendarParticipant, 'id' | 'createdAt'>) => CalendarParticipant
  removeParticipant: (id: string) => void; toggleParticipantConfirmed: (id: string) => void
  addReminder: (r: Omit<CalendarReminder, 'id' | 'createdAt'>) => CalendarReminder
  removeReminder: (id: string) => void
  generateDaySummary: (date: Date) => Promise<string>
  suggestBestTime: (date: string, durationMinutes: number) => Promise<string>
  generateWeekReport: () => Promise<string>
  getEventTypeLabel: (t: EventType) => string; getEventTypeColor: (t: EventType) => string
  getStatusLabel: (s: EventStatus) => string; getStatusColor: (s: EventStatus) => string
}

const EVENT_TYPES: { value: EventType; label: string; color: string }[] = [
  { value: 'commercial_meeting', label: 'Reunião Comercial', color: '#3b82f6' },
  { value: 'client_meeting', label: 'Reunião com Cliente', color: '#8b5cf6' },
  { value: 'mentoring', label: 'Mentoria', color: '#06b6d4' },
  { value: 'training', label: 'Treinamento', color: '#10b981' },
  { value: 'lecture', label: 'Palestra', color: '#f59e0b' },
  { value: 'sipat', label: 'SIPAT', color: '#ef4444' },
  { value: 'nr01_interview', label: 'Entrevista NR01', color: '#ec4899' },
  { value: 'technical_visit', label: 'Visita Técnica', color: '#6366f1' },
  { value: 'internal_activity', label: 'Atividade Interna', color: '#64748b' },
]

const CalendarContext = createContext<CalendarContextType | undefined>(undefined)

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const qc = useQueryClient()
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [view, setView] = useState<CalendarView>('month')

  // Data queries
  const { data: events = [] } = useQuery({
    queryKey: ['calendar', 'events'],
    queryFn: () => calendarService.list(),
  })
  const { data: participants = [] } = useQuery({
    queryKey: ['calendar', 'participants'],
    queryFn: () => calendarService.listParticipants(''),
  })
  const { data: reminders = [] } = useQuery({
    queryKey: ['calendar', 'reminders'],
    queryFn: () => calendarService.listReminders(''),
  })

  const invalidate = useCallback(() => {
    qc.invalidateQueries({ queryKey: ['calendar'] })
  }, [qc])

  // Mutations
  const addEventMut = useMutation({
    mutationFn: (input: Record<string, any>) => calendarService.create(input as any),
    onSuccess: invalidate,
  })
  const updateEventMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, any>) => calendarService.update(id, input as any),
    onSuccess: invalidate,
  })
  const deleteEventMut = useMutation({
    mutationFn: (id: string) => calendarService.remove(id),
    onSuccess: invalidate,
  })
  const addParticipantMut = useMutation({
    mutationFn: (input: Record<string, any>) => calendarService.createParticipant(input as any),
    onSuccess: invalidate,
  })
  const removeParticipantMut = useMutation({
    mutationFn: (id: string) => calendarService.removeParticipant(id),
    onSuccess: invalidate,
  })
  const toggleParticipantMut = useMutation({
    mutationFn: (id: string) => calendarService.confirmParticipant(id),
    onSuccess: invalidate,
  })
  const addReminderMut = useMutation({
    mutationFn: (input: Record<string, any>) => calendarService.createReminder(input as any),
    onSuccess: invalidate,
  })
  const removeReminderMut = useMutation({
    mutationFn: (id: string) => calendarService.removeReminder(id),
    onSuccess: invalidate,
  })

  // CRUD events
  const addEvent = useCallback((e: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent => {
    const ne: CalendarEvent = { ...e, id: `cal-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    addEventMut.mutate(ne)
    return ne
  }, [addEventMut])

  const updateEvent = useCallback((id: string, updates: Partial<CalendarEvent>) => {
    updateEventMut.mutate({ id, ...updates })
  }, [updateEventMut])

  const deleteEvent = useCallback((id: string) => {
    deleteEventMut.mutate(id)
  }, [deleteEventMut])

  const completeEvent = useCallback((id: string) => updateEvent(id, { status: 'completed' }), [updateEvent])
  const cancelEvent = useCallback((id: string) => updateEvent(id, { status: 'canceled' }), [updateEvent])

  // CRUD participants
  const addParticipant = useCallback((p: Omit<CalendarParticipant, 'id' | 'createdAt'>): CalendarParticipant => {
    const np: CalendarParticipant = { ...p, id: `cp-${Date.now()}`, createdAt: new Date().toISOString() }
    addParticipantMut.mutate(np)
    return np
  }, [addParticipantMut])

  const removeParticipant = useCallback((id: string) => { removeParticipantMut.mutate(id) }, [removeParticipantMut])
  const toggleParticipantConfirmed = useCallback((id: string) => { toggleParticipantMut.mutate(id) }, [toggleParticipantMut])

  // CRUD reminders
  const addReminder = useCallback((r: Omit<CalendarReminder, 'id' | 'createdAt'>): CalendarReminder => {
    const nr: CalendarReminder = { ...r, id: `cr-${Date.now()}`, createdAt: new Date().toISOString() }
    addReminderMut.mutate(nr)
    return nr
  }, [addReminderMut])

  const removeReminder = useCallback((id: string) => { removeReminderMut.mutate(id) }, [removeReminderMut])

  // Navigation
  const goToday = useCallback(() => setCurrentDate(new Date()), [])
  const goNext = useCallback(() => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else if (view === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }, [currentDate, view])
  const goPrev = useCallback(() => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else if (view === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }, [currentDate, view])

  // Computed
  const getMonthDays = useCallback((date: Date): CalendarDay[] => {
    const year = date.getFullYear(); const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()
    const todayStr = new Date().toISOString().split('T')[0]
    const days: CalendarDay[] = []
    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, -startPad + i + 1)
      days.push({ date: d, events: [], isToday: false, isCurrentMonth: false })
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({ date: d, events: events.filter(e => e.eventDate === dateStr && e.status !== 'canceled'), isToday: dateStr === todayStr, isCurrentMonth: true })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d, events: [], isToday: false, isCurrentMonth: false })
    }
    return days
  }, [events])

  const getWeekDays = useCallback((date: Date): CalendarWeekDay[] => {
    const start = new Date(date); start.setDate(start.getDate() - start.getDay())
    const todayStr = new Date().toISOString().split('T')[0]
    const days: CalendarWeekDay[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start); d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({ date: d, dayLabel: d.toLocaleDateString('pt-BR', { weekday: 'short' }), dateLabel: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }), events: events.filter(e => e.eventDate === dateStr && e.status !== 'canceled'), isToday: dateStr === todayStr })
    }
    return days
  }, [events])

  const getDayEvents = useCallback((date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(e => e.eventDate === dateStr && e.status !== 'canceled').sort((a, b) => a.startTime.localeCompare(b.startTime))
  }, [events])

  const getAgendaEvents = useCallback((): CalendarEvent[] => {
    const todayStr = new Date().toISOString().split('T')[0]
    return events.filter(e => e.eventDate >= todayStr && e.status !== 'canceled').sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.startTime.localeCompare(b.startTime))
  }, [events])

  const monthDays = useMemo(() => getMonthDays(currentDate), [getMonthDays, currentDate])
  const weekDays = useMemo(() => getWeekDays(currentDate), [getWeekDays, currentDate])
  const dayEvents = useMemo(() => getDayEvents(currentDate), [getDayEvents, currentDate])
  const agendaEvents = useMemo(() => getAgendaEvents(), [getAgendaEvents])
  const todayEvents = useMemo(() => getDayEvents(new Date()), [getDayEvents])

  const upcomingEvents = useMemo(() => events.filter(e => {
    const d = e.startTime ? new Date(e.eventDate + 'T' + e.startTime) : new Date(e.eventDate + 'T23:59:59')
    return d > new Date() && e.status !== 'canceled' && e.status !== 'completed'
  }).sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.startTime.localeCompare(b.startTime)).slice(0, 10), [events])

  const overdueEvents = useMemo(() => events.filter(e => {
    const d = e.endTime ? new Date(e.eventDate + 'T' + e.endTime) : new Date(e.eventDate + 'T23:59:59')
    return d < new Date() && e.status === 'scheduled'
  }), [events])

  const weekHours = useMemo(() => weekDays.reduce((acc, day) => acc + day.events.reduce((sum, e) => {
    if (!e.startTime || !e.endTime) return sum + 8
    const [sh, sm] = e.startTime.split(':').map(Number)
    const [eh, em] = e.endTime.split(':').map(Number)
    return sum + Math.max(0, eh * 60 + em - sh * 60 - sm) / 60
  }, 0), 0), [weekDays])

  const typeDistribution = useMemo(() => EVENT_TYPES.map(t => ({
    type: t.value, label: t.label, count: events.filter(e => e.type === t.value && e.status !== 'canceled').length,
  })).filter(t => t.count > 0), [events])

  const eventsByDate = useCallback((date: string) => events.filter(e => e.eventDate === date && e.status !== 'canceled'), [events])

  // AI Helpers
  const getEventHours = (e: CalendarEvent): number => {
    if (!e.startTime || !e.endTime) return 8
    const [sh, sm] = e.startTime.split(':').map(Number)
    const [eh, em] = e.endTime.split(':').map(Number)
    return Math.max(0, (eh * 60 + em - sh * 60 - sm)) / 60
  }

  const generateDaySummary = async (date: Date): Promise<string> => {
    const dateStr = date.toISOString().split('T')[0]
    const dayEvts = events.filter(e => e.eventDate === dateStr && e.status !== 'canceled')
    const total = dayEvts.length
    const hours = dayEvts.reduce((acc, e) => acc + getEventHours(e), 0)
    const types = [...new Set(dayEvts.map(e => getEventTypeLabel(e.type)))].join(', ')
    return `📅 **Resumo do Dia - ${date.toLocaleDateString('pt-BR')}**\n\n📊 **${total} compromisso(s)**\n⏱ **${hours.toFixed(1)}h agendadas**\n📋 **Tipos:** ${types || 'Nenhum'}\n\n${dayEvts.map(e => `- **${e.startTime || 'Dia todo'}** — ${e.title} (${getEventTypeLabel(e.type)})`).join('\n') || 'Nenhum compromisso agendado para hoje.'}`
  }

  const suggestBestTime = async (date: string, durationMinutes: number): Promise<string> => {
    const dayEvts = events.filter(e => e.eventDate === date && e.status !== 'canceled' && e.startTime && e.endTime).sort((a, b) => a.startTime.localeCompare(b.startTime))
    if (dayEvts.length === 0) return '✅ **Disponível o dia inteiro.**\n\nSugiro agendar entre 09:00 e 11:00 (horário de maior produtividade).'
    const busySlots = dayEvts.map(e => ({ start: e.startTime, end: e.endTime }))
    const suggestions: string[] = []
    const possibleStart = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00']
    for (const start of possibleStart) {
      const [sh, sm] = start.split(':').map(Number)
      const startMin = sh * 60 + sm
      const endMin = startMin + durationMinutes
      const conflict = busySlots.some(slot => {
        const [ssh, ssm] = slot.start.split(':').map(Number)
        const [seh, sem] = slot.end.split(':').map(Number)
        const slotStart = ssh * 60 + ssm
        const slotEnd = seh * 60 + sem
        return startMin < slotEnd && endMin > slotStart
      })
      if (!conflict) suggestions.push(start)
    }
    if (suggestions.length === 0) return '⚠️ **Nenhum horário disponível** neste dia para a duração solicitada.'
    return `✅ **Horários sugeridos para ${date}** (${durationMinutes}min):\n\n${suggestions.map(s => `- **${s}** às ${String(Number(s.split(':')[0]) + Math.floor((Number(s.split(':')[1]) + durationMinutes) / 60)).padStart(2, '0')}:${String((Number(s.split(':')[1]) + durationMinutes) % 60).padStart(2, '0')}`).join('\n')}\n\n💡 *Sugestão: Preferir horários da manhã para reuniões importantes.*`
  }

  const generateWeekReport = async (): Promise<string> => {
    const today = new Date()
    const weekStart = new Date(today); weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart); weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEvts = events.filter(e => { const d = new Date(e.eventDate); return d >= weekStart && d <= weekEnd && e.status !== 'canceled' })
    const total = weekEvts.length
    const hours = weekEvts.reduce((acc, e) => acc + getEventHours(e), 0)
    const byType = EVENT_TYPES.map(t => ({ label: t.label, count: weekEvts.filter(e => e.type === t.value).length })).filter(t => t.count > 0)
    return `📊 **Relatório Semanal**\n\n📆 Semana de ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}\n\n📋 **${total} compromissos**\n⏱ **${hours.toFixed(1)} horas agendadas**\n\n**Distribuição por tipo:**\n${byType.map(t => `- ${t.label}: ${t.count}`).join('\n') || 'Nenhum'}\n\n✅ Gerado automaticamente.`
  }

  const getEventTypeLabel = (t: EventType) => EVENT_TYPES.find(e => e.value === t)?.label || t
  const getEventTypeColor = (t: EventType) => EVENT_TYPES.find(e => e.value === t)?.color || '#64748b'
  const getStatusLabel = (s: EventStatus) => ({ scheduled: 'Agendado', confirmed: 'Confirmado', completed: 'Realizado', canceled: 'Cancelado', rescheduled: 'Reagendado' } as Record<EventStatus, string>)[s]
  const getStatusColor = (s: EventStatus) => ({
    scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
    confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    completed: 'bg-slate-100 text-slate-500 border-slate-200',
    canceled: 'bg-red-50 text-red-400 border-red-100',
    rescheduled: 'bg-amber-50 text-amber-700 border-amber-100',
  } as Record<EventStatus, string>)[s]

  return (
    <CalendarContext.Provider value={{
      events, participants, reminders, currentDate, view,
      setCurrentDate, setView, goToday, goNext, goPrev,
      monthDays, weekDays, dayEvents, agendaEvents,
      todayEvents, upcomingEvents, overdueEvents, weekHours, typeDistribution, eventsByDate,
      addEvent, updateEvent, deleteEvent, completeEvent, cancelEvent,
      addParticipant, removeParticipant, toggleParticipantConfirmed,
      addReminder, removeReminder,
      generateDaySummary, suggestBestTime, generateWeekReport,
      getEventTypeLabel, getEventTypeColor, getStatusLabel, getStatusColor,
    }}>
      {children}
    </CalendarContext.Provider>
  )
}

export const useCalendar = () => {
  const ctx = useContext(CalendarContext)
  if (!ctx) throw new Error('useCalendar must be used within a CalendarProvider')
  return ctx
}
