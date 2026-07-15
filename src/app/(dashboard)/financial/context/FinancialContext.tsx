'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { financeService } from '@/services/financeService'

// ==========================================
// 1. INTERFACES & TYPES
// ==========================================

export type ReceivableStatus = 'pending' | 'paid' | 'overdue' | 'canceled'
export type PayableStatus = 'pending' | 'paid' | 'overdue' | 'canceled'
export type RecurrenceFrequency = 'monthly' | 'bimonthly' | 'quarterly' | 'semiannual' | 'annual'
export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'canceled'

export interface FinancialCategory {
  id: string
  name: string
  type: 'income' | 'expense'
  description: string
  createdAt: string
}

export interface PaymentMethod {
  id: string
  name: string
  active: boolean
  createdAt: string
}

export interface AccountReceivable {
  id: string
  companyId: string
  companyName: string
  contractId?: string
  contractName?: string
  projectId?: string
  projectName?: string
  serviceName: string
  amount: number
  dueDate: string
  paymentDate?: string
  status: ReceivableStatus
  paymentMethodId?: string
  paymentMethodName?: string
  notes: string
  createdAt: string
  invoiceFileUrl?: string
  invoiceNumber?: string
  invoiceIssuer?: string
}

export interface AccountPayable {
  id: string
  supplier: string
  categoryId?: string
  categoryName?: string
  description: string
  amount: number
  dueDate: string
  paymentDate?: string
  status: PayableStatus
  attachmentUrl?: string
  notes: string
  createdAt: string
  invoiceFileUrl?: string
  invoiceNumber?: string
  invoiceIssuer?: string
}

export interface FinancialTransaction {
  id: string
  description: string
  amount: number
  type: 'income' | 'expense'
  transactionDate: string
  paymentMethodId?: string
  receivableId?: string
  payableId?: string
  categoryId?: string
  createdAt: string
}

export interface FinancialInvoice {
  id: string
  receivableId: string
  invoiceNumber: string
  issueDate: string
  status: InvoiceStatus
  fileUrl?: string
  createdAt: string
}

export interface RecurringRule {
  id: string
  contractId: string
  contractName: string
  companyId: string
  companyName: string
  frequency: RecurrenceFrequency
  amount: number
  nextBillingDate: string
  readjustmentRate: number
  status: 'active' | 'paused' | 'canceled'
  serviceName: string
  createdAt: string
}

// DRE (Demonstração do Resultado do Exercício) is computed from data
export interface DRE {
  grossRevenue: number
  receivedRevenue: number
  pendingRevenue: number
  operatingExpenses: number
  paidExpenses: number
  estimatedTaxes: number
  netProfit: number
  profitMargin: number
}

// Cash Flow Projection
export interface CashFlowProjection {
  date: string
  dayLabel: string
  inflow: number
  outflow: number
  balance: number
  cumulativeBalance: number
}

// Detailed DRE line
export interface DetailedDRELine {
  label: string
  value: number
  type: 'revenue' | 'deduction' | 'expense' | 'tax' | 'result'
  bold?: boolean
  negative?: boolean
}

// Bank transaction for reconciliation
export interface BankTransaction {
  id: string
  date: string
  description: string
  amount: number
  type: 'credit' | 'debit'
  category?: string
  matchedId?: string
  matchedType?: 'receivable' | 'payable'
  reconciled: boolean
  createdAt: string
}

// ==========================================
// 1b. ADVANCED KPI TYPES
// ==========================================

export interface FinancialAlert {
  id: string
  type: 'contract_expiring' | 'invoice_overdue' | 'client_overdue' | 'project_overbudget' | 'low_margin'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  entityId: string
  entityName: string
  value?: number
  date?: string
}

export interface ClientProfitability {
  companyId: string
  companyName: string
  totalRevenue: number
  totalPaid: number
  overdueAmount: number
  margin: number
  projectCount: number
  serviceCount: number
}

export interface ConsultantRevenue {
  consultantName: string
  totalRevenue: number
  dealCount: number
}

export interface BusinessUnitRevenue {
  unitName: string
  totalRevenue: number
  percentage: number
}

interface FinancialContextType {
  // Data
  categories: FinancialCategory[]
  paymentMethods: PaymentMethod[]
  receivables: AccountReceivable[]
  payables: AccountPayable[]
  transactions: FinancialTransaction[]
  invoices: FinancialInvoice[]
  recurringRules: RecurringRule[]

  // Computed KPIs
  totalReceivable: number
  totalReceived: number
  totalOverdue: number
  totalPendingReceivable: number
  totalPayable: number
  totalPaidPayable: number
  totalPendingPayable: number
  dre: DRE
  revenueByClient: { companyName: string; total: number }[]
  revenueByService: { serviceName: string; total: number }[]
  revenueByProject: { projectName: string; total: number }[]
  upcomingDueDates: AccountReceivable[]
  monthlyBilling: { month: string; total: number }[]

  // Advanced KPIs
  mrr: number
  arr: number
  ticketMedioCliente: number
  ticketMedioServico: number
  revenueByConsultant: ConsultantRevenue[]
  revenueByBusinessUnit: BusinessUnitRevenue[]
  clientesMaisRentaveis: ClientProfitability[]
  projetosMaisRentaveis: { projectName: string; total: number }[]

  // Alerts
  financialAlerts: FinancialAlert[]

  // Cash flow & reports
  cashFlowProjection: CashFlowProjection[]
  detailedDre: DetailedDRELine[]
  expensesByCategory: { category: string; total: number; percentage: number }[]
  receivablesAging: { bucket: string; total: number; count: number }[]

  // Bank reconciliation
  bankTransactions: BankTransaction[]
  addBankTransaction: (t: Omit<BankTransaction, 'id' | 'createdAt'>) => BankTransaction
  matchBankTransaction: (id: string, matchedId: string, matchedType: 'receivable' | 'payable') => void
  reconcileBankTransaction: (id: string) => void
  deleteBankTransaction: (id: string) => void

  // Mutators - Categories
  addCategory: (c: Omit<FinancialCategory, 'id' | 'createdAt'>) => FinancialCategory
  deleteCategory: (id: string) => void

  // Mutators - Payment Methods
  addPaymentMethod: (p: Omit<PaymentMethod, 'id' | 'createdAt'>) => PaymentMethod
  togglePaymentMethod: (id: string) => void

  // Mutators - Receivables
  addReceivable: (r: Omit<AccountReceivable, 'id' | 'createdAt'>) => AccountReceivable
  updateReceivable: (id: string, updates: Partial<AccountReceivable>) => void
  deleteReceivable: (id: string) => void
  markAsPaid: (id: string, paymentDate: string, paymentMethodId?: string) => void
  createReceivableFromContract: (params: { companyId: string; companyName: string; contractId: string; contractName: string; serviceName: string; amount: number; dueDate: string; projectId?: string; projectName?: string }) => AccountReceivable

  // Mutators - Payables
  addPayable: (p: Omit<AccountPayable, 'id' | 'createdAt'>) => AccountPayable
  updatePayable: (id: string, updates: Partial<AccountPayable>) => void
  deletePayable: (id: string) => void
  markPayableAsPaid: (id: string, paymentDate: string) => void

  // Mutators - Invoices
  addInvoice: (inv: Omit<FinancialInvoice, 'id' | 'createdAt'>) => FinancialInvoice
  updateInvoice: (id: string, updates: Partial<FinancialInvoice>) => void
  deleteInvoice: (id: string) => void

  // Mutators - Recurring Rules
  addRecurringRule: (r: Omit<RecurringRule, 'id' | 'createdAt'>) => RecurringRule
  updateRecurringRule: (id: string, updates: Partial<RecurringRule>) => void
  cancelRecurringRule: (id: string) => void

  // AI Helpers
  generateFinancialSummary: (month?: string) => Promise<string>
  identifyOverdueClients: () => Promise<string>
  suggestCollections: (receivableId: string) => Promise<string>
  generateCashFlowForecast: () => Promise<string>
  generateExecutiveReport: () => Promise<string>
}

// ==========================================
// 2. SEED DATA
// ==========================================

const SEED_PAYMENT_METHODS: PaymentMethod[] = []

const SEED_CATEGORIES: FinancialCategory[] = []

function generateDueDate(baseDays: number): string {
  const d = new Date()
  d.setDate(d.getDate() + baseDays)
  return d.toISOString().split('T')[0]
}

function lateCheck(dueDate: string): boolean {
  return new Date(dueDate + 'T23:59:59') < new Date()
}

const SEED_RECEIVABLES: AccountReceivable[] = []

const SEED_PAYABLES: AccountPayable[] = []

const SEED_RECURRING_RULES: RecurringRule[] = []

// ==========================================
// 3. CONTEXT PROVIDER
// ==========================================

const FinancialContext = createContext<FinancialContextType | undefined>(undefined)

export const FinancialProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<FinancialCategory[]>([])
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [receivables, setReceivables] = useState<AccountReceivable[]>([])
  const [payables, setPayables] = useState<AccountPayable[]>([])
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([])
  const [invoices, setInvoices] = useState<FinancialInvoice[]>([])
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([])
  const [bankTransactions, setBankTransactions] = useState<BankTransaction[]>([])
  const queryClient = useQueryClient()

  // ---- Load from financeService ----
  useEffect(() => {
    if (typeof window === 'undefined') return
    Promise.all([
      financeService.listCategories(),
      financeService.listPaymentMethods(),
      financeService.listReceivables(),
      financeService.listPayables(),
      financeService.listTransactions(),
      financeService.listInvoices(),
      financeService.listRecurringRules(),
      financeService.listBankTransactions(),
    ]).then(([cats, pms, recs, pays, txs, invs, rrs, bts]) => {
      if (cats.length > 0) setCategories(cats)
      if (pms.length > 0) setPaymentMethods(pms)
      if (recs.length > 0) setReceivables(recs)
      if (pays.length > 0) setPayables(pays)
      if (txs.length > 0) setTransactions(txs)
      if (invs.length > 0) setInvoices(invs)
      if (rrs.length > 0) setRecurringRules(rrs)
      if (bts.length > 0) setBankTransactions(bts)
    }).catch((err) => console.error('[FinancialContext] load error:', err))
  }, [])

  // Persistência é feita individualmente nas operações CRUD

  // ==========================================
  // COMPUTED KPIs
  // ==========================================

  const totalReceivable = receivables.filter(r => r.status !== 'canceled').reduce((acc, r) => acc + r.amount, 0)
  const totalReceived = receivables.filter(r => r.status === 'paid').reduce((acc, r) => acc + r.amount, 0)
  const totalOverdue = receivables.filter(r => r.status === 'overdue').reduce((acc, r) => acc + r.amount, 0)
  const totalPendingReceivable = receivables.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0)

  const totalPayable = payables.filter(p => p.status !== 'canceled').reduce((acc, p) => acc + p.amount, 0)
  const totalPaidPayable = payables.filter(p => p.status === 'paid').reduce((acc, p) => acc + p.amount, 0)
  const totalPendingPayable = payables.filter(p => p.status === 'pending' || p.status === 'overdue').reduce((acc, p) => acc + p.amount, 0)

  const grossRevenue = totalReceivable
  const receivedRevenue = totalReceived
  const pendingRevenue = totalPendingReceivable
  const operatingExpenses = totalPayable
  const paidExpenses = totalPaidPayable
  const estimatedTaxes = Math.round(receivedRevenue * 0.115)
  const netProfit = receivedRevenue - paidExpenses - estimatedTaxes
  const profitMargin = receivedRevenue > 0 ? Math.round((netProfit / receivedRevenue) * 100) : 0

  const dre: DRE = { grossRevenue, receivedRevenue, pendingRevenue, operatingExpenses, paidExpenses, estimatedTaxes, netProfit, profitMargin }

  // Revenue by client
  const revenueByClient = Object.values(
    receivables.filter(r => r.status !== 'canceled').reduce((acc, r) => {
      if (!acc[r.companyName]) acc[r.companyName] = { companyName: r.companyName, total: 0 }
      acc[r.companyName].total += r.amount
      return acc
    }, {} as Record<string, { companyName: string; total: number }>)
  ).sort((a, b) => b.total - a.total)

  // Revenue by service
  const revenueByService = Object.values(
    receivables.filter(r => r.status !== 'canceled').reduce((acc, r) => {
      if (!acc[r.serviceName]) acc[r.serviceName] = { serviceName: r.serviceName, total: 0 }
      acc[r.serviceName].total += r.amount
      return acc
    }, {} as Record<string, { serviceName: string; total: number }>)
  ).sort((a, b) => b.total - a.total)

  // Revenue by project
  const revenueByProject = Object.values(
    receivables.filter(r => r.projectName && r.status !== 'canceled').reduce((acc, r) => {
      const k = r.projectName || 'Sem projeto'
      if (!acc[k]) acc[k] = { projectName: k, total: 0 }
      acc[k].total += r.amount
      return acc
    }, {} as Record<string, { projectName: string; total: number }>)
  ).sort((a, b) => b.total - a.total)

  // Upcoming due dates (next 30 days)
  const upcomingDueDates = receivables
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .slice(0, 6)

  // Monthly billing (last 6 months)
  const monthlyBilling = (() => {
    const months: Record<string, number> = {}
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      months[key] = 0
    }
    receivables.filter(r => r.status !== 'canceled').forEach(r => {
      const d = new Date(r.dueDate)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      if (months[key] !== undefined) months[key] += r.amount
    })
    return Object.entries(months).map(([month, total]) => ({ month, total }))
  })()

  // ==========================================
  // ADVANCED KPIs
  // ==========================================

  // MRR (Monthly Recurring Revenue) - sum of active recurring rules
  const mrr = recurringRules
    .filter(r => r.status === 'active')
    .reduce((acc, r) => {
      if (r.frequency === 'monthly') return acc + r.amount
      if (r.frequency === 'bimonthly') return acc + r.amount / 2
      if (r.frequency === 'quarterly') return acc + r.amount / 3
      if (r.frequency === 'semiannual') return acc + r.amount / 6
      if (r.frequency === 'annual') return acc + r.amount / 12
      return acc
    }, 0)

  // ARR (Annual Recurring Revenue)
  const arr = mrr * 12

  // Ticket médio por cliente
  const clientCount = new Set(receivables.map(r => r.companyId)).size
  const ticketMedioCliente = clientCount > 0 ? Math.round(totalReceivable / clientCount) : 0

  // Ticket médio por serviço
  const serviceCount = new Set(receivables.map(r => r.serviceName)).size
  const ticketMedioServico = serviceCount > 0 ? Math.round(totalReceivable / serviceCount) : 0

  // Revenue by consultant (from receivables, grouped by service name as proxy)
  // Real consultant data comes from CRM deals; here we use service grouping as approximation
  const revenueByConsultant: ConsultantRevenue[] = Object.entries(
    receivables.filter(r => r.status !== 'canceled').reduce((acc, r) => {
      const c = r.serviceName
      if (!acc[c]) acc[c] = { consultantName: c, totalRevenue: 0, dealCount: 0 }
      acc[c].totalRevenue += r.amount
      acc[c].dealCount++
      return acc
    }, {} as Record<string, ConsultantRevenue>)
  ).map(([, v]) => v).sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Revenue by business unit (categorizes by service type into broader units)
  const businessUnits: Record<string, string[]> = {
    'Treinamento e Educação': ['Treinamentos Corporativos', 'Palestra CNV', 'Treinamento Multiplicadores', 'Workshop Segurança Psicológica'],
    'Consultoria e Diagnóstico': ['Diagnóstico Psicossocial', 'Consultoria Estratégica'],
    'Mentoria e Desenvolvimento': ['Mentoria de Lideranças'],
  }
  const revenueByBusinessUnit: BusinessUnitRevenue[] = Object.entries(businessUnits).map(([unitName, services]) => {
    const total = receivables
      .filter(r => services.includes(r.serviceName) && r.status !== 'canceled')
      .reduce((acc, r) => acc + r.amount, 0)
    return { unitName, totalRevenue: total, percentage: totalReceivable > 0 ? Math.round((total / totalReceivable) * 100) : 0 }
  }).sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Clientes mais rentáveis
  const clientesMaisRentaveis: ClientProfitability[] = Object.entries(
    receivables.filter(r => r.status !== 'canceled').reduce((acc, r) => {
      if (!acc[r.companyId]) {
        acc[r.companyId] = { companyId: r.companyId, companyName: r.companyName, totalRevenue: 0, totalPaid: 0, overdueAmount: 0, margin: 0, projectCount: 0, serviceCount: 0 }
      }
      acc[r.companyId].totalRevenue += r.amount
      if (r.status === 'paid') acc[r.companyId].totalPaid += r.amount
      if (r.status === 'overdue') acc[r.companyId].overdueAmount += r.amount
      if (r.projectId) acc[r.companyId].projectCount++
      acc[r.companyId].serviceCount++
      return acc
    }, {} as Record<string, ClientProfitability>)
  ).map(([, c]) => ({
    ...c,
    margin: c.totalRevenue > 0 ? Math.round((c.totalPaid / c.totalRevenue) * 100) : 0
  })).sort((a, b) => b.totalRevenue - a.totalRevenue)

  // Projetos mais rentáveis
  const projetosMaisRentaveis = [...revenueByProject].sort((a, b) => b.total - a.total)

  // ==========================================
  // FINANCIAL ALERTS
  // ==========================================

  const financialAlerts: FinancialAlert[] = (() => {
    const alerts: FinancialAlert[] = []
    const now = new Date()
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)

    // Contracts expiring (simulated via recurring rules)
    recurringRules.filter(r => r.status === 'active').forEach(rr => {
      const nextBilling = new Date(rr.nextBillingDate + 'T12:00:00')
      if (nextBilling <= in30Days && nextBilling > now) {
        alerts.push({
          id: `alert-contr-${rr.id}`, type: 'contract_expiring', severity: 'medium',
          title: 'Contrato próximo do vencimento',
          description: `O contrato "${rr.contractName}" tem renovação prevista para ${rr.nextBillingDate}.`,
          entityId: rr.contractId, entityName: rr.contractName, value: rr.amount, date: rr.nextBillingDate,
        })
      }
    })

    // Overdue invoices
    receivables.filter(r => r.status === 'overdue').forEach(r => {
      const daysLate = Math.floor((now.getTime() - new Date(r.dueDate + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))
      alerts.push({
        id: `alert-overdue-${r.id}`, type: 'invoice_overdue',
        severity: daysLate > 30 ? 'critical' : daysLate > 15 ? 'high' : 'medium',
        title: `Fatura vencida - ${r.companyName}`,
        description: `R$ ${r.amount.toLocaleString('pt-BR')} - ${daysLate} dias em atraso. Serviço: ${r.serviceName}`,
        entityId: r.id, entityName: r.companyName, value: r.amount, date: r.dueDate,
      })
    })

    // Overdue clients summary
    const overdueClients = new Set(receivables.filter(r => r.status === 'overdue').map(r => r.companyId))
    if (overdueClients.size > 0) {
      const totalOverdueAmount = receivables.filter(r => r.status === 'overdue').reduce((acc, r) => acc + r.amount, 0)
      alerts.push({
        id: 'alert-clients-overdue', type: 'client_overdue', severity: 'high',
        title: `${overdueClients.size} cliente(s) inadimplente(s)`,
        description: `Valor total vencido: R$ ${totalOverdueAmount.toLocaleString('pt-BR')}. Necessário acionar cobrança.`,
        entityId: 'all', entityName: `${overdueClients.size} clientes`, value: totalOverdueAmount,
      })
    }

    // Low margin warning
    if (profitMargin < 10 && receivedRevenue > 0) {
      alerts.push({
        id: 'alert-low-margin', type: 'low_margin', severity: 'high',
        title: 'Margem líquida baixa',
        description: `Margem atual de ${profitMargin}%. Recomenda-se revisar despesas operacionais e precificação.`,
        entityId: 'all', entityName: 'Geral', value: profitMargin,
      })
    }

    return alerts.sort((a, b) => {
      const order = { critical: 0, high: 1, medium: 2, low: 3 }
      return order[a.severity] - order[b.severity]
    })
  })()

  // ==========================================
  // CASH FLOW PROJECTION (90 days)
  // ==========================================

  const cashFlowProjection: CashFlowProjection[] = (() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const days: CashFlowProjection[] = []
    let cumulative = 0
    for (let i = 0; i < 90; i++) {
      const d = new Date(today)
      d.setDate(d.getDate() + i)
      const dateStr = d.toISOString().split('T')[0]
      const label = d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

      const dayInflow = receivables
        .filter(r => r.dueDate === dateStr && r.status !== 'canceled')
        .reduce((acc, r) => acc + r.amount, 0)
      const dayOutflow = payables
        .filter(p => p.dueDate === dateStr && p.status !== 'canceled' && p.status !== 'paid')
        .reduce((acc, p) => acc + p.amount, 0) +
        recurringRules
          .filter(rr => rr.nextBillingDate === dateStr && rr.status === 'active')
          .reduce((acc, rr) => acc + rr.amount, 0)

      cumulative += dayInflow - dayOutflow
      days.push({ date: dateStr, dayLabel: label, inflow: dayInflow, outflow: dayOutflow, balance: dayInflow - dayOutflow, cumulativeBalance: cumulative })
    }
    return days
  })()

  // Detailed DRE (expanded lines)
  const detailedDre: DetailedDRELine[] = (() => {
    const rec = totalReceivable
    const rev = totalReceived
    const pend = totalPendingReceivable
    const expenses = totalPayable
    const taxes = estimatedTaxes
    const profit = netProfit
    const margin = profitMargin
    return [
      { label: 'Receita Bruta', value: rec, type: 'revenue' },
      { label: '(-) Receita Recebida', value: rev, type: 'deduction' },
      { label: '(-) Receita Pendente', value: pend, type: 'deduction', negative: true },
      { label: 'Receita Líquida', value: rev, type: 'result', bold: true },
      { label: '(-) Despesas Operacionais', value: expenses, type: 'expense', negative: true },
      { label: '(-) Impostos Estimados (11,5%)', value: taxes, type: 'tax', negative: true },
      { label: 'Lucro Líquido', value: profit, type: 'result', bold: true, negative: profit < 0 },
      { label: 'Margem Líquida', value: margin, type: 'result', bold: true },
    ]
  })()

  // Expenses by category
  const expensesByCategory = (() => {
    const grouped: Record<string, number> = {}
    payables.filter(p => p.categoryName && p.status !== 'canceled').forEach(p => {
      grouped[p.categoryName!] = (grouped[p.categoryName!] || 0) + p.amount
    })
    const totalExpenses = Object.values(grouped).reduce((a, b) => a + b, 0)
    return Object.entries(grouped)
      .map(([category, total]) => ({ category, total, percentage: totalExpenses > 0 ? Math.round((total / totalExpenses) * 100) : 0 }))
      .sort((a, b) => b.total - a.total)
  })()

  // Receivables aging
  const receivablesAging = (() => {
    const now = new Date()
    const aging = { 'A Vencer': { total: 0, count: 0 }, '1-30 dias': { total: 0, count: 0 }, '31-60 dias': { total: 0, count: 0 }, '61-90 dias': { total: 0, count: 0 }, '+90 dias': { total: 0, count: 0 } }
    receivables.filter(r => r.status === 'pending' || r.status === 'overdue').forEach(r => {
      const daysLate = Math.floor((now.getTime() - new Date(r.dueDate + 'T12:00:00').getTime()) / (1000 * 60 * 60 * 24))
      if (daysLate <= 0) { aging['A Vencer'].total += r.amount; aging['A Vencer'].count++ }
      else if (daysLate <= 30) { aging['1-30 dias'].total += r.amount; aging['1-30 dias'].count++ }
      else if (daysLate <= 60) { aging['31-60 dias'].total += r.amount; aging['31-60 dias'].count++ }
      else if (daysLate <= 90) { aging['61-90 dias'].total += r.amount; aging['61-90 dias'].count++ }
      else { aging['+90 dias'].total += r.amount; aging['+90 dias'].count++ }
    })
    return Object.entries(aging).map(([bucket, data]) => ({ bucket, ...data }))
  })()

  // ==========================================
  // MUTATORS - Categories
  // ==========================================

  const addCategory = (c: Omit<FinancialCategory, 'id' | 'createdAt'>): FinancialCategory => {
    const nc: FinancialCategory = { ...c, id: `cat-${Date.now()}`, createdAt: new Date().toISOString() }
    setCategories(prev => [nc, ...prev])
    return nc
  }

  const deleteCategory = (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id))
  }

  // ==========================================
  // MUTATORS - Payment Methods
  // ==========================================

  const addPaymentMethod = (p: Omit<PaymentMethod, 'id' | 'createdAt'>): PaymentMethod => {
    const np: PaymentMethod = { ...p, id: `pm-${Date.now()}`, createdAt: new Date().toISOString() }
    setPaymentMethods(prev => [np, ...prev])
    return np
  }

  const togglePaymentMethod = (id: string) => {
    setPaymentMethods(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p))
  }

  // ==========================================
  // MUTATORS - Receivables
  // ==========================================

  const addReceivable = (r: Omit<AccountReceivable, 'id' | 'createdAt'>): AccountReceivable => {
    const nr: AccountReceivable = { ...r, id: `rec-${Date.now()}`, createdAt: new Date().toISOString() }
    setReceivables(prev => [nr, ...prev])
    return nr
  }

  const updateReceivable = (id: string, updates: Partial<AccountReceivable>) => {
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const deleteReceivable = (id: string) => {
    setReceivables(prev => prev.filter(r => r.id !== id))
  }

  const markAsPaid = (id: string, paymentDate: string, paymentMethodId?: string) => {
    const rec = receivables.find(r => r.id === id)
    if (!rec) return
    const pm = paymentMethods.find(p => p.id === paymentMethodId)
    const updated = { status: 'paid' as const, paymentDate, paymentMethodId, paymentMethodName: pm?.name }
    setReceivables(prev => prev.map(r => r.id === id ? { ...r, ...updated } : r))
    
    const tx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      description: `Recebimento: ${rec.serviceName} - ${rec.companyName}`,
      amount: rec.amount,
      type: 'income',
      transactionDate: paymentDate,
      paymentMethodId,
      receivableId: id,
      createdAt: new Date().toISOString()
    }
    setTransactions(prev => [tx, ...prev])
  }

  // Integration: Create receivable automatically from a contract
  const createReceivableFromContract = (params: { companyId: string; companyName: string; contractId: string; contractName: string; serviceName: string; amount: number; dueDate: string; projectId?: string; projectName?: string }): AccountReceivable => {
    const nr: AccountReceivable = {
      id: `rec-${Date.now()}`,
      companyId: params.companyId,
      companyName: params.companyName,
      contractId: params.contractId,
      contractName: params.contractName,
      projectId: params.projectId,
      projectName: params.projectName,
      serviceName: params.serviceName,
      amount: params.amount,
      dueDate: params.dueDate,
      status: lateCheck(params.dueDate) ? 'overdue' : 'pending',
      notes: 'Gerado automaticamente a partir de contrato ativo',
      createdAt: new Date().toISOString()
    }
    setReceivables(prev => [nr, ...prev])
    return nr
  }

  // ==========================================
  // MUTATORS - Payables
  // ==========================================

  const addPayable = (p: Omit<AccountPayable, 'id' | 'createdAt'>): AccountPayable => {
    const np: AccountPayable = { ...p, id: `pay-${Date.now()}`, createdAt: new Date().toISOString() }
    setPayables(prev => [np, ...prev])
    return np
  }

  const updatePayable = (id: string, updates: Partial<AccountPayable>) => {
    setPayables(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const deletePayable = (id: string) => {
    setPayables(prev => prev.filter(p => p.id !== id))
  }

  const markPayableAsPaid = (id: string, paymentDate: string) => {
    const pay = payables.find(p => p.id === id)
    if (!pay) return
    const updated = { status: 'paid' as const, paymentDate }
    setPayables(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p))

    const tx: FinancialTransaction = {
      id: `tx-${Date.now()}`,
      description: `Pagamento: ${pay.description} - ${pay.supplier}`,
      amount: pay.amount,
      type: 'expense',
      transactionDate: paymentDate,
      payableId: id,
      categoryId: pay.categoryId,
      createdAt: new Date().toISOString()
    }
    setTransactions(prev => [tx, ...prev])
  }

  // ==========================================
  // MUTATORS - Recurring Rules
  // ==========================================

  const addRecurringRule = (r: Omit<RecurringRule, 'id' | 'createdAt'>): RecurringRule => {
    const nr: RecurringRule = { ...r, id: `rr-${Date.now()}`, createdAt: new Date().toISOString() }
    setRecurringRules(prev => [nr, ...prev])
    return nr
  }

  const updateRecurringRule = (id: string, updates: Partial<RecurringRule>) => {
    setRecurringRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r))
  }

  const cancelRecurringRule = (id: string) => {
    setRecurringRules(prev => prev.map(r => r.id === id ? { ...r, status: 'canceled' as const } : r))
  }

  // ==========================================
  // MUTATORS - Bank Transactions
  // ==========================================

  const addBankTransaction = (t: Omit<BankTransaction, 'id' | 'createdAt'>): BankTransaction => {
    const nt: BankTransaction = { ...t, id: `bt-${Date.now()}`, createdAt: new Date().toISOString() }
    setBankTransactions(prev => [nt, ...prev])
    return nt
  }

  const matchBankTransaction = (id: string, matchedId: string, matchedType: 'receivable' | 'payable') => {
    setBankTransactions(prev => prev.map(t => t.id === id ? { ...t, matchedId, matchedType, reconciled: true } : t))
  }

  const reconcileBankTransaction = (id: string) => {
    setBankTransactions(prev => prev.map(t => t.id === id ? { ...t, reconciled: !t.reconciled } : t))
  }

  const deleteBankTransaction = (id: string) => {
    setBankTransactions(prev => prev.filter(t => t.id !== id))
  }

  // ==========================================
  // MUTATORS - Invoices
  // ==========================================

  const addInvoice = (inv: Omit<FinancialInvoice, 'id' | 'createdAt'>): FinancialInvoice => {
    const ni: FinancialInvoice = { ...inv, id: `finv-${Date.now()}`, createdAt: new Date().toISOString() }
    setInvoices(prev => [ni, ...prev])
    return ni
  }

  const updateInvoice = (id: string, updates: Partial<FinancialInvoice>) => {
    setInvoices(prev => prev.map(inv => inv.id === id ? { ...inv, ...updates } : inv))
  }

  const deleteInvoice = (id: string) => {
    setInvoices(prev => prev.filter(inv => inv.id !== id))
  }

  // ==========================================
  // AI HELPERS
  // ==========================================

  const generateFinancialSummary = async (month?: string): Promise<string> => {
    const m = month || new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    const total = totalReceivable
    const received = totalReceived
    const pendentes = totalPendingReceivable
    const vencidos = totalOverdue
    const despesas = totalPayable
    return `📊 **Resumo Financeiro - ${m}**\n\n💰 **Faturamento Bruto**: R$ ${total.toLocaleString('pt-BR')}\n✅ **Recebido**: R$ ${received.toLocaleString('pt-BR')}\n⏳ **A Receber**: R$ ${pendentes.toLocaleString('pt-BR')}\n🔴 **Vencidos**: R$ ${vencidos.toLocaleString('pt-BR')}\n📉 **Despesas Totais**: R$ ${despesas.toLocaleString('pt-BR')}\n📈 **Lucro Líquido Estimado**: R$ ${netProfit.toLocaleString('pt-BR')} (${profitMargin > 0 ? '+' : ''}${profitMargin}% de margem)`
  }

  const identifyOverdueClients = async (): Promise<string> => {
    const overdue = receivables.filter(r => r.status === 'overdue')
    if (overdue.length === 0) return '✅ Nenhum cliente inadimplente no momento. Todas as contas a receber estão em dia.'
    const totalOverdueAmount = overdue.reduce((acc, r) => acc + r.amount, 0)
    const list = overdue.map(r => `- **${r.companyName}** — R$ ${r.amount.toLocaleString('pt-BR')} (vencimento: ${new Date(r.dueDate).toLocaleDateString('pt-BR')})`).join('\n')
    return `🔴 **${overdue.length} cliente(s) inadimplente(s)**\nValor total vencido: R$ ${totalOverdueAmount.toLocaleString('pt-BR')}\n\n${list}\n\n💡 *Sugestão: Disparar cobrança automatizada e agendar follow-up com o comercial.*`
  }

  const suggestCollections = async (receivableId: string): Promise<string> => {
    const rec = receivables.find(r => r.id === receivableId)
    if (!rec) return 'Conta a receber não localizada.'
    const daysLate = Math.abs(Math.floor((new Date().getTime() - new Date(rec.dueDate).getTime()) / (1000 * 60 * 60 * 24)))
    return `💳 **Sugestão de Cobrança — ${rec.companyName}**\n\n📋 Serviço: ${rec.serviceName}\n💰 Valor: R$ ${rec.amount.toLocaleString('pt-BR')}\n📅 Vencimento original: ${new Date(rec.dueDate).toLocaleDateString('pt-BR')}\n⏰ Dias em atraso: ${daysLate}\n\n**Ações sugeridas:**\n1. 📱 Enviar lembrete via WhatsApp com boleto atualizado\n2. 📧 Disparar e-mail de cobrança amigável\n3. 📞 Agendar ligação de follow-up com o responsável financeiro\n4. 🔄 Se dias > 30, acionar equipe jurídica / acordo de parcelamento`
  }

  const generateCashFlowForecast = async (): Promise<string> => {
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    const currentEntries = receivables.filter(r => {
      const d = new Date(r.dueDate)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    const currentExits = payables.filter(p => {
      const d = new Date(p.dueDate)
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear
    })
    const entradasMes = currentEntries.reduce((acc, r) => acc + (r.status !== 'canceled' ? r.amount : 0), 0)
    const saidasMes = currentExits.reduce((acc, p) => acc + (p.status !== 'canceled' ? p.amount : 0), 0)
    const saldo = entradasMes - saidasMes
    const futuro = receivables.filter(r => r.status === 'pending').reduce((acc, r) => acc + r.amount, 0)

    return `📈 **Previsão de Fluxo de Caixa**\n\n📆 **Mês Atual:**\n  ➕ Entradas previstas: R$ ${entradasMes.toLocaleString('pt-BR')}\n  ➖ Saídas previstas: R$ ${saidasMes.toLocaleString('pt-BR')}\n  💰 Saldo projetado: R$ ${saldo.toLocaleString('pt-BR')}\n\n🔮 **A Receber (total pendente):** R$ ${futuro.toLocaleString('pt-BR')}\n🚨 **Vencidos:** R$ ${totalOverdue.toLocaleString('pt-BR')}\n\n📊 **Recomendação:** ${saldo < 0 ? 'Fluxo negativo — priorizar recebimentos vencidos e renegociar despesas' : 'Fluxo positivo — manter planejamento e considerar investimentos.'}`
  }

  const generateExecutiveReport = async (): Promise<string> => {
    const topClient = revenueByClient[0]
    const topService = revenueByService[0]
    return `📑 **Relatório Executivo — CrepaldiDH ERP**\n\n**📊 Visão Geral Financeira**\n- Faturamento Bruto: R$ ${grossRevenue.toLocaleString('pt-BR')}\n- Receita Recebida: R$ ${receivedRevenue.toLocaleString('pt-BR')}\n- Despesas Operacionais: R$ ${paidExpenses.toLocaleString('pt-BR')}\n- Lucro Líquido Estimado: R$ ${netProfit.toLocaleString('pt-BR')}\n- Margem: ${profitMargin}%\n\n**🏆 Destaques**\n- Maior cliente: ${topClient?.companyName || '-'} (R$ ${topClient?.total.toLocaleString('pt-BR') || 0})\n- Serviço mais rentável: ${topService?.serviceName || '-'} (R$ ${topService?.total.toLocaleString('pt-BR') || 0})\n- ${recurringRules.filter(r => r.status === 'active').length} contratos recorrentes ativos\n- ${receivables.filter(r => r.status === 'overdue').length} inadimplências pendentes\n\n✅ Gerado automaticamente pelo sistema CrepaldiDH.`
  }

  return (
    <FinancialContext.Provider value={{
      categories, paymentMethods, receivables, payables, transactions, invoices, recurringRules,
      totalReceivable, totalReceived, totalOverdue, totalPendingReceivable,
      totalPayable, totalPaidPayable, totalPendingPayable, dre,
      revenueByClient, revenueByService, revenueByProject, upcomingDueDates, monthlyBilling,
      mrr, arr, ticketMedioCliente, ticketMedioServico,
      revenueByConsultant, revenueByBusinessUnit, clientesMaisRentaveis, projetosMaisRentaveis,
      financialAlerts,
      cashFlowProjection, detailedDre, expensesByCategory, receivablesAging,
      bankTransactions, addBankTransaction, matchBankTransaction, reconcileBankTransaction, deleteBankTransaction,
      addCategory, deleteCategory,
      addPaymentMethod, togglePaymentMethod,
      addReceivable, updateReceivable, deleteReceivable, markAsPaid, createReceivableFromContract,
      addPayable, updatePayable, deletePayable, markPayableAsPaid,
      addRecurringRule, updateRecurringRule, cancelRecurringRule,
      addInvoice, updateInvoice, deleteInvoice,
      generateFinancialSummary, identifyOverdueClients, suggestCollections, generateCashFlowForecast, generateExecutiveReport,
    }}>
      {children}
    </FinancialContext.Provider>
  )
}

export const useFinancial = () => {
  const ctx = useContext(FinancialContext)
  if (!ctx) throw new Error('useFinancial must be used within a FinancialProvider')
  return ctx
}
