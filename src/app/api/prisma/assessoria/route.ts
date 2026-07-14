import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [diagnosticos, okrs, swots, planosAcao, kpis] = await Promise.all([
      prisma.assessoria_diagnostics.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.assessoria_okrs.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.assessoria_swots.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.assessoria_action_plans.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.assessoria_kpis.findMany({ orderBy: { created_at: 'desc' } }),
    ])
    return NextResponse.json({ diagnosticos, okrs, swots, planosAcao, kpis })
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
          empresa: data.empresa,
          data: data.data ? new Date(data.data) : null,
          status: data.status || 'rascunho',
          diagnostico: data.diagnostico || null,
        },
        update: {
          empresa: data.empresa,
          data: data.data ? new Date(data.data) : null,
          status: data.status || 'rascunho',
          diagnostico: data.diagnostico || null,
        },
      })
      return NextResponse.json({ diagnostico })
    }

    if (_type === 'okr') {
      const oId = id || crypto.randomUUID()
      const okr = await prisma.assessoria_okrs.upsert({
        where: { id: oId },
        create: {
          id: oId,
          empresa: data.empresa,
          titulo: data.titulo,
          objetivo: data.objetivo || null,
          key_results: data.keyResults || data.key_results || [],
          status: data.status || 'active',
        },
        update: {
          empresa: data.empresa,
          titulo: data.titulo,
          objetivo: data.objetivo || null,
          key_results: data.keyResults || data.key_results || [],
          status: data.status || 'active',
        },
      })
      return NextResponse.json({ okr })
    }

    if (_type === 'swot') {
      const sId = id || crypto.randomUUID()
      const swot = await prisma.assessoria_swots.upsert({
        where: { id: sId },
        create: {
          id: sId,
          empresa: data.empresa,
          forcas: data.forcas || [],
          fraquezas: data.fraquezas || [],
          oportunidades: data.oportunidades || [],
          ameacas: data.ameacas || [],
        },
        update: {
          empresa: data.empresa,
          forcas: data.forcas || [],
          fraquezas: data.fraquezas || [],
          oportunidades: data.oportunidades || [],
          ameacas: data.ameacas || [],
        },
      })
      return NextResponse.json({ swot })
    }

    if (_type === 'planoAcao') {
      const paId = id || crypto.randomUUID()
      const planoAcao = await prisma.assessoria_action_plans.upsert({
        where: { id: paId },
        create: {
          id: paId,
          empresa: data.empresa,
          acao: data.acao,
          prazo: data.prazo ? new Date(data.prazo) : null,
          responsavel: data.responsavel || null,
          status: data.status || 'pending',
        },
        update: {
          empresa: data.empresa,
          acao: data.acao,
          prazo: data.prazo ? new Date(data.prazo) : null,
          responsavel: data.responsavel || null,
          status: data.status || 'pending',
        },
      })
      return NextResponse.json({ planoAcao })
    }

    if (_type === 'kpi') {
      const kId = id || crypto.randomUUID()
      const kpi = await prisma.assessoria_kpis.upsert({
        where: { id: kId },
        create: {
          id: kId,
          empresa: data.empresa,
          indicador: data.indicador,
          valor_atual: data.valorAtual ?? data.valor_atual ?? 0,
          valor_meta: data.valorMeta ?? data.valor_meta ?? 0,
          periodo: data.periodo ? new Date(data.periodo) : null,
        },
        update: {
          empresa: data.empresa,
          indicador: data.indicador,
          valor_atual: data.valorAtual ?? data.valor_atual ?? 0,
          valor_meta: data.valorMeta ?? data.valor_meta ?? 0,
          periodo: data.periodo ? new Date(data.periodo) : null,
        },
      })
      return NextResponse.json({ kpi })
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
      const diagnostico = await prisma.assessoria_diagnostics.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.data && { data: new Date(data.data) }),
          ...(data.status && { status: data.status }),
          ...(data.diagnostico !== undefined && { diagnostico: data.diagnostico }),
        },
      })
      return NextResponse.json({ diagnostico })
    }

    if (_type === 'okr') {
      const okr = await prisma.assessoria_okrs.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.titulo && { titulo: data.titulo }),
          ...(data.objetivo !== undefined && { objetivo: data.objetivo }),
          ...(data.keyResults !== undefined && { key_results: data.keyResults }),
          ...(data.key_results !== undefined && { key_results: data.key_results }),
          ...(data.status && { status: data.status }),
        },
      })
      return NextResponse.json({ okr })
    }

    if (_type === 'swot') {
      const swot = await prisma.assessoria_swots.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.forcas && { forcas: data.forcas }),
          ...(data.fraquezas && { fraquezas: data.fraquezas }),
          ...(data.oportunidades && { oportunidades: data.oportunidades }),
          ...(data.ameacas && { ameacas: data.ameacas }),
        },
      })
      return NextResponse.json({ swot })
    }

    if (_type === 'planoAcao') {
      const planoAcao = await prisma.assessoria_action_plans.update({
        where: { id },
        data: {
          ...(data.empresa && { empresa: data.empresa }),
          ...(data.acao && { acao: data.acao }),
          ...(data.prazo && { prazo: new Date(data.prazo) }),
          ...(data.responsavel !== undefined && { responsavel: data.responsavel }),
          ...(data.status && { status: data.status }),
        },
      })
      return NextResponse.json({ planoAcao })
    }

    if (_type === 'kpi') {
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
        },
      })
      return NextResponse.json({ kpi })
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
