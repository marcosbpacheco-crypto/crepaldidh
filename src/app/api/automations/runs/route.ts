import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const ruleId = searchParams.get('ruleId')

    const where = ruleId ? { rule_id: ruleId } : {}
    const runs = await prisma.automation_runs.findMany({
      where,
      orderBy: { executed_at: 'desc' },
      take: 50,
      include: { rule: { select: { name: true } } },
    })
    return NextResponse.json({ runs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
