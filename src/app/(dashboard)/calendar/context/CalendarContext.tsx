'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'
import { createClient } from '@/lib/supabase/client'

// ==========================================
// 0. DB CONVERSION HELPERS
// ==========================================

// Map app event types to DB event_type CHECK values
const APP_TYPE_TO_DB: Record<string, string> = {
  commercial_meeting: 'meeting',
  client_meeting: 'meeting',
  mentoring: 'other',
  training: 'training',
  lecture: 'other',
  sipat: 'other',
  nr01_interview: 'other',
  technical_visit: 'other',
  internal_activity: 'other',
}
const DB_TYPE_TO_APP: Record<string, EventType> = {
  meeting: 'commercial_meeting',
  training: 'training',
  deadline: 'internal_activity',
  reminder: 'internal_activity',
  appointment: 'commercial_meeting',
  other: 'internal_activity',
}

// Map app status to DB status CHECK values (confirmed|tentative|cancelled)
const APP_STATUS_TO_DB: Record<string, string> = {
  scheduled: 'confirmed',
  confirmed: 'confirmed',
  completed: 'confirmed',
  canceled: 'cancelled',
  rescheduled: 'confirmed',
}
const DB_STATUS_TO_APP: Record<string, EventStatus> = {
  confirmed: 'scheduled',
  tentative: 'scheduled',
  cancelled: 'canceled',
}

// Convert app CalendarEvent to DB insert object
function appEventToDb(e: any): Record<string, any> {
  const startTime = e.eventDate + 'T' + (e.startTime || '00:00') + ':00.000Z'
  const endTime = e.eventDate + 'T' + (e.endTime || '23:59') + ':00.000Z'
  const result: Record<string, any> = {
    id: e.id,
    title: e.title,
    description: e.description || null,
    event_type: APP_TYPE_TO_DB[e.type] || 'other',
    start_time: startTime,
    end_time: endTime,
    all_day: e.allDay ?? false,
    location: e.location || null,
    color: e.color || null,
    company_id: e.companyId || null,
    created_by: e.responsible || null,
    status: APP_STATUS_TO_DB[e.status] || 'confirmed',
  }
  if (e.tenant_id) result.tenant_id = e.tenant_id
  if (e.project_id) result.project_id = e.project_id
  if (e.responsible_user_id) result.responsible_user_id = e.responsible_user_id
  return result
}

// Convert DB record to app CalendarEvent
function dbRecordToAppEvent(r: any): CalendarEvent {
  const start = r.start_time ? new Date(r.start_time) : new Date()
  const end = r.end_time ? new Date(r.end_time) : new Date()
  const eventDate = start.toISOString().split('T')[0]
  const startTime = start.toISOString().split('T')[1]?.substring(0, 5) || '00:00'
  const endTime = end.toISOString().split('T')[1]?.substring(0, 5) || '23:59'
  return {
    id: r.id,
    title: r.title,
    type: DB_TYPE_TO_APP[r.event_type] || 'internal_activity',
    description: r.description || '',
    companyId: r.company_id || '',
    companyName: '',
    responsible: r.created_by || r.responsible_user_id || '',
    location: r.location || '',
    link: '',
    eventDate,
    startTime,
    endTime,
    allDay: r.all_day ?? false,
    status: DB_STATUS_TO_APP[r.status] || 'scheduled',
    color: r.color || '#3b82f6',
    notes: '',
    reminderMinutes: 30,
    createdAt: r.created_at || new Date().toISOString(),
    updatedAt: '',
  }
}

// ==========================================
// 1. TYPES
// ==========================================

export type EventType =
  | 'commercial_meeting' | 'client_meeting' | 'mentoring' | 'training'
  | 'lecture' | 'sipat' | 'nr01_interview' | 'technical_visit' | 'internal_activity'

export type EventStatus = 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'rescheduled'
export type ReminderMethod = 'notification' | 'email' | 'whatsapp'

export interface CalendarParticipant {
  id: string
  eventId: string
  name: string
  email?: string
  phone?: string
  confirmed: boolean
  createdAt: string
}

export interface CalendarReminder {
  id: string
  eventId: string
  reminderTime: string
  method: ReminderMethod
  sent: boolean
  createdAt: string
}

export interface CalendarEvent {
  id: string
  title: string
  type: EventType
  description?: string
  companyId?: string
  companyName?: string
  clientId?: string
  projectId?: string
  projectName?: string
  contractId?: string
  contractName?: string
  responsible: string
  location?: string
  link?: string
  eventDate: string
  startTime: string
  endTime: string
  allDay: boolean
  status: EventStatus
  color: string
  notes?: string
  reminderMinutes: number
  googleEventId?: string
  createdAt: string
  updatedAt: string
  participants?: CalendarParticipant[]
}

export interface CalendarDay {
  date: Date
  events: CalendarEvent[]
  isToday: boolean
  isCurrentMonth: boolean
}

export interface CalendarWeekDay {
  date: Date
  dayLabel: string
  dateLabel: string
  events: CalendarEvent[]
  isToday: boolean
}

export type CalendarView = 'day' | 'week' | 'month' | 'agenda'

// ==========================================
// 1b. CONTEXT TYPE
// ==========================================

interface CalendarContextType {
  events: CalendarEvent[]
  participants: CalendarParticipant[]
  reminders: CalendarReminder[]

  // View state
  currentDate: Date
  view: CalendarView
  setCurrentDate: (d: Date) => void
  setView: (v: CalendarView) => void
  goToday: () => void
  goNext: () => void
  goPrev: () => void

  // Computed
  monthDays: CalendarDay[]
  weekDays: CalendarWeekDay[]
  dayEvents: CalendarEvent[]
  agendaEvents: CalendarEvent[]
  todayEvents: CalendarEvent[]
  upcomingEvents: CalendarEvent[]
  overdueEvents: CalendarEvent[]
  weekHours: number
  typeDistribution: { type: string; label: string; count: number }[]
  eventsByDate: (date: string) => CalendarEvent[]

  // CRUD Events
  addEvent: (e: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>) => CalendarEvent
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void
  deleteEvent: (id: string) => void
  completeEvent: (id: string) => void
  cancelEvent: (id: string) => void

  // CRUD Participants
  addParticipant: (p: Omit<CalendarParticipant, 'id' | 'createdAt'>) => CalendarParticipant
  removeParticipant: (id: string) => void
  toggleParticipantConfirmed: (id: string) => void

  // CRUD Reminders
  addReminder: (r: Omit<CalendarReminder, 'id' | 'createdAt'>) => CalendarReminder
  removeReminder: (id: string) => void

  // AI Helpers
  generateDaySummary: (date: Date) => Promise<string>
  suggestBestTime: (date: string, durationMinutes: number) => Promise<string>
  generateWeekReport: () => Promise<string>

  // UI
  getEventTypeLabel: (t: EventType) => string
  getEventTypeColor: (t: EventType) => string
  getStatusLabel: (s: EventStatus) => string
  getStatusColor: (s: EventStatus) => string
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

// ==========================================
// 2. SEED DATA
// ==========================================

function generateSeedEvents(): CalendarEvent[] {
  const today = new Date()
  const d = (offset: number) => new Date(today.getFullYear(), today.getMonth(), today.getDate() + offset)
  const fmtDate = (date: Date) => date.toISOString().split('T')[0]

  return [
    {
      id: 'cal-1', title: 'Reunião Comercial - BR Distribuidora', type: 'commercial_meeting',
      companyId: 'comp-1', companyName: 'BR Distribuidora',
      clientId: 'cli-1',
      description: 'Apresentação de proposta de DHO Corporativo',
      responsible: 'Equipe Comercial', location: 'Escritório Central',
      eventDate: fmtDate(d(0)), startTime: '09:00', endTime: '10:30',
      allDay: false, status: 'scheduled', color: '#3b82f6',
      reminderMinutes: 30, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-2', title: 'Mentoria - Vale S.A.', type: 'mentoring',
      companyId: 'comp-2', companyName: 'Vale S.A.',
      clientId: 'cli-2',
      contractId: 'contr-2', contractName: 'Contrato de Mentoria Regional Vale',
      description: 'Sessão de mentoria com lideranças regionais',
      responsible: 'Facilitador Sênior', link: 'https://meet.google.com/abc-defg-hij',
      eventDate: fmtDate(d(0)), startTime: '14:00', endTime: '16:00',
      allDay: false, status: 'confirmed', color: '#06b6d4',
      reminderMinutes: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-3', title: 'Treinamento - NR01 Básico', type: 'training',
      companyId: 'comp-3', companyName: 'Banco Itaú',
      clientId: 'cli-3',
      description: 'Treinamento introdutório de NR01 para novos colaboradores',
      responsible: 'Instrutor Técnico', location: 'Auditório Itaú - Andar 12',
      eventDate: fmtDate(d(1)), startTime: '08:00', endTime: '12:00',
      allDay: false, status: 'scheduled', color: '#10b981',
      reminderMinutes: 60, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-4', title: 'Entrevista NR01 - Gerdau', type: 'nr01_interview',
      companyId: 'comp-4', companyName: 'Gerdau',
      clientId: 'cli-4',
      description: 'Entrevista de levantamento de riscos psicossociais',
      responsible: 'Psicóloga do Trabalho', link: 'https://zoom.us/j/123456789',
      eventDate: fmtDate(d(1)), startTime: '14:30', endTime: '15:30',
      allDay: false, status: 'confirmed', color: '#ec4899',
      reminderMinutes: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-5', title: 'Palestra - Segurança Psicológica', type: 'lecture',
      companyId: 'comp-1', companyName: 'BR Distribuidora',
      clientId: 'cli-1',
      description: 'Palestra sobre segurança psicológica no trabalho',
      responsible: 'Palestrante Convidado', location: 'Auditório BR Distribuidora',
      eventDate: fmtDate(d(2)), startTime: '10:00', endTime: '11:30',
      allDay: false, status: 'scheduled', color: '#f59e0b',
      reminderMinutes: 30, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-6', title: 'SIPAT - Semestre 2026.1', type: 'sipat',
      companyId: 'comp-2', companyName: 'Vale S.A.',
      clientId: 'cli-2',
      description: 'Semana Interna de Prevenção de Acidentes - Abertura',
      responsible: 'Comissão SIPAT', location: 'Centro de Convenções Vale',
      eventDate: fmtDate(d(3)), startTime: '08:00', endTime: '17:00',
      allDay: true, status: 'scheduled', color: '#ef4444',
      reminderMinutes: 120, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-7', title: 'Visita Técnica - Cliente Potencial', type: 'technical_visit',
      companyName: 'Cliente Potencial - Indústria ABC',
      description: 'Visita para levantamento de necessidades de treinamento',
      responsible: 'Consultor Técnico', location: 'Av. Paulista, 1000',
      eventDate: fmtDate(d(-1)), startTime: '09:00', endTime: '11:00',
      allDay: false, status: 'completed', color: '#6366f1',
      reminderMinutes: 30, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-8', title: 'Atividade Interna - Planejamento Mensal', type: 'internal_activity',
      description: 'Reunião de planejamento estratégico da equipe',
      responsible: 'Equipe CrepaldiDH', link: 'https://meet.google.com/xyz-uvw-rst',
      eventDate: fmtDate(d(-2)), startTime: '08:00', endTime: '09:30',
      allDay: false, status: 'completed', color: '#64748b',
      reminderMinutes: 15, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-9', title: 'Reunião com Cliente - Vale (Acompanhamento)', type: 'client_meeting',
      companyId: 'comp-2', companyName: 'Vale S.A.',
      clientId: 'cli-2',
      contractId: 'contr-2', contractName: 'Contrato de Mentoria Regional Vale',
      description: 'Acompanhamento mensal do contrato de mentoria',
      responsible: 'Gerente de Contas', link: 'https://zoom.us/j/987654321',
      eventDate: fmtDate(d(5)), startTime: '10:00', endTime: '11:00',
      allDay: false, status: 'scheduled', color: '#8b5cf6',
      reminderMinutes: 30, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
    {
      id: 'cal-10', title: 'Treinamento - Oratória para Líderes', type: 'training',
      companyId: 'comp-3', companyName: 'Banco Itaú',
      projectId: 'proj-3', projectName: 'Workshop de Alta Performance Itaú',
      description: 'Módulo 3 do programa de desenvolvimento de lideranças',
      responsible: 'Facilitador Sênior', location: 'Sala de Treinamento - Itaú',
      eventDate: fmtDate(d(7)), startTime: '13:00', endTime: '18:00',
      allDay: false, status: 'scheduled', color: '#10b981',
      reminderMinutes: 60, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    },
  ]
}

// ==========================================
// 3. PROVIDER
// ==========================================

export const CalendarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([])
  const [participants, setParticipants] = useState<CalendarParticipant[]>([])
  const [reminders, setReminders] = useState<CalendarReminder[]>([])
  const [currentDate, setCurrentDate] = useState<Date>(new Date())
  const [view, setView] = useState<CalendarView>('month')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const get = <T,>(key: string, fallback: T): T => {
      try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback }
      catch { return fallback }
    }

    const loadData = async () => {
      try {
        const [{ data: evts }, { data: parts }, { data: rems }] = await Promise.all([
          supabase.from('calendar_events').select('*'),
          supabase.from('calendar_participants').select('*'),
          supabase.from('calendar_reminders').select('*'),
        ])
        if (evts) {
          setEvents(evts.length ? evts.map(dbRecordToAppEvent) : get('cal_events', generateSeedEvents()))
          setParticipants(parts?.length ? parts : get('cal_participants', []))
          setReminders(rems?.length ? rems : get('cal_reminders', []))
        } else {
          throw new Error('Fallback')
        }
      } catch {
        setEvents(get('cal_events', generateSeedEvents()))
        setParticipants(get('cal_participants', []))
        setReminders(get('cal_reminders', []))
      }
    }
    loadData()
  }, [])

  const sync = (key: string, value: unknown) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
  }

  // Navigation
  const goToday = () => setCurrentDate(new Date())

  const goNext = () => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() + 1)
    else if (view === 'week') d.setDate(d.getDate() + 7)
    else if (view === 'month') d.setMonth(d.getMonth() + 1)
    else d.setDate(d.getDate() + 7)
    setCurrentDate(d)
  }

  const goPrev = () => {
    const d = new Date(currentDate)
    if (view === 'day') d.setDate(d.getDate() - 1)
    else if (view === 'week') d.setDate(d.getDate() - 7)
    else if (view === 'month') d.setMonth(d.getMonth() - 1)
    else d.setDate(d.getDate() - 7)
    setCurrentDate(d)
  }

  // View helpers
  const getMonthDays = (date: Date): CalendarDay[] => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const startPad = firstDay.getDay()
    const days: CalendarDay[] = []
    const todayStr = new Date().toISOString().split('T')[0]

    for (let i = 0; i < startPad; i++) {
      const d = new Date(year, month, -startPad + i + 1)
      days.push({ date: d, events: [], isToday: false, isCurrentMonth: false })
    }
    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: d,
        events: events.filter(e => e.eventDate === dateStr && e.status !== 'canceled'),
        isToday: dateStr === todayStr,
        isCurrentMonth: true,
      })
    }
    const remaining = 42 - days.length
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i)
      days.push({ date: d, events: [], isToday: false, isCurrentMonth: false })
    }
    return days
  }

  const getWeekDays = (date: Date): CalendarWeekDay[] => {
    const start = new Date(date)
    start.setDate(start.getDate() - start.getDay())
    const todayStr = new Date().toISOString().split('T')[0]
    const days: CalendarWeekDay[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(start)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: d,
        dayLabel: d.toLocaleDateString('pt-BR', { weekday: 'short' }),
        dateLabel: d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
        events: events.filter(e => e.eventDate === dateStr && e.status !== 'canceled'),
        isToday: dateStr === todayStr,
      })
    }
    return days
  }

  const getDayEvents = (date: Date): CalendarEvent[] => {
    const dateStr = date.toISOString().split('T')[0]
    return events.filter(e => e.eventDate === dateStr && e.status !== 'canceled')
      .sort((a, b) => a.startTime.localeCompare(b.startTime))
  }

  const getAgendaEvents = (): CalendarEvent[] => {
    const todayStr = new Date().toISOString().split('T')[0]
    return events.filter(e => e.eventDate >= todayStr && e.status !== 'canceled')
      .sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.startTime.localeCompare(b.startTime))
  }

  // Computed
  const monthDays = getMonthDays(currentDate)
  const weekDays = getWeekDays(currentDate)
  const dayEvents = getDayEvents(currentDate)
  const agendaEvents = getAgendaEvents()
  const todayEvents = getDayEvents(new Date())
  const upcomingEvents = events.filter(e => {
    const d = e.startTime ? new Date(e.eventDate + 'T' + e.startTime) : new Date(e.eventDate + 'T23:59:59')
    const now = new Date()
    return d > now && e.status !== 'canceled' && e.status !== 'completed'
  }).sort((a, b) => a.eventDate.localeCompare(b.eventDate) || a.startTime.localeCompare(b.startTime)).slice(0, 10)
  const overdueEvents = events.filter(e => {
    const d = e.endTime ? new Date(e.eventDate + 'T' + e.endTime) : new Date(e.eventDate + 'T23:59:59')
    return d < new Date() && e.status === 'scheduled'
  })

  const weekHours = weekDays.reduce((acc, day) => {
    return acc + day.events.reduce((sum, e) => {
      if (!e.startTime || !e.endTime) return sum + 8
      const [sh, sm] = e.startTime.split(':').map(Number)
      const [eh, em] = e.endTime.split(':').map(Number)
      const minutes = Math.max(0, eh * 60 + em - sh * 60 - sm)
      return sum + minutes / 60
    }, 0)
  }, 0)

  const typeDistribution = EVENT_TYPES.map(t => ({
    type: t.value,
    label: t.label,
    count: events.filter(e => e.type === t.value && e.status !== 'canceled').length,
  })).filter(t => t.count > 0)

  const eventsByDate = (date: string) => events.filter(e => e.eventDate === date && e.status !== 'canceled')

  // ==========================================
  // CRUD - Events
  // ==========================================

  const addEvent = (e: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): CalendarEvent => {
    const ne: CalendarEvent = {
      ...e, id: `cal-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    }
    const updated = [ne, ...events]
    setEvents(updated); sync('cal_events', updated)
    supabase.from('calendar_events').insert(appEventToDb(ne)).then(({ error }) => error && console.warn(error))
    return ne
  }

  const updateEvent = (id: string, updates: Partial<CalendarEvent>) => {
    const updated = events.map(e => e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)
    setEvents(updated); sync('cal_events', updated)
    const current = events.find(e => e.id === id)
    if (current) {
      const merged = { ...current, ...updates }
      const dbUpdates = appEventToDb(merged)
      delete dbUpdates.id
      supabase.from('calendar_events').update(dbUpdates).eq('id', id).then(({ error }) => error && console.warn(error))
    }
  }

  const deleteEvent = (id: string) => {
    const updated = events.filter(e => e.id !== id)
    setEvents(updated); sync('cal_events', updated)
    supabase.from('calendar_events').delete().eq('id', id).then()
  }

  const completeEvent = (id: string) => updateEvent(id, { status: 'completed' })
  const cancelEvent = (id: string) => updateEvent(id, { status: 'canceled' })

  // ==========================================
  // CRUD - Participants
  // ==========================================

  const addParticipant = (p: Omit<CalendarParticipant, 'id' | 'createdAt'>): CalendarParticipant => {
    const np: CalendarParticipant = { ...p, id: `cp-${Date.now()}`, createdAt: new Date().toISOString() }
    const updated = [np, ...participants]
    setParticipants(updated); sync('cal_participants', updated)
    return np
  }

  const removeParticipant = (id: string) => {
    const updated = participants.filter(p => p.id !== id)
    setParticipants(updated); sync('cal_participants', updated)
  }

  const toggleParticipantConfirmed = (id: string) => {
    const updated = participants.map(p => p.id === id ? { ...p, confirmed: !p.confirmed } : p)
    setParticipants(updated); sync('cal_participants', updated)
  }

  // ==========================================
  // CRUD - Reminders
  // ==========================================

  const addReminder = (r: Omit<CalendarReminder, 'id' | 'createdAt'>): CalendarReminder => {
    const nr: CalendarReminder = { ...r, id: `cr-${Date.now()}`, createdAt: new Date().toISOString() }
    const updated = [nr, ...reminders]
    setReminders(updated); sync('cal_reminders', updated)
    return nr
  }

  const removeReminder = (id: string) => {
    const updated = reminders.filter(r => r.id !== id)
    setReminders(updated); sync('cal_reminders', updated)
  }

  // ==========================================
  // AI HELPERS
  // ==========================================

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
    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    const weekEvts = events.filter(e => {
      const d = new Date(e.eventDate)
      return d >= weekStart && d <= weekEnd && e.status !== 'canceled'
    })
    const total = weekEvts.length
    const hours = weekEvts.reduce((acc, e) => acc + getEventHours(e), 0)
    const byType = EVENT_TYPES.map(t => ({ label: t.label, count: weekEvts.filter(e => e.type === t.value).length })).filter(t => t.count > 0)
    return `📊 **Relatório Semanal**\n\n📆 Semana de ${weekStart.toLocaleDateString('pt-BR')} a ${weekEnd.toLocaleDateString('pt-BR')}\n\n📋 **${total} compromissos**\n⏱ **${hours.toFixed(1)} horas agendadas**\n\n**Distribuição por tipo:**\n${byType.map(t => `- ${t.label}: ${t.count}`).join('\n') || 'Nenhum'}\n\n✅ Gerado automaticamente.`
  }

  // ==========================================
  // UI Helpers
  // ==========================================

  const getEventTypeLabel = (t: EventType) => EVENT_TYPES.find(e => e.value === t)?.label || t
  const getEventTypeColor = (t: EventType) => EVENT_TYPES.find(e => e.value === t)?.color || '#64748b'

  const getStatusLabel = (s: EventStatus) => {
    const labels: Record<EventStatus, string> = { scheduled: 'Agendado', confirmed: 'Confirmado', completed: 'Realizado', canceled: 'Cancelado', rescheduled: 'Reagendado' }
    return labels[s]
  }

  const getStatusColor = (s: EventStatus) => {
    const colors: Record<EventStatus, string> = {
      scheduled: 'bg-blue-50 text-blue-700 border-blue-100',
      confirmed: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      completed: 'bg-slate-100 text-slate-500 border-slate-200',
      canceled: 'bg-red-50 text-red-400 border-red-100',
      rescheduled: 'bg-amber-50 text-amber-700 border-amber-100',
    }
    return colors[s]
  }

  return (
    <CalendarContext.Provider value={{
      events, participants, reminders,
      currentDate, view,
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
