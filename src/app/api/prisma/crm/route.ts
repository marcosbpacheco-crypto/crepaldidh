import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const companies = await prisma.crm_companies.findMany({
      where: { deleted_at: null },
      include: {
        crm_contacts: true,
        crm_deals: true,
        crm_proposals: true,
        crm_contracts: true,
        crm_activities: true,
        crm_tasks: true,
      },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json({ companies })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'company' || !_type) {
      const companyId = id || crypto.randomUUID()
      const company = await prisma.crm_companies.upsert({
        where: { id: companyId },
        create: {
          id: companyId,
          name: data.name,
          trade_name: data.tradeName || data.trade_name || null,
          cnpj: data.cnpj || null,
          segment: data.segment || null,
          employees: data.employees ?? null,
          city: data.city || null,
          state: data.state || null,
          website: data.website || null,
          instagram: data.instagram || null,
          resp_principal: data.respPrincipal || data.resp_principal || null,
          resp_rh: data.respRh || data.resp_rh || null,
          resp_financeiro: data.respFinanceiro || data.resp_financeiro || null,
          phone: data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
          status: data.status || 'active',
          legal_name: data.legalName || data.legal_name || null,
          created_by: data.createdBy || data.created_by || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
        update: {
          name: data.name,
          trade_name: data.tradeName || data.trade_name || null,
          cnpj: data.cnpj || null,
          segment: data.segment || null,
          employees: data.employees ?? null,
          city: data.city || null,
          state: data.state || null,
          website: data.website || null,
          instagram: data.instagram || null,
          resp_principal: data.respPrincipal || data.resp_principal || null,
          resp_rh: data.respRh || data.resp_rh || null,
          resp_financeiro: data.respFinanceiro || data.resp_financeiro || null,
          phone: data.phone || null,
          email: data.email || null,
          notes: data.notes || null,
          status: data.status || 'active',
          legal_name: data.legalName || data.legal_name || null,
          created_by: data.createdBy || data.created_by || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
      })
      return NextResponse.json({ company })
    }

    if (_type === 'contact') {
      const contactId = id || crypto.randomUUID()
      const contact = await prisma.crm_contacts.upsert({
        where: { id: contactId },
        create: {
          id: contactId,
          company_id: data.companyId || data.company_id,
          name: data.name,
          role: data.role || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          email: data.email || null,
          birthday: data.birthday ? new Date(data.birthday) : null,
          influence: data.influence || null,
          notes: data.notes || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
        update: {
          company_id: data.companyId || data.company_id,
          name: data.name,
          role: data.role || null,
          phone: data.phone || null,
          whatsapp: data.whatsapp || null,
          email: data.email || null,
          birthday: data.birthday ? new Date(data.birthday) : null,
          influence: data.influence || null,
          notes: data.notes || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
      })
      return NextResponse.json({ contact })
    }

    if (_type === 'deal') {
      const dealId = id || crypto.randomUUID()
      const deal = await prisma.crm_deals.upsert({
        where: { id: dealId },
        create: {
          id: dealId,
          company_id: data.companyId || data.company_id,
          title: data.title,
          service: data.service || null,
          value: data.value ?? 0,
          stage: data.stage,
          seller_id: data.sellerId || data.seller_id || null,
          notes: data.notes || null,
          due_date: data.dueDate ? new Date(data.dueDate) : null,
          lost_reason: data.lostReason || data.lost_reason || null,
        },
        update: {
          company_id: data.companyId || data.company_id,
          title: data.title,
          service: data.service || null,
          value: data.value ?? 0,
          stage: data.stage,
          seller_id: data.sellerId || data.seller_id || null,
          notes: data.notes || null,
          due_date: data.dueDate ? new Date(data.dueDate) : null,
          lost_reason: data.lostReason || data.lost_reason || null,
        },
      })
      return NextResponse.json({ deal })
    }

    if (_type === 'proposal') {
      const proposalId = id || crypto.randomUUID()
      const proposal = await prisma.crm_proposals.upsert({
        where: { id: proposalId },
        create: {
          id: proposalId,
          company_id: data.companyId || data.company_id,
          service: data.service,
          value: data.value ?? 0,
          duration: data.duration || null,
          status: data.status || 'draft',
          notes: data.notes || null,
          generated_content: data.generatedContent || data.generated_content || null,
        },
        update: {
          company_id: data.companyId || data.company_id,
          service: data.service,
          value: data.value ?? 0,
          duration: data.duration || null,
          status: data.status || 'draft',
          notes: data.notes || null,
          generated_content: data.generatedContent || data.generated_content || null,
        },
      })
      return NextResponse.json({ proposal })
    }

    if (_type === 'contract') {
      const contractId = id || crypto.randomUUID()
      const contract = await prisma.crm_contracts.upsert({
        where: { id: contractId },
        create: {
          id: contractId,
          company_id: data.companyId || data.company_id,
          proposal_id: data.proposalId || data.proposal_id || null,
          title: data.title,
          value: data.value ?? 0,
          start_date: data.startDate ? new Date(data.startDate) : null,
          end_date: data.endDate ? new Date(data.endDate) : null,
          auto_renew: data.autoRenew ?? data.auto_renew ?? false,
          status: data.status || 'draft',
          attachments: data.attachments ?? [],
        },
        update: {
          company_id: data.companyId || data.company_id,
          proposal_id: data.proposalId || data.proposal_id || null,
          title: data.title,
          value: data.value ?? 0,
          start_date: data.startDate ? new Date(data.startDate) : null,
          end_date: data.endDate ? new Date(data.endDate) : null,
          auto_renew: data.autoRenew ?? data.auto_renew ?? false,
          status: data.status || 'draft',
          attachments: data.attachments ?? [],
        },
      })
      return NextResponse.json({ contract })
    }

    if (_type === 'activity') {
      const activityId = id || crypto.randomUUID()
      const activity = await prisma.crm_activities.upsert({
        where: { id: activityId },
        create: {
          id: activityId,
          company_id: data.companyId || data.company_id,
          deal_id: data.dealId || data.deal_id || null,
          type: data.type,
          title: data.title,
          description: data.description || null,
          author: data.author || null,
          date: data.date ? new Date(data.date) : undefined,
        },
        update: {
          company_id: data.companyId || data.company_id,
          deal_id: data.dealId || data.deal_id || null,
          type: data.type,
          title: data.title,
          description: data.description || null,
          author: data.author || null,
          date: data.date ? new Date(data.date) : undefined,
        },
      })
      return NextResponse.json({ activity })
    }

    if (_type === 'task') {
      const taskId = id || crypto.randomUUID()
      const task = await prisma.crm_tasks.upsert({
        where: { id: taskId },
        create: {
          id: taskId,
          company_id: data.companyId || data.company_id,
          deal_id: data.dealId || data.deal_id || null,
          title: data.title,
          due_date: data.dueDate ? new Date(data.dueDate) : null,
          status: data.status || 'pending',
          priority: data.priority || 'medium',
        },
        update: {
          company_id: data.companyId || data.company_id,
          deal_id: data.dealId || data.deal_id || null,
          title: data.title,
          due_date: data.dueDate ? new Date(data.dueDate) : null,
          status: data.status || 'pending',
          priority: data.priority || 'medium',
        },
      })
      return NextResponse.json({ task })
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
      const company = await prisma.crm_companies.update({
        where: { id },
        data: { deleted_at: null, status: 'active' },
      })
      return NextResponse.json({ company })
    }

    if (_type === 'contact') {
      const contact = await prisma.crm_contacts.update({
        where: { id },
        data: {
          name: data.name,
          role: data.role,
          phone: data.phone,
          whatsapp: data.whatsapp,
          email: data.email,
          birthday: data.birthday ? new Date(data.birthday) : undefined,
          influence: data.influence,
          notes: data.notes,
        },
      })
      return NextResponse.json({ contact })
    }

    if (_type === 'deal') {
      const deal = await prisma.crm_deals.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.service !== undefined && { service: data.service }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.stage && { stage: data.stage }),
          ...(data.sellerId !== undefined && { seller_id: data.sellerId }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.dueDate && { due_date: new Date(data.dueDate) }),
          ...(data.lostReason !== undefined && { lost_reason: data.lostReason }),
        },
      })
      return NextResponse.json({ deal })
    }

    if (_type === 'proposal') {
      const proposal = await prisma.crm_proposals.update({
        where: { id },
        data: {
          ...(data.service && { service: data.service }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.duration !== undefined && { duration: data.duration }),
          ...(data.status && { status: data.status }),
          ...(data.notes !== undefined && { notes: data.notes }),
          ...(data.generatedContent !== undefined && { generated_content: data.generatedContent }),
        },
      })
      return NextResponse.json({ proposal })
    }

    if (_type === 'contract') {
      const contract = await prisma.crm_contracts.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.value !== undefined && { value: data.value }),
          ...(data.startDate && { start_date: new Date(data.startDate) }),
          ...(data.endDate && { end_date: new Date(data.endDate) }),
          ...(data.autoRenew !== undefined && { auto_renew: data.autoRenew }),
          ...(data.status && { status: data.status }),
          ...(data.attachments !== undefined && { attachments: data.attachments }),
        },
      })
      return NextResponse.json({ contract })
    }

    if (_type === 'activity') {
      const activity = await prisma.crm_activities.update({
        where: { id },
        data: {
          ...(data.type && { type: data.type }),
          ...(data.title && { title: data.title }),
          ...(data.description !== undefined && { description: data.description }),
          ...(data.author !== undefined && { author: data.author }),
          ...(data.date && { date: new Date(data.date) }),
        },
      })
      return NextResponse.json({ activity })
    }

    if (_type === 'task') {
      const task = await prisma.crm_tasks.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.dueDate && { due_date: new Date(data.dueDate) }),
          ...(data.status && { status: data.status }),
          ...(data.priority && { priority: data.priority }),
        },
      })
      return NextResponse.json({ task })
    }

    const company = await prisma.crm_companies.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.tradeName && { trade_name: data.tradeName }),
        ...(data.cnpj && { cnpj: data.cnpj }),
        ...(data.segment && { segment: data.segment }),
        ...(data.employees !== undefined && { employees: data.employees }),
        ...(data.city && { city: data.city }),
        ...(data.state && { state: data.state }),
        ...(data.website && { website: data.website }),
        ...(data.instagram && { instagram: data.instagram }),
        ...(data.respPrincipal && { resp_principal: data.respPrincipal }),
        ...(data.respRh && { resp_rh: data.respRh }),
        ...(data.respFinanceiro && { resp_financeiro: data.respFinanceiro }),
        ...(data.phone && { phone: data.phone }),
        ...(data.email && { email: data.email }),
        ...(data.notes !== undefined && { notes: data.notes }),
        ...(data.status && { status: data.status }),
        ...(data.legalName && { legal_name: data.legalName }),
      },
    })
    return NextResponse.json({ company })
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
      await prisma.crm_contacts.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'deal') {
      await prisma.crm_deals.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'proposal') {
      await prisma.crm_proposals.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'contract') {
      await prisma.crm_contracts.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'activity') {
      await prisma.crm_activities.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'task') {
      await prisma.crm_tasks.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.crm_companies.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'inactive' },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
