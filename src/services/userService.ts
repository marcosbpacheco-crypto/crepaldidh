import type { User, Permission, Role, AuditLog, LgpdConsent, PrivacyRequest } from '@/types/admin'
import type { Tenant, TenantPlan, TenantUsage } from '@/types/tenants'

const BASE = '/api/prisma/admin'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

function mapUser(u: any): User {
  if (!u) return u
  return {
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone || '',
    avatar: u.avatar || '',
    roleId: u.roleId || u.role_id || '',
    roleName: u.roleName || u.role_name || '',
    isExternal: u.isExternal ?? u.is_external ?? false,
    companyId: u.companyId || u.company_id || undefined,
    companyName: u.companyName || u.company_name || undefined,
    active: u.active ?? true,
    password: u.password || '',
    lastLogin: u.lastLogin || u.last_login || undefined,
    loginAttempts: u.loginAttempts ?? u.login_attempts ?? 0,
    mfaEnabled: u.mfaEnabled ?? u.mfa_enabled ?? false,
    createdAt: u.createdAt || u.created_at || '',
    tenantId: u.tenantId || u.tenant_id || undefined,
  }
}

function mapPermission(p: any): Permission {
  if (!p) return p
  return {
    id: p.id,
    roleId: p.roleId || p.role_id || undefined,
    userId: p.userId || p.user_id || undefined,
    module: p.module,
    canView: p.canView ?? p.can_view ?? false,
    canCreate: p.canCreate ?? p.can_create ?? false,
    canEdit: p.canEdit ?? p.can_edit ?? false,
    canDelete: p.canDelete ?? p.can_delete ?? false,
    canExport: p.canExport ?? p.can_export ?? false,
  }
}

function mapAuditLog(a: any): AuditLog {
  if (!a) return a
  return {
    id: a.id,
    userId: a.userId || a.user_id || '',
    userName: a.userName || a.user_name || '',
    userRole: a.userRole || a.user_role || '',
    action: a.action,
    entity: a.entity,
    entityId: a.entityId || a.entity_id || undefined,
    description: a.description || '',
    ipAddress: a.ipAddress || a.ip_address || '',
    createdAt: a.createdAt || a.created_at || '',
  }
}

function mapLgpdConsent(c: any): LgpdConsent {
  if (!c) return c
  return {
    id: c.id,
    userId: c.userId || c.user_id || '',
    consentType: c.consentType || c.consent_type || '',
    legalBasis: c.legalBasis || c.legal_basis || '',
    granted: c.granted ?? false,
    grantedAt: c.grantedAt || c.granted_at || undefined,
    revokedAt: c.revokedAt || c.revoked_at || undefined,
    version: c.version || '',
  }
}

function mapPrivacyRequest(r: any): PrivacyRequest {
  if (!r) return r
  return {
    id: r.id,
    userId: r.userId || r.user_id || '',
    userName: r.userName || r.user_name || '',
    requestType: r.requestType || r.request_type || '',
    status: r.status || 'pending',
    description: r.description || '',
    processedBy: r.processedBy || r.processed_by || undefined,
    processedAt: r.processedAt || r.processed_at || undefined,
    responseNotes: r.responseNotes || r.response_notes || undefined,
    createdAt: r.createdAt || r.created_at || '',
  }
}

export const userService = {
  async list(): Promise<User[]> {
    const data = await api(BASE)
    return (data.users || []).map(mapUser)
  },
  async getByEmail(email: string): Promise<User | null> {
    const data = await api(BASE)
    const u = (data.users || []).find((u: any) => u.email === email)
    return u ? mapUser(u) : null
  },
  async create(input: Partial<User>): Promise<User> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'user', ...input }),
    })
    return data.user ? mapUser(data.user) : data
  },
  async update(id: string, input: Partial<User>): Promise<User> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'user', id, ...input }),
    })
    return data.user ? mapUser(data.user) : data
  },
  async remove(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'user', id }),
    })
  },
  async listRoles(): Promise<Role[]> {
    const data = await api(BASE)
    return data.roles || []
  },
  async listPermissions(): Promise<Permission[]> {
    const data = await api(BASE)
    return (data.permissions || []).map(mapPermission)
  },
  async createPermission(input: Partial<Permission>): Promise<Permission> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'permission', ...input }),
    })
    return data.permission ? mapPermission(data.permission) : data
  },
  async listAuditLogs(): Promise<AuditLog[]> {
    const data = await api(BASE)
    return (data.auditLogs || []).map(mapAuditLog)
  },
  async listLgpdConsents(): Promise<LgpdConsent[]> {
    const data = await api(BASE)
    return (data.lgpdConsents || []).map(mapLgpdConsent)
  },
  async listPrivacyRequests(): Promise<PrivacyRequest[]> {
    const data = await api(BASE)
    return (data.privacyRequests || []).map(mapPrivacyRequest)
  },
  async listTenants(): Promise<Tenant[]> {
    const data = await api(BASE)
    return data.tenants || []
  },
  async listPlans(): Promise<TenantPlan[]> {
    const data = await api(BASE)
    return data.plans || []
  },
  async listUsage(): Promise<TenantUsage[]> {
    const data = await api(BASE)
    return data.usage || []
  },
}
