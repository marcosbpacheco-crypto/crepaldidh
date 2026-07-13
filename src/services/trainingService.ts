import { getClient, handleError } from './base'
import type { SipatProgram, TrainingEvent, TrainingParticipant, TrainingCertificate, TrainingFeedback, TrainingMaterial, TrainingReport } from '@/types/trainings'
import type { SipatDay } from '@/types/trainings'

const EVENTS_TABLE = 'training_events'
const PARTICIPANTS_TABLE = 'training_participants'
const CERTIFICATES_TABLE = 'training_certificates'
const FEEDBACKS_TABLE = 'training_feedbacks'
const MATERIALS_TABLE = 'training_materials'
const REPORTS_TABLE = 'training_reports'
const SIPATS_TABLE = 'training_sipats'

export const trainingService = {
  async listEvents(): Promise<TrainingEvent[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(EVENTS_TABLE).select('*').order('event_date', { ascending: false })
    if (error) handleError(error, 'trainingService.listEvents')
    return (data || []).map(me)
  },
  async createEvent(input: Partial<TrainingEvent>): Promise<TrainingEvent> {
    const supabase = getClient()
    const { data, error } = await supabase.from(EVENTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'trainingService.createEvent')
    return me(data!)
  },
  async updateEvent(id: string, input: Partial<TrainingEvent>): Promise<TrainingEvent> {
    const supabase = getClient()
    const { data, error } = await supabase.from(EVENTS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'trainingService.updateEvent')
    return me(data!)
  },
  async removeEvent(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(EVENTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'trainingService.removeEvent')
  },
  async listParticipants(eventId?: string): Promise<TrainingParticipant[]> {
    const supabase = getClient()
    let q = supabase.from(PARTICIPANTS_TABLE).select('*')
    if (eventId) q = q.eq('event_id', eventId)
    const { data, error } = await q
    if (error) handleError(error, 'trainingService.listParticipants')
    return (data || []).map(mp)
  },
  async createParticipant(input: Partial<TrainingParticipant>): Promise<TrainingParticipant> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PARTICIPANTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'trainingService.createParticipant')
    return mp(data!)
  },
  async updateParticipant(id: string, input: Partial<TrainingParticipant>): Promise<TrainingParticipant> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PARTICIPANTS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'trainingService.updateParticipant')
    return mp(data!)
  },
  async removeParticipant(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PARTICIPANTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'trainingService.removeParticipant')
  },
  async listCertificates(): Promise<TrainingCertificate[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CERTIFICATES_TABLE).select('*')
    if (error) handleError(error, 'trainingService.listCertificates')
    return (data || []).map(mc)
  },
  async createCertificate(input: Partial<TrainingCertificate>): Promise<TrainingCertificate> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CERTIFICATES_TABLE).insert(input).select().single()
    if (error) handleError(error, 'trainingService.createCertificate')
    return mc(data!)
  },
  async listFeedbacks(eventId?: string): Promise<TrainingFeedback[]> {
    const supabase = getClient()
    let q = supabase.from(FEEDBACKS_TABLE).select('*')
    if (eventId) q = q.eq('event_id', eventId)
    const { data, error } = await q
    if (error) handleError(error, 'trainingService.listFeedbacks')
    return data || []
  },
  async createFeedback(input: Partial<TrainingFeedback>): Promise<TrainingFeedback> {
    const supabase = getClient()
    const { data, error } = await supabase.from(FEEDBACKS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'trainingService.createFeedback')
    return data!
  },
  async listMaterials(eventId?: string): Promise<TrainingMaterial[]> {
    const supabase = getClient()
    let q = supabase.from(MATERIALS_TABLE).select('*')
    if (eventId) q = q.eq('event_id', eventId)
    const { data, error } = await q
    if (error) handleError(error, 'trainingService.listMaterials')
    return data || []
  },
  async createMaterial(input: Partial<TrainingMaterial>): Promise<TrainingMaterial> {
    const supabase = getClient()
    const { data, error } = await supabase.from(MATERIALS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'trainingService.createMaterial')
    return data!
  },
  async listReports(): Promise<TrainingReport[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(REPORTS_TABLE).select('*')
    if (error) handleError(error, 'trainingService.listReports')
    return data || []
  },
  async createReport(input: Partial<TrainingReport>): Promise<TrainingReport> {
    const supabase = getClient()
    const { data, error } = await supabase.from(REPORTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'trainingService.createReport')
    return data!
  },
  async listSipats(): Promise<SipatProgram[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(SIPATS_TABLE).select('*')
    if (error) handleError(error, 'trainingService.listSipats')
    return data || []
  },
  async createSipat(input: Partial<SipatProgram>): Promise<SipatProgram> {
    const supabase = getClient()
    const { data, error } = await supabase.from(SIPATS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'trainingService.createSipat')
    return data!
  },
}

function me(r: any): TrainingEvent { return { ...r, companyName: r.company_name, projectName: r.project_name, sipatProgramId: r.sipat_program_id, targetAudience: r.target_audience, eventDate: r.event_date, startTime: r.start_time, endTime: r.end_time, hoursDuration: r.hours_duration, expectedParticipants: r.expected_participants, createdAt: r.created_at } }
function mp(r: any): TrainingParticipant { return { ...r, eventId: r.event_id, crmContactId: r.crm_contact_id, companyName: r.company_name, attendanceStatus: r.attendance_status, entryTime: r.entry_time, signatureSimple: r.signature_simple } }
function mc(r: any): TrainingCertificate { return { ...r, participantId: r.participant_id, participantName: r.participant_name, eventId: r.event_id, eventName: r.event_name, clientName: r.client_name, validationCode: r.validation_code, pdfUrl: r.pdf_url, issuedAt: r.issued_at } }
