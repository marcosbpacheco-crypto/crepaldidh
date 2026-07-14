'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useFinancial } from '@/app/(dashboard)/financial/context/FinancialContext'
import { useDocuments } from '@/app/(dashboard)/documents/context/DocumentContext'
import { useAcessoTemporario } from '@/app/(dashboard)/acesso-temporario/context/AcessoTemporarioContext'

export type PortalRole = 'rh' | 'diretoria' | 'lider' | 'financeiro'
export type RequestType = 'meeting' | 'training' | 'doubt' | 'document' | 'support' | 'action_plan_adjust'
export type RequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
export type RequestPriority = 'low' | 'medium' | 'high' | 'urgent'
export type PortalTab = 'dashboard' | 'projects' | 'nr01' | 'trainings' | 'documents' | 'agenda' | 'financial' | 'requests'

export interface PortalUser {
  id: string; companyId: string; name: string; email: string; role: PortalRole
  phone?: string; active: boolean; lastAccess?: string
}

export interface Permission {
  id: string; userId: string; unitId?: string; module: PortalTab
  canView: boolean; canEdit: boolean
}

export interface ClientRequest {
  id: string; companyId: string; userId?: string; userName?: string
  type: RequestType; subject: string; description?: string
  priority: RequestPriority; status: RequestStatus
  createdAt: string; updatedAt: string
}

export interface ClientNotification {
  id: string; companyId: string; userId?: string
  title: string; description?: string
  type: 'info' | 'warning' | 'success' | 'alert'
  link?: string; read: boolean; createdAt: string
}

export interface PortalIndicator {
  label: string; value: string | number; icon: string; color: string
}

const API = '/api/prisma/portal'

interface PortalContextType {
  user: PortalUser | null; isAuthenticated: boolean; isLoading: boolean
  login: (email: string) => Promise<boolean>; loginWithToken: (token: string) => Promise<boolean>; logout: () => void
  companyName: string; companyId: string | null
  hasPermission: (module: PortalTab) => boolean
  portalUsers: PortalUser[]; permissions: Permission[]
  requests: ClientRequest[]; notifications: ClientNotification[]
  unreadCount: number
  addRequest: (r: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>) => ClientRequest
  markNotificationRead: (id: string) => void
  downloadDocument: (docId: string) => void
  companyRequests: ClientRequest[]
  companyNotifications: ClientNotification[]
  companyDocuments: import('@/app/(dashboard)/documents/context/DocumentContext').Document[]
  indicators: PortalIndicator[]
  companyReceivables: any[]; companyCalendarEvents: any[]
  activeProjects: number; activeDiagnostics: number; pendingActionPlans: number
  upcomingTrainings: any[]; overdueAmount: number; mrrClient: number
  activeTab: PortalTab; setActiveTab: (t: PortalTab) => void
}

const PortalContext = createContext<PortalContextType | undefined>(undefined)

export const PortalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const crm = useCrm()
  const fin = useFinancial()
  const docCtx = useDocuments()
  const { validateToken, useToken } = useAcessoTemporario()

  const [user, setUser] = useState<PortalUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [portalUsers, setPortalUsers] = useState<PortalUser[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [requests, setRequests] = useState<ClientRequest[]>([])
  const [notifications, setNotifications] = useState<ClientNotification[]>([])
  const [calendarEvents, setCalendarEvents] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard')

  useEffect(() => {
    fetch(API)
      .then(res => res.json())
      .then(data => {
        if (data.error) { console.error('[PortalContext] API error:', data.error); return }
        if (data.users) setPortalUsers(data.users)
        if (data.permissions) setPermissions(data.permissions)
        if (data.requests) setRequests(data.requests)
        if (data.notifications) setNotifications(data.notifications)
        if (data.calendarEvents) setCalendarEvents(data.calendarEvents)
      })
      .catch(err => console.error('[PortalContext] load error:', err))
      .finally(() => setIsLoading(false))
  }, [])

  const login = useCallback(async (email: string): Promise<boolean> => {
    try {
      const res = await fetch(API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ _type: 'login', email }),
      })
      const data = await res.json()
      if (data.user) { setUser(data.user); return true }
      return false
    } catch { return false }
  }, [])

  const loginWithToken = useCallback(async (token: string): Promise<boolean> => {
    const access = validateToken(token)
    if (!access) return false
    useToken(token)
    const tokenUserId = `token-${access.companyId}`
    let tokenUser = portalUsers.find(u => u.id === tokenUserId)
    if (!tokenUser) {
      tokenUser = { id: tokenUserId, companyId: access.companyId, name: `Cliente - ${access.companyName}`, email: `temp-${access.companyId}@portal.crepaldidh.com`, role: 'diretoria', active: true }
    }
    setUser(tokenUser)
    return true
  }, [validateToken, useToken, portalUsers])

  const logout = useCallback(() => { setUser(null) }, [])

  const companyId = user?.companyId || null
  const company = crm.companies.find(c => c.id === companyId)
  const companyName = company?.name || company?.tradeName || 'Cliente'

  const hasPermission = useCallback((module: PortalTab): boolean => {
    if (!user) return false
    return permissions.some(p => p.userId === user.id && p.module === module && p.canView)
  }, [user, permissions])

  const companyReceivables = useMemo(() => fin.receivables.filter(r => r.companyId === companyId), [fin.receivables, companyId])
  const companyCalendarEvents = useMemo(() =>
    calendarEvents.filter((e: any) => e.companyId === companyId && e.status !== 'canceled'),
    [calendarEvents, companyId]
  )

  const activeProjects = crm.contracts.filter(c => c.companyId === companyId && c.status === 'active').length
  const activeDiagnostics = 2
  const pendingActionPlans = 3
  const upcomingTrainings = companyCalendarEvents.filter((e: any) => e.type === 'training' || e.type === 'lecture').slice(0, 5)
  const overdueAmount = companyReceivables.filter(r => r.status === 'overdue').reduce((a, r) => a + r.amount, 0)
  const mrrClient = fin.recurringRules.filter(r => r.companyId === companyId && r.status === 'active')
    .reduce((acc, r) => {
      if (r.frequency === 'monthly') return acc + r.amount
      if (r.frequency === 'bimonthly') return acc + r.amount / 2
      if (r.frequency === 'quarterly') return acc + r.amount / 3
      if (r.frequency === 'semiannual') return acc + r.amount / 6
      if (r.frequency === 'annual') return acc + r.amount / 12
      return acc
    }, 0)

  const indicators: PortalIndicator[] = useMemo(() => [
    { label: 'Projetos Ativos', value: activeProjects, icon: '📋', color: 'from-violet-500 to-purple-600' },
    { label: 'Diagnósticos Ativos', value: activeDiagnostics, icon: '🔬', color: 'from-blue-500 to-indigo-600' },
    { label: 'Planos de Ação', value: pendingActionPlans, icon: '📝', color: 'from-amber-500 to-orange-600' },
    { label: 'Faturamento Mensal', value: `R$ ${companyReceivables.filter(r => r.status === 'paid').reduce((a, r) => a + r.amount, 0).toLocaleString('pt-BR')}`, icon: '💰', color: 'from-emerald-500 to-teal-600' },
    { label: 'MRR (Mensal)', value: `R$ ${mrrClient.toLocaleString('pt-BR')}`, icon: '📈', color: 'from-cyan-500 to-blue-600' },
    { label: 'Em Atraso', value: `R$ ${overdueAmount.toLocaleString('pt-BR')}`, icon: '⚠️', color: overdueAmount > 0 ? 'from-red-500 to-rose-600' : 'from-emerald-500 to-teal-600' },
  ], [activeProjects, activeDiagnostics, pendingActionPlans, companyReceivables, mrrClient, overdueAmount])

  const unreadCount = notifications.filter(n => !n.read).length

  const companyRequests = useMemo(() => requests.filter(r => r.companyId === companyId), [requests, companyId])
  const companyNotifications = useMemo(() => notifications.filter(n => n.companyId === companyId), [notifications, companyId])
  const companyDocuments = useMemo(() =>
    docCtx.documents.filter(d => d.companyId === companyId && d.visibility === 'portal' && d.status !== 'archived'),
  [docCtx.documents, companyId])

  const downloadDocument = useCallback((docId: string) => {
    const d = docCtx.documents.find(x => x.id === docId)
    if (!d || d.companyId !== companyId) return
    docCtx.logAccess(docId, user?.name || 'Portal', 'download')
    const content = `${d.name}\n\nTipo: ${docCtx.docTypeConfig[d.type].label}\nCliente: ${d.companyName || '-'}\nProjeto: ${d.projectName || '-'}\nDescrição: ${d.description || '-'}\nVersão: ${d.currentVersion}`
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${d.name.replace(/\s+/g, '_')}.txt`; a.click()
    URL.revokeObjectURL(url)
  }, [docCtx, companyId, user])

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'notification', id, read: true }) }).catch(() => {})
  }, [])

  const addRequest = useCallback((r: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>): ClientRequest => {
    const nr: ClientRequest = { ...r, id: `cr-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setRequests(prev => [nr, ...prev])
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'request', ...nr }) }).catch(() => {})
    return nr
  }, [])

  return (
    <PortalContext.Provider value={{
      user, isAuthenticated: !!user, isLoading, login, loginWithToken, logout,
      companyName, companyId,
      portalUsers, permissions, hasPermission,
      requests, notifications, unreadCount,
      addRequest, markNotificationRead, downloadDocument,
      companyRequests, companyNotifications, companyDocuments,
      indicators,
      companyReceivables, companyCalendarEvents,
      activeProjects, activeDiagnostics, pendingActionPlans,
      upcomingTrainings, overdueAmount, mrrClient,
      activeTab, setActiveTab,
    }}>
      {children}
    </PortalContext.Provider>
  )
}

export const usePortal = () => {
  const ctx = useContext(PortalContext)
  if (!ctx) throw new Error('usePortal must be used within a PortalProvider')
  return ctx
}
