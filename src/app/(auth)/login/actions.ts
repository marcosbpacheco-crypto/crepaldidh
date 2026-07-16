'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { prisma } from '@/lib/prisma'
import { createClient as createAdminClient } from '@supabase/supabase-js'

export async function login(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'E-mail e senha são obrigatórios.' }
  }

  try {
    // 1. Try Supabase Auth sign-in first
    const supabase = await createClient()
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      // Auth error (wrong password, user not found, etc.)
      console.log('[login] signIn error:', error.message)
    }

    if (!error && data?.user) {
      console.log('[login] signIn OK, userId:', data.user.id)

      // Auth user exists and credentials match — sign in successful
      const authId = data.user.id

      // Find or create admin_users profile
      let profile = await prisma.admin_users.findUnique({ where: { id: authId } })
      if (!profile) {
        profile = await prisma.admin_users.create({
          data: {
            id: authId,
            email,
            name: data.user.user_metadata?.name || email.split('@')[0],
            role_name: data.user.user_metadata?.role_name || 'Administrador',
            active: true,
            phone: '',
            avatar: '',
          },
        })
        console.log('[login] admin_users profile created for:', authId)
      }

      // Check if user is active
      if (!profile.active) {
        await supabase.auth.signOut()
        return { error: 'Usuário inativo. Contate o administrador.' }
      }

      // Set legacy session cookie for middleware + AdminContext
      const cookieStore = await cookies()
      cookieStore.set('session', JSON.stringify({
        userId: authId,
        userName: profile.name,
        userRole: profile.role_name,
      }), {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24h
      })

      revalidatePath('/', 'layout')
      return { success: true, userId: authId }
    }

    // 2. If Supabase Auth failed, check legacy admin_users table (migration path)
    const legacyUser = await prisma.admin_users.findFirst({
      where: { email, active: true },
    })

    if (legacyUser && legacyUser.password === password) {
      console.log('[login] legacy user found, migrating:', legacyUser.email)

      // Migrate this user to Supabase Auth
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceKey) {
        try {
          const adminClient = createAdminClient(supabaseUrl, serviceKey, {
            auth: { autoRefreshToken: false, persistSession: false },
          })

          const { data: created, error: createError } = await adminClient.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: { name: legacyUser.name, role_name: legacyUser.role_name },
          })

          if (!createError && created?.user) {
            const newId = created.user.id

            // Update admin_users id to match auth user id
            await prisma.admin_users.update({
              where: { id: legacyUser.id },
              data: { id: newId },
            })

            // Sign in via Supabase Auth
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password })

            if (!signInError && signInData?.user) {
              const cookieStore = await cookies()
              cookieStore.set('session', JSON.stringify({
                userId: newId,
                userName: legacyUser.name,
                userRole: legacyUser.role_name,
              }), {
                path: '/',
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'lax',
                maxAge: 60 * 60 * 24,
              })

              revalidatePath('/', 'layout')
              return { success: true, userId: newId }
            }
          }
        } catch (migrateErr) {
          console.warn('[login] Supabase migration failed, falling back to legacy cookie:', migrateErr)
        }
      }

      // Fallback: use legacy session cookie if Supabase migration fails
      const cookieStore = await cookies()
      cookieStore.set('session', JSON.stringify({
        userId: legacyUser.id,
        userName: legacyUser.name,
        userRole: legacyUser.role_name,
      }), {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24,
      })

      revalidatePath('/', 'layout')
      return { success: true, userId: legacyUser.id }
    }

    if (legacyUser && !legacyUser.active) {
      return { error: 'Usuário inativo. Contate o administrador.' }
    }

    return { error: 'E-mail ou senha inválidos.' }
  } catch (err: any) {
    console.error('[login] error:', err?.message || err)
    return { error: 'Erro ao conectar ao servidor. Tente novamente.' }
  }
}

export async function setSessionCookie(userId: string, userName: string, userRole: string) {
  const cookieStore = await cookies()
  cookieStore.set('session', JSON.stringify({ userId, userName, userRole }), {
    path: '/',
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24,
  })
  revalidatePath('/', 'layout')
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Ignore Supabase signOut errors
  }

  try {
    const cookieStore = await cookies()
    cookieStore.delete('session')
  } catch {
    // Ignore cookie errors
  }

  revalidatePath('/', 'layout')
}
