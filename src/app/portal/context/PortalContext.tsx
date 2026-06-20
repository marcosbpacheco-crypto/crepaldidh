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

const SEED_PORTAL_USERS: PortalUser[] = [
  { id: 'pu-1', companyId: 'comp-1', name: 'Carlos Silva', email: 'carlos@brdistribuidora.com', role: 'diretoria', phone: '(11) 99999-0001', active: true, lastAccess: new Date().toISOString() },
  { id: 'pu-2', companyId: 'comp-1', name: 'Ana Oliveira', email: 'ana@brdistribuidora.com', role: 'rh', phone: '(11) 99999-0002', active: true },
  { id: 'pu-3', companyId: 'comp-2', name: 'Roberto Lima', email: 'roberto@vale.com', role: 'diretoria', phone: '(31) 98888-0001', active: true, lastAccess: new Date(Date.now() - 86400000).toISOString() },
  { id: 'pu-4', companyId: 'comp-2', name: 'Marina Costa', email: 'marina@vale.com', role: 'lider', active: true },
  { id: 'pu-5', companyId: 'comp-3', name: 'Pedro Santos', email: 'pedro@itau.com', role: 'financeiro', phone: '(11) 97777-0001', active: true },
  { id: 'pu-6', companyId: 'comp-4', name: 'João Ferreira', email: 'joao@gerdau.com', role: 'rh', active: false },
]

const SEED_PERMISSIONS: Permission[] = [
  { id: 'pp-1', userId: 'pu-1', module: 'dashboard', canView: true, canEdit: false },
  { id: 'pp-2', userId: 'pu-1', module: 'projects', canView: true, canEdit: true },
  { id: 'pp-3', userId: 'pu-1', module: 'nr01', canView: true, canEdit: false },
  { id: 'pp-4', userId: 'pu-1', module: 'trainings', canView: true, canEdit: false },
  { id: 'pp-5', userId: 'pu-1', module: 'documents', canView: true, canEdit: false },
  { id: 'pp-6', userId: 'pu-1', module: 'agenda', canView: true, canEdit: false },
  { id: 'pp-7', userId: 'pu-1', module: 'financial', canView: true, canEdit: false },
  { id: 'pp-8', userId: 'pu-1', module: 'requests', canView: true, canEdit: true },
  { id: 'pp-9', userId: 'pu-2', module: 'dashboard', canView: true, canEdit: false },
  { id: 'pp-10', userId: 'pu-2', module: 'nr01', canView: true, canEdit: true },
  { id: 'pp-11', userId: 'pu-2', module: 'trainings', canView: true, canEdit: true },
  { id: 'pp-12', userId: 'pu-2', unitId: 'unit-1', module: 'nr01', canView: true, canEdit: false },
  { id: 'pp-13', userId: 'pu-3', module: 'dashboard', canView: true, canEdit: false },
  { id: 'pp-14', userId: 'pu-3', module: 'projects', canView: true, canEdit: true },
  { id: 'pp-15', userId: 'pu-3', module: 'financial', canView: true, canEdit: false },
  { id: 'pp-16', userId: 'pu-5', module: 'financial', canView: true, canEdit: false },
  { id: 'pp-17', userId: 'pu-5', module: 'dashboard', canView: true, canEdit: false },
]

const SEED_REQUESTS: ClientRequest[] = [
  { id: 'cr-1', companyId: 'comp-1', userId: 'pu-1', userName: 'Carlos Silva', type: 'meeting', subject: 'Solicitação de reunião de alinhamento', description: 'Precisamos alinhar o cronograma do projeto DHO para o próximo semestre.', priority: 'high', status: 'open', createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'cr-2', companyId: 'comp-1', userId: 'pu-2', userName: 'Ana Oliveira', type: 'document', subject: 'Solicitação de certificados', description: 'Precisamos dos certificados do treinamento de NR01 realizado em maio.', priority: 'medium', status: 'in_progress', createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'cr-3', companyId: 'comp-2', userId: 'pu-3', userName: 'Roberto Lima', type: 'training', subject: 'Novo treinamento para equipe', description: 'Gostaríamos de agendar uma turma extra de segurança psicológica.', priority: 'high', status: 'open', createdAt: new Date(Date.now() - 43200000).toISOString(), updatedAt: new Date().toISOString() },
  { id: 'cr-4', companyId: 'comp-2', userId: 'pu-4', userName: 'Marina Costa', type: 'support', subject: 'Dúvida sobre plano de ação', description: 'Não estou conseguindo acessar o plano de ação do setor de produção.', priority: 'low', status: 'resolved', createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date(Date.now() - 345600000).toISOString() },
]

const SEED_NOTIFICATIONS: ClientNotification[] = [
  { id: 'cn-1', companyId: 'comp-1', userId: 'pu-1', title: 'Reunião agendada para amanhã', description: 'Reunião de alinhamento com equipe CrepaldiDH às 09:00.', type: 'info', read: false, createdAt: new Date().toISOString() },
  { id: 'cn-2', companyId: 'comp-1', userId: 'pu-1', title: 'Relatório NR01 disponível', description: 'O relatório final do diagnóstico psicossocial já está disponível.', type: 'success', link: '/portal/nr01', read: false, createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 'cn-3', companyId: 'comp-1', userId: 'pu-2', title: 'Plano de ação pendente', description: '2 ações do plano de ação NR01 estão com prazo vencido.', type: 'alert', link: '/portal/nr01', read: false, createdAt: new Date(Date.now() - 7200000).toISOString() },
  { id: 'cn-4', companyId: 'comp-2', userId: 'pu-3', title: 'Fatura próxima do vencimento', description: 'A parcela de R$ 64.000,00 vence em 5 dias.', type: 'warning', link: '/portal/financial', read: true, createdAt: new Date(Date.now() - 86400000).toISOString() },
]

function generateSeedCalendarEvents() {
  const now = new Date()
  const d = (daysOffset: number) => { const r = new Date(now); r.setDate(r.getDate() + daysOffset); return r.toISOString().split('T')[0] }
  return [
    { id: 'pce-1', companyId: 'comp-1', title: 'Treinamento NR01 - Turma A', type: 'training', eventDate: d(2), startTime: '08:00', endTime: '12:00', location: 'Matriz - Sala 3', status: 'confirmed', responsible: 'Instrutor CrepaldiDH' },
    { id: 'pce-2', companyId: 'comp-1', title: 'Palestra Segurança Psicológica', type: 'lecture', eventDate: d(5), startTime: '14:00', endTime: '16:00', location: 'Auditório BR', status: 'confirmed', responsible: 'Dr. Marcos' },
    { id: 'pce-3', companyId: 'comp-1', title: 'Reunião de Alinhamento DHO', type: 'commercial_meeting', eventDate: d(1), startTime: '09:00', endTime: '10:30', location: 'Sala Reunião', status: 'scheduled' },
    { id: 'pce-4', companyId: 'comp-2', title: 'Mentoria Liderança Vale', type: 'mentoring', eventDate: d(3), startTime: '10:00', endTime: '12:00', location: 'Online', status: 'confirmed', responsible: 'Consultor CrepaldiDH' },
    { id: 'pce-5', companyId: 'comp-2', title: 'SIPAT 2026', type: 'sipat', eventDate: d(14), startTime: '08:00', endTime: '17:00', location: 'Vale S.A.', status: 'scheduled' },
    { id: 'pce-6', companyId: 'comp-3', title: 'Auditoria Financeira', type: 'internal_activity', eventDate: d(7), startTime: '09:00', endTime: '11:00', location: 'Itaú', status: 'scheduled' },
  ]
}

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
  const [portalUsers] = useState<PortalUser[]>(SEED_PORTAL_USERS)
  const [permissions] = useState<Permission[]>(SEED_PERMISSIONS)
  const [requests, setRequests] = useState<ClientRequest[]>([])
  const [notifications, setNotifications] = useState<ClientNotification[]>([])
  const [activeTab, setActiveTab] = useState<PortalTab>('dashboard')

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('portal_user')
    if (stored) { try { setUser(JSON.parse(stored)) } catch { /* ignore */ } }
    const storedRequests = localStorage.getItem('portal_requests')
    if (storedRequests) { try { setRequests(JSON.parse(storedRequests)) } catch {} }
    else { setRequests(SEED_REQUESTS) }
    const storedNotifs = localStorage.getItem('portal_notifications')
    if (storedNotifs) { try { setNotifications(JSON.parse(storedNotifs)) } catch {} }
    else { setNotifications(SEED_NOTIFICATIONS) }
    const storedCal = localStorage.getItem('cal_events')
    if (!storedCal || JSON.parse(storedCal).length === 0) {
      const seed = generateSeedCalendarEvents()
      localStorage.setItem('cal_events', JSON.stringify(seed))
    }
    setIsLoading(false)
  }, [])

  const login = useCallback(async (email: string): Promise<boolean> => {
    const found = portalUsers.find(u => u.email.toLowerCase() === email.toLowerCase() && u.active)
    if (found) { setUser(found); localStorage.setItem('portal_user', JSON.stringify(found)); return true }
    return false
  }, [portalUsers])

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
    localStorage.setItem('portal_user', JSON.stringify(tokenUser))
    return true
  }, [validateToken, useToken, portalUsers])

  const logout = useCallback(() => { setUser(null); localStorage.removeItem('portal_user') }, [])

  const companyId = user?.companyId || null
  const company = crm.companies.find(c => c.id === companyId)
  const companyName = company?.name || company?.tradeName || 'Cliente'

  const hasPermission = useCallback((module: PortalTab): boolean => {
    if (!user) return false
    return permissions.some(p => p.userId === user.id && p.module === module && p.canView)
  }, [user, permissions])

  const companyReceivables = useMemo(() => fin.receivables.filter(r => r.companyId === companyId), [fin.receivables, companyId])
  const companyCalendarEvents = useMemo(() => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem('cal_events')
      if (stored) return JSON.parse(stored).filter((e: any) => e.companyId === companyId && e.status !== 'canceled')
    } catch { /* ignore */ }
    return []
  }, [companyId])

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
    setNotifications(prev => { const next = prev.map(n => n.id === id ? { ...n, read: true } : n); localStorage.setItem('portal_notifications', JSON.stringify(next)); return next })
  }, [])

  const addRequest = (r: Omit<ClientRequest, 'id' | 'createdAt' | 'updatedAt'>): ClientRequest => {
    const nr: ClientRequest = { ...r, id: `cr-${Date.now()}`, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setRequests(prev => { const next = [nr, ...prev]; localStorage.setItem('portal_requests', JSON.stringify(next)); return next }); return nr
  }

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
