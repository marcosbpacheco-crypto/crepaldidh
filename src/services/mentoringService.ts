import type { Institution, Mentor, Participant, MentoringSession, MentoringGoal, PDIPlan, PdiAction, MentoringFeedback, MentoringAssessment, MentoringNote, Competency, CompetencyAssessment, MentorTool, MentoringReport } from '@/types/mentoring'

const BASE = '/api/prisma/mentoring'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const mentoringService = {
  async saveAll(data: {
    participants?: Participant[]
    sessions?: MentoringSession[]
    pdiPlans?: PDIPlan[]
    assessments?: any[]
    reports?: any[]
    competencies?: any[]
    tools?: any[]
    mentoringReports?: any[]
  }): Promise<void> {
    const jobs: Promise<any>[] = []
    for (const p of data.participants || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'participant', ...mpRow(p) }) }).catch(() => {}))
    }
    for (const s of data.sessions || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'session', ...msRow(s) }) }).catch(() => {}))
    }
    for (const p of data.pdiPlans || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'pdiPlan', ...mppRow(p) }) }).catch(() => {}))
    }
    for (const a of data.assessments || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'assessment', ...a }) }).catch(() => {}))
    }
    for (const r of data.reports || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'report', ...r }) }).catch(() => {}))
    }
    for (const c of data.competencies || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'competency', ...c }) }).catch(() => {}))
    }
    for (const t of data.tools || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'tool', ...t }) }).catch(() => {}))
    }
    for (const r of data.mentoringReports || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'report', ...r }) }).catch(() => {}))
    }
    await Promise.allSettled(jobs)
  },

  async listInstitutions(): Promise<Institution[]> {
    return []
  },
  async createInstitution(_input: Partial<Institution>): Promise<Institution> {
    throw new Error('Not implemented via Prisma API')
  },
  async listMentors(): Promise<Mentor[]> {
    return []
  },
  async createMentor(_input: Partial<Mentor>): Promise<Mentor> {
    throw new Error('Not implemented via Prisma API')
  },
  async listParticipants(): Promise<Participant[]> {
    const data = await api(BASE)
    return (data.participants || []).map(mp)
  },
  async createParticipant(input: Partial<Participant>): Promise<Participant> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', ...input }),
    })
    return mp(data.participant)
  },
  async updateParticipant(id: string, input: Partial<Participant>): Promise<Participant> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', id, ...input }),
    })
    return mp(data.participant)
  },
  async removeParticipant(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', id }),
    })
  },
  async listSessions(participantId?: string): Promise<MentoringSession[]> {
    const data = await api(BASE)
    const all = (data.sessions || []).map((s: any) => ms(s))
    return participantId ? all.filter((s: any) => s.participantId === participantId) : all
  },
  async createSession(input: Partial<MentoringSession>): Promise<MentoringSession> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'session', ...input }),
    })
    return ms(data.session)
  },
  async updateSession(id: string, input: Partial<MentoringSession>): Promise<MentoringSession> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'session', id, ...input }),
    })
    return ms(data.session)
  },
  async removeSession(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'session', id }),
    })
  },
  async listGoals(_participantId?: string): Promise<MentoringGoal[]> {
    return []
  },
  async listPdiPlans(participantId?: string): Promise<PDIPlan[]> {
    const data = await api(BASE)
    const all = (data.pdi_plans || []).map((p: any) => mpp(p))
    return participantId ? all.filter((p: any) => p.participantId === participantId) : all
  },
  async createPdiPlan(input: Partial<PDIPlan>): Promise<PDIPlan> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'pdiPlan', ...input }),
    })
    return mpp(data.pdiPlan)
  },
  async updatePdiPlan(id: string, input: Partial<PDIPlan>): Promise<PDIPlan> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'pdiPlan', id, ...input }),
    })
    return mpp(data.pdiPlan)
  },
  async removePdiPlan(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'pdiPlan', id }),
    })
  },
  async listPdiActions(_planId?: string): Promise<PdiAction[]> {
    return []
  },
  async listCompetencies(): Promise<Competency[]> {
    const data = await api(BASE)
    return data.competencies || []
  },
  async listTools(): Promise<MentorTool[]> {
    const data = await api(BASE)
    return data.tools || []
  },
  async listFeedbacks(_sessionId?: string): Promise<MentoringFeedback[]> {
    return []
  },
  async listAssessments(): Promise<any[]> {
    const data = await api(BASE)
    return data.assessments || []
  },
  async listReports(): Promise<any[]> {
    const data = await api(BASE)
    return data.reports || []
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
