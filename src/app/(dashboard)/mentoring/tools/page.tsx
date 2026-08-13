'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import {
  BookOpen, Search, History
} from 'lucide-react'

export default function ToolsPage() {
  const { tools } = useMentoring()
  const [search, setSearch] = useState('')
  const [selectedTool, setSelectedTool] = useState<typeof tools[0] | null>(null)

  const filtered = tools.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    (t.category || '').toLowerCase().includes(search.toLowerCase()) ||
    (t.description || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Ferramentas de Desenvolvimento</h1>
          <p className="text-slate-500 text-sm mt-0.5">Frameworks e ferramentas para aplicação prática em sessões</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar ferramentas por nome, descrição ou categoria..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white shadow-sm"
        />
      </div>

      {/* Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Tools list */}
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-5 h-fit">
          {filtered.map(tool => (
            <div
              key={tool.id}
              onClick={() => setSelectedTool(tool)}
              className={`p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-violet-200 relative overflow-hidden group ${selectedTool?.id === tool.id ? 'border-violet-500 ring-2 ring-violet-50' : 'border-slate-100'}`}
            >
              {tool.category && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md uppercase tracking-wider">
                  {tool.category}
                </span>
              )}
              <h3 className="font-bold text-slate-800 text-base mt-2">{tool.name}</h3>
              {tool.description && (
                <p className="text-sm text-slate-500 leading-relaxed mt-1 line-clamp-2">
                  {tool.description}
                </p>
              )}
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-50 text-xs text-slate-400">
                <History className="w-3.5 h-3.5" />
                <span>Ferramenta de desenvolvimento</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tool Preview panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit">
          {selectedTool ? (
            <div className="space-y-4 animate-in fade-in duration-300">
              {selectedTool.category && (
                <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md uppercase tracking-wider">
                  {selectedTool.category}
                </span>
              )}
              <h2 className="text-lg font-bold text-slate-800 leading-tight">{selectedTool.name}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{selectedTool.description}</p>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium">Selecione uma ferramenta</p>
              <p className="text-xs mt-1 font-normal">Para ler o descritivo completo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
