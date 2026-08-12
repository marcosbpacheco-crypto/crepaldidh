export type TrainingType = 'Palestra' | 'Treinamento' | 'Workshop' | 'SIPAT' | 'Capacitação' | 'Imersão' | 'Mentoria coletiva'
export type TrainingStatus = 'planejado' | 'agendado' | 'em_divulgacao' | 'realizado' | 'cancelado' | 'reagendado' | 'concluido'
export type SipatStatus = 'planejado' | 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'
export type TrainingTargetType = 'empresa' | 'pessoa' | 'ambos'
export type TimelineStageStatus = 'pendente' | 'em_andamento' | 'concluido' | 'bloqueado'

export interface SipatProgram {
  id: string; companyId: string; companyName: string; title: string; theme: string
  startDate: string; endDate: string; status: SipatStatus; observations?: string
  schedule: SipatDay[]; createdAt: string
}
export interface SipatDay {
  id: string; sipatProgramId: string; dayNumber: number; date: string
  startTime: string; endTime: string; theme: string; facilitator: string; location?: string
}
export interface TrainingEvent {
  id: string; companyId?: string; companyName?: string; projectId?: string; projectName?: string
  sipatProgramId?: string; trainingTypeId?: string; targetType?: TrainingTargetType
  type: TrainingType; name: string; theme: string; objective?: string
  targetAudience?: string; facilitator: string; modality: 'presencial' | 'online' | 'hibrido'
  location?: string; eventDate: string; startTime: string; endTime: string
  hoursDuration: number; expectedParticipants: number; cost: number; status: TrainingStatus
  notes?: string; createdAt: string
}
export interface TrainingParticipant {
  id: string; eventId: string; crmContactId?: string; name: string; companyName: string
  unit?: string; sector?: string; role?: string; email?: string; phone?: string
  attendanceStatus: 'presente' | 'ausente' | 'justificado'; entryTime?: string
  signatureSimple?: string; justification?: string
}
export interface TrainingCertificate {
  id: string; participantId: string; participantName: string; eventId: string; eventName: string
  clientName: string; hours: number; facilitator: string; date: string
  validationCode: string; pdfUrl?: string; issuedAt: string
}
export interface TrainingFeedback {
  id: string; eventId: string; participantId?: string; ratingGeneral: number; clarityContent: number
  applicability: number; didactics: number; organization: number; nps: number; comments?: string; createdAt: string
}
export interface TrainingMaterial {
  id: string; eventId: string; name: string; type: 'slide' | 'apostila' | 'pdf' | 'foto' | 'video' | 'link' | 'dinamica' | 'checklist' | 'evidencia'
  fileUrl: string; createdAt: string
}
export interface TrainingReport {
  id: string; eventId: string; pdfUrl?: string; recommendations?: string; executiveSummary?: string; generatedAt: string
}

// ---- Catálogo de tipos cadastráveis ----
export interface TrainingTypeItem {
  id: string; name: string; description?: string
  category: TrainingType; targetType?: TrainingTargetType
  hoursDuration?: number; active: boolean; createdAt: string
  materials?: TrainingTypeMaterial[]
}

export interface TrainingTypeMaterial {
  id: string; trainingTypeId: string; name: string
  type: 'slide' | 'apostila' | 'pdf' | 'foto' | 'video' | 'link' | 'dinamica' | 'checklist' | 'evidencia'
  fileUrl?: string; createdAt: string
}

// ---- Linha do tempo por evento ----
export interface TimelineStageDef {
  key: string
  title: string
}

export const TIMELINE_STAGES: TimelineStageDef[] = [
  { key: 'planejamento', title: 'Planejamento' },
  { key: 'materiais', title: 'Materiais' },
  { key: 'divulgacao', title: 'Divulgação / Agendamento' },
  { key: 'execucao', title: 'Execução' },
  { key: 'avaliacao', title: 'Avaliação' },
  { key: 'certificados', title: 'Certificados' },
]

export interface TrainingTimelineStep {
  id: string; eventId: string; stage: string; title: string
  status: TimelineStageStatus; plannedDate?: string; completedDate?: string
  notes?: string; sortOrder: number; createdAt: string
}