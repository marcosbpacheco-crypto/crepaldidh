'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'

export type ModuleName = 'crm' | 'clients' | 'projects' | 'nr01' | 'mentoring' | 'trainings' | 'financial' | 'calendar' | 'portal' | 'documents' | 'bi' | 'ai' | 'admin' | 'cadastros' | 'tasks' | 'alerts' | 'import'

export interface Role {
  id: string
  name: string
  label: string
  description: string
  isExternal: boolean
}

export interface User {
  id: string
  name: string
  email: string
  phone: string
  avatar: string
  roleId: string
  roleName: string
  isExternal: boolean
  companyId?: string
  companyName?: string
  active: boolean
  lastLogin?: string
  loginAttempts: number
  mfaEnabled: boolean
  createdAt: string
  tenantId?: string
}

export interface Permission {
  id: string
  roleId?: string
  userId?: string
  module: ModuleName
  canView: boolean
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canExport: boolean
}

export interface AuditLog {
  id: string
  userId: string
  userName: string
  userRole: string
  action: string
  entity: string
  entityId?: string
  description: string
  ipAddress: string
  createdAt: string
}

export interface LgpdConsent {
  id: string
  userId: string
  consentType: string
  legalBasis: string
  granted: boolean
  grantedAt?: string
  revokedAt?: string
  version: string
}

export interface PrivacyRequest {
  id: string
  userId: string
  userName: string
  requestType: string
  status: 'pending' | 'processing' | 'completed' | 'rejected'
  description: string
  processedBy?: string
  processedAt?: string
  responseNotes?: string
  createdAt: string
}

interface AdminContextType {
  users: User[]
  roles: Role[]
  permissions: Permission[]
  auditLogs: AuditLog[]
  lgpdConsents: LgpdConsent[]
  privacyRequests: PrivacyRequest[]
  currentUserId: string | null
  setCurrentUserId: (id: string | null) => void
  currentUser: User | null
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => User
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  toggleUserActive: (id: string) => void
  getPermissionsForRole: (roleId: string) => Permission[]
  getPermissionsForUser: (userId: string) => Permission[]
  checkPermission: (module: ModuleName, action: 'view' | 'create' | 'edit' | 'delete' | 'export', userId?: string) => boolean
  updatePermission: (id: string, field: keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'>, value: boolean) => void
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'createdAt'>) => void
  addLgpdConsent: (c: Omit<LgpdConsent, 'id' | 'grantedAt' | 'revokedAt'>) => void
  revokeLgpdConsent: (id: string) => void
  addPrivacyRequest: (r: Omit<PrivacyRequest, 'id' | 'createdAt' | 'processedAt'>) => void
  updatePrivacyRequest: (id: string, updates: Partial<PrivacyRequest>) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

function gid(): string { return 'adm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) }

const MODULES: ModuleName[] = ['crm', 'clients', 'projects', 'nr01', 'mentoring', 'trainings', 'financial', 'calendar', 'portal', 'documents', 'bi', 'ai', 'admin', 'cadastros', 'tasks', 'alerts', 'import']

const SEED_ROLES: Role[] = [
  { id: 'role-admin', name: 'admin', label: 'Administrador', description: 'Acesso total ao sistema', isExternal: false },
  { id: 'role-director', name: 'director', label: 'Diretor', description: 'Acesso a todos os módulos sem configurações', isExternal: false },
  { id: 'role-consultant', name: 'consultant', label: 'Consultor', description: 'Acesso a CRM, NR01, mentorias, treinamentos, documentos', isExternal: false },
  { id: 'role-commercial', name: 'commercial', label: 'Comercial', description: 'Acesso a CRM, propostas, pipeline comercial', isExternal: false },
  { id: 'role-finance', name: 'finance', label: 'Financeiro', description: 'Acesso a financeiro, cobranças, relatórios', isExternal: false },
  { id: 'role-rh', name: 'rh', label: 'RH', description: 'Acesso a treinamentos, agenda, documentos de RH', isExternal: false },
  { id: 'role-operational', name: 'operational', label: 'Operacional', description: 'Acesso a projetos, NR01, documentos técnicos', isExternal: false },
  { id: 'role-client-rh', name: 'client_rh', label: 'Cliente - RH', description: 'Portal do cliente - perfil RH', isExternal: true },
  { id: 'role-client-director', name: 'client_director', label: 'Cliente - Diretoria', description: 'Portal do cliente - perfil Diretoria', isExternal: true },
  { id: 'role-client-manager', name: 'client_manager', label: 'Cliente - Gestor', description: 'Portal do cliente - perfil Gestor', isExternal: true },
  { id: 'role-client-finance', name: 'client_finance', label: 'Cliente - Financeiro', description: 'Portal do cliente - perfil Financeiro', isExternal: true },
]

function buildSeedPermissions(): Permission[] {
  const result: Permission[] = []
  let id = 0
  SEED_ROLES.forEach(role => {
    const isAdmin = role.name === 'admin'
    const isDirector = role.name === 'director'
    const isConsultant = role.name === 'consultant'
    const isCommercial = role.name === 'commercial'
    const isFinance = role.name === 'finance'
    const isRh = role.name === 'rh'
    const isOperational = role.name === 'operational'
    const isExternal = role.isExternal
    MODULES.forEach(mod => {
      const canView = isAdmin || isDirector || (isConsultant && ['crm', 'projects', 'nr01', 'mentoring', 'trainings', 'documents'].includes(mod)) || (isCommercial && ['crm', 'clients'].includes(mod)) || (isFinance && ['crm', 'financial'].includes(mod)) || (isRh && ['trainings', 'calendar', 'documents'].includes(mod)) || (isOperational && ['projects', 'nr01', 'documents'].includes(mod)) || (isExternal && ['portal'].includes(mod))
      const canCreate = isAdmin || (['crm', 'projects', 'nr01', 'mentoring', 'trainings', 'documents'].includes(mod) && (isAdmin || isDirector || isConsultant || (isCommercial && mod === 'crm') || (isFinance && mod === 'financial') || (isRh && ['trainings', 'calendar'].includes(mod))))
      result.push({
        id: `perm-${id++}`,
        roleId: role.id,
        module: mod,
        canView: canView || isAdmin,
        canCreate: canCreate || isAdmin,
        canEdit: canCreate || isAdmin,
        canDelete: isAdmin,
        canExport: isAdmin || isDirector || isFinance,
      })
    })
  })
  return result
}

const SEED_USERS: User[] = [
  { id: 'user-admin', name: 'Marcos Crepaldi', email: 'marcos@crepaldidh.com.br', phone: '(11) 99999-0001', avatar: 'MC', roleId: 'role-admin', roleName: 'Administrador', isExternal: false, active: true, loginAttempts: 0, mfaEnabled: true, createdAt: '2025-01-01T00:00:00Z', lastLogin: new Date().toISOString(), tenantId: 'tnt-crepaldi' },
  { id: 'user-dir', name: 'Ana Oliveira', email: 'ana@crepaldidh.com.br', phone: '(11) 99999-0002', avatar: 'AO', roleId: 'role-director', roleName: 'Diretor', isExternal: false, active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2025-02-01T00:00:00Z', lastLogin: new Date(Date.now() - 86400000).toISOString(), tenantId: 'tnt-crepaldi' },
  { id: 'user-cons', name: 'Carlos Souza', email: 'carlos@crepaldidh.com.br', phone: '(11) 99999-0003', avatar: 'CS', roleId: 'role-consultant', roleName: 'Consultor', isExternal: false, active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2025-03-01T00:00:00Z', tenantId: 'tnt-crepaldi' },
  { id: 'user-comm', name: 'Bruno Crepaldi', email: 'bruno@crepaldidh.com.br', phone: '(11) 99999-0004', avatar: 'BC', roleId: 'role-commercial', roleName: 'Comercial', isExternal: false, active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2025-01-15T00:00:00Z', tenantId: 'tnt-crepaldi' },
  { id: 'user-fin', name: 'Cláudio Santos', email: 'claudio@crepaldidh.com.br', phone: '(11) 99999-0005', avatar: 'CS', roleId: 'role-finance', roleName: 'Financeiro', isExternal: false, active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2025-04-01T00:00:00Z', tenantId: 'tnt-crepaldi' },
  { id: 'user-rh', name: 'Mariana Souza', email: 'mariana@crepaldidh.com.br', phone: '(11) 99999-0006', avatar: 'MS', roleId: 'role-rh', roleName: 'RH', isExternal: false, active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2025-05-01T00:00:00Z', tenantId: 'tnt-crepaldi' },
  { id: 'user-op', name: 'Ricardo Lima', email: 'ricardo@crepaldidh.com.br', phone: '(11) 99999-0007', avatar: 'RL', roleId: 'role-operational', roleName: 'Operacional', isExternal: false, active: false, loginAttempts: 3, mfaEnabled: false, createdAt: '2025-06-01T00:00:00Z', tenantId: 'tnt-crepaldi' },
  { id: 'user-client-rh', name: 'Mariana Souza (Cliente)', email: 'mariana@br.com.br', phone: '(21) 99999-1001', avatar: 'MS', roleId: 'role-client-rh', roleName: 'Cliente - RH', isExternal: true, companyId: 'comp-1', companyName: 'BR Distribuidora', active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2026-01-01T00:00:00Z', tenantId: 'tnt-br' },
  { id: 'user-client-dir', name: 'Roberto Santos (Cliente)', email: 'roberto@vale.com', phone: '(31) 99999-1002', avatar: 'RS', roleId: 'role-client-director', roleName: 'Cliente - Diretoria', isExternal: true, companyId: 'comp-2', companyName: 'Vale S.A.', active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2026-01-15T00:00:00Z', tenantId: 'tnt-vale' },
  { id: 'user-client-gest', name: 'Patrícia Lima (Cliente)', email: 'patricia@itau.com.br', phone: '(11) 99999-1003', avatar: 'PL', roleId: 'role-client-manager', roleName: 'Cliente - Gestor', isExternal: true, companyId: 'comp-3', companyName: 'Banco Itaú', active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2026-02-01T00:00:00Z', tenantId: 'tnt-itau' },
  { id: 'user-client-fin', name: 'Eduardo Silveira (Cliente)', email: 'eduardo@gerdau.com', phone: '(51) 99999-1004', avatar: 'ES', roleId: 'role-client-finance', roleName: 'Cliente - Financeiro', isExternal: true, companyId: 'comp-4', companyName: 'Gerdau', active: true, loginAttempts: 0, mfaEnabled: false, createdAt: '2026-02-15T00:00:00Z', tenantId: 'tnt-gerdau' },
]

function seedAuditLogs(): AuditLog[] {
  const now = Date.now()
  return [
    { id: 'aud-1', userId: 'user-admin', userName: 'Marcos Crepaldi', userRole: 'Administrador', action: 'login', entity: 'auth', description: 'Login realizado', ipAddress: '192.168.1.100', createdAt: new Date(now - 3600000).toISOString() },
    { id: 'aud-2', userId: 'user-comm', userName: 'Bruno Crepaldi', userRole: 'Comercial', action: 'create', entity: 'deal', entityId: 'deal-7', description: 'Criou novo deal: Diagnóstico Gerdau', ipAddress: '192.168.1.101', createdAt: new Date(now - 7200000).toISOString() },
    { id: 'aud-3', userId: 'user-fin', userName: 'Cláudio Santos', userRole: 'Financeiro', action: 'update', entity: 'receivable', entityId: 'rec-2', description: 'Marcou recebível como pago: Mentoria Vale R$ 64.000', ipAddress: '192.168.1.102', createdAt: new Date(now - 10800000).toISOString() },
    { id: 'aud-4', userId: 'user-cons', userName: 'Carlos Souza', userRole: 'Consultor', action: 'export', entity: 'report', description: 'Exportou relatório executivo em PDF', ipAddress: '192.168.1.103', createdAt: new Date(now - 14400000).toISOString() },
    { id: 'aud-5', userId: 'user-admin', userName: 'Marcos Crepaldi', userRole: 'Administrador', action: 'delete', entity: 'user', entityId: 'user-op', description: 'Desativou usuário: Ricardo Lima', ipAddress: '192.168.1.100', createdAt: new Date(now - 18000000).toISOString() },
    { id: 'aud-6', userId: 'user-dir', userName: 'Ana Oliveira', userRole: 'Diretor', action: 'view', entity: 'financial', description: 'Visualizou dashboard financeiro completo', ipAddress: '192.168.1.104', createdAt: new Date(now - 21600000).toISOString() },
    { id: 'aud-7', userId: 'user-admin', userName: 'Marcos Crepaldi', userRole: 'Administrador', action: 'update', entity: 'permission', description: 'Alterou permissões do perfil Consultor', ipAddress: '192.168.1.100', createdAt: new Date(now - 25200000).toISOString() },
    { id: 'aud-8', userId: 'user-fin', userName: 'Cláudio Santos', userRole: 'Financeiro', action: 'download', entity: 'invoice', entityId: 'inv-1', description: 'Baixou nota fiscal', ipAddress: '192.168.1.102', createdAt: new Date(now - 28800000).toISOString() },
  ]
}

function seedLgpdConsents(): LgpdConsent[] {
  return [
    { id: 'lgpd-1', userId: 'user-client-rh', consentType: 'dados_pessoais', legalBasis: 'LGPD Art. 7 I - Consentimento', granted: true, grantedAt: new Date(Date.now() - 2592000000).toISOString(), version: '1.0' },
    { id: 'lgpd-2', userId: 'user-client-dir', consentType: 'comunicacao', legalBasis: 'LGPD Art. 7 I - Consentimento', granted: true, grantedAt: new Date(Date.now() - 2592000000).toISOString(), version: '1.0' },
    { id: 'lgpd-3', userId: 'user-client-gest', consentType: 'dados_pessoais', legalBasis: 'LGPD Art. 7 I - Consentimento', granted: true, grantedAt: new Date(Date.now() - 2592000000).toISOString(), version: '1.0' },
    { id: 'lgpd-4', userId: 'user-client-fin', consentType: 'dados_pessoais', legalBasis: 'LGPD Art. 7 I - Consentimento', granted: false, version: '1.0' },
    { id: 'lgpd-5', userId: 'user-client-rh', consentType: 'comunicacao', legalBasis: 'LGPD Art. 7 I - Consentimento', granted: true, grantedAt: new Date(Date.now() - 2592000000).toISOString(), version: '1.0' },
    { id: 'lgpd-6', userId: 'user-client-dir', consentType: 'dados_pessoais', legalBasis: 'LGPD Art. 7 I - Consentimento', granted: true, grantedAt: new Date(Date.now() - 2592000000).toISOString(), version: '1.0' },
  ]
}

function seedPrivacyRequests(): PrivacyRequest[] {
  return [
    { id: 'priv-1', userId: 'user-client-rh', userName: 'Mariana Souza (Cliente)', requestType: 'access', status: 'pending', description: 'Solicito acesso a todos os dados pessoais armazenados sobre mim.', createdAt: new Date(Date.now() - 86400000).toISOString() },
    { id: 'priv-2', userId: 'user-client-dir', userName: 'Roberto Santos (Cliente)', requestType: 'rectification', status: 'processing', description: 'Corrigir telefone de contato para (31) 98888-0001', processedBy: 'user-admin', createdAt: new Date(Date.now() - 172800000).toISOString() },
    { id: 'priv-3', userId: 'user-client-gest', userName: 'Patrícia Lima (Cliente)', requestType: 'deletion', status: 'completed', description: 'Excluir dados após encerramento do contrato', processedBy: 'user-admin', processedAt: new Date(Date.now() - 259200000).toISOString(), responseNotes: 'Dados anonimizados conforme política de retenção.', createdAt: new Date(Date.now() - 345600000).toISOString() },
  ]
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [lgpdConsents, setLgpdConsents] = useState<LgpdConsent[]>([])
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([])
  const [currentUserId, setCurrentUserId] = useState<string | null>('user-admin')

  useEffect(() => {
    try {
      const u = localStorage.getItem('admin_users'); if (u) setUsers(JSON.parse(u)); else setUsers(SEED_USERS)
      const p = localStorage.getItem('admin_permissions'); if (p) setPermissions(JSON.parse(p)); else setPermissions(buildSeedPermissions())
      const a = localStorage.getItem('admin_audit_logs'); if (a) setAuditLogs(JSON.parse(a)); else setAuditLogs(seedAuditLogs())
      const l = localStorage.getItem('admin_lgpd_consents'); if (l) setLgpdConsents(JSON.parse(l)); else setLgpdConsents(seedLgpdConsents())
      const r = localStorage.getItem('admin_privacy_requests'); if (r) setPrivacyRequests(JSON.parse(r)); else setPrivacyRequests(seedPrivacyRequests())
    } catch { setUsers(SEED_USERS); setPermissions(buildSeedPermissions()); setAuditLogs(seedAuditLogs()); setLgpdConsents(seedLgpdConsents()); setPrivacyRequests(seedPrivacyRequests()) }
  }, [])

  useEffect(() => { try { localStorage.setItem('admin_users', JSON.stringify(users)) } catch {} }, [users])
  useEffect(() => { try { localStorage.setItem('admin_permissions', JSON.stringify(permissions)) } catch {} }, [permissions])
  useEffect(() => { try { localStorage.setItem('admin_audit_logs', JSON.stringify(auditLogs)) } catch {} }, [auditLogs])
  useEffect(() => { try { localStorage.setItem('admin_lgpd_consents', JSON.stringify(lgpdConsents)) } catch {} }, [lgpdConsents])
  useEffect(() => { try { localStorage.setItem('admin_privacy_requests', JSON.stringify(privacyRequests)) } catch {} }, [privacyRequests])

  const roles = SEED_ROLES

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId) || null, [users, currentUserId])

  const addUser = useCallback((u: Omit<User, 'id' | 'createdAt'>) => {
    const newUser: User = { ...u, id: gid(), createdAt: new Date().toISOString() }
    setUsers(prev => [...prev, newUser])
    addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: 'create', entity: 'user', entityId: newUser.id, description: 'Criou usuário: ' + newUser.name, ipAddress: '127.0.0.1' })
    return newUser
  }, [currentUserId, users])

  const updateUser = useCallback((id: string, updates: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }, [])

  const deleteUser = useCallback((id: string) => {
    const user = users.find(u => u.id === id)
    setUsers(prev => prev.filter(u => u.id !== id))
    if (user) {
      addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: 'delete', entity: 'user', entityId: id, description: 'Excluiu usuário: ' + user.name, ipAddress: '127.0.0.1' })
    }
  }, [currentUserId, users])

  const toggleUserActive = useCallback((id: string) => {
    const user = users.find(u => u.id === id)
    if (user) {
      const becomingActive = !user.active
      setUsers(prev => prev.map(u => u.id === id ? { ...u, active: becomingActive } : u))
      addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: becomingActive ? 'update' : 'delete', entity: 'user', entityId: id, description: (becomingActive ? 'Ativou' : 'Desativou') + ' usuário: ' + user.name, ipAddress: '127.0.0.1' })
    }
  }, [currentUserId, users])

  const getPermissionsForRole = useCallback((roleId: string) => permissions.filter(p => p.roleId === roleId), [permissions])
  const getPermissionsForUser = useCallback((userId: string) => permissions.filter(p => p.userId === userId), [permissions])

  const checkPermission = useCallback((module: ModuleName, action: 'view' | 'create' | 'edit' | 'delete' | 'export', userId?: string): boolean => {
    const uid = userId || currentUserId
    if (!uid) return false
    const user = users.find(u => u.id === uid)
    if (!user) return false
    if (!user.active) return false
    if (user.roleName === 'Administrador') return true
    const rolePerms = getPermissionsForRole(user.roleId).filter(p => p.module === module)
    const userPerms = getPermissionsForUser(uid).filter(p => p.module === module)
    const allPerms = [...rolePerms, ...userPerms]
    const fieldMap: Record<string, keyof Permission> = { view: 'canView', create: 'canCreate', edit: 'canEdit', delete: 'canDelete', export: 'canExport' }
    const field = fieldMap[action]
    return allPerms.some(p => p[field])
  }, [currentUserId, users, getPermissionsForRole, getPermissionsForUser])

  const updatePermission = useCallback((id: string, field: keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'>, value: boolean) => {
    setPermissions(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p))
    const perm = permissions.find(p => p.id === id)
    if (perm) {
      addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: 'update', entity: 'permission', entityId: id, description: 'Permissão ' + field + ' em ' + perm.module + ' alterada para ' + (value ? 'concedido' : 'negado'), ipAddress: '127.0.0.1' })
    }
  }, [currentUserId, users, permissions])

  const addAuditLogLocal = useCallback((entry: Omit<AuditLog, 'id' | 'createdAt'>) => {
    const log: AuditLog = { ...entry, id: gid(), createdAt: new Date().toISOString() }
    setAuditLogs(prev => [log, ...prev].slice(0, 1000))
  }, [])

  const addAuditLog = useCallback((entry: Omit<AuditLog, 'id' | 'createdAt'>) => {
    addAuditLogLocal(entry)
  }, [addAuditLogLocal])

  const addLgpdConsent = useCallback((c: Omit<LgpdConsent, 'id' | 'grantedAt' | 'revokedAt'>) => {
    const consent: LgpdConsent = { ...c, id: gid(), grantedAt: c.granted ? new Date().toISOString() : undefined }
    setLgpdConsents(prev => [...prev, consent])
  }, [])

  const revokeLgpdConsent = useCallback((id: string) => {
    setLgpdConsents(prev => prev.map(c => c.id === id ? { ...c, granted: false, revokedAt: new Date().toISOString() } : c))
    addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: 'update', entity: 'lgpd_consent', entityId: id, description: 'Revogou consentimento LGPD', ipAddress: '127.0.0.1' })
  }, [currentUserId, users, addAuditLogLocal])

  const addPrivacyRequest = useCallback((r: Omit<PrivacyRequest, 'id' | 'createdAt' | 'processedAt'>) => {
    const req: PrivacyRequest = { ...r, id: gid(), createdAt: new Date().toISOString() }
    setPrivacyRequests(prev => [...prev, req])
    addAuditLogLocal({ userId: currentUserId || '', userName: (users.find(u => u.id === currentUserId)?.name) || 'Sistema', userRole: '', action: 'create', entity: 'privacy_request', entityId: req.id, description: 'Solicitação LGPD: ' + r.requestType, ipAddress: '127.0.0.1' })
  }, [currentUserId, users, addAuditLogLocal])

  const updatePrivacyRequest = useCallback((id: string, updates: Partial<PrivacyRequest>) => {
    setPrivacyRequests(prev => prev.map(r => r.id === id ? { ...r, ...updates, processedAt: updates.status === 'completed' || updates.status === 'rejected' ? new Date().toISOString() : r.processedAt } : r))
    if (updates.status) {
      addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: 'update', entity: 'privacy_request', entityId: id, description: 'Atualizou solicitação de privacidade: ' + updates.status, ipAddress: '127.0.0.1' })
    }
  }, [currentUserId, users, addAuditLogLocal])

  return (
    <AdminContext.Provider value={{
      users, roles, permissions, auditLogs, lgpdConsents, privacyRequests,
      currentUserId, setCurrentUserId, currentUser,
      addUser, updateUser, deleteUser, toggleUserActive,
      getPermissionsForRole, getPermissionsForUser, checkPermission, updatePermission,
      addAuditLog, addLgpdConsent, revokeLgpdConsent, addPrivacyRequest, updatePrivacyRequest,
    }}>
      {children}
    </AdminContext.Provider>
  )
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
