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
      revalidatePath('/', 'layout')
      redirect('/')
    }
  } catch (err: any) {
      }


  return { error: 'Credenciais inválidas.' }
}

export async function setSessionCookie(userId: string, userName: string, userRole: string) {
  const cookieStore = await cookies()
  cookieStore.set('session', JSON.stringify({ userId, userName, userRole }), {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 86400,
  })
  revalidatePath('/', 'layout')
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch (e) {
    // ignorar erros ao desconectar no modo offline
  }
  redirect('/login')
}
