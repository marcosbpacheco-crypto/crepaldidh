import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

function log(op: string, msg: any) {
  console.log(`[CLIENTS API] ${op}:`, typeof msg === 'object' ? JSON.stringify(msg).slice(0, 300) : msg)
}

function db(admin: any, table: string) {
  return admin.from(table) as any
}

export async function GET() {
  try {
    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })
    const sb = admin // non-nullable alias

    const results: Record<string, any[]> = {}

    async function q(table: string, filterDeleted = false) {
      try {
      let query = sb.from(table).select('*')
      if (filterDeleted) query = query.is('deleted_at', null)
      const { data, error } = await query
      if (error) { log(`GET ${table} error`, error.message); results[table] = [] }
      else results[table] = (data as any[]) || []
      } catch (e: any) { log(`GET ${table} exception`, e.message); results[table] = [] }
    }

    await Promise.all([
      q('client_list', true),
      q('client_contacts'),
      q('client_interactions'),
      q('client_documents'),
      q('client_feedbacks'),
    ])

    log('GET done', `${results.client_list?.length || 0} clients`)
    return NextResponse.json({
      clients: results.client_list || [],
      contacts: results.client_contacts || [],
      interactions: results.client_interactions || [],
      documents: results.client_documents || [],
      feedbacks: results.client_feedbacks || [],
    })
  } catch (err: any) {
    log('GET fatal', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    const dispatchType = body._type || body.type

    if (dispatchType === 'client') {
      // === VALIDACAO ===
      if (!body.companyName?.trim()) {
        return NextResponse.json({ error: 'companyName é obrigatório' }, { status: 400 })
      }

      const payload: Record<string, any> = {
        company_id: body.companyId || null,
        company_name: body.companyName.trim(),
        company_trade_name: body.companyTradeName?.trim() || '',
        cnpj: body.cnpj || null,
        segment: body.segment || null,
        city: body.city || null,
        state: body.state || null,
        services: Array.isArray(body.services) ? body.services : [],
        contract_type: body.contractType || 'first',
        internal_responsible: body.internalResponsible || null,
        status: body.status || 'active',
        start_date: body.startDate || null,
        end_date: body.endDate || null,
        monthly_value: Number(body.monthlyValue) || 0,
        total_value: Number(body.totalValue) || 0,
        notes: body.notes || null,
      }
      if (body.id) payload.id = body.id

      const { data, error } = await (db(admin, 'client_list') as any).insert(payload).select()

      if (error) {
        log('POST client error', error.message)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      if (!data || data.length === 0) {
        log('POST client RLS block', 'data vazio — possivel bloqueio de RLS')
        return NextResponse.json({ error: 'Permissão negada (RLS)' }, { status: 403 })
      }

      log('POST client OK', data[0].id)
      return NextResponse.json({ client: data[0] })
    }

    if (dispatchType === 'contact') {
      if (!body.clientId || !body.name?.trim()) {
        return NextResponse.json({ error: 'clientId e name são obrigatórios' }, { status: 400 })
      }
      const payload: Record<string, any> = {
        client_id: body.clientId,
        name: body.name.trim(),
        role: body.role || null,
        phone: body.phone || null,
        email: body.email || null,
        is_primary: body.isPrimary ?? false,
      }
      if (body.id) payload.id = body.id

      const { data, error } = await db(admin, 'client_contacts').insert(payload).select()
      if (error) { log('POST contact error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      if (!data || data.length === 0) return NextResponse.json({ error: 'Permissão negada (RLS)' }, { status: 403 })
      log('POST contact OK', data[0].id)
      return NextResponse.json({ contact: data[0] })
    }

    if (dispatchType === 'interaction') {
      if (!body.clientId || !body.title?.trim()) {
        return NextResponse.json({ error: 'clientId e title são obrigatórios' }, { status: 400 })
      }
      const payload: Record<string, any> = {
        client_id: body.clientId,
        type: body.type || 'call',
        title: body.title.trim(),
        description: body.description || null,
        author: body.author || 'Sistema',
      }
      if (body.id) payload.id = body.id

      const { data, error } = await db(admin, 'client_interactions').insert(payload).select()
      if (error) { log('POST interaction error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      if (!data || data.length === 0) return NextResponse.json({ error: 'Permissão negada (RLS)' }, { status: 403 })
      log('POST interaction OK', data[0].id)
      return NextResponse.json({ interaction: data[0] })
    }

    if (dispatchType === 'feedback') {
      if (!body.clientId || body.score == null) {
        return NextResponse.json({ error: 'clientId e score são obrigatórios' }, { status: 400 })
      }
      const payload: Record<string, any> = {
        client_id: body.clientId,
        score: body.score,
        comment: body.comment || null,
      }
      if (body.id) payload.id = body.id

      const { data, error } = await db(admin, 'client_feedbacks').insert(payload).select()
      if (error) { log('POST feedback error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      if (!data || data.length === 0) return NextResponse.json({ error: 'Permissão negada (RLS)' }, { status: 403 })
      log('POST feedback OK', data[0].id)
      return NextResponse.json({ feedback: data[0] })
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch (err: any) {
    log('POST fatal', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    const dispatchType = _type || body.type

    if (dispatchType === 'client') {
      const updates: Record<string, any> = {}
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

      if (Object.keys(updates).length === 0) {
        return NextResponse.json({ error: 'Nenhum campo para atualizar' }, { status: 400 })
      }

      const { data, error } = await db(admin, 'client_list').update(updates).eq('id', id).select()
      if (error) { log('PATCH client error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      if (!data || data.length === 0) return NextResponse.json({ error: 'Registro não encontrado ou permissão negada' }, { status: 404 })
      log('PATCH client OK', id)
      return NextResponse.json({ client: data[0] })
    }

    if (dispatchType === 'contact') {
      const updates: Record<string, any> = {}
      if (body.name !== undefined) updates.name = body.name
      if (body.role !== undefined) updates.role = body.role
      if (body.phone !== undefined) updates.phone = body.phone
      if (body.email !== undefined) updates.email = body.email
      if (body.isPrimary !== undefined) updates.is_primary = body.isPrimary

      const { data, error } = await db(admin, 'client_contacts').update(updates).eq('id', id).select()
      if (error) { log('PATCH contact error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      if (!data || data.length === 0) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
      log('PATCH contact OK', id)
      return NextResponse.json({ contact: data[0] })
    }

    if (dispatchType === 'restore') {
      const { data, error } = await db(admin, 'client_list').update({ status: 'active', deleted_at: null }).eq('id', id).select()
      if (error) { log('PATCH restore error', error.message); return NextResponse.json({ error: error.message }, { status: 500 }) }
      if (!data || data.length === 0) return NextResponse.json({ error: 'Registro não encontrado' }, { status: 404 })
      log('PATCH restore OK', id)
      return NextResponse.json({ client: data[0] })
    }

    return NextResponse.json({ error: 'Tipo inválido' }, { status: 400 })
  } catch (err: any) {
    log('PATCH fatal', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id é obrigatório' }, { status: 400 })

    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Service unavailable' }, { status: 500 })

    // Hard delete: remove definitivamente
    const { data, error } = await db(admin, 'client_list').delete().eq('id', id).select()
    if (error) {
      log('DELETE client error', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'Registro não encontrado ou permissão negada' }, { status: 404 })
    }

    log('DELETE client OK', id)
    return NextResponse.json({ success: true, deleted: data[0] })
  } catch (err: any) {
    log('DELETE fatal', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
