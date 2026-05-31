'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import type { MentoringSession, MentoringType } from '../context/MentoringContext'
import Link from 'next/link'
import {
  CalendarDays, Plus, Search, Filter, Clock, Users,
  Sparkles, CheckCircle2, ChevronRight, Edit3, Trash2,
  AlertCircle, ExternalLink
} from 'lucide-react'

const TYPE_LABELS: Record<MentoringType, string> = {
  individual: 'Individual',
  coletiva: 'Coletiva',
  lideranca: 'Liderança',
  executiva: 'Executiva',
}

const TYPE_COLORS: Record<MentoringType, string> = {
  individual: 'bg-blue-100 text-blue-700 border-blue-200',
  coletiva: 'bg-purple-100 text-purple-700 border-purple-200',
  lideranca: 'bg-amber-100 text-amber-700 border-amber-200',
  executiva: 'bg-emerald-100 text-emerald-700 border-emerald-200',
}

export default function SessionsPage() {
  const { sessions, participants, addSession, updateSession, deleteSession, generateAISummary } = useMentoring()
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<string>('all')
  const [selectedSession, setSelectedSession] = useState<MentoringSession | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [aiResult, setAiResult] = useState('')

  const [form, setForm] = useState<Omit<MentoringSession, 'id' | 'createdAt'>>({
    type: 'individual',
    title: '',
    participantIds: [],
    date: '',
    duration: 60,
    objective: '',
    topics: '',
    tools: [],
    actionPlan: '',
    nextSteps: '',
    insights: '',
    challenges: '',
    potentials: '',
    status: 'agendada',
  })

  const filtered = sessions.filter(s => {
    const matchesSearch = s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.topics.toLowerCase().includes(search.toLowerCase()) ||
      s.objective.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'all' || s.type === filterType
    return matchesSearch && matchesType
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addSession(form)
    setShowForm(false)
    setForm({
      type: 'individual', title: '', participantIds: [], date: '', duration: 60,
      objective: '', topics: '', tools: [], actionPlan: '', nextSteps: '',
      insights: '', challenges: '', potentials: '', status: 'agendada'
    })
  }

  const handleAISummary = async (id: string) => {
    setAiLoading(true)
    try {
      const res = await generateAISummary(id)
      setAiResult(res)
    } catch {
      setAiResult('Falha ao gerar resumo da IA.')
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sessões de Mentoria</h1>
          <p className="text-slate-500 text-sm mt-0.5">Histórico completo de encontros individuais e coletivos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-md shadow-violet-200 hover:opacity-90 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Nova Sessão
        </button>
      </div>

      {/* Filters row */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar sessões por título, objetivos, temas abordados..."
            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white shadow-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={filterType} onChange={e => setFilterType(e.target.value)}
            className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-sm"
          >
            <option value="all">Todos os tipos</option>
            <option value="individual">Individual</option>
            <option value="coletiva">Coletiva</option>
            <option value="lideranca">Liderança</option>
            <option value="executiva">Executiva</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Sessions & Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sessions Timeline/List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="border-l-2 border-violet-100 pl-6 ml-4 space-y-6 relative">
            {filtered.map(s => {
              const dateObj = new Date(s.date)
              const pNames = s.participantIds
                .map(id => participants.find(p => p.id === id)?.name ?? id)
                .join(', ')

              return (
                <div key={s.id} className="relative group">
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-violet-500 bg-white group-hover:bg-violet-500 transition-colors" />

                  <div
                    onClick={() => { setSelectedSession(s); setAiResult(''); }}
                    className={`p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-violet-200 ${selectedSession?.id === s.id ? 'border-violet-500 ring-2 ring-violet-50' : 'border-slate-100'}`}
                  >
                    <div className="flex justify-between items-start gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${TYPE_COLORS[s.type]}`}>
                            {TYPE_LABELS[s.type]}
                          </span>
                          <span className="text-xs text-slate-500">
                            {dateObj.toLocaleDateString('pt-BR')} às {dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-slate-800 leading-snug mt-1.5">{s.title}</h3>
                        <p className="text-xs text-violet-600 font-semibold">{pNames}</p>
                      </div>

                      {/* Status indicator */}
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase tracking-wider ${s.status === 'realizada' ? 'bg-emerald-100 text-emerald-700' : s.status === 'agendada' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                        {s.status}
                      </span>
                    </div>

                    {s.topics && (
                      <p className="text-slate-600 text-sm mt-3 line-clamp-2 leading-relaxed">
                        {s.topics}
                      </p>
                    )}

                    <div className="flex items-center gap-4 mt-4 pt-3 border-t border-slate-50 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        {s.duration} minutos
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        {s.participantIds.length} participante(s)
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white border border-slate-100 rounded-2xl">
              <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Nenhuma sessão encontrada</p>
              <p className="text-slate-400 text-sm mt-1">Busque por outros termos ou agende uma nova mentoria</p>
            </div>
          )}
        </div>

        {/* Selected Session Details Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit space-y-6 lg:sticky lg:top-6">
          {selectedSession ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="flex justify-between items-start">
                <div>
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border uppercase tracking-wider ${TYPE_COLORS[selectedSession.type]}`}>
                    {TYPE_LABELS[selectedSession.type]}
                  </span>
                  <h2 className="text-lg font-bold text-slate-800 mt-2 leading-tight">{selectedSession.title}</h2>
                  <p className="text-xs text-slate-500 mt-1">
                    {new Date(selectedSession.date).toLocaleDateString('pt-BR')} · {selectedSession.duration}min
                  </p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => deleteSession(selectedSession.id)}
                    className="p-2 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Status control */}
              <div>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-2">Status da Sessão</span>
                <div className="flex gap-2">
                  {(['agendada', 'realizada', 'cancelada'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => {
                        updateSession(selectedSession.id, { status: st })
                        setSelectedSession({ ...selectedSession, status: st })
                      }}
                      className={`flex-1 py-1.5 text-xs font-bold rounded-xl border uppercase tracking-wider transition-all ${selectedSession.status === st ? 'bg-violet-600 text-white border-violet-600' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Objective */}
              {selectedSession.objective && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Objetivo</span>
                  <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-xl">{selectedSession.objective}</p>
                </div>
              )}

              {/* Topics */}
              {selectedSession.topics && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Assuntos Tratados</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedSession.topics}</p>
                </div>
              )}

              {/* Action Plan */}
              {selectedSession.actionPlan && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Plano de Ação Acordado</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedSession.actionPlan}</p>
                </div>
              )}

              {/* Next Steps */}
              {selectedSession.nextSteps && (
                <div className="space-y-1.5">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Próximos Passos</span>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedSession.nextSteps}</p>
                </div>
              )}

              {/* AI Assistance Section */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <button
                  onClick={() => handleAISummary(selectedSession.id)}
                  disabled={aiLoading}
                  className="flex items-center justify-center gap-2 w-full py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-200 transition-all"
                >
                  <Sparkles className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                  {aiLoading ? 'Analisando...' : 'Resumir com IA'}
                </button>

                {aiResult && (
                  <div className="p-4 rounded-xl border border-violet-100 bg-violet-50/30 text-sm text-slate-700 leading-relaxed animate-in fade-in slide-in-from-top-2 duration-300">
                    {aiResult}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-slate-400">
              <CalendarDays className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium">Selecione uma sessão</p>
              <p className="text-xs mt-1">Para visualizar todos os detalhes e resumo da IA</p>
            </div>
          )}
        </div>
      </div>

      {/* New Session Form Drawer/Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800 font-display">Agendar/Registrar Sessão</h2>
              <p className="text-sm text-slate-500">Insira todos os dados e detalhes da sessão realizada ou agendada</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Título da Sessão *</label>
                  <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Ex: Sessão 1 - Introdução e PDI" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Mentoria *</label>
                  <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as MentoringType })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    <option value="individual">Individual</option>
                    <option value="coletiva">Coletiva</option>
                    <option value="lideranca">Liderança</option>
                    <option value="executiva">Executiva</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Duração (minutos) *</label>
                  <input required type="number" min={15} step={15} value={form.duration} onChange={e => setForm({ ...form, duration: parseInt(e.target.value) || 60 })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Data e Hora *</label>
                  <input required type="datetime-local" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Participante(s) *</label>
                  <div className="grid grid-cols-2 gap-2 max-h-36 overflow-y-auto border border-slate-200 p-3 rounded-xl bg-slate-50">
                    {participants.map(p => (
                      <label key={p.id} className="flex items-center gap-2 text-sm text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={form.participantIds.includes(p.id)}
                          onChange={e => {
                            const ids = e.target.checked
                              ? [...form.participantIds, p.id]
                              : form.participantIds.filter(id => id !== p.id)
                            setForm({ ...form, participantIds: ids })
                          }}
                          className="rounded text-violet-600 focus:ring-violet-500"
                        />
                        {p.name}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Objetivo da Sessão</label>
                  <textarea rows={2} value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" placeholder="Definir os focos principais do acompanhamento..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Assuntos/Tópicos Tratados</label>
                  <textarea rows={2} value={form.topics} onChange={e => setForm({ ...form, topics: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" placeholder="Feedback da equipe, DISC, hábitos..." />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Plano de Ação</label>
                  <textarea rows={2} value={form.actionPlan} onChange={e => setForm({ ...form, actionPlan: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" placeholder="Tarefas e compromissos acordados..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
                  Salvar Sessão
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
