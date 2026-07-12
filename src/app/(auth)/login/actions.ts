'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { setServerUsers, getServerUsers } from '@/lib/serverStore'
import { saveUsersToSupabase, loadUsersFromSupabase } from '@/lib/supabaseSync'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error && data?.user) {
      const cookieStore = await cookies()
      cookieStore.delete('sb-mock-session')
      revalidatePath('/', 'layout')
      redirect('/')
    }
  } catch (err: any) {
      }


  return { error: 'Credenciais inválidas.' }
}

export async function setSessionCookie(userId: string, userName: string, userRole: string) {
  const cookieStore = await cookies()
  cookieStore.set('sb-mock-session', JSON.stringify({ userId, userName, userRole }), { path: '/' })
  revalidatePath('/', 'layout')
}

export async function syncUsersToCookie(usersJson: string) {
  setServerUsers(usersJson)
  const cookieStore = await cookies()
  cookieStore.set('admin_users_cache', usersJson, { path: '/', maxAge: 86400 * 30 })
  // Sync to Supabase Storage (cross-device persistence)
  // Must await so the serverless function doesn't terminate before upload completes
  await saveUsersToSupabase(usersJson)
}

export async function getUsersFromCookie(): Promise<string | null> {
  // 1. In-memory server store (fastest, shared within same instance)
  const stored = getServerUsers()
  if (stored) return stored
  // 2. Request cookie (per-browser persistence)
  const cookieStore = await cookies()
  const val = cookieStore.get('admin_users_cache')?.value
  if (val) {
    setServerUsers(val)
    return val
  }
  // 3. Supabase Storage (cross-device shared, slowest)
  const supabaseData = await loadUsersFromSupabase()
  if (supabaseData) {
    setServerUsers(supabaseData)
    return supabaseData
  }
  return null
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (e) {
    // ignorar erros ao desconectar no modo offline
  }
  const cookieStore = await cookies()
  cookieStore.delete('sb-mock-session')
  redirect('/login')
}
