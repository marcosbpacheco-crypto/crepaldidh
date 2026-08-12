'use client'

import { useState } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import { TIMELINE_STAGES, type TrainingTimelineStep, type TimelineStageStatus } from '@/types/trainings'
import { Check, Clock, ChevronDown, CalendarPlus } from 'lucide-react'

const STATUS_LABEL: Record<TimelineStageStatus, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em andamento',
  concluido: 'Concluído',
  bloqueado: 'Bloqueado',
}

export default function TimelineManager({ eventId }: { eventId: string }) {
  const { timelineSteps, addTimelineStep, updateTimelineStep } = useTrainings()
  const [open, setOpen] = useState(false)

  const steps = TIMELINE_STAGES.map(stage => {
    const existing = timelineSteps.find(t => t.eventId === eventId && t.stage === stage.key)
    return { stage, step: existing }
  })

  const ensureStep = (stageKey: string) => {
    if (!timelineSteps.some(t => t.eventId === eventId && t.stage === stageKey)) {
      addTimelineStep({
        eventId,
        stage: stageKey,
        title: TIMELINE_STAGES.find(s => s.key === stageKey)?.title || stageKey,
        status: 'pendente',
        sortOrder: TIMELINE_STAGES.findIndex(s => s.key === stageKey),
      })
    }
  }

  const setStatus = (step: TrainingTimelineStep, status: TimelineStageStatus) => {
    updateTimelineStep(step.id, {
      status,
      completedDate: status === 'concluido' ? new Date().toISOString().split('T')[0] : undefined,
    })
  }

  const doneCount = steps.filter(s => s.step?.status === 'concluido').length

  return (
    <div className="border border-slate-100 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50/60 hover:bg-slate-50 text-left transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Clock className="w-4 h-4 text-violet-600" />
          <span className="text-xs font-bold text-slate-700">Linha do Tempo do Evento</span>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
            {doneCount}/{TIMELINE_STAGES.length} etapas
          </span>
        </div>
        <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div className="p-4 space-y-2.5">
          {steps.map(({ stage, step }, idx) => (
            <div key={stage.key} className="flex items-start gap-3">
              <div className="flex flex-col items-center">
                <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 ${
                  step?.status === 'concluido'
                    ? 'border-emerald-400 bg-emerald-500 text-white'
                    : step?.status === 'em_andamento'
                    ? 'border-amber-400 bg-amber-400 text-white'
                    : 'border-slate-200 bg-white text-slate-400'
                }`}>
                  {step?.status === 'concluido' ? <Check className="w-3.5 h-3.5" /> : <span className="text-[10px] font-black">{idx + 1}</span>}
                </div>
                {idx < steps.length - 1 && <div className="w-0.5 flex-1 min-h-6 bg-slate-100" />}
              </div>

              <div className="flex-1 pb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{stage.title}</p>
                    {step?.plannedDate && (
                      <p className="text-[10px] text-slate-400 flex items-center gap-1">
                        <CalendarPlus className="w-3 h-3" /> Previsto para {new Date(step.plannedDate + 'T12:00:00').toLocaleDateString('pt-BR')}
                      </p>
                    )}
                  </div>

                  {!step ? (
                    <button
                      type="button"
                      onClick={() => ensureStep(stage.key)}
                      className="text-[10px] font-bold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-500 hover:border-violet-300 hover:text-violet-600 transition-colors"
                    >
                      + Iniciar etapa
                    </button>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <input
                        type="date"
                        value={step.plannedDate || ''}
                        onChange={e => updateTimelineStep(step.id, { plannedDate: e.target.value })}
                        className="text-[10px] px-2 py-1 border border-slate-200 rounded-lg bg-white text-slate-600 w-[130px]"
                      />
                      <select
                        value={step.status}
                        onChange={e => setStatus(step, e.target.value as TimelineStageStatus)}
                        className="text-[10px] font-bold px-2 py-1 rounded-lg border border-slate-200 bg-white text-slate-600"
                      >
                        {(Object.keys(STATUS_LABEL) as TimelineStageStatus[]).map(s => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                      <div className={`w-2 h-2 rounded-full ${step.status === 'concluido' ? 'bg-emerald-500' : step.status === 'em_andamento' ? 'bg-amber-500' : step.status === 'bloqueado' ? 'bg-red-400' : 'bg-slate-300'}`} />
                    </div>
                  )}
                </div>

                {step?.notes && <p className="text-[10px] text-slate-500 mt-1">{step.notes}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}