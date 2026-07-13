export interface Contact {
  id: string; companyId: string; name: string; role: string; phone: string; whatsapp: string; email: string
  birthday: string; influence: 'high' | 'medium' | 'low'; notes: string
}
export interface Company {
  id: string; name: string; tradeName: string; cnpj: string; segment: string; employees: number
  city: string; state: string; website: string; instagram: string; respPrincipal: string; respRH: string
  respFinanceiro: string; phone: string; email: string; notes: string; status: 'active' | 'inactive'; createdAt: string
}
export interface Deal {
  id: string; companyId: string; title: string; service: string; value: number; stage: string; sellerId: string
  notes: string; dueDate: string; createdAt: string; lostReason?: string
}
export interface Activity {
  id: string; companyId: string; dealId?: string; type: 'call' | 'meeting' | 'whatsapp' | 'email' | 'visit' | 'proposal' | 'contract' | 'comment'
  title: string; description: string; date: string; author: string
}
export interface Task {
  id: string; companyId: string; dealId?: string; title: string; dueDate: string; status: 'pending' | 'completed'; priority: 'high' | 'medium' | 'low'
}
export interface Proposal {
  id: string; companyId: string; service: string; value: number; duration: string; status: 'draft' | 'sent' | 'negotiation' | 'approved' | 'rejected'; createdAt: string; notes?: string
}
export interface Contract {
  id: string; companyId: string; proposalId?: string; title: string; value: number; startDate: string; endDate: string
  autoRenew: boolean; status: 'draft' | 'active' | 'expired' | 'terminated'; attachments: string[]; createdAt: string
}
export interface Seller { id: string; name: string; role: string; avatar: string }
export interface CrmClient {
  id: string; companyId: string; contractId: string; status: 'active' | 'churned'; createdAt: string
}
export type UserRole = 'admin' | 'commercial' | 'consultant' | 'finance' | 'viewer'
