'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { acessoService } from '@/services/acessoService'

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

export function AcessoTemporarioProvider({ children }: { children: React.ReactNode }) {
  const [accesses, setAccesses] = useState<TemporaryAccess[]>([])
  const [tempUsers, setTempUsers] = useState<TempUser[]>([])
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])

  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    Promise.all([
      acessoService.listAccesses(),
      acessoService.listUsers(),
      acessoService.listQuestionnaires(),
      acessoService.listResponses(),
    ]).then(([accs, usrs, qs, rsps]) => {
      if (accs.length > 0) setAccesses(accs as TemporaryAccess[])
      if (usrs.length > 0) setTempUsers(usrs as TempUser[])
      if (qs.length > 0) setQuestionnaires(qs as Questionnaire[])
      if (rsps.length > 0) setResponses(rsps as QuestionnaireResponse[])
    }).catch((err) => console.error('[AcessoTemporarioContext] load error:', err))
  }, [])

  // Persistência é feita individualmente nas operações CRUD

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
