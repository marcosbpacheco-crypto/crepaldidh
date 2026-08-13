'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { mentoringService } from '@/services/mentoringService'
import type {
  MentoringProgram, MentoringObjective, MentoringAction, MentoringSession,
  MentoringFeedback, MentoringDiagnostic, MentoringIndicator, MentoringDocument,
  MentoringHistory, Participant, Competency, DevelopmentTool, Assessment, MentoringReport,
} from '@/types/mentoring'

// ==========================================
// 1. TYPES DO CONTEXT
// ==========================================

export type MentoringType = 'individual' | 'coletiva' | 'lideranca' | 'executiva' | 'rh'
export type SessionStatus = 'agendada' | 'realizada' | 'cancelada'
export type PDIStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'atrasado'
export type AssessmentType = 'autoavaliacao' | 'lider' | '180' | '360'

export type { MentoringProgram, MentoringObjective, MentoringAction, MentoringSession, MentoringFeedback, MentoringDiagnostic, MentoringIndicator, MentoringDocument, MentoringHistory, Participant, Competency, DevelopmentTool, Assessment, MentoringReport }

// Tipos de compatibilidade (consumers antigos — mantidos sem PDI)
export interface PDIGoal {
  id: string
  pdiId: string
  competency: string
  objective: string
  action: string
  responsible: string
  deadline: string
  indicator: string
  status: PDIStatus
}
export interface PDIPlan {
  id: string
  participantId: string
  title: string
  period: string
  goals: PDIGoal[]
  createdAt: string
  updatedAt: string
}
export interface ToolUsage {
  id: string
  toolId: string
  sessionId: string
  participantId: string
  result: string
  date: string
}
export interface CompetencyScore {
  competencyId: string
  score: number
}

interface MentoringContextType {
  // Data
  programs: MentoringProgram[]
  participants: Participant[]
  sessions: MentoringSession[]
  objectives: MentoringObjective[]
  actions: MentoringAction[]
  feedbacks: MentoringFeedback[]
  diagnostics: MentoringDiagnostic[]
  indicators: MentoringIndicator[]
  documents: MentoringDocument[]
  history: MentoringHistory[]
  competencies: Competency[]
  tools: DevelopmentTool[]
  assessments: Assessment[]
  mentoringReports: MentoringReport[]

  // Computed KPIs
  activeMentorings: number
  activeRHPrograms: number
  sessionsThisMonth: number
  sessionsThisWeek: number
  upcomingSessions: MentoringSession[]
  activeMentees: number
  pendingSessionRegistrations: number
  overdueActions: number
  pendingFeedbacks: number
  avgSatisfaction: number
  mentoringHours: number
  completedMentorings: number
  nearClosing: MentoringProgram[]

  // Compatibilidade (BI/IA) — derivados, sem PDI real
  activePDIs: number
  completedGoals: number
  overdueGoals: number
  pdiPlans: PDIPlan[]

  // Mutators - Programs
  addProgram: (p: Omit<MentoringProgram, 'id' | 'createdAt' | 'updatedAt'>) => MentoringProgram
  updateProgram: (id: string, updates: Partial<MentoringProgram>) => void
  deleteProgram: (id: string) => void

  // Mutators - Objectives
  addObjective: (o: Omit<MentoringObjective, 'id' | 'createdAt' | 'updatedAt' | 'actions'>) => MentoringObjective
  updateObjective: (id: string, updates: Partial<MentoringObjective>) => void
  deleteObjective: (id: string) => void

  // Mutators - Actions
  addAction: (a: Omit<MentoringAction, 'id' | 'createdAt'>) => MentoringAction
  updateAction: (id: string, updates: Partial<MentoringAction>) => void
  deleteAction: (id: string) => void

  // Mutators - Sessions
  addSession: (s: Omit<MentoringSession, 'id' | 'createdAt'>) => MentoringSession
  updateSession: (id: string, updates: Partial<MentoringSession>) => void
  deleteSession: (id: string) => void

  // Mutators - Feedbacks
  addFeedback: (f: Omit<MentoringFeedback, 'id' | 'createdAt'>) => MentoringFeedback
  updateFeedback: (id: string, updates: Partial<MentoringFeedback>) => void
  deleteFeedback: (id: string) => void

  // Mutators - Diagnostics
  addDiagnostic: (d: Omit<MentoringDiagnostic, 'id' | 'createdAt'>) => MentoringDiagnostic
  updateDiagnostic: (id: string, updates: Partial<MentoringDiagnostic>) => void
  deleteDiagnostic: (id: string) => void

  // Mutators - Indicators
  addIndicator: (i: Omit<MentoringIndicator, 'id' | 'createdAt' | 'updatedAt'>) => MentoringIndicator
  updateIndicator: (id: string, updates: Partial<MentoringIndicator>) => void
  deleteIndicator: (id: string) => void

  // Mutators - Documents
  addDocument: (d: Omit<MentoringDocument, 'id' | 'createdAt'>) => MentoringDocument
  updateDocument: (id: string, updates: Partial<MentoringDocument>) => void
  deleteDocument: (id: string) => void

  // Mutators - History
  addHistory: (h: Omit<MentoringHistory, 'id' | 'createdAt'>) => void

  // Mutators - Participants
  addParticipant: (p: Omit<Participant, 'id' | 'createdAt'>) => Participant
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  deleteParticipant: (id: string) => void

  // Competencies / Assessments
  addCompetency: (c: Omit<Competency, 'id'>) => Competency
  deleteCompetency: (id: string) => void
  addAssessment: (a: Omit<Assessment, 'id'>) => Assessment
  addMentoringReport: (r: Omit<MentoringReport, 'id' | 'generatedAt'>) => MentoringReport

  // AI stubs (arquitetura preparada, sem geração real)
  generateAISummary: (sessionId: string) => Promise<string>
  generateAIInsights: (participantId: string) => Promise<string>
}

// ==========================================
// 2. SEED (apenas catálogo de competências/ferramentas)
// ==========================================

const DEFAULT_COMPETENCIES: Competency[] = [
  { id: 'comp-1', name: 'Comunicação', description: 'Capacidade de expressar ideias com clareza e objetividade', category: 'Interpessoal', isCustom: false },
  { id: 'comp-2', name: 'Liderança', description: 'Capacidade de inspirar e guiar equipes rumo a resultados', category: 'Gestão', isCustom: false },
  { id: 'comp-3', name: 'Inteligência Emocional', description: 'Reconhecimento e gestão das próprias emoções e dos outros', category: 'Comportamental', isCustom: false },
  { id: 'comp-4', name: 'Feedback', description: 'Dar e receber feedback de forma construtiva e produtiva', category: 'Interpessoal', isCustom: false },
  { id: 'comp-5', name: 'Gestão de Conflitos', description: 'Identificar e resolver conflitos de forma construtiva', category: 'Interpessoal', isCustom: false },
  { id: 'comp-6', name: 'Planejamento', description: 'Organizar ações e recursos para atingir objetivos', category: 'Gestão', isCustom: false },
  { id: 'comp-7', name: 'Organização', description: 'Manter ordem, prioridades e eficiência nas tarefas', category: 'Produtividade', isCustom: false },
  { id: 'comp-8', name: 'Proatividade', description: 'Tomar iniciativa antes de ser solicitado', category: 'Comportamental', isCustom: false },
  { id: 'comp-9', name: 'Trabalho em Equipe', description: 'Colaborar efetivamente com diferentes perfis', category: 'Interpessoal', isCustom: false },
  { id: 'comp-10', name: 'Gestão do Tempo', description: 'Priorizar tarefas e cumprir prazos com eficiência', category: 'Produtividade', isCustom: false },
  { id: 'comp-11', name: 'Tomada de Decisão', description: 'Analisar cenários e decidir com assertividade', category: 'Gestão', isCustom: false },
  { id: 'comp-12', name: 'Autoconhecimento', description: 'Reconhecer forças, limitações e padrões pessoais', category: 'Comportamental', isCustom: false },
]

// ==========================================
// 3. CONTEXT
// ==========================================

const MentoringContext = createContext<MentoringContextType | undefined>(undefined)

export const MentoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [programs, setPrograms] = useState<MentoringProgram[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [sessions, setSessions] = useState<MentoringSession[]>([])
  const [objectives, setObjectives] = useState<MentoringObjective[]>([])
  const [actions, setActions] = useState<MentoringAction[]>([])
  const [feedbacks, setFeedbacks] = useState<MentoringFeedback[]>([])
  const [diagnostics, setDiagnostics] = useState<MentoringDiagnostic[]>([])
  const [indicators, setIndicators] = useState<MentoringIndicator[]>([])
  const [documents, setDocuments] = useState<MentoringDocument[]>([])
  const [history, setHistory] = useState<MentoringHistory[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>(DEFAULT_COMPETENCIES)
  const [tools, setTools] = useState<DevelopmentTool[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [mentoringReports, setMentoringReports] = useState<MentoringReport[]>([])

  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    Promise.all([
      mentoringService.listPrograms(),
      mentoringService.listParticipants(),
      mentoringService.listSessions(),
      mentoringService.listCompetencies(),
      mentoringService.listTools(),
      mentoringService.listAssessments(),
      mentoringService.listReports(),
    ]).then(([progs, parts, sess, comps, toolsArr, assess, reports]) => {
      setPrograms(progs)
      setParticipants(parts)
      setSessions(sess)
      const objs = progs.flatMap(p => Array.isArray(p.objectives) ? p.objectives : [])
      setObjectives(objs)
      const acts = progs.flatMap(p => Array.isArray(p.actions) ? p.actions : [])
      setActions(acts)
      const fbs = progs.flatMap(p => Array.isArray(p.feedbacks) ? p.feedbacks : [])
      setFeedbacks(fbs)
      const dgs = progs.flatMap(p => Array.isArray(p.diagnostics) ? p.diagnostics : [])
      setDiagnostics(dgs)
      const inds = progs.flatMap(p => Array.isArray(p.indicators) ? p.indicators : [])
      setIndicators(inds)
      const docs = progs.flatMap(p => Array.isArray(p.documents) ? p.documents : [])
      setDocuments(docs)
      const hist = progs.flatMap(p => Array.isArray(p.history) ? p.history : [])
      setHistory(hist)
      if (comps.length > 0) setCompetencies(comps)
      if (toolsArr.length > 0) setTools(toolsArr)
      if (assess.length > 0) setAssessments(assess)
      if (reports.length > 0) setMentoringReports(reports)
      setLoaded(true)
    }).catch((err) => console.error('[MentoringContext] load error:', err))
  }, [])

  // ============ COMPUTED ============
  const now = new Date()
  const activeMentorings = programs.filter(p => p.modality === 'individual' && ['ativa', 'planejada', 'pausada'].includes(p.status)).length
  const activeRHPrograms = programs.filter(p => p.modality === 'rh' && ['ativa', 'planejada', 'pausada'].includes(p.status)).length
  const completedMentorings = programs.filter(p => p.status === 'concluida').length
  const nearClosing = programs.filter(p => ['ativa', 'planejada'].includes(p.status) && p.endDate && new Date(p.endDate) >= now && (new Date(p.endDate).getTime() - now.getTime()) <= 30 * 24 * 60 * 60 * 1000)
  const sessionsThisMonth = sessions.filter(s => {
    const d = new Date(s.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const sessionsThisWeek = sessions.filter(s => {
    const d = new Date(s.date)
    const diff = (d.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)
    return diff >= 0 && diff <= 7
  }).length
  const upcomingSessions = sessions.filter(s => s.status === 'agendada').sort((a, b) => a.date.localeCompare(b.date)).slice(0, 6)
  const activeMentees = programs.filter(p => p.modality === 'individual' && ['ativa', 'planejada'].includes(p.status) && p.menteeName).length
  const pendingSessionRegistrations = sessions.filter(s => s.status === 'realizada' && !s.summary).length + sessions.filter(s => s.status === 'realizada').filter(s => !feedbacks.some(f => f.sessionId === s.id)).length
  const overdueActions = actions.filter(a => a.status !== 'concluida' && a.status !== 'cancelada' && a.deadline && new Date(a.deadline) < now).length
  const pendingFeedbacks = sessions.filter(s => s.status === 'realizada' && !feedbacks.some(f => f.sessionId === s.id)).length
  const fbRatings = feedbacks.map(f => f.satisfaction).filter((v): v is number => v !== null && v !== undefined)
  const avgSatisfaction = fbRatings.length ? Math.round((fbRatings.reduce((s, v) => s + v, 0) / fbRatings.length) * 10) / 10 : 0
  const mentoringHours = sessions.filter(s => s.status === 'realizada').reduce((acc, s) => acc + (s.duration || 0), 0) / 60

  // Compatibilidade BI/IA — derivados de Objetivos/Ações (sem PDI)
  const completedGoals = objectives.filter(o => o.status === 'concluido').length
  const overdueGoals = objectives.filter(o => o.status !== 'concluido' && o.deadline && new Date(o.deadline) < now).length
  const activePDIs = activeMentorings
  const pdiPlans: PDIPlan[] = programs
    .filter(p => p.modality === 'individual')
    .map(p => ({
      id: p.id,
      participantId: p.id,
      title: p.name,
      period: p.startDate || '',
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      goals: (p.objectives || []).map(o => ({
        id: o.id,
        pdiId: p.id,
        competency: o.category || 'Mentoria',
        objective: o.title,
        action: o.description || '',
        responsible: o.responsible || p.mentor || '',
        deadline: o.deadline || p.endDate || '',
        indicator: o.indicator || '',
        status: (o.status === 'nao_iniciado' ? 'nao_iniciado' : o.status === 'em_andamento' || o.status === 'em_atencao' ? 'em_andamento' : o.status === 'concluido' ? 'concluido' : 'atrasado') as PDIStatus,
      })),
    }))

  // ============ HELPERS ============
  const refreshPrograms = (updater: (prev: MentoringProgram[]) => MentoringProgram[]) => {
    setPrograms(prev => updater(prev))
  }

  // ---- Programs ----
  const addProgram = (p: Omit<MentoringProgram, 'id' | 'createdAt' | 'updatedAt'>): MentoringProgram => {
    const np: MentoringProgram = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), progress: p.progress || 0 }
    setPrograms(prev => [np, ...prev])
    mentoringService.createProgram(np).catch(err => console.error('[Mentoring] createProgram error:', err))
    return np
  }
  const updateProgram = (id: string, updates: Partial<MentoringProgram>) => {
    setPrograms(prev => prev.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    mentoringService.updateProgram(id, updates).catch(err => console.error('[Mentoring] updateProgram error:', err))
  }
  const deleteProgram = (id: string) => {
    setPrograms(prev => prev.filter(p => p.id !== id))
    setSessions(prev => prev.filter(s => s.programId !== id))
    setObjectives(prev => prev.filter(o => o.programId !== id))
    setActions(prev => prev.filter(a => a.programId !== id))
    setFeedbacks(prev => prev.filter(f => f.programId !== id))
    setDiagnostics(prev => prev.filter(dg => dg.programId !== id))
    setIndicators(prev => prev.filter(i => i.programId !== id))
    setDocuments(prev => prev.filter(d => d.programId !== id))
    setHistory(prev => prev.filter(h => h.programId !== id))
    mentoringService.removeProgram(id).catch(err => console.error('[Mentoring] deleteProgram error:', err))
  }

  // ---- Objectives ----
  const addObjective = (o: Omit<MentoringObjective, 'id' | 'createdAt' | 'updatedAt' | 'actions'>): MentoringObjective => {
    const no: MentoringObjective = { ...o, id: crypto.randomUUID(), progress: o.progress || 0, status: o.status || 'nao_iniciado', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), actions: [] }
    setObjectives(prev => [no, ...prev])
    refreshPrograms(prev => prev.map(p => p.id === no.programId ? { ...p, objectives: [...(p.objectives || []), no] } : p))
    mentoringService.createObjective(no).catch(err => console.error('[Mentoring] createObjective error:', err))
    return no
  }
  const updateObjective = (id: string, updates: Partial<MentoringObjective>) => {
    setObjectives(prev => prev.map(o => o.id === id ? { ...o, ...updates, updatedAt: new Date().toISOString() } : o))
    refreshPrograms(prev => prev.map(p => p.id && p.objectives ? { ...p, objectives: (p.objectives || []).map(o => o.id === id ? { ...o, ...updates } : o) } : p))
    mentoringService.updateObjective(id, updates).catch(err => console.error('[Mentoring] updateObjective error:', err))
  }
  const deleteObjective = (id: string) => {
    setObjectives(prev => prev.filter(o => o.id !== id))
    refreshPrograms(prev => prev.map(p => p.objectives ? { ...p, objectives: p.objectives.filter(o => o.id !== id) } : p))
    mentoringService.removeObjective(id).catch(err => console.error('[Mentoring] deleteObjective error:', err))
  }

  // ---- Actions ----
  const addAction = (a: Omit<MentoringAction, 'id' | 'createdAt'>): MentoringAction => {
    const na: MentoringAction = { ...a, id: crypto.randomUUID(), status: a.status || 'pendente', createdAt: new Date().toISOString() }
    setActions(prev => [na, ...prev])
    refreshPrograms(prev => prev.map(p => p.id === na.programId ? { ...p, actions: [...(p.actions || []), na] } : p))
    mentoringService.createAction(na).catch(err => console.error('[Mentoring] createAction error:', err))
    return na
  }
  const updateAction = (id: string, updates: Partial<MentoringAction>) => {
    setActions(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a))
    refreshPrograms(prev => prev.map(p => p.actions ? { ...p, actions: (p.actions || []).map(a => a.id === id ? { ...a, ...updates } : a) } : p))
    mentoringService.updateAction(id, updates).catch(err => console.error('[Mentoring] updateAction error:', err))
  }
  const deleteAction = (id: string) => {
    setActions(prev => prev.filter(a => a.id !== id))
    refreshPrograms(prev => prev.map(p => p.actions ? { ...p, actions: p.actions.filter(a => a.id !== id) } : p))
    mentoringService.removeAction(id).catch(err => console.error('[Mentoring] deleteAction error:', err))
  }

  // ---- Sessions ----
  const addSession = (s: Omit<MentoringSession, 'id' | 'createdAt'>): MentoringSession => {
    const ns: MentoringSession = { ...s, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setSessions(prev => [ns, ...prev])
    refreshPrograms(prev => prev.map(p => p.id === ns.programId ? { ...p, sessions: [...(p.sessions || []), ns] } : p))
    mentoringService.createSession(ns).catch(err => console.error('[Mentoring] createSession error:', err))
    return ns
  }
  const updateSession = (id: string, updates: Partial<MentoringSession>) => {
    setSessions(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    refreshPrograms(prev => prev.map(p => p.sessions ? { ...p, sessions: (p.sessions || []).map(s => s.id === id ? { ...s, ...updates } : s) } : p))
    mentoringService.updateSession(id, updates).catch(err => console.error('[Mentoring] updateSession error:', err))
  }
  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s.id !== id))
    refreshPrograms(prev => prev.map(p => p.sessions ? { ...p, sessions: p.sessions.filter(s => s.id !== id) } : p))
    mentoringService.removeSession(id).catch(err => console.error('[Mentoring] deleteSession error:', err))
  }

  // ---- Feedbacks ----
  const addFeedback = (f: Omit<MentoringFeedback, 'id' | 'createdAt'>): MentoringFeedback => {
    const nf: MentoringFeedback = { ...f, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setFeedbacks(prev => [nf, ...prev])
    refreshPrograms(prev => prev.map(p => p.id === nf.programId ? { ...p, feedbacks: [...(p.feedbacks || []), nf] } : p))
    mentoringService.createFeedback(nf).catch(err => console.error('[Mentoring] createFeedback error:', err))
    return nf
  }
  const updateFeedback = (id: string, updates: Partial<MentoringFeedback>) => {
    setFeedbacks(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
    refreshPrograms(prev => prev.map(p => p.feedbacks ? { ...p, feedbacks: (p.feedbacks || []).map(f => f.id === id ? { ...f, ...updates } : f) } : p))
    mentoringService.updateFeedback(id, updates).catch(err => console.error('[Mentoring] updateFeedback error:', err))
  }
  const deleteFeedback = (id: string) => {
    setFeedbacks(prev => prev.filter(f => f.id !== id))
    refreshPrograms(prev => prev.map(p => p.feedbacks ? { ...p, feedbacks: p.feedbacks.filter(f => f.id !== id) } : p))
    mentoringService.removeFeedback(id).catch(err => console.error('[Mentoring] deleteFeedback error:', err))
  }

  // ---- Diagnostics ----
  const addDiagnostic = (d: Omit<MentoringDiagnostic, 'id' | 'createdAt'>): MentoringDiagnostic => {
    const nd: MentoringDiagnostic = { ...d, id: crypto.randomUUID(), areas: d.areas || [], status: d.status || 'rascunho', createdAt: new Date().toISOString() }
    setDiagnostics(prev => [nd, ...prev])
    refreshPrograms(prev => prev.map(p => p.id === nd.programId ? { ...p, diagnostics: [...(p.diagnostics || []), nd] } : p))
    mentoringService.createDiagnostic(nd).catch(err => console.error('[Mentoring] createDiagnostic error:', err))
    return nd
  }
  const updateDiagnostic = (id: string, updates: Partial<MentoringDiagnostic>) => {
    setDiagnostics(prev => prev.map(dg => dg.id === id ? { ...dg, ...updates } : dg))
    refreshPrograms(prev => prev.map(p => p.diagnostics ? { ...p, diagnostics: (p.diagnostics || []).map(dg => dg.id === id ? { ...dg, ...updates } : dg) } : p))
    mentoringService.updateDiagnostic(id, updates).catch(err => console.error('[Mentoring] updateDiagnostic error:', err))
  }
  const deleteDiagnostic = (id: string) => {
    setDiagnostics(prev => prev.filter(dg => dg.id !== id))
    refreshPrograms(prev => prev.map(p => p.diagnostics ? { ...p, diagnostics: p.diagnostics.filter(dg => dg.id !== id) } : p))
    mentoringService.removeDiagnostic(id).catch(err => console.error('[Mentoring] deleteDiagnostic error:', err))
  }

  // ---- Indicators ----
  const addIndicator = (i: Omit<MentoringIndicator, 'id' | 'createdAt' | 'updatedAt'>): MentoringIndicator => {
    const ni: MentoringIndicator = { ...i, id: crypto.randomUUID(), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setIndicators(prev => [ni, ...prev])
    refreshPrograms(prev => prev.map(p => p.id === ni.programId ? { ...p, indicators: [...(p.indicators || []), ni] } : p))
    mentoringService.createIndicator(ni).catch(err => console.error('[Mentoring] createIndicator error:', err))
    return ni
  }
  const updateIndicator = (id: string, updates: Partial<MentoringIndicator>) => {
    setIndicators(prev => prev.map(i => i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i))
    refreshPrograms(prev => prev.map(p => p.indicators ? { ...p, indicators: (p.indicators || []).map(i => i.id === id ? { ...i, ...updates } : i) } : p))
    mentoringService.updateIndicator(id, updates).catch(err => console.error('[Mentoring] updateIndicator error:', err))
  }
  const deleteIndicator = (id: string) => {
    setIndicators(prev => prev.filter(i => i.id !== id))
    refreshPrograms(prev => prev.map(p => p.indicators ? { ...p, indicators: p.indicators.filter(i => i.id !== id) } : p))
    mentoringService.removeIndicator(id).catch(err => console.error('[Mentoring] deleteIndicator error:', err))
  }

  // ---- Documents ----
  const addDocument = (d: Omit<MentoringDocument, 'id' | 'createdAt'>): MentoringDocument => {
    const nd: MentoringDocument = { ...d, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setDocuments(prev => [nd, ...prev])
    refreshPrograms(prev => prev.map(p => p.id === nd.programId ? { ...p, documents: [...(p.documents || []), nd] } : p))
    mentoringService.createDocument(nd).catch(err => console.error('[Mentoring] createDocument error:', err))
    return nd
  }
  const updateDocument = (id: string, updates: Partial<MentoringDocument>) => {
    setDocuments(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d))
    refreshPrograms(prev => prev.map(p => p.documents ? { ...p, documents: (p.documents || []).map(d => d.id === id ? { ...d, ...updates } : d) } : p))
    mentoringService.updateDocument(id, updates).catch(err => console.error('[Mentoring] updateDocument error:', err))
  }
  const deleteDocument = (id: string) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
    refreshPrograms(prev => prev.map(p => p.documents ? { ...p, documents: p.documents.filter(d => d.id !== id) } : p))
    mentoringService.removeDocument(id).catch(err => console.error('[Mentoring] deleteDocument error:', err))
  }

  // ---- History ----
  const addHistory = (h: Omit<MentoringHistory, 'id' | 'createdAt'>) => {
    const nh: MentoringHistory = { ...h, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
    setHistory(prev => [nh, ...prev])
    refreshPrograms(prev => prev.map(p => p.id === nh.programId ? { ...p, history: [...(p.history || []), nh] } : p))
    mentoringService.createHistory(nh).catch(err => console.error('[Mentoring] createHistory error:', err))
  }

  // ---- Participants ----
  const addParticipant = (p: Omit<Participant, 'id' | 'createdAt'>): Participant => {
    const np: Participant = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString(), companyName: p.companyName || '—', role: p.role || 'Participante' }
    setParticipants(prev => [np, ...prev])
    if (np.programId) refreshPrograms(prev => prev.map(pr => pr.id === np.programId ? { ...pr, participants: [...(pr.participants || []), np] } : pr))
    mentoringService.createParticipant(np).catch(err => console.error('[Mentoring] createParticipant error:', err))
    return np
  }
  const updateParticipant = (id: string, updates: Partial<Participant>) => {
    setParticipants(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    refreshPrograms(prev => prev.map(pr => pr.participants ? { ...pr, participants: (pr.participants || []).map(p => p.id === id ? { ...p, ...updates } : p) } : pr))
    mentoringService.updateParticipant(id, updates).catch(err => console.error('[Mentoring] updateParticipant error:', err))
  }
  const deleteParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id))
    refreshPrograms(prev => prev.map(pr => pr.participants ? { ...pr, participants: pr.participants.filter(p => p.id !== id) } : pr))
    mentoringService.removeParticipant(id).catch(err => console.error('[Mentoring] deleteParticipant error:', err))
  }

  // ---- Competencies / Assessments / Reports ----
  const addCompetency = (c: Omit<Competency, 'id'>): Competency => {
    const nc: Competency = { ...c, id: crypto.randomUUID() }
    setCompetencies(prev => [...prev, nc])
    mentoringService.createCompetency(nc).catch(err => console.error('[Mentoring] createCompetency error:', err))
    return nc
  }
  const deleteCompetency = (id: string) => {
    setCompetencies(prev => prev.filter(c => c.id !== id))
    mentoringService.removeCompetency(id).catch(err => console.error('[Mentoring] removeCompetency error:', err))
  }
  const addAssessment = (a: Omit<Assessment, 'id'>): Assessment => {
    const na: Assessment = { ...a, id: crypto.randomUUID(), competencyScores: a.competencyScores || [] }
    setAssessments(prev => [na, ...prev])
    mentoringService.createAssessment(na).catch(err => console.error('[Mentoring] createAssessment error:', err))
    return na
  }
  const addMentoringReport = (r: Omit<MentoringReport, 'id' | 'generatedAt'>): MentoringReport => {
    const nr: MentoringReport = { ...r, id: crypto.randomUUID(), generatedAt: new Date().toISOString() }
    setMentoringReports(prev => [nr, ...prev])
    mentoringService.createReport(nr).catch(err => console.error('[Mentoring] createReport error:', err))
    return nr
  }

  // ---- AI stubs (arquitetura preparada p/ IA) ----
  const generateAISummary = async (sessionId: string): Promise<string> => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return 'Sessão não encontrada.'
    return `📋 **Resumo IA – ${session.title}**\n\nA sessão abordou os temas: ${session.topics || 'não informado'}. Principal decisão: ${session.decisions || 'a ser avaliado'}. Ação definida: ${session.definedActions || session.actionPlan || 'não definida'}.`
  }
  const generateAIInsights = async (participantId: string): Promise<string> => {
    const p = participants.find(x => x.id === participantId)
    if (!p) return 'Participante não encontrado.'
    const sessCount = sessions.filter(s => (s.participantIds || []).includes(participantId) || s.mentee === p.name).length
    return `🔍 **Insights IA – ${p.name}**\n\nO participante realizou ${sessCount} sessão(ões) de mentoria. Recomenda-se focar em comunicação e gestão de tempo para maximizar o impacto no programa.`
  }

  return (
    <MentoringContext.Provider value={{
      programs, participants, sessions, objectives, actions, feedbacks, diagnostics, indicators, documents, history,
      competencies, tools, assessments, mentoringReports,
      activeMentorings, activeRHPrograms, sessionsThisMonth, sessionsThisWeek, upcomingSessions, activeMentees,
      pendingSessionRegistrations, overdueActions, pendingFeedbacks, avgSatisfaction, mentoringHours,
      completedMentorings, nearClosing,
      activePDIs, completedGoals, overdueGoals, pdiPlans,
      addProgram, updateProgram, deleteProgram,
      addObjective, updateObjective, deleteObjective,
      addAction, updateAction, deleteAction,
      addSession, updateSession, deleteSession,
      addFeedback, updateFeedback, deleteFeedback,
      addDiagnostic, updateDiagnostic, deleteDiagnostic,
      addIndicator, updateIndicator, deleteIndicator,
      addDocument, updateDocument, deleteDocument,
      addHistory,
      addParticipant, updateParticipant, deleteParticipant,
      addCompetency, deleteCompetency,
      addAssessment,
      addMentoringReport,
      generateAISummary, generateAIInsights,
    }}>
      {children}
    </MentoringContext.Provider>
  )
}

export const useMentoring = () => {
  const ctx = useContext(MentoringContext)
  if (!ctx) throw new Error('useMentoring must be used within MentoringProvider')
  return ctx
}
