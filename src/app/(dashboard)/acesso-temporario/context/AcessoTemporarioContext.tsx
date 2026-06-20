'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export interface TemporaryAccess {
  id: string; companyId: string; companyName: string; token: string
  createdAt: string; expiresAt: string; lastAccess?: string; active: boolean; createdBy: string
}

export interface TempUser {
  id: string; companyId: string; companyName: string; name: string; email: string; password: string
  active: boolean; createdAt: string; createdBy: string; lastAccess?: string
}

export type QuestionType = 'text' | 'textarea' | 'select' | 'radio' | 'date' | 'number' | 'email' | 'phone' | 'cnpj'

export interface QuestionOption { id: string; label: string }
export interface Question {
  id: string; text: string; type: QuestionType; required: boolean
  options?: QuestionOption[]; placeholder?: string
}

export interface Questionnaire {
  id: string; title: string; description?: string; instructions?: string
  questions: Question[]; createdAt: string; createdBy: string; active: boolean
}

export interface Answer { questionId: string; value: string | string[] }
export interface QuestionnaireResponse {
  id: string; questionnaireId: string; questionnaireTitle: string
  companyId: string; companyName: string; userId: string; userName: string
  answers: Answer[]; submittedAt: string; status: 'draft' | 'submitted'
}

interface AcessoTemporarioContextType {
  accesses: TemporaryAccess[]
  createAccess: (companyId: string, companyName: string, expiresAt: string, createdBy: string) => TemporaryAccess
  revokeAccess: (id: string) => void; validateToken: (token: string) => TemporaryAccess | null
  useToken: (token: string) => boolean; deleteAccess: (id: string) => void

  tempUsers: TempUser[]
  createTempUser: (data: { companyId: string; companyName: string; name: string; email: string; password: string; createdBy: string }) => TempUser
  toggleTempUser: (id: string) => void; deleteTempUser: (id: string) => void
  authenticateTempUser: (email: string, password: string) => TempUser | null
  updateTempUserLastAccess: (id: string) => void

  questionnaires: Questionnaire[]
  createQuestionnaire: (data: { title: string; description?: string; instructions?: string; questions: Question[]; createdBy: string }) => Questionnaire
  updateQuestionnaire: (id: string, data: Partial<Questionnaire>) => void
  deleteQuestionnaire: (id: string) => void

  responses: QuestionnaireResponse[]
  submitResponse: (data: { questionnaireId: string; questionnaireTitle: string; companyId: string; companyName: string; userId: string; userName: string; answers: Answer[] }) => QuestionnaireResponse
  saveDraftResponse: (data: { questionnaireId: string; questionnaireTitle: string; companyId: string; companyName: string; userId: string; userName: string; answers: Answer[] }) => QuestionnaireResponse
}

const AcessoTemporarioContext = createContext<AcessoTemporarioContextType | undefined>(undefined)

function gid(): string { return 'ta-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) }

function generateToken(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let token = ''
  for (let i = 0; i < 20; i++) token += chars.charAt(Math.floor(Math.random() * chars.length))
  return token
}

const SEED_ACCESSES: TemporaryAccess[] = [
  { id: 'tmp-1', companyId: 'comp-1', companyName: 'BR Distribuidora', token: 'BR2026DEMO001', createdAt: '2026-06-01T00:00:00Z', expiresAt: '2026-12-31T00:00:00Z', lastAccess: '2026-06-15T10:30:00Z', active: true, createdBy: 'Marcos Crepaldi' },
  { id: 'tmp-2', companyId: 'comp-2', companyName: 'Vale S.A.', token: 'VALE2026DEMO002', createdAt: '2026-06-10T00:00:00Z', expiresAt: '2026-09-30T00:00:00Z', active: true, createdBy: 'Marcos Crepaldi' },
  { id: 'tmp-3', companyId: 'comp-3', companyName: 'Banco Itaú', token: 'ITAU2026DEMO003', createdAt: '2026-05-15T00:00:00Z', expiresAt: '2026-06-15T00:00:00Z', active: false, createdBy: 'Ana Oliveira' },
]

const SEED_USERS: TempUser[] = [
  { id: 'tu-1', companyId: 'comp-1', companyName: 'BR Distribuidora', name: 'Carlos Silva', email: 'carlos@brdistribuidora.com', password: '123456', active: true, createdAt: '2026-06-01T00:00:00Z', createdBy: 'Admin' },
  { id: 'tu-2', companyId: 'comp-2', companyName: 'Vale S.A.', name: 'Roberto Lima', email: 'roberto@vale.com', password: '123456', active: true, createdAt: '2026-06-02T00:00:00Z', createdBy: 'Admin' },
]

const SEED_QUESTIONNAIRES: Questionnaire[] = [
  {
    id: 'q-1', title: 'Diagnóstico Organizacional', description: 'Levantamento inicial de dados da empresa', instructions: 'Responda todas as perguntas com atenção.',
    questions: [
      { id: 'q1-1', text: 'Nome da empresa', type: 'text', required: true, placeholder: 'Razão social' },
      { id: 'q1-2', text: 'CNPJ', type: 'cnpj', required: true },
      { id: 'q1-3', text: 'Segmento de atuação', type: 'select', required: true, options: [{ id: 'opt-1', label: 'Indústria' }, { id: 'opt-2', label: 'Comércio' }, { id: 'opt-3', label: 'Serviços' }, { id: 'opt-4', label: 'Tecnologia' }, { id: 'opt-5', label: 'Saúde' }, { id: 'opt-6', label: 'Financeiro' }, { id: 'opt-7', label: 'Educação' }, { id: 'opt-8', label: 'Outro' }] },
      { id: 'q1-4', text: 'Número de funcionários', type: 'number', required: true, placeholder: 'Ex: 150' },
      { id: 'q1-5', text: 'Principais desafios de DHO', type: 'textarea', required: false, placeholder: 'Descreva os principais desafios...' },
    ], createdAt: '2026-06-01T00:00:00Z', createdBy: 'Marcos Crepaldi', active: true,
  },
  {
    id: 'q-2', title: 'Levantamento de Necessidades de Treinamento', description: 'Identificação das necessidades de capacitação',
    questions: [
      { id: 'q2-1', text: 'Cargos que necessitam treinamento', type: 'textarea', required: true },
      { id: 'q2-2', text: 'Temas prioritários', type: 'select', required: true, options: [{ id: 'opt-9', label: 'Segurança do Trabalho' }, { id: 'opt-10', label: 'Liderança' }, { id: 'opt-11', label: 'Comunicação' }, { id: 'opt-12', label: 'Atendimento ao Cliente' }, { id: 'opt-13', label: 'Gestão de Pessoas' }, { id: 'opt-14', label: 'NRs Regulamentadoras' }] },
      { id: 'q2-3', text: 'Previsão de participantes', type: 'number', required: true },
      { id: 'q2-4', text: 'Observações adicionais', type: 'textarea', required: false },
    ], createdAt: '2026-06-05T00:00:00Z', createdBy: 'Marcos Crepaldi', active: true,
  },
]

const SEED_RESPONSES: QuestionnaireResponse[] = [
  { id: 'r-1', questionnaireId: 'q-1', questionnaireTitle: 'Diagnóstico Organizacional', companyId: 'comp-1', companyName: 'BR Distribuidora', userId: 'tu-1', userName: 'Carlos Silva', answers: [{ questionId: 'q1-1', value: 'BR Distribuidora Ltda' }, { questionId: 'q1-2', value: '11.222.333/0001-44' }, { questionId: 'q1-3', value: 'Comércio' }, { questionId: 'q1-4', value: '320' }, { questionId: 'q1-5', value: 'Alta rotatividade e necessidade de desenvolvimento de lideranças.' }], submittedAt: '2026-06-10T14:00:00Z', status: 'submitted' },
]

export function AcessoTemporarioProvider({ children }: { children: React.ReactNode }) {
  const [accesses, setAccesses] = useState<TemporaryAccess[]>([])
  const [tempUsers, setTempUsers] = useState<TempUser[]>([])
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])

  useEffect(() => {
    try {
      const a = localStorage.getItem('acesso_temporario_accesses')
      if (a) setAccesses(JSON.parse(a)); else setAccesses(SEED_ACCESSES)
      const u = localStorage.getItem('acesso_temporario_users')
      if (u) setTempUsers(JSON.parse(u)); else setTempUsers(SEED_USERS)
      const q = localStorage.getItem('acesso_temporario_questionnaires')
      if (q) setQuestionnaires(JSON.parse(q)); else setQuestionnaires(SEED_QUESTIONNAIRES)
      const r = localStorage.getItem('acesso_temporario_responses')
      if (r) setResponses(JSON.parse(r)); else setResponses(SEED_RESPONSES)
    } catch { setAccesses(SEED_ACCESSES); setTempUsers(SEED_USERS); setQuestionnaires(SEED_QUESTIONNAIRES); setResponses(SEED_RESPONSES) }
  }, [])

  useEffect(() => { try { localStorage.setItem('acesso_temporario_accesses', JSON.stringify(accesses)) } catch {} }, [accesses])
  useEffect(() => { try { localStorage.setItem('acesso_temporario_users', JSON.stringify(tempUsers)) } catch {} }, [tempUsers])
  useEffect(() => { try { localStorage.setItem('acesso_temporario_questionnaires', JSON.stringify(questionnaires)) } catch {} }, [questionnaires])
  useEffect(() => { try { localStorage.setItem('acesso_temporario_responses', JSON.stringify(responses)) } catch {} }, [responses])

  // --- Access Tokens ---
  const createAccess = useCallback((companyId: string, companyName: string, expiresAt: string, createdBy: string) => {
    const newAccess: TemporaryAccess = { id: gid(), companyId, companyName, token: generateToken(), createdAt: new Date().toISOString(), expiresAt, active: true, createdBy }
    setAccesses(prev => [...prev, newAccess]); return newAccess
  }, [])
  const revokeAccess = useCallback((id: string) => { setAccesses(prev => prev.map(a => a.id === id ? { ...a, active: false } : a)) }, [])
  const validateToken = useCallback((token: string): TemporaryAccess | null => {
    const access = accesses.find(a => a.token === token && a.active)
    return access && new Date(access.expiresAt) >= new Date() ? access : null
  }, [accesses])
  const useToken = useCallback((token: string): boolean => {
    const access = validateToken(token)
    if (!access) return false
    setAccesses(prev => prev.map(a => a.id === access.id ? { ...a, lastAccess: new Date().toISOString() } : a)); return true
  }, [validateToken])
  const deleteAccess = useCallback((id: string) => { setAccesses(prev => prev.filter(a => a.id !== id)) }, [])

  // --- Users ---
  const createTempUser = useCallback((data: { companyId: string; companyName: string; name: string; email: string; password: string; createdBy: string }) => {
    const user: TempUser = { id: gid(), ...data, active: true, createdAt: new Date().toISOString() }
    setTempUsers(prev => [...prev, user]); return user
  }, [])
  const toggleTempUser = useCallback((id: string) => { setTempUsers(prev => prev.map(u => u.id === id ? { ...u, active: !u.active } : u)) }, [])
  const deleteTempUser = useCallback((id: string) => { setTempUsers(prev => prev.filter(u => u.id !== id)) }, [])
  const authenticateTempUser = useCallback((email: string, password: string): TempUser | null => {
    const user = tempUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.active)
    return user || null
  }, [tempUsers])
  const updateTempUserLastAccess = useCallback((id: string) => { setTempUsers(prev => prev.map(u => u.id === id ? { ...u, lastAccess: new Date().toISOString() } : u)) }, [])

  // --- Questionnaires ---
  const createQuestionnaire = useCallback((data: { title: string; description?: string; instructions?: string; questions: Question[]; createdBy: string }) => {
    const q: Questionnaire = { id: gid(), ...data, createdAt: new Date().toISOString(), active: true }
    setQuestionnaires(prev => [...prev, q]); return q
  }, [])
  const updateQuestionnaire = useCallback((id: string, data: Partial<Questionnaire>) => { setQuestionnaires(prev => prev.map(q => q.id === id ? { ...q, ...data } : q)) }, [])
  const deleteQuestionnaire = useCallback((id: string) => { setQuestionnaires(prev => prev.filter(q => q.id !== id)) }, [])

  // --- Responses ---
  const submitResponse = useCallback((data: { questionnaireId: string; questionnaireTitle: string; companyId: string; companyName: string; userId: string; userName: string; answers: Answer[] }) => {
    const r: QuestionnaireResponse = { id: gid(), ...data, submittedAt: new Date().toISOString(), status: 'submitted' }
    setResponses(prev => [r, ...prev]); return r
  }, [])
  const saveDraftResponse = useCallback((data: { questionnaireId: string; questionnaireTitle: string; companyId: string; companyName: string; userId: string; userName: string; answers: Answer[] }) => {
    const existing = responses.find(r => r.questionnaireId === data.questionnaireId && r.companyId === data.companyId && r.status === 'draft')
    if (existing) {
      const updated = { ...existing, answers: data.answers, submittedAt: new Date().toISOString() }
      setResponses(prev => prev.map(r => r.id === existing.id ? updated : r)); return updated
    }
    const r: QuestionnaireResponse = { id: gid(), ...data, submittedAt: new Date().toISOString(), status: 'draft' }
    setResponses(prev => [r, ...prev]); return r
  }, [responses])

  return (
    <AcessoTemporarioContext.Provider value={{
      accesses, createAccess, revokeAccess, validateToken, useToken, deleteAccess,
      tempUsers, createTempUser, toggleTempUser, deleteTempUser, authenticateTempUser, updateTempUserLastAccess,
      questionnaires, createQuestionnaire, updateQuestionnaire, deleteQuestionnaire,
      responses, submitResponse, saveDraftResponse,
    }}>
      {children}
    </AcessoTemporarioContext.Provider>
  )
}

export function useAcessoTemporario() {
  const ctx = useContext(AcessoTemporarioContext)
  if (!ctx) throw new Error('useAcessoTemporario must be used within AcessoTemporarioProvider')
  return ctx
}
