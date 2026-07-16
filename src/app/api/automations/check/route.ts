import { NextRequest, NextResponse } from 'next/server'
import { evaluateAllActiveRules, evaluateRule } from '@/lib/automations/engine'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { ruleId } = body || {}

    if (ruleId) {
      const log = await evaluateRule(ruleId, 'manual')
      return NextResponse.json({ ...log, ruleId })
    }

    const results = await evaluateAllActiveRules('manual')
    return NextResponse.json({ results })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
