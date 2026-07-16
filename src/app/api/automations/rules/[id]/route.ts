import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const rule = await prisma.automation_rules.findUnique({
      where: { id },
      include: { conditions: true, actions: true, runs: { orderBy: { executed_at: 'desc' }, take: 20 } },
    })
    if (!rule) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })
    return NextResponse.json({ rule })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json()
    const { name, description, event, active, conditions, actions } = body

    const existing = await prisma.automation_rules.findUnique({ where: { id } })
    if (!existing) return NextResponse.json({ error: 'Rule not found' }, { status: 404 })

    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (event !== undefined) updateData.event = event
    if (active !== undefined) updateData.active = active

    if (conditions !== undefined) {
      await prisma.automation_conditions.deleteMany({ where: { rule_id: id } })
      updateData.conditions = { create: conditions.map((c: any) => ({ field: c.field, operator: c.operator, value: c.value })) }
    }
    if (actions !== undefined) {
      await prisma.automation_actions.deleteMany({ where: { rule_id: id } })
      updateData.actions = { create: actions.map((a: any) => ({ action_type: a.action_type, action_config: a.action_config || {} })) }
    }

    const rule = await prisma.automation_rules.update({
      where: { id },
      data: updateData,
      include: { conditions: true, actions: true },
    })
    return NextResponse.json({ rule })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.automation_rules.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
