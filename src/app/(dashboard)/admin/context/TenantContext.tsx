'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

export type TenantStatus = 'active' | 'suspended' | 'trial' | 'cancelled'
export type BillingStatus = 'paid' | 'pending' | 'overdue' | 'cancelled'

export interface TenantPlan {
  id: string
  name: string
  code: string
  description: string
  maxUsers: number
  maxClients: number
  maxProjects: number
  storageLimitMb: number
  hasAi: boolean
  hasPortal: boolean
  hasReports: boolean
  monthlyPrice: number
  annualPrice: number
}

export interface Tenant {
  id: string
  name: string
  cnpj: string
  planId: string
  planName: string
  status: TenantStatus
  maxUsers: number
  storageLimitMb: number
  startDate: string
  renewalDate?: string
  responsibleName: string
  responsibleEmail: string
  responsiblePhone: string
  logoUrl?: string
  createdAt: string
}

export interface TenantUsage {
  id: string
  tenantId: string
  metric: 'users' | 'clients' | 'projects' | 'storage_mb' | 'ai_requests'
  value: number
  recordedAt: string
}

export interface TenantBilling {
  id: string
  tenantId: string
  invoiceNumber: string
  amount: number
  status: BillingStatus
  dueDate: string
  paidAt?: string
  createdAt: string
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

const SEED_TENANTS: Tenant[] = []

function seedUsage(): TenantUsage[] { return [] }

function seedBilling(): TenantBilling[] { return [] }

export function TenantProvider({ children }: { children: React.ReactNode }) {
  const [tenants, setTenants] = useState<Tenant[]>([])
  const [tenantsUsage, setTenantsUsage] = useState<TenantUsage[]>([])
  const [billing, setBilling] = useState<TenantBilling[]>([])
  const [currentTenantId, setCurrentTenantId] = useState<string | null>(null)
  const [filterPlan, setFilterPlan] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<TenantStatus | null>(null)
  const [searchTenant, setSearchTenant] = useState('')
  const loadedRef = useRef(false)

  const plans = SEED_PLANS

  useEffect(() => {
    if (typeof window === 'undefined' || loadedRef.current) return
    loadedRef.current = true

    const loadFromLocal = () => {
      try {
        const t = localStorage.getItem('tenant_tenants'); if (t) setTenants(JSON.parse(t)); else setTenants(SEED_TENANTS)
        const u = localStorage.getItem('tenant_usage'); if (u) setTenantsUsage(JSON.parse(u)); else setTenantsUsage(seedUsage())
        const b = localStorage.getItem('tenant_billing'); if (b) setBilling(JSON.parse(b)); else setBilling(seedBilling())
      } catch { setTenants(SEED_TENANTS); setTenantsUsage(seedUsage()); setBilling(seedBilling()) }
    }

    fetch('/api/sync/tenants')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data) {
          const d = res.data
          if (Array.isArray(d.tenants) && d.tenants.length > 0) setTenants(d.tenants as Tenant[])
          if (Array.isArray(d.tenantsUsage) && d.tenantsUsage.length > 0) setTenantsUsage(d.tenantsUsage as TenantUsage[])
          if (Array.isArray(d.billing) && d.billing.length > 0) setBilling(d.billing as TenantBilling[])
          for (const [k, v] of Object.entries(d)) {
            if (Array.isArray(v) && v.length > 0) localStorage.setItem(`tenant_${k}`, JSON.stringify(v))
          }
        } else {
          loadFromLocal()
        }
      })
      .catch(() => loadFromLocal())
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasData = tenants.length > 0 || tenantsUsage.length > 0 || billing.length > 0
    if (!hasData) return
    const timer = setTimeout(() => {
      const payload = { tenants, tenantsUsage, billing }
      fetch('/api/sync/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merged: payload }),
      }).catch((err) => console.error('[TenantContext] sync error:', err))
      localStorage.setItem('tenant_tenants', JSON.stringify(tenants))
      localStorage.setItem('tenant_usage', JSON.stringify(tenantsUsage))
      localStorage.setItem('tenant_billing', JSON.stringify(billing))
    }, 500)
    return () => clearTimeout(timer)
  }, [tenants, tenantsUsage, billing])

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

  const addTenant = useCallback((t: Omit<Tenant, 'id' | 'createdAt'>) => {
    const plan = plans.find(p => p.id === t.planId)
    const newTenant: Tenant = { ...t, id: gid(), planName: plan?.name || 'Sem plano', createdAt: new Date().toISOString() }
    setTenants(prev => [...prev, newTenant])
    return newTenant
  }, [plans])

  const updateTenant = useCallback((id: string, updates: Partial<Tenant>) => {
    setTenants(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))
  }, [])

  const deleteTenant = useCallback((id: string) => {
    setTenants(prev => prev.filter(t => t.id !== id))
    setTenantsUsage(prev => prev.filter(u => u.tenantId !== id))
    setBilling(prev => prev.filter(b => b.tenantId !== id))
  }, [])

  const toggleTenantStatus = useCallback((id: string) => {
    setTenants(prev => prev.map(t => {
      if (t.id !== id) return t
      const next: Record<TenantStatus, TenantStatus> = { active: 'suspended', suspended: 'active', trial: 'active', cancelled: 'trial' }
      return { ...t, status: next[t.status] }
    }))
  }, [])

  const getPlanById = useCallback((planId: string) => plans.find(p => p.id === planId), [plans])

  const addUsage = useCallback((tenantId: string, metric: TenantUsage['metric'], value: number = 1) => {
    setTenantsUsage(prev => [...prev, { id: gid(), tenantId, metric, value, recordedAt: new Date().toISOString() }])
  }, [])

  const getUsage = useCallback((tenantId: string, metric: TenantUsage['metric']): number => {
    return tenantsUsage.filter(u => u.tenantId === tenantId && u.metric === metric).reduce((acc, u) => acc + u.value, 0)
  }, [tenantsUsage])

  const addBilling = useCallback((b: Omit<TenantBilling, 'id' | 'createdAt'>) => {
    const newBill: TenantBilling = { ...b, id: gid(), createdAt: new Date().toISOString() }
    setBilling(prev => [...prev, newBill])
  }, [])

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
