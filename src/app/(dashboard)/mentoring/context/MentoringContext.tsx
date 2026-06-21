'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// ==========================================
// 1. INTERFACES & TYPES
// ==========================================

export type MentoringType = 'individual' | 'coletiva' | 'lideranca' | 'executiva'
export type SessionStatus = 'agendada' | 'realizada' | 'cancelada'
export type PDIStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'atrasado'
export type AssessmentType = 'autoavaliacao' | 'lider' | '180' | '360'

export interface Participant {
  id: string
  name: string
  companyId: string
  companyName: string
  unit: string
  sector: string
  role: string
  directLeader: string
  email: string
  phone: string
  startDate: string
  notes: string
  avatar: string
  createdAt: string
}

export interface MentoringSession {
  id: string
  type: MentoringType
  title: string
  participantIds: string[]
  date: string
  duration: number // minutos
  objective: string
  topics: string
  tools: string[]
  actionPlan: string
  nextSteps: string
  insights: string
  challenges: string
  potentials: string
  status: SessionStatus
  createdAt: string
}

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

export interface Competency {
  id: string
  name: string
  description: string
  category: string
  isCustom: boolean
}

export interface DevelopmentTool {
  id: string
  name: string
  category: string
  description: string
  usageHistory: ToolUsage[]
}

export interface ToolUsage {
  id: string
  toolId: string
  sessionId: string
  participantId: string
  result: string
  date: string
}

export interface Assessment {
  id: string
  participantId: string
  type: AssessmentType
  evaluatorId?: string
  date: string
  competencyScores: CompetencyScore[]
  observations: string
}

export interface CompetencyScore {
  competencyId: string
  score: number // 1-5
}

export interface MentoringReport {
  id: string
  participantId: string
  type: 'individual' | 'lideranca' | 'evolucao' | 'executivo'
  title: string
  pdfUrl?: string
  generatedAt: string
}

interface MentoringContextType {
  // Data
  participants: Participant[]
  sessions: MentoringSession[]
  pdiPlans: PDIPlan[]
  competencies: Competency[]
  tools: DevelopmentTool[]
  assessments: Assessment[]
  mentoringReports: MentoringReport[]

  // Computed KPIs
  activeMentorings: number
  activePDIs: number
  sessionsThisMonth: number
  completedGoals: number
  overdueGoals: number

  // Mutators - Participants
  addParticipant: (p: Omit<Participant, 'id' | 'createdAt'>) => Participant
  updateParticipant: (id: string, updates: Partial<Participant>) => void
  deleteParticipant: (id: string) => void

  // Mutators - Sessions
  addSession: (s: Omit<MentoringSession, 'id' | 'createdAt'>) => MentoringSession
  updateSession: (id: string, updates: Partial<MentoringSession>) => void
  deleteSession: (id: string) => void

  // Mutators - PDI
  addPDIPlan: (plan: Omit<PDIPlan, 'id' | 'createdAt' | 'updatedAt'>) => PDIPlan
  updatePDIPlan: (id: string, updates: Partial<PDIPlan>) => void
  deletePDIPlan: (id: string) => void
  addPDIGoal: (pdiId: string, goal: Omit<PDIGoal, 'id' | 'pdiId'>) => PDIGoal
  updatePDIGoal: (pdiId: string, goalId: string, updates: Partial<PDIGoal>) => void
  deletePDIGoal: (pdiId: string, goalId: string) => void

  // Mutators - Competencies
  addCompetency: (c: Omit<Competency, 'id'>) => Competency
  deleteCompetency: (id: string) => void

  // Mutators - Tools
  addToolUsage: (toolId: string, usage: Omit<ToolUsage, 'id'>) => void

  // Mutators - Assessments
  addAssessment: (a: Omit<Assessment, 'id'>) => Assessment

  // Mutators - Reports
  addMentoringReport: (r: Omit<MentoringReport, 'id' | 'generatedAt'>) => MentoringReport

  // AI Assistance
  generateAISummary: (sessionId: string) => Promise<string>
  generateAIInsights: (participantId: string) => Promise<string>
  suggestPDI: (participantId: string) => Promise<PDIGoal[]>
}

// ==========================================
// 2. SEED DATA
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

const DEFAULT_TOOLS: DevelopmentTool[] = [
  { id: 'tool-1', name: 'Roda da Vida', category: 'Autoconhecimento', description: 'Avaliação do equilíbrio entre as áreas da vida', usageHistory: [] },
  { id: 'tool-2', name: 'Zona de Conforto', category: 'Desenvolvimento', description: 'Mapeamento das zonas de conforto, aprendizado e pânico', usageHistory: [] },
  { id: 'tool-3', name: 'Hábitos', category: 'Comportamental', description: 'Identificação e construção de hábitos produtivos', usageHistory: [] },
  { id: 'tool-4', name: 'Comunicação Não-Violenta', category: 'Comunicação', description: 'Técnica de comunicação empática e assertiva', usageHistory: [] },
  { id: 'tool-5', name: 'Modelo Feedback SBI', category: 'Feedback', description: 'Situação, Comportamento, Impacto - feedback estruturado', usageHistory: [] },
  { id: 'tool-6', name: 'Inteligência Emocional de Goleman', category: 'Emocional', description: 'Modelo dos 5 pilares da inteligência emocional', usageHistory: [] },
  { id: 'tool-7', name: 'Líder Coach', category: 'Liderança', description: 'Framework de liderança baseada em coaching', usageHistory: [] },
  { id: 'tool-8', name: 'DISC', category: 'Perfil Comportamental', description: 'Avaliação dos perfis: Dominância, Influência, Estabilidade, Conformidade', usageHistory: [] },
]

const SEED_PARTICIPANTS: Participant[] = []

const SEED_SESSIONS: MentoringSession[] = []

const SEED_PDI_PLANS: PDIPlan[] = []

// ==========================================
// 3. CONTEXT
// ==========================================

const MentoringContext = createContext<MentoringContextType | undefined>(undefined)

export const MentoringProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [participants, setParticipants] = useState<Participant[]>([])
  const [sessions, setSessions] = useState<MentoringSession[]>([])
  const [pdiPlans, setPDIPlans] = useState<PDIPlan[]>([])
  const [competencies, setCompetencies] = useState<Competency[]>([])
  const [tools, setTools] = useState<DevelopmentTool[]>([])
  const [assessments, setAssessments] = useState<Assessment[]>([])
  const [mentoringReports, setMentoringReports] = useState<MentoringReport[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const get = <T,>(key: string, fallback: T): T => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : fallback
      } catch { return fallback }
    }
    setParticipants(get('mentoring_participants', SEED_PARTICIPANTS))
    setSessions(get('mentoring_sessions', SEED_SESSIONS))
    setPDIPlans(get('mentoring_pdi', SEED_PDI_PLANS))
    setCompetencies(get('mentoring_competencies', DEFAULT_COMPETENCIES))
    setTools(get('mentoring_tools', DEFAULT_TOOLS))
    setAssessments(get('mentoring_assessments', []))
    setMentoringReports(get('mentoring_reports', []))
  }, [])

  const sync = (key: string, value: unknown) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
  }

  const setAndSync = <T,>(setter: React.Dispatch<React.SetStateAction<T>>, key: string) =>
    (val: T) => { setter(val); sync(key, val) }

  const setParticipantsS = setAndSync(setParticipants, 'mentoring_participants')
  const setSessionsS = setAndSync(setSessions, 'mentoring_sessions')
  const setPDIPlansS = setAndSync(setPDIPlans, 'mentoring_pdi')
  const setCompetenciesS = setAndSync(setCompetencies, 'mentoring_competencies')
  const setToolsS = setAndSync(setTools, 'mentoring_tools')
  const setAssessmentsS = setAndSync(setAssessments, 'mentoring_assessments')
  const setMentoringReportsS = setAndSync(setMentoringReports, 'mentoring_reports')

  // Computed
  const now = new Date()
  const activeMentorings = participants.length
  const activePDIs = pdiPlans.length
  const sessionsThisMonth = sessions.filter(s => {
    const d = new Date(s.date)
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
  }).length
  const completedGoals = pdiPlans.reduce((acc, p) => acc + p.goals.filter(g => g.status === 'concluido').length, 0)
  const overdueGoals = pdiPlans.reduce((acc, p) =>
    acc + p.goals.filter(g => g.status !== 'concluido' && new Date(g.deadline) < now).length, 0)

  // Participants
  const addParticipant = (p: Omit<Participant, 'id' | 'createdAt'>): Participant => {
    const np: Participant = { ...p, id: `part-${Date.now()}`, createdAt: new Date().toISOString() }
    setParticipantsS([np, ...participants])
    return np
  }
  const updateParticipant = (id: string, updates: Partial<Participant>) =>
    setParticipantsS(participants.map(p => p.id === id ? { ...p, ...updates } : p))
  const deleteParticipant = (id: string) =>
    setParticipantsS(participants.filter(p => p.id !== id))

  // Sessions
  const addSession = (s: Omit<MentoringSession, 'id' | 'createdAt'>): MentoringSession => {
    const ns: MentoringSession = { ...s, id: `sess-${Date.now()}`, createdAt: new Date().toISOString() }
    setSessionsS([ns, ...sessions])
    return ns
  }
  const updateSession = (id: string, updates: Partial<MentoringSession>) =>
    setSessionsS(sessions.map(s => s.id === id ? { ...s, ...updates } : s))
  const deleteSession = (id: string) =>
    setSessionsS(sessions.filter(s => s.id !== id))

  // PDI Plans
  const addPDIPlan = (plan: Omit<PDIPlan, 'id' | 'createdAt' | 'updatedAt'>): PDIPlan => {
    const np: PDIPlan = { ...plan, id: `pdi-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setPDIPlansS([np, ...pdiPlans])
    return np
  }
  const updatePDIPlan = (id: string, updates: Partial<PDIPlan>) =>
    setPDIPlansS(pdiPlans.map(p => p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
  const deletePDIPlan = (id: string) =>
    setPDIPlansS(pdiPlans.filter(p => p.id !== id))

  const addPDIGoal = (pdiId: string, goal: Omit<PDIGoal, 'id' | 'pdiId'>): PDIGoal => {
    const ng: PDIGoal = { ...goal, id: `goal-${Date.now()}`, pdiId }
    setPDIPlansS(pdiPlans.map(p => p.id === pdiId ? { ...p, goals: [...p.goals, ng], updatedAt: new Date().toISOString() } : p))
    return ng
  }
  const updatePDIGoal = (pdiId: string, goalId: string, updates: Partial<PDIGoal>) =>
    setPDIPlansS(pdiPlans.map(p => p.id === pdiId
      ? { ...p, goals: p.goals.map(g => g.id === goalId ? { ...g, ...updates } : g), updatedAt: new Date().toISOString() }
      : p))
  const deletePDIGoal = (pdiId: string, goalId: string) =>
    setPDIPlansS(pdiPlans.map(p => p.id === pdiId
      ? { ...p, goals: p.goals.filter(g => g.id !== goalId), updatedAt: new Date().toISOString() }
      : p))

  // Competencies
  const addCompetency = (c: Omit<Competency, 'id'>): Competency => {
    const nc: Competency = { ...c, id: `comp-${Date.now()}` }
    setCompetenciesS([...competencies, nc])
    return nc
  }
  const deleteCompetency = (id: string) =>
    setCompetenciesS(competencies.filter(c => c.id !== id))

  // Tools
  const addToolUsage = (toolId: string, usage: Omit<ToolUsage, 'id'>) => {
    const nu: ToolUsage = { ...usage, id: `usage-${Date.now()}` }
    setToolsS(tools.map(t => t.id === toolId ? { ...t, usageHistory: [...t.usageHistory, nu] } : t))
  }

  // Assessments
  const addAssessment = (a: Omit<Assessment, 'id'>): Assessment => {
    const na: Assessment = { ...a, id: `assess-${Date.now()}` }
    setAssessmentsS([...assessments, na])
    return na
  }

  // Reports
  const addMentoringReport = (r: Omit<MentoringReport, 'id' | 'generatedAt'>): MentoringReport => {
    const nr: MentoringReport = { ...r, id: `mreport-${Date.now()}`, generatedAt: new Date().toISOString() }
    setMentoringReportsS([nr, ...mentoringReports])
    return nr
  }

  // AI stubs
  const generateAISummary = async (sessionId: string): Promise<string> => {
    const session = sessions.find(s => s.id === sessionId)
    if (!session) return 'Sessão não encontrada.'
    return `📋 **Resumo IA – ${session.title}**\n\nA sessão abordou os temas: ${session.topics}. O participante demonstrou ${session.potentials || 'alto engajamento'}. Principal desafio identificado: ${session.challenges || 'a ser avaliado'}. Ação acordada: ${session.actionPlan}.`
  }

  const generateAIInsights = async (participantId: string): Promise<string> => {
    const p = participants.find(x => x.id === participantId)
    if (!p) return 'Participante não encontrado.'
    const sessCount = sessions.filter(s => s.participantIds.includes(participantId)).length
    return `🔍 **Insights IA – ${p.name}**\n\nO participante realizou ${sessCount} sessão(ões) de mentoria. Com base nos padrões identificados, recomenda-se focar em inteligência emocional e comunicação assertiva para maximizar o impacto na liderança.`
  }

  const suggestPDI = async (participantId: string): Promise<PDIGoal[]> => {
    return [
      {
        id: `sug-${Date.now()}-1`,
        pdiId: '',
        competency: 'Inteligência Emocional',
        objective: 'Desenvolver autogestão emocional em situações de pressão',
        action: 'Praticar técnicas de mindfulness 10 min/dia durante 60 dias',
        responsible: 'Participante',
        deadline: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        indicator: 'Redução do estresse percebido em 30% (escala 1-10)',
        status: 'nao_iniciado'
      },
    ]
  }

  return (
    <MentoringContext.Provider value={{
      participants, sessions, pdiPlans, competencies, tools, assessments, mentoringReports,
      activeMentorings, activePDIs, sessionsThisMonth, completedGoals, overdueGoals,
      addParticipant, updateParticipant, deleteParticipant,
      addSession, updateSession, deleteSession,
      addPDIPlan, updatePDIPlan, deletePDIPlan, addPDIGoal, updatePDIGoal, deletePDIGoal,
      addCompetency, deleteCompetency,
      addToolUsage,
      addAssessment,
      addMentoringReport,
      generateAISummary, generateAIInsights, suggestPDI,
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
