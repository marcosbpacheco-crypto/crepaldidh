'use client'

import { useState, useMemo } from 'react'
import { useServices } from './context/ServicesContext'
import { useAdmin } from '@/app/(dashboard)/admin/context/AdminContext'
import { Plus, Search, Briefcase, Pencil, Trash2, X, CheckCircle, Layers, Sparkles } from 'lucide-react'

const CATEGORY_COLORS: Record<string, string> = {
  Assessoria: 'bg-violet-50 text-violet-700 border-violet-200',
  Mentoria: 'bg-blue-50 text-blue-700 border-blue-200',
  Treinamento: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Consultoria: 'bg-amber-50 text-amber-700 border-amber-200',
  DHO: 'bg-rose-50 text-rose-700 border-rose-200',
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  Assessoria: Briefcase,
  Mentoria: Sparkles,
  Treinamento: CheckCircle,
  Consultoria: Layers,
  DHO: Briefcase,
}

const CATEGORIES = ['Assessoria', 'Mentoria', 'Treinamento', 'Consultoria', 'DHO']

interface FormState {
  id?: string
  name: string
  category: string
  description: string
  status: string
}

const emptyForm: FormState = { name: '', category: 'Assessoria', description: '', status: 'ativo' }

export default function ServicesPage() {
  const { services, createService, updateService, deleteService } = useServices()
  const admin = useAdmin()
  const canCreate = admin.checkPermission('services', 'create')
  const canEdit = admin.checkPermission('services', 'edit')
  const canDelete = admin.checkPermission('services', 'delete')

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('todos')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [confirmDelete, setConfirmDelete] = useState<{ id: string; name: string } | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return services.filter(s =>
      (categoryFilter === 'todos' || (s.category ?? '') === categoryFilter) &&
      (!q || s.name.toLowerCase().includes(q) || (s.description ?? '').toLowerCase().includes(q))
    )
  }, [services, search, categoryFilter])

  const byCategory = useMemo(() => {
    const map: Record<string, typeof services> = {}
    filtered.forEach(s => {
      const cat = s.category ?? 'Outros'
      map[cat] = map[cat] || []
      map[cat].push(s)
    })
    return map
  }, [filtered])

  const activeCount = services.filter(s => s.status === 'ativo').length
  const categoriesUsed = CATEGORIES.filter(c => services.some(s => (s.category ?? '') === c))

  const openNew = () => { setForm(emptyForm); setShowForm(true) }
  const openEdit = (s: any) => {
    setForm({ id: s.id, name: s.name, category: s.category ?? 'Assessoria', description: s.description ?? '', status: s.status })
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSubmitting(true)
    try {
      const payload = { name: form.name.trim(), category: form.category, description: form.description.trim(), status: form.status }
      if (form.id) await updateService(form.id, payload)
      else await createService(payload)
      setShowForm(false)
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    await deleteService(confirmDelete.id)
    setConfirmDelete(null)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Serviços</h1>
          <p className="text-slate-500 text-sm mt-0.5">Catálogo de serviços prestados pela CrepaldiDH</p>
        </div>
        {canCreate && (
          <button
            onClick={openNew}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-100 hover:opacity-90 transition-all"
          >
            <Plus className="w-4 h-4" /> Novo Serviço
          </button>
        )}
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {[
          { label: 'Serviços Cadastrados', value: services.length, icon: Briefcase, color: 'violet' },
          { label: 'Ativos', value: activeCount, icon: CheckCircle, color: 'emerald' },
          { label: 'Categorias', value: categoriesUsed.length, icon: Layers, color: 'amber' },
        ].map(kpi => (
          <div key={kpi.label} className="bg-white rounded-2xl p-4 border shadow-sm flex items-center gap-3">
            <div className={`p-2.5 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600`}>
              <kpi.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
              <p className="text-xl font-black text-slate-800">{kpi.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Search + category filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar serviço..."
            className="w-full pl-9 pr-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setCategoryFilter('todos')}
            className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${categoryFilter === 'todos' ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}
          >
            Todos
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'todos' : cat)}
              className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all ${categoryFilter === cat ? 'bg-violet-600 text-white border-violet-600' : 'bg-white text-slate-600 border-slate-200 hover:border-violet-300'}`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Services grouped by category */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center text-slate-400 shadow-sm">
          <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-sm">Nenhum serviço encontrado</p>
          {canCreate && <p className="text-[10px] text-slate-300 mt-1">Clique em "Novo Serviço" para cadastrar</p>}
        </div>
      ) : (
        Object.entries(byCategory).map(([cat, items]) => {
          const Icon = CATEGORY_ICONS[cat] || Briefcase
          return (
            <div key={cat}>
              <div className="flex items-center gap-2 mb-3">
                <span className={`p-1.5 rounded-lg ${CATEGORY_COLORS[cat] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                  <Icon className="w-4 h-4" />
                </span>
                <h3 className="font-bold text-slate-700 text-sm">{cat}</h3>
                <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">{items.length}</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map(s => (
                  <div key={s.id} className="group bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:border-violet-200 hover:shadow-md transition-all">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{s.name}</h4>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {canEdit && (
                          <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg text-slate-400 hover:text-violet-600 hover:bg-violet-50 transition-colors" title="Editar">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                        {canDelete && (
                          <button onClick={() => setConfirmDelete({ id: s.id, name: s.name })} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors" title="Excluir">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    {s.description && <p className="text-[11px] text-slate-500 mt-1.5 leading-relaxed">{s.description}</p>}
                    <div className="mt-3 flex items-center justify-between">
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${s.status === 'ativo' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                        {s.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </span>
                      <span className="text-[9px] text-slate-300 font-semibold">{cat}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}

      {/* FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">{form.id ? 'Editar Serviço' : 'Novo Serviço'}</h2>
                <p className="text-sm text-slate-500">{form.id ? 'Altere os dados do serviço' : 'Cadastre um novo serviço no catálogo'}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Serviço *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Assessment de Lideranças" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Categoria</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Descreva o serviço..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 disabled:opacity-50">
                  {submitting ? 'Salvando...' : form.id ? 'Salvar Alterações' : 'Criar Serviço'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRM */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-slate-800">Excluir serviço</h3>
            <p className="text-sm text-slate-500 mt-2">Deseja realmente excluir o serviço <b>{confirmDelete.name}</b>? Ele será removido do catálogo.</p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
                Cancelar
              </button>
              <button onClick={handleDelete}
                className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold hover:bg-red-700">
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}