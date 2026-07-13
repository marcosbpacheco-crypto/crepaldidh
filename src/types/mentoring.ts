export type MentoringType = 'individual' | 'coletiva' | 'lideranca' | 'executiva'
export type SessionStatus = 'agendada' | 'realizada' | 'cancelada'
export type PDIStatus = 'nao_iniciado' | 'em_andamento' | 'concluido' | 'atrasado'
export type AssessmentType = 'autoavaliacao' | 'lider' | '180' | '360'

export interface Institution {
  id: string; name: string; cnpj?: string; address?: string; city?: string; state?: string; phone?: string; email?: string; contact?: string; notes?: string
}
export interface Mentor {
  id: string; name: string; email: string; phone: string; specialties: string[]; bio?: string; avatar?: string; active: boolean
}
export interface Participant {
  id: string; name: string; companyId: string; companyName: string; unit: string; sector: string
  role: string; directLeader: string; email: string; phone: string; startDate: string; notes: string; avatar: string; createdAt: string
  mentorId?: string; institutionId?: string; contractId?: string; crmContactId?: string; currentCycle?: number
}
export interface MentoringSession {
  id: string; type: MentoringType; title: string; participantIds: string[]; date: string; duration: number
  objective: string; topics: string; tools: string[]; actionPlan: string; nextSteps: string; insights: string
  challenges: string; potentials: string; status: SessionStatus; createdAt: string
  participantId?: string; mentorId?: string; sessionType?: string; method?: string; mood?: string; nextDate?: string; paAction?: string
}
export interface PDIGoal {
  id: string; pdiId: string; competency: string; objective: string; action: string; responsible: string
  deadline: string; indicator: string; status: PDIStatus
}
export interface PDIPlan {
  id: string; participantId: string; title: string; period: string; goals: PDIGoal[]; createdAt: string; updatedAt: string
}
export interface Competency {
  id: string; name: string; description: string; category: string; isCustom: boolean
}
export interface DevelopmentTool {
  id: string; name: string; category: string; description: string; usageHistory: ToolUsage[]
}
export interface ToolUsage {
  id: string; toolId: string; sessionId: string; participantId: string; result: string; date: string
}
export interface Assessment {
  id: string; participantId: string; type: AssessmentType; evaluatorId?: string; date: string
  competencyScores: CompetencyScore[]; observations: string
}
export interface CompetencyScore { competencyId: string; score: number }
export interface MentoringReport {
  id: string; participantId: string; type: 'individual' | 'lideranca' | 'evolucao' | 'executivo'; title: string; pdfUrl?: string; generatedAt: string
}

// Additional types for service layer compatibility
export interface MentoringGoal {
  id: string; participantId: string; description: string; deadline: string; status: string; createdAt: string
}
export interface PdiAction {
  id: string; planId: string; action: string; responsible: string; deadline: string; status: string; notes?: string
}
export interface MentoringFeedback {
  id: string; sessionId: string; participantId: string; mentorId: string; rating: number; comment: string; createdAt: string
}
export interface MentoringAssessment {
  id: string; participantId: string; type: string; date: string; scores: Record<string, number>; notes?: string
}
export interface MentoringNote {
  id: string; sessionId: string; content: string; author: string; createdAt: string
}
export interface CompetencyAssessment {
  id: string; participantId: string; competencyId: string; score: number; assessedBy: string; date: string
}
export interface MentorTool {
  id: string; name: string; category: string; description: string; icon?: string
}
