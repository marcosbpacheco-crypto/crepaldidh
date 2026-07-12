// @ts-nocheck
import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, role_id, role_name } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'email, password e name sao obrigatorios' }, { status: 400 })
    }

    // Validate requester is admin
    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role_name').eq('id', authUser.id).single()
    if (!profile || profile.role_name !== 'Administrador') {
      return NextResponse.json({ error: 'Apenas administradores podem criar usuarios' }, { status: 403 })
    }

    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Servico indisponivel' }, { status: 500 })

    // Create auth user
    const { data: newUser, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 })
    }

    // Upsert profile (trigger may have auto-created one)
    const { error: profileError } = await admin.from('profiles').upsert({
      id: newUser.user.id,
      name,
      email,
      role_id: role_id || 'role-user',
      role_name: role_name || 'Usuário',
      active: true,
    }, { onConflict: 'id' })

    if (profileError) {
      // Rollback: delete auth user
      await admin.auth.admin.deleteUser(newUser.user.id)
      return NextResponse.json({ error: 'Erro ao criar perfil: ' + profileError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        name,
        email,
        role_id: role_id || 'role-user',
        role_name: role_name || 'Usuário',
        active: true,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, email, password, name, role_id, role_name, active } = body
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role_name').eq('id', authUser.id).single()
    if (!profile || profile.role_name !== 'Administrador') {
      return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 })
    }

    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Servico indisponivel' }, { status: 500 })

    // Update auth user if needed
    if (email || password) {
      const authUpdates: any = {}
      if (email) authUpdates.email = email
      if (password) authUpdates.password = password
      const { error: authErr } = await admin.auth.admin.updateUserById(id, authUpdates)
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
    }

    // Update profile
    const profileUpdates: any = {}
    if (name !== undefined) profileUpdates.name = name
    if (role_id !== undefined) profileUpdates.role_id = role_id
    if (role_name !== undefined) profileUpdates.role_name = role_name
    if (active !== undefined) profileUpdates.active = active
    if (email !== undefined) profileUpdates.email = email

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileErr } = await admin.from('profiles').update(profileUpdates).eq('id', id)
      if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

    const supabase = await createClient()
    const { data: { user: authUser } } = await supabase.auth.getUser()
    if (!authUser) return NextResponse.json({ error: 'Nao autenticado' }, { status: 401 })

    const { data: profile } = await supabase.from('profiles').select('role_name').eq('id', authUser.id).single()
    if (!profile || profile.role_name !== 'Administrador') {
      return NextResponse.json({ error: 'Apenas administradores' }, { status: 403 })
    }

    const admin = getAdminClient()
    if (!admin) return NextResponse.json({ error: 'Servico indisponivel' }, { status: 500 })

    // Soft delete: mark as inactive
    const { error: deleteErr } = await admin.from('profiles').update({
      active: false,
    }).eq('id', id)

    if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
