'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { Calendar, Plus, Pencil, Trash2, Clock } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  agendada: 'Agendada',
  realizada: 'Realizada',
  cancelada: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  agendada: 'bg-blue-100 text-blue-700',
  realizada: 'bg-emerald-100 text-emerald-700',
  cancelada: 'bg-red-100 text-red-700',
}

const emptyForm = {
  sessionNumber: 1,
  title: '',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  duration: 60,
  theme: '',
  objective: '',
  topics: '',
  summary: '',
  keyPoints: '',
  decisions: '',
  definedActions: '',
  privateObservations: '',
  status: 'agendada',
  nextSession: '',
}

export default function SessionsTab({ program }: { program: MentoringProgram }) {
  const { addSession, updateSession, deleteSession } = useMentoring()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const sessions = [...(Array.isArray(program.sessions) ? program.sessions : [])]
    .sort((a, b) => a.date.localeCompare(b.date))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime || undefined,
      duration: Number(form.duration) || 60,
      sessionNumber: Number(form.sessionNumber) || sessions.length + 1,
      type: 'individual' as const,
      programId: program.id,
      theme: form.theme.trim() || undefined,
      objective: form.objective.trim() || undefined,
      topics: form.topics.trim() || undefined,
      summary: form.summary.trim() || undefined,
      keyPoints: form.keyPoints.trim() || undefined,
      decisions: form.decisions.trim() || undefined,
      definedActions: form.definedActions.trim() || undefined,
      privateObservations: form.privateObservations.trim() || undefined,
      status: form.status as any,
      nextSession: form.nextSession || undefined,
    }
    if (editingId) {
      updateSession(editingId, payload)
    } else {
      addSession(payload)
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const startEdit = (s: any) => {
    setEditingId(s.id)
    setForm({
      sessionNumber: s.sessionNumber || 1,
      title: s.title || '',
      date: s.date || new Date().toISOString().split('T')[0],
      startTime: s.startTime || '09:00',
      duration: s.duration || 60,
      theme: s.theme || '',
      objective: s.objective || '',
      topics: s.topics || '',
      summary: s.summary || '',
      keyPoints: s.keyPoints || '',
      decisions: s.decisions || '',
      definedActions: s.definedActions || '',
      privateObservations: s.privateObservations || '',
      status: s.status || 'agendada',
      nextSession: s.nextSession || '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-bold text-slate-800">Sessões</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{sessions.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Agende e registre cada sessão da mentoria</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ ...emptyForm, sessionNumber: sessions.length + 1 }) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> Agendar Sessão
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700">{editingId ? 'Editar Sessão' : 'Nova Sessão'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Nº Sessão</span>
              <input type="number" min={1} value={form.sessionNumber} onChange={e => setForm({ ...form, sessionNumber: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Título *</span>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: 1ª Sessão — Diagnóstico"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Data</span>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Horário</span>
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Duração (min)</span>
              <input type="number" min={5} value={form.duration} onChange={e => setForm({ ...form, duration: Number(e.target.value) })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Tema</span>
              <input value={form.theme} onChange={e => setForm({ ...form, theme: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-3">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Objetivo da Sessão</span>
              <input value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-3">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Tópicos</span>
              <textarea value={form.topics} onChange={e => setForm({ ...form, topics: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-3">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Resumo</span>
              <textarea value={form.summary} onChange={e => setForm({ ...form, summary: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-3">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Principais Pontos</span>
              <textarea value={form.keyPoints} onChange={e => setForm({ ...form, keyPoints: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-3">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Decisões</span>
              <textarea value={form.decisions} onChange={e => setForm({ ...form, decisions: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-3">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Ações Definidas</span>
              <textarea value={form.definedActions} onChange={e => setForm({ ...form, definedActions: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-3">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Observações Privadas do Mentor</span>
              <textarea value={form.privateObservations} onChange={e => setForm({ ...form, privateObservations: e.target.value })} rows={2}
                placeholder="Visível apenas para o mentor..."
                className="w-full px-4 py-2.5 border border-amber-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-200 bg-amber-50/30" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Próxima Sessão</span>
              <input type="date" value={form.nextSession} onChange={e => setForm({ ...form, nextSession: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Status</span>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
              {editingId ? 'Salvar Alterações' : 'Agendar Sessão'}
            </button>
          </div>
        </form>
      )}

      {sessions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhuma sessão registrada</p>
          <p className="text-xs text-slate-400 mt-1">Agende a primeira sessão desta mentoria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {sessions.map(s => (
            <div key={s.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${s.status === 'realizada' ? 'bg-emerald-100' : s.status === 'agendada' ? 'bg-blue-100' : 'bg-red-100'}`}>
                    <Calendar className={`w-4 h-4 ${s.status === 'realizada' ? 'text-emerald-600' : s.status === 'agendada' ? 'text-blue-600' : 'text-red-600'}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {s.sessionNumber && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">Sessão {s.sessionNumber}</span>
                      )}
                      <h4 className="text-sm font-bold text-slate-800">{s.title}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[s.status] || s.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                      <span>{new Date(s.date).toLocaleDateString('pt-BR')}</span>
                      {s.startTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {s.startTime}</span>}
                      <span>{s.duration}min</span>
                      {s.theme && <span className="font-semibold text-slate-500">· {s.theme}</span>}
                    </div>
                    {s.objective && <p className="text-xs text-slate-500 mt-1"><span className="font-semibold text-slate-500">Objetivo:</span> {s.objective}</p>}
                    {s.summary && <p className="text-xs text-slate-500 mt-1.5">{s.summary}</p>}
                    {s.keyPoints && (
                      <div className="mt-2 p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Principais pontos</p>
                        <p className="text-xs text-slate-600 whitespace-pre-line">{s.keyPoints}</p>
                      </div>
                    )}
                    {s.decisions && (
                      <div className="mt-2 p-3 rounded-xl bg-emerald-50/50 border border-emerald-100">
                        <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1">Decisões</p>
                        <p className="text-xs text-emerald-800 whitespace-pre-line">{s.decisions}</p>
                      </div>
                    )}
                    {s.definedActions && (
                      <div className="mt-2 p-3 rounded-xl bg-blue-50/50 border border-blue-100">
                        <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider mb-1">Ações definidas</p>
                        <p className="text-xs text-blue-800 whitespace-pre-line">{s.definedActions}</p>
                      </div>
                    )}
                    {s.nextSession && (
                      <p className="text-xs text-slate-500 mt-2">📅 Próxima sessão: {new Date(s.nextSession).toLocaleDateString('pt-BR')}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(s)} className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirm('Excluir esta sessão?') && deleteSession(s.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
