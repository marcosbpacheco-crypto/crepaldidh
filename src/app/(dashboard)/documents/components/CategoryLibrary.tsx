'use client'

import { useState, useMemo } from 'react'
import { useDocuments } from '../context/DocumentContext'
import { FileText, Search, Plus } from 'lucide-react'

const CATEGORY_LABELS: Record<string, string> = {
  modelos: 'Modelo', materiais: 'Material', formularios: 'Formulário',
  avaliacoes: 'Avaliação', relatorios: 'Relatório', outros: 'Documento',
}

export default function CategoryLibrary({ category, label }: { category: string, label: string }) {
  const { documents } = useDocuments()
  const [search, setSearch] = useState('')

  const filteredDocs = useMemo(() => {
    return documents.filter(d => d.category === category && d.name.toLowerCase().includes(search.toLowerCase()))
  }, [documents, category, search])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
        <h2 className="text-lg font-bold text-slate-800">{label}</h2>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-56 pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs" />
          </div>
          <button className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"><Plus className="w-4 h-4" /> Novo {CATEGORY_LABELS[category] || 'Item'}</button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredDocs.length === 0 ? <p className="col-span-full text-center text-xs text-slate-400 py-10">Nenhum {label.toLowerCase()} encontrado.</p> : filteredDocs.map(d => (
          <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-100 flex items-center gap-3 hover:shadow-md transition-shadow">
            <div className="p-2 bg-slate-50 rounded-xl"><FileText className="w-5 h-5 text-slate-500" /></div>
            <div className="flex-1 min-w-0"><p className="text-sm font-bold text-slate-800 truncate">{d.name}</p></div>
          </div>
        ))}
      </div>
    </div>
  )
}
