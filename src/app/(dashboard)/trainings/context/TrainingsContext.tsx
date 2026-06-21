'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import supabase from '@/lib/supabaseClient'

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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const get = <T,>(key: string, fallback: T): T => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : fallback
      } catch {
        return fallback
      }
    }

    const loadData = async () => {
      try {
        const [
          { data: sipats },
          { data: evts },
          { data: parts },
          { data: certs },
          { data: fbs },
          { data: mats },
          { data: reps }
        ] = await Promise.all([
          supabase.from('sipat_programs').select('*'),
          supabase.from('training_events').select('*'),
          supabase.from('training_participants').select('*'),
          supabase.from('training_certificates').select('*'),
          supabase.from('training_feedbacks').select('*'),
          supabase.from('training_materials').select('*'),
          supabase.from('training_reports').select('*')
        ])

        if (sipats && evts && parts) {
          // Supabase connected successfully
          setSipatPrograms(sipats.length ? sipats : get('tr_sipat_programs', SEED_SIPATS))
          setEvents(evts.length ? evts : get('tr_events', SEED_EVENTS))
          setParticipants(parts.length ? parts : get('tr_participants', SEED_PARTICIPANTS))
          setCertificates(certs && certs.length ? certs : get('tr_certificates', SEED_CERTIFICATES))
          setFeedbacks(fbs && fbs.length ? fbs : get('tr_feedbacks', SEED_FEEDBACKS))
          setMaterials(mats && mats.length ? mats : get('tr_materials', []))
          setReports(reps && reps.length ? reps : get('tr_reports', []))
        } else {
          throw new Error('Fallback to local')
        }
      } catch (err) {
        console.warn('Supabase fetch failed, falling back to localStorage:', err)
        setSipatPrograms(get('tr_sipat_programs', SEED_SIPATS))
        setEvents(get('tr_events', SEED_EVENTS))
        setParticipants(get('tr_participants', SEED_PARTICIPANTS))
        setCertificates(get('tr_certificates', SEED_CERTIFICATES))
        setFeedbacks(get('tr_feedbacks', SEED_FEEDBACKS))
        setMaterials(get('tr_materials', []))
        setReports(get('tr_reports', []))
      }
    }
    loadData()
  }, [])

  const sync = (key: string, value: unknown) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
  }

  const setAndSync = <T extends { id?: string },>(
    setter: React.Dispatch<React.SetStateAction<T[]>>, 
    key: string, 
    tableName: string
  ) => (val: T[]) => { 
    setter(val); 
    sync(key, val);
    
    // Optional: Sync to Supabase in background
    if (tableName) {
      const latest = val[0]
      if (latest && latest.id) {
        supabase.from(tableName).upsert(latest as any).then(({error}) => {
          if (error) console.warn(`Error syncing to ${tableName}:`, error.message)
        })
      }
    }
  }

  const setSipatProgramsS = setAndSync(setSipatPrograms, 'tr_sipat_programs', 'sipat_programs')
  const setEventsS = setAndSync(setEvents, 'tr_events', 'training_events')
  const setParticipantsS = setAndSync(setParticipants, 'tr_participants', 'training_participants')
  const setCertificatesS = setAndSync(setCertificates, 'tr_certificates', 'training_certificates')
  const setFeedbacksS = setAndSync(setFeedbacks, 'tr_feedbacks', 'training_feedbacks')
  const setMaterialsS = setAndSync(setMaterials, 'tr_materials', 'training_materials')
  const setReportsS = setAndSync(setReports, 'tr_reports', 'training_reports')

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
    setEventsS([ne, ...events])
    supabase.from('training_events').insert(ne).then(({error}) => error && console.warn(error))
    return ne
  }

  const updateEvent = (id: string, updates: Partial<TrainingEvent>) => {
    const updated = events.find(e => e.id === id)
    setEventsS(events.map(e => e.id === id ? { ...e, ...updates } : e))
    if (updated) {
      supabase.from('training_events').update(updates).eq('id', id).then(({error}) => error && console.warn(error))
    }
  }

  const deleteEvent = (id: string) => {
    setEventsS(events.filter(e => e.id !== id))
    setParticipantsS(participants.filter(p => p.eventId !== id))
    supabase.from('training_events').delete().eq('id', id).then()
  }

  // Participants
  const addParticipant = (p: Omit<TrainingParticipant, 'id'>): TrainingParticipant => {
    const np: TrainingParticipant = { ...p, id: `tpart-${Date.now()}` }
    setParticipantsS([np, ...participants])
    supabase.from('training_participants').insert(np).then(({error}) => error && console.warn(error))
    return np
  }

  const updateParticipant = (id: string, updates: Partial<TrainingParticipant>) => {
    setParticipantsS(participants.map(p => p.id === id ? { ...p, ...updates } : p))
    supabase.from('training_participants').update(updates).eq('id', id).then(({error}) => error && console.warn(error))
  }

  const deleteParticipant = (id: string) => {
    setParticipantsS(participants.filter(p => p.id !== id))
    supabase.from('training_participants').delete().eq('id', id).then()
  }

  const importParticipantsList = (eventId: string, list: Omit<TrainingParticipant, 'id' | 'eventId'>[]) => {
    const newItems = list.map(item => ({
      ...item,
      id: `tpart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      eventId
    }))
    setParticipantsS([...newItems, ...participants])
    supabase.from('training_participants').insert(newItems).then(({error}) => error && console.warn(error))
  }

  const confirmAttendance = (participantId: string, entryTime: string, signature: string) => {
    setParticipantsS(
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
    supabase.from('training_attendance').upsert({ participant_id: participantId, event_id: participants.find(p=>p.id===participantId)?.eventId, attendance_status: 'presente', entry_time: entryTime, signature_simple: signature }).then(({error}) => error && console.warn(error))
  }

  const recordAbsenceJustification = (participantId: string, justification: string) => {
    setParticipantsS(
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
    supabase.from('training_attendance').upsert({ participant_id: participantId, event_id: participants.find(p=>p.id===participantId)?.eventId, attendance_status: 'justificado', justification }).then(({error}) => error && console.warn(error))
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

    setCertificatesS([nc, ...certificates])
    supabase.from('training_certificates').insert({ id: nc.id, participant_id: nc.participantId, event_id: nc.eventId, validation_code: nc.validationCode, pdf_url: nc.pdfUrl, issued_at: nc.issuedAt }).then(({error}) => error && console.warn(error))
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

    setCertificatesS([...newCerts, ...certificates])
    const dbCerts = newCerts.map(nc => ({ id: nc.id, participant_id: nc.participantId, event_id: nc.eventId, validation_code: nc.validationCode, issued_at: nc.issuedAt }))
    supabase.from('training_certificates').insert(dbCerts).then(({error}) => error && console.warn(error))
  }

  // Feedbacks
  const addFeedback = (f: Omit<TrainingFeedback, 'id' | 'createdAt'>): TrainingFeedback => {
    const nf: TrainingFeedback = { ...f, id: `tfb-${Date.now()}`, createdAt: new Date().toISOString() }
    setFeedbacksS([nf, ...feedbacks])
    supabase.from('training_feedbacks').insert({ id: nf.id, event_id: nf.eventId, participant_id: nf.participantId, rating_general: nf.ratingGeneral, clarity_content: nf.clarityContent, applicability: nf.applicability, didactics: nf.didactics, organization: nf.organization, nps: nf.nps, comments: nf.comments, created_at: nf.createdAt }).then(({error}) => error && console.warn(error))
    return nf
  }

  // Materials
  const addMaterial = (m: Omit<TrainingMaterial, 'id' | 'createdAt'>): TrainingMaterial => {
    const nm: TrainingMaterial = { ...m, id: `tmat-${Date.now()}`, createdAt: new Date().toISOString() }
    setMaterialsS([nm, ...materials])
    supabase.from('training_materials').insert({ id: nm.id, event_id: nm.eventId, name: nm.name, type: nm.type, file_url: nm.fileUrl, created_at: nm.createdAt }).then(({error}) => error && console.warn(error))
    return nm
  }

  const deleteMaterial = (id: string) => {
    setMaterialsS(materials.filter(m => m.id !== id))
    supabase.from('training_materials').delete().eq('id', id).then()
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
    setReportsS([nr, ...reports])
    supabase.from('training_reports').insert({ id: nr.id, event_id: nr.eventId, pdf_url: nr.pdfUrl, recommendations: nr.recommendations, executive_summary: nr.executiveSummary, generated_at: nr.generatedAt }).then(({error}) => error && console.warn(error))
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

    setSipatProgramsS([ns, ...sipatPrograms])
    supabase.from('sipat_programs').insert({ id: ns.id, company_id: ns.companyId, title: ns.title, theme: ns.theme, start_date: ns.startDate, end_date: ns.endDate, status: ns.status, observations: ns.observations, created_at: ns.createdAt }).then(({error}) => {
      if (error) console.warn(error)
      else {
        const dbSchedule = fullSchedule.map(ds => ({ id: ds.id, sipat_program_id: ds.sipatProgramId, day_number: ds.dayNumber, schedule_date: ds.date || ns.startDate, start_time: ds.startTime, end_time: ds.endTime, theme: ds.theme, facilitator: ds.facilitator, location: ds.location }))
        supabase.from('sipat_schedule').insert(dbSchedule).then()
      }
    })
    return ns
  }

  const updateSipatStatus = (id: string, status: SipatStatus) => {
    setSipatProgramsS(
      sipatPrograms.map(s => (s.id === id ? { ...s, status } : s))
    )
    supabase.from('sipat_programs').update({ status }).eq('id', id).then(({error}) => error && console.warn(error))
  }

  const deleteSipatProgram = (id: string) => {
    setSipatProgramsS(sipatPrograms.filter(s => s.id !== id))
    supabase.from('sipat_programs').delete().eq('id', id).then()
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
