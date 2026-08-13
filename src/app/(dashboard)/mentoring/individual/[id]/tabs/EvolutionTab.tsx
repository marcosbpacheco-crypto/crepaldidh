'use client'

import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { TrendingUp, Target, Star, Clock, CheckCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  nao_iniciado: 'bg-slate-100 text-slate-600',
  em_andamento: 'bg-blue-100 text-blue-700',
  em_atencao: 'bg-amber-100 text-amber-700',
  concluido: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: 'Não Iniciado',
  em_andamento: 'Em Andamento',
  em_atencao: 'Em Atenção',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

export default function EvolutionTab({ program }: { program: MentoringProgram }) {
  const { participants } = useMentoring()

  const pObjectives = Array.isArray(program.objectives) ? program.objectives : []
  const pActions = Array.isArray(program.actions) ? program.actions : []
  const pSessions = Array.isArray(program.sessions) ? program.sessions : []
  const pFeedbacks = Array.isArray(program.feedbacks) ? program.feedbacks : []

  const doneObjectives = pObjectives.filter(o => o.status === 'concluido').length
  const doneActions = pActions.filter(a => a.status === 'concluida').length
  const doneSessions = pSessions.filter(s => s.status === 'realizada').length
  const pct = pObjectives.length > 0 ? Math.round((doneObjectives / pObjectives.length) * 100) : (program.progress || 0)

  const avgOf = (key: 'satisfaction' | 'relevance' | 'applicability' | 'evolutionPerceived') => {
    const vals = pFeedbacks.map(f => f[key]).filter((v): v is number => v !== null && v !== undefined)
    return vals.length ? (vals.reduce((s, v) => s + v, 0) / vals.length).toFixed(1) : null
  }

  const evolutionCards = [
    { label: 'Progresso geral', value: `${pct}%`, icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
    { label: 'Objetivos concluídos', value: `${doneObjectives}/${pObjectives.length}`, icon: Target, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Ações concluídas', value: `${doneActions}/${pActions.length}`, icon: CheckCircle, color: 'text-blue-600 bg-blue-50' },
    { label: 'Satisfação média', value: avgOf('satisfaction') ?? '—', icon: Star, color: 'text-amber-600 bg-amber-50' },
    { label: 'Relevância média', value: avgOf('relevance') ?? '—', icon: Star, color: 'text-pink-600 bg-pink-50' },
    { label: 'Evolução percebida', value: avgOf('evolutionPerceived') ?? '—', icon: Clock, color: 'text-indigo-600 bg-indigo-50' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-bold text-slate-800">Evolução da Mentoria</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">Acompanhe o progresso de objetivos, ações e percepções</p>
      </div>

      {/* Overall progress */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-slate-600">Progresso da mentoria</p>
          <span className="text-2xl font-bold text-violet-700">{pct}%</span>
        </div>
        <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-slate-400 mt-2">{doneSessions}/{pSessions.length} sessões realizadas</p>
      </div>

      {/* Evolution cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {evolutionCards.map(c => (
          <div key={c.label} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${c.color}`}>
              <c.icon className="w-4 h-4" />
            </div>
            <p className="text-xl font-bold text-slate-800 leading-none">{c.value}</p>
            <p className="text-[11px] font-medium text-slate-400 mt-1">{c.label}</p>
          </div>
        ))}
      </div>

      {/* Objectives breakdown */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-violet-600" />
          <h4 className="text-sm font-bold text-slate-800">Evolução por Objetivo</h4>
        </div>
        {pObjectives.length === 0 ? (
          <p className="text-sm text-slate-400">Nenhum objetivo cadastrado.</p>
        ) : (
          <div className="space-y-4">
            {pObjectives.map(o => (
              <div key={o.id}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-semibold text-slate-700 truncate">{o.title}</p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[o.status] || o.status}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-slate-500 flex-shrink-0">{o.progress || 0}%</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${o.status === 'concluido' ? 'bg-emerald-500' : o.status === 'em_atencao' ? 'bg-amber-500' : 'bg-violet-500'}`}
                    style={{ width: `${o.progress || 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Mentorado note */}
      {program.menteeName && (
        <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-6">
          <p className="text-sm text-violet-900">
            <span className="font-bold">{program.menteeName}</span>
            {program.menteeRole ? ` · ${program.menteeRole}` : ''}
            {program.menteeDepartment ? ` · ${program.menteeDepartment}` : ''} — acompanhado{' '}
            {program.startDate ? `desde ${new Date(program.startDate).toLocaleDateString('pt-BR')}` : ''}
            {' '}em mentoria individual.
          </p>
        </div>
      )}
    </div>
  )
}
