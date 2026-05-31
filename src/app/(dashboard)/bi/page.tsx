'use client'

import React, { useState, useMemo, useEffect } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, ComposedChart,
} from 'recharts'
import { useBi, type BiTab } from './context/BiContext'
import {
  BarChart3, TrendingUp, Users, DollarSign, Briefcase, Activity, Brain,
  Shield, Heart, GraduationCap, Wallet, Download, FileText, Sparkles,
  AlertTriangle, ChevronDown, RefreshCw, LayoutDashboard, Filter, X,
  Printer, ShieldOff,
} from 'lucide-react'

const fmt = (v: number) => {
  if (v === 0) return 'R$ 0'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

const TABS: { key: BiTab; label: string; icon: React.ReactNode }[] = [
  { key: 'executive', label: 'Executivo', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'commercial', label: 'Comercial', icon: <TrendingUp className="w-4 h-4" /> },
  { key: 'operational', label: 'Operacional', icon: <Briefcase className="w-4 h-4" /> },
  { key: 'nr01', label: 'NR-01', icon: <Shield className="w-4 h-4" /> },
  { key: 'human', label: 'DH', icon: <Heart className="w-4 h-4" /> },
  { key: 'training', label: 'Treinamentos', icon: <GraduationCap className="w-4 h-4" /> },
  { key: 'financial', label: 'Financeiro', icon: <DollarSign className="w-4 h-4" /> },
]

const RESTRICTED_ROLES = ['viewer', 'commercial', 'consultant', 'finance']
const ROLE_RESTRICTIONS: Record<string, BiTab[]> = {
  viewer: ['executive'],
  commercial: ['executive', 'commercial'],
  consultant: ['executive', 'operational', 'nr01', 'human', 'training'],
  finance: ['executive', 'financial'],
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-100 p-5"><div className="h-3 w-20 bg-slate-100 rounded mb-3" /><div className="h-6 w-24 bg-slate-100 rounded" /></div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-slate-100 p-5"><div className="h-64 bg-slate-50 rounded-xl" /></div>
        <div className="bg-white rounded-2xl border border-slate-100 p-5"><div className="h-64 bg-slate-50 rounded-xl" /></div>
      </div>
    </div>
  )
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-12 text-center">
      <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
      <p className="text-sm font-medium text-slate-400">{message}</p>
      <p className="text-[10px] text-slate-300 mt-1">Os dados aparecerão conforme os módulos forem preenchidos.</p>
    </div>
  )
}

function COLORS(i: number) {
  return ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6', '#6366f1', '#f97316', '#06b6d4'][i % 10]
}

function KpiCard({ kpi }: { kpi: { label: string; value: string | number; trend?: string; suffix?: string } }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5 hover:shadow-md transition-shadow">
      <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
      <p className="text-lg sm:text-xl font-black text-slate-800 mt-1.5 truncate">
        {kpi.value}<span className="text-[10px] sm:text-xs font-semibold text-slate-400 ml-1">{kpi.suffix || ''}</span>
      </p>
      {kpi.trend && (
        <div className={`flex items-center gap-1 mt-1.5 sm:mt-2 text-[9px] sm:text-[10px] font-semibold ${kpi.trend === 'up' ? 'text-emerald-600' : kpi.trend === 'down' ? 'text-red-600' : 'text-slate-400'}`}>
          {kpi.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : kpi.trend === 'down' ? <TrendingUp className="w-3 h-3 rotate-180" /> : null}
          {kpi.trend === 'up' ? 'Alta' : kpi.trend === 'down' ? 'Queda' : 'Estável'}
        </div>
      )}
    </div>
  )
}

function ChartCard({ title, subtitle, children, onExport }: { title: string; subtitle?: string; children: React.ReactNode; onExport?: () => void }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
      <div className="flex items-center justify-between mb-3 sm:mb-4">
        <div className="min-w-0 flex-1">
          <h3 className="text-xs sm:text-sm font-black text-slate-800 truncate">{title}</h3>
          {subtitle && <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">{subtitle}</p>}
        </div>
        {onExport && (
          <button onClick={onExport} className="p-1.5 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-slate-600 transition-colors shrink-0" title="Exportar CSV">
            <Download className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
      <div className="h-48 sm:h-56 lg:h-64">{children}</div>
    </div>
  )
}

function DonutChart({ data }: { data: { name: string; value: number; color?: string }[] }) {
  const total = data.reduce((s, d) => s + d.value, 0)
  const isEmpty = data.length === 1 && data[0].value === 1 && data[0].color === '#e2e8f0'
  if (!total || isEmpty) return <div className="h-full flex items-center justify-center text-xs text-slate-400">Sem dados</div>
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
          {data.map((d, i) => <Cell key={i} fill={d.color || COLORS(i)} />)}
        </Pie>
        <Tooltip formatter={(v: unknown) => [Number(v ?? 0).toLocaleString('pt-BR'), '']} />
        <Legend wrapperStyle={{ fontSize: 9, paddingTop: 6 }} />
      </PieChart>
    </ResponsiveContainer>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload) return null
  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-xl p-2.5 sm:p-3 text-[10px] sm:text-xs">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {typeof p.value === 'number' ? fmt(p.value) : p.value}</p>
      ))}
    </div>
  )
}

function FilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-50 border border-violet-200 rounded-lg text-[10px] font-semibold text-violet-700">
      {label}
      <button onClick={onRemove} className="hover:bg-violet-100 rounded p-0.5"><X className="w-2.5 h-2.5" /></button>
    </span>
  )
}

export default function BiPage() {
  const bi = useBi()
  const [tab, setTab] = useState<BiTab>('executive')
  const [showSummary, setShowSummary] = useState(false)
  const [insightsExpanded, setInsightsExpanded] = useState(false)
  const [summary, setSummary] = useState('')
  const [timeLabel, setTimeLabel] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [showRoleWarning, setShowRoleWarning] = useState(false)

  const role = bi.currentRole

  useEffect(() => {
    setTimeLabel(new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }))
    setSummary(bi.generateExecutiveSummary())
  }, [bi])

  const allowedTabs = useMemo(() => {
    if (role === 'admin') return TABS
    const allowed = ROLE_RESTRICTIONS[role] || ['executive']
    return TABS.filter(t => allowed.includes(t.key))
  }, [role])

  useEffect(() => {
    if (!allowedTabs.find(t => t.key === tab)) {
      setTab(allowedTabs[0]?.key || 'executive')
    }
  }, [allowedTabs, tab])

  const activeFilters = useMemo(() => {
    const list: { label: string; onRemove: () => void }[] = []
    if (bi.filters.companyId) {
      const name = bi.filterOptions.companies.find(c => c.id === bi.filters.companyId)?.name
      if (name) list.push({ label: `Cliente: ${name.substring(0, 20)}`, onRemove: () => bi.setFilters({ companyId: '' }) })
    }
    if (bi.filters.projectId) {
      const name = bi.filterOptions.projects.find(p => p.id === bi.filters.projectId)?.name
      if (name) list.push({ label: `Projeto: ${name.substring(0, 20)}`, onRemove: () => bi.setFilters({ projectId: '' }) })
    }
    if (bi.filters.service) list.push({ label: `Serviço: ${bi.filters.service.substring(0, 20)}`, onRemove: () => bi.setFilters({ service: '' }) })
    if (bi.filters.responsible) list.push({ label: `Responsável: ${bi.filters.responsible.substring(0, 20)}`, onRemove: () => bi.setFilters({ responsible: '' }) })
    return list
  }, [bi])

  const renderKpis = (kpis: typeof bi.executiveKpis) => {
    if (!kpis.length) return <EmptyState message="Nenhum indicador disponível" />
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-2 sm:gap-3">
        {kpis.map((k, i) => <KpiCard key={i} kpi={k} />)}
      </div>
    )
  }

  const renderExecutive = () => (
    <div className="space-y-4 sm:space-y-6">
      {renderKpis(bi.executiveKpis)}
      {!bi.hasData ? <EmptyState message="Nenhum dado disponível para o dashboard executivo" /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Receita Mensal" subtitle={timeLabel} onExport={() => bi.exportToCsv(bi.revenueByMonth, 'receita-mensal')}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.revenueByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Mix de Serviços" subtitle="Distribuição da receita" onExport={() => bi.exportToCsv(bi.serviceMix, 'mix-servicos')}>
              <DonutChart data={bi.serviceMix} />
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Aquisição de Clientes" subtitle="Novos clientes ativos por mês">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={bi.clientAcquisition}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.15} />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )

  const renderCommercial = () => (
    <div className="space-y-4 sm:space-y-6">
      {renderKpis(bi.commercialKpis)}
      {!bi.hasData ? <EmptyState message="Nenhum dado comercial disponível" /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Funil Comercial" subtitle="Leads por estágio">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.pipelineData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9 }} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Receita por Consultor" onExport={() => bi.exportToCsv(bi.revenueByConsultant, 'receita-consultores')}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.revenueByConsultant}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          {bi.lostReasons.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              <ChartCard title="Motivos de Perda" subtitle="Principais razões">
                <DonutChart data={bi.lostReasons} />
              </ChartCard>
            </div>
          )}
        </>
      )}
    </div>
  )

  const renderOperational = () => (
    <div className="space-y-4 sm:space-y-6">
      {renderKpis(bi.operationalKpis)}
      {!bi.hasData ? <EmptyState message="Nenhum dado operacional disponível" /> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <ChartCard title="Projetos por Status">
            <DonutChart data={bi.projectsByStatus} />
          </ChartCard>
          <ChartCard title="Próximos Eventos" subtitle="Eventos nos próximos dias">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bi.upcomingMeetings}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
          <ChartCard title="Entregas por Mês" subtitle="Documentos produzidos" onExport={() => bi.exportToCsv(bi.deliveryByMonth, 'entregas-mes')}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={bi.deliveryByMonth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                <YAxis tick={{ fontSize: 9 }} />
                <Tooltip />
                <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>
      )}
    </div>
  )

  const renderNr01 = () => (
    <div className="space-y-4 sm:space-y-6">
      {renderKpis(bi.nr01Kpis)}
      {bi.nr01Kpis.every(k => k.value === 0 || k.value === '0') ? (
        <EmptyState message="Nenhum dado de NR-01 disponível. Cadastre riscos e diagnósticos no módulo CRM." />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          <ChartCard title="Riscos por Nível">
            <DonutChart data={bi.risksByLevel} />
          </ChartCard>
          <ChartCard title="Planos de Ação">
            <DonutChart data={bi.actionPlanProgress} />
          </ChartCard>
          <ChartCard title="Unidades com Riscos">
            <DonutChart data={bi.riskByCompany} />
          </ChartCard>
        </div>
      )}
    </div>
  )

  const renderHuman = () => (
    <div className="space-y-4 sm:space-y-6">
      {renderKpis(bi.humanKpis)}
      {bi.humanKpis.every(k => k.value === 0 || k.value === '0') ? <EmptyState message="Nenhum dado de DH disponível" /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Mentorias por Mês">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.mentoringByMonth}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Status dos PDIs">
              <DonutChart data={bi.pdiStatus} />
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Evolução por Competência" subtitle="Avaliações registradas">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.competencyEvolution}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )

  const renderTraining = () => (
    <div className="space-y-4 sm:space-y-6">
      {renderKpis(bi.trainingKpis)}
      {bi.trainingKpis.every(k => k.value === 0 || k.value === '0') ? <EmptyState message="Nenhum dado de treinamentos disponível" /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Eventos por Tipo">
              <DonutChart data={bi.eventsByType} />
            </ChartCard>
            <ChartCard title="NPS por Evento" subtitle="Pontuação 0-100">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.npsByEvent}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#ec4899" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="NPS por Evento (Detalhado)">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={bi.attendanceRate}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 8 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 9 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )

  const renderFinancial = () => (
    <div className="space-y-4 sm:space-y-6">
      {renderKpis(bi.financialKpis)}
      {bi.financialKpis.every(k => k.value === 0 || k.value === 'R$ 0' || k.value === '0') ? <EmptyState message="Nenhum dado financeiro disponível" /> : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Fluxo de Caixa (30 dias)" subtitle="Entradas vs Saídas" onExport={() => bi.exportToCsv(bi.cashFlowData, 'fluxo-caixa')}>
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={bi.cashFlowData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" tick={{ fontSize: 7 }} />
                  <YAxis tick={{ fontSize: 8 }} tickFormatter={v => fmt(v)} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Entradas" fill="#22c55e" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="secondary" name="Saídas" fill="#ef4444" radius={[2, 2, 0, 0]} />
                </ComposedChart>
              </ResponsiveContainer>
            </ChartCard>
            <ChartCard title="Receita por Cliente" onExport={() => bi.exportToCsv(bi.revenueByClient, 'receita-clientes')}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bi.revenueByClient} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 8 }} tickFormatter={v => fmt(v)} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 8 }} width={90} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            <ChartCard title="Saúde Financeira" subtitle="Recebido vs A Receber vs Vencido">
              <DonutChart data={bi.financialHealth} />
            </ChartCard>
          </div>
        </>
      )}
    </div>
  )

  if (bi.loading) {
    return (
      <div className="min-h-screen">
        <div className="mb-6"><h1 className="text-lg font-black text-slate-800 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-violet-600" />DASHBOARDS ESTRATÉGICOS</h1></div>
        <LoadingSkeleton />
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* ── Header ───────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-800 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-violet-600" />
            DASHBOARDS ESTRATÉGICOS
          </h1>
          <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5">Business Intelligence • {timeLabel}</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
          <button onClick={() => setShowFilters(!showFilters)}
            className={`px-2.5 py-1.5 text-[9px] sm:text-[10px] font-bold rounded-xl border transition-all flex items-center gap-1 ${showFilters ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'}`}>
            <Filter className="w-3 h-3" /> Filtros {activeFilters.length > 0 && `(${activeFilters.length})`}
          </button>
          <button onClick={() => { setShowSummary(!showSummary); setSummary(bi.generateExecutiveSummary()) }}
            className={`px-2.5 py-1.5 text-[9px] sm:text-[10px] font-bold rounded-xl border transition-all flex items-center gap-1 ${showSummary ? 'bg-violet-50 border-violet-200 text-violet-700' : 'bg-white border-slate-200 text-slate-600 hover:border-violet-200 hover:text-violet-600'}`}>
            <FileText className="w-3 h-3" /> Resumo
          </button>
          <button onClick={() => setInsightsExpanded(!insightsExpanded)}
            className={`px-2.5 py-1.5 text-[9px] sm:text-[10px] font-bold rounded-xl border transition-all flex items-center gap-1 ${insightsExpanded ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-200 text-slate-600 hover:border-amber-200 hover:text-amber-600'}`}>
            <Brain className="w-3 h-3" /> Insights
          </button>
          <button onClick={bi.exportToPdf}
            className="px-2.5 py-1.5 text-[9px] sm:text-[10px] font-bold rounded-xl border border-slate-200 bg-white text-slate-600 hover:border-slate-300 transition-all flex items-center gap-1">
            <Printer className="w-3 h-3" /> PDF
          </button>
        </div>
      </div>

      {/* ── Filters Panel ─────────────────────── */}
      {showFilters && (
        <div className="mb-4 sm:mb-6 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><Filter className="w-3.5 h-3.5" /> Filtros</h3>
            <button onClick={() => { bi.setFilters({ companyId: '', projectId: '', service: '', responsible: '' }) }} className="text-[10px] font-semibold text-violet-600 hover:text-violet-800">Limpar todos</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Cliente</label>
              <select value={bi.filters.companyId} onChange={e => bi.setFilters({ companyId: e.target.value })}
                className="w-full text-[10px] sm:text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                <option value="">Todos</option>
                {bi.filterOptions.companies.map(c => <option key={c.id} value={c.id}>{c.name.substring(0, 25)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Projeto</label>
              <select value={bi.filters.projectId} onChange={e => bi.setFilters({ projectId: e.target.value })}
                className="w-full text-[10px] sm:text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                <option value="">Todos</option>
                {bi.filterOptions.projects.map(p => <option key={p.id} value={p.id}>{p.name.substring(0, 25)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Serviço</label>
              <select value={bi.filters.service} onChange={e => bi.setFilters({ service: e.target.value })}
                className="w-full text-[10px] sm:text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                <option value="">Todos</option>
                {bi.filterOptions.services.map(s => <option key={s} value={s}>{s.substring(0, 25)}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Responsável</label>
              <select value={bi.filters.responsible} onChange={e => bi.setFilters({ responsible: e.target.value })}
                className="w-full text-[10px] sm:text-xs border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                <option value="">Todos</option>
                {bi.filterOptions.responsibles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-slate-100">
              {activeFilters.map((f, i) => <FilterBadge key={i} label={f.label} onRemove={f.onRemove} />)}
            </div>
          )}
        </div>
      )}

      {/* ── Role Warning ──────────────────────── */}
      {role !== 'admin' && RESTRICTED_ROLES.includes(role) && !showRoleWarning && (
        <div className="mb-4 bg-amber-50 border border-amber-100 rounded-xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldOff className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-[10px] text-amber-700">Perfil <strong>{role}</strong>: acesso limitado a {allowedTabs.map(t => t.label).join(', ')}.</p>
          </div>
          <button onClick={() => setShowRoleWarning(true)} className="text-amber-500 hover:text-amber-700"><X className="w-3 h-3" /></button>
        </div>
      )}

      {/* ── Tabs ─────────────────────────────── */}
      <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-6">
        {allowedTabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-2.5 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-[11px] font-bold rounded-xl border transition-all flex items-center gap-1 sm:gap-1.5 ${tab === t.key ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── Active Filter Notification ───────── */}
      {activeFilters.length > 0 && (
        <div className="mb-3 text-[10px] text-slate-400 flex items-center gap-1.5">
          <Filter className="w-3 h-3" /> Filtros ativos: {activeFilters.map(f => f.label).join(', ')}
        </div>
      )}

      {/* ── AI Summary ───────────────────────── */}
      {showSummary && (
        <div className="mb-4 sm:mb-6 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4 sm:p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-violet-600" />
            <h2 className="text-xs font-black text-violet-800">Resumo Executivo</h2>
          </div>
          <pre className="text-[10px] sm:text-[11px] text-slate-700 font-sans whitespace-pre-wrap leading-relaxed">{summary}</pre>
        </div>
      )}

      {/* ── AI Insights ──────────────────────── */}
      {insightsExpanded && (
        <div className="mb-4 sm:mb-6 space-y-3">
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs font-black text-amber-800">Insights Estratégicos</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
            {bi.insights.length === 0 && <p className="text-xs text-slate-400 col-span-full">Nenhum insight no momento.</p>}
            {bi.insights.map((ins, i) => (
              <div key={i} className={`rounded-xl border p-3 sm:p-3.5 shadow-sm ${ins.type === 'critical' ? 'bg-red-50 border-red-100' : ins.type === 'warning' ? 'bg-amber-50 border-amber-100' : ins.type === 'positive' ? 'bg-emerald-50 border-emerald-100' : 'bg-blue-50 border-blue-100'}`}>
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className={`w-3 h-3.5 ${ins.type === 'critical' ? 'text-red-600' : ins.type === 'warning' ? 'text-amber-600' : ins.type === 'positive' ? 'text-emerald-600' : 'text-blue-600'}`} />
                  <p className="text-[10px] sm:text-[11px] font-bold text-slate-800">{ins.title}</p>
                </div>
                <p className="text-[9px] sm:text-[10px] text-slate-600">{ins.description}</p>
              </div>
            ))}
            {bi.alerts.length > 0 && (
              <div className="col-span-full mt-1">
                <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Alertas do Sistema</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {bi.alerts.slice(0, 6).map((a, i) => (
                    <div key={i} className={`rounded-lg border p-2 sm:p-2.5 ${a.severity === 'critical' ? 'bg-red-50 border-red-100' : a.severity === 'high' ? 'bg-orange-50 border-orange-100' : 'bg-slate-50 border-slate-100'}`}>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${a.severity === 'critical' ? 'bg-red-500' : a.severity === 'high' ? 'bg-orange-500' : 'bg-slate-400'}`} />
                        <p className="text-[9px] sm:text-[10px] font-bold text-slate-700">{a.title}</p>
                      </div>
                      <p className="text-[8px] sm:text-[9px] text-slate-500 mt-0.5">{a.description.substring(0, 80)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Dashboard Content ────────────────── */}
      {!bi.hasData ? <EmptyState message="Nenhum dado disponível. Preencha os módulos do sistema para ver os indicadores." /> : (
        <>
          {tab === 'executive' && renderExecutive()}
          {tab === 'commercial' && renderCommercial()}
          {tab === 'operational' && renderOperational()}
          {tab === 'nr01' && renderNr01()}
          {tab === 'human' && renderHuman()}
          {tab === 'training' && renderTraining()}
          {tab === 'financial' && renderFinancial()}
        </>
      )}
    </div>
  )
}
