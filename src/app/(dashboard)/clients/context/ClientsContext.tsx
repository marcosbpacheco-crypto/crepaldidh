'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

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
  deleteClient: (id: string) => void
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

  useEffect(() => {
    if (typeof window === 'undefined') return
    const get = <T,>(key: string, fallback: T): T => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : fallback
      } catch { return fallback }
    }
    setClients(get('clients_data', INITIAL_CLIENTS))
    setContacts(get('clients_contacts', INITIAL_CONTACTS))
    setInteractions(get('clients_interactions', INITIAL_INTERACTIONS))
    setDocuments(get('clients_documents', INITIAL_DOCUMENTS))
    setFeedbacks(get('clients_feedbacks', INITIAL_FEEDBACKS))
  }, [])

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
      const clientNames = new Set(clientsData.map((c: any) => c.companyName))
      let changed = false
      for (const comp of crmCompanies) {
        if (!clientNames.has(comp.name)) {
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
          clientNames.add(comp.name)
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

  const sync = (key: string, value: any) => {
    if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(value))
  }

  const syncClients = (v: Client[]) => { setClients(v); sync('clients_data', v) }
  const syncContacts = (v: ClientContact[]) => { setContacts(v); sync('clients_contacts', v) }
  const syncInteractions = (v: ClientInteraction[]) => { setInteractions(v); sync('clients_interactions', v) }
  const syncDocuments = (v: ClientDocument[]) => { setDocuments(v); sync('clients_documents', v) }
  const syncFeedbacks = (v: ClientFeedback[]) => { setFeedbacks(v); sync('clients_feedbacks', v) }

  const addClient = (c: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = { ...c, id: `cli-${Date.now()}`, createdAt: new Date().toISOString() }
    syncClients([newClient, ...clients])

    // Cross-sync to CRM companies so it appears in Dashboard, Projects, and CRM
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('crm_companies')
        const crmCompanies = stored ? JSON.parse(stored) : []
        const newCompany = {
          id: `comp-${Date.now()}`,
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
    syncClients(clients.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteClient = (id: string) => {
    syncClients(clients.map(c => c.id === id ? { ...c, status: 'churned' } : c))
  }

  const addContact = (c: Omit<ClientContact, 'id'>) => {
    const newContact: ClientContact = { ...c, id: `cc-${Date.now()}` }
    syncContacts([...contacts, newContact])
  }

  const updateContact = (id: string, updates: Partial<ClientContact>) => {
    syncContacts(contacts.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteContact = (id: string) => {
    syncContacts(contacts.filter(c => c.id !== id))
  }

  const addInteraction = (i: Omit<ClientInteraction, 'id' | 'date'>) => {
    const newInt: ClientInteraction = { ...i, id: `ci-${Date.now()}`, date: new Date().toISOString() }
    syncInteractions([newInt, ...interactions])
  }

  const addFeedback = (f: Omit<ClientFeedback, 'id' | 'date'>) => {
    const newFb: ClientFeedback = { ...f, id: `cf-${Date.now()}`, date: new Date().toISOString() }
    syncFeedbacks([newFb, ...feedbacks])
  }

  return (
    <ClientsContext.Provider value={{
      clients, contacts, interactions, documents, feedbacks,
      addClient, updateClient, deleteClient,
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
