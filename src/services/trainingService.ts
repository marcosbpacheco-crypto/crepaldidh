import type { SipatProgram, TrainingEvent, TrainingParticipant, TrainingCertificate, TrainingFeedback, TrainingMaterial, TrainingReport } from '@/types/trainings'
import type { SipatDay } from '@/types/trainings'

const BASE = '/api/prisma/trainings'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const trainingService = {
  async saveAll(data: {
    events?: TrainingEvent[]
    participants?: TrainingParticipant[]
    feedbacks?: TrainingFeedback[]
    certificates?: TrainingCertificate[]
    materials?: TrainingMaterial[]
    reports?: TrainingReport[]
    sipats?: SipatProgram[]
  }): Promise<void> {
    const jobs: Promise<any>[] = []
    for (const e of data.events || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'event', ...meRow(e) }) }).catch(() => {}))
    }
    for (const p of data.participants || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'participant', ...mpRow(p) }) }).catch(() => {}))
    }
    for (const f of data.feedbacks || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'feedback', ...f }) }).catch(() => {}))
    }
    for (const c of data.certificates || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'certificate', ...mcRow(c) }) }).catch(() => {}))
    }
    for (const m of data.materials || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'material', ...m }) }).catch(() => {}))
    }
    for (const r of data.reports || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'report', ...r }) }).catch(() => {}))
    }
    for (const s of data.sipats || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'sipat', ...s }) }).catch(() => {}))
    }
    await Promise.allSettled(jobs)
  },
  async listEvents(): Promise<TrainingEvent[]> {
    const data = await api(BASE)
    return (data.events || []).map(me)
  },
  async createEvent(input: Partial<TrainingEvent>): Promise<TrainingEvent> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'event', ...input }),
    })
    return me(data.event)
  },
  async updateEvent(id: string, input: Partial<TrainingEvent>): Promise<TrainingEvent> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    })
    return me(data.event)
  },
  async removeEvent(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'event', id }),
    })
  },

  async listParticipants(eventId?: string): Promise<TrainingParticipant[]> {
    const data = await api(BASE)
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
    const data = await api(BASE)
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
    const data = await api(BASE)
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
    const data = await api(BASE)
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

  async listReports(): Promise<TrainingReport[]> {
    const data = await api(BASE)
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
    const data = await api(BASE)
    return data.sipatPrograms || []
  },
  async createSipat(input: Partial<SipatProgram>): Promise<SipatProgram> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'sipat', ...input }),
    })
    return data.sipat
  },
}

function me(r: any): TrainingEvent { return { ...r, companyName: r.company_name, projectName: r.project_name, sipatProgramId: r.sipat_program_id, targetAudience: r.target_audience, eventDate: r.event_date, startTime: r.start_time, endTime: r.end_time, hoursDuration: r.hours_duration, expectedParticipants: r.expected_participants, createdAt: r.created_at } }
function mp(r: any): TrainingParticipant { return { ...r, eventId: r.event_id, crmContactId: r.crm_contact_id, companyName: r.company_name, attendanceStatus: r.attendance_status, entryTime: r.entry_time, signatureSimple: r.signature_simple } }
function mc(r: any): TrainingCertificate { return { ...r, participantId: r.participant_id, participantName: r.participant_name, eventId: r.event_id, eventName: r.event_name, clientName: r.client_name, validationCode: r.validation_code, pdfUrl: r.pdf_url, issuedAt: r.issued_at } }

function meRow(r: any) {
  const { companyName, projectName, sipatProgramId, targetAudience, eventDate, startTime, endTime, hoursDuration, expectedParticipants, createdAt, ...rest } = r
  return { ...rest, company_name: r.companyName, project_name: r.projectName, sipat_program_id: r.sipatProgramId, target_audience: r.targetAudience, event_date: r.eventDate, start_time: r.startTime, end_time: r.endTime, hours_duration: r.hoursDuration, expected_participants: r.expectedParticipants, created_at: r.createdAt }
}
function mpRow(r: any) {
  const { eventId, crmContactId, companyName, attendanceStatus, entryTime, signatureSimple, ...rest } = r
  return { ...rest, event_id: r.eventId, crm_contact_id: r.crmContactId, company_name: r.companyName, attendance_status: r.attendanceStatus, entry_time: r.entryTime, signature_simple: r.signatureSimple }
}
function mcRow(r: any) {
  const { participantId, participantName, eventId, eventName, clientName, validationCode, pdfUrl, issuedAt, ...rest } = r
  return { ...rest, participant_id: r.participantId, participant_name: r.participantName, event_id: r.eventId, event_name: r.eventName, client_name: r.clientName, validation_code: r.validationCode, pdf_url: r.pdfUrl, issued_at: r.issuedAt }
}
