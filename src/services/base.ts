'use client'
import { createClient } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'

export function getClient(): SupabaseClient {
  return createClient()
}

export function handleError(err: unknown, context: string): never {
  const msg = err instanceof Error ? err.message : String(err)
  console.error(`[${context}] ${msg}`)
  throw new Error(msg)
}
