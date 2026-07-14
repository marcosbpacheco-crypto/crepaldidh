import type { User, Permission, Role, AuditLog, LgpdConsent, PrivacyRequest } from '@/types/admin'
import type { Tenant, TenantPlan, TenantUsage } from '@/types/tenants'

const BASE = '/api/prisma/admin'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const userService = {
  async saveAll(data: {
    users?: User[]
    permissions?: Permission[]
    auditLogs?: AuditLog[]
    lgpdConsents?: LgpdConsent[]
    privacyRequests?: PrivacyRequest[]
  }): Promise<void> {
    const jobs: Promise<any>[] = []
    for (const u of data.users || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'user', ...u }) }).catch(() => {}))
    }
    for (const p of data.permissions || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'permission', ...p }) }).catch(() => {}))
    }
    for (const a of data.auditLogs || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'auditLog', ...a }) }).catch(() => {}))
    }
    for (const l of data.lgpdConsents || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'lgpdConsent', ...l }) }).catch(() => {}))
    }
    for (const p of data.privacyRequests || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'privacyRequest', ...p }) }).catch(() => {}))
    }
    await Promise.allSettled(jobs)
  },
  async list(): Promise<User[]> {
    const data = await api(BASE)
    return data.users || []
  },
  async getByEmail(email: string): Promise<User | null> {
    const data = await api(BASE)
    return (data.users || []).find((u: any) => u.email === email) || null
  },
  async create(input: Partial<User>): Promise<User> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'user', ...input }),
    })
    return data.user || data
  },
  async update(id: string, input: Partial<User>): Promise<User> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'user', id, ...input }),
    })
    return data.user || data
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
    return data.permissions || []
  },
  async createPermission(input: Partial<Permission>): Promise<Permission> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'permission', ...input }),
    })
    return data.permission || data
  },
  async listAuditLogs(): Promise<AuditLog[]> {
    const data = await api(BASE)
    return data.auditLogs || []
  },
  async listLgpdConsents(): Promise<LgpdConsent[]> {
    const data = await api(BASE)
    return data.lgpdConsents || []
  },
  async listPrivacyRequests(): Promise<PrivacyRequest[]> {
    const data = await api(BASE)
    return data.privacyRequests || []
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
