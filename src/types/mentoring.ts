// ==========================================
// Tipos do módulo Mentorias (reestruturado)
// Modalidades: individual | rh
// SEM PDI — Objetivos + Ações substituem o conceito
// ==========================================

export type MentoringModality = 'individual' | 'rh'
export type MentoringProgramStatus = 'planejada' | 'ativa' | 'pausada' | 'concluida' | 'cancelada'
export type ObjectiveStatus = 'nao_iniciado' | 'em_andamento' | 'em_atencao' | 'concluido' | 'cancelado'
export type ActionStatus = 'pendente' | 'em_andamento' | 'concluida' | 'atrasada' | 'cancelada'
export type SessionStatus = 'agendada' | 'realizada' | 'cancelada'
export type FeedbackAuthorType = 'mentor' | 'mentorado' | 'participante'
export type ParticipantType = 'rh' | 'lideranca' | 'gestor' | 'colaborador' | 'direcao' | 'outro'
export type SessionType = 'individual' | 'coletiva' | 'rh'
export type AssessmentType = 'autoavaliacao' | 'lider' | '180' | '360'
export type DiagnosticStatus = 'rascunho' | 'concluido'

export interface MentoringProgram {
  id: string
  modality: MentoringModality
  name: string
  companyId?: string
  companyName?: string
  mentor?: string
  rhResponsible?: string
  status: MentoringProgramStatus
  startDate?: string
  endDate?: string
  mainObjective?: string
  progress: number
  notes?: string
  // mentorado (individual)
  menteeName?: string
  menteeRole?: string
  menteeDepartment?: string
  menteeContact?: string
  menteeGestor?: string
  createdAt: string
  updatedAt: string
  objectives?: MentoringObjective[]
  actions?: MentoringAction[]
  sessions?: MentoringSession[]
  participants?: Participant[]
  feedbacks?: MentoringFeedback[]
  diagnostics?: MentoringDiagnostic[]
  indicators?: MentoringIndicator[]
  documents?: MentoringDocument[]
  history?: MentoringHistory[]
}

export interface MentoringObjective {
  id: string
  programId: string
  title: string
  description?: string
  category?: string
  priority?: string
  indicator?: string
  goal?: string
  deadline?: string
  progress: number
  status: ObjectiveStatus
  observations?: string
  responsible?: string
  createdAt: string
  updatedAt: string
  actions?: MentoringAction[]
}

export interface MentoringAction {
  id: string
  programId: string
  objectiveId?: string
  description: string
  responsible?: string
  deadline?: string
  priority?: string
  status: ActionStatus
  evidence?: string
  comment?: string
  completedDate?: string
  createdAt: string
}

export interface MentoringSession {
  id: string
  programId?: string
  sessionNumber?: number
  type: SessionType
  title: string
  date: string
  startTime?: string
  duration: number
  modality?: string
  theme?: string
  objective?: string
  topics?: string
  summary?: string
  keyPoints?: string
  decisions?: string
  definedActions?: string
  privateObservations?: string
  feedback?: string
  nextSession?: string
  mentor?: string
  mentee?: string
  actionPlan?: string
  nextSteps?: string
  insights?: string
  challenges?: string
  potentials?: string
  status: SessionStatus
  createdAt: string
  participantIds?: string[]
}

export interface MentoringFeedback {
  id: string
  programId: string
  sessionId?: string
  authorType: FeedbackAuthorType
  satisfaction?: number
  relevance?: number
  applicability?: number
  evolutionPerceived?: number
  comments?: string
  createdAt: string
}

export interface MentoringDiagnosticArea {
  group: string
  area: string
  note: number
  maturity?: string
  comment?: string
  evidence?: string
  recommendations?: string
}

export interface MentoringDiagnostic {
  id: string
  programId: string
  period?: string
  status: DiagnosticStatus
  areas: MentoringDiagnosticArea[]
  observations?: string
  createdAt: string
}

export interface MentoringIndicator {
  id: string
  programId: string
  name: string
  description?: string
  unit?: string
  initialValue?: string
  currentValue?: string
  targetValue?: string
  trend?: string
  period?: string
  source?: string
  createdAt: string
  updatedAt: string
}

export interface MentoringDocument {
  id: string
  programId: string
  sessionId?: string
  documentId?: string
  name: string
  type?: string
  fileUrl?: string
  description?: string
  createdAt: string
}

export interface MentoringHistory {
  id: string
  programId: string
  entityType?: string
  entityId?: string
  action?: string
  description?: string
  createdBy?: string
  createdAt: string
}

export interface Participant {
  id: string
  name: string
  companyId?: string
  companyName: string
  unit?: string
  sector?: string
  role: string
  directLeader?: string
  email: string
  phone?: string
  startDate: string
  notes?: string
  avatar?: string
  createdAt: string
  programId?: string
  participantType?: ParticipantType
}

export interface Competency {
  id: string
  name: string
  description?: string
  category?: string
  isCustom?: boolean
}

export interface DevelopmentTool {
  id: string
  name: string
  category?: string
  description?: string
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
  participantId?: string
  type: AssessmentType
  evaluatorId?: string
  date: string
  competencyScores?: CompetencyScore[]
  observations?: string
}

export interface CompetencyScore {
  competencyId: string
  score: number
}

export interface MentoringReport {
  id: string
  participantId?: string
  programId?: string
  type: 'individual' | 'rh' | 'evolucao' | 'executivo'
  title: string
  pdfUrl?: string
  generatedAt: string
}

// Compatibilidade com consumers antigos (BiContext etc.)
export type MentoringGoal = MentoringObjective
export interface MentoringNote {
  id: string
  sessionId: string
  content: string
  author: string
  createdAt: string
}
export interface MentorTool {
  id: string
  name: string
  category?: string
  description?: string
  icon?: string
}
export interface Institution {
  id: string
  name: string
  cnpj?: string
  address?: string
  city?: string
  state?: string
  phone?: string
  email?: string
  contact?: string
  notes?: string
}
export interface Mentor {
  id: string
  name: string
  email: string
  phone: string
  specialties: string[]
  bio?: string
  avatar?: string
  active: boolean
}
