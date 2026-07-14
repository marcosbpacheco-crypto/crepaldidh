import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const events = await prisma.calendar_events.findMany({
      where: { deleted_at: null },
      include: {
        calendar_participants: true,
        calendar_reminders: true,
      },
      orderBy: { start_time: 'asc' },
    })
    return NextResponse.json({ events })
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
      const event = await prisma.calendar_events.upsert({
        where: { id: eventId },
        create: {
          id: eventId,
          title: data.title,
          description: data.description || null,
          event_type: data.eventType || data.event_type,
          start_time: new Date(data.startTime || data.start_time),
          end_time: new Date(data.endTime || data.end_time),
          all_day: data.allDay ?? data.all_day ?? false,
          location: data.location || null,
          color: data.color || null,
          company_id: data.companyId || data.company_id || null,
          created_by: data.createdBy || data.created_by || null,
          status: data.status || 'confirmed',
          tenant_id: data.tenantId || data.tenant_id || null,
          project_id: data.projectId || data.project_id || null,
          responsible_user_id: data.responsibleUserId || data.responsible_user_id || null,
        },
        update: {
          title: data.title,
          description: data.description || null,
          event_type: data.eventType || data.event_type,
          start_time: new Date(data.startTime || data.start_time),
          end_time: new Date(data.endTime || data.end_time),
          all_day: data.allDay ?? data.all_day ?? false,
          location: data.location || null,
          color: data.color || null,
          company_id: data.companyId || data.company_id || null,
          created_by: data.createdBy || data.created_by || null,
          status: data.status || 'confirmed',
          tenant_id: data.tenantId || data.tenant_id || null,
          project_id: data.projectId || data.project_id || null,
          responsible_user_id: data.responsibleUserId || data.responsible_user_id || null,
        },
      })
      return NextResponse.json({ event })
    }

    if (_type === 'participant') {
      const participantId = id || crypto.randomUUID()
      const participant = await prisma.calendar_participants.upsert({
        where: { id: participantId },
        create: {
          id: participantId,
          event_id: data.eventId || data.event_id,
          user_id: data.userId || data.user_id || null,
          name: data.name,
          email: data.email || null,
          status: data.status || 'pending',
        },
        update: {
          event_id: data.eventId || data.event_id,
          user_id: data.userId || data.user_id || null,
          name: data.name,
          email: data.email || null,
          status: data.status || 'pending',
        },
      })
      return NextResponse.json({ participant })
    }

    if (_type === 'reminder') {
      const reminderId = id || crypto.randomUUID()
      const reminder = await prisma.calendar_reminders.upsert({
        where: { id: reminderId },
        create: {
          id: reminderId,
          event_id: data.eventId || data.event_id,
          minutes_before: data.minutesBefore ?? data.minutes_before ?? 15,
          sent: data.sent ?? false,
        },
        update: {
          event_id: data.eventId || data.event_id,
          minutes_before: data.minutesBefore ?? data.minutes_before ?? 15,
          sent: data.sent ?? false,
        },
      })
      return NextResponse.json({ reminder })
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

    if (_type === 'restore') {
      const event = await prisma.calendar_events.update({
        where: { id },
        data: { deleted_at: null, status: 'confirmed' },
      })
      return NextResponse.json({ event })
    }

    if (_type === 'participant') {
      const participant = await prisma.calendar_participants.update({
        where: { id },
        data: {
          ...(data.name && { name: data.name }),
          ...(data.email !== undefined && { email: data.email }),
          ...(data.status && { status: data.status }),
        },
      })
      return NextResponse.json({ participant })
    }

    if (_type === 'reminder') {
      const reminder = await prisma.calendar_reminders.update({
        where: { id },
        data: {
          ...(data.minutesBefore !== undefined && { minutes_before: data.minutesBefore }),
          ...(data.sent !== undefined && { sent: data.sent }),
        },
      })
      return NextResponse.json({ reminder })
    }

    const event = await prisma.calendar_events.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.eventType && { event_type: data.eventType }),
        ...(data.startTime && { start_time: new Date(data.startTime) }),
        ...(data.endTime && { end_time: new Date(data.endTime) }),
        ...(data.allDay !== undefined && { all_day: data.allDay }),
        ...(data.location !== undefined && { location: data.location }),
        ...(data.color !== undefined && { color: data.color }),
        ...(data.companyId !== undefined && { company_id: data.companyId }),
        ...(data.status && { status: data.status }),
        ...(data.projectId !== undefined && { project_id: data.projectId }),
        ...(data.responsibleUserId !== undefined && { responsible_user_id: data.responsibleUserId }),
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

    if (_type === 'participant') {
      await prisma.calendar_participants.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'reminder') {
      await prisma.calendar_reminders.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.calendar_events.update({
      where: { id },
      data: { deleted_at: new Date() },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
