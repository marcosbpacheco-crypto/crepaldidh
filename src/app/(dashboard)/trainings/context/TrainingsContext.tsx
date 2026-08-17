'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trainingService } from '@/services/trainingService'
import { calendarService } from '@/services/calendarService'
import type { TrainingTypeItem, TrainingTypeMaterial, TrainingTimelineStep, TrainingTargetType } from '@/types/trainings'

// ==========================================
// 1. INTERFACES & TYPES
// ==========================================

export type TrainingType = 'Palestra' | 'Treinamento' | 'Workshop' | 'SIPAT' | 'Capacitação' | 'Imersão' | 'Mentoria coletiva'
export type TrainingStatus = 'planejado' | 'agendado' | 'em_divulgacao' | 'realizado' | 'cancelado' | 'reagendado' | 'concluido'
export type SipatStatus = 'planejado' | 'agendado' | 'em_andamento' | 'concluido' | 'cancelado'

export interface SipatProgram {
  id: string
  companyId: string
  companyName: string
  title: string
  theme: string
  startDate: string
  endDate: string
  status: SipatStatus
  observations?: string
  schedule: SipatDay[]
  createdAt: string
}

export interface SipatDay {
  id: string
  sipatProgramId: string
  dayNumber: number
  date: string
  startTime: string
  endTime: string
  theme: string
  facilitator: string
  location?: string
}

export interface TrainingEvent {
  id: string
  companyId?: string
  companyName?: string
  projectId?: string
  projectName?: string
  sipatProgramId?: string
  trainingTypeId?: string
  targetType?: TrainingTargetType
  type: TrainingType
  name: string
  theme: string
  objective?: string
  targetAudience?: string
  facilitator: string
  modality: 'presencial' | 'online' | 'hibrido'
  location?: string
  eventDate: string
  startTime: string
  endTime: string
  hoursDuration: number
  expectedParticipants: number
  cost: number // Receita/Valor contratado
  status: TrainingStatus
  notes?: string
  createdAt: string
}

export interface TrainingParticipant {
  id: string
  eventId: string
  crmContactId?: string
  name: string
  companyName: string
  unit?: string
  sector?: string
  role?: string
  email?: string
  phone?: string
  attendanceStatus: 'presente' | 'ausente' | 'justificado'
  entryTime?: string
  signatureSimple?: string
  justification?: string
}

export interface TrainingCertificate {
  id: string
  participantId: string
  participantName: string
  eventId: string
  eventName: string
  clientName: string
  hours: number
  facilitator: string
  date: string
  validationCode: string
  pdfUrl?: string
  issuedAt: string
}

export interface TrainingFeedback {
  id: string
  eventId: string
  participantId?: string
  ratingGeneral: number // 1-5
  clarityContent: number // 1-5
  applicability: number // 1-5
  didactics: number // 1-5
  organization: number // 1-5
  nps: number // 0-10
  comments?: string
  status?: 'pendente' | 'respondido'
  createdAt: string
}

export interface TrainingMaterial {
  id: string
  eventId: string
  name: string
  type: 'slide' | 'apostila' | 'pdf' | 'foto' | 'video' | 'link' | 'dinamica' | 'checklist' | 'evidencia'
  fileUrl: string
  createdAt: string
}

export interface TrainingReport {
  id: string
  eventId: string
  pdfUrl?: string
  recommendations?: string
  executiveSummary?: string
  generatedAt: string
}

interface TrainingsContextType {
  // Data State
  sipatPrograms: SipatProgram[]
  events: TrainingEvent[]
  participants: TrainingParticipant[]
  certificates: TrainingCertificate[]
  feedbacks: TrainingFeedback[]
  materials: TrainingMaterial[]
  reports: TrainingReport[]
  trainingTypes: TrainingTypeItem[]
  typeMaterials: TrainingTypeMaterial[]
  timelineSteps: TrainingTimelineStep[]

  // Computed KPIs
  scheduledEvents: number
  completedEvents: number
  completedLectures: number
  activeSipats: number
  totalRegisteredParticipants: number
  attendanceRate: number
  certificatesIssued: number
  averageNps: number
  totalRevenue: number

  // Mutators - Events
  addEvent: (e: Omit<TrainingEvent, 'id' | 'createdAt'>) => TrainingEvent
  updateEvent: (id: string, updates: Partial<TrainingEvent>) => void
  deleteEvent: (id: string) => void

  // Mutators - Participants
  addParticipant: (p: Omit<TrainingParticipant, 'id'>) => TrainingParticipant
  updateParticipant: (id: string, updates: Partial<TrainingParticipant>) => void
  deleteParticipant: (id: string) => void
  importParticipantsList: (eventId: string, list: Omit<TrainingParticipant, 'id' | 'eventId'>[]) => void
  confirmAttendance: (participantId: string, entryTime: string, signature: string) => void
  recordAbsenceJustification: (participantId: string, justification: string) => void

  // Mutators - Certificates
  issueCertificate: (participantId: string, eventId: string) => TrainingCertificate
  issueCertificatesInBulk: (eventId: string) => void

  // Mutators - Feedbacks
  addFeedback: (f: Omit<TrainingFeedback, 'id' | 'createdAt'>) => TrainingFeedback

  // Mutators - Materials
  addMaterial: (m: Omit<TrainingMaterial, 'id' | 'createdAt'>) => TrainingMaterial
  deleteMaterial: (id: string) => void

  // Mutators - Reports
  generateEventReport: (eventId: string, summary: string, recs: string) => TrainingReport

  // Mutators - SIPAT
  addSipatProgram: (s: Omit<SipatProgram, 'id' | 'schedule' | 'createdAt'>, schedule: Omit<SipatDay, 'id' | 'sipatProgramId'>[]) => SipatProgram
  updateSipatStatus: (id: string, status: SipatStatus) => void
  deleteSipatProgram: (id: string) => void

  // Mutators - Training Types (catálogo)
  addTrainingType: (t: Omit<TrainingTypeItem, 'id' | 'createdAt'>) => void
  updateTrainingType: (id: string, updates: Partial<TrainingTypeItem>) => void
  deleteTrainingType: (id: string) => void
  addTypeMaterial: (m: Omit<TrainingTypeMaterial, 'id' | 'createdAt'>) => void
  deleteTypeMaterial: (id: string) => void

  // Mutators - Timeline
  addTimelineStep: (s: Omit<TrainingTimelineStep, 'id' | 'createdAt'>) => void
  updateTimelineStep: (id: string, updates: Partial<TrainingTimelineStep>) => void
  deleteTimelineStep: (id: string) => void

  // AI Helpers
  generateAILecturesThemes: (clientIndustry: string) => Promise<string[]>
  generateAILectureScript: (theme: string) => Promise<string>
  generateAIEmailInvite: (eventName: string, date: string, hour: string, linkOrLoc: string) => Promise<string>
  generateAIExecutiveSummary: (eventId: string) => Promise<string>
}

// ==========================================
// 2. SEED DATA
// ==========================================

const SEED_SIPATS: SipatProgram[] = []

const SEED_EVENTS: TrainingEvent[] = []

const SEED_PARTICIPANTS: TrainingParticipant[] = []

const SEED_FEEDBACKS: TrainingFeedback[] = []

const SEED_CERTIFICATES: TrainingCertificate[] = []

// ==========================================
// 3. CONTEXT PROVIDER
// ==========================================

const TrainingsContext = createContext<TrainingsContextType | undefined>(undefined)

export const TrainingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const qc = useQueryClient()
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['trainings'] }), [qc])

  const { data: events = [] } = useQuery({ queryKey: ['trainings', 'events'], queryFn: () => trainingService.listEvents() })
  const { data: participants = [] } = useQuery({ queryKey: ['trainings', 'participants'], queryFn: () => trainingService.listParticipants('') })
  const { data: certificates = [] } = useQuery({ queryKey: ['trainings', 'certificates'], queryFn: () => trainingService.listCertificates() })
  const { data: feedbacks = [] } = useQuery({ queryKey: ['trainings', 'feedbacks'], queryFn: () => trainingService.listFeedbacks('') })
  const { data: materials = [] } = useQuery({ queryKey: ['trainings', 'materials'], queryFn: () => trainingService.listMaterials('') })
  const { data: reports = [] } = useQuery({ queryKey: ['trainings', 'reports'], queryFn: () => trainingService.listReports() })
  const { data: sipatPrograms = [] } = useQuery({ queryKey: ['trainings', 'sipats'], queryFn: () => trainingService.listSipats() })
  const { data: trainingTypes = [] } = useQuery({ queryKey: ['trainings', 'types'], queryFn: () => trainingService.listTrainingTypes() })
  const { data: typeMaterials = [] } = useQuery({ queryKey: ['trainings', 'type-materials'], queryFn: () => trainingService.listTypeMaterials() })
  const { data: timelineSteps = [] } = useQuery({ queryKey: ['trainings', 'timeline'], queryFn: () => trainingService.listTimelineSteps() })

  // Computed KPIs
  const scheduledEvents = events.filter(e => e.status === 'agendado' || e.status === 'planejado').length
  const completedEvents = events.filter(e => e.status === 'realizado' || e.status === 'concluido').length
  const completedLectures = events.filter(e => e.type === 'Palestra' && (e.status === 'realizado' || e.status === 'concluido')).length
  const activeSipats = sipatPrograms.filter(s => s.status === 'em_andamento').length
  
  const totalRegisteredParticipants = participants.length
  
  const presentCount = participants.filter(p => p.attendanceStatus === 'presente').length
  const attendanceRate = totalRegisteredParticipants > 0 
    ? Math.round((presentCount / totalRegisteredParticipants) * 100)
    : 0

  const certificatesIssued = certificates.length

  // NPS calculation (promoters - detractors)
  const respondedFeedbacks = feedbacks.filter(f => f.status !== 'pendente')
  const averageNps = respondedFeedbacks.length > 0
    ? Math.round(
        (() => {
          const promoters = respondedFeedbacks.filter(f => f.nps >= 9).length
          const detractors = respondedFeedbacks.filter(f => f.nps <= 6).length
          return ((promoters - detractors) / respondedFeedbacks.length) * 100
        })()
      )
    : 0

  const totalRevenue = events
    .filter(e => e.status === 'realizado' || e.status === 'concluido' || e.status === 'agendado')
    .reduce((acc, e) => acc + e.cost, 0)

  // ==========================================
  // MUTATOR IMPLEMENTATIONS
  // ==========================================

  // Mutations
  const addEventMut = useMutation({ mutationFn: (i: any) => trainingService.createEvent(i), onSuccess: invalidate })
  const updateEventMut = useMutation({ mutationFn: ({ id, ...i }: { id: string } & any) => trainingService.updateEvent(id, i), onSuccess: invalidate })
  const deleteEventMut = useMutation({ mutationFn: (id: string) => trainingService.removeEvent(id), onSuccess: invalidate })
  const addPartMut = useMutation({ mutationFn: (i: any) => trainingService.createParticipant(i), onSuccess: invalidate })
  const updatePartMut = useMutation({ mutationFn: ({ id, ...i }: { id: string } & any) => trainingService.updateParticipant(id, i), onSuccess: invalidate })
  const deletePartMut = useMutation({ mutationFn: (id: string) => trainingService.removeParticipant(id), onSuccess: invalidate })
  const addCertMut = useMutation({ mutationFn: (i: any) => trainingService.createCertificate(i), onSuccess: invalidate })
  const addFbMut = useMutation({ mutationFn: (i: any) => trainingService.createFeedback(i), onSuccess: invalidate })
  const addMatMut = useMutation({ mutationFn: (i: any) => trainingService.createMaterial(i), onSuccess: invalidate })
  const addSipatMut = useMutation({ mutationFn: (i: any) => trainingService.createSipat(i), onSuccess: invalidate })

  const addTypeMut = useMutation({ mutationFn: (i: any) => trainingService.createTrainingType(i), onSuccess: invalidate })
  const updateTypeMut = useMutation({ mutationFn: ({ id, ...i }: { id: string } & any) => trainingService.updateTrainingType(id, i), onSuccess: invalidate })
  const deleteTypeMut = useMutation({ mutationFn: (id: string) => trainingService.removeTrainingType(id), onSuccess: invalidate })
  const addTypeMatMut = useMutation({ mutationFn: (i: any) => trainingService.createTypeMaterial(i), onSuccess: invalidate })
  const deleteTypeMatMut = useMutation({ mutationFn: (id: string) => trainingService.removeTypeMaterial(id), onSuccess: invalidate })
  const addTimelineMut = useMutation({ mutationFn: (i: any) => trainingService.createTimelineStep(i), onSuccess: invalidate })
  const updateTimelineMut = useMutation({ mutationFn: ({ id, ...i }: { id: string } & any) => trainingService.updateTimelineStep(id, i), onSuccess: invalidate })
  const deleteTimelineMut = useMutation({ mutationFn: (id: string) => trainingService.removeTimelineStep(id), onSuccess: invalidate })

  const updateCache = (key: string[], updater: (old: any[]) => any[]) => {
    qc.setQueryData(key, (old: any) => Array.isArray(old) ? updater(old) : old)
  }

  // Events CRUD
  const addEvent = (e: Omit<TrainingEvent, 'id' | 'createdAt'>): TrainingEvent => {
    const ne: TrainingEvent = { ...e, id: `tr-event-${Date.now()}`, createdAt: new Date().toISOString() }
    updateCache(['trainings', 'events'], old => [ne, ...old])
    addEventMut.mutate(ne as any)
    syncEventToCalendar(ne)
    return ne
  }

  const updateEvent = (id: string, updates: Partial<TrainingEvent>) => {
    updateCache(['trainings', 'events'], old => old.map((e: any) => e.id === id ? { ...e, ...updates } : e))
    updateEventMut.mutate({ id, ...updates } as any)
    const cur = events.find(e => e.id === id)
    if (cur) syncEventToCalendar({ ...cur, ...updates })
  }

  const deleteEvent = (id: string) => {
    updateCache(['trainings', 'events'], old => old.filter((e: any) => e.id !== id))
    updateCache(['trainings', 'participants'], old => old.filter((p: any) => p.eventId !== id))
    deleteEventMut.mutate(id)
  }

  // Participants
  const addParticipant = (p: Omit<TrainingParticipant, 'id'>): TrainingParticipant => {
    const np: TrainingParticipant = { ...p, id: `tpart-${Date.now()}` }
    updateCache(['trainings', 'participants'], old => [np, ...old])
    addPartMut.mutate(np as any)
    return np
  }

  const updateParticipant = (id: string, updates: Partial<TrainingParticipant>) => {
    updateCache(['trainings', 'participants'], old => old.map((p: any) => p.id === id ? { ...p, ...updates } : p))
    updatePartMut.mutate({ id, ...updates } as any)
  }

  const deleteParticipant = (id: string) => {
    updateCache(['trainings', 'participants'], old => old.filter((p: any) => p.id !== id))
    deletePartMut.mutate(id)
  }

  const importParticipantsList = (eventId: string, list: Omit<TrainingParticipant, 'id' | 'eventId'>[]) => {
    const newItems = list.map(item => ({ ...item, id: `tpart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, eventId }))
    updateCache(['trainings', 'participants'], old => [...newItems, ...old])
    newItems.forEach(item => addPartMut.mutate(item as any))
  }

  const ensureCertificateFor = (participantId: string, eventId: string) => {
    const part = participants.find(p => p.id === participantId)
    const ev = events.find(e => e.id === eventId)
    if (!part || !ev) return
    const exists = certificates.some(c => c.participantId === participantId && c.eventId === eventId)
    if (exists) return
    const nc: TrainingCertificate = {
      id: `tcert-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      participantId, participantName: part.name, eventId, eventName: ev.name,
      clientName: ev.companyName || ev.targetAudience || '—', hours: ev.hoursDuration, facilitator: ev.facilitator, date: ev.eventDate,
      validationCode: `VAL-CDH-${Date.now().toString().slice(-8)}`, issuedAt: new Date().toISOString()
    }
    updateCache(['trainings', 'certificates'], old => [nc, ...old])
    addCertMut.mutate(nc as any)
  }

  const ensurePendingFeedback = (participantId: string, eventId: string) => {
    const exists = feedbacks.some(f => f.participantId === participantId && f.eventId === eventId)
    if (exists) return
    const nf: TrainingFeedback = {
      id: `tfb-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      eventId, participantId, ratingGeneral: 0, clarityContent: 0, applicability: 0,
      didactics: 0, organization: 0, nps: 0, status: 'pendente', createdAt: new Date().toISOString()
    }
    updateCache(['trainings', 'feedbacks'], old => [nf, ...old])
    addFbMut.mutate(nf as any)
  }

  const confirmAttendance = (participantId: string, entryTime: string, signature: string) => {
    updateCache(['trainings', 'participants'], old => old.map((p: any) =>
      p.id === participantId ? { ...p, attendanceStatus: 'presente', entryTime, signatureSimple: signature, justification: undefined } : p
    ))
    updatePartMut.mutate({ id: participantId, attendanceStatus: 'presente', entryTime, signatureSimple: signature } as any)
    const part = participants.find(p => p.id === participantId)
    if (part) {
      ensureCertificateFor(part.id, part.eventId)
      ensurePendingFeedback(part.id, part.eventId)
    }
  }

  const recordAbsenceJustification = (participantId: string, justification: string) => {
    updateCache(['trainings', 'participants'], old => old.map((p: any) =>
      p.id === participantId ? { ...p, attendanceStatus: 'justificado', justification, entryTime: undefined, signatureSimple: undefined } : p
    ))
    updatePartMut.mutate({ id: participantId, attendanceStatus: 'justificado', justification } as any)
  }

  // Certificates
  const issueCertificate = (participantId: string, eventId: string): TrainingCertificate => {
    const part = participants.find(p => p.id === participantId)
    const ev = events.find(e => e.id === eventId)
    if (!part || !ev) throw new Error('Participante ou Evento não encontrado.')
    const exist = certificates.find(c => c.participantId === participantId && c.eventId === eventId)
    if (exist) return exist
    const nc: TrainingCertificate = {
      id: `tcert-${Date.now()}`, participantId, participantName: part.name, eventId, eventName: ev.name,
      clientName: ev.companyName || ev.targetAudience || '—', hours: ev.hoursDuration, facilitator: ev.facilitator, date: ev.eventDate,
      validationCode: `VAL-CDH-${Date.now().toString().slice(-8)}`, issuedAt: new Date().toISOString()
    }
    updateCache(['trainings', 'certificates'], old => [nc, ...old])
    addCertMut.mutate(nc as any)
    return nc
  }

  const issueCertificatesInBulk = (eventId: string) => {
    const eventParts = participants.filter(p => p.eventId === eventId && p.attendanceStatus === 'presente')
    const ev = events.find(e => e.id === eventId)
    if (!ev) return
    const newCerts = eventParts
      .filter(p => !certificates.some(c => c.participantId === p.id && c.eventId === eventId))
      .map((p, index) => ({
        id: `tcert-${Date.now()}-${index}`, participantId: p.id, participantName: p.name, eventId,
        eventName: ev.name, clientName: ev.companyName || ev.targetAudience || '—', hours: ev.hoursDuration, facilitator: ev.facilitator,
        date: ev.eventDate, validationCode: `VAL-CDH-${(Date.now() + index).toString().slice(-8)}`, issuedAt: new Date().toISOString()
      }))
    updateCache(['trainings', 'certificates'], old => [...newCerts, ...old])
    newCerts.forEach(nc => addCertMut.mutate(nc as any))
  }

  // Feedbacks
  const addFeedback = (f: Omit<TrainingFeedback, 'id' | 'createdAt'>): TrainingFeedback => {
    const existing = f.participantId
      ? feedbacks.find(fb => fb.participantId === f.participantId && fb.eventId === f.eventId)
      : undefined
    const nf: TrainingFeedback = {
      ...(existing || {}),
      ...f,
      id: existing?.id || `tfb-${Date.now()}`,
      status: 'respondido',
      createdAt: existing?.createdAt || new Date().toISOString(),
    }
    updateCache(['trainings', 'feedbacks'], old => {
      const rest = existing ? old.filter((x: any) => x.id !== nf.id) : old
      return [nf, ...rest]
    })
    addFbMut.mutate(nf as any)
    return nf
  }

  // Materials
  const addMaterial = (m: Omit<TrainingMaterial, 'id' | 'createdAt'>): TrainingMaterial => {
    const nm: TrainingMaterial = { ...m, id: `tmat-${Date.now()}`, createdAt: new Date().toISOString() }
    updateCache(['trainings', 'materials'], old => [nm, ...old])
    addMatMut.mutate(nm as any)
    return nm
  }

  const deleteMaterial = (id: string) => {
    updateCache(['trainings', 'materials'], old => old.filter((m: any) => m.id !== id))
  }

  // Reports
  const generateEventReport = (eventId: string, summary: string, recs: string): TrainingReport => {
    const nr: TrainingReport = { id: `trep-${Date.now()}`, eventId, executiveSummary: summary, recommendations: recs, generatedAt: new Date().toISOString() }
    updateCache(['trainings', 'reports'], old => [nr, ...old])
    return nr
  }

  // SIPAT
  const addSipatProgram = (s: Omit<SipatProgram, 'id' | 'schedule' | 'createdAt'>, schedule: Omit<SipatDay, 'id' | 'sipatProgramId'>[]): SipatProgram => {
    const programId = `sipat-${Date.now()}`
    const fullSchedule = schedule.map((day, idx) => ({ ...day, id: `sday-${Date.now()}-${idx}`, sipatProgramId: programId }))
    const ns: SipatProgram = { ...s, id: programId, schedule: fullSchedule, createdAt: new Date().toISOString() }
    updateCache(['trainings', 'sipats'], old => [ns, ...old])
    addSipatMut.mutate(ns as any)
    return ns
  }

  const updateSipatStatus = (id: string, status: SipatStatus) => {
    updateCache(['trainings', 'sipats'], old => old.map((s: any) => s.id === id ? { ...s, status } : s))
  }

  const deleteSipatProgram = (id: string) => {
    updateCache(['trainings', 'sipats'], old => old.filter((s: any) => s.id !== id))
  }

  // ==========================================
  // CALENDAR SYNC (via API direta — TrainingsProvider está acima do CalendarProvider)
  // ==========================================
  const syncEventToCalendar = useCallback((ev: TrainingEvent) => {
    const typeMap: Record<string, string> = {
      'Palestra': 'lecture',
      'Treinamento': 'training',
      'Workshop': 'training',
      'SIPAT': 'sipat',
      'Capacitação': 'training',
      'Imersão': 'training',
      'Mentoria coletiva': 'mentoring',
    }
    const statusMap: Record<string, string> = {
      'planejado': 'scheduled',
      'agendado': 'scheduled',
      'em_divulgacao': 'scheduled',
      'realizado': 'completed',
      'concluido': 'completed',
      'cancelado': 'canceled',
      'reagendado': 'rescheduled',
    }
    const colors = ['#f97316', '#6366f1', '#22c55e', '#eab308', '#ef4444']
    calendarService.create({
      title: `${ev.name} — ${ev.type}`,
      type: (typeMap[ev.type] || 'training') as any,
      description: ev.objective || ev.theme || undefined,
      companyId: ev.companyId as any,
      companyName: ev.companyName,
      projectId: ev.projectId as any,
      projectName: ev.projectName,
      responsible: ev.facilitator,
      location: ev.location,
      eventDate: ev.eventDate,
      startTime: ev.startTime,
      endTime: ev.endTime,
      allDay: false,
      status: statusMap[ev.status] as any,
      color: colors[Math.floor(Math.random() * colors.length)],
      reminderMinutes: 15,
    }).catch(() => {})
  }, [])

  // ==========================================
  // TRAINING TYPES (catálogo)
  // ==========================================
  const addTrainingType = (t: Omit<TrainingTypeItem, 'id' | 'createdAt'>) => {
    const nt: TrainingTypeItem = { ...t, id: `ttype-${Date.now()}`, active: t.active ?? true, createdAt: new Date().toISOString() }
    updateCache(['trainings', 'types'], old => [nt, ...old])
    addTypeMut.mutate(nt as any)
  }

  const updateTrainingType = (id: string, updates: Partial<TrainingTypeItem>) => {
    updateCache(['trainings', 'types'], old => old.map((t: any) => t.id === id ? { ...t, ...updates } : t))
    updateTypeMut.mutate({ id, ...updates } as any)
  }

  const deleteTrainingType = (id: string) => {
    updateCache(['trainings', 'types'], old => old.filter((t: any) => t.id !== id))
    updateCache(['trainings', 'type-materials'], old => old.filter((m: any) => m.trainingTypeId !== id))
    deleteTypeMut.mutate(id)
  }

  const addTypeMaterial = (m: Omit<TrainingTypeMaterial, 'id' | 'createdAt'>) => {
    const nm: TrainingTypeMaterial = { ...m, id: `tmat-${Date.now()}`, createdAt: new Date().toISOString() }
    updateCache(['trainings', 'type-materials'], old => [nm, ...old])
    addTypeMatMut.mutate(nm as any)
  }

  const deleteTypeMaterial = (id: string) => {
    updateCache(['trainings', 'type-materials'], old => old.filter((m: any) => m.id !== id))
    deleteTypeMatMut.mutate(id)
  }

  // ==========================================
  // TIMELINE por evento
  // ==========================================
  const addTimelineStep = (s: Omit<TrainingTimelineStep, 'id' | 'createdAt'>) => {
    const ns: TrainingTimelineStep = { ...s, id: `tl-${Date.now()}`, sortOrder: s.sortOrder ?? 0, createdAt: new Date().toISOString() }
    updateCache(['trainings', 'timeline'], old => [ns, ...old])
    addTimelineMut.mutate(ns as any)
  }

  const updateTimelineStep = (id: string, updates: Partial<TrainingTimelineStep>) => {
    updateCache(['trainings', 'timeline'], old => old.map((s: any) => s.id === id ? { ...s, ...updates } : s))
    updateTimelineMut.mutate({ id, ...updates } as any)
  }

  const deleteTimelineStep = (id: string) => {
    updateCache(['trainings', 'timeline'], old => old.filter((s: any) => s.id !== id))
    deleteTimelineMut.mutate(id)
  }

  // AI helper functions
  const generateAILecturesThemes = async (clientIndustry: string): Promise<string[]> => {
    // Simulated AI response for CrepaldiDH niche
    return [
      `Gestão de Stress e Inteligência Emocional em Empresas do setor de ${clientIndustry}`,
      `Comunicação Assertiva e Resolução de Conflitos no Cotidiano Operacional`,
      `Liderança Psologicamente Segura e Desenvolvimento de Alta Performance`,
      `Cultura de Feedback SBI e Alinhamento Estratégico de Equipes`,
      `Resiliência e Ergonomia Cognitiva na prevenção de acidentes de trabalho`
    ]
  }

  const generateAILectureScript = async (theme: string): Promise<string> => {
    return `📝 **ROTEIRO DE PALESTRA GERADO POR IA**
Tema: *${theme}*
Duração sugerida: 60 minutos
Facilitador: CrepaldiDH Senior Partner

1. **Introdução (10 min)**: 
   - Acolhimento e quebra-gelo.
   - Apresentação de dados estatísticos do setor e sensibilização.
   
2. **Desenvolvimento do Conteúdo (35 min)**:
   - Pilar 1: Compreensão cognitiva e autoconhecimento.
   - Pilar 2: Práticas diárias de autocuidado mental.
   - Pilar 3: Diálogo assertivo e escuta ativa.
   
3. **Dinâmica Prática & Aplicação (10 min)**:
   - Roleplay guiado ou reflexão grupal.
   
4. **Encerramento & Q&A (5 min)**:
   - Principais takeaways e recomendações finais.`
  }

  const generateAIEmailInvite = async (eventName: string, date: string, hour: string, linkOrLoc: string): Promise<string> => {
    return `✉️ **E-MAIL DE CONVITE CORPORATIVO**

Assunto: Convite Especial: ${eventName} - CrepaldiDH

Olá, equipe!

É com grande satisfação que convidamos todos vocês a participarem do nosso próximo evento de capacitação e desenvolvimento humano:

📌 **${eventName}**
📅 Data: ${new Date(date).toLocaleDateString('pt-BR')}
⏰ Horário: ${hour}
📍 Local: ${linkOrLoc}

Neste encontro prático, conduzido pela equipe de especialistas da CrepaldiDH, vamos trabalhar ferramentas de comunicação, saúde mental e inteligência emocional para potencializar o nosso cotidiano profissional.

Contamos com a sua presença confirmada. Clique no link abaixo para salvar o evento em sua agenda!

Atenciosamente,
Equipe de DHO & Saúde Ocupacional`
  }

  const generateAIExecutiveSummary = async (eventId: string): Promise<string> => {
    const ev = events.find(e => e.id === eventId)
    if (!ev) return 'Evento não localizado.'
    const totalP = participants.filter(p => p.eventId === eventId).length
    const presenceP = participants.filter(p => p.eventId === eventId && p.attendanceStatus === 'presente').length
    const fbs = feedbacks.filter(f => f.eventId === eventId)
    const npsAvg = fbs.length > 0 ? Math.round(fbs.reduce((acc, f) => acc + f.nps, 0) / fbs.length) : 10
    
    return `📊 **RESUMO EXECUTIVO DE IA (Para DHO & Liderança)**
Evento: *${ev.name}*
Realizado em: ${new Date(ev.eventDate).toLocaleDateString('pt-BR')}
Total de participantes: ${totalP} | Presença física: ${presenceP} (${totalP > 0 ? Math.round((presenceP/totalP)*100) : 100}%)

**Principais Insights:**
1. **Satisfação & Engajamento**: A avaliação obteve NPS médio de ${npsAvg}/10, refletindo alto alinhamento do conteúdo com os desafios de campo dos colaboradores.
2. **Clareza de Conteúdo**: Didática do facilitador ${ev.facilitator} recebeu nota máxima nos quesitos clareza e didática prática aplicável.
3. **Próximos Passos Recomendados**: Implementar uma sessão de mentoria individual com as lideranças mais participativas da unidade e disponibilizar o material de apoio em PDF para toda a equipe.`
  }

  return (
    <TrainingsContext.Provider
      value={{
        sipatPrograms,
        events,
        participants,
        certificates,
        feedbacks,
        materials,
        reports,
        trainingTypes,
        typeMaterials,
        timelineSteps,
        scheduledEvents,
        completedEvents,
        completedLectures,
        activeSipats,
        totalRegisteredParticipants,
        attendanceRate,
        certificatesIssued,
        averageNps,
        totalRevenue,
        addEvent,
        updateEvent,
        deleteEvent,
        addParticipant,
        updateParticipant,
        deleteParticipant,
        importParticipantsList,
        confirmAttendance,
        recordAbsenceJustification,
        issueCertificate,
        issueCertificatesInBulk,
        addFeedback,
        addMaterial,
        deleteMaterial,
        generateEventReport,
        addSipatProgram,
        updateSipatStatus,
        deleteSipatProgram,
        addTrainingType,
        updateTrainingType,
        deleteTrainingType,
        addTypeMaterial,
        deleteTypeMaterial,
        addTimelineStep,
        updateTimelineStep,
        deleteTimelineStep,
        generateAILecturesThemes,
        generateAILectureScript,
        generateAIEmailInvite,
        generateAIExecutiveSummary
      }}
    >
      {children}
    </TrainingsContext.Provider>
  )
}

export const useTrainings = () => {
  const ctx = useContext(TrainingsContext)
  if (!ctx) throw new Error('useTrainings must be used within a TrainingsProvider')
  return ctx
}
