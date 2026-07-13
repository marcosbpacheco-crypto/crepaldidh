'use client'

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react'
import { useSupabase } from '../../crm/context/SupabaseProvider'

// ==========================================
// 1. TYPES
// ==========================================

export type ClientStatus = 'active' | 'suspended' | 'churned'
export type InteractionType = 'call' | 'meeting' | 'whatsapp' | 'email' | 'visit' | 'support'
export type ServiceStatusType = 'not_started' | 'in_progress' | 'completed' | 'delayed'
export type ContractType = 'first' | 'renewal'

export interface ClientService {
  name: string
  status: ServiceStatusType
  startDate: string
  endDate: string
  progress: number
}

export interface Client {
  id: string
  companyId: string
  companyName: string
  companyTradeName: string
  cnpj: string
  segment: string
  city: string
  state: string
  services: ClientService[]
  contractType: ContractType
  internalResponsible: string
  status: ClientStatus
  startDate: string
  endDate: string
  monthlyValue: number
  totalValue: number
  notes: string
  createdAt: string
}

export interface ClientContact {
  id: string
  clientId: string
  name: string
  role: string
  phone: string
  email: string
  isPrimary: boolean
}

export interface ClientInteraction {
  id: string
  clientId: string
  type: InteractionType
  title: string
  description: string
  date: string
  author: string
}

export interface ClientDocument {
  id: string
  clientId: string
  name: string
  url: string
  uploadedAt: string
}

export interface ClientFeedback {
  id: string
  clientId: string
  score: number
  comment: string
  date: string
}

export type OperationStatus = 'idle' | 'loading' | 'success' | 'error'

interface ClientsContextType {
  clients: Client[]
  contacts: ClientContact[]
  interactions: ClientInteraction[]
  documents: ClientDocument[]
  feedbacks: ClientFeedback[]
  addClient: (c: Omit<Client, 'id' | 'createdAt'>) => Promise<Client>
  updateClient: (id: string, updates: Partial<Client>) => Promise<void>
  deleteClient: (id: string) => Promise<void>
  hardDeleteClient: (id: string) => Promise<void>
  restoreClient: (id: string) => Promise<void>
  refreshClients: () => Promise<void>
  addContact: (c: Omit<ClientContact, 'id'>) => Promise<void>
  updateContact: (id: string, updates: Partial<ClientContact>) => Promise<void>
  deleteContact: (id: string) => Promise<void>
  addInteraction: (i: Omit<ClientInteraction, 'id' | 'date'>) => Promise<void>
  addFeedback: (f: Omit<ClientFeedback, 'id' | 'date'>) => Promise<void>
  status: OperationStatus
  errorMessage: string | null
  clearError: () => void
}

// ==========================================
// 2. CONTEXT
// ==========================================

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useSupabase()
  const [clients, setClients] = useState<Client[]>([])
  const [contacts, setContacts] = useState<ClientContact[]>([])
  const [interactions, setInteractions] = useState<ClientInteraction[]>([])
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([])
  const [status, setStatus] = useState<OperationStatus>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const loadedRef = useRef(false)

  const clearError = useCallback(() => setErrorMessage(null), [])

  function setError(msg: string) {
    console.error('[CLIENTS]', msg)
    setErrorMessage(msg)
    setStatus('error')
  }

  function sanitizeClients(raw: unknown[]): Client[] {
    return (raw || []).filter(c => c && (c as any).companyName && (c as any).companyName.trim()).map(c => {
      const r = c as any
      return {
        id: r.id || '',
        companyId: r.companyId || r.company_id || '',
        companyName: r.companyName || r.company_name || '',
        companyTradeName: r.companyTradeName || r.company_trade_name || r.companyName || '',
        cnpj: r.cnpj || '',
        segment: r.segment || '',
        city: r.city || '',
        state: r.state || '',
        services: Array.isArray(r.services) ? r.services : [],
        contractType: r.contractType === 'renewal' || r.contract_type === 'renewal' ? 'renewal' as const : 'first' as const,
        internalResponsible: r.internalResponsible || r.internal_responsible || '',
        status: ['active', 'suspended', 'churned'].includes(r.status) ? r.status : 'active' as ClientStatus,
        startDate: r.startDate || r.start_date || '',
        endDate: r.endDate || r.end_date || '',
        monthlyValue: Number(r.monthlyValue ?? r.monthly_value) || 0,
        totalValue: Number(r.totalValue ?? r.total_value) || 0,
        notes: r.notes || '',
        createdAt: r.createdAt || r.created_at || new Date().toISOString(),
      }
    })
  }

  function sanitizeContacts(raw: unknown[]): ClientContact[] {
    return (raw || []).filter(c => c && (c as any).name?.trim()).map(c => {
      const r = c as any
      return {
        id: r.id || '',
        clientId: r.clientId || r.client_id || '',
        name: r.name || '',
        role: r.role || '',
        phone: r.phone || '',
        email: r.email || '',
        isPrimary: r.isPrimary ?? r.is_primary ?? false,
      }
    })
  }

  function sanitizeInteractions(raw: unknown[]): ClientInteraction[] {
    return (raw || []).filter(c => c && (c as any).title?.trim()).map(c => {
      const r = c as any
      return {
        id: r.id || '',
        clientId: r.clientId || r.client_id || '',
        type: r.type || 'call',
        title: r.title || '',
        description: r.description || '',
        date: r.date || r.created_at || new Date().toISOString(),
        author: r.author || '',
      }
    })
  }

  function sanitizeFeedbacks(raw: unknown[]): ClientFeedback[] {
    return (raw || []).filter(c => c && (c as any).score != null).map(c => {
      const r = c as any
      return {
        id: r.id || '',
        clientId: r.clientId || r.client_id || '',
        score: r.score ?? 0,
        comment: r.comment || '',
        date: r.date || r.created_at || new Date().toISOString(),
      }
    })
  }

  // ==========================================
  // LOAD inicial (única fonte da verdade = Supabase)
  // ==========================================
  const loadFromAPI = useCallback(async () => {
    try {
      const res = await fetch('/api/sync/clients')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      const d = json?.data || json
      if (d?.clients) {
        setClients(sanitizeClients(d.clients))
        setContacts(sanitizeContacts(d.contacts || []))
        setInteractions(sanitizeInteractions(d.interactions || []))
        setDocuments((d.documents || []) as ClientDocument[])
        setFeedbacks(sanitizeFeedbacks(d.feedbacks || []))
      }
      return d
    } catch (err: any) {
      console.error('[CLIENTS] load error:', err)
      throw err
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined' || loadedRef.current) return
    loadedRef.current = true
    setStatus('loading')
    loadFromAPI()
      .then(() => setStatus('idle'))
      .catch(() => setStatus('idle'))
  }, [loadFromAPI])

  // ==========================================
  // REALTIME — Sincroniza automaticamente entre abas
  // ==========================================
  useEffect(() => {
    if (!supabase) return
    const tables = ['client_list', 'client_contacts', 'client_interactions', 'client_documents', 'client_feedbacks']
    const channels = tables.map(table => {
      return supabase
        .channel(`${table}-changes`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          // Recarrega tudo quando qualquer mudança ocorrer
          loadFromAPI().catch(() => {})
        })
        .subscribe()
    })

    return () => {
      channels.forEach(ch => supabase.removeChannel(ch))
    }
  }, [supabase, loadFromAPI])

  // ==========================================
  // CRUD OPERATIONS (NUNCA otimistas — só atualiza após confirmação da API)
  // ==========================================

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  const addClient = async (c: Omit<Client, 'id' | 'createdAt'>): Promise<Client> => {
    setStatus('loading')
    setErrorMessage(null)
    const newClient: Client = { ...c, id: generateId(), createdAt: new Date().toISOString() }

    // === VALIDACAO ===
    if (!c.companyName?.trim()) {
      setError('Nome da empresa é obrigatório')
      throw new Error('companyName é obrigatório')
    }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'client', id: newClient.id, ...c }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || `Erro ${res.status}`)
        throw new Error(json?.error || 'Falha ao criar cliente')
      }
      // Atualiza estado SOMENTE após confirmação
      setClients(prev => [newClient, ...prev])
      setStatus('success')
      return newClient
    } catch (err: any) {
      if (!errorMessage) setError(err.message)
      throw err
    }
  }

  const updateClient = async (id: string, updates: Partial<Client>) => {
    setStatus('loading')
    setErrorMessage(null)

    try {
      const res = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'client', id, ...updates }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || `Erro ${res.status}`)
        throw new Error(json?.error || 'Falha ao atualizar cliente')
      }
      setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
      setStatus('success')
    } catch (err: any) {
      if (!errorMessage) setError(err.message)
      throw err
    }
  }

  const deleteClient = async (id: string) => {
    setStatus('loading')
    setErrorMessage(null)

    try {
      const res = await fetch('/api/clients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || `Erro ${res.status}`)
        throw new Error(json?.error || 'Falha ao excluir cliente')
      }
      setClients(prev => prev.filter(c => c.id !== id))
      setContacts(prev => prev.filter(c => c.clientId !== id))
      setInteractions(prev => prev.filter(i => i.clientId !== id))
      setFeedbacks(prev => prev.filter(f => f.clientId !== id))
      setStatus('success')
    } catch (err: any) {
      if (!errorMessage) setError(err.message)
      throw err
    }
  }

  const hardDeleteClient = async (id: string) => {
    // hardDelete é apenas local (remove da lista em memória)
    setClients(prev => prev.filter(c => c.id !== id))
  }

  const refreshClients = async () => {
    setStatus('loading')
    try {
      await loadFromAPI()
      setStatus('success')
    } catch {
      setError('Falha ao recarregar clientes')
    }
  }

  const restoreClient = async (id: string) => {
    setStatus('loading')
    setErrorMessage(null)
    try {
      const res = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'restore', id }),
      })
      const json = await res.json()
      if (!res.ok) {
        setError(json?.error || `Erro ${res.status}`)
        throw new Error(json?.error || 'Falha ao restaurar cliente')
      }
      await refreshClients()
      setStatus('success')
    } catch (err: any) {
      if (!errorMessage) setError(err.message)
      throw err
    }
  }

  const addContact = async (c: Omit<ClientContact, 'id'>) => {
    if (!c.clientId || !c.name?.trim()) {
      setError('clientId e nome são obrigatórios')
      return
    }
    const newContact: ClientContact = { ...c, id: generateId() }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'contact', id: newContact.id, ...c }),
      })
      const json = await res.json()
      if (!res.ok) {
        console.error('[CLIENTS] addContact error:', json?.error || res.status)
        return
      }
      setContacts(prev => [...prev, newContact])
    } catch (err) {
      console.error('[CLIENTS] addContact fetch error:', err)
    }
  }

  const updateContact = async (id: string, updates: Partial<ClientContact>) => {
    try {
      const res = await fetch('/api/clients', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'contact', id, ...updates }),
      })
      const json = await res.json()
      if (!res.ok) {
        console.error('[CLIENTS] updateContact error:', json?.error || res.status)
        return
      }
      setContacts(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    } catch (err) {
      console.error('[CLIENTS] updateContact fetch error:', err)
    }
  }

  const deleteContact = async (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id))
    // NOTE: sem endpoint de DELETE para contacts na API atual
  }

  const addInteraction = async (i: Omit<ClientInteraction, 'id' | 'date'>) => {
    if (!i.clientId || !i.title?.trim()) return
    const newInt: ClientInteraction = { ...i, id: generateId(), date: new Date().toISOString() }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'interaction', ...i }),
      })
      const json = await res.json()
      if (!res.ok) {
        console.error('[CLIENTS] addInteraction error:', json?.error || res.status)
        return
      }
      setInteractions(prev => [newInt, ...prev])
    } catch (err) {
      console.error('[CLIENTS] addInteraction fetch error:', err)
    }
  }

  const addFeedback = async (f: Omit<ClientFeedback, 'id' | 'date'>) => {
    if (f.score == null) return
    const newFb: ClientFeedback = { ...f, id: generateId(), date: new Date().toISOString() }

    try {
      const res = await fetch('/api/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'feedback', ...f }),
      })
      const json = await res.json()
      if (!res.ok) {
        console.error('[CLIENTS] addFeedback error:', json?.error || res.status)
        return
      }
      setFeedbacks(prev => [newFb, ...prev])
    } catch (err) {
      console.error('[CLIENTS] addFeedback fetch error:', err)
    }
  }

  return (
    <ClientsContext.Provider value={{
      clients, contacts, interactions, documents, feedbacks,
      addClient, updateClient, deleteClient, hardDeleteClient, restoreClient, refreshClients,
      addContact, updateContact, deleteContact,
      addInteraction, addFeedback,
      status, errorMessage, clearError,
    }}>
      {children}
    </ClientsContext.Provider>
  )
}

export const useClients = () => {
  const ctx = useContext(ClientsContext)
  if (!ctx) throw new Error('useClients must be used within ClientsProvider')
  return ctx
}
