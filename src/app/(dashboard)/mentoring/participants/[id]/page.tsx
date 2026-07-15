'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMentoring } from '../../context/MentoringContext'
import type { Participant, MentoringSession, PDIPlan } from '../../context/MentoringContext'
import Link from 'next/link'
import {
  Users, Calendar, Target, Award, Brain, Phone, Mail,
  Building, MapPin, Briefcase, UserCheck, Plus, Sparkles,
  ChevronLeft, ClipboardList, CheckCircle2, Clock, Trash2,
  FileText, Activity, AlertCircle, BarChart3, Shield
} from 'lucide-react'

export default function ParticipantDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const {
    participants, sessions, pdiPlans, competencies, tools, assessments,
    addAssessment, generateAIInsights, suggestPDI, deleteParticipant
  } = useMentoring()

  const [participant, setParticipant] = useState<Participant | null>(null)
  const [aiInsights, setAiInsights] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [showAssessmentForm, setShowAssessmentForm] = useState(false)
  const [selectedTab, setSelectedTab] = useState<'profile' | 'pdi' | 'timeline' | 'assessments'>('profile')

  // Form for new assessment
  const [assessmentType, setAssessmentType] = useState<'autoavaliacao' | 'lider' | '180' | '360'>('autoavaliacao')
  const [scores, setScores] = useState<Record<string, number>>({})
  const [obs, setObs] = useState('')

  useEffect(() => {
    const p = participants.find(part => part.id === id)
    if (p) {
      setParticipant(p)
      // Initialize scores
      const initialScores: Record<string, number> = {}
      competencies.forEach(c => {
        initialScores[c.id] = 3 // default middle score
      })
      setScores(initialScores)
    }
  }, [id, participants, competencies])

  if (!participant) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white border border-slate-100 rounded-2xl p-6 text-center space-y-4">
        <Users className="w-16 h-16 text-slate-200" />
        <h2 className="text-xl font-bold text-slate-800">Participante não encontrado</h2>
        <p className="text-slate-500 max-w-sm">O participante solicitado não existe ou foi removido do sistema.</p>
        <Link href="/mentoring/participants" className="px-5 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-violet-700 transition-colors">
          Voltar para Lista
        </Link>
      </div>
    )
  }

  const pSessions = sessions.filter(s => s.participantIds.includes(id))
  const pPDI = pdiPlans.find(pl => pl.participantId === id)
  const pAssessments = assessments.filter(a => a.participantId === id)

  const handleAIInsights = async () => {
    setAiLoading(true)
    try {
      const res = await generateAIInsights(id)
      setAiInsights(res)
    } catch {
      setAiInsights('Falha ao gerar insights da IA.')
    } finally {
      setAiLoading(false)
    }
  }

  const handleAssessmentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const compScores = Object.entries(scores).map(([competencyId, score]) => ({
      competencyId,
      score,
    }))

    addAssessment({
      participantId: id,
      type: assessmentType,
      date: new Date().toISOString().split('T')[0],
      competencyScores: compScores,
      observations: obs,
    })

    setShowAssessmentForm(false)
    setObs('')
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/mentoring/participants" className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-500">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Perfil do Participante</h1>
          <p className="text-slate-500 text-sm mt-0.5">Dossiê de mentoria, PDI e avaliações comportamentais</p>
        </div>
      </div>

      {/* Main split profile view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Participant Core Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm relative overflow-hidden group">
            {/* Header glow */}
            <div className="absolute top-0 inset-x-0 h-2 bg-gradient-to-r from-violet-500 to-purple-600" />
            <div className="flex flex-col items-center text-center space-y-3 pt-2">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-violet-100">
                {participant.avatar}
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 leading-snug">{participant.name}</h2>
                <p className="text-xs text-violet-600 font-semibold">{participant.role}</p>
                <p className="text-xs text-slate-400 mt-0.5">{participant.companyName}</p>
              </div>

              <div className="flex gap-2 w-full pt-4 border-t border-slate-50">
                <button
                  onClick={handleAIInsights}
                  disabled={aiLoading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-200 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  {aiLoading ? 'Processando...' : 'Insights da IA'}
                </button>
                <button
                  onClick={() => {
                    deleteParticipant(id)
                    router.push('/mentoring/participants')
                  }}
                  className="p-2.5 border border-slate-200 hover:border-red-200 text-slate-400 hover:text-red-500 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Core Info details */}
            <div className="space-y-4 pt-6 mt-6 border-t border-slate-100 text-sm text-slate-600">
              <div className="flex items-center gap-3">
                <Building className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Unidade: {participant.unit || 'Não informada'}</span>
              </div>
              <div className="flex items-center gap-3">
                <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Setor: {participant.sector || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <UserCheck className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Líder Direto: {participant.directLeader || 'Não informado'}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="truncate">{participant.email}</span>
              </div>
              {participant.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span>{participant.phone}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>Acompanhamento: {new Date(participant.startDate).toLocaleDateString('pt-BR')}</span>
              </div>
            </div>
          </div>

          {/* AI Insights Display */}
          {aiInsights && (
            <div className="bg-violet-50/50 border border-violet-100 rounded-2xl p-5 shadow-sm space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-2 text-violet-700 font-bold text-sm">
                <Sparkles className="w-4 h-4" />
                <span>Devolutiva de IA</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">{aiInsights}</p>
            </div>
          )}
        </div>

        {/* Right Side: Tabbed Details Panel */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
            
            {/* Tabs */}
            <div className="flex gap-2 border-b border-slate-100 pb-3 flex-wrap">
              {[
                { id: 'profile', label: 'Dossiê', icon: ClipboardList },
                { id: 'pdi', label: 'Plano PDI', icon: Target },
                { id: 'timeline', label: 'Histórico', icon: Activity },
                { id: 'assessments', label: 'Avaliações', icon: BarChart3 },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setSelectedTab(tab.id as any)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all ${selectedTab === tab.id ? 'bg-violet-50 text-violet-700 font-bold' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content - Profile/Dossier */}
            {selectedTab === 'profile' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Notas de Acompanhamento</h3>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {participant.notes || 'Nenhuma nota informada.'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Resumo de Atividades</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Sessões Realizadas</span>
                        <span className="font-bold text-slate-700 text-sm">{pSessions.filter(s => s.status === 'realizada').length}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Sessões Agendadas</span>
                        <span className="font-bold text-slate-700 text-sm">{pSessions.filter(s => s.status === 'agendada').length}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 border border-slate-100 rounded-xl bg-slate-50/50 space-y-2">
                    <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Progresso PDI</span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500 block">Metas Ativas</span>
                        <span className="font-bold text-slate-700 text-sm">{pPDI && Array.isArray(pPDI.goals) ? pPDI.goals.length : 0}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Metas Concluídas</span>
                        <span className="font-bold text-slate-700 text-sm">{pPDI && Array.isArray(pPDI.goals) ? pPDI.goals.filter(g => g?.status === 'concluido').length : 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab content - PDI Plan */}
            {selectedTab === 'pdi' && (
              <div className="space-y-4">
                {pPDI ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center pb-2 border-b border-slate-50">
                      <div>
                        <h4 className="font-bold text-slate-800">{pPDI.title}</h4>
                        <p className="text-xs text-slate-400">{pPDI.period}</p>
                      </div>
                      <Link href="/mentoring/pdi" className="text-xs text-violet-600 font-bold hover:underline">
                        Gerenciar Completo
                      </Link>
                    </div>

                    <div className="space-y-3">
                      {pPDI.goals.map(goal => (
                        <div key={goal.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-[10px] font-bold px-2 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 rounded-md">
                                {goal.competency}
                              </span>
                              <h5 className="font-bold text-sm text-slate-800 mt-1.5">{goal.objective}</h5>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full uppercase">
                              {goal.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-slate-50">
                            <div>
                              <span className="text-slate-400 block">Ação</span>
                              <span className="text-slate-600">{goal.action}</span>
                            </div>
                            <div>
                              <span className="text-slate-400 block">Prazo</span>
                              <span className="text-slate-600">{new Date(goal.deadline).toLocaleDateString('pt-BR')}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-3">
                    <Target className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-medium text-slate-500">Nenhum PDI cadastrado</p>
                    <Link href="/mentoring/pdi" className="inline-block px-4 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-bold transition-all">
                      Criar Primeiro PDI
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab content - Timeline/Sessions */}
            {selectedTab === 'timeline' && (
              <div className="space-y-4">
                {pSessions.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl">
                    <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-500">Nenhuma sessão registrada</p>
                  </div>
                ) : (
                  <div className="border-l border-violet-100 pl-4 space-y-4">
                    {pSessions.map(s => (
                      <div key={s.id} className="relative">
                        <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-violet-500 bg-white" />
                        <div className="p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                          <div className="flex justify-between items-start">
                            <div>
                              <h5 className="font-bold text-slate-800 text-sm">{s.title}</h5>
                              <p className="text-xs text-slate-400 mt-0.5">{new Date(s.date).toLocaleDateString('pt-BR')} · {s.duration}min</p>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full uppercase">
                              {s.status}
                            </span>
                          </div>
                          {s.actionPlan && (
                            <p className="text-xs text-slate-600 mt-2 bg-white p-2.5 rounded-lg border border-slate-100">
                              <span className="font-bold text-slate-700">Ações:</span> {s.actionPlan}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab content - Assessments */}
            {selectedTab === 'assessments' && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Histórico de Avaliações</h3>
                  <button
                    onClick={() => setShowAssessmentForm(true)}
                    className="flex items-center gap-1 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold transition-colors shadow-sm"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nova Avaliação
                  </button>
                </div>

                {pAssessments.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-xl space-y-2">
                    <Award className="w-10 h-10 text-slate-300 mx-auto" />
                    <p className="text-sm font-medium text-slate-500">Nenhuma avaliação realizada</p>
                    <p className="text-xs text-slate-400">Faça uma autoavaliação ou feedback 360°</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {pAssessments.map(ass => (
                      <div key={ass.id} className="p-5 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                          <div>
                            <span className="text-xs font-bold px-2 py-0.5 bg-violet-100 text-violet-700 border border-violet-200 rounded-md uppercase tracking-wider">
                              {ass.type}
                            </span>
                            <span className="text-xs text-slate-400 ml-2">{new Date(ass.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>

                        {/* Scores grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {ass.competencyScores.map(score => {
                            const comp = competencies.find(c => c.id === score.competencyId)
                            return (
                              <div key={score.competencyId} className="bg-white p-3 border border-slate-100 rounded-xl flex flex-col justify-between">
                                <span className="text-xs font-semibold text-slate-500 truncate">{comp?.name || 'Competência'}</span>
                                <div className="flex items-center gap-1.5 mt-2">
                                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${score.score >= 4 ? 'bg-emerald-500' : score.score >= 3 ? 'bg-amber-500' : 'bg-red-500'}`}
                                      style={{ width: `${(score.score / 5) * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-xs font-bold text-slate-700">{score.score}/5</span>
                                </div>
                              </div>
                            )
                          })}
                        </div>

                        {ass.observations && (
                          <div className="text-xs text-slate-600 bg-white p-3 rounded-xl border border-slate-100 leading-relaxed">
                            <span className="font-bold text-slate-700 block mb-1">Observações:</span>
                            {ass.observations}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Assessment Form Modal */}
      {showAssessmentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowAssessmentForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Nova Avaliação Comportamental</h2>
              <p className="text-sm text-slate-500">Mapeie as competências em uma escala de 1 a 5</p>
            </div>
            <form onSubmit={handleAssessmentSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Tipo de Avaliação *</label>
                <select required value={assessmentType} onChange={e => setAssessmentType(e.target.value as any)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300">
                  <option value="autoavaliacao">Autoavaliação</option>
                  <option value="lider">Avaliação do Líder</option>
                  <option value="180">Avaliação 180°</option>
                  <option value="360">Avaliação 360°</option>
                </select>
              </div>

              {/* Competency inputs */}
              <div className="space-y-3 max-h-64 overflow-y-auto border border-slate-200 p-4 rounded-xl bg-slate-50">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-2">Pontuar Competências</span>
                {competencies.map(c => (
                  <div key={c.id} className="flex justify-between items-center gap-4 bg-white p-3 rounded-lg border border-slate-100">
                    <div className="min-w-0 flex-1">
                      <span className="text-xs font-semibold text-slate-700 block truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-400 block truncate leading-normal">{c.description}</span>
                    </div>
                    <select
                      value={scores[c.id] || 3}
                      onChange={e => setScores({ ...scores, [c.id]: parseInt(e.target.value) || 3 })}
                      className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-300"
                    >
                      <option value="1">1 - Insuficiente</option>
                      <option value="2">2 - Regular</option>
                      <option value="3">3 - Bom</option>
                      <option value="4">4 - Muito Bom</option>
                      <option value="5">5 - Excelente</option>
                    </select>
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Observações Gerais</label>
                <textarea rows={2} value={obs} onChange={e => setObs(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" placeholder="Feedback qualitativo, observações de evolução..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssessmentForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
                  Salvar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
