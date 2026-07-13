export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled'
export type BillingStatus = 'paid' | 'pending' | 'overdue' | 'cancelled'
export interface TenantPlan {
  id: string; name: string; code: string; description: string; maxUsers: number; maxClients: number
  maxProjects: number; storageLimitMb: number; hasAi: boolean; hasPortal: boolean; hasReports: boolean
  monthlyPrice: number; annualPrice: number
}
export interface Tenant {
  id: string; name: string; cnpj: string; planId: string; planName: string; status: TenantStatus
  maxUsers: number; storageLimitMb: number; startDate: string; renewalDate?: string
  responsibleName: string; responsibleEmail: string; responsiblePhone: string; logoUrl?: string; createdAt: string
}
export interface TenantUsage { id: string; tenantId: string; metric: string; value: number; recordedAt: string }
export interface TenantBilling { id: string; tenantId: string; invoiceNumber: string; amount: number; status: BillingStatus; dueDate: string; paidAt?: string; createdAt: string }
