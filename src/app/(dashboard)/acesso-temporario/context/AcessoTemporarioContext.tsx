'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

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

const SEED_ACCESSES: TemporaryAccess[] = []

const SEED_USERS: TempUser[] = []

const SEED_QUESTIONNAIRES: Questionnaire[] = []

const SEED_RESPONSES: QuestionnaireResponse[] = []

export function AcessoTemporarioProvider({ children }: { children: React.ReactNode }) {
  const [accesses, setAccesses] = useState<TemporaryAccess[]>([])
  const [tempUsers, setTempUsers] = useState<TempUser[]>([])
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([])
  const [responses, setResponses] = useState<QuestionnaireResponse[]>([])

  const loadedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || loadedRef.current) return
    loadedRef.current = true

    const get = <T,>(key: string, fallback: T): T => {
      try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback }
      catch { return fallback }
    }

    const loadFromLocal = () => {
      setAccesses(get('acesso_temporario_accesses', SEED_ACCESSES))
      setTempUsers(get('acesso_temporario_users', SEED_USERS))
      setQuestionnaires(get('acesso_temporario_questionnaires', SEED_QUESTIONNAIRES))
      setResponses(get('acesso_temporario_responses', SEED_RESPONSES))
    }

    loadFromLocal()

    fetch('/api/sync/acesso-temporario')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data) {
          const d = res.data
          if (get('acesso_temporario_accesses', []).length === 0 && Array.isArray(d.accesses) && d.accesses.length > 0) setAccesses(d.accesses as TemporaryAccess[])
          if (get('acesso_temporario_users', []).length === 0 && Array.isArray(d.tempUsers) && d.tempUsers.length > 0) setTempUsers(d.tempUsers as TempUser[])
          if (get('acesso_temporario_questionnaires', []).length === 0 && Array.isArray(d.questionnaires) && d.questionnaires.length > 0) setQuestionnaires(d.questionnaires as Questionnaire[])
          if (get('acesso_temporario_responses', []).length === 0 && Array.isArray(d.responses) && d.responses.length > 0) setResponses(d.responses as QuestionnaireResponse[])
          for (const [k, v] of Object.entries(d)) {
            if (Array.isArray(v) && v.length > 0) localStorage.setItem(`acesso_temporario_${k}`, JSON.stringify(v))
          }
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasData = accesses.length > 0 || tempUsers.length > 0 || questionnaires.length > 0 || responses.length > 0
    if (!hasData) return
    const timer = setTimeout(() => {
      const payload = { accesses, tempUsers, questionnaires, responses }
      fetch('/api/sync/acesso-temporario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merged: payload }),
      }).catch(err => console.error('AcessoTemporarioContext sync error:', err))
      localStorage.setItem('acesso_temporario_accesses', JSON.stringify(accesses))
      localStorage.setItem('acesso_temporario_users', JSON.stringify(tempUsers))
      localStorage.setItem('acesso_temporario_questionnaires', JSON.stringify(questionnaires))
      localStorage.setItem('acesso_temporario_responses', JSON.stringify(responses))
    }, 500)
    return () => clearTimeout(timer)
  }, [accesses, tempUsers, questionnaires, responses])

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
