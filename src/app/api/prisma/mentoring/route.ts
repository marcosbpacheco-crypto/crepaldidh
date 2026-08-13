import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

const PROGRAM_INCLUDE = {
  mentoring_objectives: { include: { mentoring_actions: true }, orderBy: { created_at: 'asc' as const } },
  mentoring_actions: true,
  mentoring_sessions: { include: { session_participants: true }, orderBy: { date: 'desc' as const } },
  mentoring_participants: true,
  mentoring_feedbacks: true,
  mentoring_diagnostics: true,
  mentoring_indicators: true,
  mentoring_documents: true,
  mentoring_history: { orderBy: { created_at: 'desc' as const } },
}

function renameProgramRelations(programs: any[]) {
  return programs.map((p: any) => ({
    ...p,
    objectives: p.mentoring_objectives?.map((o: any) => ({
      ...o,
      actions: o.mentoring_actions,
    })),
    actions: p.mentoring_actions,
    sessions: p.mentoring_sessions,
    participants: p.mentoring_participants,
    feedbacks: p.mentoring_feedbacks,
    diagnostics: p.mentoring_diagnostics,
    indicators: p.mentoring_indicators,
    documents: p.mentoring_documents,
    history: p.mentoring_history,
  }))
}

function renameObjectiveRelations(objectives: any[]) {
  return objectives.map((o: any) => ({
    ...o,
    actions: o.mentoring_actions,
  }))
}

export async function GET() {
  try {
    const [
      programs, participants, sessions, objectives, actions,
      feedbacks, diagnostics, indicators, documents, history,
      competencies, tools, assessments, reports,
    ] = await Promise.all([
      prisma.mentoring_programs.findMany({ include: PROGRAM_INCLUDE, orderBy: { created_at: 'desc' } }),
      prisma.mentoring_participants.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_sessions.findMany({ include: { session_participants: true }, orderBy: { date: 'desc' } }),
      prisma.mentoring_objectives.findMany({ include: { mentoring_actions: true }, orderBy: { created_at: 'desc' } }),
      prisma.mentoring_actions.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_feedbacks.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_diagnostics.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_indicators.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_documents.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_history.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.competencies.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.development_tools.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_assessments.findMany({ orderBy: { date: 'desc' } }),
      prisma.mentoring_reports.findMany({ orderBy: { generated_at: 'desc' } }),
    ])
    return NextResponse.json({ programs: renameProgramRelations(programs), participants, sessions, objectives: renameObjectiveRelations(objectives), actions, feedbacks, diagnostics, indicators, documents, history, competencies, tools, assessments, reports })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// helpers
const d = (v: any) => (v ? new Date(v) : null)
const num = (v: any) => (v === '' || v === null || v === undefined ? null : Number(v))
const str = (v: any) => (v === '' || v === null || v === undefined ? null : v)

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'program' || !_type) {
      const pId = id || crypto.randomUUID()
      const now = new Date()
      const program = await prisma.mentoring_programs.upsert({
        where: { id: pId },
        create: {
          id: pId,
          modality: data.modality || 'individual',
          name: data.name,
          company_id: data.companyId || data.company_id || null,
          company_name: data.companyName || data.company_name || null,
          mentor: str(data.mentor),
          rh_responsible: str(data.rhResponsible || data.rh_responsible),
          status: data.status || 'planejada',
          start_date: d(data.startDate || data.start_date),
          end_date: d(data.endDate || data.end_date),
          main_objective: str(data.mainObjective || data.main_objective),
          progress: num(data.progress) ?? 0,
          notes: str(data.notes),
          mentee_name: str(data.menteeName || data.mentee_name),
          mentee_role: str(data.menteeRole || data.mentee_role),
          mentee_department: str(data.menteeDepartment || data.mentee_department),
          mentee_contact: str(data.menteeContact || data.mentee_contact),
          mentee_gestor: str(data.menteeGestor || data.mentee_gestor),
        },
        update: {
          modality: data.modality || 'individual',
          name: data.name,
          company_id: data.companyId || data.company_id || null,
          company_name: data.companyName || data.company_name || null,
          mentor: str(data.mentor),
          rh_responsible: str(data.rhResponsible || data.rh_responsible),
          status: data.status || 'planejada',
          start_date: d(data.startDate || data.start_date),
          end_date: d(data.endDate || data.end_date),
          main_objective: str(data.mainObjective || data.main_objective),
          progress: num(data.progress) ?? 0,
          notes: str(data.notes),
          mentee_name: str(data.menteeName || data.mentee_name),
          mentee_role: str(data.menteeRole || data.mentee_role),
          mentee_department: str(data.menteeDepartment || data.mentee_department),
          mentee_contact: str(data.menteeContact || data.mentee_contact),
          mentee_gestor: str(data.menteeGestor || data.mentee_gestor),
          updated_at: now,
        },
      })
      return NextResponse.json({ program })
    }

    if (_type === 'objective') {
      const oId = id || crypto.randomUUID()
      const objective = await prisma.mentoring_objectives.upsert({
        where: { id: oId },
        create: {
          id: oId,
          program_id: data.programId || data.program_id,
          title: data.title,
          description: str(data.description),
          category: str(data.category),
          priority: str(data.priority),
          indicator: str(data.indicator),
          goal: str(data.goal),
          deadline: d(data.deadline),
          progress: num(data.progress) ?? 0,
          status: data.status || 'nao_iniciado',
          observations: str(data.observations),
          responsible: str(data.responsible),
        },
        update: {
          program_id: data.programId || data.program_id,
          title: data.title,
          description: str(data.description),
          category: str(data.category),
          priority: str(data.priority),
          indicator: str(data.indicator),
          goal: str(data.goal),
          deadline: d(data.deadline),
          progress: num(data.progress) ?? 0,
          status: data.status || 'nao_iniciado',
          observations: str(data.observations),
          responsible: str(data.responsible),
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ objective })
    }

    if (_type === 'action') {
      const aId = id || crypto.randomUUID()
      const action = await prisma.mentoring_actions.upsert({
        where: { id: aId },
        create: {
          id: aId,
          program_id: data.programId || data.program_id,
          objective_id: data.objectiveId || data.objective_id || null,
          description: data.description,
          responsible: str(data.responsible),
          deadline: d(data.deadline),
          priority: str(data.priority),
          status: data.status || 'pendente',
          evidence: str(data.evidence),
          comment: str(data.comment),
          completed_date: d(data.completedDate || data.completed_date),
        },
        update: {
          program_id: data.programId || data.program_id,
          objective_id: data.objectiveId || data.objective_id || null,
          description: data.description,
          responsible: str(data.responsible),
          deadline: d(data.deadline),
          priority: str(data.priority),
          status: data.status || 'pendente',
          evidence: str(data.evidence),
          comment: str(data.comment),
          completed_date: d(data.completedDate || data.completed_date),
        },
      })
      return NextResponse.json({ action })
    }

    if (_type === 'session') {
      const sId = id || crypto.randomUUID()
      const session = await prisma.mentoring_sessions.upsert({
        where: { id: sId },
        create: {
          id: sId,
          program_id: data.programId || data.program_id || null,
          session_number: num(data.sessionNumber || data.session_number),
          type: data.type || 'individual',
          title: data.title,
          date: d(data.date) || new Date(),
          start_time: data.startTime || data.start_time ? new Date(`1970-01-01T${data.startTime || data.start_time}`) : null,
          duration: num(data.duration) ?? 60,
          modality: str(data.modality),
          theme: str(data.theme),
          objective: str(data.objective),
          topics: str(data.topics),
          summary: str(data.summary),
          key_points: str(data.keyPoints || data.key_points),
          decisions: str(data.decisions),
          defined_actions: str(data.definedActions || data.defined_actions),
          private_observations: str(data.privateObservations || data.private_observations),
          session_feedback: str(data.feedback || data.session_feedback),
          next_session: d(data.nextSession || data.next_session),
          mentor: str(data.mentor),
          mentee: str(data.mentee),
          action_plan: str(data.actionPlan || data.action_plan),
          next_steps: str(data.nextSteps || data.next_steps),
          insights: str(data.insights),
          challenges: str(data.challenges),
          potentials: str(data.potentials),
          status: data.status || 'agendada',
        },
        update: {
          program_id: data.programId || data.program_id || null,
          session_number: num(data.sessionNumber || data.session_number),
          type: data.type || 'individual',
          title: data.title,
          date: d(data.date) || new Date(),
          start_time: data.startTime || data.start_time ? new Date(`1970-01-01T${data.startTime || data.start_time}`) : null,
          duration: num(data.duration) ?? 60,
          modality: str(data.modality),
          theme: str(data.theme),
          objective: str(data.objective),
          topics: str(data.topics),
          summary: str(data.summary),
          key_points: str(data.keyPoints || data.key_points),
          decisions: str(data.decisions),
          defined_actions: str(data.definedActions || data.defined_actions),
          private_observations: str(data.privateObservations || data.private_observations),
          session_feedback: str(data.feedback || data.session_feedback),
          next_session: d(data.nextSession || data.next_session),
          mentor: str(data.mentor),
          mentee: str(data.mentee),
          action_plan: str(data.actionPlan || data.action_plan),
          next_steps: str(data.nextSteps || data.next_steps),
          insights: str(data.insights),
          challenges: str(data.challenges),
          potentials: str(data.potentials),
          status: data.status || 'agendada',
        },
      })
      const pIds = Array.isArray(data.participantIds) ? data.participantIds : (data.participantIds ? [data.participantIds] : [])
      if (pIds.length > 0) {
        await prisma.session_participants.deleteMany({ where: { session_id: sId } })
        await prisma.session_participants.createMany({
          data: pIds.map((pid: string) => ({ session_id: sId, participant_id: pid })),
          skipDuplicates: true,
        })
      }
      return NextResponse.json({ session })
    }

    if (_type === 'feedback') {
      const fId = id || crypto.randomUUID()
      const feedback = await prisma.mentoring_feedbacks.upsert({
        where: { id: fId },
        create: {
          id: fId,
          program_id: data.programId || data.program_id,
          session_id: data.sessionId || data.session_id || null,
          author_type: data.authorType || data.author_type || 'mentor',
          satisfaction: num(data.satisfaction),
          relevance: num(data.relevance),
          applicability: num(data.applicability),
          evolution_perceived: num(data.evolutionPerceived || data.evolution_perceived),
          comments: str(data.comments),
        },
        update: {
          program_id: data.programId || data.program_id,
          session_id: data.sessionId || data.session_id || null,
          author_type: data.authorType || data.author_type || 'mentor',
          satisfaction: num(data.satisfaction),
          relevance: num(data.relevance),
          applicability: num(data.applicability),
          evolution_perceived: num(data.evolutionPerceived || data.evolution_perceived),
          comments: str(data.comments),
        },
      })
      return NextResponse.json({ feedback })
    }

    if (_type === 'diagnostic') {
      const diId = id || crypto.randomUUID()
      const diagnostic = await prisma.mentoring_diagnostics.upsert({
        where: { id: diId },
        create: {
          id: diId,
          program_id: data.programId || data.program_id,
          period: str(data.period),
          status: data.status || 'rascunho',
          areas: data.areas ? (typeof data.areas === 'string' ? data.areas : JSON.parse(JSON.stringify(data.areas))) : null,
          observations: str(data.observations),
        },
        update: {
          program_id: data.programId || data.program_id,
          period: str(data.period),
          status: data.status || 'rascunho',
          areas: data.areas ? (typeof data.areas === 'string' ? data.areas : JSON.parse(JSON.stringify(data.areas))) : null,
          observations: str(data.observations),
        },
      })
      return NextResponse.json({ diagnostic })
    }

    if (_type === 'indicator') {
      const iId = id || crypto.randomUUID()
      const indicator = await prisma.mentoring_indicators.upsert({
        where: { id: iId },
        create: {
          id: iId,
          program_id: data.programId || data.program_id,
          name: data.name,
          description: str(data.description),
          unit: str(data.unit),
          initial_value: str(data.initialValue || data.initial_value),
          current_value: str(data.currentValue || data.current_value),
          target_value: str(data.targetValue || data.target_value),
          trend: str(data.trend),
          period: str(data.period),
          source: str(data.source),
        },
        update: {
          program_id: data.programId || data.program_id,
          name: data.name,
          description: str(data.description),
          unit: str(data.unit),
          initial_value: str(data.initialValue || data.initial_value),
          current_value: str(data.currentValue || data.current_value),
          target_value: str(data.targetValue || data.target_value),
          trend: str(data.trend),
          period: str(data.period),
          source: str(data.source),
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ indicator })
    }

    if (_type === 'document') {
      const mId = id || crypto.randomUUID()
      const doc = await prisma.mentoring_documents.upsert({
        where: { id: mId },
        create: {
          id: mId,
          program_id: data.programId || data.program_id,
          session_id: data.sessionId || data.session_id || null,
          document_id: data.documentId || data.document_id || null,
          name: data.name,
          type: str(data.type),
          file_url: str(data.fileUrl || data.file_url),
          description: str(data.description),
        },
        update: {
          program_id: data.programId || data.program_id,
          session_id: data.sessionId || data.session_id || null,
          document_id: data.documentId || data.document_id || null,
          name: data.name,
          type: str(data.type),
          file_url: str(data.fileUrl || data.file_url),
          description: str(data.description),
        },
      })
      return NextResponse.json({ document: doc })
    }

    if (_type === 'history') {
      const hId = id || crypto.randomUUID()
      const history = await prisma.mentoring_history.create({
        data: {
          id: hId,
          program_id: data.programId || data.program_id,
          entity_type: str(data.entityType || data.entity_type),
          entity_id: str(data.entityId || data.entity_id),
          action: str(data.action),
          description: str(data.description),
          created_by: str(data.createdBy || data.created_by),
        },
      })
      return NextResponse.json({ history })
    }

    if (_type === 'participant') {
      const pId = id || crypto.randomUUID()
      const participant = await prisma.mentoring_participants.upsert({
        where: { id: pId },
        create: {
          id: pId,
          name: data.name,
          company_id: data.companyId || data.company_id || null,
          company_name: data.companyName || data.company_name || '—',
          unit: data.unit || null,
          sector: data.sector || null,
          role: data.role || 'Participante',
          direct_leader: data.directLeader || data.direct_leader || null,
          email: data.email || '',
          phone: data.phone || null,
          start_date: d(data.startDate || data.start_date) || new Date(),
          notes: data.notes || null,
          avatar: data.avatar || null,
          program_id: data.programId || data.program_id || null,
          participant_type: data.participantType || data.participant_type || null,
        },
        update: {
          name: data.name,
          company_id: data.companyId || data.company_id || null,
          company_name: data.companyName || data.company_name || '—',
          unit: data.unit || null,
          sector: data.sector || null,
          role: data.role || 'Participante',
          direct_leader: data.directLeader || data.direct_leader || null,
          email: data.email || '',
          phone: data.phone || null,
          start_date: d(data.startDate || data.start_date) || new Date(),
          notes: data.notes || null,
          avatar: data.avatar || null,
          program_id: data.programId || data.program_id || null,
          participant_type: data.participantType || data.participant_type || null,
        },
      })
      return NextResponse.json({ participant })
    }

    if (_type === 'assessment') {
      const aId = id || crypto.randomUUID()
      const assessment = await prisma.mentoring_assessments.upsert({
        where: { id: aId },
        create: {
          id: aId,
          participant_id: data.participantId || data.participant_id || null,
          type: data.type || 'autoavaliacao',
          evaluator_id: data.evaluatorId || data.evaluator_id || null,
          date: d(data.date) || new Date(),
          observations: data.observations || data.notes || null,
        },
        update: {
          participant_id: data.participantId || data.participant_id || null,
          type: data.type || 'autoavaliacao',
          evaluator_id: data.evaluatorId || data.evaluator_id || null,
          date: d(data.date) || new Date(),
          observations: data.observations || data.notes || null,
        },
      })
      return NextResponse.json({ assessment })
    }

    if (_type === 'competency') {
      const compId = id || crypto.randomUUID()
      const competency = await prisma.competencies.upsert({
        where: { id: compId },
        create: { id: compId, name: data.name, description: data.description || data.descricao || null, category: data.category || null, is_custom: data.isCustom ?? false },
        update: { name: data.name, description: data.description || data.descricao || null, category: data.category || null, is_custom: data.isCustom ?? false },
      })
      return NextResponse.json({ competency })
    }

    if (_type === 'tool') {
      const toolId = id || crypto.randomUUID()
      const tool = await prisma.development_tools.upsert({
        where: { id: toolId },
        create: { id: toolId, name: data.name, category: data.category || null, description: data.description || null },
        update: { name: data.name, category: data.category || null, description: data.description || null },
      })
      return NextResponse.json({ tool })
    }

    if (_type === 'report') {
      const rId = id || crypto.randomUUID()
      const report = await prisma.mentoring_reports.upsert({
        where: { id: rId },
        create: {
          id: rId,
          participant_id: data.participantId || data.participant_id || null,
          type: data.type || 'general',
          title: data.title,
          pdf_url: data.pdfUrl || data.pdf_url || data.content || null,
        },
        update: {
          participant_id: data.participantId || data.participant_id || null,
          type: data.type || 'general',
          title: data.title,
          pdf_url: data.pdfUrl || data.pdf_url || data.content || null,
        },
      })
      return NextResponse.json({ report })
    }

    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'program' || !_type) {
      const program = await prisma.mentoring_programs.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.modality !== undefined && { modality: data.modality }),
          ...(data.companyId !== undefined && { company_id: data.companyId }),
          ...(data.companyName !== undefined && { company_name: data.companyName }),
          ...(data.mentor !== undefined && { mentor: data.mentor }),
          ...(data.rhResponsible !== undefined && { rh_responsible: data.rhResponsible }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.startDate !== undefined && { start_date: d(data.startDate) }),
          ...(data.endDate !== undefined && { end_date: d(data.endDate) }),
          ...(data.mainObjective !== undefined && { main_objective: data.mainObjective }),
          ...(data.progress !== undefined && { progress: num(data.progress) ?? 0 }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.menteeName !== undefined && { mentee_name: data.menteeName }),
          ...(data.menteeRole !== undefined && { mentee_role: data.menteeRole }),
          ...(data.menteeDepartment !== undefined && { mentee_department: data.menteeDepartment }),
          ...(data.menteeContact !== undefined && { mentee_contact: data.menteeContact }),
          ...(data.menteeGestor !== undefined && { mentee_gestor: data.menteeGestor }),
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ program })
    }

    if (_type === 'objective') {
      const objective = await prisma.mentoring_objectives.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.programId !== undefined && { program_id: data.programId }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.category !== undefined && { category: data.category }),
          ...(data.priority !== undefined && { priority: data.priority }),
          ...(data.indicator !== undefined && { indicator: data.indicator }),
          ...(data.goal !== undefined && { goal: data.goal }),
          ...(data.deadline !== undefined && { deadline: d(data.deadline) }),
          ...(data.progress !== undefined && { progress: num(data.progress) ?? 0 }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.observations !== undefined && { observations: data.observations }),
          ...(data.responsible !== undefined && { responsible: data.responsible }),
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ objective })
    }

    if (_type === 'action') {
      const action = await prisma.mentoring_actions.update({
        where: { id },
        data: {
          ...(data.description !== undefined && { description: data.description }),
          ...(data.programId !== undefined && { program_id: data.programId }),
          ...(data.objectiveId !== undefined && { objective_id: data.objectiveId }),
          ...(data.responsible !== undefined && { responsible: data.responsible }),
          ...(data.deadline !== undefined && { deadline: d(data.deadline) }),
          ...(data.priority !== undefined && { priority: data.priority }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.evidence !== undefined && { evidence: data.evidence }),
          ...(data.comment !== undefined && { comment: data.comment }),
          ...(data.completedDate !== undefined && { completed_date: d(data.completedDate) }),
        },
      })
      return NextResponse.json({ action })
    }

    if (_type === 'session') {
      const session = await prisma.mentoring_sessions.update({
        where: { id },
        data: {
          ...(data.type !== undefined && { type: data.type }),
          ...(data.title !== undefined && { title: data.title }),
          ...(data.date !== undefined && { date: d(data.date) || new Date() }),
          ...(data.programId !== undefined && { program_id: data.programId }),
          ...(data.sessionNumber !== undefined && { session_number: num(data.sessionNumber) }),
          ...(data.startTime !== undefined && { start_time: data.startTime ? new Date(`1970-01-01T${data.startTime}`) : null }),
          ...(data.duration !== undefined && { duration: num(data.duration) ?? 60 }),
          ...(data.modality !== undefined && { modality: data.modality }),
          ...(data.theme !== undefined && { theme: data.theme }),
          ...(data.objective !== undefined && { objective: data.objective }),
          ...(data.topics !== undefined && { topics: data.topics }),
          ...(data.summary !== undefined && { summary: data.summary }),
          ...(data.keyPoints !== undefined && { key_points: data.keyPoints }),
          ...(data.decisions !== undefined && { decisions: data.decisions }),
          ...(data.definedActions !== undefined && { defined_actions: data.definedActions }),
          ...(data.privateObservations !== undefined && { private_observations: data.privateObservations }),
          ...(data.feedback !== undefined && { session_feedback: data.feedback }),
          ...(data.nextSession !== undefined && { next_session: d(data.nextSession) }),
          ...(data.mentor !== undefined && { mentor: data.mentor }),
          ...(data.mentee !== undefined && { mentee: data.mentee }),
          ...(data.actionPlan !== undefined && { action_plan: data.actionPlan }),
          ...(data.nextSteps !== undefined && { next_steps: data.nextSteps }),
          ...(data.insights !== undefined && { insights: data.insights }),
          ...(data.challenges !== undefined && { challenges: data.challenges }),
          ...(data.potentials !== undefined && { potentials: data.potentials }),
          ...(data.status !== undefined && { status: data.status }),
        },
      })
      return NextResponse.json({ session })
    }

    if (_type === 'feedback') {
      const feedback = await prisma.mentoring_feedbacks.update({
        where: { id },
        data: {
          ...(data.authorType !== undefined && { author_type: data.authorType }),
          ...(data.satisfaction !== undefined && { satisfaction: num(data.satisfaction) }),
          ...(data.relevance !== undefined && { relevance: num(data.relevance) }),
          ...(data.applicability !== undefined && { applicability: num(data.applicability) }),
          ...(data.evolutionPerceived !== undefined && { evolution_perceived: num(data.evolutionPerceived) }),
          ...(data.comments !== undefined && { comments: data.comments }),
        },
      })
      return NextResponse.json({ feedback })
    }

    if (_type === 'diagnostic') {
      const diagnostic = await prisma.mentoring_diagnostics.update({
        where: { id },
        data: {
          ...(data.period !== undefined && { period: data.period }),
          ...(data.status !== undefined && { status: data.status }),
          ...(data.areas !== undefined && { areas: typeof data.areas === 'string' ? data.areas : JSON.parse(JSON.stringify(data.areas)) }),
          ...(data.observations !== undefined && { observations: data.observations }),
        },
      })
      return NextResponse.json({ diagnostic })
    }

    if (_type === 'indicator') {
      const indicator = await prisma.mentoring_indicators.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.unit !== undefined && { unit: data.unit }),
          ...(data.initialValue !== undefined && { initial_value: data.initialValue }),
          ...(data.currentValue !== undefined && { current_value: data.currentValue }),
          ...(data.targetValue !== undefined && { target_value: data.targetValue }),
          ...(data.trend !== undefined && { trend: data.trend }),
          ...(data.period !== undefined && { period: data.period }),
          ...(data.source !== undefined && { source: data.source }),
          updated_at: new Date(),
        },
      })
      return NextResponse.json({ indicator })
    }

    if (_type === 'document') {
      const doc = await prisma.mentoring_documents.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.fileUrl !== undefined && { file_url: data.fileUrl }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.documentId !== undefined && { document_id: data.documentId }),
          ...(data.sessionId !== undefined && { session_id: data.sessionId }),
        },
      })
      return NextResponse.json({ document: doc })
    }

    if (_type === 'participant') {
      const participant = await prisma.mentoring_participants.update({
        where: { id },
        data: {
          ...(data.name !== undefined && { name: data.name }),
          ...(data.companyId !== undefined && { company_id: data.companyId }),
          ...(data.companyName !== undefined && { company_name: data.companyName }),
          ...(data.unit !== undefined && { unit: data.unit }),
          ...(data.sector !== undefined && { sector: data.sector }),
          ...(data.role !== undefined && { role: data.role }),
          ...(data.directLeader !== undefined && { direct_leader: data.directLeader }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.startDate !== undefined && { start_date: d(data.startDate) || new Date() }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
          ...(data.programId !== undefined && { program_id: data.programId }),
          ...(data.participantType !== undefined && { participant_type: data.participantType }),
        },
      })
      return NextResponse.json({ participant })
    }

    if (_type === 'assessment') {
      const assessment = await prisma.mentoring_assessments.update({
        where: { id },
        data: {
          ...(data.type !== undefined && { type: data.type }),
          ...(data.date !== undefined && { date: d(data.date) || new Date() }),
          ...(data.observations !== undefined && { observations: data.observations }),
          ...(data.participantId !== undefined && { participant_id: data.participantId }),
          ...(data.evaluatorId !== undefined && { evaluator_id: data.evaluatorId }),
        },
      })
      return NextResponse.json({ assessment })
    }

    if (_type === 'report') {
      const report = await prisma.mentoring_reports.update({
        where: { id },
        data: {
          ...(data.title !== undefined && { title: data.title }),
          ...(data.pdfUrl !== undefined && { pdf_url: data.pdfUrl }),
          ...(data.type !== undefined && { type: data.type }),
          ...(data.participantId !== undefined && { participant_id: data.participantId }),
        },
      })
      return NextResponse.json({ report })
    }

    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'program') {
      await prisma.mentoring_programs.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'objective') {
      await prisma.mentoring_objectives.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'action') {
      await prisma.mentoring_actions.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'session') {
      await prisma.mentoring_sessions.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'feedback') {
      await prisma.mentoring_feedbacks.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'diagnostic') {
      await prisma.mentoring_diagnostics.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'indicator') {
      await prisma.mentoring_indicators.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'document') {
      await prisma.mentoring_documents.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'history') {
      await prisma.mentoring_history.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'assessment') {
      await prisma.mentoring_assessments.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }
    if (_type === 'report') {
      await prisma.mentoring_reports.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.mentoring_participants.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
