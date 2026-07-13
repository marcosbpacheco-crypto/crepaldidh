import { getClient, handleError } from './base'
import type { User, Permission, Role, AuditLog, LgpdConsent, PrivacyRequest } from '@/types/admin'
import type { Tenant, TenantPlan, TenantUsage, TenantBilling } from '@/types/tenants'

const USERS_TABLE = 'admin_users'
const ROLES_TABLE = 'admin_roles'
const PERMISSIONS_TABLE = 'admin_permissions'
const AUDIT_LOGS_TABLE = 'admin_audit_logs'
const LGPD_TABLE = 'admin_lgpd_consents'
const PRIVACY_TABLE = 'admin_privacy_requests'
const TENANTS_TABLE = 'admin_tenants'
const PLANS_TABLE = 'admin_plans'
const USAGE_TABLE = 'admin_tenant_usage'

export const userService = {
  async saveAll(data: {
    users?: User[]
    permissions?: Permission[]
    auditLogs?: AuditLog[]
    lgpdConsents?: LgpdConsent[]
    privacyRequests?: PrivacyRequest[]
  }): Promise<void> {
    const supabase = getClient()
    const jobs: Promise<any>[] = []
    if (data.users?.length) jobs.push(Promise.resolve(supabase.from(USERS_TABLE).upsert(data.users)))
    if (data.permissions?.length) jobs.push(Promise.resolve(supabase.from(PERMISSIONS_TABLE).upsert(data.permissions)))
    if (data.auditLogs?.length) jobs.push(Promise.resolve(supabase.from(AUDIT_LOGS_TABLE).upsert(data.auditLogs)))
    if (data.lgpdConsents?.length) jobs.push(Promise.resolve(supabase.from(LGPD_TABLE).upsert(data.lgpdConsents)))
    if (data.privacyRequests?.length) jobs.push(Promise.resolve(supabase.from(PRIVACY_TABLE).upsert(data.privacyRequests)))
    await Promise.allSettled(jobs)
  },
  async list(): Promise<User[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(USERS_TABLE).select('*').order('name')
    if (error) handleError(error, 'userService.list')
    return data || []
  },
  async getByEmail(email: string): Promise<User | null> {
    const supabase = getClient()
    const { data, error } = await supabase.from(USERS_TABLE).select('*').eq('email', email).maybeSingle()
    if (error) return null
    return data
  },
  async create(input: Partial<User>): Promise<User> {
    const supabase = getClient()
    const { data, error } = await supabase.from(USERS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'userService.create')
    return data!
  },
  async update(id: string, input: Partial<User>): Promise<User> {
    const supabase = getClient()
    const { data, error } = await supabase.from(USERS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'userService.update')
    return data!
  },
  async remove(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(USERS_TABLE).update({ active: false }).eq('id', id)
    if (error) handleError(error, 'userService.remove')
  },
  async listRoles(): Promise<Role[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(ROLES_TABLE).select('*')
    if (error) handleError(error, 'userService.listRoles')
    return data || []
  },
  async listPermissions(): Promise<Permission[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PERMISSIONS_TABLE).select('*')
    if (error) handleError(error, 'userService.listPermissions')
    return data || []
  },
  async createPermission(input: Partial<Permission>): Promise<Permission> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PERMISSIONS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'userService.createPermission')
    return data!
  },
  async listAuditLogs(): Promise<AuditLog[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(AUDIT_LOGS_TABLE).select('*').order('created_at', { ascending: false })
    if (error) handleError(error, 'userService.listAuditLogs')
    return data || []
  },
  async listLgpdConsents(): Promise<LgpdConsent[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(LGPD_TABLE).select('*')
    if (error) handleError(error, 'userService.listLgpdConsents')
    return data || []
  },
  async listPrivacyRequests(): Promise<PrivacyRequest[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PRIVACY_TABLE).select('*').order('created_at', { ascending: false })
    if (error) handleError(error, 'userService.listPrivacyRequests')
    return data || []
  },
  async listTenants(): Promise<Tenant[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(TENANTS_TABLE).select('*')
    if (error) handleError(error, 'userService.listTenants')
    return data || []
  },
  async listPlans(): Promise<TenantPlan[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PLANS_TABLE).select('*')
    if (error) handleError(error, 'userService.listPlans')
    return data || []
  },
  async listUsage(): Promise<TenantUsage[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(USAGE_TABLE).select('*')
    if (error) handleError(error, 'userService.listUsage')
    return data || []
  },
}
