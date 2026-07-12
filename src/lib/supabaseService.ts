// @ts-nocheck
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string

let client: ReturnType<typeof createClient> | null = null

function getClient() {
  if (!client) {
    if (!supabaseUrl || !supabaseAnonKey) return null
    client = createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return client
}

export async function fetchAll<T>(table: string): Promise<T[]> {
  const c = getClient()
  if (!c) return []
  const { data, error } = await c.from(table).select('*')
  if (error) {
    console.error(`supabaseService.fetchAll(${table}):`, error.message)
    return []
  }
  return (data || []) as T[]
}

export async function fetchById<T>(table: string, id: string): Promise<T | null> {
  const c = getClient()
  if (!c) return null
  const { data, error } = await c.from(table).select('*').eq('id', id).single()
  if (error) {
    console.error(`supabaseService.fetchById(${table}, ${id}):`, error.message)
    return null
  }
  return data as T
}

export async function insert<T>(table: string, record: T): Promise<T | null> {
  const c = getClient()
  if (!c) return null
  const { data, error } = await c.from(table).insert(record as any).select().single()
  if (error) {
    console.error(`supabaseService.insert(${table}):`, error.message)
    return null
  }
  return data as T
}

export async function update<T>(table: string, id: string, updates: Partial<T>): Promise<T | null> {
  const c = getClient()
  if (!c) return null
  const { data, error } = await c.from(table).update(updates as any).eq('id', id).select().single()
  if (error) {
    console.error(`supabaseService.update(${table}, ${id}):`, error.message)
    return null
  }
  return data as T
}

export async function remove(table: string, id: string): Promise<boolean> {
  const c = getClient()
  if (!c) return false
  const { error } = await c.from(table).delete().eq('id', id)
  if (error) {
    console.error(`supabaseService.remove(${table}, ${id}):`, error.message)
    return false
  }
  return true
}

export async function upsert<T>(table: string, records: T[]): Promise<boolean> {
  const c = getClient()
  if (!c) return false
  const { error } = await c.from(table).upsert(records as any)
  if (error) {
    console.error(`supabaseService.upsert(${table}):`, error.message)
    return false
  }
  return true
}

export async function replaceAll<T>(table: string, records: T[]): Promise<boolean> {
  const c = getClient()
  if (!c) return false
  const { error: delErr } = await c.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000')
  if (delErr) {
    console.error(`supabaseService.replaceAll(${table}) delete:`, delErr.message)
    return false
  }
  if (records.length === 0) return true
  const { error: insErr } = await c.from(table).insert(records as any)
  if (insErr) {
    console.error(`supabaseService.replaceAll(${table}) insert:`, insErr.message)
    return false
  }
  return true
}
