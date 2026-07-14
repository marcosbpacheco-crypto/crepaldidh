import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const clients = await prisma.client_list.findMany({
      where: { deleted_at: null },
      include: {
        client_contacts: true,
        client_interactions: true,
        client_documents: true,
        client_feedbacks: true,
      },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json({ clients })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'client' || !_type) {
      const client = await prisma.client_list.create({
        data: {
          id: id || undefined,
          company_name: data.companyName || data.company_name,
          company_id: data.companyId || data.company_id || null,
          company_trade_name: data.companyTradeName || data.company_trade_name || null,
          cnpj: data.cnpj || null,
          segment: data.segment || null,
          city: data.city || null,
          state: data.state || null,
          services: data.services || [],
          contract_type: data.contractType || data.contract_type || 'first',
          internal_responsible: data.internalResponsible || data.internal_responsible || null,
          status: data.status || 'active',
          start_date: data.startDate || data.start_date ? new Date(data.startDate || data.start_date) : null,
          end_date: data.endDate || data.end_date ? new Date(data.endDate || data.end_date) : null,
          monthly_value: data.monthlyValue ?? data.monthly_value ?? 0,
          total_value: data.totalValue ?? data.total_value ?? 0,
          notes: data.notes || null,
        },
      })
      return NextResponse.json({ client })
    }

    if (_type === 'contact') {
      const contact = await prisma.client_contacts.create({
        data: {
          id: id || undefined,
          client_id: data.clientId || data.client_id,
          name: data.name,
          role: data.role || null,
          phone: data.phone || null,
          email: data.email || null,
          is_primary: data.isPrimary ?? data.is_primary ?? false,
        },
      })
      return NextResponse.json({ contact })
    }

    if (_type === 'interaction') {
      const interaction = await prisma.client_interactions.create({
        data: {
          client_id: data.clientId || data.client_id,
          type: data.type,
          title: data.title,
          description: data.description || null,
          author: data.author || null,
        },
      })
      return NextResponse.json({ interaction })
    }

    if (_type === 'feedback') {
      const feedback = await prisma.client_feedbacks.create({
        data: {
          client_id: data.clientId || data.client_id,
          score: data.score,
          comment: data.comment || null,
        },
      })
      return NextResponse.json({ feedback })
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
      const client = await prisma.client_list.update({
        where: { id },
        data: { deleted_at: null, status: 'active' },
      })
      return NextResponse.json({ client })
    }

    if (_type === 'contact') {
      const contact = await prisma.client_contacts.update({
        where: { id },
        data: {
          name: data.name,
          role: data.role,
          phone: data.phone,
          email: data.email,
          is_primary: data.isPrimary ?? data.is_primary,
        },
      })
      return NextResponse.json({ contact })
    }

    const client = await prisma.client_list.update({
      where: { id },
      data: {
        ...(data.companyName && { company_name: data.companyName }),
        ...(data.companyTradeName && { company_trade_name: data.companyTradeName }),
        ...(data.cnpj && { cnpj: data.cnpj }),
        ...(data.segment && { segment: data.segment }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.services && { services: data.services }),
        ...(data.contractType && { contract_type: data.contractType }),
        ...(data.internalResponsible && { internal_responsible: data.internalResponsible }),
        ...(data.status && { status: data.status }),
        ...(data.startDate && { start_date: new Date(data.startDate) }),
        ...(data.endDate && { end_date: new Date(data.endDate) }),
        ...(data.monthlyValue !== undefined && { monthly_value: data.monthlyValue }),
        ...(data.totalValue !== undefined && { total_value: data.totalValue }),
        ...(data.notes !== undefined && { notes: data.notes }),
      },
    })
    return NextResponse.json({ client })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'contact') {
      await prisma.client_contacts.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.client_list.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'churned' },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
