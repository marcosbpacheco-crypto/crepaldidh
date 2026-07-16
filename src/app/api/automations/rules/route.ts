import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { evaluateRule } from '@/lib/automations/engine'

export async function GET() {
  try {
    const rules = await prisma.automation_rules.findMany({
      orderBy: { created_at: 'desc' },
      include: { conditions: true, actions: true, _count: { select: { runs: true } } },
    })
    return NextResponse.json({ rules })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, description, event, conditions, actions } = body

    if (!name || !event) return NextResponse.json({ error: 'name and event are required' }, { status: 400 })

    const rule = await prisma.automation_rules.create({
      data: {
        name,
        description,
        event,
        active: true,
        conditions: {
          create: (conditions || []).map((c: any) => ({ field: c.field, operator: c.operator, value: c.value })),
        },
        actions: {
          create: (actions || []).map((a: any) => ({ action_type: a.action_type, action_config: a.action_config || {} })),
        },
      },
      include: { conditions: true, actions: true },
    })
    return NextResponse.json({ rule })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
