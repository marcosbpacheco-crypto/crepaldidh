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

const SEED_PARTICIPANTS: Participant[] = [
  {
    id: 'part-1',
    name: 'Ricardo Mendes',
    companyId: 'comp-2',
    companyName: 'Vale S.A.',
    unit: 'Operações MG',
    sector: 'Logística',
    role: 'Gerente de Operações',
    directLeader: 'Diretor Roberto Santos',
    email: 'ricardo.mendes@vale.com',
    phone: '(31) 99123-4567',
    startDate: '2026-04-01',
    notes: 'Foco em liderança transformacional e gestão de conflitos.',
    avatar: 'RM',
    createdAt: '2026-04-01T10:00:00Z'
  },
  {
    id: 'part-2',
    name: 'Juliana Costa',
    companyId: 'comp-1',
    companyName: 'BR Distribuidora',
    unit: 'Matriz RJ',
    sector: 'Recursos Humanos',
    role: 'Coordenadora de DHO',
    directLeader: 'Mariana Souza',
    email: 'juliana.costa@br.com.br',
    phone: '(21) 98765-1234',
    startDate: '2026-05-01',
    notes: 'Desenvolvimento de lideranças e comunicação assertiva.',
    avatar: 'JC',
    createdAt: '2026-05-01T10:00:00Z'
  },
  {
    id: 'part-3',
    name: 'Fernando Alves',
    companyId: 'comp-3',
    companyName: 'Banco Itaú',
    unit: 'Centro Tecnológico SP',
    sector: 'TI Corporativa',
    role: 'Diretor de Tecnologia',
    directLeader: 'CEO Corporativo',
    email: 'fernando.alves@itau.com.br',
    phone: '(11) 97654-3210',
    startDate: '2026-03-15',
    notes: 'Mentoria executiva. Foco em tomada de decisão e inteligência emocional.',
    avatar: 'FA',
    createdAt: '2026-03-15T10:00:00Z'
  },
]

const SEED_SESSIONS: MentoringSession[] = [
  {
    id: 'sess-1',
    type: 'lideranca',
    title: 'Sessão 1 - Autoconhecimento e Perfil DISC',
    participantIds: ['part-1'],
    date: '2026-05-05T10:00:00Z',
    duration: 90,
    objective: 'Mapear perfil comportamental e identificar pontos de desenvolvimento',
    topics: 'Perfil DISC, Gestão de Conflitos, Comunicação com a equipe',
    tools: ['tool-8', 'tool-4'],
    actionPlan: 'Praticar comunicação não-violenta nas reuniões de equipe por 2 semanas',
    nextSteps: 'Relatório de feedback da equipe + autoavaliação na próxima sessão',
    insights: 'Ricardo demonstra forte perfil Dominante com alta influência. Trabalhar escuta ativa.',
    challenges: 'Dificuldade em delegar e confiar na equipe operacional',
    potentials: 'Alto potencial de liderança estratégica, excelente visão sistêmica',
    status: 'realizada',
    createdAt: '2026-05-05T12:00:00Z'
  },
  {
    id: 'sess-2',
    type: 'executiva',
    title: 'Sessão 2 - Roda da Vida e Equilíbrio',
    participantIds: ['part-3'],
    date: '2026-05-12T14:00:00Z',
    duration: 60,
    objective: 'Avaliação do equilíbrio vida pessoal/profissional e definição de prioridades',
    topics: 'Roda da Vida, Gestão do Tempo, Saúde Mental Executiva',
    tools: ['tool-1', 'tool-3'],
    actionPlan: 'Definir horário de desconexão digital às 21h durante 30 dias',
    nextSteps: 'Check-in sobre hábitos de desconexão + levantamento de metas Q3',
    insights: 'Alta dispersão de energia entre múltiplas frentes. Clareza de propósito ausente.',
    challenges: 'Excesso de reuniões e dificuldade de recusar demandas',
    potentials: 'Raciocínio analítico excepcional, grande capacidade de articulação política',
    status: 'realizada',
    createdAt: '2026-05-12T15:00:00Z'
  },
  {
    id: 'sess-3',
    type: 'individual',
    title: 'Sessão 3 - Comunicação Assertiva',
    participantIds: ['part-2'],
    date: '2026-06-05T09:00:00Z',
    duration: 60,
    objective: 'Desenvolver assertividade na comunicação com stakeholders',
    topics: 'Comunicação Não-Violenta, Feedback SBI, Apresentações executivas',
    tools: ['tool-4', 'tool-5'],
    actionPlan: 'Estruturar feedback usando modelo SBI para 3 colaboradores',
    nextSteps: 'Relatório de aplicação prática do feedback estruturado',
    insights: '',
    challenges: '',
    potentials: '',
    status: 'agendada',
    createdAt: '2026-05-20T10:00:00Z'
  },
]

const SEED_PDI_PLANS: PDIPlan[] = [
  {
    id: 'pdi-1',
    participantId: 'part-1',
    title: 'PDI Ricardo Mendes - Liderança Transformacional 2026',
    period: '2026-04-01 a 2026-09-30',
    createdAt: '2026-04-05T10:00:00Z',
    updatedAt: '2026-05-10T14:00:00Z',
    goals: [
      {
        id: 'goal-1',
        pdiId: 'pdi-1',
        competency: 'Comunicação',
        objective: 'Melhorar a comunicação com a equipe operacional',
        action: 'Realizar reuniões semanais de feedback com cada líder de turno',
        responsible: 'Ricardo Mendes',
        deadline: '2026-06-30',
        indicator: 'Satisfação da equipe acima de 8/10 no pulso mensal',
        status: 'em_andamento'
      },
      {
        id: 'goal-2',
        pdiId: 'pdi-1',
        competency: 'Gestão de Conflitos',
        objective: 'Reduzir conflitos interpessoais na equipe',
        action: 'Aplicar técnica de mediação de conflitos aprendida na mentoria',
        responsible: 'Ricardo Mendes + RH',
        deadline: '2026-07-31',
        indicator: 'Zero conflitos escalados ao RH no trimestre',
        status: 'nao_iniciado'
      },
    ]
  },
]

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
