'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

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

const SEED_TENANTS: Tenant[] = [
  { id: 'tnt-crepaldi', name: 'CrepaldiDH', cnpj: '00.000.000/0001-00', planId: 'plan-enterprise', planName: 'Enterprise', status: 'active', maxUsers: 999, storageLimitMb: 500000, startDate: '2025-01-01T00:00:00Z', responsibleName: 'Marcos Crepaldi', responsibleEmail: 'marcos@crepaldidh.com.br', responsiblePhone: '(11) 99999-0001', createdAt: '2025-01-01T00:00:00Z' },
  { id: 'tnt-vale', name: 'Vale S.A.', cnpj: '33.592.510/0001-54', planId: 'plan-premium', planName: 'Premium', status: 'active', maxUsers: 50, storageLimitMb: 20000, startDate: '2026-01-01T00:00:00Z', renewalDate: '2027-01-01T00:00:00Z', responsibleName: 'Roberto Santos', responsibleEmail: 'roberto@vale.com', responsiblePhone: '(31) 99999-1002', createdAt: '2026-01-01T00:00:00Z' },
  { id: 'tnt-br', name: 'BR Distribuidora', cnpj: '34.274.182/0001-02', planId: 'plan-professional', planName: 'Profissional', status: 'active', maxUsers: 15, storageLimitMb: 5000, startDate: '2026-02-01T00:00:00Z', renewalDate: '2027-02-01T00:00:00Z', responsibleName: 'Mariana Souza', responsibleEmail: 'mariana@br.com.br', responsiblePhone: '(21) 99999-1001', createdAt: '2026-02-01T00:00:00Z' },
  { id: 'tnt-itau', name: 'Banco Itaú', cnpj: '61.532.644/0001-15', planId: 'plan-enterprise', planName: 'Enterprise', status: 'trial', maxUsers: 10, storageLimitMb: 5000, startDate: '2026-05-01T00:00:00Z', renewalDate: '2026-06-01T00:00:00Z', responsibleName: 'Patrícia Lima', responsibleEmail: 'patricia@itau.com.br', responsiblePhone: '(11) 99999-1003', createdAt: '2026-05-01T00:00:00Z' },
  { id: 'tnt-gerdau', name: 'Gerdau', cnpj: '33.611.868/0001-09', planId: 'plan-basic', planName: 'Básico', status: 'suspended', maxUsers: 5, storageLimitMb: 1000, startDate: '2026-03-01T00:00:00Z', renewalDate: '2026-09-01T00:00:00Z', responsibleName: 'Eduardo Silveira', responsibleEmail: 'eduardo@gerdau.com', responsiblePhone: '(51) 99999-1004', createdAt: '2026-03-01T00:00:00Z' },
]

function seedUsage(): TenantUsage[] {
  const now = Date.now()
  return [
    { id: 'usage-1', tenantId: 'tnt-crepaldi', metric: 'users', value: 7, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-2', tenantId: 'tnt-crepaldi', metric: 'clients', value: 4, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-3', tenantId: 'tnt-crepaldi', metric: 'projects', value: 12, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-4', tenantId: 'tnt-crepaldi', metric: 'storage_mb', value: 456, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-5', tenantId: 'tnt-crepaldi', metric: 'ai_requests', value: 89, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-6', tenantId: 'tnt-vale', metric: 'users', value: 12, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-7', tenantId: 'tnt-vale', metric: 'clients', value: 3, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-8', tenantId: 'tnt-vale', metric: 'projects', value: 8, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-9', tenantId: 'tnt-vale', metric: 'storage_mb', value: 234, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-10', tenantId: 'tnt-vale', metric: 'ai_requests', value: 45, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-11', tenantId: 'tnt-br', metric: 'users', value: 8, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-12', tenantId: 'tnt-br', metric: 'clients', value: 15, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-13', tenantId: 'tnt-br', metric: 'projects', value: 5, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-14', tenantId: 'tnt-br', metric: 'storage_mb', value: 89, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-15', tenantId: 'tnt-br', metric: 'ai_requests', value: 12, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-16', tenantId: 'tnt-itau', metric: 'users', value: 3, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-17', tenantId: 'tnt-itau', metric: 'storage_mb', value: 34, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-18', tenantId: 'tnt-gerdau', metric: 'users', value: 2, recordedAt: new Date(now - 86400000).toISOString() },
    { id: 'usage-19', tenantId: 'tnt-gerdau', metric: 'storage_mb', value: 12, recordedAt: new Date(now - 86400000).toISOString() },
  ]
}

function seedBilling(): TenantBilling[] {
  const now = Date.now()
  const d = (ms: number) => new Date(now - ms).toISOString()
  const date = (days: number) => new Date(now - days * 86400000).toISOString().split('T')[0]
  return [
    { id: 'bill-1', tenantId: 'tnt-vale', invoiceNumber: 'NF-2026-0001', amount: 997, status: 'paid', dueDate: date(35), paidAt: d(86400000 * 30), createdAt: d(86400000 * 35) },
    { id: 'bill-2', tenantId: 'tnt-vale', invoiceNumber: 'NF-2026-0002', amount: 997, status: 'paid', dueDate: date(5), paidAt: d(86400000 * 2), createdAt: d(86400000 * 5) },
    { id: 'bill-3', tenantId: 'tnt-vale', invoiceNumber: 'NF-2026-0003', amount: 997, status: 'pending', dueDate: date(-25), createdAt: d(86400000 * 5) },
    { id: 'bill-4', tenantId: 'tnt-br', invoiceNumber: 'NF-2026-0004', amount: 497, status: 'paid', dueDate: date(20), paidAt: d(86400000 * 17), createdAt: d(86400000 * 20) },
    { id: 'bill-5', tenantId: 'tnt-br', invoiceNumber: 'NF-2026-0005', amount: 497, status: 'pending', dueDate: date(-10), createdAt: d(86400000 * 10) },
    { id: 'bill-6', tenantId: 'tnt-gerdau', invoiceNumber: 'NF-2026-0006', amount: 197, status: 'overdue', dueDate: date(-60), createdAt: d(86400000 * 60) },
    { id: 'bill-7', tenantId: 'tnt-gerdau', invoiceNumber: 'NF-2026-0007', amount: 197, status: 'overdue', dueDate: date(-30), createdAt: d(86400000 * 30) },
    { id: 'bill-8', tenantId: 'tnt-itau', invoiceNumber: 'NF-2026-0008', amount: 0, status: 'pending', dueDate: date(30), createdAt: d(86400000 * 5) },
  ]
}

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
    try {
      const t = localStorage.getItem('tenant_tenants'); if (t) setTenants(JSON.parse(t)); else setTenants(SEED_TENANTS)
      const u = localStorage.getItem('tenant_usage'); if (u) setTenantsUsage(JSON.parse(u)); else setTenantsUsage(seedUsage())
      const b = localStorage.getItem('tenant_billing'); if (b) setBilling(JSON.parse(b)); else setBilling(seedBilling())
    } catch { setTenants(SEED_TENANTS); setTenantsUsage(seedUsage()); setBilling(seedBilling()) }
  }, [])

  useEffect(() => { try { localStorage.setItem('tenant_tenants', JSON.stringify(tenants)) } catch {} }, [tenants])
  useEffect(() => { try { localStorage.setItem('tenant_usage', JSON.stringify(tenantsUsage)) } catch {} }, [tenantsUsage])
  useEffect(() => { try { localStorage.setItem('tenant_billing', JSON.stringify(billing)) } catch {} }, [billing])

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
