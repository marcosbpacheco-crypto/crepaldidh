import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [events, sipatPrograms] = await Promise.all([
      prisma.training_events.findMany({
        where: { deleted_at: null },
        include: {
          training_participants: true,
          training_feedbacks: true,
          training_certificates: true,
          training_materials: true,
          training_reports: true,
        },
        orderBy: { created_at: 'desc' },
      }),
      prisma.sipat_programs.findMany({ orderBy: { created_at: 'desc' } }),
    ])
    return NextResponse.json({ events, sipatPrograms })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'event' || !_type) {
      const eventId = id || crypto.randomUUID()
      const event = await prisma.training_events.upsert({
        where: { id: eventId },
        create: {
          id: eventId,
          company_id: data.companyId || data.company_id,
          project_id: data.projectId || data.project_id || null,
          sipat_program_id: data.sipatProgramId || data.sipat_program_id || null,
          type: data.type,
          name: data.name,
          theme: data.theme,
          objective: data.objective || null,
          target_audience: data.targetAudience || data.target_audience || null,
          facilitator: data.facilitator,
          modality: data.modality,
          location: data.location || null,
          event_date: new Date(data.eventDate || data.event_date),
          start_time: new Date(data.startTime || data.start_time),
          end_time: new Date(data.endTime || data.end_time),
          hours_duration: data.hoursDuration ?? data.hours_duration ?? 0,
          expected_participants: data.expectedParticipants ?? data.expected_participants ?? 0,
          cost: data.cost ?? 0,
          status: data.status || 'planejado',
          notes: data.notes || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
        update: {
          company_id: data.companyId || data.company_id,
          project_id: data.projectId || data.project_id || null,
          sipat_program_id: data.sipatProgramId || data.sipat_program_id || null,
          type: data.type,
          name: data.name,
          theme: data.theme,
          objective: data.objective || null,
          target_audience: data.targetAudience || data.target_audience || null,
          facilitator: data.facilitator,
          modality: data.modality,
          location: data.location || null,
          event_date: new Date(data.eventDate || data.event_date),
          start_time: new Date(data.startTime || data.start_time),
          end_time: new Date(data.endTime || data.end_time),
          hours_duration: data.hoursDuration ?? data.hours_duration ?? 0,
          expected_participants: data.expectedParticipants ?? data.expected_participants ?? 0,
          cost: data.cost ?? 0,
          status: data.status || 'planejado',
          notes: data.notes || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
      })
      return NextResponse.json({ event })
    }

    if (_type === 'participant') {
      const pId = id || crypto.randomUUID()
      const participant = await prisma.training_participants.upsert({
        where: { id: pId },
        create: {
          id: pId,
          event_id: data.eventId || data.event_id,
          crm_contact_id: data.crmContactId || data.crm_contact_id || null,
          name: data.name,
          company_name: data.companyName || data.company_name,
          unit: data.unit || null,
          sector: data.sector || null,
          role: data.role || null,
          email: data.email || null,
          phone: data.phone || null,
        },
        update: {
          event_id: data.eventId || data.event_id,
          crm_contact_id: data.crmContactId || data.crm_contact_id || null,
          name: data.name,
          company_name: data.companyName || data.company_name,
          unit: data.unit || null,
          sector: data.sector || null,
          role: data.role || null,
          email: data.email || null,
          phone: data.phone || null,
        },
      })
      return NextResponse.json({ participant })
    }

    if (_type === 'feedback') {
      const fId = id || crypto.randomUUID()
      const feedback = await prisma.training_feedbacks.upsert({
        where: { id: fId },
        create: {
          id: fId,
          event_id: data.eventId || data.event_id,
          participant_id: data.participantId || data.participant_id || null,
          rating_general: data.ratingGeneral ?? data.rating_general ?? null,
          clarity_content: data.clarityContent ?? data.clarity_content ?? null,
          applicability: data.applicability ?? null,
          didactics: data.didactics ?? null,
          organization: data.organization ?? null,
          nps: data.nps ?? null,
          comments: data.comments || null,
        },
        update: {
          event_id: data.eventId || data.event_id,
          participant_id: data.participantId || data.participant_id || null,
          rating_general: data.ratingGeneral ?? data.rating_general ?? null,
          clarity_content: data.clarityContent ?? data.clarity_content ?? null,
          applicability: data.applicability ?? null,
          didactics: data.didactics ?? null,
          organization: data.organization ?? null,
          nps: data.nps ?? null,
          comments: data.comments || null,
        },
      })
      return NextResponse.json({ feedback })
    }

    if (_type === 'certificate') {
      const certId = id || crypto.randomUUID()
      const certificate = await prisma.training_certificates.upsert({
        where: { id: certId },
        create: {
          id: certId,
          participant_id: data.participantId || data.participant_id,
          event_id: data.eventId || data.event_id,
          validation_code: data.validationCode || data.validation_code,
          pdf_url: data.pdfUrl || data.pdf_url || null,
        },
        update: {
          participant_id: data.participantId || data.participant_id,
          event_id: data.eventId || data.event_id,
          validation_code: data.validationCode || data.validation_code,
          pdf_url: data.pdfUrl || data.pdf_url || null,
        },
      })
      return NextResponse.json({ certificate })
    }

    if (_type === 'material') {
      const matId = id || crypto.randomUUID()
      const material = await prisma.training_materials.upsert({
        where: { id: matId },
        create: {
          id: matId,
          event_id: data.eventId || data.event_id,
          name: data.name,
          type: data.type,
          file_url: data.fileUrl || data.file_url,
        },
        update: {
          event_id: data.eventId || data.event_id,
          name: data.name,
          type: data.type,
          file_url: data.fileUrl || data.file_url,
        },
      })
      return NextResponse.json({ material })
    }

    if (_type === 'report') {
      const rptId = id || crypto.randomUUID()
      const report = await prisma.training_reports.upsert({
        where: { id: rptId },
        create: {
          id: rptId,
          event_id: data.eventId || data.event_id,
          pdf_url: data.pdfUrl || data.pdf_url || null,
          recommendations: data.recommendations || null,
          executive_summary: data.executiveSummary || data.executive_summary || null,
        },
        update: {
          event_id: data.eventId || data.event_id,
          pdf_url: data.pdfUrl || data.pdf_url || null,
          recommendations: data.recommendations || null,
          executive_summary: data.executiveSummary || data.executive_summary || null,
        },
      })
      return NextResponse.json({ report })
    }

    if (_type === 'sipat') {
      const sipId = id || crypto.randomUUID()
      const sipat = await prisma.sipat_programs.upsert({
        where: { id: sipId },
        create: {
          id: sipId,
          company_id: data.companyId || data.company_id,
          title: data.title,
          theme: data.theme,
          start_date: new Date(data.startDate || data.start_date),
          end_date: new Date(data.endDate || data.end_date),
          status: data.status || 'planejado',
          observations: data.observations || null,
        },
        update: {
          company_id: data.companyId || data.company_id,
          title: data.title,
          theme: data.theme,
          start_date: new Date(data.startDate || data.start_date),
          end_date: new Date(data.endDate || data.end_date),
          status: data.status || 'planejado',
          observations: data.observations || null,
        },
      })
      return NextResponse.json({ sipat })
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

    if (_type === 'participant') {
      const participant = await prisma.training_participants.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.companyName && { company_name: data.companyName }),
          ...(data.unit !== undefined && { unit: data.unit }),
          ...(data.sector !== undefined && { sector: data.sector }),
          ...(data.role !== undefined && { role: data.role }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.phone !== undefined && { phone: data.phone }),
        },
      })
      return NextResponse.json({ participant })
    }

    const event = await prisma.training_events.update({
      where: { id },
      data: {
        ...(data.type && { type: data.type }),
        ...(data.name && { name: data.name }),
        ...(data.theme && { theme: data.theme }),
        ...(data.objective !== undefined && { objective: data.objective }),
        ...(data.targetAudience && { target_audience: data.targetAudience }),
        ...(data.facilitator && { facilitator: data.facilitator }),
        ...(data.modality && { modality: data.modality }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.eventDate && { event_date: new Date(data.eventDate) }),
        ...(data.startTime && { start_time: new Date(data.startTime) }),
        ...(data.endTime && { end_time: new Date(data.endTime) }),
        ...(data.hoursDuration !== undefined && { hours_duration: data.hoursDuration }),
        ...(data.expectedParticipants !== undefined && { expected_participants: data.expectedParticipants }),
        ...(data.cost !== undefined && { cost: data.cost }),
        ...(data.status && { status: data.status }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })
    return NextResponse.json({ event })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'event' || !_type) {
      await prisma.training_events.update({
        where: { id },
        data: { deleted_at: new Date() },
      })
      return NextResponse.json({ success: true })
    }

    if (_type === 'participant') {
      await prisma.training_participants.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'feedback') {
      await prisma.training_feedbacks.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'certificate') {
      await prisma.training_certificates.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'material') {
      await prisma.training_materials.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'report') {
      await prisma.training_reports.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.training_events.update({
      where: { id },
      data: { deleted_at: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
