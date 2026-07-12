'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'

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
  addUser: (u: Omit<User, 'id' | 'createdAt'>) => User
  updateUser: (id: string, updates: Partial<User>) => void
  deleteUser: (id: string) => void
  toggleUserActive: (id: string) => void
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

function seedAuditLogs(): AuditLog[] {
  return []
}

function seedLgpdConsents(): LgpdConsent[] {
  return []
}

function seedPrivacyRequests(): PrivacyRequest[] {
  return []
}

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [users, setUsers] = useState<User[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [lgpdConsents, setLgpdConsents] = useState<LgpdConsent[]>([])
  const [privacyRequests, setPrivacyRequests] = useState<PrivacyRequest[]>([])
  const [currentUserId, setCurrentUserIdState] = useState<string | null>(null)

  const setCurrentUserId = useCallback((id: string | null) => {
    setCurrentUserIdState(id)
    try {
      if (id) {
        const usersData = JSON.parse(localStorage.getItem('admin_users') || '[]')
        const user = usersData.find((u: User) => u.id === id)
        if (user) {
          localStorage.setItem('current_user', JSON.stringify({ id: user.id, name: user.name, email: user.email, roleId: user.roleId, roleName: user.roleName }))
        }
      }
    } catch {}
  }, [])

  const loadedRef = useRef(false)

  useEffect(() => {
    if (loadedRef.current) return
    loadedRef.current = true

    // 1. Load from localStorage FIRST (synchronous — menu precisa ver usuarios imediatamente)
    const loadFromLocal = () => {
      try {
        const p = localStorage.getItem('admin_permissions'); if (p) setPermissions(JSON.parse(p)); else setPermissions(buildSeedPermissions())
        const a = localStorage.getItem('admin_audit_logs'); if (a) setAuditLogs(JSON.parse(a)); else setAuditLogs(seedAuditLogs())
        const l = localStorage.getItem('admin_lgpd_consents'); if (l) setLgpdConsents(JSON.parse(l)); else setLgpdConsents(seedLgpdConsents())
        const r = localStorage.getItem('admin_privacy_requests'); if (r) setPrivacyRequests(JSON.parse(r)); else setPrivacyRequests(seedPrivacyRequests())
        const u = localStorage.getItem('admin_users'); if (u) { const p: User[] = JSON.parse(u); if (Array.isArray(p)) setUsers(p) }
      } catch {
        setPermissions(buildSeedPermissions()); setAuditLogs(seedAuditLogs()); setLgpdConsents(seedLgpdConsents())
        setPrivacyRequests(seedPrivacyRequests())
      }
      try {
        const stored = localStorage.getItem('current_user')
        if (stored) { const cu = JSON.parse(stored); setCurrentUserId(cu.id || 'user-admin') }
        else setCurrentUserId('user-admin')
      } catch { setCurrentUserId('user-admin') }
    }
    loadFromLocal()

    // 2. Load users from API (async — só sobrescreve se API retornar dados não-vazios)
    // e se o usuario logado ainda estiver presente nos dados remotos
    const loadUsers = async () => {
      try {
        const res = await fetch('/api/sync-admin-users')
        if (res.ok) {
          const { users: remoteUsers } = await res.json()
          if (Array.isArray(remoteUsers) && remoteUsers.length > 0) {
            // So sobrescreve se usuario logado estiver presente nos dados remotos
            const stored = localStorage.getItem('current_user')
            const currentId = stored ? JSON.parse(stored).id : null
            if (currentId && remoteUsers.some((u: User) => u.id === currentId)) {
              setUsers(remoteUsers)
              localStorage.setItem('admin_users', JSON.stringify(remoteUsers))
            }
          }
        }
      } catch {}
    }
    loadUsers()

    // 3. Load admin collections from API (async — só sobrescreve se API retornar dados não-vazios)
    fetch('/api/sync/admin')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data) {
          const d = res.data
          const localEmpty = (key: string) => {
            try { const s = localStorage.getItem(key); return !s || JSON.parse(s).length === 0 } catch { return true }
          }
          if (localEmpty('admin_permissions') && Array.isArray(d.permissions) && d.permissions.length > 0) setPermissions(d.permissions as Permission[])
          if (localEmpty('admin_audit_logs') && Array.isArray(d.auditLogs) && d.auditLogs.length > 0) setAuditLogs(d.auditLogs as AuditLog[])
          if (localEmpty('admin_lgpd_consents') && Array.isArray(d.lgpdConsents) && d.lgpdConsents.length > 0) setLgpdConsents(d.lgpdConsents as LgpdConsent[])
          if (localEmpty('admin_privacy_requests') && Array.isArray(d.privacyRequests) && d.privacyRequests.length > 0) setPrivacyRequests(d.privacyRequests as PrivacyRequest[])
          for (const [k, v] of Object.entries(d)) { if (Array.isArray(v) && v.length > 0) localStorage.setItem(`admin_${k}`, JSON.stringify(v)) }
        }
      })
      .catch(() => {})

  }, [])
  useEffect(() => {
    if (users.length === 0) return
    localStorage.setItem('admin_users', JSON.stringify(users))
    const timer = setTimeout(() => {
      fetch('/api/sync-admin-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ users }),
      }).catch(() => {})
    }, 500)
    return () => clearTimeout(timer)
  }, [users])

  // Persist admin collections to localStorage + Supabase (via /api/sync/admin)
  // So persiste se houver dados reais (evita corromper bucket do Supabase com arrays vazios)
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasData = permissions.length > 0 || auditLogs.length > 0 || lgpdConsents.length > 0 || privacyRequests.length > 0
    if (!hasData) return
    const timer = setTimeout(() => {
      const payload = { permissions, auditLogs, lgpdConsents, privacyRequests }
      fetch('/api/sync/admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merged: payload }),
      }).catch(() => {})
      localStorage.setItem('admin_permissions', JSON.stringify(permissions))
      localStorage.setItem('admin_audit_logs', JSON.stringify(auditLogs))
      localStorage.setItem('admin_lgpd_consents', JSON.stringify(lgpdConsents))
      localStorage.setItem('admin_privacy_requests', JSON.stringify(privacyRequests))
    }, 500)
    return () => clearTimeout(timer)
  }, [permissions, auditLogs, lgpdConsents, privacyRequests])

  // Cross-device sync is UNIDIRECTIONAL: local → server only.
  // A direcao reversa (server → local) nao deve restaurar usuarios deletados.
  // O sync server→local ocorre apenas via LoginForm.handleSubmit com localStorage vencendo.

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
    if (!user) return
    // Soft delete: marca como inativo em vez de remover — dados preservados para auditoria
    setUsers(prev => prev.map(u => u.id === id ? { ...u, active: false } : u))
    addAuditLogLocal({ userId: currentUserId || '', userName: users.find(x => x.id === currentUserId)?.name || 'Sistema', userRole: 'admin', action: 'delete', entity: 'user', entityId: id, description: 'Excluiu (desativou) usuário: ' + user.name, ipAddress: '127.0.0.1' })
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
    // Se usuario esta em localStorage mas ainda nao foi carregado no state, permite acesso
    if (!user) {
      try {
        const stored = localStorage.getItem('admin_users')
        if (stored) {
          const localUsers: User[] = JSON.parse(stored)
          const localUser = localUsers.find(u => u.id === uid)
          if (localUser && localUser.roleName === 'Administrador') return true
        }
      } catch {}
      return false
    }
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
