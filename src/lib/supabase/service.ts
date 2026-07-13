import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

let _admin: ReturnType<typeof createClient> | null = null

function getAdmin() {
  if (_admin) return _admin
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  _admin = createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  return _admin
}

type TableName =
  | 'client_list' | 'client_contacts' | 'client_interactions' | 'client_documents' | 'client_feedbacks'
  | 'crm_companies' | 'crm_contacts' | 'crm_deals' | 'crm_proposals' | 'crm_contracts' | 'crm_activities' | 'crm_tasks'
  | 'admin_users' | 'admin_roles' | 'admin_permissions' | 'admin_audit_logs'
  | 'projects' | 'project_tasks'
  | 'companies'

export function requireAdmin() {
  const client = getAdmin()
  if (!client) throw new Error('Service unavailable: missing SUPABASE_SERVICE_ROLE_KEY')
  return client
}

export function apiError(message: string, status = 500) {
  return NextResponse.json({ error: message }, { status })
}

export function apiSuccess(data: any, status = 200) {
  return NextResponse.json(data, { status })
}

export function parseBody(request: Request): Promise<any> {
  return request.json().catch(() => {
    throw new Error('Invalid JSON body')
  })
}

export function db(table: TableName) {
  const admin = requireAdmin()
  return admin.from(table)
}

export function mapCamelToSnake(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const snake = key.replace(/[A-Z]/g, m => '_' + m.toLowerCase())
    result[snake] = value
  }
  return result
}

export function mapSnakeToCamel(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(obj)) {
    const camel = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
    result[camel] = value
  }
  return result
}
