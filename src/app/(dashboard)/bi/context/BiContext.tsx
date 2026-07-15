'use client'

import React, { createContext, useContext, useMemo, useCallback, useState, useEffect } from 'react'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useFinancial } from '@/app/(dashboard)/financial/context/FinancialContext'
import { useCalendar } from '@/app/(dashboard)/calendar/context/CalendarContext'
import { useDocuments } from '@/app/(dashboard)/documents/context/DocumentContext'
import { useTrainings } from '@/app/(dashboard)/trainings/context/TrainingsContext'
import { useMentoring } from '@/app/(dashboard)/mentoring/context/MentoringContext'

export type BiPeriod = 'month' | 'quarter' | 'semester' | 'year'
export type BiTab = 'executive' | 'commercial' | 'operational' | 'nr01' | 'human' | 'training' | 'financial'

export interface BiKpi {
  label: string
  value: string | number
  suffix?: string
  trend?: 'up' | 'down' | 'stable'
  color?: string
}

export interface BiChartData {
  name: string
  value: number
  secondary?: number
  color?: string
}

export interface BiInsight {
  type: 'positive' | 'warning' | 'critical' | 'info'
  title: string
  description: string
}

export interface BiAlert {
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  module: string
}

export interface BiFilters {
  companyId: string
  projectId: string
  service: string
  responsible: string
}

interface BiContextType {
  loading: boolean
  period: BiPeriod
  setPeriod: (p: BiPeriod) => void
  filters: BiFilters
  setFilters: (f: Partial<BiFilters>) => void
  filterOptions: { companies: { id: string; name: string }[]; projects: { id: string; name: string }[]; services: string[]; responsibles: string[] }
  currentRole: string

  executiveKpis: BiKpi[]
  revenueByMonth: BiChartData[]
  serviceMix: BiChartData[]
  clientAcquisition: BiChartData[]

  commercialKpis: BiKpi[]
  pipelineData: BiChartData[]
  revenueByConsultant: BiChartData[]
  lostReasons: BiChartData[]

  operationalKpis: BiKpi[]
  projectsByStatus: BiChartData[]
  upcomingMeetings: BiChartData[]
  deliveryByMonth: BiChartData[]

  nr01Kpis: BiKpi[]
  risksByLevel: BiChartData[]
  riskByCompany: BiChartData[]
  actionPlanProgress: BiChartData[]

  humanKpis: BiKpi[]
  mentoringByMonth: BiChartData[]
  competencyEvolution: BiChartData[]
  pdiStatus: BiChartData[]

  trainingKpis: BiKpi[]
  eventsByType: BiChartData[]
  attendanceRate: BiChartData[]
  npsByEvent: BiChartData[]

  financialKpis: BiKpi[]
  cashFlowData: BiChartData[]
  revenueByClient: BiChartData[]
  financialHealth: BiChartData[]

  insights: BiInsight[]
  alerts: BiAlert[]
  generateExecutiveSummary: () => string
  exportToCsv: (data: BiChartData[], filename: string) => void
  exportToPdf: () => void
  hasData: boolean
}

const BiContext = createContext<BiContextType | undefined>(undefined)

function fmt(v: number): string {
  if (v === 0) return 'R$ 0'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function pct(a: number, b: number): string {
  if (!b) return '0%'
  return ((a / b) * 100).toFixed(1) + '%'
}

function countBy<T>(items: T[], keyFn: (item: T) => string): Record<string, number> {
  const acc: Record<string, number> = {}
  for (const item of items) {
    const k = keyFn(item)
    acc[k] = (acc[k] || 0) + 1
  }
  return acc
}

function hasValues(data: BiChartData[]): boolean {
  return data.some(d => d.value > 0)
}

export function BiProvider({ children }: { children: React.ReactNode }) {
  const [period, setPeriod] = useState<BiPeriod>('month')
  const [filters, setFiltersState] = useState<BiFilters>({ companyId: '', projectId: '', service: '', responsible: '' })
  const [loading, setLoading] = useState(true)

  const crm = useCrm()
  const fin = useFinancial()
  const cal = useCalendar()
  const doc = useDocuments()
  const trn = useTrainings()
  const men = useMentoring()

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 300)
    return () => clearTimeout(timer)
  }, [])

  const setFilters = useCallback((f: Partial<BiFilters>) => {
    setFiltersState(prev => ({ ...prev, ...f }))
  }, [])

  const filterOptions = useMemo(() => ({
    companies: crm.companies.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.tradeName || c.name })),
    projects: crm.contracts.filter(c => c.status === 'active').map(c => ({ id: c.id, name: c.title })),
    services: [...new Set([...fin.revenueByService.map(s => s.serviceName), ...crm.services])],
    responsibles: [...new Set([...crm.sellers.map(s => s.name), ...trn.events.map(e => e.facilitator)])],
  }), [crm.companies, crm.contracts, crm.services, crm.sellers, fin.revenueByService, trn.events])

  const filterMatch = useCallback((companyId?: string, projectId?: string): boolean => {
    if (filters.companyId && companyId !== filters.companyId) return false
    if (filters.projectId && projectId !== filters.projectId) return false
    return true
  }, [filters])

  const filterMatchService = useCallback((service: string): boolean => {
    if (filters.service && !service.toLowerCase().includes(filters.service.toLowerCase())) return false
    return true
  }, [filters])

  const filterMatchResponsible = useCallback((responsible: string): boolean => {
    if (filters.responsible && !responsible.toLowerCase().includes(filters.responsible.toLowerCase())) return false
    return true
  }, [filters])

  // ── EXECUTIVE ──────────────────────────────────
  const executiveKpis: BiKpi[] = useMemo(() => {
    const activeCompanies = crm.companies.filter(c => c.status === 'active')
    const activeContracts = crm.contracts.filter(c => c.status === 'active' && filterMatch(c.companyId, c.id))
    const filteredEvents = trn.events.filter(e => e.status === 'realizado' || e.status === 'concluido')
    const filteredHours = filteredEvents.reduce((s, e) => s + e.hoursDuration, 0)
    const renewals = crm.contracts.filter(c => c.status === 'active' && new Date(c.endDate) > new Date() && (new Date(c.endDate).getTime() - Date.now()) < 7776000000 && filterMatch(c.companyId))
    const expiring = crm.contracts.filter(c => c.status === 'active' && new Date(c.endDate) < new Date() && filterMatch(c.companyId))
    return [
      { label: 'Clientes Ativos', value: activeCompanies.length, trend: activeCompanies.length > 3 ? 'up' : 'stable', color: 'from-violet-500 to-purple-600' },
      { label: 'Receita Mensal (MRR)', value: fmt(fin.mrr), trend: 'up', color: 'from-emerald-500 to-green-600' },
      { label: 'Receita Anual (ARR)', value: fmt(fin.arr), trend: 'up', color: 'from-blue-500 to-cyan-600' },
      { label: 'Projetos Ativos', value: activeContracts.length, trend: activeContracts.length > 0 ? 'up' : 'stable', color: 'from-amber-500 to-orange-600' },
      { label: 'Projetos Concluídos', value: crm.contracts.filter(c => (c.status === 'expired' || c.status === 'terminated') && filterMatch(c.companyId)).length, color: 'from-emerald-500 to-teal-600' },
      { label: 'Diagnósticos Ativos', value: crm.diagnostics.filter(d => filterMatch(d.companyId)).length, color: 'from-sky-500 to-indigo-600' },
      { label: 'Treinamentos Realizados', value: trn.completedEvents, trend: 'up', color: 'from-pink-500 to-rose-600' },
      { label: 'Horas de Consultoria', value: filteredHours, suffix: 'h', color: 'from-fuchsia-500 to-purple-600' },
      { label: 'NPS', value: Math.round(trn.averageNps).toString(), suffix: '/100', trend: trn.averageNps >= 75 ? 'up' : 'stable', color: 'from-indigo-500 to-violet-600' },
      { label: 'Contratos em Renovação', value: renewals.length, color: 'from-yellow-500 to-amber-600' },
      { label: 'Contratos a Vencer', value: expiring.length, trend: expiring.length > 0 ? 'down' : 'stable', color: 'from-red-500 to-rose-600' },
    ]
  }, [crm, fin, trn, filters, filterMatch])

  const revenueByMonth: BiChartData[] = useMemo(() =>
    fin.monthlyBilling.map(m => ({ name: m.month, value: m.total, color: '#8b5cf6' })),
    [fin.monthlyBilling]
  )

  const serviceMix: BiChartData[] = useMemo(
    () => fin.revenueByService.filter(s => filterMatchService(s.serviceName)).map(s => ({ name: s.serviceName, value: s.total, color: '#10b981' })),
    [fin.revenueByService, filterMatchService]
  )

  const clientAcquisition: BiChartData[] = useMemo(() => {
    const active = crm.companies.filter(c => c.status === 'active')
    const byMonth = countBy(active, c => new Date(c.createdAt).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }))
    return Object.entries(byMonth).map(([k, v]) => ({ name: k, value: v, color: '#6366f1' }))
  }, [crm.companies])

  // ── COMMERCIAL ─────────────────────────────────
  const commercialKpis: BiKpi[] = useMemo(() => {
    const filteredDeals = crm.deals.filter(d => filterMatch(d.companyId))
    const totalDeals = filteredDeals.length
    const won = filteredDeals.filter(d => d.stage === 'Cliente ativo' || d.stage === 'Contrato aprovado' || d.stage === 'Implantação').length
    const conversion = totalDeals ? (won / totalDeals) * 100 : 0
    const totalPipelineValue = filteredDeals.reduce((s, d) => s + d.value, 0)
    return [
      { label: 'Leads Ativos', value: filteredDeals.filter(d => !['Cliente perdido', 'Cliente ativo'].includes(d.stage)).length, color: 'from-blue-500 to-indigo-600' },
      { label: 'Taxa de Conversão', value: conversion.toFixed(1), suffix: '%', trend: conversion > 25 ? 'up' : 'stable', color: 'from-emerald-500 to-green-600' },
      { label: 'Receita por Serviço', value: fmt(filteredDeals.filter(d => d.stage !== 'Cliente perdido').reduce((s, d) => s + d.value, 0)), color: 'from-violet-500 to-purple-600' },
      { label: 'Ticket Médio', value: fmt(totalDeals ? filteredDeals.reduce((s, d) => s + d.value, 0) / totalDeals : 0), color: 'from-amber-500 to-orange-600' },
      { label: 'Pipeline Total', value: fmt(totalPipelineValue), color: 'from-cyan-500 to-teal-600' },
    ]
  }, [crm.deals, filterMatch])

  const pipelineData: BiChartData[] = useMemo(() => {
    const stages = ['Lead novo', 'Primeiro contato', 'Reunião agendada', 'Diagnóstico realizado', 'Proposta enviada', 'Negociação', 'Contrato aprovado', 'Implantação', 'Cliente ativo']
    const filtered = crm.deals.filter(d => filterMatch(d.companyId))
    const counts = countBy(filtered, d => d.stage)
    return stages.map(s => ({ name: s.substring(0, 10), value: counts[s] || 0 }))
  }, [crm.deals, filterMatch])

  const revenueByConsultant: BiChartData[] = useMemo(() => {
    const filtered = fin.revenueByConsultant.filter(c => filterMatchResponsible(c.consultantName))
    return filtered.map(c => ({ name: c.consultantName, value: c.totalRevenue }))
  }, [fin.revenueByConsultant, filterMatchResponsible])

  const lostReasons: BiChartData[] = useMemo(() => {
    const filtered = crm.deals.filter(d => d.lostReason && filterMatch(d.companyId))
    const reasons = countBy(filtered, d => d.lostReason!)
    return Object.entries(reasons).map(([k, v]) => ({ name: k, value: v }))
  }, [crm.deals, filterMatch])

  // ── OPERATIONAL ────────────────────────────────
  const operationalKpis: BiKpi[] = useMemo(() => {
    const filteredContracts = crm.contracts.filter(c => filterMatch(c.companyId))
    const activeNow = filteredContracts.filter(c => c.status === 'active')
    const overdue = activeNow.filter(c => new Date(c.endDate) < new Date())
    const filteredTrainings = trn.events.filter(e => filterMatch(e.companyId) && filterMatchResponsible(e.facilitator))
    const eventsThisMonth = cal.events.filter(e => new Date(e.eventDate).getMonth() === new Date().getMonth()).length
    return [
      { label: 'Projetos em Andamento', value: activeNow.length, color: 'from-blue-500 to-indigo-600' },
      { label: 'Projetos Atrasados', value: overdue.length, trend: overdue.length > 0 ? 'down' : 'stable', color: 'from-red-500 to-rose-600' },
      { label: 'Horas Previstas', value: filteredTrainings.reduce((s, e) => s + e.hoursDuration, 0), suffix: 'h', color: 'from-cyan-500 to-teal-600' },
      { label: 'Horas Realizadas', value: filteredTrainings.filter(e => e.status === 'realizado' || e.status === 'concluido').reduce((s, e) => s + e.hoursDuration, 0), suffix: 'h', color: 'from-emerald-500 to-green-600' },
      { label: 'Eventos Este Mês', value: eventsThisMonth, color: 'from-violet-500 to-purple-600' },
    ]
  }, [crm.contracts, trn, cal, filters, filterMatch, filterMatchResponsible])

  const projectsByStatus: BiChartData[] = useMemo(() => {
    const filtered = crm.contracts.filter(c => filterMatch(c.companyId))
    const st = countBy(filtered, c => c.status)
    const labelMap: Record<string, string> = { active: 'Ativo', expired: 'Expirado', terminated: 'Encerrado', draft: 'Rascunho' }
    return Object.entries(st).map(([k, v]) => ({ name: labelMap[k] || k, value: v }))
  }, [crm.contracts, filterMatch])

  const upcomingMeetings: BiChartData[] = useMemo(() => {
    const upcoming = cal.events.filter(e => new Date(e.eventDate) >= new Date()).sort((a, b) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime())
    const byDay = countBy(upcoming, e => new Date(e.eventDate).toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }))
    return Object.entries(byDay).slice(0, 14).map(([k, v]) => ({ name: k, value: v, color: '#8b5cf6' }))
  }, [cal.events])

  const deliveryByMonth: BiChartData[] = useMemo(() => {
    const filtered = doc.documents.filter(d => d.status !== 'archived')
    const byMonth = countBy(filtered, d => new Date(d.createdAt).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }))
    return Object.entries(byMonth).map(([k, v]) => ({ name: k, value: v, color: '#f59e0b' }))
  }, [doc.documents])

  // ── NR01 ──────────────────────────────────────
  const nr01Kpis: BiKpi[] = useMemo(() => {
    const totalRisks = crm.risks.length
    const criticalRisks = crm.risks.filter(r => r.level === 'high').length
    const completedPlans = crm.actionPlans.filter(a => a.status === 'completed').length
    const totalPlans = crm.actionPlans.length
    const filteredDiags = crm.diagnostics.filter(d => filterMatch(d.companyId))
    return [
      { label: 'Total de Riscos', value: totalRisks, color: 'from-slate-500 to-slate-700' },
      { label: 'Riscos Críticos', value: criticalRisks, trend: criticalRisks > 0 ? 'down' : 'stable', color: 'from-red-500 to-rose-600' },
      { label: 'Planos de Ação', value: totalPlans, color: 'from-amber-500 to-orange-600' },
      { label: 'Planos Concluídos', value: completedPlans, suffix: totalPlans ? `(${pct(completedPlans, totalPlans)})` : '', color: 'from-emerald-500 to-green-600' },
      { label: 'Diagnósticos Ativos', value: filteredDiags.length, color: 'from-sky-500 to-indigo-600' },
    ]
  }, [crm.risks, crm.actionPlans, crm.diagnostics, filterMatch])

  const risksByLevel: BiChartData[] = useMemo(() => {
    const levels = countBy(crm.risks, r => r.level)
    const result = [
      { name: 'Baixo', value: levels['low'] || 0, color: '#22c55e' },
      { name: 'Médio', value: levels['medium'] || 0, color: '#eab308' },
      { name: 'Alto', value: levels['high'] || 0, color: '#ef4444' },
    ]
    return result.filter(d => d.value > 0)
  }, [crm.risks, filterMatch])

  const riskByCompany: BiChartData[] = useMemo(() => {
    const units = countBy(crm.units, u => u.name)
    const entries = Object.entries(units).map(([k, v]) => ({ name: k.substring(0, 12), value: v }))
    if (!entries.length) return [{ name: 'Nenhum dado', value: 1, color: '#e2e8f0' }]
    return entries
  }, [crm.units])

  const actionPlanProgress: BiChartData[] = useMemo(() => {
    const data = crm.actionPlans
    return [
      { name: 'Pendentes', value: data.filter(a => a.status === 'pending').length, color: '#eab308' },
      { name: 'Concluídos', value: data.filter(a => a.status === 'completed').length, color: '#22c55e' },
    ]
  }, [crm.actionPlans])

  // ── HUMAN DEVELOPMENT ─────────────────────────
  const humanKpis: BiKpi[] = useMemo(() => [
    { label: 'Mentorias Realizadas', value: men.sessions.filter(s => s.status === 'realizada').length, color: 'from-violet-500 to-purple-600' },
    { label: 'PDIs Ativos', value: men.activePDIs, color: 'from-blue-500 to-indigo-600' },
    { label: 'Participantes Ativos', value: men.participants.length, color: 'from-emerald-500 to-green-600' },
    { label: 'Metas Concluídas', value: men.completedGoals, suffix: men.completedGoals + men.overdueGoals > 0 ? `/ ${men.completedGoals + men.overdueGoals}` : '', color: 'from-amber-500 to-orange-600' },
    { label: 'Metas em Atraso', value: men.overdueGoals, trend: men.overdueGoals > 0 ? 'down' : 'stable', color: 'from-red-500 to-rose-600' },
    { label: 'Sessões no Mês', value: men.sessionsThisMonth, color: 'from-cyan-500 to-teal-600' },
  ], [men])

  const mentoringByMonth: BiChartData[] = useMemo(() => {
    const byMonth = countBy(men.sessions, s => new Date(s.date).toLocaleString('pt-BR', { month: 'short', year: '2-digit' }))
    return Object.entries(byMonth).map(([k, v]) => ({ name: k, value: v, color: '#8b5cf6' }))
  }, [men.sessions])

  const competencyEvolution: BiChartData[] = useMemo(() => {
    const evals = men.assessments.flatMap(a => Array.isArray(a.competencyScores) ? a.competencyScores : [])
    if (!evals.length) return [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }]
    const byComp = countBy(evals, e => {
      const comp = men.competencies.find(c => c.id === e.competencyId)
      return comp ? comp.name.substring(0, 10) : e.competencyId
    })
    return Object.entries(byComp).map(([k, v]) => ({ name: k, value: v }))
  }, [men.assessments, men.competencies])

  const pdiStatus: BiChartData[] = useMemo(() => {
    const allGoals = men.pdiPlans.flatMap(p => Array.isArray(p.goals) ? p.goals : [])
    if (!allGoals.length) return [{ name: 'Sem PDIs', value: 1, color: '#e2e8f0' }]
    const status = countBy(allGoals, g => g?.status ?? 'nao_iniciado')
    return [
      { name: 'Não Iniciado', value: status['nao_iniciado'] || 0, color: '#94a3b8' },
      { name: 'Em Andamento', value: status['em_andamento'] || 0, color: '#eab308' },
      { name: 'Concluído', value: status['concluido'] || 0, color: '#22c55e' },
      { name: 'Atrasado', value: status['atrasado'] || 0, color: '#ef4444' },
    ].filter(d => d.value > 0)
  }, [men.pdiPlans])

  // ── TRAINING ───────────────────────────────────
  const trainingKpis: BiKpi[] = useMemo(() => {
    const filteredEvents = trn.events.filter(e => filterMatch(e.companyId))
    const completed = filteredEvents.filter(e => e.status === 'realizado' || e.status === 'concluido').length
    const hours = filteredEvents.filter(e => e.status === 'realizado' || e.status === 'concluido').reduce((s, e) => s + e.hoursDuration, 0)
    return [
      { label: 'Eventos Realizados', value: completed, color: 'from-violet-500 to-purple-600' },
      { label: 'Participantes', value: trn.totalRegisteredParticipants, color: 'from-blue-500 to-indigo-600' },
      { label: 'Presenças', value: trn.attendanceRate > 0 ? Math.round(trn.attendanceRate * trn.totalRegisteredParticipants / 100) : 0, suffix: `(${trn.attendanceRate.toFixed(0)}%)`, color: 'from-emerald-500 to-green-600' },
      { label: 'Certificados Emitidos', value: trn.certificatesIssued, color: 'from-amber-500 to-orange-600' },
      { label: 'NPS', value: Math.round(trn.averageNps).toString(), suffix: '/100', trend: trn.averageNps >= 75 ? 'up' : 'stable', color: 'from-cyan-500 to-teal-600' },
      { label: 'Horas Ministradas', value: hours, suffix: 'h', color: 'from-rose-500 to-pink-600' },
    ]
  }, [trn, filterMatch])

  const eventsByType: BiChartData[] = useMemo(() => {
    const filtered = trn.events.filter(e => filterMatch(e.companyId))
    const byType = countBy(filtered, e => e.type)
    const colors = ['#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
    return Object.entries(byType).map(([k, v], i) => ({ name: k, value: v, color: colors[i % colors.length] }))
  }, [trn.events, filterMatch])

  const attendanceRate: BiChartData[] = useMemo(() =>
    trn.events.filter(e => trn.feedbacks.some(f => f.eventId === e.id) && filterMatch(e.companyId)).map(e => {
      const fb = trn.feedbacks.filter(f => f.eventId === e.id)
      const avg = fb.length ? fb.reduce((s, f) => s + f.nps, 0) / fb.length : 0
      return { name: e.name.substring(0, 12), value: Math.round(avg), secondary: fb.length }
    }),
    [trn.events, trn.feedbacks, filterMatch]
  )

  const npsByEvent: BiChartData[] = useMemo(() => {
    const byEvent = trn.feedbacks.reduce((acc: Record<string, number[]>, f) => {
      ;(acc[f.eventId] = acc[f.eventId] || []).push(f.nps)
      return acc
    }, {})
    return Object.entries(byEvent).map(([eid, npsList]) => {
      const ev = trn.events.find(e => e.id === eid)
      return { name: ev ? ev.name.substring(0, 14) : eid.substring(0, 8), value: Math.round(npsList.reduce((s, n) => s + n, 0) / npsList.length) }
    })
  }, [trn.feedbacks, trn.events])

  // ── FINANCIAL ──────────────────────────────────
  const financialKpis: BiKpi[] = useMemo(() => [
    { label: 'Receita Total', value: fmt(fin.dre.grossRevenue), color: 'from-emerald-500 to-green-600' },
    { label: 'Despesas', value: fmt(fin.dre.operatingExpenses), color: 'from-red-500 to-rose-600' },
    { label: 'Lucro Líquido', value: fmt(fin.dre.netProfit), trend: fin.dre.netProfit > 0 ? 'up' : 'down', color: 'from-blue-500 to-indigo-600' },
    { label: 'Margem', value: fin.dre.profitMargin.toFixed(1), suffix: '%', trend: fin.dre.profitMargin > 20 ? 'up' : fin.dre.profitMargin < 0 ? 'down' : 'stable', color: 'from-violet-500 to-purple-600' },
    { label: 'Inadimplência', value: fmt(fin.totalOverdue), trend: fin.totalOverdue > 0 ? 'down' : 'stable', color: 'from-amber-500 to-orange-600' },
    { label: 'A Receber (líquido)', value: fmt(Math.max(0, fin.totalPendingReceivable - fin.totalOverdue)), color: 'from-cyan-500 to-teal-600' },
  ], [fin])

  const cashFlowData: BiChartData[] = useMemo(() =>
    fin.cashFlowProjection.slice(0, 30).map(c => ({ name: c.dayLabel, value: c.inflow, secondary: c.outflow })),
    [fin.cashFlowProjection]
  )

  const fbRevenueByClient: BiChartData[] = useMemo(() => {
    const data = fin.revenueByClient
    return data.length ? data.map(c => ({ name: c.companyName.substring(0, 14), value: c.total, color: '#8b5cf6' }))
      : [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }]
  }, [fin.revenueByClient])

  const financialHealth: BiChartData[] = useMemo(() => {
    const pending = Math.max(0, fin.totalPendingReceivable - fin.totalOverdue)
    const data = [
      { name: 'Recebido', value: fin.totalReceived, color: '#22c55e' },
      ...(pending > 0 ? [{ name: 'A Receber', value: pending, color: '#eab308' }] : []),
      ...(fin.totalOverdue > 0 ? [{ name: 'Vencido', value: fin.totalOverdue, color: '#ef4444' }] : []),
    ]
    if (!data.some(d => d.value > 0)) return [{ name: 'Sem dados', value: 1, color: '#e2e8f0' }]
    return data
  }, [fin])

  // ── DATA AVAILABILITY ─────────────────────────
  const hasData = useMemo(() =>
    crm.companies.length > 0 || fin.receivables.length > 0 || trn.events.length > 0 || cal.events.length > 0 ||
    men.sessions.length > 0 || doc.documents.length > 0,
    [crm.companies, fin.receivables, trn.events, cal.events, men.sessions, doc.documents]
  )

  // ── AI INSIGHTS ────────────────────────────────
  const generateExecutiveSummary = useCallback(() => {
    const activeClients = crm.companies.filter(c => c.status === 'active').length
    const activeProjects = crm.contracts.filter(c => c.status === 'active').length
    const npsDisplay = isNaN(trn.averageNps) ? 'N/A' : Math.round(trn.averageNps).toString()
    return [
      `📊 Resumo Executivo — ${new Date().toLocaleDateString('pt-BR')}`,
      ``,
      `A CrepaldiDH atualmente atende ${activeClients} clientes ativos com ${activeProjects} projetos em andamento.`,
      `A receita mensal (MRR) é de ${fmt(fin.mrr)}, com ARR projetado de ${fmt(fin.arr)}.`,
      `${trn.completedEvents} treinamentos realizados com NPS de ${npsDisplay}/100.`,
      `${men.sessions.length} mentorias realizadas, ${men.activePDIs} PDIs ativos.`,
      `${crm.diagnostics.length} diagnósticos ativos. ${crm.risks.length} riscos mapeados.`,
      `Saúde financeira: margem de ${fin.dre.profitMargin.toFixed(1)}%, ${fmt(fin.totalOverdue)} em inadimplência.`,
      filters.companyId ? `\nFiltro ativo: cliente específico.` : '',
      filters.projectId ? `Filtro ativo: projeto específico.` : '',
    ].filter(Boolean).join('\n')
  }, [crm, fin, trn, men, filters])

  const generateInsights = useCallback((): BiInsight[] => {
    const list: BiInsight[] = []

    if (fin.totalOverdue > 50000) {
      list.push({ type: 'critical', title: 'Inadimplência Elevada', description: `${fmt(fin.totalOverdue)} em atraso. Necessário ação de cobrança.` })
    }
    if (!isNaN(trn.averageNps) && trn.averageNps < 70) {
      list.push({ type: 'warning', title: 'NPS abaixo da meta', description: `NPS ${Math.round(trn.averageNps)}/100. Revisar qualidade dos treinamentos.` })
    }
    if (crm.deals.filter(d => d.stage === 'Lead novo').length > 5) {
      list.push({ type: 'info', title: 'Leads não qualificados', description: `${crm.deals.filter(d => d.stage === 'Lead novo').length} leads aguardando primeiro contato.` })
    }
    if (men.overdueGoals > 0) {
      list.push({ type: 'warning', title: 'Metas de PDI em atraso', description: `${men.overdueGoals} metas de PDI estão atrasadas.` })
    }
    if (!isNaN(fin.dre.profitMargin) && fin.dre.profitMargin > 25) {
      list.push({ type: 'positive', title: 'Margem Saudável', description: `Margem de ${fin.dre.profitMargin.toFixed(1)}% — acima da média do setor.` })
    }
    if (crm.risks.filter(r => r.level === 'high').length > 5) {
      list.push({ type: 'critical', title: 'Muitos Riscos Críticos', description: `${crm.risks.filter(r => r.level === 'high').length} riscos críticos sem mitigação.` })
    }
    const renewals = crm.contracts.filter(c => c.status === 'active' && (new Date(c.endDate).getTime() - Date.now()) < 7776000000)
    if (renewals.length > 0) {
      list.push({ type: 'info', title: 'Contratos a Renovar', description: `${renewals.length} contratos vencem nos próximos 90 dias.` })
    }
    if (crm.contracts.filter(c => c.status === 'active' && new Date(c.endDate) < new Date()).length > 0) {
      list.push({ type: 'critical', title: 'Contratos Vencidos', description: `${crm.contracts.filter(c => c.status === 'active' && new Date(c.endDate) < new Date()).length} contratos ativos com prazo vencido.` })
    }

    return list
  }, [fin, trn, crm, men])

  const insights = useMemo(() => generateInsights(), [generateInsights])

  const alerts: BiAlert[] = useMemo(() => {
    const list: BiAlert[] = fin.financialAlerts.map(a => ({ severity: a.severity, title: a.title, description: a.description, module: 'financeiro' }))
    const overdueContracts = crm.contracts.filter(c => c.status === 'active' && new Date(c.endDate) < new Date())
    overdueContracts.forEach(c => list.push({ severity: 'high', title: 'Contrato Vencido', description: `${c.title} — venceu em ${new Date(c.endDate).toLocaleDateString('pt-BR')}`, module: 'crm' }))
    const noAction = crm.actionPlans.filter(a => a.status === 'pending' && new Date(a.deadline) < new Date())
    noAction.forEach(a => list.push({ severity: 'medium', title: 'Plano de Ação Atrasado', description: a.task.substring(0, 60), module: 'nr01' }))
    men.pdiPlans.flatMap(p => Array.isArray(p.goals) ? p.goals.filter(g => g?.status === 'atrasado') : []).forEach(g => { if (g) list.push({ severity: 'medium', title: 'Meta PDI Atrasada', description: g.objective?.substring(0, 60) || '', module: 'mentoring' }) })
    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    return list.sort((a, b) => (severityOrder[a.severity] ?? 3) - (severityOrder[b.severity] ?? 3))
  }, [fin, crm, men])

  const exportToCsv = useCallback((data: BiChartData[], filename: string) => {
    if (!data.length) return
    const header = 'Categoria,Valor\n'
    const rows = data.map(d => `${d.name},${d.value}`).join('\n')
    const blob = new Blob(['\uFEFF' + header + rows], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${filename.replace(/[^a-zA-Z0-9_-]/g, '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [])

  const exportToPdf = useCallback(() => {
    window.print()
  }, [])

  return (
    <BiContext.Provider value={{
      loading, period, setPeriod,
      filters, setFilters, filterOptions,
      currentRole: crm.currentRole,
      executiveKpis, revenueByMonth, serviceMix, clientAcquisition,
      commercialKpis, pipelineData, revenueByConsultant, lostReasons,
      operationalKpis, projectsByStatus, upcomingMeetings, deliveryByMonth,
      nr01Kpis, risksByLevel, riskByCompany, actionPlanProgress,
      humanKpis, mentoringByMonth, competencyEvolution, pdiStatus,
      trainingKpis, eventsByType, attendanceRate, npsByEvent,
      financialKpis, cashFlowData, revenueByClient: fbRevenueByClient, financialHealth,
      insights, alerts,
      generateExecutiveSummary, exportToCsv, exportToPdf, hasData,
    }}>
      {children}
    </BiContext.Provider>
  )
}

export function useBi() {
  const ctx = useContext(BiContext)
  if (!ctx) throw new Error('useBi must be used within BiProvider')
  return ctx
}
