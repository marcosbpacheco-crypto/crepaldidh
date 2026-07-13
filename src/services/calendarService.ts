import { getClient, handleError } from './base'
import type { CalendarEvent, CalendarParticipant, CalendarReminder } from '@/types/calendar'

const EVENTS_TABLE = 'calendar_events'
const PARTICIPANTS_TABLE = 'calendar_participants'
const REMINDERS_TABLE = 'calendar_reminders'

export const calendarService = {
  async list(): Promise<CalendarEvent[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(EVENTS_TABLE).select('*').order('event_date', { ascending: true })
    if (error) handleError(error, 'calendarService.list')
    return (data || []).map(mapEvent)
  },
  async create(input: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const supabase = getClient()
    const { data, error } = await supabase.from(EVENTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'calendarService.create')
    return mapEvent(data!)
  },
  async update(id: string, input: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const supabase = getClient()
    const { data, error } = await supabase.from(EVENTS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'calendarService.update')
    return mapEvent(data!)
  },
  async remove(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(EVENTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'calendarService.remove')
  },
  async listParticipants(eventId?: string): Promise<CalendarParticipant[]> {
    const supabase = getClient()
    let q = supabase.from(PARTICIPANTS_TABLE).select('*')
    if (eventId) q = q.eq('event_id', eventId)
    const { data, error } = await q
    if (error) handleError(error, 'calendarService.listParticipants')
    return (data || []).map(mapParticipant)
  },
  async createParticipant(input: Partial<CalendarParticipant>): Promise<CalendarParticipant> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PARTICIPANTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'calendarService.createParticipant')
    return mapParticipant(data!)
  },
  async removeParticipant(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PARTICIPANTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'calendarService.removeParticipant')
  },
  async confirmParticipant(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PARTICIPANTS_TABLE).update({ confirmed: true }).eq('id', id)
    if (error) handleError(error, 'calendarService.confirmParticipant')
  },
  async listReminders(eventId?: string): Promise<CalendarReminder[]> {
    const supabase = getClient()
    let q = supabase.from(REMINDERS_TABLE).select('*')
    if (eventId) q = q.eq('event_id', eventId)
    const { data, error } = await q
    if (error) handleError(error, 'calendarService.listReminders')
    return (data || []).map(mapReminder)
  },
  async createReminder(input: Partial<CalendarReminder>): Promise<CalendarReminder> {
    const supabase = getClient()
    const { data, error } = await supabase.from(REMINDERS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'calendarService.createReminder')
    return mapReminder(data!)
  },
  async removeReminder(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(REMINDERS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'calendarService.removeReminder')
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
