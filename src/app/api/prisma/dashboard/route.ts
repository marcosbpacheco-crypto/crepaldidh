import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET() {
  const start = Date.now()

  const [
    activeCompanies,
    activeClients,
    completedTrainings,
    totalReceived,
    totalRevenue,
    totalPaidPayable,
    monthlyBilling,
    companyCount,
    activeProjects,
  ] = await Promise.all([
    prisma.crm_companies.count({
      where: { status: 'active', deleted_at: null },
    }),
    prisma.client_list.count({
      where: { status: 'active', deleted_at: null },
    }),
    prisma.training_events.count({
      where: { status: 'completed' },
    }),
    prisma.financial_accounts_receivable.aggregate({
      _sum: { amount: true },
      where: { status: 'paid' },
    }),
    prisma.financial_accounts_receivable.aggregate({
      _sum: { amount: true },
    }),
    prisma.financial_accounts_payable.aggregate({
      _sum: { amount: true },
      where: { status: 'paid' },
    }),
    getMonthlyBilling(),
    prisma.crm_companies.count({
      where: { deleted_at: null },
    }),
    prisma.projects.count({
      where: { deleted_at: null },
    }),
  ])

  const elapsed = Date.now() - start

  return NextResponse.json({
    kpis: {
      activeCompanies,
      activeClients,
      completedTrainings,
      totalReceived: Number(totalReceived._sum.amount) || 0,
      totalRevenue: Number(totalRevenue._sum.amount) || 0,
      totalPaidPayable: Number(totalPaidPayable._sum.amount) || 0,
      estimatedTaxes: Math.round((Number(totalReceived._sum.amount) || 0) * 0.115),
      companyCount,
      activeProjects,
    },
    monthlyBilling,
    timingMs: elapsed,
  })
}

async function getMonthlyBilling() {
  const sixMonthsAgo = new Date()
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)

  const records = await prisma.financial_accounts_receivable.findMany({
    where: {
      status: 'paid',
      created_at: { gte: sixMonthsAgo },
    },
    select: { amount: true, created_at: true },
  })

  const monthMap: Record<string, number> = {}
  for (const r of records) {
    const d = new Date(r.created_at!)
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    monthMap[key] = (monthMap[key] ?? 0) + Number(r.amount)
  }

  const months: { month: string; total: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
    months.push({ month: key, total: monthMap[key] ?? 0 })
  }
  return months
}