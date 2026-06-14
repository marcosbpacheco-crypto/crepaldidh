'use client'

import { useState } from 'react'
import { useOccupational } from './context/OccupationalHealthContext'
import Link from 'next/link'
import {
  Shield, Users, FileText, Calendar, Stethoscope, Activity,
  AlertTriangle, ArrowRight, Clock, HeartPulse, Clipboard,
  UserCheck, UserX, CheckCircle, XCircle, Loader2, Download,
} from 'lucide-react'

const fmt = (v: number) => v.toLocaleString('pt-BR')
const pct = (v: number, t: number) => t > 0 ? ((v / t) * 100).toFixed(1) : '0.0'

const modules = [
  { name: 'PCMSO', href: '/occupational/pcmso', icon: Clipboard, desc: 'Programa de Controle Médico', color: 'from-emerald-600 to-teal-600' },
  { name: 'ASO', href: '/occupational/aso', icon: FileText, desc: 'Atestados de Saúde Ocupacional', color: 'from-blue-600 to-indigo-600' },
  { name: 'Exames', href: '/occupational/exams', icon: Stethoscope, desc: 'Agendamento e resultados', color: 'from-violet-600 to-purple-600' },
  { name: 'Atestados', href: '/occupational/certificates', icon: HeartPulse, desc: 'Atestados médicos', color: 'from-rose-600 to-pink-600' },
  { name: 'Afastamentos', href: '/occupational/absences', icon: UserX, desc: 'Controle de afastamentos', color: 'from-orange-600 to-red-600' },
  { name: 'Retorno ao Trabalho', href: '/occupational/return-to-work', icon: UserCheck, desc: 'Reintegração e readaptação', color: 'from-green-600 to-emerald-600' },
  { name: 'Médicos & Clínicas', href: '/occupational/doctors', icon: Stethoscope, desc: 'Cadastro de prestadores', color: 'from-cyan-600 to-blue-600' },
  { name: 'Relatórios', href: '/occupational/reports', icon: Activity, desc: 'PDF e indicadores', color: 'from-slate-600 to-slate-800' },
]

const severityColor = (s: string) => {
  switch (s) {
    case 'critical': return 'bg-red-100 text-red-700 border-red-200'
    case 'warning': return 'bg-amber-100 text-amber-700 border-amber-200'
    default: return 'bg-blue-100 text-blue-700 border-blue-200'
  }
}

export default function OccupationalDashboard() {
  const occ = useOccupational()
  const { indicators, alerts, employees, asos, exams, absences } = occ
  const [showAllAlerts, setShowAllAlerts] = useState(false)

  const criticalAlerts = alerts.filter(a => !a.isResolved && a.severity === 'critical')
  const warningAlerts = alerts.filter(a => !a.isResolved && a.severity === 'warning')
  const infoAlerts = alerts.filter(a => !a.isResolved && a.severity === 'info')
  const displayAlerts = showAllAlerts ? [...criticalAlerts, ...warningAlerts, ...infoAlerts].slice(0, 20) : [...criticalAlerts, ...warningAlerts].slice(0, 8)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <Shield className="w-7 h-7 text-emerald-600" />
          Saúde Ocupacional
        </h1>
        <p className="text-slate-400 text-xs mt-1">Gestão de PCMSO, ASO, exames, atestados e afastamentos</p>
      </div>

      {/* Module Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {modules.map(m => (
          <Link
            key={m.name}
            href={m.href}
            className="group relative overflow-hidden p-4 rounded-2xl border border-slate-100 bg-white hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${m.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl bg-gradient-to-br ${m.color} text-white shadow-lg`}>
                <m.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-800">{m.name}</p>
                <p className="text-[10px] text-slate-400">{m.desc}</p>
              </div>
            </div>
            <ArrowRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-all group-hover:translate-x-1" />
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{fmt(indicators.totalEmployees)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{fmt(indicators.activeEmployees)} ativos · {fmt(indicators.absentEmployees)} afastados</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ASO</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{fmt(indicators.asosValid)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{fmt(indicators.asosExpiring)} a vencer · {fmt(indicators.asosExpired)} vencidos</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Stethoscope className="w-4 h-4 text-violet-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Exames</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{fmt(indicators.examsScheduled)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{fmt(indicators.examsOverdue)} atrasados · {fmt(indicators.examsCompleted)} realizados</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <HeartPulse className="w-4 h-4 text-rose-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Atestados</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{fmt(indicators.activeCertificates)}</p>
          <p className="text-[10px] text-slate-500 mt-1">ativos no período</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <UserX className="w-4 h-4 text-orange-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Afastamentos</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{fmt(indicators.activeAbsences)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{fmt(indicators.prolongedAbsences)} prolongados</p>
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-emerald-500" />
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Retornos</span>
          </div>
          <p className="text-2xl font-black text-slate-800">{fmt(indicators.activeReturnToWorks)}</p>
          <p className="text-[10px] text-slate-500 mt-1">{fmt(indicators.activeRestrictions)} restrições ativas</p>
        </div>
      </div>

      {/* Two-column: Alerts + Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerts Column */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-slate-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              Alertas
              {criticalAlerts.length > 0 && (
                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-bold">{criticalAlerts.length}</span>
              )}
            </h3>
            <button onClick={() => setShowAllAlerts(!showAllAlerts)} className="text-[10px] text-brand-teal font-semibold hover:underline">
              {showAllAlerts ? 'Menos' : `+${infoAlerts.length} mais`}
            </button>
          </div>
          <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
            {displayAlerts.length === 0 && (
              <p className="text-xs text-slate-400 text-center py-8">Nenhum alerta pendente ✅</p>
            )}
            {displayAlerts.map(a => (
              <div key={a.id} className={`p-3 rounded-xl border ${severityColor(a.severity)}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-bold">{a.title}</p>
                    <p className="text-[10px] opacity-75 mt-0.5">{a.description}</p>
                  </div>
                  <button
                    onClick={() => occ.resolveAlert(a.id)}
                    className="p-1 rounded hover:bg-black/5 shrink-0"
                    title="Resolver"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Charts + Status */}
        <div className="lg:col-span-2 space-y-6">
          {/* Exams by Period Chart */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-violet-500" />
              Exames por Período
            </h3>
            <div className="flex items-end gap-2 h-32">
              {indicators.examsByPeriod.map((item, i) => {
                const max = Math.max(...indicators.examsByPeriod.map(x => x.total), 1)
                const h = (item.total / max) * 100
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className="text-[9px] font-bold text-slate-500">{item.total}</span>
                    <div className="w-full bg-violet-100 rounded-t-lg relative" style={{ height: `${Math.max(h, 4)}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-violet-500 to-violet-400 rounded-t-lg transition-all" style={{ height: '100%' }} />
                    </div>
                    <span className="text-[8px] text-slate-400">{item.month}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Absences by Type */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
              <UserX className="w-4 h-4 text-orange-500" />
              Afastamentos por Tipo
            </h3>
            <div className="space-y-2">
              {indicators.absencesByType.length === 0 && (
                <p className="text-xs text-slate-400 text-center py-4">Nenhum afastamento registrado</p>
              )}
              {indicators.absencesByType.map((item, i) => {
                const max = Math.max(...indicators.absencesByType.map(x => x.total), 1)
                const p = (item.total / max) * 100
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-slate-600 w-36 truncate capitalize">{item.type.replace(/_/g, ' ')}</span>
                    <div className="flex-1 h-4 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full transition-all" style={{ width: `${p}%` }} />
                    </div>
                    <span className="text-xs font-bold text-slate-600 w-8 text-right">{item.total}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
