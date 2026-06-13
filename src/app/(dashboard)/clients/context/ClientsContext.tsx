'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// ==========================================
// 1. INTERFACES & TYPES
// ==========================================

export type ClientStatus = 'active' | 'suspended' | 'churned'
export type InteractionType = 'call' | 'meeting' | 'whatsapp' | 'email' | 'visit' | 'support'

export interface Client {
  id: string
  companyId: string
  companyName: string
  companyTradeName: string
  cnpj: string
  segment: string
  city: string
  state: string
  services: string[]
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

const INITIAL_CLIENTS: Client[] = [
  {
    id: 'cli-1',
    companyId: 'cli-comp-1',
    companyName: 'Petrobras Distribuidora S.A.',
    companyTradeName: 'BR Distribuidora',
    cnpj: '34.270.868/0001-98',
    segment: 'Energia / Combustíveis',
    city: 'Rio de Janeiro',
    state: 'RJ',
    services: ['Diagnóstico Psicossocial', 'NR01', 'Treinamentos CIPA'],
    internalResponsible: 'Bruno Crepaldi',
    status: 'active',
    startDate: '2026-01-15',
    endDate: '2026-12-15',
    monthlyValue: 18500,
    totalValue: 222000,
    notes: 'Cliente estratégico. Contrato anual com renovações trimestrais.',
    createdAt: '2026-01-10T10:00:00Z'
  },
  {
    id: 'cli-2',
    companyId: 'cli-comp-2',
    companyName: 'Vale S.A.',
    companyTradeName: 'Vale',
    cnpj: '33.592.510/0001-54',
    segment: 'Mineração',
    city: 'Belo Horizonte',
    state: 'MG',
    services: ['Mentorias Executivas', 'PDI'],
    internalResponsible: 'Ana Beatriz',
    status: 'active',
    startDate: '2026-04-01',
    endDate: '2026-10-01',
    monthlyValue: 10667,
    totalValue: 64000,
    notes: 'Mentoria para 8 diretores regionais. Expectativa de renovação.',
    createdAt: '2026-03-20T14:00:00Z'
  },
  {
    id: 'cli-3',
    companyId: 'cli-comp-3',
    companyName: 'Itaú Unibanco S.A.',
    companyTradeName: 'Banco Itaú',
    cnpj: '60.701.190/0001-04',
    segment: 'Financeiro',
    city: 'São Paulo',
    state: 'SP',
    services: ['Desenvolvimento de Lideranças'],
    internalResponsible: 'Carlos Eduardo',
    status: 'active',
    startDate: '2026-05-01',
    endDate: '2026-11-01',
    monthlyValue: 14167,
    totalValue: 85000,
    notes: 'Workshops de liderança para diretores de agências.',
    createdAt: '2026-04-05T09:00:00Z'
  },
  {
    id: 'cli-4',
    companyId: 'cli-comp-4',
    companyName: 'Metalúrgica Gerdau S.A.',
    companyTradeName: 'Gerdau',
    cnpj: '01.234.567/0001-89',
    segment: 'Indústria / Metalurgia',
    city: 'Porto Alegre',
    state: 'RS',
    services: ['Palestras', 'SIPAT'],
    internalResponsible: '',
    status: 'suspended',
    startDate: '2025-03-01',
    endDate: '2025-12-01',
    monthlyValue: 4000,
    totalValue: 36000,
    notes: 'Contrato suspenso. Tentando reativação com novo diagnóstico.',
    createdAt: '2025-02-15T11:00:00Z'
  },
  {
    id: 'cli-5',
    companyId: 'cli-comp-5',
    companyName: 'Ambev S.A.',
    companyTradeName: 'Ambev',
    cnpj: '07.526.557/0001-00',
    segment: 'Bebidas',
    city: 'São Paulo',
    state: 'SP',
    services: ['NR01', 'Diagnóstico Psicossocial', 'Treinamentos'],
    internalResponsible: 'Bruno Crepaldi',
    status: 'active',
    startDate: '2026-02-01',
    endDate: '2027-01-31',
    monthlyValue: 22000,
    totalValue: 264000,
    notes: 'Maior contrato ativo. Diagnóstico nacional em 12 unidades.',
    createdAt: '2026-01-25T08:00:00Z'
  }
]

const INITIAL_CONTACTS: ClientContact[] = [
  { id: 'cc-1', clientId: 'cli-1', name: 'Carlos Silva', role: 'Gerente HSE', phone: '(21) 98765-4321', email: 'carlos.silva@br.com.br', isPrimary: true },
  { id: 'cc-2', clientId: 'cli-1', name: 'Mariana Souza', role: 'Coordenadora DHO', phone: '(21) 99888-7766', email: 'mariana.souza@br.com.br', isPrimary: false },
  { id: 'cc-3', clientId: 'cli-2', name: 'Roberto Santos', role: 'Diretor RH', phone: '(31) 97766-5544', email: 'roberto.santos@vale.com', isPrimary: true },
  { id: 'cc-4', clientId: 'cli-3', name: 'Patrícia Lima', role: 'Coordenadora DHO', phone: '(11) 96655-4433', email: 'patricia.lima@itau.com.br', isPrimary: true },
  { id: 'cc-5', clientId: 'cli-5', name: 'Fernando Oliveira', role: 'Gerente DHO', phone: '(11) 95544-3322', email: 'fernando.oliveira@ambev.com.br', isPrimary: true },
  { id: 'cc-6', clientId: 'cli-4', name: 'Ricardo Albuquerque', role: 'HSE', phone: '(51) 93322-1100', email: 'ricardo.albuquerque@gerdau.com.br', isPrimary: true }
]

const INITIAL_INTERACTIONS: ClientInteraction[] = [
  { id: 'ci-1', clientId: 'cli-1', type: 'meeting', title: 'Kickoff Diagnóstico Psicossocial', description: 'Reunião de alinhamento para início do diagnóstico nas bases operacionais.', date: '2026-02-01T09:00:00Z', author: 'Bruno Crepaldi' },
  { id: 'ci-2', clientId: 'cli-1', type: 'whatsapp', title: 'Acompanhamento semanal', description: 'Check-in sobre o cronograma de entrevistas.', date: '2026-03-10T14:00:00Z', author: 'Ana Beatriz' },
  { id: 'ci-3', clientId: 'cli-2', type: 'meeting', title: 'Início das Mentorias', description: 'Primeira sessão de mentoria com os 8 diretores.', date: '2026-04-05T10:00:00Z', author: 'Bruno Crepaldi' },
  { id: 'ci-4', clientId: 'cli-3', type: 'call', title: 'Follow-up proposta', description: 'Ligação para alinhar expectativas do workshop.', date: '2026-04-20T11:00:00Z', author: 'Carlos Eduardo' },
  { id: 'ci-5', clientId: 'cli-5', type: 'meeting', title: 'Reunião de Diagnóstico Nacional', description: 'Planejamento da implementação nacional do NR01.', date: '2026-03-01T09:00:00Z', author: 'Bruno Crepaldi' },
  { id: 'ci-6', clientId: 'cli-5', type: 'email', title: 'Envio de cronograma', description: 'Cronograma revisado para as 12 unidades.', date: '2026-03-15T16:00:00Z', author: 'Ana Beatriz' },
  { id: 'ci-7', clientId: 'cli-4', type: 'call', title: 'Tentativa de reativação', description: 'Conversa com Ricardo sobre possível retomada do contrato.', date: '2025-11-20T15:00:00Z', author: 'Carlos Eduardo' }
]

const INITIAL_DOCUMENTS: ClientDocument[] = [
  { id: 'cd-1', clientId: 'cli-1', name: 'Contrato_BR_2026.pdf', url: '#', uploadedAt: '2026-01-10T12:00:00Z' },
  { id: 'cd-2', clientId: 'cli-2', name: 'contrato_mentoria_assinado.pdf', url: '#', uploadedAt: '2026-03-25T14:00:00Z' },
  { id: 'cd-3', clientId: 'cli-3', name: 'Proposta_Itau_Lideranca.pdf', url: '#', uploadedAt: '2026-04-05T09:00:00Z' },
  { id: 'cd-4', clientId: 'cli-5', name: 'Cronograma_NR01_Ambev.xlsx', url: '#', uploadedAt: '2026-03-15T16:00:00Z' }
]

const INITIAL_FEEDBACKS: ClientFeedback[] = [
  { id: 'cf-1', clientId: 'cli-1', score: 9, comment: 'Excelente trabalho da equipe Crepaldi. Diagnóstico superou expectativas.', date: '2026-04-10T10:00:00Z' },
  { id: 'cf-2', clientId: 'cli-2', score: 10, comment: 'Mentoria transformadora para nossos diretores.', date: '2026-06-01T14:00:00Z' },
  { id: 'cf-3', clientId: 'cli-5', score: 8, comment: 'Boa organização e profissionais capacitados.', date: '2026-05-20T11:00:00Z' }
]

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
    return newClient
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    syncClients(clients.map(c => c.id === id ? { ...c, ...updates } : c))
  }

  const deleteClient = (id: string) => {
    syncClients(clients.filter(c => c.id !== id))
    syncContacts(contacts.filter(c => c.clientId !== id))
    syncInteractions(interactions.filter(i => i.clientId !== id))
    syncDocuments(documents.filter(d => d.clientId !== id))
    syncFeedbacks(feedbacks.filter(f => f.clientId !== id))
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
