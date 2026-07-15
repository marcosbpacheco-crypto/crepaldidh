'use client'

import { useMentoring } from './context/MentoringContext'
import Link from 'next/link'
import {
  Users, Brain, Target, Star, TrendingUp, Calendar, Clock,
  CheckCircle, AlertCircle, ChevronRight, Sparkles, BookOpen,
  Activity, BarChart3, Plus
} from 'lucide-react'

const SESSION_TYPE_LABELS: Record<string, string> = {
  individual: 'Individual',
  coletiva: 'Coletiva',
  lideranca: 'Liderança',
  executiva: 'Executiva',
}

const SESSION_TYPE_COLORS: Record<string, string> = {
  individual: 'bg-blue-100 text-blue-700',
  coletiva: 'bg-purple-100 text-purple-700',
  lideranca: 'bg-amber-100 text-amber-700',
  executiva: 'bg-emerald-100 text-emerald-700',
}

const PDI_STATUS_COLORS: Record<string, string> = {
  nao_iniciado: 'bg-slate-100 text-slate-600',
  em_andamento: 'bg-blue-100 text-blue-700',
  concluido: 'bg-emerald-100 text-emerald-700',
  atrasado: 'bg-red-100 text-red-700',
}

const PDI_STATUS_LABELS: Record<string, string> = {
  nao_iniciado: 'Não Iniciado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
}

export default function MentoringPage() {
  const {
    participants, sessions, pdiPlans,
    activeMentorings, activePDIs, sessionsThisMonth, completedGoals, overdueGoals,
  } = useMentoring()

  const recentSessions = sessions.slice(0, 4)
  const upcomingSessions = sessions.filter(s => s.status === 'agendada').slice(0, 3)
  const allGoals = pdiPlans.flatMap(p => Array.isArray(p.goals) ? p.goals : [])
  const overdueGoalsList = allGoals.filter(g => g && g.status !== 'concluido' && new Date(g.deadline) < new Date()).slice(0, 3)

  const kpis = [
    { label: 'Mentorias Ativas', value: activeMentorings, icon: Users, color: 'from-blue-500 to-blue-600', light: 'bg-blue-50 text-blue-600', trend: '+2 esse mês' },
    { label: 'PDIs Ativos', value: activePDIs, icon: Target, color: 'from-violet-500 to-violet-600', light: 'bg-violet-50 text-violet-600', trend: '+1 esse mês' },
    { label: 'Sessões este Mês', value: sessionsThisMonth, icon: Calendar, color: 'from-emerald-500 to-emerald-600', light: 'bg-emerald-50 text-emerald-600', trend: '12h de mentoria' },
    { label: 'Metas Concluídas', value: completedGoals, icon: CheckCircle, color: 'from-amber-500 to-orange-500', light: 'bg-amber-50 text-amber-700', trend: `${overdueGoals} atrasadas` },
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
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Mentorias & PDI</h1>
          <p className="text-slate-500 mt-1">Gerencie o desenvolvimento de líderes e colaboradores</p>
        </div>
        <div className="flex gap-3">
          <Link href="/mentoring/participants/new"
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-full text-sm font-semibold hover:bg-slate-50 transition-all shadow-sm">
            <Plus className="w-4 h-4" /> Participante
          </Link>
          <Link href="/mentoring/sessions/new"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-sm font-bold hover:opacity-90 shadow-md shadow-violet-200 hover:-translate-y-0.5 transition-all duration-300">
            <Plus className="w-4 h-4" /> Nova Sessão
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 relative overflow-hidden group hover:shadow-md transition-shadow">
            <div className={`absolute inset-0 bg-gradient-to-br ${kpi.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
            <div className="flex justify-between items-start mb-4">
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${kpi.light}`}>
                <kpi.icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-full">{kpi.trend}</span>
            </div>
            <p className="text-3xl font-bold text-slate-800 mb-1">{kpi.value}</p>
            <p className="text-sm text-slate-500 font-medium">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* Participantes recentes */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-violet-600" />
              <h2 className="text-lg font-bold text-slate-800">Participantes</h2>
              <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{participants.length}</span>
            </div>
            <Link href="/mentoring/participants" className="text-sm text-violet-600 font-medium hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="space-y-3">
            {participants.slice(0, 4).map(p => {
              const pSessions = sessions.filter(s => s.participantIds.includes(p.id))
              const pPDI = pdiPlans.find(pl => pl.participantId === p.id)
              const completedPDI = (pPDI && Array.isArray(pPDI.goals)) ? pPDI.goals.filter(g => g?.status === 'concluido').length : 0
              const totalPDI = (pPDI && Array.isArray(pPDI.goals)) ? pPDI.goals.length : 0
              const pct = totalPDI > 0 ? Math.round((completedPDI / totalPDI) * 100) : 0

              return (
                <Link key={p.id} href={`/mentoring/participants/${p.id}`}
                  className="flex items-center gap-4 p-4 rounded-xl border border-slate-50 hover:border-violet-100 hover:bg-violet-50/30 transition-all group cursor-pointer">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-sm">
                    {p.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm font-bold text-slate-800 truncate">{p.name}</h3>
                    </div>
                    <p className="text-xs text-slate-500 truncate">{p.role} · {p.companyName}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-slate-600">{pct}% PDI</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 text-right flex-shrink-0">
                    <span className="text-xs font-bold text-slate-700">{pSessions.length} sessões</span>
                    <span className="text-xs text-slate-400">Início: {new Date(p.startDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                </Link>
              )
            })}
          </div>
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
                  const pNames = s.participantIds
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
                          <p className="text-xs text-violet-300 mt-0.5">{pNames}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
            <Link href="/mentoring/sessions/new"
              className="mt-5 flex items-center justify-center w-full py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-full text-sm font-bold transition-all">
              <Plus className="w-4 h-4 mr-1" /> Agendar Sessão
            </Link>
          </div>
        </div>
      </div>

      {/* Sessões recentes + Metas atrasadas */}
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
                <Link key={s.id} href={`/mentoring/sessions/${s.id}`}
                  className="flex items-start gap-3 p-3.5 rounded-xl hover:bg-slate-50 transition-colors border border-transparent hover:border-slate-100 cursor-pointer">
                  <div className={`px-2 py-1 rounded-lg text-xs font-semibold ${SESSION_TYPE_COLORS[s.type]} flex-shrink-0`}>
                    {SESSION_TYPE_LABELS[s.type]}
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

        {/* Metas atrasadas */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-bold text-slate-800">Metas Atrasadas</h2>
              {overdueGoals > 0 && (
                <span className="text-xs font-bold px-2 py-0.5 bg-red-100 text-red-600 rounded-full">{overdueGoals}</span>
              )}
            </div>
            <Link href="/mentoring/pdi" className="text-sm text-red-600 font-medium hover:underline flex items-center gap-1">
              Ver PDIs <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
          {overdueGoalsList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2">
              <CheckCircle className="w-10 h-10 text-emerald-300" />
              <p className="text-sm text-slate-400">Nenhuma meta atrasada! 🎉</p>
            </div>
          ) : (
            <div className="space-y-3">
              {overdueGoalsList.map(goal => {
                const plan = pdiPlans.find(p => p.id === goal.pdiId)
                const participant = plan ? participants.find(p => p.id === plan.participantId) : null
                return (
                  <div key={goal.id} className="p-3.5 rounded-xl border border-red-100 bg-red-50/50">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-800 truncate">{goal.competency}</p>
                        <p className="text-xs text-slate-600 mt-0.5 truncate">{goal.objective}</p>
                        {participant && (
                          <p className="text-xs text-violet-600 mt-1 font-medium">{participant.name}</p>
                        )}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${PDI_STATUS_COLORS[goal.status]}`}>
                        {PDI_STATUS_LABELS[goal.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-2 text-xs text-red-600">
                      <AlertCircle className="w-3 h-3" />
                      Venceu em {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick access */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Participantes', href: '/mentoring/participants', icon: Users, color: 'text-violet-600 bg-violet-50' },
          { label: 'Sessões', href: '/mentoring/sessions', icon: Calendar, color: 'text-blue-600 bg-blue-50' },
          { label: 'PDIs', href: '/mentoring/pdi', icon: Target, color: 'text-emerald-600 bg-emerald-50' },
          { label: 'Avaliações', href: '/mentoring/assessments', icon: BarChart3, color: 'text-amber-600 bg-amber-50' },
          { label: 'Ferramentas', href: '/mentoring/tools', icon: BookOpen, color: 'text-pink-600 bg-pink-50' },
          { label: 'IA & Insights', href: '/mentoring/ai', icon: Sparkles, color: 'text-indigo-600 bg-indigo-50' },
        ].map((item) => (
          <Link key={item.href} href={item.href}
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
