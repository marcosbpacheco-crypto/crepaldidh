'use client'

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid } from 'recharts'
import { Building2, Receipt, Calendar, TrendingDown } from 'lucide-react'

const fmt = (v: number) => {
  if (v === 0) return 'R$ 0'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function sd(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') }
function late(dueDate: string): boolean { return new Date(dueDate + 'T23:59:59') < new Date() }

interface RevenueByClient { companyName: string; total: number }
interface RevenueByService { serviceName: string; total: number }
interface UpcomingDueDate { id: string; companyName: string; serviceName: string; amount: number; dueDate: string }

interface FinancialDashboardChartsProps {
  monthlyBilling: { month: string; total: number }[]
  totalReceived: number
  totalPendingReceivable: number
  totalPaidPayable: number
  estimatedTaxes: number
  cashFlowProjection: { dayLabel: string; cumulativeBalance: number }[]
  revenueByClient: RevenueByClient[]
  revenueByService: RevenueByService[]
  upcomingDueDates: UpcomingDueDate[]
}

export function FinancialDashboardCharts({
  monthlyBilling,
  totalReceived,
  totalPendingReceivable,
  totalPaidPayable,
  estimatedTaxes,
  cashFlowProjection,
  revenueByClient,
  revenueByService,
  upcomingDueDates,
}: FinancialDashboardChartsProps) {
  const maxChart = Math.max(...revenueByClient.map(i => i.total), 1)

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Faturamento Mensal</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={monthlyBilling}>
              <XAxis dataKey="month" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
              <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Composição DRE</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={[
                { name: 'Recebido', value: Math.max(totalReceived, 0) },
                { name: 'Pendente', value: Math.max(totalPendingReceivable, 0) },
                { name: 'Despesas', value: Math.max(totalPaidPayable, 0) },
                { name: 'Impostos', value: Math.max(estimatedTaxes, 0) },
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
            {revenueByClient.slice(0, 5).map(function(item) {
              return (
                <div key={item.companyName}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700 truncate">{item.companyName}</span><span className="font-bold text-slate-800">{fmt(item.total)}</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${(item.total / maxChart) * 100}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2"><Receipt className="w-4 h-4 text-emerald-500" /> Receita por Serviço</h3>
          <div className="space-y-3">
            {revenueByService.slice(0, 5).map(function(item) {
              return (
                <div key={item.serviceName}>
                  <div className="flex justify-between text-xs mb-1"><span className="font-medium text-slate-700 truncate">{item.serviceName}</span><span className="font-bold text-slate-800">{fmt(item.total)}</span></div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5"><div className="bg-gradient-to-r from-emerald-500 to-teal-500 h-1.5 rounded-full" style={{ width: `${(item.total / maxChart) * 100}%` }} /></div>
                </div>
              )
            })}
          </div>
        </div>
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-500" /> Próximos Vencimentos</h3>
          <div className="space-y-2">
            {upcomingDueDates.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-4">Nenhum vencimento pendente</p>
            ) : (
              upcomingDueDates.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div><p className="text-[11px] font-bold text-slate-800">{r.companyName}</p><p className="text-[9px] text-slate-400">{r.serviceName}</p></div>
                  <div className="text-right"><p className="text-xs font-bold text-slate-800">{fmt(r.amount)}</p><p className={`text-[9px] ${late(r.dueDate) ? 'text-red-500' : 'text-slate-400'}`}>{sd(r.dueDate)}</p></div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs font-bold text-slate-800 flex items-center gap-2"><TrendingDown className="w-4 h-4 text-cyan-500" /> Projeção de Saldo (30 dias)</h3>
        </div>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={cashFlowProjection.slice(0, 30)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="dayLabel" interval={5} tick={{ fontSize: 9 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={(v) => `R$${(v/1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: unknown) => fmt(Number(v ?? 0))} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 12 }} />
            <Area type="monotone" dataKey="cumulativeBalance" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.1} strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  )
}