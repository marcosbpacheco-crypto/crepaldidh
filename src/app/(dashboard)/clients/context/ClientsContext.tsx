'use client'

import React, { createContext, useContext, useState, useEffect, useRef } from 'react'

// ==========================================
// 1. INTERFACES & TYPES
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

interface ClientsContextType {
  clients: Client[]
  contacts: ClientContact[]
  interactions: ClientInteraction[]
  documents: ClientDocument[]
  feedbacks: ClientFeedback[]
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client
  updateClient: (id: string, updates: Partial<Client>) => void
  deleteClient: (id: string) => Promise<void>
  hardDeleteClient: (id: string) => Promise<void>
  restoreClient: (id: string) => Promise<void>
  refreshClients: () => Promise<void>
  addContact: (contact: Omit<ClientContact, 'id'>) => void
  updateContact: (id: string, updates: Partial<ClientContact>) => void
  deleteContact: (id: string) => void
  addInteraction: (interaction: Omit<ClientInteraction, 'id' | 'date'>) => void
  addFeedback: (feedback: Omit<ClientFeedback, 'id' | 'date'>) => void
}

// ==========================================
// 2. SEED DATA
// ==========================================

const INITIAL_CLIENTS: Client[] = []

const INITIAL_CONTACTS: ClientContact[] = []

const INITIAL_INTERACTIONS: ClientInteraction[] = []

const INITIAL_DOCUMENTS: ClientDocument[] = []

const INITIAL_FEEDBACKS: ClientFeedback[] = []

// ==========================================
// 3. CONTEXT
// ==========================================

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [clients, setClients] = useState<Client[]>([])
  const [contacts, setContacts] = useState<ClientContact[]>([])
  const [interactions, setInteractions] = useState<ClientInteraction[]>([])
  const [documents, setDocuments] = useState<ClientDocument[]>([])
  const [feedbacks, setFeedbacks] = useState<ClientFeedback[]>([])
  const loadedRef = useRef(false)

  function sanitizeClients(raw: unknown[]): Client[] {
    return (raw || []).filter(c => c && (c as any).companyName && (c as any).companyName.trim()).map(c => {
      const r = c as any
      return {
        id: r.id || '',
        companyId: r.companyId || '',
        companyName: r.companyName || '',
        companyTradeName: r.companyTradeName || r.companyName || '',
        cnpj: r.cnpj || '',
        segment: r.segment || '',
        city: r.city || '',
        state: r.state || '',
        services: Array.isArray(r.services) ? r.services : [],
        contractType: r.contractType === 'renewal' ? 'renewal' as const : 'first' as const,
        internalResponsible: r.internalResponsible || '',
        status: ['active', 'suspended', 'churned'].includes(r.status) ? r.status : 'active' as ClientStatus,
        startDate: r.startDate || '',
        endDate: r.endDate || '',
        monthlyValue: Number(r.monthlyValue) || 0,
        totalValue: Number(r.totalValue) || 0,
        notes: r.notes || '',
        createdAt: r.createdAt || new Date().toISOString(),
      }
    })
  }

  // ---- Load from Supabase via API (fonte oficial), fallback localStorage ----
  useEffect(() => {
    if (typeof window === 'undefined' || loadedRef.current) return
    loadedRef.current = true

    const get = <T,>(key: string, fallback: T): T => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : fallback
      } catch { return fallback }
    }

    // Log helper temporário
    const logLoad = (source: string, count: number, ids: string[]) => {
      console.log(`[CLIENTS LOAD] origem: ${source} | qtd: ${count} | ids: [${ids.slice(0, 5).join(', ')}${ids.length > 5 ? '...' : ''}]`)
    }

    const loadFromLocal = () => {
      const raw = get<unknown[]>('clients_data', [])
      const clean = sanitizeClients(raw)
      setClients(clean)
      if (clean.length !== raw.length) localStorage.setItem('clients_data', JSON.stringify(clean))
      setContacts(get('clients_contacts', []))
      setInteractions(get('clients_interactions', []))
      setDocuments(get('clients_documents', []))
      setFeedbacks(get('clients_feedbacks', []))
      logLoad('localStorage', clean.length, clean.map(c => c.id))
    }

    // Carrega localStorage como fallback visual inicial
    loadFromLocal()

    // API Supabase — Só sobrescreve se localStorage estiver vazio (localStorage SEMPRE vence)
    fetch('/api/sync/clients')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data) {
          const d = res.data
          const raw = d.clients || []
          const clean = sanitizeClients(raw)
          if (get('clients_data', []).length === 0 && Array.isArray(clean)) setClients(clean)
          if (get('clients_contacts', []).length === 0 && Array.isArray(d.contacts)) setContacts(d.contacts as ClientContact[])
          if (get('clients_interactions', []).length === 0 && Array.isArray(d.interactions)) setInteractions(d.interactions as ClientInteraction[])
          if (get('clients_documents', []).length === 0 && Array.isArray(d.documents)) setDocuments(d.documents as ClientDocument[])
          if (get('clients_feedbacks', []).length === 0 && Array.isArray(d.feedbacks)) setFeedbacks(d.feedbacks as ClientFeedback[])
          logLoad('Supabase client_list', clean.length, clean.map(c => c.id))
        } else {
          logLoad('localStorage (API vazio)', clients.length, clients.map(c => c.id))
        }
      })
      .catch((err) => {
        console.error('[ClientsContext] API load error:', err)
        logLoad('localStorage (API erro)', clients.length, clients.map(c => c.id))
      })

    // Limpeza de chaves obsoletas (mock/seed)
    const STALE_KEYS = [
      'clients_seed', 'clientes_mock', 'crm_mock', 'training_mock',
      'financial_mock', 'admin_mock', 'mentoring_mock', 'documents_mock',
      'projects_mock', 'portal_mock', 'assessoria_mock',
    ]
    for (const key of STALE_KEYS) {
      try { localStorage.removeItem(key) } catch {}
    }

    // Helper console para limpeza manual de dados de clientes
    console.log('[CLIENTS] Para limpar cache local de clientes, execute no console:')
    console.log('  localStorage.removeItem("clients_data")')
    console.log('  localStorage.removeItem("clients_contacts")')
    console.log('  localStorage.removeItem("clients_interactions")')
    console.log('  localStorage.removeItem("clients_documents")')
    console.log('  localStorage.removeItem("clients_feedbacks")')
    ;(window as any).__clearClientsCache = () => {
      try {
        localStorage.removeItem('clients_data')
        localStorage.removeItem('clients_contacts')
        localStorage.removeItem('clients_interactions')
        localStorage.removeItem('clients_documents')
        localStorage.removeItem('clients_feedbacks')
        console.log('[CLIENTS] Cache limpo. Recarregue a pagina.')
      } catch (e) { console.error('[CLIENTS] Erro ao limpar cache:', e) }
    }
    console.log('[CLIENTS] Ou execute: __clearClientsCache()')
  }, [])

  // ---- Sync to Supabase + cache to localStorage on changes ----
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasData = clients.length > 0 || contacts.length > 0 || interactions.length > 0 || documents.length > 0 || feedbacks.length > 0
    if (!hasData) return
    const timer = setTimeout(() => {
      const payload = { clients, contacts, interactions, documents, feedbacks }
      fetch('/api/sync/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merged: payload }),
      }).catch(err => console.error('ClientsContext sync error:', err))
      localStorage.setItem('clients_data', JSON.stringify(clients))
      localStorage.setItem('clients_contacts', JSON.stringify(contacts))
      localStorage.setItem('clients_interactions', JSON.stringify(interactions))
      localStorage.setItem('clients_documents', JSON.stringify(documents))
      localStorage.setItem('clients_feedbacks', JSON.stringify(feedbacks))
    }, 500)
    return () => clearTimeout(timer)
  }, [clients, contacts, interactions, documents, feedbacks])

  const generateId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
    return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
  }

  const addClient = (c: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = { ...c, id: generateId(), createdAt: new Date().toISOString() }
    setClients(prev => {
      const next = [newClient, ...prev]
      try { localStorage.setItem('clients_data', JSON.stringify(next)) } catch {}
      return next
    })
    fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'client', ...c }),
    }).then(r => {
      if (!r.ok) console.error('[CLIENTS] addClient API error:', r.status)
    }).catch(err => console.error('[CLIENTS] addClient fetch error:', err))
    return newClient
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    setClients(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      try { localStorage.setItem('clients_data', JSON.stringify(next)) } catch {}
      return next
    })
    fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'client', id, ...updates }),
    }).catch(err => console.error('[CLIENTS] updateClient error:', err))
  }

  const deleteClient = async (id: string): Promise<void> => {
    // Otimista: remove imediatamente do state + localStorage
    setClients(prev => {
      const next = prev.filter(c => c.id !== id)
      try { localStorage.setItem('clients_data', JSON.stringify(next)) } catch {}
      return next
    })
    console.log('[CLIENTS] deleteClient (otimista) OK:', id)

    // Chama API para persistir soft-delete no Supabase
    const res = await fetch('/api/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      console.error('[CLIENTS] deleteClient API error:', json.error || res.status)
    } else {
      console.log('[CLIENTS] deleteClient Supabase OK:', id)
    }
  }

  const hardDeleteClient = async (id: string): Promise<void> => {
    setClients(prev => {
      const next = prev.filter(c => c.id !== id)
      try { localStorage.setItem('clients_data', JSON.stringify(next)) } catch {}
      return next
    })
    console.log('[CLIENTS] hardDeleteClient OK:', id)
  }

  const refreshClients = async () => {
    try {
      const res = await fetch('/api/sync/clients')
      if (!res.ok) return
      const { data } = await res.json()
      if (!data) return
      const clean = sanitizeClients(data.clients || [])
      setClients(clean)
      setContacts((data.contacts || []) as ClientContact[])
      setInteractions((data.interactions || []) as ClientInteraction[])
      setDocuments((data.documents || []) as ClientDocument[])
      setFeedbacks((data.feedbacks || []) as ClientFeedback[])
      localStorage.setItem('clients_data', JSON.stringify(clean))
      if (data.contacts) localStorage.setItem('clients_contacts', JSON.stringify(data.contacts))
      if (data.interactions) localStorage.setItem('clients_interactions', JSON.stringify(data.interactions))
      if (data.documents) localStorage.setItem('clients_documents', JSON.stringify(data.documents))
      if (data.feedbacks) localStorage.setItem('clients_feedbacks', JSON.stringify(data.feedbacks))
      console.log('[CLIENTS] refresh OK:', clean.length, 'clientes')
    } catch { /* ignore */ }
  }

  const restoreClient = async (id: string): Promise<void> => {
    const res = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'restore', id }),
    })
    if (!res.ok) {
      const json = await res.json().catch(() => ({}))
      console.error('[CLIENTS] restoreClient API error:', json.error || res.status)
      throw new Error(json.error || 'Falha ao restaurar cliente')
    }
    // Recarrega do Supabase para trazer o cliente restaurado de volta à lista
    await refreshClients()
    console.log('[CLIENTS] restoreClient OK:', id)
  }

  const addContact = (c: Omit<ClientContact, 'id'>) => {
    const newContact: ClientContact = { ...c, id: generateId() }
    setContacts(prev => {
      const next = [...prev, newContact]
      try { localStorage.setItem('clients_contacts', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const updateContact = (id: string, updates: Partial<ClientContact>) => {
    setContacts(prev => {
      const next = prev.map(c => c.id === id ? { ...c, ...updates } : c)
      try { localStorage.setItem('clients_contacts', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const deleteContact = (id: string) => {
    setContacts(prev => {
      const next = prev.filter(c => c.id !== id)
      try { localStorage.setItem('clients_contacts', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const addInteraction = (i: Omit<ClientInteraction, 'id' | 'date'>) => {
    const newInt: ClientInteraction = { ...i, id: generateId(), date: new Date().toISOString() }
    setInteractions(prev => {
      const next = [newInt, ...prev]
      try { localStorage.setItem('clients_interactions', JSON.stringify(next)) } catch {}
      return next
    })
  }

  const addFeedback = (f: Omit<ClientFeedback, 'id' | 'date'>) => {
    const newFb: ClientFeedback = { ...f, id: generateId(), date: new Date().toISOString() }
    setFeedbacks(prev => {
      const next = [newFb, ...prev]
      try { localStorage.setItem('clients_feedbacks', JSON.stringify(next)) } catch {}
      return next
    })
  }

  return (
    <ClientsContext.Provider value={{
      clients, contacts, interactions, documents, feedbacks,
      addClient, updateClient, deleteClient, hardDeleteClient, restoreClient, refreshClients,
      addContact, updateContact, deleteContact,
      addInteraction, addFeedback
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
