'use client'

import { useMentoring } from './context/MentoringContext'
import Link from 'next/link'
import {
  Brain, Users, Target, Star, TrendingUp, Calendar, Clock,
  CheckCircle, AlertCircle, ChevronRight, Sparkles, BookOpen,
  Activity, BarChart3, Plus, User, Building2, ListChecks
} from 'lucide-react'

const SESSION_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  coletiva: 'Coletiva',
  lideranca: 'Liderança',
  executiva: 'Executiva',
  rh: 'RH',
}

const SESSION_TYPE_COLORS: Record<string, string> = {
  individual: 'bg-blue-100 text-blue-700',
  coletiva: 'bg-purple-100 text-purple-700',
  lideranca: 'bg-amber-100 text-amber-700',
  executiva: 'bg-emerald-100 text-emerald-700',
  rh: 'bg-sky-100 text-sky-700',
}

const OBJECTIVE_STATUS_COLORS: Record<string, string> = {
  nao_iniciado: 'bg-slate-100 text-slate-600',
  em_andamento: 'bg-blue-100 text-blue-700',
  em_atencao: 'bg-amber-100 text-amber-700',
  concluido: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
}

const OBJECTIVE_STATUS_LABELS: Record<string, string> = {
  nao_iniciado: 'Não Iniciado',
  em_andamento: 'Em Andamento',
  em_atencao: 'Em Atenção',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export default function MentoringPage() {
  const {
    programs, participants, sessions, objectives, actions,
    activeMentorings, activeRHPrograms, sessionsThisMonth, sessionsThisWeek,
    upcomingSessions, activeMentees, pendingSessionRegistrations, overdueActions,
    pendingFeedbacks, avgSatisfaction, mentoringHours, completedMentorings, nearClosing,
  } = useMentoring()

  const recentSessions = sessions.slice(0, 4)
  const individualPrograms = programs.filter(p => p.modality === 'individual')
  const rhPrograms = programs.filter(p => p.modality === 'rh')
  const overdueActionsList = actions.filter(a => a.status !== 'concluida' && a.status !== 'cancelada' && a.deadline && new Date(a.deadline) < new Date()).slice(0, 3)

  const kpis = [
    { label: 'Mentorias Ativas', value: activeMentorings, icon: User, color: 'from-violet-500 to-violet-600', light: 'bg-violet-50 text-violet-600', trend: 'individuais', href: '/mentoring/individual' },
    { label: 'Programas RH Ativos', value: activeRHPrograms, icon: Building2, color: 'from-sky-500 to-blue-600', light: 'bg-sky-50 text-sky-600', trend: 'organizacionais', href: '/mentoring/rh' },
    { label: 'Sessões este Mês', value: sessionsThisMonth, icon: Calendar, color: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600', trend: `${mentoringHours.toFixed(1)}h de mentoria`, href: '/mentoring/sessions' },
    { label: 'Satisfação Média', value: avgSatisfaction ? `${avgSatisfaction}/5` : '—', icon: Star, color: 'from-amber-500 to-orange-500', light: 'bg-amber-50 text-amber-700', trend: `${pendingFeedbacks} pendentes`, href: '/mentoring/sessions' },
  ]

  const alerts = [
    { label: 'Sessões pendentes de registro', value: pendingSessionRegistrations, icon: AlertCircle, href: '/mentoring/sessions' },
    { label: 'Ações atrasadas', value: overdueActions, icon: Clock, href: '/mentoring/individual' },
    { label: 'Avaliações pendentes', value: pendingFeedbacks, icon: Star, href: '/mentoring/assessments' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-6 h-6 text-violet-600" />
            <span className="text-sm font-semibold text-violet-600 uppercase tracking-wider">Desenvolvimento Humano</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mentorias</h1>
          <p className="text-slate-500 mt-1">Gerencie mentorias individuais e programas de RH sem estrutura de PDI</p>
        </div>
        <div className="flex gap-3">
          <Link href="/mentoring/participants"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Participante
          </Link>
          <Link href="/mentoring/individual/novo"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-sm font-bold hover:opacity-90 shadow-md shadow-violet-200 hover:-translate-y-0.5 transition-all duration-300">
            <Plus className="w-4 h-4" /> Nova Mentoria
          </Link>
        </div>
      </div>

      {/* Alert banner row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {alerts.map(a => (
          <Link key={a.label} href={a.href}
            className="flex items-center gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all">
            <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0">
              <a.icon className="w-5 h-5 text-slate-500" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${a.value > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{a.value}</p>
              <p className="text-xs text-slate-500 font-medium">{a.label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <Link key={i} href={kpi.href} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow hover:border-violet-200">
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className="flex justify-between items-start mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${kpi.light}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{kpi.trend}</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{kpi.value}</p>
            <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
          </Link>
        ))}
      </div>

      {/* Modality cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <Link href="/mentoring/individual" className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-violet-200 hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity" />
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-violet-50 text-violet-600`}>
              <User className="w-5 h-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mt-4">Mentorias Individuais</h2>
          <p className="text-sm text-slate-500 mt-1">Programas de mentoria 1:1 com objetivos, ações, sessões e avaliação de evolução.</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{individualPrograms.length} programa(s)</span>
            <span className="text-slate-300">·</span>
            <span>{activeMentees} mentorado(s) ativo(s)</span>
          </div>
        </Link>
        <Link href="/mentoring/rh" className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-100 hover:border-sky-200 hover:shadow-md transition-all relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-sky-500 to-blue-600 opacity-[0.04] group-hover:opacity-[0.08] transition-opacity" />
          <div className="flex items-start justify-between">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center bg-sky-50 text-sky-600`}>
              <Building2 className="w-5 h-5" />
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-sky-400 group-hover:translate-x-1 transition-all" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mt-4">Mentoria para RH</h2>
          <p className="text-sm text-slate-500 mt-1">Programas organizacionais com diagnóstico, indicadores, participantes e ações.</p>
          <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
            <span className="font-bold text-slate-700">{rhPrograms.length} programa(s)</span>
            <span className="text-slate-300">·</span>
            <span>{activeRHPrograms} ativo(s)</span>
          </div>
        </Link>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Programas recentes */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-bold text-slate-800">Programas de Mentoria</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{programs.length}</span>
            </div>
            <Link href="/mentoring/individual" className="text-sm text-violet-600 font-medium hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {programs.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum programa de mentoria cadastrado. Crie sua primeira mentoria!</p>
          ) : (
            <div className="space-y-3">
              {programs.slice(0, 4).map(p => {
                const pObjectives = Array.isArray(p.objectives) ? p.objectives : []
                const done = pObjectives.filter(o => o.status === 'concluido').length
                const pct = pObjectives.length > 0 ? Math.round((done / pObjectives.length) * 100) : (p.progress || 0)
                return (
                  <Link key={p.id} href={p.modality === 'rh' ? `/mentoring/rh/${p.id}` : `/mentoring/individual/${p.id}`}
                    className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 hover:border-violet-100 hover:bg-violet-50/30 transition-all group cursor-pointer">
                    <div className={`w-12 h-12 rounded-xl text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm ${p.modality === 'rh' ? 'bg-gradient-to-br from-sky-500 to-blue-600' : 'bg-gradient-to-br from-violet-500 to-purple-600'}`}>
                      {p.modality === 'rh' ? <Building2 className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <h3 className="text-sm font-bold text-slate-800 truncate">{p.name}</h3>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${p.modality === 'rh' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'}`}>
                          {p.modality === 'rh' ? 'RH' : 'Individual'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 truncate">{p.menteeName || p.companyName || p.mentor || 'Sem informações'}</p>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${p.modality === 'rh' ? 'bg-gradient-to-r from-sky-500 to-blue-500' : 'bg-gradient-to-r from-violet-500 to-purple-500'}`} style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs font-semibold text-slate-600">{pct}%</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 text-right flex-shrink-0">
                      <span className="text-xs font-bold text-slate-700">{pObjectives.length} objetivos</span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${OBJECTIVE_STATUS_COLORS[p.status] || 'bg-slate-100 text-slate-600'}`}>
                        {OBJECTIVE_STATUS_LABELS[p.status] || p.status}
                      </span>
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>

        {/* Agenda / Próximas Sessões */}
        <div className="bg-gradient-to-br from-brand-blue to-slate-900 rounded-2xl p-6 text-white relative overflow-hidden shadow-lg">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-violet-300" />
                <h2 className="text-base font-bold">Próximas Sessões</h2>
              </div>
              <span className="text-xs font-semibold px-2 py-0.5 bg-white/10 rounded-full">{upcomingSessions.length}</span>
            </div>
            {upcomingSessions.length === 0 ? (
              <p className="text-sm text-slate-300 text-center py-4">Nenhuma sessão agendada.</p>
            ) : (
              <div className="space-y-3">
                {upcomingSessions.map(s => {
                  const pNames = (s.participantIds || [])
                    .map(id => participants.find(p => p.id === id)?.name?.split(' ')[0] ?? id)
                    .join(', ')
                  return (
                    <div key={s.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-3.5 border border-white/10">
                      <div className="flex items-start gap-2.5">
                        <div className="w-2 h-2 rounded-full bg-violet-400 mt-1.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-semibold leading-tight">{s.title}</p>
                          <p className="text-xs text-slate-300 mt-1">
                            <Clock className="inline w-3 h-3 mr-1" />
                            {new Date(s.date).toLocaleDateString('pt-BR')} · {s.duration}min
                          </p>
                          <p className="text-xs text-violet-300 mt-0.5">{pNames || s.mentee || s.mentor || ''}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Link href="/mentoring/sessions"
              className="mt-5 flex items-center justify-center w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-sm font-bold transition-all">
              <Plus className="w-4 h-4 mr-1" /> Agendar Sessão
            </Link>
          </div>
        </div>
      </div>

      {/* Sessões recentes + Ações atrasadas */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Sessões realizadas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-800">Sessões Recentes</h2>
            </div>
            <Link href="/mentoring/sessions" className="text-sm text-blue-600 font-medium hover:underline flex items-center gap-1">
              Ver todas <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {recentSessions.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhuma sessão registrada.</p>
          ) : (
            <div className="space-y-3">
              {recentSessions.map(s => (
                <Link key={s.id} href="/mentoring/sessions"
                  className="flex items-start gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                  <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${SESSION_TYPE_COLORS[s.type]} flex-shrink-0`}>
                    {SESSION_TYPE_LABELS[s.type] || s.type}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">{s.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {new Date(s.date).toLocaleDateString('pt-BR')} · {s.duration}min
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${s.status === 'realizada' ? 'bg-emerald-100 text-emerald-700' : s.status === 'agendada' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {s.status === 'realizada' ? 'Realizada' : s.status === 'agendada' ? 'Agendada' : 'Cancelada'}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Ações atrasadas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-slate-800">Ações Atrasadas</h2>
              {overdueActions > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">{overdueActions}</span>
              )}
            </div>
            <Link href="/mentoring/individual" className="text-sm text-red-600 font-medium hover:underline flex items-center gap-1">
              Ver mentorias <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {overdueActionsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle className="w-10 h-10 text-emerald-300" />
              <p className="text-sm text-slate-400">Nenhuma ação atrasada! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueActionsList.map(a => {
                const obj = objectives.find(o => o.id === a.objectiveId)
                return (
                  <div key={a.id} className="p-3.5 rounded-xl border border-red-100 bg-red-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{a.description}</p>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{obj?.title || 'Ação da mentoria'}</p>
                        {a.responsible && (
                          <p className="text-xs text-violet-600 mt-1 font-medium">{a.responsible}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${OBJECTIVE_STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600'}`}>
                        {a.status}
                      </span>
                    </div>
                    {a.deadline && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                        <Clock className="w-3 h-3" />
                        Venceu em {new Date(a.deadline).toLocaleDateString('pt-BR')}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Próximos do encerramento */}
      {nearClosing.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-slate-800">Próximas do Encerramento</h2>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {nearClosing.map(p => (
              <Link key={p.id} href={p.modality === 'rh' ? `/mentoring/rh/${p.id}` : `/mentoring/individual/${p.id}`}
                className="p-4 rounded-xl border border-amber-100 bg-amber-50/40 hover:bg-amber-50 transition-colors">
                <p className="text-sm font-bold text-slate-800 truncate">{p.name}</p>
                <p className="text-xs text-slate-500 mt-1">Encerra em {new Date(p.endDate!).toLocaleDateString('pt-BR')}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Quick access */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Mentorias', href: '/mentoring/individual', icon: User, color: 'text-violet-600 bg-violet-50' },
          { label: 'RH', href: '/mentoring/rh', icon: Building2, color: 'text-sky-600 bg-sky-50' },
          { label: 'Participantes', href: '/mentoring/participants', icon: Users, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Sessões', href: '/mentoring/sessions', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: 'Objetivos', href: '/mentoring/individual', icon: ListChecks, color: 'text-amber-600 bg-amber-50' },
          { label: 'Avaliações', href: '/mentoring/assessments', icon: BarChart3, color: 'text-pink-600 bg-pink-50' },
          { label: 'Ferramentas', href: '/mentoring/tools', icon: BookOpen, color: 'text-purple-600 bg-purple-50' },
          { label: 'IA & Insights', href: '/mentoring/ai', icon: Sparkles, color: 'text-indigo-600 bg-indigo-50' },
        ].map((item) => (
          <Link key={item.href + item.label} href={item.href}
            className="flex flex-col items-center gap-2 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>
              <item.icon className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold text-slate-700 text-center">{item.label}</span>
          </Link>
        ))}
      </div>

    </div>
  )
}
