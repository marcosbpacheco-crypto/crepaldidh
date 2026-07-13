import { getClient, handleError } from './base'
import type { Institution, Mentor, Participant, MentoringSession, MentoringGoal, PDIPlan, PdiAction, MentoringFeedback, MentoringAssessment, MentoringNote, Competency, CompetencyAssessment, MentorTool, MentoringReport } from '@/types/mentoring'

const INSTITUTIONS_TABLE = 'ment_institutions'
const MENTORS_TABLE = 'ment_mentors'
const PARTICIPANTS_TABLE = 'mentoring_participants'
const SESSIONS_TABLE = 'mentoring_sessions'
const GOALS_TABLE = 'pdi_goals'
const PDI_TABLE = 'pdi_plans'
const PDI_ACTIONS_TABLE = 'pdi_actions'
const FEEDBACKS_TABLE = 'ment_feedbacks'
const ASSESSMENTS_TABLE = 'mentoring_assessments'
const NOTES_TABLE = 'ment_notes'
const COMPETENCIES_TABLE = 'competencies'
const COMP_ASSESSMENTS_TABLE = 'ment_competency_assessments'
const TOOLS_TABLE = 'development_tools'
const REPORTS_TABLE = 'mentoring_reports'

export const mentoringService = {
  async saveAll(data: {
    participants?: Participant[]
    sessions?: MentoringSession[]
    pdiPlans?: PDIPlan[]
    competencies?: Competency[]
    tools?: MentorTool[]
    assessments?: MentoringAssessment[]
    mentoringReports?: MentoringReport[]
  }): Promise<void> {
    const supabase = getClient()
    const jobs: Promise<any>[] = []
    if (data.participants?.length) jobs.push(Promise.resolve(supabase.from(PARTICIPANTS_TABLE).upsert(data.participants.map(mpRow))))
    if (data.sessions?.length) jobs.push(Promise.resolve(supabase.from(SESSIONS_TABLE).upsert(data.sessions.map(msRow))))
    if (data.pdiPlans?.length) jobs.push(Promise.resolve(supabase.from(PDI_TABLE).upsert(data.pdiPlans.map(mppRow))))
    if (data.competencies?.length) jobs.push(Promise.resolve(supabase.from(COMPETENCIES_TABLE).upsert(data.competencies)))
    if (data.tools?.length) jobs.push(Promise.resolve(supabase.from(TOOLS_TABLE).upsert(data.tools)))
    if (data.assessments?.length) jobs.push(Promise.resolve(supabase.from(ASSESSMENTS_TABLE).upsert(data.assessments)))
    if (data.mentoringReports?.length) jobs.push(Promise.resolve(supabase.from(REPORTS_TABLE).upsert(data.mentoringReports)))
    await Promise.allSettled(jobs)
  },

  async listInstitutions(): Promise<Institution[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(INSTITUTIONS_TABLE).select('*').order('name')
    if (error) handleError(error, 'mentoringService.listInstitutions')
    return data || []
  },
  async createInstitution(input: Partial<Institution>): Promise<Institution> {
    const supabase = getClient()
    const { data, error } = await supabase.from(INSTITUTIONS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'mentoringService.createInstitution')
    return data!
  },
  async listMentors(): Promise<Mentor[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(MENTORS_TABLE).select('*').order('name')
    if (error) handleError(error, 'mentoringService.listMentors')
    return data || []
  },
  async createMentor(input: Partial<Mentor>): Promise<Mentor> {
    const supabase = getClient()
    const { data, error } = await supabase.from(MENTORS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'mentoringService.createMentor')
    return data!
  },
  async listParticipants(): Promise<Participant[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PARTICIPANTS_TABLE).select('*').order('name')
    if (error) handleError(error, 'mentoringService.listParticipants')
    return (data || []).map(mp)
  },
  async createParticipant(input: Partial<Participant>): Promise<Participant> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PARTICIPANTS_TABLE).insert(mpRow(input)).select().single()
    if (error) handleError(error, 'mentoringService.createParticipant')
    return mp(data!)
  },
  async updateParticipant(id: string, input: Partial<Participant>): Promise<Participant> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PARTICIPANTS_TABLE).update(mpRow(input)).eq('id', id).select().single()
    if (error) handleError(error, 'mentoringService.updateParticipant')
    return mp(data!)
  },
  async removeParticipant(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PARTICIPANTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'mentoringService.removeParticipant')
  },
  async listSessions(participantId?: string): Promise<MentoringSession[]> {
    const supabase = getClient()
    let q = supabase.from(SESSIONS_TABLE).select('*')
    if (participantId) q = q.eq('participant_id', participantId)
    const { data, error } = await q.order('date', { ascending: false })
    if (error) handleError(error, 'mentoringService.listSessions')
    return (data || []).map(ms)
  },
  async createSession(input: Partial<MentoringSession>): Promise<MentoringSession> {
    const supabase = getClient()
    const { data, error } = await supabase.from(SESSIONS_TABLE).insert(msRow(input)).select().single()
    if (error) handleError(error, 'mentoringService.createSession')
    return ms(data!)
  },
  async updateSession(id: string, input: Partial<MentoringSession>): Promise<MentoringSession> {
    const supabase = getClient()
    const { data, error } = await supabase.from(SESSIONS_TABLE).update(msRow(input)).eq('id', id).select().single()
    if (error) handleError(error, 'mentoringService.updateSession')
    return ms(data!)
  },
  async removeSession(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(SESSIONS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'mentoringService.removeSession')
  },
  async listGoals(participantId?: string): Promise<MentoringGoal[]> {
    const supabase = getClient()
    let q = supabase.from(GOALS_TABLE).select('*')
    if (participantId) q = q.eq('participant_id', participantId)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) handleError(error, 'mentoringService.listGoals')
    return (data || []).map(mg)
  },
  async listPdiPlans(participantId?: string): Promise<PDIPlan[]> {
    const supabase = getClient()
    let q = supabase.from(PDI_TABLE).select('*')
    if (participantId) q = q.eq('participant_id', participantId)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) handleError(error, 'mentoringService.listPdiPlans')
    return (data || []).map(mpp)
  },
  async createPdiPlan(input: Partial<PDIPlan>): Promise<PDIPlan> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PDI_TABLE).insert(mppRow(input)).select().single()
    if (error) handleError(error, 'mentoringService.createPdiPlan')
    return mpp(data!)
  },
  async updatePdiPlan(id: string, input: Partial<PDIPlan>): Promise<PDIPlan> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PDI_TABLE).update(mppRow(input)).eq('id', id).select().single()
    if (error) handleError(error, 'mentoringService.updatePdiPlan')
    return mpp(data!)
  },
  async removePdiPlan(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PDI_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'mentoringService.removePdiPlan')
  },
  async listPdiActions(planId?: string): Promise<PdiAction[]> {
    const supabase = getClient()
    let q = supabase.from(PDI_ACTIONS_TABLE).select('*')
    if (planId) q = q.eq('plan_id', planId)
    const { data, error } = await q
    if (error) handleError(error, 'mentoringService.listPdiActions')
    return data || []
  },
  async listCompetencies(): Promise<Competency[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(COMPETENCIES_TABLE).select('*').order('name')
    if (error) handleError(error, 'mentoringService.listCompetencies')
    return data || []
  },
  async listTools(): Promise<MentorTool[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(TOOLS_TABLE).select('*').order('name')
    if (error) handleError(error, 'mentoringService.listTools')
    return data || []
  },
  async listFeedbacks(sessionId?: string): Promise<MentoringFeedback[]> {
    const supabase = getClient()
    let q = supabase.from(FEEDBACKS_TABLE).select('*')
    if (sessionId) q = q.eq('session_id', sessionId)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) handleError(error, 'mentoringService.listFeedbacks')
    return data || []
  },
  async listAssessments(): Promise<any[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(ASSESSMENTS_TABLE).select('*')
    if (error) handleError(error, 'mentoringService.listAssessments')
    return data || []
  },
  async listReports(): Promise<any[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(REPORTS_TABLE).select('*')
    if (error) handleError(error, 'mentoringService.listReports')
    return data || []
  },
}

function mp(r: any): Participant { return { ...r, mentorId: r.mentor_id, institutionId: r.institution_id, contractId: r.contract_id, crmContactId: r.crm_contact_id, currentCycle: r.current_cycle, startDate: r.start_date } }
function ms(r: any): MentoringSession { return { ...r, participantId: r.participant_id, mentorId: r.mentor_id, sessionType: r.session_type, method: r.method, mood: r.mood, nextDate: r.next_date, paAction: r.pa_action } }
function mg(r: any): MentoringGoal { return { ...r, participantId: r.participant_id, deadline: r.deadline, createdAt: r.created_at } }
function mpp(r: any): PDIPlan { return { ...r, participantId: r.participant_id, createdAt: r.created_at } }

function mpRow(r: any) {
  const { mentorId, institutionId, contractId, crmContactId, currentCycle, startDate, ...rest } = r
  return { ...rest, mentor_id: r.mentorId, institution_id: r.institutionId, contract_id: r.contractId, crm_contact_id: r.crmContactId, current_cycle: r.currentCycle, start_date: r.startDate }
}
function msRow(r: any) {
  const { participantId, mentorId, sessionType, method, mood, nextDate, paAction, ...rest } = r
  return { ...rest, participant_id: r.participantId, mentor_id: r.mentorId, session_type: r.sessionType, method: r.method, mood: r.mood, next_date: r.nextDate, pa_action: r.paAction }
}
function mppRow(r: any) {
  const { participantId, ...rest } = r
  return { ...rest, participant_id: r.participantId }
}
