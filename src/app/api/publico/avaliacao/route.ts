import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const eventId = searchParams.get('eventId')
    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 })

    const event = await prisma.training_events.findFirst({
      where: { id: eventId, deleted_at: null },
      select: {
        id: true, name: true, type: true, theme: true, event_date: true,
        company_id: true, company_name: true,
      },
    })
    if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

    const companyName = event.company_name
      ? (event as any).company_name
      : (await prisma.crm_companies.findFirst({
          where: { id: event.company_id! },
          select: { name: true },
        }))?.name || null

    const participants = await prisma.training_participants.findMany({
      where: { event_id: eventId },
      select: { id: true, name: true, company_name: true },
      orderBy: { name: 'asc' },
    })

    const company =
      companyName ||
      participants.find(p => p.company_name)?.company_name ||
      'Cliente'

    return NextResponse.json({
      event: {
        id: event.id, name: event.name, type: event.type, theme: event.theme,
        eventDate: event.event_date, company,
      },
      participants,
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const {
      eventId, participantId, ratingGeneral, clarityContent,
      applicability, didactics, organization, nps, comments,
    } = body

    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 })
    const event = await prisma.training_events.findFirst({ where: { id: eventId, deleted_at: null } })
    if (!event) return NextResponse.json({ error: 'Evento não encontrado' }, { status: 404 })

    let feedbackId: string | null = null
    if (participantId) {
      const existing = await prisma.training_feedbacks.findFirst({
        where: { event_id: eventId, participant_id: participantId },
      })
      if (existing) feedbackId = existing.id
    }

    const feedback = await prisma.training_feedbacks.upsert({
      where: { id: feedbackId || crypto.randomUUID() },
      create: {
        id: feedbackId || crypto.randomUUID(),
        event_id: eventId,
        participant_id: participantId || null,
        rating_general: ratingGeneral ?? null,
        clarity_content: clarityContent ?? null,
        applicability: applicability ?? null,
        didactics: didactics ?? null,
        organization: organization ?? null,
        nps: nps ?? null,
        comments: comments || null,
        status: 'respondido',
      },
      update: {
        event_id: eventId,
        participant_id: participantId || null,
        rating_general: ratingGeneral ?? null,
        clarity_content: clarityContent ?? null,
        applicability: applicability ?? null,
        didactics: didactics ?? null,
        organization: organization ?? null,
        nps: nps ?? null,
        comments: comments || null,
        status: 'respondido',
      },
    })

    return NextResponse.json({ feedback })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
