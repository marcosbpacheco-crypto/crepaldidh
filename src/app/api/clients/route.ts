import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

function log(operation: string, result: any) {
  console.log(`[CLIENTS API] ${operation}:`, result)
}

function db(admin: any, table: string) {
  return admin.from(table) as any
}

export async function GET() {
  try {
    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    let clients: any[] | null = null
    let contacts: any[] | null = null
    let interactions: any[] | null = null
    let documents: any[] | null = null
    let feedbacks: any[] | null = null

    try { const r = await db(admin, 'client_list').select('*').order('created_at', { ascending: false }); clients = r.data; if (r.error) log('GET clients error', r.error.message); else log('GET clients', `${clients?.length || 0} rows`) }
    catch (e: any) { log('GET clients exception', e.message) }

    try { const r = await db(admin, 'client_contacts').select('*'); contacts = r.data; if (r.error) log('GET contacts error', r.error.message) }
    catch (e: any) { log('GET contacts exception', e.message) }

    try { const r = await db(admin, 'client_interactions').select('*'); interactions = r.data; if (r.error) log('GET interactions error', r.error.message) }
    catch (e: any) { log('GET interactions exception', e.message) }

    try { const r = await db(admin, 'client_documents').select('*'); documents = r.data; if (r.error) log('GET documents error', r.error.message) }
    catch (e: any) { log('GET documents exception', e.message) }

    try { const r = await db(admin, 'client_feedbacks').select('*'); feedbacks = r.data; if (r.error) log('GET feedbacks error', r.error.message) }
    catch (e: any) { log('GET feedbacks exception', e.message) }

    return NextResponse.json({
      clients: clients || [],
      contacts: contacts || [],
      interactions: interactions || [],
      documents: documents || [],
      feedbacks: feedbacks || [],
    })
  } catch (err: any) {
    log('GET exception', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const dispatchType = body._type || body.type

    if (dispatchType === 'client') {
      const admin = getAdminClient()
      if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

      const { data, error } = await db(admin, 'client_list').insert({
        company_id: body.companyId || '',
        company_name: body.companyName || '',
        company_trade_name: body.companyTradeName || '',
        cnpj: body.cnpj || '',
        segment: body.segment || '',
        city: body.city || '',
        state: body.state || '',
        services: body.services || [],
        contract_type: body.contractType || 'first',
        internal_responsible: body.internalResponsible || '',
        status: body.status || 'active',
        start_date: body.startDate || new Date().toISOString(),
        end_date: body.endDate || new Date().toISOString(),
        monthly_value: body.monthlyValue || 0,
        total_value: body.totalValue || 0,
        notes: body.notes || '',
      }).select()

      if (error) { log('POST client error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      log('POST client OK', data?.[0]?.id)

      // Cross-sync to CRM
      try {
        await syncClientToCRM(admin, data![0], body)
      } catch (e: any) {
        log('POST client cross-sync warning', e.message)
      }

      return NextResponse.json({ client: data?.[0] || null })
    }

    if (dispatchType === 'contact') {
      const admin = getAdminClient()
      if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
      const { data, error } = await db(admin, 'client_contacts').insert({
        client_id: body.clientId,
        name: body.name || '',
        role: body.role || '',
        phone: body.phone || '',
        email: body.email || '',
        is_primary: body.isPrimary ?? false,
      }).select()
      if (error) { log('POST contact error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      log('POST contact OK', data?.[0]?.id)
      return NextResponse.json({ contact: data?.[0] || null })
    }

    if (dispatchType === 'interaction') {
      const admin = getAdminClient()
      if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
      const { data, error } = await db(admin, 'client_interactions').insert({
        client_id: body.clientId,
        type: body.type || 'call',
        title: body.title || '',
        description: body.description || '',
        author: body.author || '',
      }).select()
      if (error) { log('POST interaction error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      log('POST interaction OK', data?.[0]?.id)
      return NextResponse.json({ interaction: data?.[0] || null })
    }

    if (dispatchType === 'feedback') {
      const admin = getAdminClient()
      if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
      const { data, error } = await db(admin, 'client_feedbacks').insert({
        client_id: body.clientId,
        score: body.score ?? 5,
        comment: body.comment || '',
      }).select()
      if (error) { log('POST feedback error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      log('POST feedback OK', data?.[0]?.id)
      return NextResponse.json({ feedback: data?.[0] || null })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err: any) {
    log('POST exception', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const dispatchType = body._type || body.type
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    if (dispatchType === 'client') {
      const updates: any = {}
      if (body.companyName !== undefined) updates.company_name = body.companyName
      if (body.companyTradeName !== undefined) updates.company_trade_name = body.companyTradeName
      if (body.cnpj !== undefined) updates.cnpj = body.cnpj
      if (body.segment !== undefined) updates.segment = body.segment
      if (body.city !== undefined) updates.city = body.city
      if (body.state !== undefined) updates.state = body.state
      if (body.services !== undefined) updates.services = body.services
      if (body.contractType !== undefined) updates.contract_type = body.contractType
      if (body.internalResponsible !== undefined) updates.internal_responsible = body.internalResponsible
      if (body.status !== undefined) updates.status = body.status
      if (body.startDate !== undefined) updates.start_date = body.startDate
      if (body.endDate !== undefined) updates.end_date = body.endDate
      if (body.monthlyValue !== undefined) updates.monthly_value = body.monthlyValue
      if (body.totalValue !== undefined) updates.total_value = body.totalValue
      if (body.notes !== undefined) updates.notes = body.notes

      const { error } = await db(admin, 'client_list').update(updates).eq('id', id)
      if (error) { log('PATCH client error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      log('PATCH client OK', id)
      return NextResponse.json({ success: true })
    }

    if (dispatchType === 'contact') {
      const updates: any = {}
      if (body.name !== undefined) updates.name = body.name
      if (body.role !== undefined) updates.role = body.role
      if (body.phone !== undefined) updates.phone = body.phone
      if (body.email !== undefined) updates.email = body.email
      if (body.isPrimary !== undefined) updates.is_primary = body.isPrimary

      const { error } = await db(admin, 'client_contacts').update(updates).eq('id', id)
      if (error) { log('PATCH contact error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      log('PATCH contact OK', id)
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (err: any) {
    log('PATCH exception', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    // Soft delete: mark as churned
    const { error } = await db(admin, 'client_list').update({ status: 'churned' }).eq('id', id)
    if (error) { log('DELETE client error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
    log('DELETE client OK', id)
    return NextResponse.json({ success: true })
  } catch (err: any) {
    log('DELETE exception', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

async function syncClientToCRM(admin: any, client: any, body: any) {
  const { data: existing } = await db(admin, 'crm_companies').select('id').eq('cnpj', body.cnpj || '').limit(1)
  if (existing && existing.length > 0) return // already synced

  const { error } = await db(admin, 'crm_companies').insert({
    name: body.companyName || '',
    trade_name: body.companyTradeName || body.companyName || '',
    cnpj: body.cnpj || '',
    segment: body.segment || '',
    city: body.city || '',
    state: body.state || '',
    phone: '',
    email: '',
    website: '',
    instagram: '',
    employees: 0,
    resp_principal: body.internalResponsible || '',
    resp_rh: '',
    resp_financeiro: '',
    notes: body.notes || '',
    status: 'active',
  })
  if (error) log('cross-sync insert error', error.message)
}
