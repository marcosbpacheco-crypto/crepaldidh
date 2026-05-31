'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import type { PDIPlan, PDIGoal, PDIStatus } from '../context/MentoringContext'
import {
  Target, Plus, Search, CheckCircle2, Clock, AlertTriangle,
  ChevronRight, Calendar, Sparkles, PlusCircle, Trash2, ShieldAlert
} from 'lucide-react'

const STATUS_LABELS: Record<PDIStatus, string> = {
  nao_iniciado: 'Não Iniciado',
  em_andamento: 'Em Andamento',
  concluido: 'Concluído',
  atrasado: 'Atrasado',
}

const STATUS_COLORS: Record<PDIStatus, string> = {
  nao_iniciado: 'bg-slate-100 text-slate-700 border-slate-200',
  em_andamento: 'bg-blue-100 text-blue-700 border-blue-200',
  concluido: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  atrasado: 'bg-red-100 text-red-700 border-red-200',
}

export default function PDIPage() {
  const {
    pdiPlans, participants, competencies,
    addPDIPlan, updatePDIPlan, deletePDIPlan,
    addPDIGoal, updatePDIGoal, deletePDIGoal,
    suggestPDI
  } = useMentoring()

  const [search, setSearch] = useState('')
  const [selectedPlan, setSelectedPlan] = useState<PDIPlan | null>(null)
  const [showPlanForm, setShowPlanForm] = useState(false)
  const [showGoalForm, setShowGoalForm] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)

  // Plan form state
  const [planForm, setPlanForm] = useState({
    participantId: '',
    title: '',
    period: '',
  })

  // Goal form state
  const [goalForm, setGoalForm] = useState({
    competency: '',
    objective: '',
    action: '',
    responsible: '',
    deadline: '',
    indicator: '',
    status: 'nao_iniciado' as PDIStatus,
  })

  const filteredPlans = pdiPlans.filter(plan => {
    const p = participants.find(part => part.id === plan.participantId)
    const matchesSearch = plan.title.toLowerCase().includes(search.toLowerCase()) ||
      (p?.name.toLowerCase().includes(search.toLowerCase()) ?? false)
    return matchesSearch
  })

  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault()
    if (!planForm.participantId) return
    const newPlan = addPDIPlan({
      participantId: planForm.participantId,
      title: planForm.title,
      period: planForm.period,
      goals: [],
    })
    setSelectedPlan(newPlan)
    setShowPlanForm(false)
    setPlanForm({ participantId: '', title: '', period: '' })
  }

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPlan) return
    addPDIGoal(selectedPlan.id, goalForm)
    setShowGoalForm(false)
    // Update local preview state
    const updatedPlan = pdiPlans.find(p => p.id === selectedPlan.id)
    if (updatedPlan) {
      setSelectedPlan(updatedPlan)
    }
    setGoalForm({
      competency: '', objective: '', action: '', responsible: '',
      deadline: '', indicator: '', status: 'nao_iniciado'
    })
  }

  const handleAISuggest = async () => {
    if (!selectedPlan) return
    setAiLoading(true)
    try {
      const suggestions = await suggestPDI(selectedPlan.participantId)
      suggestions.forEach(sug => {
        addPDIGoal(selectedPlan.id, sug)
      })
      const updatedPlan = pdiPlans.find(p => p.id === selectedPlan.id)
      if (updatedPlan) {
        setSelectedPlan(updatedPlan)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setAiLoading(false)
    }
  }

  const handleDeleteGoal = (goalId: string) => {
    if (!selectedPlan) return
    deletePDIGoal(selectedPlan.id, goalId)
    const updatedPlan = pdiPlans.find(p => p.id === selectedPlan.id)
    if (updatedPlan) {
      setSelectedPlan(updatedPlan)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Plano de Desenvolvimento Individual (PDI)</h1>
          <p className="text-slate-500 text-sm mt-0.5">Definição, acompanhamento e avaliação de metas de evolução de competências</p>
        </div>
        <button
          onClick={() => setShowPlanForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-md shadow-violet-200 hover:opacity-90 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Novo PDI
        </button>
      </div>

      {/* Search & Filter */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar PDI por título ou nome do participante..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white shadow-sm"
        />
      </div>

      {/* Main split dashboard view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* PDI Plans list */}
        <div className="lg:col-span-1 space-y-4">
          <div className="space-y-3">
            {filteredPlans.map(plan => {
              const p = participants.find(part => part.id === plan.participantId)
              const done = plan.goals.filter(g => g.status === 'concluido').length
              const total = plan.goals.length
              const pct = total > 0 ? Math.round((done / total) * 100) : 0

              return (
                <div
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan)}
                  className={`p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-violet-200 ${selectedPlan?.id === plan.id ? 'border-violet-500 ring-2 ring-violet-50' : 'border-slate-100'}`}
                >
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-bold text-slate-800 leading-snug">{plan.title}</h3>
                      <p className="text-xs text-violet-600 font-semibold mt-1">{p?.name || 'Participante Desconhecido'}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{plan.period}</p>
                    </div>

                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Progresso</span>
                        <span className="font-bold text-slate-700">{pct}%</span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                      </div>
                      <div className="flex justify-between items-center text-[10px] text-slate-400 mt-1">
                        <span>{done}/{total} metas concluídas</span>
                        <span>{plan.goals.filter(g => g.status === 'atrasado').length} atrasadas</span>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}

            {filteredPlans.length === 0 && (
              <div className="text-center py-12 bg-white border border-slate-100 rounded-2xl">
                <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500 font-medium text-sm">Nenhum PDI cadastrado</p>
                <p className="text-slate-400 text-xs mt-1">Crie um novo PDI para começar</p>
              </div>
            )}
          </div>
        </div>

        {/* Selected Plan Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          {selectedPlan ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
              
              {/* Panel Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-4 border-b border-slate-100">
                <div>
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-violet-600" />
                    <h2 className="text-lg font-bold text-slate-800 leading-snug">{selectedPlan.title}</h2>
                  </div>
                  <p className="text-sm text-violet-600 font-semibold mt-1">
                    Participante: {participants.find(p => p.id === selectedPlan.participantId)?.name}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">Período: {selectedPlan.period}</p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleAISuggest}
                    disabled={aiLoading}
                    className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-500 to-purple-600 text-white text-xs font-bold rounded-full hover:opacity-90 disabled:opacity-50 transition-opacity shadow-sm"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    {aiLoading ? 'Processando...' : 'Sugerir Metas (IA)'}
                  </button>
                  <button
                    onClick={() => setShowGoalForm(true)}
                    className="flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition-colors"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    Nova Meta
                  </button>
                </div>
              </div>

              {/* Goals list */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Metas & Competências</h3>

                {selectedPlan.goals.length === 0 ? (
                  <div className="text-center py-12 border border-dashed border-slate-200 rounded-2xl">
                    <Target className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                    <p className="text-slate-500 text-sm font-medium">Nenhuma meta definida</p>
                    <p className="text-slate-400 text-xs mt-0.5">Adicione metas de desenvolvimento humano ou use a IA</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedPlan.goals.map(goal => (
                      <div key={goal.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors space-y-4">
                        <div className="flex justify-between items-start gap-4">
                          <div>
                            <span className="text-xs font-semibold px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md">
                              {goal.competency}
                            </span>
                            <h4 className="font-bold text-slate-800 mt-2">{goal.objective}</h4>
                          </div>

                          <div className="flex items-center gap-2">
                            <select
                              value={goal.status}
                              onChange={e => {
                                updatePDIGoal(selectedPlan.id, goal.id, { status: e.target.value as PDIStatus })
                                const updatedPlan = pdiPlans.find(p => p.id === selectedPlan.id)
                                if (updatedPlan) setSelectedPlan(updatedPlan)
                              }}
                              className={`text-xs px-2.5 py-1 rounded-full font-bold border uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-violet-300 shadow-sm cursor-pointer ${STATUS_COLORS[goal.status]}`}
                            >
                              <option value="nao_iniciado">Não Iniciado</option>
                              <option value="em_andamento">Em Andamento</option>
                              <option value="concluido">Concluído</option>
                              <option value="atrasado">Atrasado</option>
                            </select>

                            <button onClick={() => handleDeleteGoal(goal.id)}
                              className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-colors">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-3 border-t border-slate-100">
                          <div>
                            <span className="text-slate-400 block mb-0.5">Ações Práticas</span>
                            <span className="text-slate-700 font-medium leading-relaxed">{goal.action}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Indicador de Sucesso</span>
                            <span className="text-slate-700 font-medium leading-relaxed">{goal.indicator}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Prazo Estimado</span>
                            <span className="text-slate-700 font-medium flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(goal.deadline).toLocaleDateString('pt-BR')}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 block mb-0.5">Responsável</span>
                            <span className="text-slate-700 font-medium">{goal.responsible}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

            </div>
          ) : (
            <div className="text-center py-20 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
              <Target className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Selecione um Plano PDI</p>
              <p className="text-slate-400 text-xs mt-1">Para visualizar objetivos, prazos, indicadores e ações</p>
            </div>
          )}
        </div>
      </div>

      {/* New Plan Modal */}
      {showPlanForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowPlanForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Criar Novo PDI</h2>
              <p className="text-sm text-slate-500">Defina o título e período para o plano de desenvolvimento</p>
            </div>
            <form onSubmit={handleCreatePlan} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Participante *</label>
                <select required value={planForm.participantId} onChange={e => setPlanForm({ ...planForm, participantId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                  <option value="">Selecione um participante...</option>
                  {participants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Título do Plano *</label>
                <input required value={planForm.title} onChange={e => setPlanForm({ ...planForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Ex: PDI Liderança João 2026" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Período de Acompanhamento *</label>
                <input required value={planForm.period} onChange={e => setPlanForm({ ...planForm, period: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Ex: Q2-Q3 2026 (Maio a Outubro)" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowPlanForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
                  Criar Plano
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Goal Modal */}
      {showGoalForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowGoalForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Nova Meta de Desenvolvimento</h2>
              <p className="text-sm text-slate-500">Adicione um objetivo e ação prática de desenvolvimento humano</p>
            </div>
            <form onSubmit={handleCreateGoal} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Competência de Desenvolvimento *</label>
                  <select required value={goalForm.competency} onChange={e => setGoalForm({ ...goalForm, competency: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                    <option value="">Selecione uma competência...</option>
                    {competencies.map(comp => (
                      <option key={comp.id} value={comp.name}>{comp.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Objetivo de Evolução *</label>
                  <input required value={goalForm.objective} onChange={e => setGoalForm({ ...goalForm, objective: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Ex: Melhorar clareza nas reuniões операacionais" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ação Prática a ser Realizada *</label>
                  <textarea required rows={2} value={goalForm.action} onChange={e => setGoalForm({ ...goalForm, action: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" placeholder="Ex: Fazer sessões semanais de alinhamento com a equipe..." />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Responsável *</label>
                  <input required value={goalForm.responsible} onChange={e => setGoalForm({ ...goalForm, responsible: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Ex: Colaborador + Liderança" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Prazo Final *</label>
                  <input required type="date" value={goalForm.deadline} onChange={e => setGoalForm({ ...goalForm, deadline: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Indicador de Sucesso</label>
                  <input value={goalForm.indicator} onChange={e => setGoalForm({ ...goalForm, indicator: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Ex: Nota de feedback 360 ou alcance de metas" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowGoalForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
                  Criar Meta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
