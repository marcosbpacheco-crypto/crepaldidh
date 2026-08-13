'use client'

import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { History, Calendar, Target, ListChecks, Star, FileText, User } from 'lucide-react'

const ACTION_ICONS: Record<string, any> = {
  program: User,
  objective: Target,
  action: ListChecks,
  session: Calendar,
  feedback: Star,
  document: FileText,
}

export default function HistoryTab({ program }: { program: MentoringProgram }) {
  const { history } = useMentoring()

  const pHistory = [...(Array.isArray(program.history) ? program.history : history.filter(h => h.programId === program.id))]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-bold text-slate-800">Histórico da Mentoria</h3>
        </div>
        <p className="text-xs text-slate-400 mt-1">Registro de eventos e auditoria do programa</p>
      </div>

      {pHistory.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <History className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum evento registrado</p>
          <p className="text-xs text-slate-400 mt-1">As ações realizadas na mentoria aparecerão aqui.</p>
        </div>
      ) : (
        <div className="relative pl-6 space-y-6">
          <div className="absolute left-[11px] top-1 bottom-1 w-0.5 bg-slate-100" />
          {pHistory.map(h => {
            const Icon = ACTION_ICONS[h.entityType || 'program'] || History
            return (
              <div key={h.id} className="relative">
                <div className={`absolute -left-6 w-6 h-6 rounded-full flex items-center justify-center ${h.action === 'criado' ? 'bg-emerald-100' : 'bg-violet-100'} ring-4 ring-white`}>
                  <Icon className={`w-3 h-3 ${h.action === 'criado' ? 'text-emerald-600' : 'text-violet-600'}`} />
                </div>
                <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-slate-800">{h.action || h.entityType || 'Evento'}</p>
                    <span className="text-[11px] text-slate-400 flex-shrink-0">
                      {new Date(h.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                  {h.description && <p className="text-xs text-slate-500 mt-1">{h.description}</p>}
                  {h.createdBy && <p className="text-[11px] text-slate-400 mt-1">por {h.createdBy}</p>}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
