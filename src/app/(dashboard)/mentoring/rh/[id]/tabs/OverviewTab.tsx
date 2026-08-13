'use client'

import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { Target, Calendar, Clock, Users, Building2, Star, ClipboardList, TrendingUp, Activity } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  planejada: 'Planejada',
  ativa: 'Ativa',
  pausada: 'Pausada',
  concluida: 'ConcluÃ­da',
  cancelada: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  planejada: 'bg-slate-100 text-slate-700',
  ativa: 'bg-emerald-100 text-emerald-700',
  pausada: 'bg-amber-100 text-amber-700',
  concluida: 'bg-blue-100 text-blue-700',
  cancelada: 'bg-red-100 text-red-700',
}

export default function OverviewTab({ program }: { program: MentoringProgram }) {
  const { sessions } = useMentoring()

  const pObjectives = Array.isArray(program.objectives) ? program.objectives : []
  const pActions = Array.isArray(program.actions) ? program.actions : []
  const pSessions = Array.isArray(program.sessions) ? program.sessions : []
  const pParticipants = Array.isArray(program.participants) ? program.participants : []
  const pDiagnostics = Array.isArray(program.diagnostics) ? program.diagnostics : []
  const pIndicators = Array.isArray(program.indicators) ? program.indicators : []
  const pFeedbacks = Array.isArray(program.feedbacks) ? program.feedbacks : []

  const doneObjectives = pObjectives.filter(o => o.status === 'concluido').length
  const doneActions = pActions.filter(a => a.status === 'concluida').length
  const doneSessions = pSessions.filter(s => s.status === 'realizada').length
  const pct = pObjectives.length > 0 ? Math.round((doneObjectives / pObjectives.length) * 100) : (program.progress || 0)
  const hours = pSessions.filter(s => s.status === 'realizada').reduce((acc, s) => acc + (s.duration || 0), 0) / 60

  const ratings = pFeedbacks.map(f => f.satisfaction).filter((v): v is number => v !== null && v !== undefined)
  const avgSat = ratings.length ? (ratings.reduce((s, v) => s + v, 0) / ratings.length).toFixed(1) : 'â€”'

  const nextSession = pSessions
    .filter(s => s.status === 'agendada')
    .sort((a, b) => a.date.localeCompare(b.date))[0]

  const mainObjective = pObjectives.find(o => o.priority === 'alta') || pObjectives[0]

  const statCards = [
    { label: 'Status', value: STATUS_LABELS[program.status] || program.status, badge: STATUS_COLORS[program.status] || 'bg-slate-100 text-slate-700' },
    { label: 'Progresso', value: `${pct}%` },
    { label: 'Participantes', value: `${pParticipants.length}` },
    { label: 'Horas de mentoria', value: hours.toFixed(1) },
    { label: 'Objetivos', value: `${doneObjectives}/${pObjectives.length}` },
    { label: 'DiagnÃ³sticos', value: `${pDiagnostics.filter(d => d.status === 'concluido').length}/${pDiagnostics.length}` },
    { label: 'Indicadores', value: `${pIndicators.length}` },
    { label: 'SatisfaÃ§Ã£o', value: avgSat },
  ]

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {statCards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <p className="text-xs font-semibold text-slate-400 mb-2">{c.label}</p>
            {c.badge ? (
              <span className={`inline-block text-sm font-bold px-2.5 py-1 rounded-lg ${c.badge}`}>{c.value}</span>
            ) : (
              <p className="text-2xl font-bold text-slate-800">{c.value}</p>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Main objective */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <Target className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-800">Objetivo Principal</h3>
          </div>
          {mainObjective ? (
            <div>
              <p className="text-sm font-bold text-slate-800">{mainObjective.title}</p>
              {mainObjective.description && (
                <p className="text-sm text-slate-500 mt-1">{mainObjective.description}</p>
              )}
              <div className="flex items-center gap-3 mt-4">
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all" style={{ width: `${mainObjective.progress || 0}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-600">{mainObjective.progress || 0}%</span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhum objetivo definido ainda. Acesse a aba <span className="font-semibold">Objetivos</span> para criar.</p>
          )}
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-800">InformaÃ§Ãµes</h3>
          </div>
          <div className="space-y-3">
            {[
              { icon: Building2, label: 'Empresa', value: program.companyName || 'â€”' },
              { icon: Users, label: 'ResponsÃ¡vel RH', value: program.rhResponsible || 'â€”' },
              { icon: Users, label: 'Mentor / Consultor', value: program.mentor || 'â€”' },
              { icon: Calendar, label: 'InÃ­cio', value: program.startDate ? new Date(program.startDate).toLocaleDateString('pt-BR') : 'â€”' },
              { icon: Calendar, label: 'Encerramento', value: program.endDate ? new Date(program.endDate).toLocaleDateString('pt-BR') : 'â€”' },
              { icon: Users, label: 'Participantes', value: pParticipants.length ? `${pParticipants.length} cadastrados` : 'â€”' },
              { icon: ClipboardList, label: 'DiagnÃ³sticos', value: pDiagnostics.length ? `${pDiagnostics.length} realizados` : 'â€”' },
              { icon: Activity, label: 'Indicadores', value: pIndicators.length ? `${pIndicators.length} em monitoramento` : 'â€”' },
            ].map((row, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center flex-shrink-0">
                  <row.icon className="w-3.5 h-3.5 text-slate-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{row.label}</p>
                  <p className="text-sm font-semibold text-slate-700 truncate">{row.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Main objective text + next session */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {program.mainObjective && (
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-sky-600" />
              <h4 className="text-sm font-bold text-sky-800">Objetivo Geral do Programa</h4>
            </div>
            <p className="text-sm text-sky-900">{program.mainObjective}</p>
          </div>
        )}

        <div className="bg-gradient-to-br from-blue-50 to-slate-50 border border-blue-100 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-blue-600" />
            <h4 className="text-sm font-bold text-blue-800">PrÃ³xima SessÃ£o</h4>
          </div>
          {nextSession ? (
            <div>
              <p className="text-sm font-bold text-slate-800">{nextSession.title}</p>
              <p className="text-sm text-slate-500 mt-1">
                {new Date(nextSession.date).toLocaleDateString('pt-BR')}
                {nextSession.startTime ? ` Ã s ${nextSession.startTime}` : ''} Â· {nextSession.duration}min
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-400">Nenhuma sessÃ£o agendada.</p>
          )}
        </div>
      </div>
    </div>
  )
}
