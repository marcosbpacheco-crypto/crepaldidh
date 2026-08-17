import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

// O campo `dados` (JSONB) armazena o objeto COMPLETO do frontend,
// garantindo round-trip sem perda de campos. As colunas tipadas
// (empresa, status, etc.) são preenchidas para consultas básicas.

function strip(r: any) {
  if (!r) return r
  const { dados, ...rest } = r
  return { ...rest, ...(dados || {}) }
}

async function mergeDados(existing: any, incoming: any) {
  return { ...((existing?.dados as any) || {}), ...incoming }
}

export async function GET() {
  try {
    const [diagnosticos, okrs, swots, planosAcao, kpis] = await Promise.all([
      prisma.assessoria_diagnostics.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.assessoria_okrs.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.assessoria_swots.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.assessoria_action_plans.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.assessoria_kpis.findMany({ orderBy: { created_at: 'desc' } }),
    ])
    return NextResponse.json({
      diagnosticos: diagnosticos.map(strip),
      okrs: okrs.map(strip),
      swots: swots.map(strip),
      planosAcao: planosAcao.map(strip),
      kpis: kpis.map(strip),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'diagnostico' || !_type) {
      const dId = id || crypto.randomUUID()
      const diagnostico = await prisma.assessoria_diagnostics.upsert({
        where: { id: dId },
        create: {
          id: dId,
          empresa: data.empresa || '',
          data: data.data ? new Date(data.data) : null,
          status: data.status || 'rascunho',
          diagnostico: data.diagnostico || null,
          dados: data,
        },
        update: {
          empresa: data.empresa,
          data: data.data ? new Date(data.data) : null,
          status: data.status || 'rascunho',
          diagnostico: data.diagnostico || null,
          dados: data,
        },
      })
      return NextResponse.json({ diagnostico: strip(diagnostico) })
    }

    if (_type === 'okr') {
      const oId = id || crypto.randomUUID()
      const okr = await prisma.assessoria_okrs.upsert({
        where: { id: oId },
        create: {
          id: oId,
          empresa: data.empresa || '',
          titulo: data.titulo || data.objetivo || 'OKR',
          objetivo: data.objetivo || null,
          key_results: data.keyResults || data.key_results || [],
          status: data.status || 'active',
          dados: data,
        },
        update: {
          empresa: data.empresa,
          titulo: data.titulo || data.objetivo || 'OKR',
          objetivo: data.objetivo || null,
          key_results: data.keyResults || data.key_results || [],
          status: data.status || 'active',
          dados: data,
        },
      })
      return NextResponse.json({ okr: strip(okr) })
    }

    if (_type === 'swot') {
      const sId = id || crypto.randomUUID()
      const swot = await prisma.assessoria_swots.upsert({
        where: { id: sId },
        create: {
          id: sId,
          empresa: data.empresa || '',
          forcas: data.forcas || [],
          fraquezas: data.fraquezas || [],
          oportunidades: data.oportunidades || [],
          ameacas: data.ameacas || [],
          dados: data,
        },
        update: {
          empresa: data.empresa,
          forcas: data.forcas || [],
          fraquezas: data.fraquezas || [],
          oportunidades: data.oportunidades || [],
          ameacas: data.ameacas || [],
          dados: data,
        },
      })
      return NextResponse.json({ swot: strip(swot) })
    }

    if (_type === 'planoAcao') {
      const paId = id || crypto.randomUUID()
      const planoAcao = await prisma.assessoria_action_plans.upsert({
        where: { id: paId },
        create: {
          id: paId,
          empresa: data.empresa || '',
          acao: data.acao || data.titulo || 'Plano',
          prazo: data.prazo ? new Date(data.prazo) : null,
          responsavel: data.responsavel || null,
          status: data.status || 'pending',
          dados: data,
        },
        update: {
          empresa: data.empresa,
          acao: data.acao || data.titulo || 'Plano',
          prazo: data.prazo ? new Date(data.prazo) : null,
          responsavel: data.responsavel || null,
          status: data.status || 'pending',
          dados: data,
        },
      })
      return NextResponse.json({ planoAcao: strip(planoAcao) })
    }

    if (_type === 'kpi') {
      const kId = id || crypto.randomUUID()
      const kpi = await prisma.assessoria_kpis.upsert({
        where: { id: kId },
        create: {
          id: kId,
          empresa: data.empresa || '',
          indicador: data.indicador || data.nome || 'KPI',
          valor_atual: data.valorAtual ?? data.valor_atual ?? 0,
          valor_meta: data.valorMeta ?? data.valor_meta ?? 0,
          periodo: data.periodo ? new Date(data.periodo) : null,
          dados: data,
        },
        update: {
          empresa: data.empresa,
          indicador: data.indicador || data.nome || 'KPI',
          valor_atual: data.valorAtual ?? data.valor_atual ?? 0,
          valor_meta: data.valorMeta ?? data.valor_meta ?? 0,
          periodo: data.periodo ? new Date(data.periodo) : null,
          dados: data,
        },
      })
      return NextResponse.json({ kpi: strip(kpi) })
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

    if (_type === 'diagnostico' || !_type) {
      const existing = await prisma.assessoria_diagnostics.findUnique({ where: { id } })
      const dados = await mergeDados(existing, data)
      const diagnostico = await prisma.assessoria_diagnostics.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.data && { data: new Date(data.data) }),
          ...(data.status && { status: data.status }),
          ...(data.diagnostico !== undefined && { diagnostico: data.diagnostico }),
          dados,
        },
      })
      return NextResponse.json({ diagnostico: strip(diagnostico) })
    }

    if (_type === 'okr') {
      const existing = await prisma.assessoria_okrs.findUnique({ where: { id } })
      const dados = await mergeDados(existing, data)
      const okr = await prisma.assessoria_okrs.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.titulo && { titulo: data.titulo }),
          ...(data.objetivo !== undefined && { objetivo: data.objetivo }),
          ...(data.keyResults !== undefined && { key_results: data.keyResults }),
          ...(data.key_results !== undefined && { key_results: data.key_results }),
          ...(data.status && { status: data.status }),
          dados,
        },
      })
      return NextResponse.json({ okr: strip(okr) })
    }

    if (_type === 'swot') {
      const existing = await prisma.assessoria_swots.findUnique({ where: { id } })
      const dados = await mergeDados(existing, data)
      const swot = await prisma.assessoria_swots.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.forcas !== undefined && { forcas: data.forcas }),
          ...(data.fraquezas !== undefined && { fraquezas: data.fraquezas }),
          ...(data.oportunidades !== undefined && { oportunidades: data.oportunidades }),
          ...(data.ameacas !== undefined && { ameacas: data.ameacas }),
          dados,
        },
      })
      return NextResponse.json({ swot: strip(swot) })
    }

    if (_type === 'planoAcao') {
      const existing = await prisma.assessoria_action_plans.findUnique({ where: { id } })
      const dados = await mergeDados(existing, data)
      const planoAcao = await prisma.assessoria_action_plans.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.acao && { acao: data.acao }),
          ...(data.prazo && { prazo: new Date(data.prazo) }),
          ...(data.responsavel !== undefined && { responsavel: data.responsavel }),
          ...(data.status && { status: data.status }),
          dados,
        },
      })
      return NextResponse.json({ planoAcao: strip(planoAcao) })
    }

    if (_type === 'kpi') {
      const existing = await prisma.assessoria_kpis.findUnique({ where: { id } })
      const dados = await mergeDados(existing, data)
      const kpi = await prisma.assessoria_kpis.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.indicador && { indicador: data.indicador }),
          ...(data.valorAtual !== undefined && { valor_atual: data.valorAtual }),
          ...(data.valor_atual !== undefined && { valor_atual: data.valor_atual }),
          ...(data.valorMeta !== undefined && { valor_meta: data.valorMeta }),
          ...(data.valor_meta !== undefined && { valor_meta: data.valor_meta }),
          ...(data.periodo && { periodo: new Date(data.periodo) }),
          dados,
        },
      })
      return NextResponse.json({ kpi: strip(kpi) })
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

    if (_type === 'okr') {
      await prisma.assessoria_okrs.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'swot') {
      await prisma.assessoria_swots.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'planoAcao') {
      await prisma.assessoria_action_plans.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'kpi') {
      await prisma.assessoria_kpis.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.assessoria_diagnostics.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}