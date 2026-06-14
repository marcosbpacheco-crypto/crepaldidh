'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

// ==========================================
// 1. INTERFACES & TYPES
// ==========================================

export interface Contact {
  id: string
  companyId: string
  name: string
  role: string
  phone: string
  whatsapp: string
  email: string
  birthday: string
  influence: 'high' | 'medium' | 'low'
  notes: string
}

export interface Company {
  id: string
  name: string // Razão Social
  tradeName: string // Nome Fantasia
  cnpj: string
  segment: string
  employees: number
  city: string
  state: string
  website: string
  instagram: string
  respPrincipal: string
  respRH: string
  respFinanceiro: string
  phone: string
  email: string
  notes: string
  status: 'active' | 'inactive'
  createdAt: string
}

export interface Deal {
  id: string
  companyId: string
  title: string
  service: string
  value: number
  stage: string // Estágios do Funil
  sellerId: string
  notes: string
  dueDate: string // Data do próximo follow-up
  createdAt: string
  lostReason?: string
}

export interface Activity {
  id: string
  companyId: string
  dealId?: string
  type: 'call' | 'meeting' | 'whatsapp' | 'email' | 'visit' | 'proposal' | 'contract' | 'comment'
  title: string
  description: string
  date: string
  author: string
}

export interface Task {
  id: string
  companyId: string
  dealId?: string
  title: string
  dueDate: string
  status: 'pending' | 'completed'
  priority: 'high' | 'medium' | 'low'
}

export interface Proposal {
  id: string
  companyId: string
  service: string
  value: number
  duration: string // Vigência
  status: 'draft' | 'sent' | 'negotiation' | 'approved' | 'rejected'
  createdAt: string
  notes?: string
}

export interface Contract {
  id: string
  companyId: string
  proposalId?: string
  title: string
  value: number
  startDate: string
  endDate: string
  autoRenew: boolean
  status: 'draft' | 'active' | 'expired' | 'terminated'
  attachments: string[]
  createdAt: string
}

export interface Seller {
  id: string
  name: string
  role: string
  avatar: string
}

export type UserRole = 'admin' | 'commercial' | 'consultant' | 'finance' | 'viewer'

export interface Client {
  id: string
  companyId: string
  contractId: string
  status: 'active' | 'churned'
  createdAt: string
}

export interface Diagnostic { id: string; companyId: string; title: string; createdAt: string }
export interface Unit { id: string; companyId: string; name: string }
export interface Sector { id: string; unitId: string; name: string }
export interface Risk { id: string; sectorId: string; name: string; level: 'low' | 'medium' | 'high' }
export interface Evidence { id: string; riskId: string; fileUrl: string; description: string }
export interface ActionPlan { id: string; riskId: string; task: string; deadline: string; status: 'pending' | 'completed' }
export interface MonitoringEntry { id: string; riskId: string; observation: string; date: string }
export interface Report { id: string; companyId: string; title: string; generatedAt: string }
export interface Interview { id: string; companyId: string; interviewee: string; summary: string; date: string }

interface CrmContextType {
  // Data
  companies: Company[];
  contacts: Contact[];
  deals: Deal[];
  activities: Activity[];
  tasks: Task[];
  proposals: Proposal[];
  contracts: Contract[];
  clients: Client[];
  sellers: Seller[];
  services: string[];
  pipelineStages: string[];
  currentRole: UserRole;
  diagnostics: Diagnostic[];
  units: Unit[];
  sectors: Sector[];
  risks: Risk[];
  evidences: Evidence[];
  actionPlans: ActionPlan[];
  monitoring: MonitoringEntry[];
  reports: Report[];
  interviews: Interview[];

  // Mutators
  setCurrentRole: (role: UserRole) => void;
  addCompany: (company: Omit<Company, 'id' | 'createdAt'>) => Company;
  updateCompany: (id: string, updates: Partial<Company>) => void;
  deleteCompany: (id: string) => void;
  addContact: (contact: Omit<Contact, 'id'>) => Contact;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  addDeal: (deal: Omit<Deal, 'id' | 'createdAt'>) => Deal;
  updateDeal: (id: string, updates: Partial<Deal>) => void;
  moveDeal: (dealId: string, targetStage: string) => void;
  deleteDeal: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'date'>) => Activity;
  addTask: (task: Omit<Task, 'id' | 'status'>) => Task;
  toggleTaskStatus: (id: string) => void;
  deleteTask: (id: string) => void;
  addProposal: (proposal: Omit<Proposal, 'id' | 'createdAt'>) => Proposal;
  updateProposalStatus: (id: string, status: Proposal['status']) => void;
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => Contract;
  updateContractStatus: (id: string, status: Contract['status']) => void;
  addClient: (client: Omit<Client, 'id' | 'createdAt'>) => Client;
  updateClient: (id: string, updates: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  getClientByCompanyId: (companyId: string) => Client | undefined;
  convertContractToClient: (contractId: string) => void;
  addDiagnostic: (diag: Omit<Diagnostic, 'id' | 'createdAt'>) => Diagnostic;
  updateDiagnostic: (id: string, updates: Partial<Diagnostic>) => void;
  deleteDiagnostic: (id: string) => void;
}

// ==========================================
// 2. CONSTANTS
// ==========================================

const SERVICES = [
  'Diagnóstico Psicossocial',
  'NR01',
  'Palestras',
  'Treinamentos',
  'SIPAT',
  'Mentorias',
  'Desenvolvimento de Lideranças',
  'Cultura Organizacional',
  'PDI',
  'Consultoria Estratégica'
]

const PIPELINE_STAGES = [
  'Lead novo',
  'Primeiro contato',
  'Reunião agendada',
  'Diagnóstico realizado',
  'Proposta enviada',
  'Negociação',
  'Contrato aprovado',
  'Implantação',
  'Cliente ativo',
  'Renovação',
  'Cliente perdido'
]

const SELLERS: Seller[] = [
  { id: 'seller-1', name: 'Bruno Crepaldi', role: 'Diretor Comercial', avatar: 'BC' },
  { id: 'seller-2', name: 'Ana Beatriz', role: 'Gerente Comercial', avatar: 'AB' },
  { id: 'seller-3', name: 'Carlos Eduardo', role: 'Consultor de Negócios', avatar: 'CE' }
]

// ==========================================
// 3. SEED DATA (INITIAL VALUES)
// ==========================================

const INITIAL_COMPANIES: Company[] = [
  {
    id: 'comp-1',
    name: 'Petrobras Distribuidora S.A.',
    tradeName: 'BR Distribuidora',
    cnpj: '34.270.868/0001-98',
    segment: 'Energia / Combustíveis',
    employees: 1500,
    city: 'Rio de Janeiro',
    state: 'RJ',
    website: 'www.br.com.br',
    instagram: '@brdistribuidora',
    respPrincipal: 'Carlos Silva (Gerente HSE)',
    respRH: 'Mariana Souza (Coordenadora DHO)',
    respFinanceiro: 'Cláudio Santos (Financeiro)',
    phone: '(21) 3212-4000',
    email: 'contato@br.com.br',
    notes: 'Cliente de grande porte. Foco em conformidade com a NR01 e Treinamento de CIPA.',
    status: 'active',
    createdAt: '2026-02-15T10:00:00Z'
  },
  {
    id: 'comp-2',
    name: 'Vale S.A.',
    tradeName: 'Vale',
    cnpj: '33.592.510/0001-54',
    segment: 'Mineração',
    employees: 8500,
    city: 'Belo Horizonte',
    state: 'MG',
    website: 'www.vale.com',
    instagram: '@valenobrasil',
    respPrincipal: 'Roberto Santos (Diretor RH)',
    respRH: 'Ana Paula (Gestão de Clima)',
    respFinanceiro: 'Daniela Lima',
    phone: '(31) 3300-1000',
    email: 'suprimentos@vale.com',
    notes: 'Interessados em Diagnóstico Psicossocial global e Mentorias para a diretoria operacional.',
    status: 'active',
    createdAt: '2026-03-10T14:30:00Z'
  },
  {
    id: 'comp-3',
    name: 'Itaú Unibanco S.A.',
    tradeName: 'Banco Itaú',
    cnpj: '60.701.190/0001-04',
    segment: 'Financeiro',
    employees: 12000,
    city: 'São Paulo',
    state: 'SP',
    website: 'www.itau.com.br',
    instagram: '@itau',
    respPrincipal: 'Patrícia Lima (DHO)',
    respRH: 'Ricardo Gomes (Gerente DHO)',
    respFinanceiro: 'Felipe Melo',
    phone: '(11) 5019-1000',
    email: 'corporativo@itau.com.br',
    notes: 'Ciclo de fechamento longo. Requer aprovação de múltiplas diretorias. Foco em PDI e Liderança.',
    status: 'active',
    createdAt: '2026-04-01T09:15:00Z'
  },
  {
    id: 'comp-4',
    name: 'Metalúrgica Gerdau S.A.',
    tradeName: 'Gerdau',
    cnpj: '01.234.567/0001-89',
    segment: 'Indústria / Metalurgia',
    employees: 4300,
    city: 'Porto Alegre',
    state: 'RS',
    website: 'www.gerdau.com.br',
    instagram: '@gerdau',
    respPrincipal: 'Ricardo Albuquerque (HSE)',
    respRH: 'Tânia Cruz (RH)',
    respFinanceiro: 'Eduardo Silveira',
    phone: '(51) 3323-2000',
    email: 'hse@gerdau.com.br',
    notes: 'Contrato antigo finalizado em 2025. Tentando reativar com novo Diagnóstico de Clima.',
    status: 'inactive',
    createdAt: '2025-05-20T11:00:00Z'
  }
]

const INITIAL_CONTACTS: Contact[] = [
  {
    id: 'cont-1',
    companyId: 'comp-1',
    name: 'Carlos Silva',
    role: 'Gerente de HSE',
    phone: '(21) 98765-4321',
    whatsapp: '(21) 98765-4321',
    email: 'carlos.silva@br.com.br',
    birthday: '1978-08-14',
    influence: 'high',
    notes: 'Decisor técnico. Valoriza dados estatísticos e conformidade legal estrita.'
  },
  {
    id: 'cont-2',
    companyId: 'comp-1',
    name: 'Mariana Souza',
    role: 'Coordenadora de DHO',
    phone: '(21) 99888-7766',
    whatsapp: '(21) 99888-7766',
    email: 'mariana.souza@br.com.br',
    birthday: '1985-04-22',
    influence: 'medium',
    notes: 'Grande defensora da Crepaldi internamente. Influencia no onboarding e treinamentos.'
  },
  {
    id: 'cont-3',
    companyId: 'comp-2',
    name: 'Roberto Santos',
    role: 'Diretor de RH Corporativo',
    phone: '(31) 97766-5544',
    whatsapp: '(31) 97766-5544',
    email: 'roberto.santos@vale.com',
    birthday: '1970-11-03',
    influence: 'high',
    notes: 'Decisor final para orçamentos acima de R$ 100 mil.'
  },
  {
    id: 'cont-4',
    companyId: 'comp-3',
    name: 'Patrícia Lima',
    role: 'Coordenadora de Desenvolvimento Organizacional',
    phone: '(11) 96655-4433',
    whatsapp: '(11) 96655-4433',
    email: 'patricia.lima@itau.com.br',
    birthday: '1990-01-30',
    influence: 'medium',
    notes: 'Responsável pelo mapeamento inicial. Muito técnica.'
  }
]

const INITIAL_DEALS: Deal[] = [
  {
    id: 'deal-1',
    companyId: 'comp-1',
    title: 'Diagnóstico Psicossocial BR',
    service: 'Diagnóstico Psicossocial',
    value: 48000,
    stage: 'Lead novo',
    sellerId: 'seller-2',
    notes: 'Foco em mapear riscos psicossociais em 3 bases operacionais da empresa.',
    dueDate: '2026-06-05',
    createdAt: '2026-05-10T10:00:00Z'
  },
  {
    id: 'deal-2',
    companyId: 'comp-2',
    title: 'Implantação NR01 & PGR - Vale',
    service: 'NR01',
    value: 125000,
    stage: 'Proposta enviada',
    sellerId: 'seller-1',
    notes: 'Apresentado PGR psicossocial corporativo. Aguardando retorno da diretoria.',
    dueDate: '2026-06-02',
    createdAt: '2026-04-18T14:00:00Z'
  },
  {
    id: 'deal-3',
    companyId: 'comp-3',
    title: 'Desenvolvimento de Lideranças - Itaú',
    service: 'Desenvolvimento de Lideranças',
    value: 85000,
    stage: 'Negociação',
    sellerId: 'seller-3',
    notes: 'Enviada revisão de escopo comercial para focar em diretores de agências.',
    dueDate: '2026-05-31',
    createdAt: '2026-04-05T09:00:00Z'
  },
  {
    id: 'deal-4',
    companyId: 'comp-1',
    title: 'Treinamentos de CIPA & SIPAT 2026',
    service: 'SIPAT',
    value: 28000,
    stage: 'Contrato aprovado',
    sellerId: 'seller-2',
    notes: 'Aprovado orçamentariamente. Contrato gerado aguardando assinaturas jurídicas.',
    dueDate: '2026-06-10',
    createdAt: '2026-05-02T11:30:00Z'
  },
  {
    id: 'deal-5',
    companyId: 'comp-2',
    title: 'Mentoria Executiva - Vale',
    service: 'Mentorias',
    value: 64000,
    stage: 'Cliente ativo',
    sellerId: 'seller-1',
    notes: 'Mentoria iniciada para 8 diretores regionais da Vale. Duração de 6 meses.',
    dueDate: '2026-06-15',
    createdAt: '2026-03-20T16:00:00Z'
  },
  {
    id: 'deal-6',
    companyId: 'comp-4',
    title: 'Palestra de Liderança Gerdau',
    service: 'Palestras',
    value: 12000,
    stage: 'Cliente perdido',
    sellerId: 'seller-3',
    notes: 'Perdido por falta de orçamento no Q1. Cancelaram o evento geral de metas.',
    dueDate: '2026-05-20',
    createdAt: '2026-02-10T10:00:00Z',
    lostReason: 'Sem orçamento'
  }
]

const INITIAL_ACTIVITIES: Activity[] = [
  {
    id: 'act-1',
    companyId: 'comp-1',
    dealId: 'deal-1',
    type: 'whatsapp',
    title: 'Contato inicial via WhatsApp',
    description: 'Conversado com Mariana Souza. Ela solicitou apresentação institucional e marcou interesse por Diagnóstico Psicossocial.',
    author: 'Ana Beatriz',
    date: '2026-05-10T10:30:00Z'
  },
  {
    id: 'act-2',
    companyId: 'comp-2',
    dealId: 'deal-2',
    type: 'meeting',
    title: 'Reunião de Diagnóstico de Escopo',
    description: 'Reunião com Roberto Santos e engenharia de saúde da Vale. Mapeados os desafios de riscos mentais na operação e delineada a proposta de PGR.',
    author: 'Bruno Crepaldi',
    date: '2026-04-20T15:00:00Z'
  },
  {
    id: 'act-3',
    companyId: 'comp-2',
    dealId: 'deal-2',
    type: 'proposal',
    title: 'Envio da Proposta Comercial 042/2026',
    description: 'Enviada proposta oficial no valor de R$ 125.000,00 via e-mail e anexada na ficha do negócio.',
    author: 'Bruno Crepaldi',
    date: '2026-04-25T11:00:00Z'
  },
  {
    id: 'act-4',
    companyId: 'comp-3',
    dealId: 'deal-3',
    type: 'call',
    title: 'Ligação de Follow-up Comercial',
    description: 'Conversado com Patrícia Lima. Ela informou que a proposta agradou muito a equipe de DHO e que foi encaminhada para a Diretoria Financeira.',
    author: 'Carlos Eduardo',
    date: '2026-05-25T14:15:00Z'
  },
  {
    id: 'act-5',
    companyId: 'comp-2',
    type: 'comment',
    title: 'Nota Interna - Relacionamento',
    description: 'A Vale está passando por uma auditoria interna, por isso a lentidão nas assinaturas de novos serviços. Contudo, o projeto de Mentoria segue muito elogiado.',
    author: 'Bruno Crepaldi',
    date: '2026-05-28T09:00:00Z'
  }
]

const INITIAL_TASKS: Task[] = [
  {
    id: 'task-1',
    companyId: 'comp-3',
    dealId: 'deal-3',
    title: 'Enviar e-mail formalizando desconto na taxa de material',
    dueDate: '2026-05-31',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 'task-2',
    companyId: 'comp-1',
    dealId: 'deal-1',
    title: 'Agendar primeira reunião técnica de alinhamento',
    dueDate: '2026-06-05',
    status: 'pending',
    priority: 'medium'
  },
  {
    id: 'task-3',
    companyId: 'comp-2',
    dealId: 'deal-2',
    title: 'Telefonar para Roberto Santos para cobrar parecer da diretoria',
    dueDate: '2026-06-02',
    status: 'pending',
    priority: 'high'
  },
  {
    id: 'task-4',
    companyId: 'comp-1',
    dealId: 'deal-4',
    title: 'Revisar minuta de contrato recebida do jurídico BR',
    dueDate: '2026-05-28',
    status: 'completed',
    priority: 'medium'
  }
]

const INITIAL_PROPOSALS: Proposal[] = [
  {
    id: 'prop-1',
    companyId: 'comp-2',
    service: 'NR01',
    value: 125000,
    duration: '12 meses',
    status: 'sent',
    createdAt: '2026-04-25T11:00:00Z',
    notes: 'Proposta completa englobando PGR psicossocial corporativo nacional.'
  },
  {
    id: 'prop-2',
    companyId: 'comp-3',
    service: 'Desenvolvimento de Lideranças',
    value: 85000,
    duration: '6 meses',
    status: 'negotiation',
    createdAt: '2026-04-05T09:00:00Z',
    notes: 'Inclui 12 workshops presenciais e avaliações 360.'
  },
  {
    id: 'prop-3',
    companyId: 'comp-1',
    service: 'SIPAT',
    value: 28000,
    duration: '1 mês',
    status: 'approved',
    createdAt: '2026-05-02T11:30:00Z',
    notes: 'Treinamento intensivo de CIPA + palestras de saúde mental na SIPAT.'
  }
]

const INITIAL_CONTRACTS: Contract[] = [
  {
    id: 'contr-1',
    companyId: 'comp-2',
    proposalId: 'prop-1',
    title: 'Contrato de Mentoria Regional Vale',
    value: 64000,
    startDate: '2026-04-01',
    endDate: '2026-10-01',
    autoRenew: true,
    status: 'active',
    attachments: ['contrato_mentoria_assinado.pdf', 'anexo_escopo_tecnico.pdf'],
    createdAt: '2026-03-25T14:00:00Z'
  }
]

// ==========================================
// 4. CONTEXT PROVIDER IMPLEMENTATION
// ==========================================

const CrmContext = createContext<CrmContextType | undefined>(undefined)

export const CrmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // States
  const [companies, setCompanies] = useState<Company[]>([])
  const [contacts, setContacts] = useState<Contact[]>([])
  const [deals, setDeals] = useState<Deal[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [contracts, setContracts] = useState<Contract[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [diagnostics, setDiagnostics] = useState<Diagnostic[]>([])
  const [units, setUnits] = useState<Unit[]>([])
  const [sectors, setSectors] = useState<Sector[]>([])
  const [risks, setRisks] = useState<Risk[]>([])
  const [evidences, setEvidences] = useState<Evidence[]>([])
  const [actionPlans, setActionPlans] = useState<ActionPlan[]>([])
  const [monitoring, setMonitoring] = useState<MonitoringEntry[]>([])
  const [reports, setReports] = useState<Report[]>([])
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [currentRole, setCurrentRole] = useState<UserRole>('admin')

  // Load from local storage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const getStored = <T,>(key: string, initial: T): T => {
      try {
        const stored = localStorage.getItem(key)
        return stored ? JSON.parse(stored) : initial
      } catch (e) {
        console.error(`Failed to parse localStorage key: ${key}`, e)
        return initial
      }
    }

    setCompanies(getStored('crm_companies', INITIAL_COMPANIES))
    setContacts(getStored('crm_contacts', INITIAL_CONTACTS))
    setDeals(getStored('crm_deals', INITIAL_DEALS))
    setActivities(getStored('crm_activities', INITIAL_ACTIVITIES))
    setTasks(getStored('crm_tasks', INITIAL_TASKS))
    setProposals(getStored('crm_proposals', INITIAL_PROPOSALS))
    setContracts(getStored('crm_contracts', INITIAL_CONTRACTS))
    setClients(getStored('crm_clients', []))
    setDiagnostics(getStored('crm_diagnostics', []))
    setUnits(getStored('crm_units', []))
    setSectors(getStored('crm_sectors', []))
    setRisks(getStored('crm_risks', []))
    setEvidences(getStored('crm_evidences', []))
    setActionPlans(getStored('crm_actionPlans', []))
    setMonitoring(getStored('crm_monitoring', []))
    setReports(getStored('crm_reports', []))
    setInterviews(getStored('crm_interviews', []))
    
    const storedRole = localStorage.getItem('crm_current_role')
    if (storedRole) {
      setCurrentRole(storedRole as UserRole)
    }
  }, [])

  // Sync to local storage
  const syncStorage = (key: string, value: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, JSON.stringify(value))
    }
  }

  // Update helper wrappers
  const updateCompaniesState = (newVal: Company[]) => {
    setCompanies(newVal)
    syncStorage('crm_companies', newVal)
  }
  const updateDiagnosticsState = (newVal: Diagnostic[]) => {
    setDiagnostics(newVal)
    syncStorage('crm_diagnostics', newVal)
  }
  const updateUnitsState = (newVal: Unit[]) => {
    setUnits(newVal)
    syncStorage('crm_units', newVal)
  }
  const updateSectorsState = (newVal: Sector[]) => {
    setSectors(newVal)
    syncStorage('crm_sectors', newVal)
  }
  const updateRisksState = (newVal: Risk[]) => {
    setRisks(newVal)
    syncStorage('crm_risks', newVal)
  }
  const updateEvidencesState = (newVal: Evidence[]) => {
    setEvidences(newVal)
    syncStorage('crm_evidences', newVal)
  }
  const updateActionPlansState = (newVal: ActionPlan[]) => {
    setActionPlans(newVal)
    syncStorage('crm_actionPlans', newVal)
  }
  const updateMonitoringState = (newVal: MonitoringEntry[]) => {
    setMonitoring(newVal)
    syncStorage('crm_monitoring', newVal)
  }
  const updateReportsState = (newVal: Report[]) => {
    setReports(newVal)
    syncStorage('crm_reports', newVal)
  }
  const updateInterviewsState = (newVal: Interview[]) => {
    setInterviews(newVal)
    syncStorage('crm_interviews', newVal)
  }
  const updateContactsState = (newVal: Contact[]) => {
    setContacts(newVal)
    syncStorage('crm_contacts', newVal)
  }

  const updateDealsState = (newVal: Deal[]) => {
    setDeals(newVal)
    syncStorage('crm_deals', newVal)
  }

  const updateActivitiesState = (newVal: Activity[]) => {
    setActivities(newVal)
    syncStorage('crm_activities', newVal)
  }

  const updateTasksState = (newVal: Task[]) => {
    setTasks(newVal)
    syncStorage('crm_tasks', newVal)
  }

  const updateProposalsState = (newVal: Proposal[]) => {
    setProposals(newVal)
    syncStorage('crm_proposals', newVal)
  }

  const updateContractsState = (newVal: Contract[]) => {
    setContracts(newVal)
    syncStorage('crm_contracts', newVal)
  }

  const updateClientsState = (newVal: Client[]) => {
    setClients(newVal)
    syncStorage('crm_clients', newVal)
  }

  const changeRole = (role: UserRole) => {
    setCurrentRole(role)
    if (typeof window !== 'undefined') {
      localStorage.setItem('crm_current_role', role)
    }
  }
  // NR01 mutator placeholders (to be implemented later)
  const addDiagnostic = (diag: Omit<Diagnostic, 'id' | 'createdAt'>) => {
    const newDiag: Diagnostic = { ...diag, id: `diag-${Date.now()}`, createdAt: new Date().toISOString() }
    const updated = [newDiag, ...diagnostics]
    updateDiagnosticsState(updated)
    return newDiag
  }
  const updateDiagnostic = (id: string, updates: Partial<Diagnostic>) => {
    const updated = diagnostics.map(d => d.id === id ? { ...d, ...updates } : d)
    updateDiagnosticsState(updated)
  }
  const deleteDiagnostic = (id: string) => {
    updateDiagnosticsState(diagnostics.filter(d => d.id !== id))
  }
  // Additional NR01 mutators (units, sectors, risks, etc.) can be added similarly.
  // Units
  const addUnit = (unit: Omit<Unit, 'id'>) => {
    const newUnit: Unit = { ...unit, id: `unit-${Date.now()}` };
    const updated = [newUnit, ...units];
    updateUnitsState(updated);
    return newUnit;
  };
  const updateUnit = (id: string, updates: Partial<Unit>) => {
    const updated = units.map(u => (u.id === id ? { ...u, ...updates } : u));
    updateUnitsState(updated);
  };
  const deleteUnit = (id: string) => {
    updateUnitsState(units.filter(u => u.id !== id));
  };

  // Sectors
  const addSector = (sector: Omit<Sector, 'id'>) => {
    const newSector: Sector = { ...sector, id: `sector-${Date.now()}` };
    const updated = [newSector, ...sectors];
    updateSectorsState(updated);
    return newSector;
  };
  const updateSector = (id: string, updates: Partial<Sector>) => {
    const updated = sectors.map(s => (s.id === id ? { ...s, ...updates } : s));
    updateSectorsState(updated);
  };
  const deleteSector = (id: string) => {
    updateSectorsState(sectors.filter(s => s.id !== id));
  };

  // Risks
  const addRisk = (risk: Omit<Risk, 'id'>) => {
    const newRisk: Risk = { ...risk, id: `risk-${Date.now()}` };
    const updated = [newRisk, ...risks];
    updateRisksState(updated);
    return newRisk;
  };
  const updateRisk = (id: string, updates: Partial<Risk>) => {
    const updated = risks.map(r => (r.id === id ? { ...r, ...updates } : r));
    updateRisksState(updated);
  };
  const deleteRisk = (id: string) => {
    updateRisksState(risks.filter(r => r.id !== id));
  };

  // Evidences
  const addEvidence = (evidence: Omit<Evidence, 'id'>) => {
    const newEvidence: Evidence = { ...evidence, id: `evidence-${Date.now()}` };
    const updated = [newEvidence, ...evidences];
    updateEvidencesState(updated);
    return newEvidence;
  };
  const updateEvidence = (id: string, updates: Partial<Evidence>) => {
    const updated = evidences.map(e => (e.id === id ? { ...e, ...updates } : e));
    updateEvidencesState(updated);
  };
  const deleteEvidence = (id: string) => {
    updateEvidencesState(evidences.filter(e => e.id !== id));
  };

  // Action Plans
  const addActionPlan = (plan: Omit<ActionPlan, 'id'>) => {
    const newPlan: ActionPlan = { ...plan, id: `plan-${Date.now()}` };
    const updated = [newPlan, ...actionPlans];
    updateActionPlansState(updated);
    return newPlan;
  };
  const updateActionPlan = (id: string, updates: Partial<ActionPlan>) => {
    const updated = actionPlans.map(p => (p.id === id ? { ...p, ...updates } : p));
    updateActionPlansState(updated);
  };
  const deleteActionPlan = (id: string) => {
    updateActionPlansState(actionPlans.filter(p => p.id !== id));
  };

  // Monitoring
  const addMonitoring = (entry: Omit<MonitoringEntry, 'id'>) => {
    const newEntry: MonitoringEntry = { ...entry, id: `monitor-${Date.now()}` };
    const updated = [newEntry, ...monitoring];
    updateMonitoringState(updated);
    return newEntry;
  };
  const updateMonitoring = (id: string, updates: Partial<MonitoringEntry>) => {
    const updated = monitoring.map(m => (m.id === id ? { ...m, ...updates } : m));
    updateMonitoringState(updated);
  };
  const deleteMonitoring = (id: string) => {
    updateMonitoringState(monitoring.filter(m => m.id !== id));
  };

  // Reports
  const addReport = (report: Omit<Report, 'id'>) => {
    const newReport: Report = { ...report, id: `report-${Date.now()}` };
    const updated = [newReport, ...reports];
    updateReportsState(updated);
    return newReport;
  };
  const updateReport = (id: string, updates: Partial<Report>) => {
    const updated = reports.map(r => (r.id === id ? { ...r, ...updates } : r));
    updateReportsState(updated);
  };
  const deleteReport = (id: string) => {
    updateReportsState(reports.filter(r => r.id !== id));
  };

  // Interviews
  const addInterview = (interview: Omit<Interview, 'id'>) => {
    const newInterview: Interview = { ...interview, id: `interview-${Date.now()}` };
    const updated = [newInterview, ...interviews];
    updateInterviewsState(updated);
    return newInterview;
  };
  const updateInterview = (id: string, updates: Partial<Interview>) => {
    const updated = interviews.map(i => (i.id === id ? { ...i, ...updates } : i));
    updateInterviewsState(updated);
  };
  const deleteInterview = (id: string) => {
    updateInterviewsState(interviews.filter(i => i.id !== id));
  };

  // ==========================================
  // 5. MUTATOR METHODS
  // ==========================================

  // Companies CRUD
  const addCompany = (c: Omit<Company, 'id' | 'createdAt'>) => {
    const newCompany: Company = {
      ...c,
      id: `comp-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    const updated = [newCompany, ...companies]
    updateCompaniesState(updated)

    // Cross-sync to Clients module so it appears there too
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('clients_data')
        const clientsData = stored ? JSON.parse(stored) : []
        const newClient = {
          id: `cli-${Date.now()}`,
          companyId: `cli-comp-${Date.now()}`,
          companyName: newCompany.name,
          companyTradeName: newCompany.tradeName || newCompany.name,
          cnpj: newCompany.cnpj,
          segment: newCompany.segment || '',
          city: newCompany.city || '',
          state: newCompany.state || '',
          services: [],
          contractType: 'first' as const,
          internalResponsible: newCompany.respPrincipal || '',
          status: (newCompany.status === 'active' ? 'active' : 'suspended') as 'active' | 'suspended' | 'churned',
          startDate: new Date().toISOString().split('T')[0],
          endDate: '',
          monthlyValue: 0,
          totalValue: 0,
          notes: newCompany.notes || '',
          createdAt: newCompany.createdAt,
        }
        localStorage.setItem('clients_data', JSON.stringify([newClient, ...clientsData]))
      } catch { /* ignore cross-sync errors */ }
    }

    // Log Activity
    addActivity({
      companyId: newCompany.id,
      type: 'comment',
      title: 'Empresa cadastrada',
      description: `A empresa ${newCompany.name} foi adicionada ao CRM.`,
      author: getRoleUserName(currentRole)
    })

    return newCompany
  }

  const updateCompany = (id: string, updates: Partial<Company>) => {
    const updated = companies.map(c => c.id === id ? { ...c, ...updates } : c)
    updateCompaniesState(updated)
  }

  const deleteCompany = (id: string) => {
    updateCompaniesState(companies.filter(c => c.id !== id))
    updateContactsState(contacts.filter(c => c.companyId !== id))
    updateDealsState(deals.filter(d => d.companyId !== id))
  }

  // Contacts CRUD
  const addContact = (c: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...c,
      id: `cont-${Date.now()}`
    }
    const updated = [...contacts, newContact]
    updateContactsState(updated)

    // Log Activity
    addActivity({
      companyId: c.companyId,
      type: 'comment',
      title: 'Contato adicionado',
      description: `O contato ${newContact.name} (${newContact.role}) foi associado à empresa.`,
      author: getRoleUserName(currentRole)
    })

    return newContact
  }

  const updateContact = (id: string, updates: Partial<Contact>) => {
    const updated = contacts.map(c => c.id === id ? { ...c, ...updates } : c)
    updateContactsState(updated)
  }

  const deleteContact = (id: string) => {
    updateContactsState(contacts.filter(c => c.id !== id))
  }

  // Deals CRUD
  const addDeal = (d: Omit<Deal, 'id' | 'createdAt'>) => {
    const newDeal: Deal = {
      ...d,
      id: `deal-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    const updated = [newDeal, ...deals]
    updateDealsState(updated)

    // Log Activity
    addActivity({
      companyId: d.companyId,
      dealId: newDeal.id,
      type: 'comment',
      title: 'Negócio criado no funil',
      description: `Novo negócio "${newDeal.title}" iniciado no estágio "${newDeal.stage}" com valor previsto de R$ ${newDeal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      author: getRoleUserName(currentRole)
    })

    return newDeal
  }

  const updateDeal = (id: string, updates: Partial<Deal>) => {
    const updated = deals.map(d => d.id === id ? { ...d, ...updates } : d)
    updateDealsState(updated)
  }

  const moveDeal = (dealId: string, targetStage: string) => {
    const deal = deals.find(d => d.id === dealId)
    if (!deal) return

    const oldStage = deal.stage
    if (oldStage === targetStage) return

    const updated = deals.map(d => d.id === dealId ? { ...d, stage: targetStage } : d)
    updateDealsState(updated)

    // Log Activity for drag
    addActivity({
      companyId: deal.companyId,
      dealId: deal.id,
      type: 'comment',
      title: 'Estágio do Funil Atualizado',
      description: `Negócio movido de "${oldStage}" para "${targetStage}".`,
      author: getRoleUserName(currentRole)
    })

    // Se passou para "Contrato aprovado" ou "Cliente ativo", e não tem proposta aprovada, podemos auto-gerar ou atualizar status de proposta
    if (targetStage === 'Contrato aprovado' || targetStage === 'Cliente ativo') {
      // Procurar proposta pendente desta empresa e desse serviço e aprovar
      const propToApprove = proposals.find(p => p.companyId === deal.companyId && p.service === deal.service && p.status !== 'approved')
      if (propToApprove) {
        updateProposalStatus(propToApprove.id, 'approved')
      }
    }
  }

  const deleteDeal = (id: string) => {
    updateDealsState(deals.filter(d => d.id !== id))
  }

  // Activities Log
  const addActivity = (act: Omit<Activity, 'id' | 'date'>) => {
    const newActivity: Activity = {
      ...act,
      id: `act-${Date.now()}`,
      date: new Date().toISOString()
    }
    const updated = [newActivity, ...activities]
    updateActivitiesState(updated)
    return newActivity
  }

  // Tasks CRUD
  const addTask = (t: Omit<Task, 'id' | 'status'>) => {
    const newTask: Task = {
      ...t,
      id: `task-${Date.now()}`,
      status: 'pending'
    }
    const updated = [newTask, ...tasks]
    updateTasksState(updated)

    // Log Activity
    addActivity({
      companyId: t.companyId,
      dealId: t.dealId,
      type: 'comment',
      title: 'Tarefa agendada',
      description: `Tarefa "${newTask.title}" agendada para vencimento em ${newTask.dueDate}.`,
      author: getRoleUserName(currentRole)
    })

    return newTask
  }

  const toggleTaskStatus = (id: string) => {
    const updated = tasks.map(t => {
      if (t.id === id) {
        const nextStatus: Task['status'] = t.status === 'pending' ? 'completed' : 'pending'
        // Log Activity
        addActivity({
          companyId: t.companyId,
          dealId: t.dealId,
          type: 'comment',
          title: nextStatus === 'completed' ? 'Tarefa concluída' : 'Tarefa reaberta',
          description: `A tarefa "${t.title}" foi marcada como ${nextStatus === 'completed' ? 'concluída' : 'pendente'}.`,
          author: getRoleUserName(currentRole)
        })
        return { ...t, status: nextStatus }
      }
      return t
    })
    updateTasksState(updated)
  }

  const deleteTask = (id: string) => {
    updateTasksState(tasks.filter(t => t.id !== id))
  }

  // Proposals CRUD
  const addProposal = (p: Omit<Proposal, 'id' | 'createdAt'>) => {
    const newProposal: Proposal = {
      ...p,
      id: `prop-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    const updated = [newProposal, ...proposals]
    updateProposalsState(updated)

    // Log Activity
    addActivity({
      companyId: p.companyId,
      type: 'proposal',
      title: `Nova proposta comercial: ${p.service}`,
      description: `Criada proposta no valor de R$ ${p.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} com status "${p.status}".`,
      author: getRoleUserName(currentRole)
    })

    return newProposal
  }

  const updateProposalStatus = (id: string, status: Proposal['status']) => {
    const prop = proposals.find(p => p.id === id)
    if (!prop) return

    const updated = proposals.map(p => p.id === id ? { ...p, status } : p)
    updateProposalsState(updated)

    // Log Activity
    addActivity({
      companyId: prop.companyId,
      type: 'proposal',
      title: `Proposta comercial atualizada`,
      description: `Proposta do serviço "${prop.service}" mudou de status para "${status}".`,
      author: getRoleUserName(currentRole)
    })

    // Se aprovada, auto-criar contrato
    if (status === 'approved') {
      const company = companies.find(c => c.id === prop.companyId)
      addContract({
        companyId: prop.companyId,
        proposalId: prop.id,
        title: `Contrato - ${prop.service} - ${company ? company.tradeName : 'Cliente'}`,
        value: prop.value,
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 ano
        autoRenew: true,
        status: 'active',
        attachments: []
      })
    }
  }

  // Contracts CRUD
  const addContract = (c: Omit<Contract, 'id' | 'createdAt'>) => {
    const newContract: Contract = {
      ...c,
      id: `contr-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    const updated = [newContract, ...contracts]
    updateContractsState(updated)

    // Log Activity
    addActivity({
      companyId: c.companyId,
      type: 'contract',
      title: `Contrato iniciado: ${c.title}`,
      description: `Contrato ativo com início em ${c.startDate} e término em ${c.endDate}. Valor total: R$ ${c.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}.`,
      author: getRoleUserName(currentRole)
    })

    return newContract
  }

  const updateContractStatus = (id: string, status: Contract['status']) => {
    const contr = contracts.find(c => c.id === id)
    if (!contr) return
    const updated = contracts.map(c => c.id === id ? { ...c, status } : c)
    updateContractsState(updated)
  }

  const addClient = (c: Omit<Client, 'id' | 'createdAt'>) => {
    const newClient: Client = {
      ...c,
      id: `cli-${Date.now()}`,
      createdAt: new Date().toISOString()
    }
    const updated = [newClient, ...clients]
    updateClientsState(updated)
    return newClient
  }

  const updateClient = (id: string, updates: Partial<Client>) => {
    const updated = clients.map(c => c.id === id ? { ...c, ...updates } : c)
    updateClientsState(updated)
  }

  const deleteClient = (id: string) => {
    updateClientsState(clients.filter(c => c.id !== id))
  }

  const getClientByCompanyId = (companyId: string) => {
    return clients.find(c => c.companyId === companyId)
  }

  const convertContractToClient = (contractId: string) => {
    const contr = contracts.find(c => c.id === contractId)
    if (!contr) return
    if (clients.some(c => c.contractId === contractId)) return
    addClient({
      companyId: contr.companyId,
      contractId: contr.id,
      status: 'active'
    })
  }

  // Helper helper
  function getRoleUserName(role: UserRole): string {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'commercial': return 'Ana Beatriz (Comercial)'
      case 'consultant': return 'Carlos Eduardo (Consultor)'
      case 'finance': return 'Financeiro'
      default: return 'Usuário'
    }
  }

  return (
    <CrmContext.Provider
      value={{
        // Core CRM data
        companies,
        contacts,
        deals,
        activities,
        tasks,
        proposals,
        contracts,
        clients,
        // NR01 entities
        diagnostics,
        units,
        sectors,
        risks,
        evidences,
        actionPlans,
        monitoring,
        reports,
        interviews,
        // Static data
        sellers: SELLERS,
        services: SERVICES,
        pipelineStages: PIPELINE_STAGES,
        // Role management
        currentRole,
        setCurrentRole: changeRole,
        // Core mutators
        addCompany,
        updateCompany,
        deleteCompany,
        addContact,
        updateContact,
        deleteContact,
        addDeal,
        updateDeal,
        moveDeal,
        deleteDeal,
        addActivity,
        addTask,
        toggleTaskStatus,
        deleteTask,
        addProposal,
        updateProposalStatus,
        addContract,
        updateContractStatus,
        // Client mutators (already present)
        addClient,
        updateClient,
        deleteClient,
        getClientByCompanyId,
        convertContractToClient,
        // NR01 mutators
        addDiagnostic,
        updateDiagnostic,
        deleteDiagnostic
        // Additional NR01 mutators (units, sectors, risks, etc.) will be added later
      }}
    >
      {children}
    </CrmContext.Provider>
  )
}

export const useCrm = () => {
  const context = useContext(CrmContext)
  if (context === undefined) {
    throw new Error('useCrm must be used within a CrmProvider')
  }
  return context
}
