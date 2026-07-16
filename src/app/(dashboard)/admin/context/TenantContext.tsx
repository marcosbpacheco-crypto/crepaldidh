'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled'
export type BillingStatus = 'paid' | 'pending' | 'overdue' | 'cancelled'

export interface TenantPlan {
  id: string; name: string; code: string; description: string
  maxUsers: number; maxClients: number; maxProjects: number; storageLimitMb: number
  hasAi: boolean; hasPortal: boolean; hasReports: boolean
  monthlyPrice: number; annualPrice: number
}

export interface Tenant {
  id: string; name: string; cnpj: string; planId: string; planName: string
  status: TenantStatus; maxUsers: number; storageLimitMb: number
  startDate: string; renewalDate?: string
  responsibleName: string; responsibleEmail: string; responsiblePhone: string
  logoUrl?: string; createdAt: string
}

export interface TenantUsage {
  id: string; tenantId: string
  metric: 'users' | 'clients' | 'projects' | 'storage_mb' | 'ai_requests'
  value: number; recordedAt: string
}

export interface TenantBilling {
  id: string; tenantId: string; invoiceNumber: string
  amount: number; status: BillingStatus
  dueDate: string; paidAt?: string; createdAt: string
}

interface TenantContextType {
  tenants: Tenant[]
  plans: TenantPlan[]
  currentTenantId: string | null
  setCurrentTenantId: (id: string | null) => void
  currentTenant: Tenant | null
  addTenant: (t: Omit<Tenant, 'id' | 'createdAt'>) => Tenant
  updateTenant: (id: string, updates: Partial<Tenant>) => void
  deleteTenant: (id: string) => void
  toggleTenantStatus: (id: string) => void
  getPlanById: (planId: string) => TenantPlan | undefined
  addUsage: (tenantId: string, metric: TenantUsage['metric'], value?: number) => void
  getUsage: (tenantId: string, metric: TenantUsage['metric']) => number
  tenantsUsage: TenantUsage[]
  addBilling: (b: Omit<TenantBilling, 'id' | 'createdAt'>) => void
  getTenantBilling: (tenantId: string) => TenantBilling[]
  billing: TenantBilling[]
  filteredTenants: Tenant[]
  setFilterPlan: (planId: string | null) => void
  setFilterStatus: (status: TenantStatus | null) => void
  setSearchTenant: (q: string) => void
}

const TenantContext = createContext<TenantContextType | undefined>(undefined)

function gid(): string { return 'tnt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) }

const SEED_PLANS: TenantPlan[] = [
  { id: 'plan-basic', name: 'Básico', code: 'basic', description: 'Ideal para pequenas empresas iniciando em DHO', maxUsers: 5, maxClients: 50, maxProjects: 3, storageLimitMb: 1000, hasAi: false, hasPortal: true, hasReports: false, monthlyPrice: 197, annualPrice: 1970 },
  { id: 'plan-professional', name: 'Profissional', code: 'professional', description: 'Para empresas em crescimento com equipe de RH dedicada', maxUsers: 15, maxClients: 200, maxProjects: 20, storageLimitMb: 5000, hasAi: true, hasPortal: true, hasReports: true, monthlyPrice: 497, annualPrice: 4970 },
  { id: 'plan-premium', name: 'Premium', code: 'premium', description: 'Solução completa para médias empresas com múltiplas filiais', maxUsers: 50, maxClients: 1000, maxProjects: 100, storageLimitMb: 20000, hasAi: true, hasPortal: true, hasReports: true, monthlyPrice: 997, annualPrice: 9970 },
  { id: 'plan-enterprise', name: 'Enterprise', code: 'enterprise', description: 'Solução corporativa com suporte dedicado e customizações', maxUsers: 999, maxClients: 99999, maxProjects: 9999, storageLimitMb: 500000, hasAi: true, hasPortal: true, hasReports: true, monthlyPrice: 2497, annualPrice: 24970 },
]

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantsUsage, setTenantsUsage] = useState<TenantUsage[]>([])
  const [billing, setBilling] = useState<TenantBilling[]>([])
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null)
  const [filterPlan, setFilterPlan] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<TenantStatus | null>(null)
  const [searchTenant, setSearchTenant] = useState('')

  const plans = SEED_PLANS

  useEffect(() => {
    if (typeof window === 'undefined') return

    fetch('/api/prisma/admin')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.tenants && Array.isArray(res.tenants) && res.tenants.length > 0) {
          setTenants(res.tenants.map((t: any) => ({
            id: t.id ?? '',
            name: t.name ?? '',
            cnpj: t.cnpj ?? '',
            planId: t.plan_id ?? '',
            planName: t.plan_name ?? '',
            status: t.status ?? 'active',
            maxUsers: t.max_users ?? 5,
            storageLimitMb: t.storage_limit_mb ?? 1000,
            startDate: t.start_date ?? '',
            renewalDate: t.renewal_date ?? '',
            responsibleName: t.responsible_name ?? '',
            responsibleEmail: t.responsible_email ?? '',
            responsiblePhone: t.responsible_phone ?? '',
            logoUrl: t.logo_url ?? '',
            createdAt: t.created_at ?? '',
          })))
        }
        if (res?.usage && Array.isArray(res.usage)) {
          setTenantsUsage(res.usage.map((u: any) => ({
            id: u.id ?? '', tenantId: u.tenant_id ?? '',
            metric: u.metric ?? 'users', value: u.value ?? 0, recordedAt: u.recorded_at ?? '',
          })))
        }
      })
      .catch(() => {})
  }, [])

  const currentTenant = useMemo(() => tenants.find(t => t.id === currentTenantId) || null, [tenants, currentTenantId])

  const filteredTenants = useMemo(() =>
    tenants.filter(t => {
      if (searchTenant) { const q = searchTenant.toLowerCase(); return t.name.toLowerCase().includes(q) || t.cnpj.includes(q) || t.responsibleName.toLowerCase().includes(q) }
      if (filterPlan && t.planId !== filterPlan) return false
      if (filterStatus && t.status !== filterStatus) return false
      return true
    }),
    [tenants, searchTenant, filterPlan, filterStatus]
  )

  const callApi = useCallback(async (type: string, method: string, payload: any) => {
    try {
      const res = await fetch('/api/prisma/admin', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: type, ...payload }),
      })
      return await res.json()
    } catch {
      return null
    }
  }, [])

  const addTenant = useCallback((t: Omit<Tenant, 'id' | 'createdAt'>) => {
    const plan = plans.find(p => p.id === t.planId)
    const newTenant: Tenant = { ...t, id: gid(), planName: plan?.name || 'Sem plano', createdAt: new Date().toISOString() }
    setTenants(prev => [...prev, newTenant])
    callApi('tenant', 'POST', {
      id: newTenant.id,
      name: t.name,
      slug: t.name.toLowerCase().replace(/\s+/g, '-'),
      planId: t.planId,
      status: t.status,
      settings: { cnpj: t.cnpj, maxUsers: t.maxUsers, storageLimitMb: t.storageLimitMb, responsibleName: t.responsibleName, responsibleEmail: t.responsibleEmail, responsiblePhone: t.responsiblePhone, logoUrl: t.logoUrl },
    })
    return newTenant
  }, [plans, callApi])

  const updateTenant = useCallback((id: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
    callApi('tenant', 'PATCH', {
      id,
      name: updates.name,
      status: updates.status,
      planId: updates.planId,
      settings: updates.cnpj || updates.maxUsers ? { cnpj: updates.cnpj, maxUsers: updates.maxUsers, storageLimitMb: updates.storageLimitMb, responsibleName: updates.responsibleName, responsibleEmail: updates.responsibleEmail, responsiblePhone: updates.responsiblePhone } : undefined,
    })
  }, [callApi])

  const deleteTenant = useCallback((id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id))
    setTenantsUsage(prev => prev.filter(u => u.tenantId !== id))
    setBilling(prev => prev.filter(b => b.tenantId !== id))
    callApi('tenant', 'DELETE', { id })
  }, [callApi])

  const toggleTenantStatus = useCallback((id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== id) return t
      const next: Record<TenantStatus, TenantStatus> = { active: 'suspended', suspended: 'active', trial: 'active', cancelled: 'trial' }
      return { ...t, status: next[t.status] }
    }))
    const current = tenants.find(t => t.id === id)
    if (current) {
      const next: Record<TenantStatus, TenantStatus> = { active: 'suspended', suspended: 'active', trial: 'active', cancelled: 'trial' }
      callApi('tenant', 'PATCH', { id, status: next[current.status] })
    }
  }, [tenants, callApi])

  const getPlanById = useCallback((planId: string) => plans.find(p => p.id === planId), [plans])

  const addUsage = useCallback((tenantId: string, metric: TenantUsage['metric'], value: number = 1) => {
    const entry = { id: gid(), tenantId, metric, value, recordedAt: new Date().toISOString() }
    setTenantsUsage(prev => [...prev, entry])
    callApi('tenantUsage', 'POST', { tenantId, metric, value })
  }, [callApi])

  const getUsage = useCallback((tenantId: string, metric: TenantUsage['metric']): number => {
    return tenantsUsage.filter(u => u.tenantId === tenantId && u.metric === metric).reduce((acc, u) => acc + u.value, 0)
  }, [tenantsUsage])

  const addBilling = useCallback((b: Omit<TenantBilling, 'id' | 'createdAt'>) => {
    const newBill: TenantBilling = { ...b, id: gid(), createdAt: new Date().toISOString() }
    setBilling(prev => [...prev, newBill])
    callApi('tenantBilling', 'POST', {
      id: newBill.id,
      tenantId: b.tenantId,
      planId: '',
      amount: b.amount,
      dueDate: b.dueDate,
      status: b.status,
    })
  }, [callApi])

  const getTenantBilling = useCallback((tenantId: string) => billing.filter(b => b.tenantId === tenantId), [billing])

  return (
    <TenantContext.Provider value={{
      tenants, plans, currentTenantId, setCurrentTenantId, currentTenant,
      addTenant, updateTenant, deleteTenant, toggleTenantStatus,
      getPlanById, addUsage, getUsage, tenantsUsage, addBilling, getTenantBilling, billing,
      filteredTenants, setFilterPlan, setFilterStatus, setSearchTenant,
    }}>
      {children}
    </TenantContext.Provider>
  )
}

export function useTenant() {
  const ctx = useContext(TenantContext)
  if (!ctx) throw new Error('useTenant must be used within TenantProvider')
  return ctx
}
