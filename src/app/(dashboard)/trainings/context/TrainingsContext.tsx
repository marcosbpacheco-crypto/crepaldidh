'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

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
  companyId: string
  companyName: string
  projectId?: string
  projectName?: string
  sipatProgramId?: string
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
  const [sipatPrograms, setSipatPrograms] = useState<SipatProgram[]>([])
  const [events, setEvents] = useState<TrainingEvent[]>([])
  const [participants, setParticipants] = useState<TrainingParticipant[]>([])
  const [certificates, setCertificates] = useState<TrainingCertificate[]>([])
  const [feedbacks, setFeedbacks] = useState<TrainingFeedback[]>([])
  const [materials, setMaterials] = useState<TrainingMaterial[]>([])
  const [reports, setReports] = useState<TrainingReport[]>([])

  const loadedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || loadedRef.current) return
    loadedRef.current = true

    const get = <T,>(key: string, fallback: T): T => {
      try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback }
      catch { return fallback }
    }

    const loadFromLocal = () => {
      setSipatPrograms(get('tr_sipat_programs', SEED_SIPATS))
      setEvents(get('tr_events', SEED_EVENTS))
      setParticipants(get('tr_participants', SEED_PARTICIPANTS))
      setCertificates(get('tr_certificates', SEED_CERTIFICATES))
      setFeedbacks(get('tr_feedbacks', SEED_FEEDBACKS))
      setMaterials(get('tr_materials', []))
      setReports(get('tr_reports', []))
    }

    fetch('/api/sync/trainings')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data) {
          const d = res.data
          if (Array.isArray(d.sipatPrograms) && d.sipatPrograms.length > 0) setSipatPrograms(d.sipatPrograms as SipatProgram[])
          if (Array.isArray(d.events) && d.events.length > 0) setEvents(d.events as TrainingEvent[])
          if (Array.isArray(d.participants) && d.participants.length > 0) setParticipants(d.participants as TrainingParticipant[])
          if (Array.isArray(d.certificates) && d.certificates.length > 0) setCertificates(d.certificates as TrainingCertificate[])
          if (Array.isArray(d.feedbacks) && d.feedbacks.length > 0) setFeedbacks(d.feedbacks as TrainingFeedback[])
          if (Array.isArray(d.materials) && d.materials.length > 0) setMaterials(d.materials as TrainingMaterial[])
          if (Array.isArray(d.reports) && d.reports.length > 0) setReports(d.reports as TrainingReport[])
          for (const [k, v] of Object.entries(d)) {
            if (Array.isArray(v) && v.length > 0) localStorage.setItem(`tr_${k}`, JSON.stringify(v))
          }
        } else {
          loadFromLocal()
        }
      })
      .catch(() => loadFromLocal())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasData = sipatPrograms.length > 0 || events.length > 0 || participants.length > 0 || certificates.length > 0 || feedbacks.length > 0 || materials.length > 0 || reports.length > 0
    if (!hasData) return
    const timer = setTimeout(() => {
      const payload = { sipatPrograms, events, participants, certificates, feedbacks, materials, reports }
      fetch('/api/sync/trainings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merged: payload }),
      }).catch(err => console.error('TrainingsContext sync error:', err))
      localStorage.setItem('tr_sipat_programs', JSON.stringify(sipatPrograms))
      localStorage.setItem('tr_events', JSON.stringify(events))
      localStorage.setItem('tr_participants', JSON.stringify(participants))
      localStorage.setItem('tr_certificates', JSON.stringify(certificates))
      localStorage.setItem('tr_feedbacks', JSON.stringify(feedbacks))
      localStorage.setItem('tr_materials', JSON.stringify(materials))
      localStorage.setItem('tr_reports', JSON.stringify(reports))
    }, 500)
    return () => clearTimeout(timer)
  }, [sipatPrograms, events, participants, certificates, feedbacks, materials, reports])

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
  const averageNps = feedbacks.length > 0
    ? Math.round(
        (() => {
          const promoters = feedbacks.filter(f => f.nps >= 9).length
          const detractors = feedbacks.filter(f => f.nps <= 6).length
          return ((promoters - detractors) / feedbacks.length) * 100
        })()
      )
    : 0

  const totalRevenue = events
    .filter(e => e.status === 'realizado' || e.status === 'concluido' || e.status === 'agendado')
    .reduce((acc, e) => acc + e.cost, 0)

  // ==========================================
  // MUTATOR IMPLEMENTATIONS
  // ==========================================

  // Events CRUD
  const addEvent = (e: Omit<TrainingEvent, 'id' | 'createdAt'>): TrainingEvent => {
    const ne: TrainingEvent = { ...e, id: `tr-event-${Date.now()}`, createdAt: new Date().toISOString() }
    setEvents([ne, ...events])
    return ne
  }

  const updateEvent = (id: string, updates: Partial<TrainingEvent>) => {
    const updated = events.find(e => e.id === id)
    setEvents(events.map(e => e.id === id ? { ...e, ...updates } : e))
    if (updated) {
    }
  }

  const deleteEvent = (id: string) => {
    setEvents(events.filter(e => e.id !== id))
    setParticipants(participants.filter(p => p.eventId !== id))
  }

  // Participants
  const addParticipant = (p: Omit<TrainingParticipant, 'id'>): TrainingParticipant => {
    const np: TrainingParticipant = { ...p, id: `tpart-${Date.now()}` }
    setParticipants([np, ...participants])
    return np
  }

  const updateParticipant = (id: string, updates: Partial<TrainingParticipant>) => {
    setParticipants(participants.map(p => p.id === id ? { ...p, ...updates } : p))
  }

  const deleteParticipant = (id: string) => {
    setParticipants(participants.filter(p => p.id !== id))
  }

  const importParticipantsList = (eventId: string, list: Omit<TrainingParticipant, 'id' | 'eventId'>[]) => {
    const newItems = list.map(item => ({
      ...item,
      id: `tpart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventId
    }))
    setParticipants([...newItems, ...participants])
  }

  const confirmAttendance = (participantId: string, entryTime: string, signature: string) => {
    setParticipants(
      participants.map(p =>
        p.id === participantId
          ? {
              ...p,
              attendanceStatus: 'presente',
              entryTime,
              signatureSimple: signature,
              justification: undefined
            }
          : p
      )
    )
  }

  const recordAbsenceJustification = (participantId: string, justification: string) => {
    setParticipants(
      participants.map(p =>
        p.id === participantId
          ? {
              ...p,
              attendanceStatus: 'justificado',
              justification,
              entryTime: undefined,
              signatureSimple: undefined
            }
          : p
      )
    )
  }

  // Certificates
  const issueCertificate = (participantId: string, eventId: string): TrainingCertificate => {
    const part = participants.find(p => p.id === participantId)
    const ev = events.find(e => e.id === eventId)

    if (!part || !ev) {
      throw new Error('Participante ou Evento não encontrado.')
    }

    const exist = certificates.find(c => c.participantId === participantId && c.eventId === eventId)
    if (exist) return exist

    const nc: TrainingCertificate = {
      id: `tcert-${Date.now()}`,
      participantId,
      participantName: part.name,
      eventId,
      eventName: ev.name,
      clientName: ev.companyName,
      hours: ev.hoursDuration,
      facilitator: ev.facilitator,
      date: ev.eventDate,
      validationCode: `VAL-CDH-${Date.now().toString().slice(-8)}`,
      issuedAt: new Date().toISOString()
    }

    setCertificates([nc, ...certificates])
    return nc
  }

  const issueCertificatesInBulk = (eventId: string) => {
    const eventParts = participants.filter(p => p.eventId === eventId && p.attendanceStatus === 'presente')
    const ev = events.find(e => e.id === eventId)
    if (!ev) return

    const newCerts = eventParts
      .filter(p => !certificates.some(c => c.participantId === p.id && c.eventId === eventId))
      .map((p, index) => ({
        id: `tcert-${Date.now()}-${index}`,
        participantId: p.id,
        participantName: p.name,
        eventId,
        eventName: ev.name,
        clientName: ev.companyName,
        hours: ev.hoursDuration,
        facilitator: ev.facilitator,
        date: ev.eventDate,
        validationCode: `VAL-CDH-${(Date.now() + index).toString().slice(-8)}`,
        issuedAt: new Date().toISOString()
      }))

    setCertificates([...newCerts, ...certificates])
    const dbCerts = newCerts.map(nc => ({ id: nc.id, participant_id: nc.participantId, event_id: nc.eventId, validation_code: nc.validationCode, issued_at: nc.issuedAt }))
  }

  // Feedbacks
  const addFeedback = (f: Omit<TrainingFeedback, 'id' | 'createdAt'>): TrainingFeedback => {
    const nf: TrainingFeedback = { ...f, id: `tfb-${Date.now()}`, createdAt: new Date().toISOString() }
    setFeedbacks([nf, ...feedbacks])
    return nf
  }

  // Materials
  const addMaterial = (m: Omit<TrainingMaterial, 'id' | 'createdAt'>): TrainingMaterial => {
    const nm: TrainingMaterial = { ...m, id: `tmat-${Date.now()}`, createdAt: new Date().toISOString() }
    setMaterials([nm, ...materials])
    return nm
  }

  const deleteMaterial = (id: string) => {
    setMaterials(materials.filter(m => m.id !== id))
  }

  // Reports
  const generateEventReport = (eventId: string, summary: string, recs: string): TrainingReport => {
    const nr: TrainingReport = {
      id: `trep-${Date.now()}`,
      eventId,
      executiveSummary: summary,
      recommendations: recs,
      generatedAt: new Date().toISOString()
    }
    setReports([nr, ...reports])
    return nr
  }

  // SIPAT
  const addSipatProgram = (s: Omit<SipatProgram, 'id' | 'schedule' | 'createdAt'>, schedule: Omit<SipatDay, 'id' | 'sipatProgramId'>[]): SipatProgram => {
    const programId = `sipat-${Date.now()}`
    const fullSchedule = schedule.map((day, idx) => ({
      ...day,
      id: `sday-${Date.now()}-${idx}`,
      sipatProgramId: programId
    }))

    const ns: SipatProgram = {
      ...s,
      id: programId,
      schedule: fullSchedule,
      createdAt: new Date().toISOString()
    }

    setSipatPrograms([ns, ...sipatPrograms])
    return ns
  }

  const updateSipatStatus = (id: string, status: SipatStatus) => {
    setSipatPrograms(
      sipatPrograms.map(s => (s.id === id ? { ...s, status } : s))
    )
  }

  const deleteSipatProgram = (id: string) => {
    setSipatPrograms(sipatPrograms.filter(s => s.id !== id))
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
