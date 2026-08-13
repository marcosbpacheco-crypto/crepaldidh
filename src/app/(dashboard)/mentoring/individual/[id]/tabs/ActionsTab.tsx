'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { ListChecks, Plus, Pencil, Trash2 } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  pendente: 'Pendente',
  em_andamento: 'Em Andamento',
  concluida: 'Concluída',
  atrasada: 'Atrasada',
  cancelada: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-slate-100 text-slate-600',
  em_andamento: 'bg-blue-100 text-blue-700',
  concluida: 'bg-emerald-100 text-emerald-700',
  atrasada: 'bg-red-100 text-red-700',
  cancelada: 'bg-slate-100 text-slate-400',
}

const PRIORITIES = ['alta', 'media', 'baixa']

const emptyForm = {
  objectiveId: '',
  description: '',
  responsible: '',
  deadline: '',
  priority: 'media',
  status: 'pendente',
  evidence: '',
  comment: '',
}

export default function ActionsTab({ program }: { program: MentoringProgram }) {
  const { addAction, updateAction, deleteAction } = useMentoring()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const objectives = Array.isArray(program.objectives) ? program.objectives : []
  const actions = [...(Array.isArray(program.actions) ? program.actions : [])]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.description.trim()) return
    const payload = {
      description: form.description.trim(),
      objectiveId: form.objectiveId || undefined,
      responsible: form.responsible.trim() || undefined,
      deadline: form.deadline || undefined,
      priority: form.priority,
      status: form.status as any,
      evidence: form.evidence.trim() || undefined,
      comment: form.comment.trim() || undefined,
      completedDate: form.status === 'concluida' ? new Date().toISOString().split('T')[0] : undefined,
    }
    if (editingId) {
      updateAction(editingId, payload)
    } else {
      addAction({ ...payload, programId: program.id })
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const startEdit = (a: any) => {
    setEditingId(a.id)
    setForm({
      objectiveId: a.objectiveId || '',
      description: a.description || '',
      responsible: a.responsible || '',
      deadline: a.deadline || '',
      priority: a.priority || 'media',
      status: a.status || 'pendente',
      evidence: a.evidence || '',
      comment: a.comment || '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-bold text-slate-800">Ações da Mentoria</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{actions.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Ações vinculadas aos objetivos — substituem o PDI</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> Nova Ação
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700">{editingId ? 'Editar Ação' : 'Nova Ação'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Descrição *</span>
              <input required value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Ex: Criar plano de comunicação semanal"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Objetivo vinculado</span>
              <select value={form.objectiveId} onChange={e => setForm({ ...form, objectiveId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                <option value="">Sem vínculo...</option>
                {objectives.map(o => <option key={o.id} value={o.id}>{o.title}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Responsável</span>
              <input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Prazo</span>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Prioridade</span>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Status</span>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Evidência</span>
              <input value={form.evidence} onChange={e => setForm({ ...form, evidence: e.target.value })}
                placeholder="Link ou referência da evidência"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Comentário</span>
              <textarea value={form.comment} onChange={e => setForm({ ...form, comment: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
              {editingId ? 'Salvar Alterações' : 'Criar Ação'}
            </button>
          </div>
        </form>
      )}

      {actions.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <ListChecks className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhuma ação cadastrada</p>
          <p className="text-xs text-slate-400 mt-1">Crie ações para colocar os objetivos em prática.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {actions.map(a => {
            const obj = objectives.find(o => o.id === a.objectiveId)
            return (
              <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${a.status === 'concluida' ? 'bg-emerald-100' : a.status === 'atrasada' ? 'bg-red-100' : 'bg-violet-100'}`}>
                      <ListChecks className={`w-4 h-4 ${a.status === 'concluida' ? 'text-emerald-600' : a.status === 'atrasada' ? 'text-red-600' : 'text-violet-600'}`} />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-800">{a.description}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[a.status] || 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABELS[a.status] || a.status}
                        </span>
                        {a.priority && (
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${a.priority === 'alta' ? 'bg-red-50 text-red-600' : a.priority === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                            {a.priority}
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-1.5 text-[11px] text-slate-400">
                        {obj && <span><span className="font-semibold text-slate-500">Objetivo:</span> {obj.title}</span>}
                        {a.responsible && <span><span className="font-semibold text-slate-500">Resp.:</span> {a.responsible}</span>}
                        {a.deadline && <span><span className="font-semibold text-slate-500">Prazo:</span> {new Date(a.deadline).toLocaleDateString('pt-BR')}</span>}
                        {a.completedDate && <span className="text-emerald-600 font-semibold">Concluída em {new Date(a.completedDate).toLocaleDateString('pt-BR')}</span>}
                      </div>
                      {a.evidence && <p className="text-xs text-slate-500 mt-1.5">📎 {a.evidence}</p>}
                      {a.comment && <p className="text-xs text-slate-400 italic mt-1">{a.comment}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(a)} className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => confirm('Excluir esta ação?') && deleteAction(a.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
