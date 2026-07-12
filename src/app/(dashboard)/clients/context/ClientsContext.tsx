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

  // ---- Load from Supabase first, fallback localStorage ----
  useEffect(() => {
    if (typeof window === 'undefined' || loadedRef.current) return
    loadedRef.current = true

    const get = <T,>(key: string, fallback: T): T => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : fallback
      } catch { return fallback }
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
    }

    loadFromLocal()

    fetch('/api/sync/clients')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data) {
          const d = res.data
          const raw = d.clients || []
          const clean = sanitizeClients(raw)
          const localEmpty = (key: string) => get(key, []).length === 0
          if (localEmpty('clients_data') && Array.isArray(clean) && clean.length > 0) setClients(clean)
          if (localEmpty('clients_contacts') && Array.isArray(d.contacts) && d.contacts.length > 0) setContacts(d.contacts as ClientContact[])
          if (localEmpty('clients_interactions') && Array.isArray(d.interactions) && d.interactions.length > 0) setInteractions(d.interactions as ClientInteraction[])
          if (localEmpty('clients_documents') && Array.isArray(d.documents) && d.documents.length > 0) setDocuments(d.documents as ClientDocument[])
          if (localEmpty('clients_feedbacks') && Array.isArray(d.feedbacks) && d.feedbacks.length > 0) setFeedbacks(d.feedbacks as ClientFeedback[])
          if (Array.isArray(clean) && clean.length > 0) localStorage.setItem('clients_data', JSON.stringify(clean))
          if (Array.isArray(d.contacts) && d.contacts.length > 0) localStorage.setItem('clients_contacts', JSON.stringify(d.contacts))
          if (Array.isArray(d.interactions) && d.interactions.length > 0) localStorage.setItem('clients_interactions', JSON.stringify(d.interactions))
          if (Array.isArray(d.documents) && d.documents.length > 0) localStorage.setItem('clients_documents', JSON.stringify(d.documents))
          if (Array.isArray(d.feedbacks) && d.feedbacks.length > 0) localStorage.setItem('clients_feedbacks', JSON.stringify(d.feedbacks))
        }
      })
      .catch(() => {})

    const STALE_KEYS = [
      'clients_seed', 'clientes_mock', 'crm_mock', 'training_mock',
      'financial_mock', 'admin_mock', 'mentoring_mock', 'documents_mock',
      'projects_mock', 'portal_mock', 'assessoria_mock',
    ]
    for (const key of STALE_KEYS) {
      try { localStorage.removeItem(key) } catch {}
    }
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

  // Backfill: when Clients module mounts, ensure any companies from CRM are also in clients_data
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const crmRaw = localStorage.getItem('crm_companies')
      if (!crmRaw) return
      const crmCompanies = JSON.parse(crmRaw) as Array<{
        name: string; tradeName?: string; cnpj: string; segment?: string
        city?: string; state?: string; respPrincipal?: string; notes?: string; status: string
        createdAt: string
      }>
      const clientsRaw = localStorage.getItem('clients_data')
      const clientsData = clientsRaw ? JSON.parse(clientsRaw) : []
      const clientNames = new Set(clientsData.map((c: any) => (c.companyName || '').trim().toLowerCase()))
      let changed = false
      for (const comp of crmCompanies) {
        if (!comp || !comp.name || !comp.name.trim()) continue
        const compKey = comp.name.trim().toLowerCase()
        if (!clientNames.has(compKey)) {
          clientsData.unshift({
            id: `cli-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            companyId: `cli-comp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            companyName: comp.name,
            companyTradeName: comp.tradeName || comp.name,
            cnpj: comp.cnpj || '',
            segment: comp.segment || '',
            city: comp.city || '',
            state: comp.state || '',
            services: [],
            contractType: 'first',
            internalResponsible: comp.respPrincipal || '',
            status: comp.status === 'active' ? 'active' : 'suspended',
            startDate: '',
            endDate: '',
            monthlyValue: 0,
            totalValue: 0,
            notes: comp.notes || '',
            createdAt: comp.createdAt || new Date().toISOString(),
          })
          clientNames.add(compKey)
          changed = true
        }
      }
      if (changed) {
        localStorage.setItem('clients_data', JSON.stringify(clientsData))
        setClients(clientsData)
      }
    } catch { /* ignore backfill errors */ }
  }, [])

  // Listen for cross-sync from CRM module
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handler = () => {
      try {
        const stored = localStorage.getItem('clients_data')
        if (stored) setClients(JSON.parse(stored))
      } catch { /* ignore */ }
    }
    window.addEventListener('clients:sync-data', handler)
    return () => window.removeEventListener('clients:sync-data', handler)
  }, [])

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

    // Cross-sync to CRM companies
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('crm_companies')
        const crmCompanies = stored ? JSON.parse(stored) : []
        const newCompany = {
          id: generateId(),
          name: newClient.companyName,
          tradeName: newClient.companyTradeName || newClient.companyName,
          cnpj: newClient.cnpj,
          segment: newClient.segment || '',
          employees: 0,
          city: newClient.city || '',
          state: newClient.state || '',
          website: '',
          instagram: '',
          respPrincipal: newClient.internalResponsible || '',
          respRH: '',
          respFinanceiro: '',
          phone: '',
          email: '',
          notes: newClient.notes || '',
          status: 'active' as const,
          createdAt: newClient.createdAt,
        }
        localStorage.setItem('crm_companies', JSON.stringify([newCompany, ...crmCompanies]))
        window.dispatchEvent(new CustomEvent('crm:sync-companies'))
      } catch { /* ignore cross-sync errors */ }
    }
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
    const res = await fetch('/api/clients', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[CLIENTS] deleteClient API error:', json.error || res.status)
      throw new Error(json.error || 'Falha ao excluir cliente')
    }
    setClients(prev => {
      const next = prev.map(c => c.id === id ? { ...c, status: 'churned' as const } : c)
      try { localStorage.setItem('clients_data', JSON.stringify(next)) } catch {}
      return next
    })
    console.log('[CLIENTS] deleteClient OK:', id)
  }

  const hardDeleteClient = async (id: string): Promise<void> => {
    setClients(prev => {
      const next = prev.filter(c => c.id !== id)
      try { localStorage.setItem('clients_data', JSON.stringify(next)) } catch {}
      return next
    })
    console.log('[CLIENTS] hardDeleteClient OK:', id)
  }

  const restoreClient = async (id: string): Promise<void> => {
    const res = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'restore', id }),
    })
    const json = await res.json().catch(() => ({}))
    if (!res.ok) {
      console.error('[CLIENTS] restoreClient API error:', json.error || res.status)
      throw new Error(json.error || 'Falha ao restaurar cliente')
    }
    setClients(prev => {
      const next = prev.map(c => c.id === id ? { ...c, status: 'active' as const } : c)
      try { localStorage.setItem('clients_data', JSON.stringify(next)) } catch {}
      return next
    })
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
      addClient, updateClient, deleteClient, hardDeleteClient, restoreClient,
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
