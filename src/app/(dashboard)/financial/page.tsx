'use client'

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import { useFinancial, AccountReceivable, RecurringRule } from './context/FinancialContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import {
  LayoutDashboard, ArrowDownToLine, ArrowUpFromLine, Repeat, BarChart3,
  Zap, FileText, Brain, Plus, Search, X, Download,
  DollarSign, TrendingUp, AlertTriangle, CheckCircle, Clock,
  Calendar, Building2, Briefcase, Receipt, Trash2, Loader2, Printer,
  ChevronRight, RepeatIcon, Percent, Landmark, TrendingDown,
  Filter, RotateCw, Upload, Banknote, ArrowLeftRight
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, LineChart, Line, CartesianGrid } from 'recharts'

type TabId = 'dashboard' | 'receivable' | 'payable' | 'recurrence' | 'dre' | 'collections' | 'reports' | 'ai' | 'cashflow' | 'reconciliation'

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'receivable', label: 'Contas a Receber', icon: ArrowDownToLine },
  { id: 'payable', label: 'Contas a Pagar', icon: ArrowUpFromLine },
  { id: 'recurrence', label: 'Recorrências', icon: Repeat },
  { id: 'dre', label: 'DRE', icon: BarChart3 },
  { id: 'cashflow', label: 'Fluxo de Caixa', icon: TrendingDown },
  { id: 'collections', label: 'Cobranças', icon: Zap },
  { id: 'reports', label: 'Relatórios', icon: FileText },
  { id: 'reconciliation', label: 'Conciliação', icon: Landmark },
  { id: 'ai', label: 'IA Financeira', icon: Brain },
]

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6']

const STATUS_REC: Record<string, { label: string; color: string }> = {
  pending: { label: 'A Receber', color: 'bg-blue-50 text-blue-700 border-blue-100' },
  paid: { label: 'Recebido', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  overdue: { label: 'Atrasado', color: 'bg-red-50 text-red-700 border-red-100' },
  canceled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 border-slate-200' },
}
const STATUS_PAY: Record<string, { label: string; color: string }> = {
  pending: { label: 'A Pagar', color: 'bg-amber-50 text-amber-700 border-amber-100' },
  paid: { label: 'Pago', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
  overdue: { label: 'Vencido', color: 'bg-red-50 text-red-700 border-red-100' },
  canceled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500 border-slate-200' },
}

function fmt(v: number) { return `R$ ${v.toLocaleString('pt-BR')}` }
function sd(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') }
function late(dueDate: string): boolean { return new Date(dueDate + 'T23:59:59') < new Date() }

const DRE_COLORS: Record<string, string> = {
  revenue: '#10b981', deduction: '#f59e0b', expense: '#ef4444', tax: '#8b5cf6', result: '#3b82f6'
}
const DRE_ICONS: Record<string, string> = {
  revenue: '▲', deduction: '▼', expense: '▼', tax: '◆', result: '●'
}

export default function FinancialPage() {
  const fin = useFinancial()
  const { companies, contracts } = useCrm()
  const [tab, setTab] = useState<TabId>('dashboard')
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const [showRecForm, setShowRecForm] = useState(false)
  const [showPayForm, setShowPayForm] = useState(false)
  const [showRrForm, setShowRrForm] = useState(false)
  const [showPayModal, setShowPayModal] = useState<AccountReceivable | null>(null)
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  // DRE period filter
  const [drePeriod, setDrePeriod] = useState<'current' | '3months' | 'ytd' | 'all'>('current')

  // Cash flow period filter
  const [cfPeriod, setCfPeriod] = useState<'30' | '60' | '90'>('30')

  // Reports filter
  const [reportType, setReportType] = useState<'revenue' | 'overdue' | 'recurrence' | 'expenses' | 'aging'>('revenue')
  const [showReportData, setShowReportData] = useState(false)

  // Bank reconciliation
  const [btForm, setBtForm] = useState({ date: '', description: '', amount: 0, type: 'credit' as 'credit' | 'debit', category: '' })
  const [showBtForm, setShowBtForm] = useState(false)
  const [btSearch, setBtSearch] = useState('')

  // Invoice upload/view
  const [invoiceTarget, setInvoiceTarget] = useState<{ type: 'receivable' | 'payable'; id: string } | null>(null)
  const [viewInvoiceTarget, setViewInvoiceTarget] = useState<{ type: 'receivable' | 'payable'; id: string } | null>(null)
  const [invoiceFileData, setInvoiceFileData] = useState('')
  const [invoiceForm, setInvoiceForm] = useState({ number: '', issuer: '', amount: 0, issueDate: '' })

  const [recForm, setRecForm] = useState({ companyId: '', contractId: '', serviceName: '', amount: 0, dueDate: '', notes: '', paymentMethodId: '' })
  const [payForm, setPayForm] = useState({ supplier: '', categoryId: '', description: '', amount: 0, dueDate: '', notes: '' })
  const [rrForm, setRrForm] = useState({ contractId: '', frequency: 'monthly' as RecurringRule['frequency'], amount: 0, nextBillingDate: '', readjustmentRate: 0, serviceName: '' })

  const reportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fin.receivables.forEach(r => {
      if (r.status !== 'paid' && r.status !== 'canceled' && late(r.dueDate) && r.status !== 'overdue')
        fin.updateReceivable(r.id, { status: 'overdue' })
    })
  }, [fin])

  // DRE period-filtered data
  const dreFilteredData = useMemo(() => {
    const now = new Date()
    let startDate: Date
    switch (drePeriod) {
      case 'current':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1)
        break
      case '3months':
        startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
        break
      case 'ytd':
        startDate = new Date(now.getFullYear(), 0, 1)
        break
      default:
        startDate = new Date(0)
    }
    const filteredRecs = fin.receivables.filter(r => new Date(r.createdAt) >= startDate)
    const filteredPays = fin.payables.filter(p => new Date(p.createdAt) >= startDate)
    const recTotal = filteredRecs.reduce((a, r) => a + r.amount, 0)
    const recPaid = filteredRecs.filter(r => r.status === 'paid').reduce((a, r) => a + r.amount, 0)
    const payTotal = filteredPays.reduce((a, p) => a + p.amount, 0)
    const payPaid = filteredPays.filter(p => p.status === 'paid').reduce((a, p) => a + p.amount, 0)
    const tax = Math.round(recTotal * 0.115)
    const profit = recPaid - payPaid - tax
    const margin = recPaid > 0 ? Math.round((profit / recPaid) * 100) : 0

    return {
      grossRevenue: recTotal,
      receivedRevenue: recPaid,
      pendingRevenue: recTotal - recPaid,
      operatingExpenses: payTotal,
      paidExpenses: payPaid,
      estimatedTaxes: tax,
      netProfit: profit,
      profitMargin: margin,
      receivablesCount: filteredRecs.length,
      payablesCount: filteredPays.length,
    }
  }, [fin.receivables, fin.payables, drePeriod])

  const filteredRecs = useMemo(() => {
    let list = fin.receivables
    if (search) { const q = search.toLowerCase(); list = list.filter(r => r.companyName.toLowerCase().includes(q) || r.serviceName.toLowerCase().includes(q)) }
    if (statusFilter) list = list.filter(r => r.status === statusFilter)
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [fin.receivables, search, statusFilter])

  const filteredPays = useMemo(() => {
    let list = fin.payables
    if (search) { const q = search.toLowerCase(); list = list.filter(p => p.supplier.toLowerCase().includes(q) || p.description.toLowerCase().includes(q)) }
    if (statusFilter) list = list.filter(p => p.status === statusFilter)
    return list.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
  }, [fin.payables, search, statusFilter])

  const filteredBt = useMemo(() => {
    let list = fin.bankTransactions
    if (btSearch) { const q = btSearch.toLowerCase(); list = list.filter(t => t.description.toLowerCase().includes(q) || (t.category || '').toLowerCase().includes(q)) }
    return list
  }, [fin.bankTransactions, btSearch])

  const cfData = useMemo(() => {
    const days = parseInt(cfPeriod)
    return fin.cashFlowProjection.slice(0, days)
  }, [fin.cashFlowProjection, cfPeriod])

  const handleCreateRec = (e: React.FormEvent) => {
    e.preventDefault()
    const comp = companies.find(c => c.id === recForm.companyId)
    const contr = contracts.find(c => c.id === recForm.contractId)
    fin.addReceivable({
      companyId: recForm.companyId, companyName: comp?.name || recForm.companyId,
      contractId: recForm.contractId || undefined, contractName: contr?.title || undefined,
      serviceName: recForm.serviceName, amount: recForm.amount, dueDate: recForm.dueDate,
      status: late(recForm.dueDate) ? 'overdue' : 'pending',
      notes: recForm.notes, paymentMethodId: recForm.paymentMethodId || undefined,
    })
    setShowRecForm(false)
    setRecForm({ companyId: '', contractId: '', serviceName: '', amount: 0, dueDate: '', notes: '', paymentMethodId: '' })
  }

  const handleCreatePay = (e: React.FormEvent) => {
    e.preventDefault()
    fin.addPayable({
      supplier: payForm.supplier, categoryId: payForm.categoryId || undefined,
      categoryName: fin.categories.find(c => c.id === payForm.categoryId)?.name,
      description: payForm.description, amount: payForm.amount, dueDate: payForm.dueDate,
      status: late(payForm.dueDate) ? 'overdue' : 'pending', notes: payForm.notes,
    })
    setShowPayForm(false)
    setPayForm({ supplier: '', categoryId: '', description: '', amount: 0, dueDate: '', notes: '' })
  }

  const handleCreateRr = (e: React.FormEvent) => {
    e.preventDefault()
    const contr = contracts.find(c => c.id === rrForm.contractId)
    const comp = contr ? companies.find(c => c.id === contr.companyId) : undefined
    fin.addRecurringRule({
      contractId: rrForm.contractId, contractName: contr?.title || 'Contrato',
      companyId: contr?.companyId || '', companyName: comp?.name || '',
      frequency: rrForm.frequency, amount: rrForm.amount,
      nextBillingDate: rrForm.nextBillingDate, readjustmentRate: rrForm.readjustmentRate,
      status: 'active', serviceName: rrForm.serviceName,
    })
    setShowRrForm(false)
    setRrForm({ contractId: '', frequency: 'monthly', amount: 0, nextBillingDate: '', readjustmentRate: 0, serviceName: '' })
  }

  const handleMarkPaid = () => {
    if (!showPayModal) return
    fin.markAsPaid(showPayModal.id, new Date().toISOString().split('T')[0])
    setShowPayModal(null)
  }

  const handleExportPdf = async () => {
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      if (!reportRef.current) return
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true, backgroundColor: '#ffffff' })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const margin = 10
      const imgW = pw - margin * 2
      const imgH = (canvas.height / canvas.width) * imgW
      const pageH = ph - margin * 2
      const totalPages = Math.ceil(imgH / pageH)
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()
        const srcY = (canvas.height / totalPages) * i
        pdf.addImage(imgData, 'PNG', margin, margin, imgW, imgH, undefined, undefined, srcY)
        pdf.setFontSize(7)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Página ${i + 1} de ${totalPages} · CrepaldiDH ERP`, margin, ph - 4)
      }
      pdf.save(`relatorio-financeiro-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) { console.error('Export error:', err) }
  }

  const handleExportCsv = (type: 'receivable' | 'payable' | 'bank') => () => {
    const headers = type === 'receivable'
      ? ['Cliente', 'Serviço', 'Valor', 'Vencimento', 'Status']
      : type === 'payable'
      ? ['Fornecedor', 'Descrição', 'Valor', 'Vencimento', 'Status']
      : ['Data', 'Descrição', 'Valor', 'Tipo', 'Categoria', 'Conciliado']
    const data = type === 'receivable'
      ? fin.receivables.map(r => [r.companyName, r.serviceName, r.amount.toString(), r.dueDate, r.status])
      : type === 'payable'
      ? fin.payables.map(p => [p.supplier, p.description, p.amount.toString(), p.dueDate, p.status])
      : fin.bankTransactions.map(t => [t.date, t.description, t.amount.toString(), t.type, t.category || '', t.reconciled ? 'Sim' : 'Não'])
    const rows = [headers, ...data]
    const csv = rows.map(row => row.map(c => `"${c}"`).join(',')).join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${type}-${new Date().toISOString().split('T')[0]}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const handleImportCsv = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const text = await file.text()
      const lines = text.split('\n').filter(l => l.trim())
      lines.forEach(line => {
        const cols = line.split(',').map(c => c.replace(/"/g, '').trim())
        if (cols.length >= 4) {
          fin.addBankTransaction({
            date: cols[0] || new Date().toISOString().split('T')[0],
            description: cols[1] || 'Importado',
            amount: Math.abs(parseFloat(cols[2]?.replace('.', '').replace(',', '.') || '0')),
            type: (parseFloat(cols[2] || '0') >= 0 ? 'credit' : 'debit') as 'credit' | 'debit',
            category: cols[3] || '',
            matchedId: undefined,
            matchedType: undefined,
            reconciled: false,
          })
        }
      })
    }
    input.click()
  }

  const runAi = useCallback(async (fn: () => Promise<string>) => {
    setAiLoading(true); setAiResult('')
    try { const r = await fn(); setAiResult(r) }
    catch { setAiResult('Erro ao gerar resposta da IA.') }
    setAiLoading(false); setTab('ai')
  }, [])

  const handleDelRec = (id: string) => { if (confirm('Excluir esta conta a receber?')) fin.deleteReceivable(id) }
  const handleDelPay = (id: string) => { if (confirm('Excluir esta conta a pagar?')) fin.deletePayable(id) }

  const totalPaidMonth = fin.receivables
    .filter(r => r.status === 'paid' && new Date(r.paymentDate || '').getMonth() === new Date().getMonth())
    .reduce((acc, r) => acc + r.amount, 0)

  const maxChart = Math.max(...fin.revenueByClient.map(c => c.total), ...fin.revenueByService.map(s => s.total), 1)
  const maxBilling = Math.max(...fin.monthlyBilling.map(x => x.total), 1)
  const maxCf = Math.max(...cfData.map(d => Math.abs(d.cumulativeBalance)), 1)

  // ========== RENDER FUNCTIONS ==========

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Faturamento Mensal', v: fmt(totalPaidMonth), icon: DollarSign, g: 'from-emerald-500 to-teal-600' },
          { label: 'Receita Recebida', v: fmt(fin.totalReceived), icon: TrendingUp, g: 'from-green-500 to-emerald-600' },
          { label: 'A Receber', v: fmt(fin.totalPendingReceivable), icon: Clock, g: 'from-blue-500 to-indigo-600' },
          { label: 'A Pagar', v: fmt(fin.totalPendingPayable), icon: ArrowUpFromLine, g: 'from-amber-500 to-orange-600' },
          { label: 'Inadimplência', v: fmt(fin.totalOverdue), icon: AlertTriangle, g: 'from-red-500 to-rose-600' },
          { label: 'Lucro Estimado', v: fmt(fin.dre.netProfit), icon: TrendingUp, g: 'from-violet-500 to-purple-600' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl bg-gradient-to-br ${kpi.g} p-[1px] shadow-lg`}>
            <div className="bg-white rounded-[calc(1rem-1px)] p-4 h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${kpi.g} text-white`}><kpi.icon className="w-3.5 h-3.5" /></div>
              </div>
              <p className="text-sm font-black text-slate-800">{kpi.v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recharts Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Billing Bar Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Faturamento Mensal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={fin.monthlyBilling}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* DRE Pie Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Composição DRE</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                { name: 'Recebido', value: Math.max(fin.totalReceived, 0) },
                { name: 'Pendente', value: Math.max(fin.totalPendingReceivable, 0) },
                { name: 'Despesas', value: Math.max(fin.totalPaidPayable, 0) },
                { name: 'Impostos', value: Math.max(fin.dre.estimatedTaxes, 0) },
              ]} cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={3} dataKey="value">
                {['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'].map((c, i) => <Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {['Recebido', 'Pendente', 'Despesas', 'Impostos'].map((n, i) => (
              <div key={n} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ['#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][i] }} /><span className="text-[9px] text-slate-500">{n}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2"><Building2 className="w-4 h-4 text-violet-500" /> Receita por Cliente</h3>
          <div className="space-y-3">
            {fin.revenueByClient.slice(0, 5).map(item => (
              <div key={item.companyName}>
                <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700 truncate">{item.companyName}</span><span className="font-bold text-slate-800">{fmt(item.total)}</span></div>
                <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${(item.total / maxChart) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-emerald-500" /> Receita por Serviço</h3>
          <div className="space-y-3">
            {fin.revenueByService.slice(0, 5).map(item => (
              <div key={item.serviceName}>
                <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700 truncate">{item.serviceName}</span><span className="font-bold text-slate-800">{fmt(item.total)}</span></div>
                <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" style={{ width: `${(item.total / maxChart) * 100}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-500" /> Próximos Vencimentos</h3>
          <div className="space-y-2">
            {fin.upcomingDueDates.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Nenhum vencimento pendente</p> :
              fin.upcomingDueDates.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div><p className="text-[11px] font-bold text-slate-800">{r.companyName}</p><p className="text-[9px] text-slate-400">{r.serviceName}</p></div>
                  <div className="text-right"><p className="text-xs font-bold text-slate-800">{fmt(r.amount)}</p><p className={`text-[9px] ${late(r.dueDate) ? 'text-red-500' : 'text-slate-400'}`}>{sd(r.dueDate)}</p></div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Cash Flow Mini Chart */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-cyan-500" /> Projeção de Saldo (30 dias)</h3>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={fin.cashFlowProjection.slice(0, 30)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="dayLabel" interval={5} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Area type="monotone" dataKey="cumulativeBalance" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Advanced KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'MRR (Mensal)', v: fmt(fin.mrr), icon: TrendingUp, g: 'from-cyan-500 to-blue-600' },
          { label: 'ARR (Anual)', v: fmt(fin.arr), icon: TrendingUp, g: 'from-blue-500 to-indigo-600' },
          { label: 'Ticket Médio / Cliente', v: fmt(fin.ticketMedioCliente), icon: DollarSign, g: 'from-purple-500 to-violet-600' },
          { label: 'Ticket Médio / Serviço', v: fmt(fin.ticketMedioServico), icon: Receipt, g: 'from-pink-500 to-rose-600' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl bg-gradient-to-br ${kpi.g} p-[1px] shadow-lg`}>
            <div className="bg-white rounded-[calc(1rem-1px)] p-4 h-full">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[8px] font-bold text-slate-400 uppercase">{kpi.label}</span>
                <div className={`p-1 rounded-lg bg-gradient-to-br ${kpi.g} text-white`}><kpi.icon className="w-3 h-3" /></div>
              </div>
              <p className="text-sm font-black text-slate-800">{kpi.v}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Alerts Panel */}
      {fin.financialAlerts.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" /> Alertas Automáticos ({fin.financialAlerts.length})
          </h3>
          <div className="space-y-2">
            {fin.financialAlerts.slice(0, 5).map(a => {
              const severityColor = a.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-700' :
                a.severity === 'high' ? 'border-amber-200 bg-amber-50 text-amber-700' :
                'border-blue-200 bg-blue-50 text-blue-700'
              return (
                <div key={a.id} className={`flex items-start gap-3 p-3 rounded-xl border ${severityColor}`}>
                  <div className={`p-1 rounded-lg ${
                    a.severity === 'critical' ? 'bg-red-100 text-red-600' :
                    a.severity === 'high' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
                  }`}>
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-[11px] font-bold">{a.title}</p>
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold uppercase rounded-full border ${
                        a.severity === 'critical' ? 'border-red-200 bg-red-50 text-red-600' :
                        a.severity === 'high' ? 'border-amber-200 bg-amber-50 text-amber-600' : 'border-blue-200 bg-blue-50 text-blue-600'
                      }`}>{a.severity}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">{a.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Client Profitability */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-emerald-500" /> Clientes mais rentáveis
        </h3>
        <div className="space-y-3">
          {fin.clientesMaisRentaveis.slice(0, 5).map(c => (
            <div key={c.companyId}>
              <div className="flex justify-between items-center text-xs mb-1">
                <span className="font-bold text-slate-700">{c.companyName}</span>
                <span className="font-bold text-emerald-600">{fmt(c.totalRevenue)}</span>
              </div>
              <div className="flex gap-2 text-[9px] text-slate-400 mb-1">
                <span>{c.serviceCount} serviço(s)</span>
                <span>•</span>
                <span>{c.projectCount} projeto(s)</span>
                <span>•</span>
                <span className={c.margin >= 70 ? 'text-emerald-500' : c.margin >= 40 ? 'text-amber-500' : 'text-red-500'}>Margem: {c.margin}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5">
                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" style={{ width: `${(c.totalRevenue / maxChart) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderReceivables = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-56 bg-white" />
          </div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
            <option value="">Todos</option><option value="pending">A Receber</option><option value="paid">Recebido</option><option value="overdue">Atrasado</option><option value="canceled">Cancelado</option>
          </select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCsv('receivable')} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Download className="w-3.5 h-3.5" /> CSV</button>
          <button onClick={() => { setShowRecForm(true); setSearch(''); setStatusFilter('') }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md"><Plus className="w-3.5 h-3.5" /> Nova Conta</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Cliente</th>
              <th className="text-left py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Serviço</th>
              <th className="text-right py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Valor</th>
              <th className="text-center py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Vencimento</th>
              <th className="text-center py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Status</th>
              <th className="text-center py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Ações</th>
            </tr></thead>
            <tbody>
              {filteredRecs.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nenhuma conta encontrada</td></tr> :
                filteredRecs.map(r => {
                  const st = STATUS_REC[r.status]
                  return (
                    <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4"><p className="font-bold text-slate-800 text-[11px]">{r.companyName}</p>{r.contractName && <p className="text-[9px] text-slate-400">{r.contractName}</p>}</td>
                      <td className="py-3 px-4 text-slate-600">{r.serviceName}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{fmt(r.amount)}</td>
                      <td className="py-3 px-4 text-center"><span className={late(r.dueDate) && r.status !== 'paid' ? 'text-red-600 font-bold' : 'text-slate-600'}>{sd(r.dueDate)}</span></td>
                      <td className="py-3 px-4 text-center"><span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${st.color}`}>{st.label}</span></td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {(r.status === 'pending' || r.status === 'overdue') && <button onClick={() => setShowPayModal(r)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Receber"><DollarSign className="w-3.5 h-3.5" /></button>}
                          <button onClick={() => runAi(() => fin.suggestCollections(r.id))} className="p-1.5 rounded-lg hover:bg-violet-50 text-violet-600" title="Cobrança IA"><Brain className="w-3.5 h-3.5" /></button>
                          {r.invoiceFileUrl ? (
                            <button onClick={() => setViewInvoiceTarget({ type: 'receivable', id: r.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Ver NF"><Receipt className="w-3.5 h-3.5" /></button>
                          ) : (
                            <button onClick={() => { setInvoiceTarget({ type: 'receivable', id: r.id }); setInvoiceFileData(''); setInvoiceForm({ number: '', issuer: r.companyName, amount: r.amount, issueDate: r.dueDate }) }} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Upload NF"><Upload className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => handleDelRec(r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderPayables = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-wrap">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-56 bg-white" /></div>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"><option value="">Todos</option><option value="pending">A Pagar</option><option value="paid">Pago</option><option value="overdue">Vencido</option><option value="canceled">Cancelado</option></select>
        </div>
        <div className="flex gap-2">
          <button onClick={handleExportCsv('payable')} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Download className="w-3.5 h-3.5" /> CSV</button>
          <button onClick={() => { setShowPayForm(true); setSearch(''); setStatusFilter('') }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md"><Plus className="w-3.5 h-3.5" /> Nova Conta</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Fornecedor</th>
              <th className="text-left py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Descrição</th>
              <th className="text-right py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Valor</th>
              <th className="text-center py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Vencimento</th>
              <th className="text-center py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Status</th>
              <th className="text-center py-3 px-4 text-[9px] font-bold text-slate-400 uppercase">Ações</th>
            </tr></thead>
            <tbody>
              {filteredPays.length === 0 ? <tr><td colSpan={6} className="text-center py-12 text-slate-400">Nenhuma conta encontrada</td></tr> :
                filteredPays.map(p => {
                  const st = STATUS_PAY[p.status]
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-4"><p className="font-bold text-slate-800 text-[11px]">{p.supplier}</p>{p.categoryName && <p className="text-[9px] text-slate-400">{p.categoryName}</p>}</td>
                      <td className="py-3 px-4 text-slate-600">{p.description}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-800">{fmt(p.amount)}</td>
                      <td className="py-3 px-4 text-center"><span className={late(p.dueDate) && p.status !== 'paid' ? 'text-red-600 font-bold' : 'text-slate-600'}>{sd(p.dueDate)}</span></td>
                      <td className="py-3 px-4 text-center"><span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${st.color}`}>{st.label}</span></td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {p.status !== 'paid' && p.status !== 'canceled' && <button onClick={() => fin.markPayableAsPaid(p.id, new Date().toISOString().split('T')[0])} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Pagar"><CheckCircle className="w-3.5 h-3.5" /></button>}
                          {p.invoiceFileUrl ? (
                            <button onClick={() => setViewInvoiceTarget({ type: 'payable', id: p.id })} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Ver NF"><Receipt className="w-3.5 h-3.5" /></button>
                          ) : (
                            <button onClick={() => { setInvoiceTarget({ type: 'payable', id: p.id }); setInvoiceFileData(''); setInvoiceForm({ number: '', issuer: p.supplier, amount: p.amount, issueDate: p.dueDate }) }} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Upload NF"><Upload className="w-3.5 h-3.5" /></button>
                          )}
                          <button onClick={() => handleDelPay(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderRecurrence = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">{fin.recurringRules.filter(r => r.status === 'active').length} regras ativas • MRR: {fmt(fin.mrr)}</p>
        <button onClick={() => setShowRrForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold shadow-md"><Plus className="w-3.5 h-3.5" /> Nova Recorrência</button>
      </div>
      <div className="grid gap-3">
        {fin.recurringRules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm"><RepeatIcon className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-xs font-medium">Nenhuma regra cadastrada</p></div>
        ) : fin.recurringRules.map(rr => (
          <div key={rr.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm text-slate-800">{rr.contractName}</h3>
                  <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${rr.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : rr.status === 'paused' ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{rr.status === 'active' ? 'Ativo' : rr.status === 'paused' ? 'Pausado' : 'Cancelado'}</span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">{rr.companyName} • {rr.serviceName}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-slate-800">{fmt(rr.amount)}</p>
                <p className="text-[10px] text-slate-400 capitalize">{rr.frequency === 'monthly' ? 'Mensal' : rr.frequency === 'bimonthly' ? 'Bimestral' : rr.frequency === 'quarterly' ? 'Trimestral' : rr.frequency === 'semiannual' ? 'Semestral' : 'Anual'}</p>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-4 text-[10px] text-slate-500">
                <span>Próximo: {sd(rr.nextBillingDate)}</span>
                {rr.readjustmentRate > 0 && <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> Reajuste: {rr.readjustmentRate}%</span>}
              </div>
              <div className="flex gap-1">
                {rr.status === 'active' && <><button onClick={() => fin.updateRecurringRule(rr.id, { status: 'paused' })} className="px-2 py-1 text-[9px] font-bold border border-amber-200 text-amber-600 rounded-lg hover:bg-amber-50">Pausar</button><button onClick={() => fin.cancelRecurringRule(rr.id)} className="px-2 py-1 text-[9px] font-bold border border-red-200 text-red-500 rounded-lg hover:bg-red-50">Cancelar</button></>}
                {rr.status === 'paused' && <button onClick={() => fin.updateRecurringRule(rr.id, { status: 'active' })} className="px-2 py-1 text-[9px] font-bold border border-emerald-200 text-emerald-600 rounded-lg hover:bg-emerald-50">Reativar</button>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderDre = () => {
    const pd = dreFilteredData
    const lines = [
      { label: 'Receita Bruta', value: pd.grossRevenue, type: 'revenue' as const },
      { label: '(-) Despesas Operacionais', value: pd.operatingExpenses, type: 'expense' as const },
      { label: '(-) Impostos Estimados (11,5%)', value: pd.estimatedTaxes, type: 'tax' as const },
      { label: 'Lucro Líquido', value: pd.netProfit, type: 'result' as const, bold: true },
    ]
    return (
      <div className="space-y-4" ref={reportRef}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            {(['current', '3months', 'ytd', 'all'] as const).map(p => (
              <button key={p} onClick={() => setDrePeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${drePeriod === p ? 'bg-violet-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-200'}`}>
                {p === 'current' ? 'Mês Atual' : p === '3months' ? '3 Meses' : p === 'ytd' ? 'YTD' : 'Total'}
              </button>
            ))}
          </div>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Printer className="w-3.5 h-3.5" /> PDF</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Receitas', value: fmt(pd.grossRevenue), color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Despesas', value: fmt(pd.operatingExpenses), color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
            { label: 'Impostos', value: fmt(pd.estimatedTaxes), color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
            { label: 'Lucro Líquido', value: fmt(pd.netProfit), color: pd.netProfit >= 0 ? 'text-emerald-600' : 'text-red-600', bg: pd.netProfit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-red-50 border-red-100' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border p-4`}>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</p>
              <p className={`text-lg font-black ${s.color} mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Demonstração do Resultado do Exercício</h3>
          <div className="space-y-1">
            {lines.map(item => {
              const isNeg = item.type === 'expense' || item.type === 'tax' || (item.type === 'result' && pd.netProfit < 0)
              return (
                <div key={item.label} className={`flex justify-between items-center py-3 px-4 rounded-xl ${item.bold ? 'bg-slate-50 border border-slate-200 font-black' : 'border-b border-slate-50'}`}>
                  <span className={`text-sm ${item.bold ? 'font-black' : 'font-medium'} ${isNeg ? 'text-red-600' : 'text-slate-700'}`}>
                    <span className={`inline-block w-4 text-center mr-2 ${DRE_COLORS[item.type]}`}>{DRE_ICONS[item.type]}</span>
                    {item.label}
                  </span>
                  <span className={`text-sm font-black ${item.value >= 0 ? 'text-slate-800' : 'text-red-600'}`}>
                    {item.type === 'expense' || item.type === 'tax' ? `(${fmt(Math.abs(item.value))})` : fmt(item.value)}
                  </span>
                </div>
              )
            })}
          </div>
          <div className="mt-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-xl">
            <div className="flex justify-between items-center"><span className="text-sm font-black text-violet-800">Margem Líquida</span><span className={`text-lg font-black ${pd.profitMargin >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{pd.profitMargin}%</span></div>
            <div className="w-full bg-violet-100 rounded-full h-2 mt-2"><div className={`h-2 rounded-full ${pd.profitMargin >= 15 ? 'bg-emerald-500' : pd.profitMargin >= 0 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${Math.min(Math.abs(pd.profitMargin), 100)}%` }} /></div>
          </div>
        </div>

        {/* DRE Comparison Chart */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Receitas vs Despesas (Mensal)</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={fin.monthlyBilling.map(m => {
              const monthExpenses = fin.payables.filter(p => {
                const d = new Date(p.createdAt)
                const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
                return key === m.month
              }).reduce((a, p) => a + p.amount, 0)
              return { ...m, expenses: monthExpenses }
            })}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="total" name="Receitas" radius={[4, 4, 0, 0]} fill="#10b981" />
              <Bar dataKey="expenses" name="Despesas" radius={[4, 4, 0, 0]} fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  const renderCashFlow = () => {
    const latest = cfData.length > 0 ? cfData[cfData.length - 1].cumulativeBalance : 0
    const totalInflow = cfData.reduce((a, d) => a + d.inflow, 0)
    const totalOutflow = cfData.reduce((a, d) => a + d.outflow, 0)
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2">
            {(['30', '60', '90'] as const).map(p => (
              <button key={p} onClick={() => setCfPeriod(p)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${cfPeriod === p ? 'bg-cyan-600 text-white shadow-sm' : 'bg-white border border-slate-200 text-slate-600 hover:border-cyan-200'}`}>
                {p} Dias
              </button>
            ))}
          </div>
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Printer className="w-3.5 h-3.5" /> PDF</button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { label: 'Saldo Projetado', value: fmt(latest), color: latest >= 0 ? 'text-emerald-600' : 'text-red-600', bg: 'bg-cyan-50 border-cyan-100' },
            { label: 'Total Entradas', value: fmt(totalInflow), color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
            { label: 'Total Saídas', value: fmt(totalOutflow), color: 'text-red-600', bg: 'bg-red-50 border-red-100' },
            { label: 'Saldo Médio/Dia', value: fmt(Math.round(latest / Math.max(parseInt(cfPeriod), 1))), color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
          ].map(s => (
            <div key={s.label} className={`${s.bg} rounded-xl border p-4`}>
              <p className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</p>
              <p className={`text-lg font-black ${s.color} mt-1`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Projeção de Fluxo de Caixa</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={cfData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="dayLabel" interval={Math.max(1, Math.floor(parseInt(cfPeriod) / 15))} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} labelFormatter={(l) => `Dia ${l}`} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Area type="monotone" dataKey="inflow" name="Entradas" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.3} strokeWidth={1} />
              <Area type="monotone" dataKey="outflow" name="Saídas" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} strokeWidth={1} />
              <Line type="monotone" dataKey="cumulativeBalance" name="Saldo Acumulado" stroke="#06b6d4" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Daily detail table */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="text-xs font-bold text-slate-800">Detalhamento Diário</h3>
          </div>
          <div className="overflow-x-auto max-h-80 overflow-y-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50 sticky top-0">
                <th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Data</th>
                <th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Entradas</th>
                <th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Saídas</th>
                <th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Saldo Dia</th>
                <th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Acumulado</th>
              </tr></thead>
              <tbody>
                {cfData.map(d => (
                  <tr key={d.date} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-700">{sd(d.date)}</td>
                    <td className="py-2 px-3 text-right text-emerald-600 font-medium">{d.inflow > 0 ? fmt(d.inflow) : '-'}</td>
                    <td className="py-2 px-3 text-right text-red-600 font-medium">{d.outflow > 0 ? fmt(d.outflow) : '-'}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">{fmt(d.balance)}</td>
                    <td className={`py-2 px-3 text-right font-bold ${d.cumulativeBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{fmt(d.cumulativeBalance)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  const renderCollections = () => (
    <div className="space-y-4">
      <p className="text-xs text-slate-500">Gateways de pagamento — preparados para integração futura.</p>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[
          { name: 'PIX', icon: '⚡', desc: 'Cobrança instantânea via chave PIX.' },
          { name: 'Boleto Bancário', icon: '📄', desc: 'Emissão de boletos registrados.' },
          { name: 'Mercado Pago', icon: '🟡', desc: 'Link de pagamento via Mercado Pago.' },
          { name: 'Stripe', icon: '💳', desc: 'Pagamentos internacionais via cartão.' },
          { name: 'Asaas', icon: '🔵', desc: 'Gestão completa de cobranças Asaas.' },
        ].map(m => (
          <div key={m.name} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{m.icon}</span>
              <div><h3 className="font-bold text-sm text-slate-800">{m.name}</h3><span className="px-2 py-0.5 text-[8px] font-bold uppercase rounded-full border bg-amber-50 text-amber-700 border-amber-100">Em breve</span></div>
            </div>
            <p className="text-[11px] text-slate-500">{m.desc}</p>
          </div>
        ))}
      </div>
    </div>
  )

  const renderReports = () => {
    const reportTypes = [
      { id: 'revenue' as const, label: 'Receita por Período', icon: TrendingUp, color: 'emerald' },
      { id: 'overdue' as const, label: 'Inadimplência Detalhada', icon: AlertTriangle, color: 'red' },
      { id: 'recurrence' as const, label: 'Receita Recorrente', icon: Repeat, color: 'cyan' },
      { id: 'expenses' as const, label: 'Despesas por Categoria', icon: Receipt, color: 'amber' },
      { id: 'aging' as const, label: 'Aging de Recebíveis', icon: Clock, color: 'purple' },
    ]
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex gap-2 flex-wrap">
            {reportTypes.map(r => (
              <button key={r.id} onClick={() => { setReportType(r.id); setShowReportData(true) }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all ${reportType === r.id && showReportData ? `bg-${r.color}-600 text-white shadow-sm` : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-200'}`}>
                <r.icon className="w-3 h-3" /> {r.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowReportData(false)} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><RotateCw className="w-3.5 h-3.5" /> Visão Geral</button>
            <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Printer className="w-3.5 h-3.5" /> PDF</button>
          </div>
        </div>

        {!showReportData ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reportTypes.map(r => (
              <button key={r.id} onClick={() => { setReportType(r.id); setShowReportData(true) }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:shadow-md hover:border-violet-200 transition-all">
                <div className={`p-2.5 rounded-xl bg-${r.color}-50 text-${r.color}-600 w-fit mb-3`}><r.icon className="w-4 h-4" /></div>
                <h3 className="font-bold text-sm text-slate-800">{r.label}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{r.id === 'revenue' ? 'Faturamento por cliente, serviço e mês' : r.id === 'overdue' ? 'Clientes inadimplentes e valores vencidos' : r.id === 'recurrence' ? 'MRR, ARR e regras de recorrência' : r.id === 'expenses' ? 'Despesas agrupadas por categoria' : 'Distribuição de recebíveis por faixa de atraso'}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-500 mt-3">Visualizar <ChevronRight className="w-3 h-3" /></span>
              </button>
            ))}
            {[
              { name: 'Relatório Mensal Financeiro', desc: 'Faturamento, despesas e lucro do mês', icon: FileText, color: 'violet', action: () => runAi(() => fin.generateFinancialSummary()) },
              { name: 'Relatório Executivo', desc: 'Análise completa do período', icon: Building2, color: 'blue', action: () => runAi(fin.generateExecutiveReport) },
            ].map(r => (
              <button key={r.name} onClick={r.action} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 text-left hover:shadow-md hover:border-violet-200 transition-all">
                <div className={`p-2.5 rounded-xl bg-${r.color}-50 text-${r.color}-600 w-fit mb-3`}><r.icon className="w-4 h-4" /></div>
                <h3 className="font-bold text-sm text-slate-800">{r.name}</h3>
                <p className="text-[10px] text-slate-400 mt-1">{r.desc}</p>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-violet-500 mt-3">Gerar com IA <ChevronRight className="w-3 h-3" /></span>
              </button>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5" ref={reportRef}>
            <h3 className="text-sm font-black text-slate-800 mb-4">
              {reportType === 'revenue' ? 'Receita por Período' : reportType === 'overdue' ? 'Inadimplência Detalhada' : reportType === 'recurrence' ? 'Receita Recorrente' : reportType === 'expenses' ? 'Despesas por Categoria' : 'Aging de Recebíveis'}
            </h3>

            {reportType === 'revenue' && (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={fin.monthlyBilling}>
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#10b981" />
                  </BarChart>
                </ResponsiveContainer>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100"><th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Mês</th><th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Receita</th></tr></thead>
                  <tbody>{fin.monthlyBilling.map(m => <tr key={m.month} className="border-b border-slate-50"><td className="py-2 px-3 font-medium">{m.month}</td><td className="py-2 px-3 text-right font-bold">{fmt(m.total)}</td></tr>)}</tbody>
                </table>
              </div>
            )}

            {reportType === 'overdue' && (
              <div className="space-y-3">
                {fin.receivables.filter(r => r.status === 'overdue').length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-8">Nenhuma conta vencida</p>
                ) : (
                  fin.receivables.filter(r => r.status === 'overdue').map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl border border-red-100">
                      <div><p className="text-xs font-bold text-slate-800">{r.companyName}</p><p className="text-[10px] text-slate-500">{r.serviceName} • Venceu em {sd(r.dueDate)}</p></div>
                      <p className="text-sm font-black text-red-600">{fmt(r.amount)}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {reportType === 'recurrence' && (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-cyan-50 rounded-xl p-4 border border-cyan-100"><p className="text-[9px] font-bold text-slate-400 uppercase">MRR</p><p className="text-lg font-black text-cyan-700">{fmt(fin.mrr)}</p></div>
                  <div className="bg-blue-50 rounded-xl p-4 border border-blue-100"><p className="text-[9px] font-bold text-slate-400 uppercase">ARR</p><p className="text-lg font-black text-blue-700">{fmt(fin.arr)}</p></div>
                  <div className="bg-violet-50 rounded-xl p-4 border border-violet-100"><p className="text-[9px] font-bold text-slate-400 uppercase">Regras Ativas</p><p className="text-lg font-black text-violet-700">{fin.recurringRules.filter(r => r.status === 'active').length}</p></div>
                </div>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100"><th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Contrato</th><th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Frequência</th><th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Valor</th><th className="text-center py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Status</th></tr></thead>
                  <tbody>{fin.recurringRules.filter(r => r.status === 'active').map(rr => (
                    <tr key={rr.id} className="border-b border-slate-50">
                      <td className="py-2 px-3 font-medium">{rr.contractName}</td>
                      <td className="py-2 px-3 text-slate-500 capitalize">{rr.frequency}</td>
                      <td className="py-2 px-3 text-right font-bold">{fmt(rr.amount)}</td>
                      <td className="py-2 px-3 text-center"><span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">Ativo</span></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {reportType === 'expenses' && (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={fin.expensesByCategory} cx="50%" cy="50%" outerRadius={80} dataKey="total" nameKey="category" label={({ payload }) => `${payload.category} ${payload.percentage}%`} labelLine={true}>
                      {fin.expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100"><th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Categoria</th><th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Valor</th><th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">%</th></tr></thead>
                  <tbody>{fin.expensesByCategory.map(e => (
                    <tr key={e.category} className="border-b border-slate-50">
                      <td className="py-2 px-3 font-medium">{e.category}</td>
                      <td className="py-2 px-3 text-right font-bold">{fmt(e.total)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{e.percentage}%</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}

            {reportType === 'aging' && (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={fin.receivablesAging} layout="vertical">
                    <XAxis type="number" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v: unknown) => fmt(Number(v ?? 0))} />
                    <YAxis type="category" dataKey="bucket" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, fontSize: 12 }} />
                    <Bar dataKey="total" radius={[0, 6, 6, 0]} fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100"><th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Faixa</th><th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Valor</th><th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Qtd</th></tr></thead>
                  <tbody>{fin.receivablesAging.map(a => (
                    <tr key={a.bucket} className="border-b border-slate-50">
                      <td className="py-2 px-3 font-medium">{a.bucket}</td>
                      <td className="py-2 px-3 text-right font-bold">{fmt(a.total)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{a.count}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  const renderReconciliation = () => (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={btSearch} onChange={e => setBtSearch(e.target.value)} placeholder="Buscar transação..." className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-56 bg-white" />
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={handleImportCsv} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Upload className="w-3.5 h-3.5" /> Importar CSV</button>
          <button onClick={() => setShowBtForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md"><Plus className="w-3.5 h-3.5" /> Nova Transação</button>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Total Transações', value: fin.bankTransactions.length, color: 'text-slate-800', bg: 'bg-slate-50 border-slate-200' },
          { label: 'Conciliadas', value: fin.bankTransactions.filter(t => t.reconciled).length, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
          { label: 'Pendentes', value: fin.bankTransactions.filter(t => !t.reconciled).length, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
          { label: 'Valor Total', value: fmt(fin.bankTransactions.reduce((a, t) => a + (t.type === 'credit' ? t.amount : -t.amount), 0)), color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-xl border p-4`}>
            <p className="text-[9px] font-bold text-slate-400 uppercase">{s.label}</p>
            <p className={`text-lg font-black ${s.color} mt-1`}>{typeof s.value === 'number' ? s.value : s.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto max-h-96 overflow-y-auto">
          {fin.bankTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <Landmark className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="text-xs font-medium">Nenhuma transação bancária</p>
              <p className="text-[10px] text-slate-400 mt-1">Importe um arquivo CSV do extrato bancário ou adicione manualmente</p>
            </div>
          ) : (
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50 sticky top-0">
                <th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Data</th>
                <th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Descrição</th>
                <th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Valor</th>
                <th className="text-center py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Tipo</th>
                <th className="text-center py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Categoria</th>
                <th className="text-center py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Status</th>
                <th className="text-center py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Ações</th>
              </tr></thead>
              <tbody>
                {filteredBt.map(t => (
                  <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                    <td className="py-2 px-3 font-medium text-slate-700">{sd(t.date)}</td>
                    <td className="py-2 px-3 text-slate-600 max-w-[200px] truncate">{t.description}</td>
                    <td className={`py-2 px-3 text-right font-bold ${t.type === 'credit' ? 'text-emerald-600' : 'text-red-600'}`}>{t.type === 'credit' ? '+' : '-'}{fmt(t.amount)}</td>
                    <td className="py-2 px-3 text-center"><span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${t.type === 'credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>{t.type === 'credit' ? 'Entrada' : 'Saída'}</span></td>
                    <td className="py-2 px-3 text-center text-slate-500">{t.category || '-'}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full border ${t.reconciled ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{t.reconciled ? 'Conciliado' : 'Pendente'}</span>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {!t.reconciled && (
                          <>
                            <button onClick={() => {
                              const match = window.prompt('ID da conta a receber/pagar para vincular:')
                              if (match) fin.matchBankTransaction(t.id, match, 'receivable')
                            }} className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600" title="Vincular"><ArrowLeftRight className="w-3.5 h-3.5" /></button>
                            <button onClick={() => fin.reconcileBankTransaction(t.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-emerald-600" title="Conciliar"><CheckCircle className="w-3.5 h-3.5" /></button>
                          </>
                        )}
                        {t.reconciled && <button onClick={() => fin.reconcileBankTransaction(t.id)} className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600" title="Desfazer"><RotateCw className="w-3.5 h-3.5" /></button>}
                        <button onClick={() => fin.deleteBankTransaction(t.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )

  const renderAi = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Resumir Financeiro', icon: FileText, color: 'violet', fn: () => fin.generateFinancialSummary() },
          { label: 'Identificar Inadimplentes', icon: AlertTriangle, color: 'red', fn: () => fin.identifyOverdueClients() },
          { label: 'Previsão de Caixa', icon: TrendingUp, color: 'blue', fn: () => fin.generateCashFlowForecast() },
          { label: 'Relatório Executivo', icon: BarChart3, color: 'emerald', fn: () => fin.generateExecutiveReport() },
        ].map(a => (
          <button key={a.label} onClick={() => runAi(a.fn)} disabled={aiLoading}
            className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 text-center hover:shadow-md hover:border-violet-200 transition-all disabled:opacity-50">
            <div className={`p-2.5 rounded-xl bg-${a.color}-50 text-${a.color}-600 w-fit mx-auto mb-2`}><a.icon className="w-4 h-4" /></div>
            <p className="text-[10px] font-bold text-slate-700">{a.label}</p>
          </button>
        ))}
      </div>
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl min-h-[200px]">
        {aiLoading ? (
          <div className="flex items-center justify-center h-40"><Loader2 className="w-6 h-6 animate-spin text-violet-400" /><span className="ml-3 text-sm text-slate-300">Gerando resposta com IA...</span></div>
        ) : aiResult ? (
          <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap">
            {aiResult.split('\n').map((line, i) => <p key={i} className="text-sm leading-relaxed text-slate-200">{line}</p>)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-slate-500">
            <Brain className="w-10 h-10 mb-3 text-violet-400/50" />
            <p className="text-sm font-medium">Assistente Financeiro IA</p>
            <p className="text-xs text-slate-500 mt-1">Clique em uma ação acima para gerar insights</p>
          </div>
        )}
      </div>
    </div>
  )

  // ========== MODALS ==========

  const modalBtForm = showBtForm && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowBtForm(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div><h2 className="text-lg font-bold text-slate-800">Nova Transação Bancária</h2><p className="text-xs text-slate-500">Registre uma movimentação manual</p></div>
          <button onClick={() => setShowBtForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); fin.addBankTransaction({ ...btForm, date: btForm.date || new Date().toISOString().split('T')[0], matchedId: undefined, matchedType: undefined, reconciled: false }); setShowBtForm(false); setBtForm({ date: '', description: '', amount: 0, type: 'credit', category: '' }) }} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Data *</label><input required type="date" value={btForm.date} onChange={e => setBtForm({ ...btForm, date: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Tipo</label><select value={btForm.type} onChange={e => setBtForm({ ...btForm, type: e.target.value as 'credit' | 'debit' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"><option value="credit">Entrada (Crédito)</option><option value="debit">Saída (Débito)</option></select></div>
          </div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Descrição *</label><input required value={btForm.description} onChange={e => setBtForm({ ...btForm, description: e.target.value })} placeholder="Ex: Recebimento cliente X" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Valor (R$) *</label><input required type="number" step="0.01" min="0" value={btForm.amount} onChange={e => setBtForm({ ...btForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Categoria</label><input value={btForm.category} onChange={e => setBtForm({ ...btForm, category: e.target.value })} placeholder="Ex: Receita" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowBtForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md">Adicionar</button>
          </div>
        </form>
      </div>
    </div>
  )

  const modalRecForm = showRecForm && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRecForm(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div><h2 className="text-lg font-bold text-slate-800">Nova Conta a Receber</h2><p className="text-xs text-slate-500">Registre um recebimento previsto</p></div>
          <button onClick={() => setShowRecForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleCreateRec} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Cliente *</label>
              <select required value={recForm.companyId} onChange={e => setRecForm({ ...recForm, companyId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                <option value="">Selecione...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Contrato</label>
              <select value={recForm.contractId} onChange={e => setRecForm({ ...recForm, contractId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                <option value="">Sem contrato</option>{contracts.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
          </div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Serviço *</label><input required value={recForm.serviceName} onChange={e => setRecForm({ ...recForm, serviceName: e.target.value })} placeholder="Ex: Treinamento NR01" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Valor (R$) *</label><input required type="number" step="0.01" min="0" value={recForm.amount} onChange={e => setRecForm({ ...recForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Vencimento *</label><input required type="date" value={recForm.dueDate} onChange={e => setRecForm({ ...recForm, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          </div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Forma de Pagamento</label>
            <select value={recForm.paymentMethodId} onChange={e => setRecForm({ ...recForm, paymentMethodId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
              <option value="">Selecione...</option>{fin.paymentMethods.filter(p => p.active).map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Observações</label><textarea value={recForm.notes} onChange={e => setRecForm({ ...recForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" /></div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowRecForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md">Criar Conta</button>
          </div>
        </form>
      </div>
    </div>
  )

  const modalPayForm = showPayForm && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPayForm(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div><h2 className="text-lg font-bold text-slate-800">Nova Conta a Pagar</h2><p className="text-xs text-slate-500">Registre uma despesa a pagar</p></div>
          <button onClick={() => setShowPayForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleCreatePay} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Fornecedor *</label><input required value={payForm.supplier} onChange={e => setPayForm({ ...payForm, supplier: e.target.value })} placeholder="Nome do fornecedor" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Categoria</label>
              <select value={payForm.categoryId} onChange={e => setPayForm({ ...payForm, categoryId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"><option value="">Selecione...</option>{fin.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          </div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Descrição *</label><input required value={payForm.description} onChange={e => setPayForm({ ...payForm, description: e.target.value })} placeholder="Ex: Aluguel comercial" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Valor (R$) *</label><input required type="number" step="0.01" min="0" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Vencimento *</label><input required type="date" value={payForm.dueDate} onChange={e => setPayForm({ ...payForm, dueDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          </div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Observações</label><textarea value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" /></div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowPayForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md">Criar Conta</button>
          </div>
        </form>
      </div>
    </div>
  )

  const modalRrForm = showRrForm && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRrForm(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div><h2 className="text-lg font-bold text-slate-800">Nova Recorrência</h2><p className="text-xs text-slate-500">Configure faturamento recorrente</p></div>
          <button onClick={() => setShowRrForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleCreateRr} className="p-6 space-y-4">
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Contrato *</label>
            <select required value={rrForm.contractId} onChange={e => setRrForm({ ...rrForm, contractId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
              <option value="">Selecione...</option>{contracts.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.title}</option>)}</select></div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Serviço *</label><input required value={rrForm.serviceName} onChange={e => setRrForm({ ...rrForm, serviceName: e.target.value })} placeholder="Ex: Mentoria" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Frequência</label>
              <select value={rrForm.frequency} onChange={e => setRrForm({ ...rrForm, frequency: e.target.value as RecurringRule['frequency'] })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                <option value="monthly">Mensal</option><option value="bimonthly">Bimestral</option><option value="quarterly">Trimestral</option><option value="semiannual">Semestral</option><option value="annual">Anual</option></select></div>
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Valor (R$)</label><input required type="number" step="0.01" min="0" value={rrForm.amount} onChange={e => setRrForm({ ...rrForm, amount: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Próximo *</label><input required type="date" value={rrForm.nextBillingDate} onChange={e => setRrForm({ ...rrForm, nextBillingDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
            <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Reajuste (%)</label><input type="number" step="0.01" min="0" value={rrForm.readjustmentRate} onChange={e => setRrForm({ ...rrForm, readjustmentRate: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          </div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowRrForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold shadow-md">Criar Recorrência</button>
          </div>
        </form>
      </div>
    </div>
  )

  const modalPay = showPayModal && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPayModal(null)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100"><h2 className="text-lg font-bold text-slate-800">Confirmar Recebimento</h2></div>
        <div className="p-6 space-y-4">
          <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-100">
            <p className="text-xs text-slate-500">Cliente</p><p className="font-bold text-slate-800">{showPayModal.companyName}</p>
            <p className="text-xs text-slate-500 mt-2">Serviço</p><p className="font-bold text-slate-800">{showPayModal.serviceName}</p>
            <p className="text-xs text-slate-500 mt-2">Valor</p><p className="text-lg font-black text-emerald-600">{fmt(showPayModal.amount)}</p>
            <p className="text-xs text-slate-500 mt-2">Vencimento</p><p className="text-sm text-slate-700">{sd(showPayModal.dueDate)}</p>
          </div>
          <p className="text-xs text-slate-500">Registrado como pago na data de hoje.</p>
          <div className="flex gap-3">
            <button onClick={() => setShowPayModal(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
            <button onClick={handleMarkPaid} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2"><CheckCircle className="w-4 h-4" /> Confirmar</button>
          </div>
        </div>
      </div>
    </div>
  )

  // ========== INVOICE UPLOAD MODAL ==========
  const invoiceUploadModal = invoiceTarget && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setInvoiceTarget(null)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2"><Receipt className="w-4 h-4 text-amber-600" /> Upload de Nota Fiscal</h2>
          <button onClick={() => setInvoiceTarget(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {/* File upload area */}
          <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center hover:border-brand-teal transition-colors cursor-pointer"
            onClick={() => document.getElementById('nf-file-input')?.click()}>
            {invoiceFileData ? (
              <div className="space-y-2">
                <img src={invoiceFileData} alt="Preview NF" className="max-h-40 mx-auto rounded-lg border border-slate-200" />
                <p className="text-[10px] text-emerald-600 font-semibold">Imagem carregada. Clique para trocar.</p>
              </div>
            ) : (
              <div className="text-slate-400">
                <Upload className="w-8 h-8 mx-auto mb-2" />
                <p className="text-xs font-semibold">Clique para selecionar a imagem da NF</p>
                <p className="text-[10px] mt-1">Formatos: PNG, JPG, JPEG, PDF</p>
              </div>
            )}
          </div>
          <input id="nf-file-input" type="file" accept="image/*,.pdf" className="hidden" onChange={e => {
            const file = e.target.files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = (ev) => {
              const dataUrl = ev.target?.result as string
              setInvoiceFileData(dataUrl)
              setInvoiceForm(f => ({
                ...f,
                number: f.number || `NF-${String(Date.now()).slice(-8)}`,
                issueDate: f.issueDate || new Date().toISOString().split('T')[0],
              }))
            }
            reader.readAsDataURL(file)
          }} />

          {/* Extracted fields */}
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
            <h3 className="text-[9px] font-bold text-slate-500 uppercase mb-3 flex items-center gap-1"><Brain className="w-3 h-3" /> Dados Extraídos</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 block mb-1">Número da NF</label>
                  <input value={invoiceForm.number} onChange={e => setInvoiceForm(f => ({ ...f, number: e.target.value }))}
                    className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 bg-white" placeholder="NF-00000001" />
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 block mb-1">Data de Emissão</label>
                  <input type="date" value={invoiceForm.issueDate} onChange={e => setInvoiceForm(f => ({ ...f, issueDate: e.target.value }))}
                    className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 bg-white" />
                </div>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 block mb-1">Emitente (Razão Social / CNPJ)</label>
                <input value={invoiceForm.issuer} onChange={e => setInvoiceForm(f => ({ ...f, issuer: e.target.value }))}
                  className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 bg-white" placeholder="Nome do emitente" />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 block mb-1">Valor (R$)</label>
                <input type="number" value={invoiceForm.amount || ''} onChange={e => setInvoiceForm(f => ({ ...f, amount: Number(e.target.value) }))}
                  className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 bg-white" />
              </div>
            </div>
          </div>

          {!invoiceFileData && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
              <p className="text-[10px] text-amber-700 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Faça o upload da imagem da Nota Fiscal para visualização futura.</p>
            </div>
          )}
        </div>
        <div className="p-5 border-t border-slate-100 flex items-center gap-3 shrink-0">
          <button onClick={() => setInvoiceTarget(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
          <button onClick={() => {
            if (!invoiceTarget) return
            const ups = { invoiceFileUrl: invoiceFileData || undefined, invoiceNumber: invoiceForm.number || undefined, invoiceIssuer: invoiceForm.issuer || undefined }
            if (invoiceTarget.type === 'receivable') fin.updateReceivable(invoiceTarget.id, ups)
            else fin.updatePayable(invoiceTarget.id, ups)
            setInvoiceTarget(null)
          }} disabled={!invoiceFileData}
            className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 disabled:opacity-40">
            <CheckCircle className="w-4 h-4" /> Salvar NF
          </button>
        </div>
      </div>
    </div>
  )

  // ========== INVOICE VIEW MODAL ==========
  const invoiceViewModal = viewInvoiceTarget && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewInvoiceTarget(null)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-slate-100 flex items-center justify-between shrink-0">
          <h2 className="text-sm font-black text-slate-800 flex items-center gap-2"><Receipt className="w-4 h-4 text-blue-600" /> Nota Fiscal</h2>
          <button onClick={() => setViewInvoiceTarget(null)} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {(() => {
            const item = viewInvoiceTarget.type === 'receivable'
              ? fin.receivables.find(r => r.id === viewInvoiceTarget.id)
              : fin.payables.find(p => p.id === viewInvoiceTarget.id)
            if (!item?.invoiceFileUrl) return <p className="text-xs text-slate-400 text-center py-8">Nenhuma nota fiscal anexada.</p>
            return (
              <>
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <img src={item.invoiceFileUrl} alt="Nota Fiscal" className="w-full rounded-lg border border-slate-200" />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-semibold uppercase">Número</p>
                    <p className="font-bold text-slate-800 mt-0.5">{item.invoiceNumber || '—'}</p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] text-slate-400 font-semibold uppercase">Emitente</p>
                    <p className="font-bold text-slate-800 mt-0.5">{item.invoiceIssuer || '—'}</p>
                  </div>
                </div>
                <button onClick={() => {
                  const a = document.createElement('a')
                  a.href = item.invoiceFileUrl!
                  a.download = `nf_${item.invoiceNumber || 'documento'}.jpg`
                  a.click()
                }} className="w-full py-2.5 bg-brand-teal text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 hover:bg-brand-teal/90">
                  <Download className="w-4 h-4" /> Baixar Imagem da NF
                </button>
              </>
            )
          })()}
        </div>
        <div className="p-5 border-t border-slate-100 shrink-0">
          <button onClick={() => setViewInvoiceTarget(null)} className="w-full py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Fechar</button>
        </div>
      </div>
    </div>
  )

  // ========== MAIN RENDER ==========
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Módulo Financeiro</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestão de receitas, despesas, contratos e fluxo de caixa</p>
        </div>
        <div className="flex items-center gap-3">
          {fin.recurringRules.filter(r => r.status === 'active').length > 0 && (
            <span className="text-[10px] text-slate-400 flex items-center gap-1"><Repeat className="w-3 h-3" />{fin.recurringRules.filter(r => r.status === 'active').length} recorrências</span>
          )}
          <button onClick={handleExportPdf} className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl text-[10px] font-semibold text-slate-600 hover:bg-slate-50"><Printer className="w-3.5 h-3.5" /> PDF</button>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-1 pb-2 custom-scrollbar">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setSearch(''); setStatusFilter('') }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
              tab === t.id ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-100 hover:border-violet-200'
            }`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      <div>
        {tab === 'dashboard' && renderDashboard()}
        {tab === 'receivable' && renderReceivables()}
        {tab === 'payable' && renderPayables()}
        {tab === 'recurrence' && renderRecurrence()}
        {tab === 'dre' && renderDre()}
        {tab === 'cashflow' && renderCashFlow()}
        {tab === 'collections' && renderCollections()}
        {tab === 'reports' && renderReports()}
        {tab === 'reconciliation' && renderReconciliation()}
        {tab === 'ai' && renderAi()}
      </div>

      {modalRecForm}
      {modalPayForm}
      {modalRrForm}
      {modalPay}
      {modalBtForm}
      {invoiceUploadModal}
      {invoiceViewModal}
    </div>
  )
}
