import type { Tenant } from '@/types/tenants'

export interface Project {
  id: string; company_id: string; tenant_id?: string; name: string; description?: string; status: string
  responsible_user_id?: string; start_date?: string; end_date?: string; created_by?: string
  created_at?: string; updated_at?: string; deleted_at?: string
}
export interface ProjectTask {
  id: string; project_id: string; tenant_id?: string; title: string; description?: string; status: string
  priority: string; assigned_to?: string; due_date?: string; created_by?: string
  created_at?: string; updated_at?: string; deleted_at?: string
}
