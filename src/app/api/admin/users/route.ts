import { NextResponse } from 'next/server'
import { getAdminClient } from '@/lib/supabase/admin'

// Shared admin client (service_role — bypasses RLS)
function getClient() {
  const admin = getAdminClient()
  if (!admin) throw new Error('Supabase admin client not configured')
  return admin
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name, phone, avatar, role_id, role_name, is_external, company_id, company_name, active } = body

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'email, password e name sao obrigatorios' }, { status: 400 })
    }

    const admin = getClient()

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

    // Upsert profile
    const profileData: any = {
      id: newUser.user.id,
      name,
      email,
      role_id: role_id || 'role-user',
      role_name: role_name || 'Usuário',
      active: active !== undefined ? active : true,
    }
    if (phone !== undefined) profileData.phone = phone
    if (avatar !== undefined) profileData.avatar = avatar
    if (is_external !== undefined) profileData.is_external = is_external
    if (company_id !== undefined) profileData.company_id = company_id
    if (company_name !== undefined) profileData.company_name = company_name

    const { error: profileError } = await (admin.from('profiles') as any).upsert(profileData, { onConflict: 'id' })

    if (profileError) {
      try { await admin.auth.admin.deleteUser(newUser.user.id) } catch (_) {}
      return NextResponse.json({ error: 'Erro ao criar perfil: ' + profileError.message }, { status: 500 })
    }

    // Also insert into admin_users for backward compatibility (legacy login system)
    const legacyUser = {
      id: newUser.user.id,
      name,
      email,
      phone: phone || '',
      avatar: avatar || '',
      role_id: role_id || 'role-user',
      role_name: role_name || 'Usuário',
      is_external: is_external || false,
      company_id: company_id || null,
      company_name: company_name || null,
      active: active !== undefined ? active : true,
      password,
      login_attempts: 0,
      mfa_enabled: false,
      created_at: new Date().toISOString(),
    }
    try { await (admin.from('admin_users') as any).upsert(legacyUser, { onConflict: 'id', ignoreDuplicates: false }) } catch (_) {}

    return NextResponse.json({
      success: true,
      user: {
        id: newUser.user.id,
        name,
        email,
        phone: phone || '',
        avatar: avatar || '',
        role_id: role_id || 'role-user',
        role_name: role_name || 'Usuário',
        is_external: is_external || false,
        company_id: company_id || null,
        company_name: company_name || null,
        active: active !== undefined ? active : true,
      }
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, email, password, name, phone, avatar, role_id, role_name, is_external, company_id, company_name, active } = body
    if (!id) return NextResponse.json({ error: 'id obrigatorio' }, { status: 400 })

    const admin = getClient()

    // Build auth updates
    const authUpdates: any = {}
    if (email) authUpdates.email = email
    if (password) authUpdates.password = password
    // Handle ban/unban based on active status
    if (active !== undefined) {
      authUpdates.ban_duration = active ? 'none' : '24h'
    }
    if (Object.keys(authUpdates).length > 0) {
      const { error: authErr } = await admin.auth.admin.updateUserById(id, authUpdates)
      if (authErr) return NextResponse.json({ error: authErr.message }, { status: 400 })
    }

    // Update profile
    const profileUpdates: any = {}
    if (name !== undefined) profileUpdates.name = name
    if (email !== undefined) profileUpdates.email = email
    if (phone !== undefined) profileUpdates.phone = phone
    if (avatar !== undefined) profileUpdates.avatar = avatar
    if (role_id !== undefined) profileUpdates.role_id = role_id
    if (role_name !== undefined) profileUpdates.role_name = role_name
    if (is_external !== undefined) profileUpdates.is_external = is_external
    if (company_id !== undefined) profileUpdates.company_id = company_id
    if (company_name !== undefined) profileUpdates.company_name = company_name
    if (active !== undefined) profileUpdates.active = active

    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileErr } = await (admin.from('profiles') as any).update(profileUpdates).eq('id', id)
      if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 })
    }

    // Also update admin_users for legacy sync
    const legacyUpdates: any = { ...profileUpdates }
    if (password) legacyUpdates.password = password
    if (Object.keys(legacyUpdates).length > 0) {
      try { await (admin.from('admin_users') as any).update(legacyUpdates).eq('id', id) } catch (_) {}
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

    const admin = getClient()

    // Disable auth user (ban)
    try { await admin.auth.admin.updateUserById(id, { ban_duration: '24h' }) } catch (_) {}

    // Soft delete on profile
    const { error: deleteErr } = await (admin.from('profiles') as any).update({
      active: false,
    }).eq('id', id)

    if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })

    // Also soft-delete in admin_users
    try { await (admin.from('admin_users') as any).update({ active: false }).eq('id', id) } catch (_) {}

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
