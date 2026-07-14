import type { CalendarEvent, CalendarParticipant, CalendarReminder } from '@/types/calendar'

const BASE = '/api/prisma/calendar'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const calendarService = {
  async saveAll(data: {
    events?: CalendarEvent[]
    participants?: CalendarParticipant[]
    reminders?: CalendarReminder[]
  }): Promise<void> {
    const jobs: Promise<any>[] = []
    for (const e of data.events || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'event', ...meRow(e) }) }).catch(() => {}))
    }
    for (const p of data.participants || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'participant', ...mpRow(p) }) }).catch(() => {}))
    }
    for (const r of data.reminders || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'reminder', ...mrRow(r) }) }).catch(() => {}))
    }
    await Promise.allSettled(jobs)
  },
  async list(): Promise<CalendarEvent[]> {
    const data = await api(BASE)
    return (data.events || []).map(mapEvent)
  },
  async create(input: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'event', ...input }),
    })
    return mapEvent(data.event)
  },
  async update(id: string, input: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    })
    return mapEvent(data.event)
  },
  async remove(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },
  async listParticipants(eventId?: string): Promise<CalendarParticipant[]> {
    const data = await api(BASE)
    const all: CalendarParticipant[] = []
    for (const e of data.events || []) {
      for (const r of e.calendar_participants || []) {
        all.push(mapParticipant({ ...r, event_id: e.id }))
      }
    }
    return eventId ? all.filter(p => p.eventId === eventId) : all
  },
  async createParticipant(input: Partial<CalendarParticipant>): Promise<CalendarParticipant> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', ...input }),
    })
    return mapParticipant(data.participant)
  },
  async removeParticipant(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', id }),
    })
  },
  async confirmParticipant(id: string): Promise<void> {
    await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', id, confirmed: true }),
    })
  },
  async listReminders(eventId?: string): Promise<CalendarReminder[]> {
    const data = await api(BASE)
    const all: CalendarReminder[] = []
    for (const e of data.events || []) {
      for (const r of e.calendar_reminders || []) {
        all.push(mapReminder({ ...r, event_id: e.id }))
      }
    }
    return eventId ? all.filter(r => r.eventId === eventId) : all
  },
  async createReminder(input: Partial<CalendarReminder>): Promise<CalendarReminder> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'reminder', ...input }),
    })
    return mapReminder(data.reminder)
  },
  async removeReminder(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'reminder', id }),
    })
  },
}

function mapEvent(r: any): CalendarEvent {
  return { ...r, eventDate: r.event_date, startTime: r.start_time, endTime: r.end_time, reminderMinutes: r.reminder_minutes, allDay: r.all_day, companyName: r.company_name, projectName: r.project_name, contractName: r.contract_name, googleEventId: r.google_event_id, createdAt: r.created_at, updatedAt: r.updated_at }
}
function mapParticipant(r: any): CalendarParticipant {
  return { id: r.id, eventId: r.event_id, name: r.name, email: r.email, phone: r.phone, confirmed: r.confirmed, createdAt: r.created_at }
}
function mapReminder(r: any): CalendarReminder {
  return { id: r.id, eventId: r.event_id, reminderTime: r.reminder_time, method: r.method, sent: r.sent, createdAt: r.created_at }
}

function meRow(r: any) {
  const { eventDate, startTime, endTime, reminderMinutes, allDay, companyName, projectName, contractName, googleEventId, createdAt, updatedAt, ...rest } = r
  return { ...rest, event_date: r.eventDate, start_time: r.startTime, end_time: r.endTime, reminder_minutes: r.reminderMinutes, all_day: r.allDay, company_name: r.companyName, project_name: r.projectName, contract_name: r.contractName, google_event_id: r.googleEventId, created_at: r.createdAt, updated_at: r.updatedAt }
}
function mpRow(r: any) {
  const { eventId, ...rest } = r
  return { ...rest, event_id: r.eventId }
}
function mrRow(r: any) {
  const { eventId, reminderTime, ...rest } = r
  return { ...rest, event_id: r.eventId, reminder_time: r.reminderTime }
}
