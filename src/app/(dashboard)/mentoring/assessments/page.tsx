'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import {
  BarChart3, Plus, Search, Calendar, User, Compass,
  TrendingUp, Star, Award, ShieldAlert
} from 'lucide-react'

export default function AssessmentsPage() {
  const { assessments, participants, competencies } = useMentoring()
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('all')

  const filtered = selectedParticipantId === 'all'
    ? assessments
    : assessments.filter(a => a.participantId === selectedParticipantId)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Avaliações Comportamentais</h1>
          <p className="text-slate-500 text-sm mt-0.5">Visão consolidada de autoavaliações, feedbacks de líderes, 180° e 360°</p>
        </div>
      </div>

      {/* Filter and stats */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center bg-white p-4 border border-slate-100 rounded-2xl shadow-sm">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <User className="w-4 h-4 text-slate-400" />
          <select
            value={selectedParticipantId}
            onChange={e => setSelectedParticipantId(e.target.value)}
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 w-full sm:w-64 cursor-pointer font-semibold text-slate-700"
          >
            <option value="all">Todos os Participantes</option>
            {participants.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-4 text-xs font-semibold text-slate-500 flex-wrap">
          <span>Autoavaliações: {assessments.filter(a => a.type === 'autoavaliacao').length}</span>
          <span>Líderes: {assessments.filter(a => a.type === 'lider').length}</span>
          <span>180°: {assessments.filter(a => a.type === '180').length}</span>
          <span>360°: {assessments.filter(a => a.type === '360').length}</span>
        </div>
      </div>

      {/* List / Cards of Assessments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtered.map(ass => {
          const p = participants.find(part => part.id === ass.participantId)
          return (
            <div key={ass.id} className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <div>
                  <span className="text-xs font-bold px-2.5 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 rounded-md uppercase tracking-wider">
                    {ass.type}
                  </span>
                  <h3 className="font-bold text-slate-800 text-base mt-2">{p?.name || 'Participante'}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">{p?.role} · {p?.companyName}</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-400 block">{new Date(ass.date).toLocaleDateString('pt-BR')}</span>
                </div>
              </div>

              {/* Competency scores */}
              <div className="space-y-3">
                {ass.competencyScores.map(score => {
                  const comp = competencies.find(c => c.id === score.competencyId)
                  return (
                    <div key={score.competencyId} className="space-y-1.5">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-600 font-semibold">{comp?.name || 'Competência'}</span>
                        <span className="font-bold text-slate-800">{score.score}/5</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${score.score >= 4 ? 'bg-emerald-500' : score.score >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}
                          style={{ width: `${(score.score / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {ass.observations && (
                <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed mt-2">
                  <span className="font-bold text-slate-700 block mb-1">Observações do Avaliador:</span>
                  {ass.observations}
                </div>
              )}
            </div>
          )
        })}

        {filtered.length === 0 && (
          <div className="col-span-full text-center py-16 bg-white border border-slate-100 rounded-2xl">
            <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-500 font-medium">Nenhuma avaliação encontrada</p>
            <p className="text-slate-400 text-sm mt-1">Crie avaliações na aba correspondente do perfil de um participante</p>
          </div>
        )}
      </div>
    </div>
  )
}
