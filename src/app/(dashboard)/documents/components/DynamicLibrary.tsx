'use client'

import { useState, useMemo } from 'react'
import { useDocuments } from '../context/DocumentContext'
import { Compass, Plus, Search, Eye, Trash2 } from 'lucide-react'
import type { KnowledgeDynamic } from '@/types/documents'

export default function DynamicLibrary() {
  const { dynamics, addDynamic, deleteDynamic } = useDocuments()
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState('Todas')
  const [showModal, setShowModal] = useState(false)

  const filteredDynamics = useMemo(() => {
    return dynamics.filter(d => {
      const matchesSearch = d.name.toLowerCase().includes(search.toLowerCase()) || d.objetivo?.toLowerCase().includes(search.toLowerCase())
      const matchesCat = filterCat === 'Todas' || d.categoria === filterCat
      return matchesSearch && matchesCat
    })
  }, [dynamics, search, filterCat])

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex gap-2">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar dinâmicas..." className="px-3 py-2 border border-slate-200 rounded-xl text-xs w-64" />
        </div>
        <button onClick={() => setShowModal(true)} className="flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold"><Plus className="w-4 h-4" /> Nova Dinâmica</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredDynamics.map(d => (
            <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="p-2 bg-sky-50 text-sky-600 rounded-xl w-fit mb-3"><Compass className="w-5 h-5" /></div>
                <h3 className="text-sm font-bold text-slate-800">{d.name}</h3>
                <p className="text-xs text-slate-500 line-clamp-2 mt-1">{d.objetivo}</p>
                <div className="flex gap-2 mt-3 pt-3 border-t border-slate-50">
                    <button onClick={() => console.log('Abrir ficha dinâmica', d.id)} className="p-2 text-slate-400 hover:text-sky-600"><Eye className="w-4 h-4" /></button>
                    <button onClick={() => deleteDynamic(d.id)} className="p-2 text-slate-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                </div>
            </div>
        ))}
      </div>
    </div>
  )
}
