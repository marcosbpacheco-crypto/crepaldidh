'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import supabase from '@/lib/supabaseClient'

// ── INTERFACES ──────────────────────────────────

export interface OccClinic {
  id: string; name: string; cnpj?: string; phone?: string; email?: string
  address?: string; city?: string; state?: string; contactName?: string; isActive: boolean; createdAt: string
}

export interface OccDoctor {
  id: string; name: string; crm: string; crmUf?: string; specialty?: string
  clinicId?: string; clinicName?: string; phone?: string; email?: string; isActive: boolean; createdAt: string
}

export interface OccExamType {
  id: string; name: string; category: string; description?: string
  validityMonths: number; requiredFor?: string[]; isActive: boolean; createdAt: string
}

export interface OccPcmso {
  id: string; companyId: string; companyName: string
  coordinatorDoctorId?: string; coordinatorDoctorName?: string
  clinicalDirectorId?: string; clinicalDirectorName?: string
  programType: string; riskClassification?: string; totalEmployees: number
  startDate: string; endDate: string; renewalDate?: string
  status: string; objectives?: string; scope?: string; methodology?: string; notes?: string; pdfUrl?: string; createdAt: string
}

export interface OccEmployee {
  id: string; companyId: string; companyName: string; pcmsoId?: string
  name: string; cpf?: string; rg?: string; birthDate?: string; gender?: string; maritalStatus?: string
  email?: string; phone?: string; unit?: string; sector?: string; role?: string; functionDescription?: string
  admissionDate?: string; workRegime?: string; registrationNumber?: string; shift?: string
  isLeader: boolean; directLeader?: string; status: string; notes?: string; createdAt: string
}

export interface OccAso {
  id: string; employeeId: string; companyId: string; companyName: string; pcmsoId?: string
  asoNumber: string; examType: string; issueDate: string; validityDate?: string
  doctorId?: string; doctorName?: string; clinicId?: string; clinicName?: string
  result: string; restrictionDescription?: string; observation?: string; examsSummary?: string
  pdfUrl?: string; digitalSignature: boolean; status: string; createdAt: string
}

export interface OccExam {
  id: string; employeeId: string; companyId: string; companyName: string; asoId?: string
  examTypeId?: string; examTypeName: string; examCategory: string
  clinicId?: string; clinicName?: string; doctorId?: string; doctorName?: string
  requestDate: string; examDate?: string; dueDate: string; resultDate?: string
  result?: string; resultDetails?: string; fileUrl?: string; status: string; notes?: string; createdAt: string
}

export interface OccCertificate {
  id: string; employeeId: string; companyId: string; companyName: string
  cid?: string; cidDescription?: string; diagnosis?: string
  startDate: string; endDate: string; daysCount: number
  doctorName?: string; doctorCrm?: string; certificateType: string
  fileUrl?: string; medicalLeave: boolean; notes?: string; createdAt: string
}

export interface OccAbsence {
  id: string; employeeId: string; companyId: string; companyName: string; certificateId?: string
  absenceType: string; cid?: string; cidDescription?: string
  startDate: string; endDate?: string; expectedReturnDate?: string; daysCount?: number
  catIssued: boolean; catNumber?: string; benefitType?: string
  status: string; documents?: string[]; notes?: string; createdAt: string
}

export interface OccReturnToWork {
  id: string; employeeId: string; companyId: string; companyName: string; absenceId?: string
  returnDate: string; returnType: string; gradualHours?: number; gradualDays?: number
  doctorRecommendations?: string; restrictions?: string
  followUpRequired: boolean; followUpDate?: string; asoId?: string
  status: string; notes?: string; createdAt: string
}

export interface OccRestriction {
  id: string; employeeId: string; companyId: string; asoId?: string
  restrictionType: string; restriction: string; origin: string
  startDate: string; endDate?: string; activitiesPrevented?: string; recommendations?: string; status: string; createdAt: string
}

export interface OccAlert {
  id: string; companyId: string; employeeId?: string
  alertType: string; title: string; description?: string
  referenceDate: string; daysOffset?: number; severity: string; isRead: boolean; isResolved: boolean; createdAt: string
}

export interface OccReport {
  id: string; companyId?: string; reportType: string; title: string
  params?: Record<string, unknown>; pdfUrl?: string; generatedAt: string
}

// ── COMPUTED KPIs ──────────────────────────────

export interface OccIndicators {
  totalEmployees: number
  activeEmployees: number
  absentEmployees: number
  asosValid: number
  asosExpiring: number
  asosExpired: number
  examsScheduled: number
  examsOverdue: number
  examsCompleted: number
  activeCertificates: number
  activeAbsences: number
  prolongedAbsences: number
  activeRestrictions: number
  activeReturnToWorks: number
  examsByPeriod: { month: string; total: number }[]
  absencesByType: { type: string; total: number }[]
}

// ── CONTEXT TYPE ───────────────────────────────

interface OccContextType {
  clinics: OccClinic[]; doctors: OccDoctor[]; examTypes: OccExamType[]
  pcmsoList: OccPcmso[]; employees: OccEmployee[]; asos: OccAso[]
  exams: OccExam[]; certificates: OccCertificate[]; absences: OccAbsence[]
  returnToWorks: OccReturnToWork[]; restrictions: OccRestriction[]
  alerts: OccAlert[]; reports: OccReport[]
  indicators: OccIndicators
  addClinic: (c: Omit<OccClinic, 'id' | 'createdAt'>) => OccClinic
  updateClinic: (id: string, u: Partial<OccClinic>) => void; deleteClinic: (id: string) => void
  addDoctor: (d: Omit<OccDoctor, 'id' | 'createdAt'>) => OccDoctor
  updateDoctor: (id: string, u: Partial<OccDoctor>) => void; deleteDoctor: (id: string) => void
  addExamType: (e: Omit<OccExamType, 'id' | 'createdAt'>) => OccExamType
  updateExamType: (id: string, u: Partial<OccExamType>) => void; deleteExamType: (id: string) => void
  addPcmso: (p: Omit<OccPcmso, 'id' | 'createdAt'>) => OccPcmso
  updatePcmso: (id: string, u: Partial<OccPcmso>) => void; deletePcmso: (id: string) => void
  addEmployee: (e: Omit<OccEmployee, 'id' | 'createdAt'>) => OccEmployee
  updateEmployee: (id: string, u: Partial<OccEmployee>) => void; deleteEmployee: (id: string) => void
  addAso: (a: Omit<OccAso, 'id' | 'createdAt'>) => OccAso
  updateAso: (id: string, u: Partial<OccAso>) => void; deleteAso: (id: string) => void
  addExam: (e: Omit<OccExam, 'id' | 'createdAt'>) => OccExam
  updateExam: (id: string, u: Partial<OccExam>) => void; deleteExam: (id: string) => void
  addCertificate: (c: Omit<OccCertificate, 'id' | 'createdAt'>) => OccCertificate
  updateCertificate: (id: string, u: Partial<OccCertificate>) => void; deleteCertificate: (id: string) => void
  addAbsence: (a: Omit<OccAbsence, 'id' | 'createdAt'>) => OccAbsence
  updateAbsence: (id: string, u: Partial<OccAbsence>) => void; deleteAbsence: (id: string) => void
  addReturnToWork: (r: Omit<OccReturnToWork, 'id' | 'createdAt'>) => OccReturnToWork
  updateReturnToWork: (id: string, u: Partial<OccReturnToWork>) => void; deleteReturnToWork: (id: string) => void
  addRestriction: (r: Omit<OccRestriction, 'id' | 'createdAt'>) => OccRestriction
  updateRestriction: (id: string, u: Partial<OccRestriction>) => void; deleteRestriction: (id: string) => void
  addAlert: (a: Omit<OccAlert, 'id' | 'createdAt'>) => OccAlert
  markAlertRead: (id: string) => void; resolveAlert: (id: string) => void
  addReport: (r: Omit<OccReport, 'id' | 'createdAt'>) => OccReport
  generateAlerts: () => void
}

const OccContext = createContext<OccContextType | undefined>(undefined)

// ── HELPERS ────────────────────────────────────

const id = () => `occ-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`
const today = () => new Date().toISOString().split('T')[0]
const diffDays = (a: string, b: string) => Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000)

// ── SEED DATA ──────────────────────────────────

const SEED_CLINICS: OccClinic[] = [
  { id: 'occ-cli-1', name: 'Clínica do Trabalho São Paulo', cnpj: '12.345.678/0001-90', phone: '(11) 99999-8888', email: 'contato@ctsp.com.br', address: 'Av. Paulista, 1000', city: 'São Paulo', state: 'SP', contactName: 'Dr. Carlos', isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-cli-2', name: 'Medicina Ocupacional BH', cnpj: '98.765.432/0001-10', phone: '(31) 98888-7777', email: 'contato@mobh.com.br', address: 'Rua Pernambuco, 500', city: 'Belo Horizonte', state: 'MG', contactName: 'Dra. Marina', isActive: true, createdAt: new Date().toISOString() },
]

const SEED_DOCTORS: OccDoctor[] = [
  { id: 'occ-doc-1', name: 'Dr. Carlos Alberto', crm: '123456', crmUf: 'SP', specialty: 'medico_trabalho', clinicId: 'occ-cli-1', clinicName: 'Clínica do Trabalho São Paulo', phone: '(11) 97777-6666', email: 'carlos@ctsp.com.br', isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-doc-2', name: 'Dra. Marina Santos', crm: '654321', crmUf: 'MG', specialty: 'medico_trabalho', clinicId: 'occ-cli-2', clinicName: 'Medicina Ocupacional BH', phone: '(31) 96666-5555', email: 'marina@mobh.com.br', isActive: true, createdAt: new Date().toISOString() },
]

const SEED_EXAM_TYPES: OccExamType[] = [
  { id: 'occ-et-1', name: 'Audiometria', category: 'admissional', description: 'Exame de audiometria tonal', validityMonths: 12, requiredFor: ['ruido'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-2', name: 'Acuidade Visual', category: 'admissional', description: 'Teste de acuidade visual', validityMonths: 12, requiredFor: ['tela'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-3', name: 'Eletrocardiograma', category: 'periodico', description: 'ECG de repouso', validityMonths: 24, isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-4', name: 'Hemograma', category: 'periodico', description: 'Hemograma completo', validityMonths: 12, isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-5', name: 'Glicemia', category: 'periodico', description: 'Glicemia em jejum', validityMonths: 12, isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-6', name: 'Raio X de Tórax', category: 'admissional', description: 'RX tórax PA', validityMonths: 24, isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-7', name: 'Exame Toxicológico', category: 'admissional', description: 'Toxicológico para motoristas', validityMonths: 12, requiredFor: ['motorista'], isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-8', name: 'Avaliação Psicológica', category: 'complementar', description: 'Avaliação psicológica ocupacional', validityMonths: 12, isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-9', name: 'Densitometria Óssea', category: 'periodico', description: 'Densitometria', validityMonths: 24, isActive: true, createdAt: new Date().toISOString() },
  { id: 'occ-et-10', name: 'Eletroencefalograma', category: 'complementar', description: 'EEG', validityMonths: 24, isActive: true, createdAt: new Date().toISOString() },
]

const SEED_PCMSO: OccPcmso[] = [
  { id: 'occ-pc-1', companyId: 'comp-1', companyName: 'BR Distribuidora', coordinatorDoctorId: 'occ-doc-1', coordinatorDoctorName: 'Dr. Carlos Alberto', programType: 'completo', riskClassification: '3', totalEmployees: 150, startDate: '2026-01-01', endDate: '2026-12-31', renewalDate: '2026-11-01', status: 'vigente', objectives: 'Monitoramento da saúde ocupacional', createdAt: new Date().toISOString() },
]

const SEED_EMPLOYEES: OccEmployee[] = [
  { id: 'occ-emp-1', companyId: 'comp-1', companyName: 'BR Distribuidora', pcmsoId: 'occ-pc-1', name: 'João Silva', cpf: '111.222.333-44', sector: 'Logística', role: 'Motorista', admissionDate: '2020-03-15', status: 'ativo', isLeader: false, createdAt: new Date().toISOString() },
  { id: 'occ-emp-2', companyId: 'comp-1', companyName: 'BR Distribuidora', pcmsoId: 'occ-pc-1', name: 'Maria Oliveira', cpf: '555.666.777-88', sector: 'Administrativo', role: 'Analista RH', admissionDate: '2021-06-01', status: 'ativo', isLeader: false, createdAt: new Date().toISOString() },
  { id: 'occ-emp-3', companyId: 'comp-2', companyName: 'Vale S.A.', name: 'Carlos Pereira', sector: 'Operações', role: 'Operador', admissionDate: '2019-01-10', status: 'afastado', isLeader: false, createdAt: new Date().toISOString() },
  { id: 'occ-emp-4', companyId: 'comp-2', companyName: 'Vale S.A.', name: 'Ana Costa', sector: 'Administrativo', role: 'Coordenadora', admissionDate: '2018-05-20', status: 'ativo', isLeader: true, createdAt: new Date().toISOString() },
]

const SEED_ASOS: OccAso[] = [
  { id: 'occ-aso-1', employeeId: 'occ-emp-1', companyId: 'comp-1', companyName: 'BR Distribuidora', pcmsoId: 'occ-pc-1', asoNumber: 'ASO-2026-001', examType: 'periodico', issueDate: '2026-01-15', validityDate: '2027-01-15', doctorId: 'occ-doc-1', doctorName: 'Dr. Carlos Alberto', result: 'apto', status: 'ativo', digitalSignature: true, createdAt: new Date().toISOString() },
  { id: 'occ-aso-2', employeeId: 'occ-emp-2', companyId: 'comp-1', companyName: 'BR Distribuidora', pcmsoId: 'occ-pc-1', asoNumber: 'ASO-2026-002', examType: 'admissional', issueDate: '2021-06-01', validityDate: '2022-06-01', doctorId: 'occ-doc-1', doctorName: 'Dr. Carlos Alberto', result: 'apto', status: 'vencido', digitalSignature: true, createdAt: new Date().toISOString() },
]

const SEED_EXAMS: OccExam[] = [
  { id: 'occ-ex-1', employeeId: 'occ-emp-1', companyId: 'comp-1', companyName: 'BR Distribuidora', asoId: 'occ-aso-1', examTypeName: 'Audiometria', examCategory: 'periodico', requestDate: '2026-01-01', examDate: '2026-01-10', dueDate: '2026-01-31', result: 'normal', status: 'realizado', createdAt: new Date().toISOString() },
  { id: 'occ-ex-2', employeeId: 'occ-emp-2', companyId: 'comp-1', companyName: 'BR Distribuidora', examTypeName: 'Acuidade Visual', examCategory: 'periodico', requestDate: '2026-06-01', dueDate: '2026-06-30', status: 'agendado', createdAt: new Date().toISOString() },
  { id: 'occ-ex-3', employeeId: 'occ-emp-1', companyId: 'comp-1', companyName: 'BR Distribuidora', examTypeName: 'Eletrocardiograma', examCategory: 'periodico', requestDate: '2026-05-01', dueDate: '2026-05-15', status: 'nao_compareceu', createdAt: new Date().toISOString() },
]

const SEED_CERTIFICATES: OccCertificate[] = [
  { id: 'occ-cer-1', employeeId: 'occ-emp-3', companyId: 'comp-2', companyName: 'Vale S.A.', cid: 'J45', cidDescription: 'Asma', diagnosis: 'Crise asmática', startDate: '2026-06-01', endDate: '2026-06-05', daysCount: 4, doctorName: 'Dr. Clínico Geral', certificateType: 'doenca', medicalLeave: true, createdAt: new Date().toISOString() },
]

const SEED_ABSENCES: OccAbsence[] = [
  { id: 'occ-abs-1', employeeId: 'occ-emp-3', companyId: 'comp-2', companyName: 'Vale S.A.', certificateId: 'occ-cer-1', absenceType: 'doenca', cid: 'J45', cidDescription: 'Asma', startDate: '2026-06-01', endDate: '2026-06-05', daysCount: 4, catIssued: false, status: 'encerrado', createdAt: new Date().toISOString() },
]

// ── PROVIDER ───────────────────────────────────

export function OccupationalProvider({ children }: { children: React.ReactNode }) {
  const [clinics, setClinics] = useState<OccClinic[]>([])
  const [doctors, setDoctors] = useState<OccDoctor[]>([])
  const [examTypes, setExamTypes] = useState<OccExamType[]>([])
  const [pcmsoList, setPcmsoList] = useState<OccPcmso[]>([])
  const [employees, setEmployees] = useState<OccEmployee[]>([])
  const [asos, setAsos] = useState<OccAso[]>([])
  const [exams, setExams] = useState<OccExam[]>([])
  const [certificates, setCertificates] = useState<OccCertificate[]>([])
  const [absences, setAbsences] = useState<OccAbsence[]>([])
  const [returnToWorks, setReturnToWorks] = useState<OccReturnToWork[]>([])
  const [restrictions, setRestrictions] = useState<OccRestriction[]>([])
  const [alerts, setAlerts] = useState<OccAlert[]>([])
  const [reports, setReports] = useState<OccReport[]>([])

  // ── Load from Supabase / localStorage ──────
  useEffect(() => {
    const get = <T,>(key: string, fallback: T): T => {
      try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback } catch { return fallback }
    }
    const load = async () => {
      try {
        const data = await Promise.all([
          supabase.from('occupational_clinics').select('*'),
          supabase.from('occupational_doctors').select('*'),
          supabase.from('occupational_exam_types').select('*'),
          supabase.from('occupational_pcmso').select('*'),
          supabase.from('occupational_employees').select('*'),
          supabase.from('occupational_asos').select('*'),
          supabase.from('occupational_exams').select('*'),
          supabase.from('occupational_medical_certificates').select('*'),
          supabase.from('occupational_absences').select('*'),
          supabase.from('occupational_return_to_work').select('*'),
          supabase.from('occupational_restrictions').select('*'),
          supabase.from('occupational_alerts').select('*'),
          supabase.from('occupational_reports').select('*'),
        ])
        data[0].data?.length ? setClinics(data[0].data) : setClinics(get('occ_clinics', SEED_CLINICS))
        data[1].data?.length ? setDoctors(data[1].data) : setDoctors(get('occ_doctors', SEED_DOCTORS))
        data[2].data?.length ? setExamTypes(data[2].data) : setExamTypes(get('occ_exam_types', SEED_EXAM_TYPES))
        data[3].data?.length ? setPcmsoList(data[3].data) : setPcmsoList(get('occ_pcmso', SEED_PCMSO))
        data[4].data?.length ? setEmployees(data[4].data) : setEmployees(get('occ_employees', SEED_EMPLOYEES))
        data[5].data?.length ? setAsos(data[5].data) : setAsos(get('occ_asos', SEED_ASOS))
        data[6].data?.length ? setExams(data[6].data) : setExams(get('occ_exams', SEED_EXAMS))
        data[7].data?.length ? setCertificates(data[7].data) : setCertificates(get('occ_certificates', SEED_CERTIFICATES))
        data[8].data?.length ? setAbsences(data[8].data) : setAbsences(get('occ_absences', SEED_ABSENCES))
        data[9].data?.length ? setReturnToWorks(data[9].data) : setReturnToWorks(get('occ_return_works', []))
        data[10].data?.length ? setRestrictions(data[10].data) : setRestrictions(get('occ_restrictions', []))
        data[11].data?.length ? setAlerts(data[11].data) : setAlerts(get('occ_alerts', []))
        data[12].data?.length ? setReports(data[12].data) : setReports(get('occ_reports', []))
      } catch {
        setClinics(get('occ_clinics', SEED_CLINICS))
        setDoctors(get('occ_doctors', SEED_DOCTORS))
        setExamTypes(get('occ_exam_types', SEED_EXAM_TYPES))
        setPcmsoList(get('occ_pcmso', SEED_PCMSO))
        setEmployees(get('occ_employees', SEED_EMPLOYEES))
        setAsos(get('occ_asos', SEED_ASOS))
        setExams(get('occ_exams', SEED_EXAMS))
        setCertificates(get('occ_certificates', SEED_CERTIFICATES))
        setAbsences(get('occ_absences', SEED_ABSENCES))
        setReturnToWorks(get('occ_return_works', []))
        setRestrictions(get('occ_restrictions', []))
        setAlerts(get('occ_alerts', []))
        setReports(get('occ_reports', []))
      }
    }
    load()
  }, [])

  const sync = (key: string, val: unknown) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val))
  }

  // ── GENERIC SYNC HELPER ────────────────────
  function mutators<T extends { id: string }>(setter: React.Dispatch<React.SetStateAction<T[]>>, list: T[], storageKey: string, tableName: string) {
    const doSync = (items: T[]) => { setter(items); sync(storageKey, items) }
    return {
      add: (item: Omit<T, 'id' | 'createdAt'>): T => {
        const created = { ...item, id: id(), createdAt: new Date().toISOString() } as unknown as T
        doSync([created, ...list])
        supabase.from(tableName).insert(created).then()
        return created
      },
      update: (itemId: string, updates: Partial<T>) => {
        doSync(list.map(i => i.id === itemId ? { ...i, ...updates } : i))
        supabase.from(tableName).update(updates as any).eq('id', itemId).then()
      },
      remove: (itemId: string) => {
        doSync(list.filter(i => i.id !== itemId))
        supabase.from(tableName).delete().eq('id', itemId).then()
      }
    }
  }

  const clinicM = mutators(setClinics, clinics, 'occ_clinics', 'occupational_clinics')
  const doctorM = mutators(setDoctors, doctors, 'occ_doctors', 'occupational_doctors')
  const examTypeM = mutators(setExamTypes, examTypes, 'occ_exam_types', 'occupational_exam_types')
  const pcmsoM = mutators(setPcmsoList, pcmsoList, 'occ_pcmso', 'occupational_pcmso')
  const employeeM = mutators(setEmployees, employees, 'occ_employees', 'occupational_employees')
  const asoM = mutators(setAsos, asos, 'occ_asos', 'occupational_asos')
  const examM = mutators(setExams, exams, 'occ_exams', 'occupational_exams')
  const certificateM = mutators(setCertificates, certificates, 'occ_certificates', 'occupational_medical_certificates')
  const absenceM = mutators(setAbsences, absences, 'occ_absences', 'occupational_absences')
  const returnM = mutators(setReturnToWorks, returnToWorks, 'occ_return_works', 'occupational_return_to_work')
  const restrictionM = mutators(setRestrictions, restrictions, 'occ_restrictions', 'occupational_restrictions')
  const alertM = mutators(setAlerts, alerts, 'occ_alerts', 'occupational_alerts')
  const reportM = mutators(setReports, reports, 'occ_reports', 'occupational_reports')

  // ── COMPUTED INDICATORS ────────────────────

  const indicators = useMemo((): OccIndicators => {
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    const now = today()

    const activeEmployees = employees.filter(e => e.status === 'ativo').length
    const absentEmployees = employees.filter(e => e.status === 'afastado').length
    const asosValid = asos.filter(a => a.status === 'ativo' && a.validityDate && a.validityDate >= now).length
    const asosExpiring = asos.filter(a => a.status === 'ativo' && a.validityDate && diffDays(now, a.validityDate) <= 30 && diffDays(now, a.validityDate) > 0).length
    const asosExpired = asos.filter(a => a.status === 'vencido' || (a.validityDate && a.validityDate < now)).length

    const examsScheduled = exams.filter(e => e.status === 'agendado').length
    const examsOverdue = exams.filter(e => e.status === 'agendado' && e.dueDate < now).length + exams.filter(e => e.status === 'nao_compareceu').length
    const examsCompleted = exams.filter(e => e.status === 'realizado').length

    const activeAbsences = absences.filter(a => a.status === 'ativo').length
    const prolongedAbsences = absences.filter(a => a.status === 'ativo' && a.daysCount && a.daysCount > 15).length

    // Exams by month (last 6 months)
    const examsByPeriod: { month: string; total: number }[] = []
    for (let i = 5; i >= 0; i--) {
      const d = new Date()
      d.setMonth(d.getMonth() - i)
      const key = `${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`
      const total = exams.filter(e => {
        const ed = e.examDate ? new Date(e.examDate) : null
        return ed && ed.getMonth() === d.getMonth() && ed.getFullYear() === d.getFullYear()
      }).length
      examsByPeriod.push({ month: key, total })
    }

    // Absences by type
    const absencesByType = Object.entries(
      absences.reduce((acc, a) => {
        acc[a.absenceType] = (acc[a.absenceType] || 0) + 1
        return acc
      }, {} as Record<string, number>)
    ).map(([type, total]) => ({ type, total }))

    return {
      totalEmployees: employees.length, activeEmployees, absentEmployees,
      asosValid, asosExpiring, asosExpired,
      examsScheduled, examsOverdue, examsCompleted,
      activeCertificates: certificates.filter(c => c.startDate <= now && c.endDate >= now).length,
      activeAbsences, prolongedAbsences,
      activeRestrictions: restrictions.filter(r => r.status === 'ativa').length,
      activeReturnToWorks: returnToWorks.filter(r => r.status === 'planejado' || r.status === 'em_andamento').length,
      examsByPeriod, absencesByType,
    }
  }, [employees, asos, exams, certificates, absences, restrictions, returnToWorks])

  // ── AUTO ALERTS GENERATION ──────────────────

  const generateAlerts = useCallback(() => {
    const now = today()
    const newAlerts: OccAlert[] = []
    const nowDate = new Date()

    // ASO vencendo (30 days)
    asos.filter(a => a.status === 'ativo' && a.validityDate && diffDays(now, a.validityDate) <= 30 && diffDays(now, a.validityDate) > 0).forEach(a => {
      const emp = employees.find(e => e.id === a.employeeId)
      newAlerts.push({
        id: id(), companyId: a.companyId, employeeId: a.employeeId,
        alertType: 'aso_vencendo', title: `ASO vencendo em ${diffDays(now, a.validityDate!)} dias`,
        description: `${emp?.name || 'Colaborador'} — ASO #${a.asoNumber} vence em ${new Date(a.validityDate!).toLocaleDateString('pt-BR')}`,
        referenceDate: a.validityDate!, severity: 'warning', isRead: false, isResolved: false, createdAt: new Date().toISOString(),
      })
    })

    // ASO vencido
    asos.filter(a => a.status === 'ativo' && a.validityDate && a.validityDate < now).forEach(a => {
      const emp = employees.find(e => e.id === a.employeeId)
      newAlerts.push({
        id: id(), companyId: a.companyId, employeeId: a.employeeId,
        alertType: 'aso_vencendo', title: `ASO vencido`,
        description: `${emp?.name || 'Colaborador'} — ASO #${a.asoNumber} venceu em ${new Date(a.validityDate!).toLocaleDateString('pt-BR')}`,
        referenceDate: a.validityDate!, severity: 'critical', isRead: false, isResolved: false, createdAt: new Date().toISOString(),
      })
    })

    // Exam overdue
    exams.filter(e => e.status === 'agendado' && e.dueDate < now).forEach(e => {
      const emp = employees.find(emp => emp.id === e.employeeId)
      newAlerts.push({
        id: id(), companyId: e.companyId, employeeId: e.employeeId,
        alertType: 'exame_atrasado', title: `Exame em atraso: ${e.examTypeName}`,
        description: `${emp?.name || 'Colaborador'} — ${e.examTypeName} venceu em ${new Date(e.dueDate).toLocaleDateString('pt-BR')}`,
        referenceDate: e.dueDate, severity: 'critical', isRead: false, isResolved: false, createdAt: new Date().toISOString(),
      })
    })

    // PCMSO vencendo
    pcmsoList.filter(p => p.status === 'vigente' && p.renewalDate && diffDays(now, p.renewalDate) <= 60 && diffDays(now, p.renewalDate) > 0).forEach(p => {
      newAlerts.push({
        id: id(), companyId: p.companyId,
        alertType: 'pcmso_vencendo', title: `PCMSO próximo do vencimento`,
        description: `${p.companyName} — Renovação prevista para ${new Date(p.renewalDate!).toLocaleDateString('pt-BR')}`,
        referenceDate: p.renewalDate!, severity: 'warning', isRead: false, isResolved: false, createdAt: new Date().toISOString(),
      })
    })

    // Prolonged absences (> 15 days)
    absences.filter(a => a.status === 'ativo' && a.daysCount && a.daysCount > 15).forEach(a => {
      const emp = employees.find(e => e.id === a.employeeId)
      newAlerts.push({
        id: id(), companyId: a.companyId, employeeId: a.employeeId,
        alertType: 'afastamento_prolongado', title: `Afastamento prolongado (${a.daysCount} dias)`,
        description: `${emp?.name || 'Colaborador'} — ${a.absenceType} — ${a.daysCount} dias`,
        referenceDate: a.startDate, severity: 'warning', isRead: false, isResolved: false, createdAt: new Date().toISOString(),
      })
    })

    if (newAlerts.length > 0) {
      const updated = [...newAlerts, ...alerts]
      setAlerts(updated)
      sync('occ_alerts', updated)
    }
  }, [asos, exams, pcmsoList, absences, employees, alerts])

  // Auto-generate alerts on data change
  useEffect(() => { generateAlerts() }, [asos.length, exams.length, absences.length])

  const markAlertRead = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isRead: true } : a))
    sync('occ_alerts', alerts.map(a => a.id === alertId ? { ...a, isRead: true } : a))
  }

  const resolveAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, isResolved: true, isRead: true } : a))
    sync('occ_alerts', alerts.map(a => a.id === alertId ? { ...a, isResolved: true, isRead: true } : a))
  }

  return (
    <OccContext.Provider value={{
      clinics, doctors, examTypes, pcmsoList, employees, asos, exams, certificates, absences,
      returnToWorks, restrictions, alerts, reports, indicators,
      addClinic: clinicM.add, updateClinic: clinicM.update, deleteClinic: clinicM.remove,
      addDoctor: doctorM.add, updateDoctor: doctorM.update, deleteDoctor: doctorM.remove,
      addExamType: examTypeM.add, updateExamType: examTypeM.update, deleteExamType: examTypeM.remove,
      addPcmso: pcmsoM.add, updatePcmso: pcmsoM.update, deletePcmso: pcmsoM.remove,
      addEmployee: employeeM.add, updateEmployee: employeeM.update, deleteEmployee: employeeM.remove,
      addAso: asoM.add, updateAso: asoM.update, deleteAso: asoM.remove,
      addExam: examM.add, updateExam: examM.update, deleteExam: examM.remove,
      addCertificate: certificateM.add, updateCertificate: certificateM.update, deleteCertificate: certificateM.remove,
      addAbsence: absenceM.add, updateAbsence: absenceM.update, deleteAbsence: absenceM.remove,
      addReturnToWork: returnM.add, updateReturnToWork: returnM.update, deleteReturnToWork: returnM.remove,
      addRestriction: restrictionM.add, updateRestriction: restrictionM.update, deleteRestriction: restrictionM.remove,
      addAlert: alertM.add, markAlertRead, resolveAlert,
      addReport: reportM.add, generateAlerts,
    }}>
      {children}
    </OccContext.Provider>
  )
}

export const useOccupational = () => {
  const ctx = useContext(OccContext)
  if (!ctx) throw new Error('useOccupational must be used within OccupationalProvider')
  return ctx
}
