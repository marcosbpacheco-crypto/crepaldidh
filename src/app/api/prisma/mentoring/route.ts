import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [participants, sessions, pdi_plans, competencies, tools, assessments, reports] = await Promise.all([
      prisma.mentoring_participants.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_sessions.findMany({ orderBy: { date: 'desc' } }),
      prisma.pdi_plans.findMany({ include: { pdi_goals: true }, orderBy: { created_at: 'desc' } }),
      prisma.competencies.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.development_tools.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.mentoring_assessments.findMany({ orderBy: { date: 'desc' } }),
      prisma.mentoring_reports.findMany({ orderBy: { generated_at: 'desc' } }),
    ])
    return NextResponse.json({ participants, sessions, pdi_plans, competencies, tools, assessments, reports })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'participant' || !_type) {
      const pId = id || crypto.randomUUID()
      const participant = await prisma.mentoring_participants.upsert({
        where: { id: pId },
        create: {
          id: pId,
          name: data.name,
          company_id: data.companyId || data.company_id || null,
          company_name: data.companyName || data.company_name,
          unit: data.unit || null,
          sector: data.sector || null,
          role: data.role,
          direct_leader: data.directLeader || data.direct_leader || null,
          email: data.email,
          phone: data.phone || null,
          start_date: data.startDate || data.start_date ? new Date(data.startDate || data.start_date) : new Date(),
          notes: data.notes || null,
          avatar: data.avatar || null,
        },
        update: {
          name: data.name,
          company_id: data.companyId || data.company_id || null,
          company_name: data.companyName || data.company_name,
          unit: data.unit || null,
          sector: data.sector || null,
          role: data.role,
          direct_leader: data.directLeader || data.direct_leader || null,
          email: data.email,
          phone: data.phone || null,
          start_date: data.startDate || data.start_date ? new Date(data.startDate || data.start_date) : new Date(),
          notes: data.notes || null,
          avatar: data.avatar || null,
        },
      })
      return NextResponse.json({ participant })
    }

    if (_type === 'session') {
      const sId = id || crypto.randomUUID()
      const session = await prisma.mentoring_sessions.upsert({
        where: { id: sId },
        create: {
          id: sId,
          type: data.type,
          title: data.title,
          date: data.date ? new Date(data.date) : new Date(),
          duration: data.duration,
          objective: data.objective || null,
          topics: data.topics || null,
          action_plan: data.actionPlan || data.action_plan || null,
          next_steps: data.nextSteps || data.next_steps || null,
          insights: data.insights || null,
          challenges: data.challenges || null,
          potentials: data.potentials || null,
          status: data.status || 'agendada',
        },
        update: {
          type: data.type,
          title: data.title,
          date: data.date ? new Date(data.date) : new Date(),
          duration: data.duration,
          objective: data.objective || null,
          topics: data.topics || null,
          action_plan: data.actionPlan || data.action_plan || null,
          next_steps: data.nextSteps || data.next_steps || null,
          insights: data.insights || null,
          challenges: data.challenges || null,
          potentials: data.potentials || null,
          status: data.status || 'agendada',
        },
      })
      return NextResponse.json({ session })
    }

    if (_type === 'pdiPlan') {
      const ppId = id || crypto.randomUUID()
      const pdiPlan = await prisma.pdi_plans.upsert({
        where: { id: ppId },
        create: {
          id: ppId,
          participant_id: data.participantId || data.participant_id || null,
          title: data.title,
          period: data.period || null,
        },
        update: {
          participant_id: data.participantId || data.participant_id || null,
          title: data.title,
          period: data.period || null,
        },
      })
      return NextResponse.json({ pdiPlan })
    }

    if (_type === 'pdiGoal') {
      const pgId = id || crypto.randomUUID()
      const pdiGoal = await prisma.pdi_goals.upsert({
        where: { id: pgId },
        create: {
          id: pgId,
          pdi_id: data.pdiId || data.pdi_id || null,
          competency: data.competency,
          objective: data.objective,
          action: data.action,
          responsible: data.responsible,
          deadline: data.deadline ? new Date(data.deadline) : new Date(),
          indicator: data.indicator || null,
          status: data.status || 'nao_iniciado',
        },
        update: {
          pdi_id: data.pdiId || data.pdi_id || null,
          competency: data.competency,
          objective: data.objective,
          action: data.action,
          responsible: data.responsible,
          deadline: data.deadline ? new Date(data.deadline) : new Date(),
          indicator: data.indicator || null,
          status: data.status || 'nao_iniciado',
        },
      })
      return NextResponse.json({ pdiGoal })
    }

    if (_type === 'assessment') {
      const aId = id || crypto.randomUUID()
      const assessment = await prisma.mentoring_assessments.upsert({
        where: { id: aId },
        create: {
          id: aId,
          participant_id: data.participantId || data.participant_id || null,
          type: data.type,
          evaluator_id: data.evaluatorId || data.evaluator_id || null,
          date: data.date ? new Date(data.date) : new Date(),
          observations: data.observations || data.notes || null,
        },
        update: {
          participant_id: data.participantId || data.participant_id || null,
          type: data.type,
          evaluator_id: data.evaluatorId || data.evaluator_id || null,
          date: data.date ? new Date(data.date) : new Date(),
          observations: data.observations || data.notes || null,
        },
      })
      return NextResponse.json({ assessment })
    }

    if (_type === 'competency') {
      const compId = id || crypto.randomUUID()
      const competency = await prisma.competencies.upsert({
        where: { id: compId },
        create: { id: compId, name: data.name, description: data.description || data.descricao || null, category: data.category || null },
        update: { name: data.name, description: data.description || data.descricao || null, category: data.category || null },
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

    if (_type === 'participant' || !_type) {
      const participant = await prisma.mentoring_participants.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.companyId && { company_id: data.companyId }),
          ...(data.company_name && { company_name: data.company_name }),
          ...(data.companyName && { company_name: data.companyName }),
          ...(data.unit !== undefined && { unit: data.unit }),
          ...(data.sector !== undefined && { sector: data.sector }),
          ...(data.role && { role: data.role }),
          ...(data.directLeader !== undefined && { direct_leader: data.directLeader }),
          ...(data.email && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
          ...(data.startDate && { start_date: new Date(data.startDate) }),
          ...(data.start_date && { start_date: new Date(data.start_date) }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.avatar !== undefined && { avatar: data.avatar }),
        },
      })
      return NextResponse.json({ participant })
    }

    if (_type === 'session') {
      const session = await prisma.mentoring_sessions.update({
        where: { id },
        data: {
          ...(data.type && { type: data.type }),
          ...(data.title && { title: data.title }),
          ...(data.date && { date: new Date(data.date) }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.objective !== undefined && { objective: data.objective }),
          ...(data.topics !== undefined && { topics: data.topics }),
          ...(data.actionPlan !== undefined && { action_plan: data.actionPlan }),
          ...(data.action_plan !== undefined && { action_plan: data.action_plan }),
          ...(data.nextSteps !== undefined && { next_steps: data.nextSteps }),
          ...(data.next_steps !== undefined && { next_steps: data.next_steps }),
          ...(data.insights !== undefined && { insights: data.insights }),
          ...(data.challenges !== undefined && { challenges: data.challenges }),
          ...(data.potentials !== undefined && { potentials: data.potentials }),
          ...(data.status && { status: data.status }),
        },
      })
      return NextResponse.json({ session })
    }

    if (_type === 'pdiPlan') {
      const pdiPlan = await prisma.pdi_plans.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.period !== undefined && { period: data.period }),
          ...(data.participantId && { participant_id: data.participantId }),
        },
      })
      return NextResponse.json({ pdiPlan })
    }

    if (_type === 'pdiGoal') {
      const pdiGoal = await prisma.pdi_goals.update({
        where: { id },
        data: {
          ...(data.competency && { competency: data.competency }),
          ...(data.objective && { objective: data.objective }),
          ...(data.action && { action: data.action }),
          ...(data.responsible && { responsible: data.responsible }),
          ...(data.deadline && { deadline: new Date(data.deadline) }),
          ...(data.indicator !== undefined && { indicator: data.indicator }),
          ...(data.status && { status: data.status }),
          ...(data.pdiId && { pdi_id: data.pdiId }),
        },
      })
      return NextResponse.json({ pdiGoal })
    }

    if (_type === 'assessment') {
      const assessment = await prisma.mentoring_assessments.update({
        where: { id },
        data: {
          ...(data.type && { type: data.type }),
          ...(data.date && { date: new Date(data.date) }),
          ...(data.observations !== undefined && { observations: data.observations }),
          ...(data.notes !== undefined && { observations: data.notes }),
          ...(data.participantId && { participant_id: data.participantId }),
          ...(data.evaluatorId !== undefined && { evaluator_id: data.evaluatorId }),
        },
      })
      return NextResponse.json({ assessment })
    }

    if (_type === 'report') {
      const report = await prisma.mentoring_reports.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.pdfUrl !== undefined && { pdf_url: data.pdfUrl }),
          ...(data.pdf_url !== undefined && { pdf_url: data.pdf_url }),
          ...(data.content !== undefined && { pdf_url: data.content }),
          ...(data.type && { type: data.type }),
          ...(data.participantId && { participant_id: data.participantId }),
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

    if (_type === 'session') {
      await prisma.mentoring_sessions.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'pdiPlan') {
      await prisma.pdi_plans.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'pdiGoal') {
      await prisma.pdi_goals.delete({ where: { id } })
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
