import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    if (!code) return NextResponse.json({ error: 'code is required' }, { status: 400 })

    const cert = await prisma.training_certificates.findFirst({
      where: { validation_code: code },
      include: { training_participants: true, training_events: true },
    })
    if (!cert) return NextResponse.json({ error: 'Certificado não encontrado' }, { status: 404 })

    const event = cert.training_events
    const part = cert.training_participants
    const company =
      (event as any).company_name ||
      part.company_name ||
      (await prisma.crm_companies.findFirst({
        where: { id: event.company_id! },
        select: { name: true },
      }))?.name ||
      'Cliente'

    return NextResponse.json({
      certificate: {
        id: cert.id,
        participantName: cert.participant_name || part.name,
        eventName: cert.event_name || event.name,
        clientName: cert.client_name || company,
        hours: cert.hours ? Number(cert.hours) : Number(event.hours_duration) || 0,
        facilitator: cert.facilitator || event.facilitator,
        date: cert.event_date || event.event_date,
        validationCode: cert.validation_code,
        pdfUrl: cert.pdf_url,
        issuedAt: cert.issued_at,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
