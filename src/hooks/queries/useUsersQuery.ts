import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { userService } from '@/services/userService'
import type { User, Permission, AuditLog, LgpdConsent, PrivacyRequest } from '@/types/admin'
import type { Tenant, TenantPlan, TenantUsage } from '@/types/tenants'

const BASE_KEY = ['admin']

export function useUsersQuery() {
  return useQuery({
    queryKey: [...BASE_KEY, 'users'],
    queryFn: () => userService.list(),
  })
}
export function useCreateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Partial<User>) => userService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'users'] }),
  })
}
export function useUpdateUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<User>) => userService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'users'] }),
  })
}
export function useDeleteUser() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => userService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: [...BASE_KEY, 'users'] }),
  })
}

export function usePermissionsQuery() {
  return useQuery({
    queryKey: [...BASE_KEY, 'permissions'],
    queryFn: () => userService.listPermissions(),
  })
}
export function useAuditLogsQuery() {
  return useQuery({
    queryKey: [...BASE_KEY, 'auditLogs'],
    queryFn: () => userService.listAuditLogs(),
  })
}
export function useLgpdConsentsQuery() {
  return useQuery({
    queryKey: [...BASE_KEY, 'lgpd'],
    queryFn: () => userService.listLgpdConsents(),
  })
}
export function usePrivacyRequestsQuery() {
  return useQuery({
    queryKey: [...BASE_KEY, 'privacy'],
    queryFn: () => userService.listPrivacyRequests(),
  })
}
export function useTenantsQuery() {
  return useQuery({
    queryKey: [...BASE_KEY, 'tenants'],
    queryFn: () => userService.listTenants(),
  })
}
export function usePlansQuery() {
  return useQuery({
    queryKey: [...BASE_KEY, 'plans'],
    queryFn: () => userService.listPlans(),
  })
}
