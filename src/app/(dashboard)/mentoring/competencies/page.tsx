'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import { BookOpen, Plus, Search, Trash2, ShieldCheck, Tag } from 'lucide-react'

export default function CompetenciesPage() {
  const { competencies, addCompetency, deleteCompetency } = useMentoring()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    name: '',
    category: 'Geral',
    description: '',
  })

  const filtered = competencies.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.category.toLowerCase().includes(search.toLowerCase()) ||
    c.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addCompetency({
      name: form.name,
      category: form.category,
      description: form.description,
      isCustom: true,
    })
    setShowForm(false)
    setForm({ name: '', category: 'Geral', description: '' })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Biblioteca de Competências</h1>
          <p className="text-slate-500 text-sm mt-0.5">Dicionário de habilidades técnicas e socioemocionais para mapeamento</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-md shadow-violet-200 hover:opacity-90 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nova Competência
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar competência por nome, descrição ou categoria..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white shadow-sm"
        />
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(comp => (
          <div key={comp.id} className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md uppercase tracking-wider">
                  {comp.category}
                </span>
                <h3 className="font-bold text-slate-800 text-base mt-2">{comp.name}</h3>
              </div>

              {comp.isCustom ? (
                <button
                  onClick={() => deleteCompetency(comp.id)}
                  className="p-1.5 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              ) : (
                <span title="Competência nativa do sistema">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                </span>
              )}
            </div>

            <p className="text-sm text-slate-600 leading-relaxed">
              {comp.description || 'Nenhuma descrição fornecida para esta competência.'}
            </p>
          </div>
        ))}
      </div>

      {/* New Competency Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md font-sans" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Nova Competência</h2>
              <p className="text-sm text-slate-500">Adicione uma habilidade personalizada ao dicionário global</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nome da Competência *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Ex: Foco no Cliente" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Categoria *</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                  <option value="Geral">Geral</option>
                  <option value="Comportamental">Comportamental</option>
                  <option value="Interpessoal">Interpessoal</option>
                  <option value="Produtividade">Produtividade</option>
                  <option value="Gestão">Gestão/Liderança</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Descrição detalhada</label>
                <textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" placeholder="Ex: Capacidade de focar na excelência de atendimento e resolução de dores do cliente..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
                  Criar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
