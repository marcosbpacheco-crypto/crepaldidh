import type {
  MentoringProgram, MentoringObjective, MentoringAction, MentoringSession,
  MentoringFeedback, MentoringDiagnostic, MentoringIndicator, MentoringDocument,
  MentoringHistory, Participant, Competency, DevelopmentTool, Assessment, MentoringReport,
} from '@/types/mentoring'

const BASE = '/api/prisma/mentoring'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const mentoringService = {
  // ---- Programas ----
  async listPrograms(): Promise<MentoringProgram[]> {
    const data = await api(BASE)
    return (data.programs || []).map(mapProgram)
  },
  async createProgram(input: Partial<MentoringProgram>): Promise<MentoringProgram> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'program', ...input }),
    })
    return mapProgram(data.program)
  },
  async updateProgram(id: string, input: Partial<MentoringProgram>): Promise<MentoringProgram> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'program', id, ...input }),
    })
    return mapProgram(data.program)
  },
  async removeProgram(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'program', id }),
    })
  },

  // ---- Objetivos ----
  async createObjective(input: Partial<MentoringObjective>): Promise<MentoringObjective> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'objective', ...input }),
    })
    return mapObjective(data.objective)
  },
  async updateObjective(id: string, input: Partial<MentoringObjective>): Promise<MentoringObjective> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'objective', id, ...input }),
    })
    return mapObjective(data.objective)
  },
  async removeObjective(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'objective', id }),
    })
  },

  // ---- Ações ----
  async createAction(input: Partial<MentoringAction>): Promise<MentoringAction> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'action', ...input }),
    })
    return mapAction(data.action)
  },
  async updateAction(id: string, input: Partial<MentoringAction>): Promise<MentoringAction> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'action', id, ...input }),
    })
    return mapAction(data.action)
  },
  async removeAction(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'action', id }),
    })
  },

  // ---- Sessões ----
  async listSessions(): Promise<MentoringSession[]> {
    const data = await api(BASE)
    return (data.sessions || []).map(mapSession)
  },
  async createSession(input: Partial<MentoringSession>): Promise<MentoringSession> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'session', ...input }),
    })
    return mapSession(data.session)
  },
  async updateSession(id: string, input: Partial<MentoringSession>): Promise<MentoringSession> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'session', id, ...input }),
    })
    return mapSession(data.session)
  },
  async removeSession(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'session', id }),
    })
  },

  // ---- Feedbacks ----
  async createFeedback(input: Partial<MentoringFeedback>): Promise<MentoringFeedback> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'feedback', ...input }),
    })
    return mapFeedback(data.feedback)
  },
  async updateFeedback(id: string, input: Partial<MentoringFeedback>): Promise<MentoringFeedback> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'feedback', id, ...input }),
    })
    return mapFeedback(data.feedback)
  },
  async removeFeedback(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'feedback', id }),
    })
  },

  // ---- Diagnósticos ----
  async createDiagnostic(input: Partial<MentoringDiagnostic>): Promise<MentoringDiagnostic> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'diagnostic', ...input }),
    })
    return mapDiagnostic(data.diagnostic)
  },
  async updateDiagnostic(id: string, input: Partial<MentoringDiagnostic>): Promise<MentoringDiagnostic> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'diagnostic', id, ...input }),
    })
    return mapDiagnostic(data.diagnostic)
  },
  async removeDiagnostic(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'diagnostic', id }),
    })
  },

  // ---- Indicadores ----
  async createIndicator(input: Partial<MentoringIndicator>): Promise<MentoringIndicator> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'indicator', ...input }),
    })
    return mapIndicator(data.indicator)
  },
  async updateIndicator(id: string, input: Partial<MentoringIndicator>): Promise<MentoringIndicator> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'indicator', id, ...input }),
    })
    return mapIndicator(data.indicator)
  },
  async removeIndicator(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'indicator', id }),
    })
  },

  // ---- Documentos ----
  async createDocument(input: Partial<MentoringDocument>): Promise<MentoringDocument> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'document', ...input }),
    })
    return mapDocument(data.document)
  },
  async updateDocument(id: string, input: Partial<MentoringDocument>): Promise<MentoringDocument> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'document', id, ...input }),
    })
    return mapDocument(data.document)
  },
  async removeDocument(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'document', id }),
    })
  },

  // ---- Histórico ----
  async createHistory(input: Partial<MentoringHistory>): Promise<MentoringHistory> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'history', ...input }),
    })
    return mapHistory(data.history)
  },

  // ---- Participantes ----
  async listParticipants(): Promise<Participant[]> {
    const data = await api(BASE)
    return (data.participants || []).map(mapParticipant)
  },
  async createParticipant(input: Partial<Participant>): Promise<Participant> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', ...input }),
    })
    return mapParticipant(data.participant)
  },
  async updateParticipant(id: string, input: Partial<Participant>): Promise<Participant> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', id, ...input }),
    })
    return mapParticipant(data.participant)
  },
  async removeParticipant(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', id }),
    })
  },

  // ---- Competências / Ferramentas / Avaliações / Relatórios ----
  async listCompetencies(): Promise<Competency[]> {
    const data = await api(BASE)
    return (data.competencies || []).map((c: any) => ({ ...c, isCustom: c.is_custom ?? false }))
  },
  async createCompetency(input: Partial<Competency>): Promise<Competency> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'competency', ...input }),
    })
    return { ...data.competency, isCustom: data.competency?.is_custom ?? false }
  },
  async removeCompetency(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'competency', id }),
    })
  },
  async listTools(): Promise<DevelopmentTool[]> {
    const data = await api(BASE)
    return data.tools || []
  },
  async listAssessments(): Promise<Assessment[]> {
    const data = await api(BASE)
    return (data.assessments || []).map((a: any) => ({
      ...a, participantId: a.participant_id, evaluatorId: a.evaluator_id,
      competencyScores: a.assessment_results || [],
    }))
  },
  async createAssessment(input: Partial<Assessment>): Promise<Assessment> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'assessment', ...input }),
    })
    return data.assessment
  },
  async listReports(): Promise<MentoringReport[]> {
    const data = await api(BASE)
    return (data.reports || []).map((r: any) => ({ ...r, participantId: r.participant_id, pdfUrl: r.pdf_url, generatedAt: r.generated_at }))
  },
  async createReport(input: Partial<MentoringReport>): Promise<MentoringReport> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'report', ...input }),
    })
    return data.report
  },
}

// ============ MAPPERS ============

export function mapProgram(r: any): MentoringProgram {
  return {
    ...r,
    companyId: r.company_id,
    companyName: r.company_name,
    rhResponsible: r.rh_responsible,
    startDate: r.start_date,
    endDate: r.end_date,
    mainObjective: r.main_objective,
    menteeName: r.mentee_name,
    menteeRole: r.mentee_role,
    menteeDepartment: r.mentee_department,
    menteeContact: r.mentee_contact,
    menteeGestor: r.mentee_gestor,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    objectives: Array.isArray(r.objectives) ? r.objectives.map(mapObjective) : [],
    actions: Array.isArray(r.actions) ? r.actions.map(mapAction) : [],
    sessions: Array.isArray(r.sessions) ? r.sessions.map(mapSession) : [],
    participants: Array.isArray(r.participants) ? r.participants.map(mapParticipant) : [],
    feedbacks: Array.isArray(r.feedbacks) ? r.feedbacks.map(mapFeedback) : [],
    diagnostics: Array.isArray(r.diagnostics) ? r.diagnostics.map(mapDiagnostic) : [],
    indicators: Array.isArray(r.indicators) ? r.indicators.map(mapIndicator) : [],
    documents: Array.isArray(r.documents) ? r.documents.map(mapDocument) : [],
    history: Array.isArray(r.history) ? r.history.map(mapHistory) : [],
  }
}

export function mapObjective(r: any): MentoringObjective {
  return {
    ...r,
    programId: r.program_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    actions: Array.isArray(r.actions) ? r.actions.map(mapAction) : [],
  }
}

export function mapAction(r: any): MentoringAction {
  return { ...r, programId: r.program_id, objectiveId: r.objective_id, completedDate: r.completed_date, createdAt: r.created_at }
}

export function mapSession(r: any): MentoringSession {
  const participantIds = Array.isArray(r.session_participants)
    ? r.session_participants.map((sp: any) => sp.participant_id)
    : (Array.isArray(r.participantIds) ? r.participantIds : [])
  return {
    ...r,
    programId: r.program_id,
    sessionNumber: r.session_number,
    startTime: r.start_time ? String(r.start_time).slice(0, 5) : undefined,
    keyPoints: r.key_points,
    definedActions: r.defined_actions,
    privateObservations: r.private_observations,
    sessionFeedback: r.session_feedback,
    nextSession: r.next_session,
    participantIds,
    createdAt: r.created_at,
  }
}

export function mapFeedback(r: any): MentoringFeedback {
  return {
    ...r,
    programId: r.program_id,
    sessionId: r.session_id,
    authorType: r.author_type,
    evolutionPerceived: r.evolution_perceived,
    createdAt: r.created_at,
  }
}

export function mapDiagnostic(r: any): MentoringDiagnostic {
  let areas: any[] = []
  try {
    areas = Array.isArray(r.areas) ? r.areas : (r.areas ? JSON.parse(r.areas) : [])
  } catch { areas = [] }
  return { ...r, programId: r.program_id, areas, createdAt: r.created_at }
}

export function mapIndicator(r: any): MentoringIndicator {
  return {
    ...r,
    programId: r.program_id,
    initialValue: r.initial_value,
    currentValue: r.current_value,
    targetValue: r.target_value,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

export function mapDocument(r: any): MentoringDocument {
  return { ...r, programId: r.program_id, sessionId: r.session_id, documentId: r.document_id, fileUrl: r.file_url, createdAt: r.created_at }
}

export function mapHistory(r: any): MentoringHistory {
  return {
    ...r,
    programId: r.program_id,
    entityType: r.entity_type,
    entityId: r.entity_id,
    createdBy: r.created_by,
    createdAt: r.created_at,
  }
}

export function mapParticipant(r: any): Participant {
  return {
    ...r,
    companyId: r.company_id,
    companyName: r.company_name,
    directLeader: r.direct_leader,
    startDate: r.start_date,
    createdAt: r.created_at,
    programId: r.program_id,
    participantType: r.participant_type,
  }
}
