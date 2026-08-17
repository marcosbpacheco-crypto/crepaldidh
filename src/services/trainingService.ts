import type { SipatProgram, TrainingEvent, TrainingParticipant, TrainingCertificate, TrainingFeedback, TrainingMaterial, TrainingReport, TrainingTypeItem, TrainingTypeMaterial, TrainingTimelineStep } from '@/types/trainings'
import type { SipatDay } from '@/types/trainings'
import { createSingleFlight } from '@/lib/single-flight'

const BASE = '/api/prisma/trainings'

async function api(url: string, opts?: RequestInit) {
  if (opts?.method && opts.method !== 'GET') flight.invalidate()
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

const flight = createSingleFlight(() => api(BASE))

export const trainingService = {
  async listEvents(): Promise<TrainingEvent[]> {
    const data = await flight.get()
    return (data.events || []).map(me)
  },
  async createEvent(input: Partial<TrainingEvent>): Promise<TrainingEvent> {
    flight.invalidate()
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'event', ...input }),
    })
    return me(data.event)
  },
  async updateEvent(id: string, input: Partial<TrainingEvent>): Promise<TrainingEvent> {
    flight.invalidate()
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    })
    return me(data.event)
  },
  async removeEvent(id: string): Promise<void> {
    flight.invalidate()
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'event', id }),
    })
  },

  async listParticipants(eventId?: string): Promise<TrainingParticipant[]> {
    const data = await flight.get()
    const all: TrainingParticipant[] = []
    for (const e of data.events || []) {
      for (const p of e.training_participants || []) {
        all.push(mp({ ...p, event_id: e.id }))
      }
    }
    return eventId ? all.filter(p => p.eventId === eventId) : all
  },
  async createParticipant(input: Partial<TrainingParticipant>): Promise<TrainingParticipant> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', ...input }),
    })
    return mp(data.participant)
  },
  async updateParticipant(id: string, input: Partial<TrainingParticipant>): Promise<TrainingParticipant> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', id, ...input }),
    })
    return mp(data.participant)
  },
  async removeParticipant(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'participant', id }),
    })
  },

  async listCertificates(): Promise<TrainingCertificate[]> {
    const data = await flight.get()
    const all: TrainingCertificate[] = []
    for (const e of data.events || []) {
      for (const c of e.training_certificates || []) {
        all.push(mc({ ...c, event_id: e.id }))
      }
    }
    return all
  },
  async createCertificate(input: Partial<TrainingCertificate>): Promise<TrainingCertificate> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'certificate', ...input }),
    })
    return mc(data.certificate)
  },

  async listFeedbacks(eventId?: string): Promise<TrainingFeedback[]> {
    const data = await flight.get()
    const all: TrainingFeedback[] = []
    for (const e of data.events || []) {
      for (const f of e.training_feedbacks || []) {
        all.push({ ...f, eventId: e.id })
      }
    }
    return eventId ? all.filter(f => f.eventId === eventId) : all
  },
  async createFeedback(input: Partial<TrainingFeedback>): Promise<TrainingFeedback> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'feedback', ...input }),
    })
    return data.feedback
  },

  async listMaterials(eventId?: string): Promise<TrainingMaterial[]> {
    const data = await flight.get()
    const all: TrainingMaterial[] = []
    for (const e of data.events || []) {
      for (const m of e.training_materials || []) {
        all.push({ ...m, eventId: e.id })
      }
    }
    return eventId ? all.filter(m => m.eventId === eventId) : all
  },
  async createMaterial(input: Partial<TrainingMaterial>): Promise<TrainingMaterial> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'material', ...input }),
    })
    return data.material
  },
  async removeMaterial(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'material', id }),
    })
  },

  async listReports(): Promise<TrainingReport[]> {
    const data = await flight.get()
    const all: TrainingReport[] = []
    for (const e of data.events || []) {
      for (const r of e.training_reports || []) {
        all.push({ ...r, eventId: e.id })
      }
    }
    return all
  },
  async createReport(input: Partial<TrainingReport>): Promise<TrainingReport> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'report', ...input }),
    })
    return data.report
  },

  async listSipats(): Promise<SipatProgram[]> {
    const data = await flight.get()
    return data.sipatPrograms || []
  },
  async createSipat(input: Partial<SipatProgram>): Promise<SipatProgram> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'sipat', ...input }),
    })
    return data.sipat
  },

  // ---- Catálogo de tipos ----
  async listTrainingTypes(): Promise<TrainingTypeItem[]> {
    const data = await flight.get()
    return (data.trainingTypes || []).map(mtt)
  },
  async createTrainingType(input: Partial<TrainingTypeItem>): Promise<TrainingTypeItem> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'training_type', ...input }),
    })
    return mtt(data.trainingType)
  },
  async updateTrainingType(id: string, input: Partial<TrainingTypeItem>): Promise<TrainingTypeItem> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'training_type', id, ...input }),
    })
    return mtt(data.trainingType)
  },
  async removeTrainingType(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'training_type', id }),
    })
  },

  // ---- Materiais do catálogo ----
  async listTypeMaterials(): Promise<TrainingTypeMaterial[]> {
    const data = await flight.get()
    return (data.typeMaterials || []).map(mtm)
  },
  async createTypeMaterial(input: Partial<TrainingTypeMaterial>): Promise<TrainingTypeMaterial> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'type_material', ...input }),
    })
    return mtm(data.typeMaterial)
  },
  async removeTypeMaterial(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'type_material', id }),
    })
  },

  // ---- Linha do tempo ----
  async listTimelineSteps(eventId?: string): Promise<TrainingTimelineStep[]> {
    const data = await flight.get()
    const all: TrainingTimelineStep[] = (data.timelineSteps || []).map(mtl)
    return eventId ? all.filter(t => t.eventId === eventId) : all
  },
  async createTimelineStep(input: Partial<TrainingTimelineStep>): Promise<TrainingTimelineStep> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'timeline', ...input }),
    })
    return mtl(data.timeline)
  },
  async updateTimelineStep(id: string, input: Partial<TrainingTimelineStep>): Promise<TrainingTimelineStep> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'timeline', id, ...input }),
    })
    return mtl(data.timeline)
  },
  async removeTimelineStep(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'timeline', id }),
    })
  },
}

function me(r: any): TrainingEvent { return { ...r, companyName: r.company_name, projectName: r.project_name, sipatProgramId: r.sipat_program_id, trainingTypeId: r.training_type_id, targetType: r.target_type, targetAudience: r.target_audience, eventDate: r.event_date, startTime: r.start_time, endTime: r.end_time, hoursDuration: r.hours_duration, expectedParticipants: r.expected_participants, createdAt: r.created_at } }
function mp(r: any): TrainingParticipant { return { ...r, eventId: r.event_id, crmContactId: r.crm_contact_id, companyName: r.company_name, attendanceStatus: r.attendance_status, entryTime: r.entry_time, signatureSimple: r.signature_simple } }
function mc(r: any): TrainingCertificate { return { ...r, participantId: r.participant_id, participantName: r.participant_name, eventId: r.event_id, eventName: r.event_name, clientName: r.client_name, hours: Number(r.hours), facilitator: r.facilitator, date: r.event_date || r.date, validationCode: r.validation_code, pdfUrl: r.pdf_url, issuedAt: r.issued_at } }
function mtt(r: any): TrainingTypeItem { return { ...r, targetType: r.target_type, hoursDuration: r.hours_duration, materials: (r.training_type_materials || []).map(mtm) } }
function mtm(r: any): TrainingTypeMaterial { return { ...r, trainingTypeId: r.training_type_id, fileUrl: r.file_url } }
function mtl(r: any): TrainingTimelineStep { return { ...r, eventId: r.event_id, plannedDate: r.planned_date, completedDate: r.completed_date, sortOrder: r.sort_order } }