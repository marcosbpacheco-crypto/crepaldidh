'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/userService'

export type ModuleName = 'crm' | 'clients' | 'projects' | 'nr01' | 'mentoring' | 'trainings' | 'financial' | 'calendar' | 'portal' | 'documents' | 'bi' | 'ai' | 'admin' | 'tasks' | 'alerts' | 'import' | 'assessoria'

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
  password: string
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
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => Promise<void>
  updateUser: (id: string, updates: Partial<User>) => Promise<void>
  deleteUser: (id: string) => Promise<void>
  toggleUserActive: (id: string) => Promise<void>
  getPermissionsForRole: (roleId: string) => Permission[]
  getPermissionsForUser: (userId: string) => Permission[]
  checkPermission: (module: ModuleName, action: 'view' | 'create' | 'edit' | 'delete' | 'export', userId?: string) => boolean
  updatePermission: (id: string, field: keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'>, value: boolean) => void
  setUserPermission: (userId: string, module: ModuleName, field: keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'>, value: boolean) => void
  addAuditLog: (entry: Omit<AuditLog, 'id' | 'createdAt'>) => void
  addLgpdConsent: (c: Omit<LgpdConsent, 'id' | 'grantedAt' | 'revokedAt'>) => void
  revokeLgpdConsent: (id: string) => void
  addPrivacyRequest: (r: Omit<PrivacyRequest, 'id' | 'createdAt' | 'processedAt'>) => void
  updatePrivacyRequest: (id: string, updates: Partial<PrivacyRequest>) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

function gid(): string { return 'adm-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) }

const MODULES: ModuleName[] = ['crm', 'clients', 'projects', 'nr01', 'mentoring', 'trainings', 'financial', 'calendar', 'portal', 'documents', 'bi', 'ai', 'admin', 'tasks', 'alerts', 'import', 'assessoria']

const SEED_ROLES: Role[] = [
  { id: 'role-admin', name: 'admin', label: 'Administrador', description: 'Acesso total ao sistema', isExternal: false },
  { id: 'role-director', name: 'director', label: 'Diretor', description: 'Acesso a todos os módulos sem configurações', isExternal: false },
  { id: 'role-consultant', name: 'consultant', label: 'Consultor', description: 'Acesso a CRM, NR01, mentorias, treinamentos, documentos', isExternal: false },
  { id: 'role-commercial', name: 'commercial', label: 'Comercial', description: 'Acesso a CRM, propostas, pipeline comercial', isExternal: false },
  { id: 'role-finance', name: 'finance', label: 'Financeiro', description: 'Acesso a financeiro, cobranças, relatórios', isExternal: false },
  { id: 'role-rh', name: 'rh', label: 'RH', description: 'Acesso a treinamentos, agenda, documentos de RH', isExternal: false },
  { id: 'role-dho', name: 'dho', label: 'Analista de DHO', description: 'Acesso a CRM, mentorias, treinamentos, calendário, documentos, tarefas', isExternal: false },
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
    const isDho = role.name === 'dho'
    const isExternal = role.isExternal
    MODULES.forEach(mod => {
      const assessoriaModules = ['crm', 'projects', 'mentoring', 'trainings', 'calendar', 'documents', 'tasks', 'alerts', 'portal', 'nr01', 'assessoria']
      const coreModules = ['crm', 'projects', 'nr01', 'mentoring', 'trainings', 'documents', 'assessoria']
      const canView = isAdmin || isDirector || (isConsultant && coreModules.includes(mod)) || (isCommercial && ['crm', 'clients'].includes(mod)) || (isFinance && ['crm', 'financial'].includes(mod)) || (isRh && ['trainings', 'calendar', 'documents'].includes(mod)) || (isOperational && ['projects', 'nr01', 'documents'].includes(mod)) || (isDho && assessoriaModules.includes(mod)) || (isExternal && ['portal'].includes(mod))
      const canCreate = isAdmin || (coreModules.includes(mod) && (isAdmin || isDirector || isConsultant || isDho || (isCommercial && mod === 'crm') || (isFinance && mod === 'financial') || (isRh && ['trainings', 'calendar'].includes(mod))))
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

// BOOTSTRAP_ADMIN — usado apenas quando NENHUM usuario existe (sistema novo)
// Apos o primeiro login, o usuario bootstrap nunca mais e referenciado
const BOOTSTRAP_ADMIN: User = {
  id: 'user-admin', name: 'Administrador Master', email: 'admin@crepaldidh.com.br',
  phone: '(11) 99999-0000', avatar: 'AD', roleId: 'role-admin', roleName: 'Administrador',
  isExternal: false, active: true, password: 'admin123', loginAttempts: 0, mfaEnabled: false,
  createdAt: '2025-01-01T00:00:00Z', tenantId: 'tnt-crepaldi',
}

// IDs do antigo SEED_USERS (hardcoded) que devem ser removidos na migracao.
// Usuarios CRIADOS DINAMICAMENTE tem prefixo 'adm-' e sao preservados.
const OLD_SEED_IDS = new Set(['user-admin', 'user-dir', 'user-cons', 'user-comm', 'user-fin', 'user-rh', 'user-dho', 'user-op'])

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [lgpdConsents, setLgpdConsents] = useState<LgpdConsent[]>([])
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([])
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null)

  const setCurrentUserId = useCallback((id: string | null) => {
    setCurrentUserIdState(id)
  }, [])

  const queryClient = useQueryClient()

  // Load from API on mount
  useEffect(() => {
    if (typeof window === 'undefined') return
    setPermissions(buildSeedPermissions())
    setAuditLogs([])
    setLgpdConsents([])
    setPrivacyRequests([])

    // Restore session from cookie (not httpOnly, accessible via document.cookie)
    try {
      const raw = document.cookie.split('; ').find(c => c.startsWith('session='))
      if (raw) {
        const parsed = JSON.parse(decodeURIComponent(raw.split('=')[1]))
        if (parsed.userId) setCurrentUserIdState(parsed.userId)
      }
    } catch { /* ignore */ }

    // Load from service
    Promise.all([
      userService.list(),
      userService.listPermissions(),
      userService.listAuditLogs(),
      userService.listLgpdConsents(),
      userService.listPrivacyRequests(),
    ]).then(([remoteUsers, perms, audits, lgpd, priv]) => {
      if (remoteUsers.length > 0) setUsers(remoteUsers)
      if (perms.length > 0) setPermissions(perms)
      if (audits.length > 0) setAuditLogs(audits)
      if (lgpd.length > 0) setLgpdConsents(lgpd)
      if (priv.length > 0) setPrivacyRequests(priv)
    }).catch((err) => console.error('[AdminContext] load error:', err))
  }, [])

  // Sync users to service
  useEffect(() => {
    if (users.length === 0) return
    const timer = setTimeout(() => {
      userService.saveAll({ users }).catch((err) => console.error('[AdminContext] save users error:', err))
    }, 500)
    return () => clearTimeout(timer)
  }, [users])

  // Sync admin collections to service
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasData = permissions.length > 0 || auditLogs.length > 0 || lgpdConsents.length > 0 || privacyRequests.length > 0
    if (!hasData) return
    const timer = setTimeout(() => {
      userService.saveAll({ permissions, auditLogs, lgpdConsents, privacyRequests })
        .catch((err) => console.error('[AdminContext] save collections error:', err))
    }, 500)
    return () => clearTimeout(timer)
  }, [permissions, auditLogs, lgpdConsents, privacyRequests])

  // Cross-device sync is UNIDIRECTIONAL: local → server only.
  // A direcao reversa (server → local) nao deve restaurar usuarios deletados.

  const roles = SEED_ROLES

  const currentUser = useMemo(() => users.find(u => u.id === currentUserId) || null, [users, currentUserId])

  const addUser = useCallback(async (u: Omit<User, 'id' | 'createdAt'>) => {
    // Try API first
    let createdUserId: string | null = null
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: u.email,
          password: u.password,
          name: u.name,
          phone: u.phone,
          avatar: u.avatar,
          role_id: u.roleId,
          role_name: u.roleName,
          is_external: u.isExternal,
          company_id: u.companyId,
          company_name: u.companyName,
          active: u.active,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        createdUserId = data.user.id
      } else {
        const errData = await res.json().catch(() => ({}))
        console.warn('API create user failed, falling back to local:', errData.error || res.status)
      }
    } catch (err) {
      console.warn('Network error creating user, falling back to local:', err)
    }

    // Create user in local state
    const newUser: User = {
      ...u,
      id: createdUserId || gid(),
      createdAt: new Date().toISOString(),
    }
    setUsers(prev => [...prev, newUser])
    addAuditLogLocal({
      userId: currentUserId || '',
      userName: users.find(x => x.id === currentUserId)?.name || 'Sistema',
      userRole: 'admin', action: 'create', entity: 'user',
      entityId: newUser.id,
      description: 'Criou usuário: ' + newUser.name,
      ipAddress: '127.0.0.1',
    })
  }, [currentUserId, users])

  const updateUser = useCallback(async (id: string, updates: Partial<User>) => {
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          email: updates.email,
          name: updates.name,
          phone: updates.phone,
          avatar: updates.avatar,
          role_id: updates.roleId,
          role_name: updates.roleName,
          is_external: updates.isExternal,
          company_id: updates.companyId,
          company_name: updates.companyName,
          active: updates.active,
        }),
      })
    } catch (err) {
      console.warn('API update user failed, falling back to local:', err)
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updates } : u))
  }, [])

  const deleteUser = useCallback(async (id: string) => {
    const user = users.find(u => u.id === id)
    if (!user) return
    try {
      await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
    } catch (err) {
      console.warn('API delete user failed, falling back to local:', err)
    }
    // Soft delete: marca como inativo em vez de remover — dados preservados para auditoria
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: false } : u))
    addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: 'delete', entity: 'user', entityId: id, description: 'Excluiu (desativou) usuário: ' + user.name, ipAddress: '127.0.0.1' })
  }, [currentUserId, users])

  const toggleUserActive = useCallback(async (id: string) => {
    const user = users.find(u => u.id === id)
    if (!user) return
    const becomingActive = !user.active
    try {
      await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, active: becomingActive }),
      })
    } catch (err) {
      console.warn('API toggle active failed, falling back to local:', err)
    }
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: becomingActive } : u))
    addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: becomingActive ? 'update' : 'delete', entity: 'user', entityId: id, description: (becomingActive ? 'Ativou' : 'Desativou') + ' usuário: ' + user.name, ipAddress: '127.0.0.1' })
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
    const fieldMap: Record<string, keyof Permission> = { view: 'canView', create: 'canCreate', edit: 'canEdit', delete: 'canDelete', export: 'canExport' }
    const field = fieldMap[action]
    if (userPerms.length > 0) return userPerms.some(p => p[field])
    return rolePerms.some(p => p[field])
  }, [currentUserId, users, getPermissionsForRole, getPermissionsForUser])

  const setUserPermission = useCallback((userId: string, module: ModuleName, field: keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'>, value: boolean) => {
    setPermissions(prev => {
      const existing = prev.find(p => p.userId === userId && p.module === module)
      if (existing) {
        return prev.map(p => p.id === existing.id ? { ...p, [field]: value } : p)
      }
      const user = users.find(u => u.id === userId)
      const rolePerms = prev.filter(p => p.roleId === user?.roleId && p.module === module)
      const defaults = { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
      if (rolePerms.length > 0) {
        const rp = rolePerms[0]
        defaults.canView = rp.canView; defaults.canCreate = rp.canCreate
        defaults.canEdit = rp.canEdit; defaults.canDelete = rp.canDelete
        defaults.canExport = rp.canExport
      }
      return [...prev, { id: gid(), userId, module, ...defaults, [field]: value }]
    })
    const perm = permissions.find(p => p.userId === userId && p.module === module)
    addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: 'update', entity: 'user_permission', entityId: userId, description: 'Permissão ' + field + ' em ' + module + ' alterada para ' + (value ? 'concedido' : 'negado') + ' (usuário)', ipAddress: '127.0.0.1' })
  }, [currentUserId, users, permissions])

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
      getPermissionsForRole, getPermissionsForUser, checkPermission, updatePermission, setUserPermission,
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
