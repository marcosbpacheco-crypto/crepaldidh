'use client'

import { useState } from 'react'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { Plus, X, Search, CheckCircle2, Circle, Calendar, Flag, User, Building2, Trash2 } from 'lucide-react'

export default function TasksPage() {
  const { tasks, companies, addTask, toggleTaskStatus, deleteTask } = useCrm()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'completed'>('all')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ companyId: '', title: '', dueDate: '', priority: 'medium' as 'high' | 'medium' | 'low' })

  const filtered = tasks.filter(t => {
    if (filterStatus === 'pending' && t.status !== 'pending') return false
    if (filterStatus === 'completed' && t.status !== 'completed') return false
    if (search) {
      const s = search.toLowerCase()
      const comp = companies.find(c => c.id === t.companyId)
      return t.title.toLowerCase().includes(s) || comp?.name.toLowerCase().includes(s) || false
    }
    return true
  }).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())

  const pendingCount = tasks.filter(t => t.status === 'pending').length
  const overdueCount = tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < new Date()).length

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title || !form.companyId || !form.dueDate) return
    addTask({ companyId: form.companyId, title: form.title, dueDate: form.dueDate, priority: form.priority })
    setForm({ companyId: '', title: '', dueDate: '', priority: 'medium' })
    setShowForm(false)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tarefas</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie tarefas operacionais vinculadas a empresas</p>
        </div>
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90">
          <Plus className="w-4 h-4" /> Nova Tarefa
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total de Tarefas', value: tasks.length, color: 'bg-slate-100 text-slate-700' },
          { label: 'Pendentes', value: pendingCount, color: 'bg-amber-50 text-amber-700' },
          { label: 'Atrasadas', value: overdueCount, color: 'bg-red-50 text-red-700' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
            <p className={`text-2xl font-black mt-1 ${kpi.color.split(' ')[1]}`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tarefas..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs" />
        </div>
        <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          {(['all', 'pending', 'completed'] as const).map(f => (
            <button key={f} onClick={() => setFilterStatus(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${filterStatus === f ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>
              {f === 'all' ? 'Todas' : f === 'pending' ? 'Pendentes' : 'Concluídas'}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-slate-200 mx-auto mb-2" />
            <p className="text-sm font-medium">Nenhuma tarefa encontrada</p>
            <p className="text-xs text-slate-300 mt-1">Crie uma nova tarefa para começar</p>
          </div>
        ) : filtered.map(t => {
          const comp = companies.find(c => c.id === t.companyId)
          const isOverdue = t.status === 'pending' && new Date(t.dueDate) < new Date()
          return (
            <div key={t.id} className={`bg-white rounded-2xl border p-4 shadow-sm flex items-center gap-4 transition-all hover:shadow-md ${isOverdue ? 'border-red-200' : 'border-slate-100'}`}>
              <button onClick={() => toggleTaskStatus(t.id)} className="flex-shrink-0">
                {t.status === 'completed' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <Circle className="w-5 h-5 text-slate-300 hover:text-violet-400" />}
              </button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm font-bold ${t.status === 'completed' ? 'text-slate-400 line-through' : 'text-slate-800'}`}>{t.title}</p>
                  <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded ${
                    t.priority === 'high' ? 'bg-red-50 text-red-700' :
                    t.priority === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-500'
                  }`}>{t.priority}</span>
                  {isOverdue && <span className="px-1.5 py-0.5 text-[9px] font-bold uppercase rounded bg-red-50 text-red-700">Atrasada</span>}
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-400">
                  {comp && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" /> {comp.name}</span>}
                  <span className={`flex items-center gap-1 ${isOverdue ? 'text-red-500 font-semibold' : ''}`}>
                    <Calendar className="w-3 h-3" /> {new Date(t.dueDate).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
              <button onClick={() => deleteTask(t.id)} className="p-1.5 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div><h2 className="text-lg font-bold text-slate-800">Nova Tarefa</h2><p className="text-sm text-slate-500">Vincule a uma empresa</p></div>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Empresa *</label>
                <select required value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="">Selecione...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Título da Tarefa *</label>
                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                  placeholder="Ex: Enviar proposta comercial" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data de Vencimento *</label>
                  <input required type="date" value={form.dueDate} onChange={e => setForm({ ...form, dueDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Prioridade</label>
                  <select value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">Criar Tarefa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
