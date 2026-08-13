'use client'

import { useState, useMemo } from 'react'
import { useDocuments } from '../context/DocumentContext'
import { Hammer, Plus, Search } from 'lucide-react'
import type { KnowledgeTool, ToolStatus } from '@/types/documents'
import ToolFicha from './ToolFicha'

const TOOL_STATUS_COLOR: Record<string,string> = {
  rascunho: 'bg-slate-100 text-slate-600', ativa: 'bg-emerald-100 text-emerald-700', arquivada: 'bg-slate-200 text-slate-500',
}

export default function ToolLibrary() {
  const { tools, deleteTool } = useDocuments()
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<KnowledgeTool | null>(null)

  const filteredTools = useMemo(() => {
    return tools.filter(t => {
      const q = search.toLowerCase()
      return (t.name.toLowerCase().includes(q) || t.description?.toLowerCase().includes(q) || (t.categoria||'').toLowerCase().includes(q) || (t.tags||[]).some(tag => tag.toLowerCase().includes(q)))
    })
  }, [tools, search])

  const stats = useMemo(() => {
    const counts: Record<string, number> = { total: tools.length, ativa: 0, rascunho: 0, arquivada: 0 }
    tools.forEach(t => { counts[t.status as string] = (counts[t.status as string] || 0) + 1 })
    return counts
  }, [tools])

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex justify-between items-center">
        <h2 className="text-lg font-bold text-slate-800">Biblioteca de Ferramentas</h2>
        <div className="flex gap-2 items-center">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-64 pl-8 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs" />
          </div>
          <button onClick={() => setSelected({} as KnowledgeTool)} className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"><Plus className="w-4 h-4" /> Nova Ferramenta</button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div className="bg-white p-3 rounded-xl border border-slate-100"><p className="text-xs text-slate-400">Total</p><p className="text-xl font-black">{stats.total}</p></div>
        <div className="bg-white p-3 rounded-xl border border-slate-100"><p className="text-xs text-slate-400">Ativas</p><p className="text-xl font-black text-emerald-600">{stats.ativa}</p></div>
        <div className="bg-white p-3 rounded-xl border border-slate-100"><p className="text-xs text-slate-400">Rascunho</p><p className="text-xl font-black text-slate-500">{stats.rascunho}</p></div>
        <div className="bg-white p-3 rounded-xl border border-slate-100"><p className="text-xs text-slate-400">Arquivadas</p><p className="text-xl font-black text-slate-400">{stats.arquivada}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTools.length === 0 ? <p className="col-span-full text-center text-xs text-slate-400 py-10">Nenhuma ferramenta encontrada.</p> : filteredTools.map(t => (
          <div key={t.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all cursor-pointer" onClick={() => setSelected(t)}>
            <div className="flex justify-between items-start mb-3">
              <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><Hammer className="w-5 h-5" /></div>
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${TOOL_STATUS_COLOR[t.status as string] || 'bg-slate-100 text-slate-500'}`}>{t.status}</span>
            </div>
            <h3 className="text-sm font-bold text-slate-800">{t.name}</h3>
            <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{t.finalidade || t.description}</p>
            <div className="flex flex-wrap gap-1 mt-3">
              {(t.tags || []).slice(0,3).map(tag => <span key={tag} className="text-[9px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded-full">#{tag}</span>)}
            </div>
          </div>
        ))}
      </div>

      {selected && (
        <ToolFicha tool={selected} onClose={() => setSelected(null)} onSave={() => {}} onDuplicate={() => {}} />
      )}
    </div>
  )
}
