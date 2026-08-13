'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { Target, Plus, Pencil, Trash2 } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  nao_iniciado: 'Não Iniciado',
  em_andamento: 'Em Andamento',
  em_atencao: 'Em Atenção',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
}

const STATUS_COLORS: Record<string, string> = {
  nao_iniciado: 'bg-slate-100 text-slate-600',
  em_andamento: 'bg-blue-100 text-blue-700',
  em_atencao: 'bg-amber-100 text-amber-700',
  concluido: 'bg-emerald-100 text-emerald-700',
  cancelado: 'bg-red-100 text-red-700',
}

const CATEGORIES = ['Liderança', 'Comunicação', 'Gestão', 'Carreira', 'Comportamento', 'Produtividade', 'Tomada de Decisão', 'Relacionamento', 'Estratégia', 'Outro']
const PRIORITIES = ['alta', 'media', 'baixa']

const emptyForm = {
  title: '',
  description: '',
  category: 'Liderança',
  priority: 'media',
  indicator: '',
  goal: '',
  deadline: '',
  status: 'nao_iniciado',
  responsible: '',
  observations: '',
}

export default function ObjectivesTab({ program }: { program: MentoringProgram }) {
  const { addObjective, updateObjective, deleteObjective } = useMentoring()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState(emptyForm)

  const objectives = [...(Array.isArray(program.objectives) ? program.objectives : [])]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    const payload = {
      title: form.title.trim(),
      description: form.description.trim() || undefined,
      category: form.category,
      priority: form.priority,
      indicator: form.indicator.trim() || undefined,
      goal: form.goal.trim() || undefined,
      deadline: form.deadline || undefined,
      status: form.status as any,
      responsible: form.responsible.trim() || undefined,
      observations: form.observations.trim() || undefined,
    }
    if (editingId) {
      updateObjective(editingId, { ...payload, progress: form.status === 'concluido' ? 100 : undefined })
    } else {
      addObjective({ ...payload, programId: program.id, progress: 0 })
    }
    setShowForm(false)
    setEditingId(null)
    setForm(emptyForm)
  }

  const startEdit = (o: any) => {
    setEditingId(o.id)
    setForm({
      title: o.title || '',
      description: o.description || '',
      category: o.category || 'Liderança',
      priority: o.priority || 'media',
      indicator: o.indicator || '',
      goal: o.goal || '',
      deadline: o.deadline || '',
      status: o.status || 'nao_iniciado',
      responsible: o.responsible || '',
      observations: o.observations || '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-bold text-slate-800">Objetivos da Mentoria</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{objectives.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Metas com indicadores, prazos e responsáveis — substituem o PDI</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm(emptyForm) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> Novo Objetivo
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700">{editingId ? 'Editar Objetivo' : 'Novo Objetivo'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Título *</span>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                placeholder="Ex: Desenvolver comunicação assertiva"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Descrição</span>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Categoria</span>
              <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Prioridade</span>
              <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Indicador</span>
              <input value={form.indicator} onChange={e => setForm({ ...form, indicator: e.target.value })}
                placeholder="Ex: % de reuniões com feedback"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Meta</span>
              <input value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}
                placeholder="Ex: 80%"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Prazo</span>
              <input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Status</span>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Responsável</span>
              <input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Observações</span>
              <input value={form.observations} onChange={e => setForm({ ...form, observations: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
              {editingId ? 'Salvar Alterações' : 'Criar Objetivo'}
            </button>
          </div>
        </form>
      )}

      {objectives.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum objetivo cadastrado</p>
          <p className="text-xs text-slate-400 mt-1">Crie objetivos para acompanhar a evolução da mentoria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {objectives.map(o => (
            <div key={o.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <Target className="w-4 h-4 text-violet-600" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-bold text-slate-800">{o.title}</h4>
                      {o.category && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{o.category}</span>
                      )}
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_COLORS[o.status] || 'bg-slate-100 text-slate-600'}`}>
                        {STATUS_LABELS[o.status] || o.status}
                      </span>
                      {o.priority && (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${o.priority === 'alta' ? 'bg-red-50 text-red-600' : o.priority === 'media' ? 'bg-amber-50 text-amber-600' : 'bg-slate-50 text-slate-500'}`}>
                          {o.priority}
                        </span>
                      )}
                    </div>
                    {o.description && <p className="text-xs text-slate-500 mt-1">{o.description}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-[11px] text-slate-400">
                      {o.indicator && <span><span className="font-semibold text-slate-500">Indicador:</span> {o.indicator}</span>}
                      {o.goal && <span><span className="font-semibold text-slate-500">Meta:</span> {o.goal}</span>}
                      {o.deadline && <span><span className="font-semibold text-slate-500">Prazo:</span> {new Date(o.deadline).toLocaleDateString('pt-BR')}</span>}
                      {o.responsible && <span><span className="font-semibold text-slate-500">Resp.:</span> {o.responsible}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(o)} className="p-2 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => confirm('Excluir este objetivo?') && deleteObjective(o.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-3">
                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all" style={{ width: `${o.progress || 0}%` }} />
                </div>
                <span className="text-xs font-bold text-slate-500">{o.progress || 0}%</span>
              </div>
              {o.observations && <p className="text-xs text-slate-400 italic mt-2">{o.observations}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
