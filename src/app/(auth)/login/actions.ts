'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'

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
    console.log('Tentativa de login via Supabase falhou (provavelmente offline):', err.message)
  }

  // Fallback de desenvolvimento local se o Supabase estiver inativo ou indisponível
  const mockEmail = process.env.MOCK_LOGIN_EMAIL || 'admin@crepaldidh.com.br'
  const mockPass = process.env.MOCK_LOGIN_PASSWORD || 'admin'
  if (email === mockEmail && password === mockPass) {
    const cookieStore = await cookies()
    cookieStore.set('sb-mock-session', 'true', { path: '/' })
    revalidatePath('/', 'layout')
    redirect('/')
  }

  return { error: 'Credenciais inválidas.' }
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

