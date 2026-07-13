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

export interface ClientFeedbackRanking {
  id: string
  clientId: string
  score: number
  comment: string
  date: string
}
