export type EventType = 'commercial_meeting' | 'client_meeting' | 'mentoring' | 'training' | 'lecture' | 'sipat' | 'nr01_interview' | 'technical_visit' | 'internal_activity'
export type EventStatus = 'scheduled' | 'confirmed' | 'completed' | 'canceled' | 'rescheduled'
export type ReminderMethod = 'notification' | 'email' | 'whatsapp'
export type CalendarView = 'day' | 'week' | 'month' | 'agenda'

export interface CalendarParticipant {
  id: string; eventId: string; name: string; email?: string; phone?: string; confirmed: boolean; createdAt: string
}
export interface CalendarReminder {
  id: string; eventId: string; reminderTime: string; method: ReminderMethod; sent: boolean; createdAt: string
}
export interface CalendarEvent {
  id: string; title: string; type: EventType; description?: string; companyId?: string; companyName?: string
  clientId?: string; projectId?: string; projectName?: string; contractId?: string; contractName?: string
  responsible: string; location?: string; link?: string; eventDate: string; startTime: string; endTime: string
  allDay: boolean; status: EventStatus; color: string; notes?: string; reminderMinutes: number
  googleEventId?: string; createdAt: string; updatedAt: string; participants?: CalendarParticipant[]
}
export interface CalendarDay { date: Date; events: CalendarEvent[]; isToday: boolean; isCurrentMonth: boolean }
export interface CalendarWeekDay { date: Date; dayLabel: string; dateLabel: string; events: CalendarEvent[]; isToday: boolean }
