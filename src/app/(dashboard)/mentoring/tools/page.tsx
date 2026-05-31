'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import type { ToolUsage } from '../context/MentoringContext'
import {
  BookOpen, Plus, Search, Calendar, User, Compass,
  ChevronRight, Sparkles, LayoutList, History
} from 'lucide-react'

export default function ToolsPage() {
  const { tools, participants, sessions, addToolUsage } = useMentoring()
  const [search, setSearch] = useState('')
  const [selectedTool, setSelectedTool] = useState<typeof tools[0] | null>(null)
  const [showUsageForm, setShowUsageForm] = useState(false)

  const [usageForm, setUsageForm] = useState({
    sessionId: '',
    participantId: '',
    result: '',
  })

  const filtered = tools.filter(t =>
    t.name.toLowerCase().includes(search.toLowerCase()) ||
    t.category.toLowerCase().includes(search.toLowerCase()) ||
    t.description.toLowerCase().includes(search.toLowerCase())
  )

  const handleAddUsage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTool) return
    addToolUsage(selectedTool.id, {
      toolId: selectedTool.id,
      sessionId: usageForm.sessionId,
      participantId: usageForm.participantId,
      result: usageForm.result,
      date: new Date().toISOString(),
    })
    setShowUsageForm(false)
    setUsageForm({ sessionId: '', participantId: '', result: '' })
  }

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
              <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md uppercase tracking-wider">
                {tool.category}
              </span>
              <h3 className="font-bold text-slate-800 text-base mt-2">{tool.name}</h3>
              <p className="text-sm text-slate-500 leading-relaxed mt-1 line-clamp-2">
                {tool.description}
              </p>
              <div className="flex items-center gap-1.5 mt-4 pt-3 border-t border-slate-50 text-xs text-slate-400">
                <History className="w-3.5 h-3.5" />
                <span>Aplicado {tool.usageHistory.length} vezes</span>
              </div>
            </div>
          ))}
        </div>

        {/* Tool Preview & History panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit space-y-6">
          {selectedTool ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md uppercase tracking-wider">
                  {selectedTool.category}
                </span>
                <h2 className="text-lg font-bold text-slate-800 mt-2 leading-tight">{selectedTool.name}</h2>
                <p className="text-sm text-slate-600 leading-relaxed mt-2">{selectedTool.description}</p>
              </div>

              {/* Action Button to record utilization */}
              <button
                onClick={() => setShowUsageForm(true)}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-200 transition-all"
              >
                <Compass className="w-4 h-4" />
                Registrar Utilização
              </button>

              {/* Application History timeline */}
              <div className="space-y-3 pt-4 border-t border-slate-100">
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider block">Histórico de Aplicações</h3>
                
                {selectedTool.usageHistory.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-6">Esta ferramenta ainda não foi aplicada em sessões.</p>
                ) : (
                  <div className="space-y-3">
                    {selectedTool.usageHistory.map((usage, idx) => {
                      const part = participants.find(p => p.id === usage.participantId)
                      const sess = sessions.find(s => s.id === usage.sessionId)
                      return (
                        <div key={idx} className="p-3 border border-slate-50 bg-slate-50/50 rounded-xl space-y-1.5 text-xs text-slate-600">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-slate-700 truncate">{part?.name || 'Participante'}</span>
                            <span className="text-[10px] text-slate-400">{new Date(usage.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          {sess && <p className="text-[10px] text-violet-600 font-semibold">{sess.title}</p>}
                          <p className="leading-relaxed bg-white p-2 rounded-lg border border-slate-100 mt-1">
                            <span className="font-bold text-slate-700">Resultado:</span> {usage.result}
                          </p>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium">Selecione uma ferramenta</p>
              <p className="text-xs mt-1 font-normal">Para ler o descritivo completo e visualizar o histórico de aplicações</p>
            </div>
          )}
        </div>
      </div>

      {/* Record Usage Modal */}
      {showUsageForm && selectedTool && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUsageForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Registrar Aplicação</h2>
              <p className="text-sm text-slate-500">Ferramenta: {selectedTool.name}</p>
            </div>
            <form onSubmit={handleAddUsage} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Participante *</label>
                <select required value={usageForm.participantId} onChange={e => setUsageForm({ ...usageForm, participantId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                  <option value="">Selecione o participante...</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Sessão Vinculada *</label>
                <select required value={usageForm.sessionId} onChange={e => setUsageForm({ ...usageForm, sessionId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                  <option value="">Selecione a sessão...</option>
                  {sessions.map(s => (
                    <option key={s.id} value={s.id}>{s.title}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Resultado / Diagnóstico Obtido *</label>
                <textarea required rows={4} value={usageForm.result} onChange={e => setUsageForm({ ...usageForm, result: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" placeholder="Escreva os aprendizados, notas da Roda da Vida, ou diagnósticos comportamentais obtidos..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowUsageForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
