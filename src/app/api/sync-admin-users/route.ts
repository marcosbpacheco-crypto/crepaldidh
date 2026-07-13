import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url) { console.error('sync-admin-users: NEXT_PUBLIC_SUPABASE_URL not set'); return null }
  if (!key) { console.error('sync-admin-users: SUPABASE_SERVICE_ROLE_KEY not set'); return null }
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function POST(request: Request) {
  try {
    const supabase = getServiceClient()
    if (!supabase) {
      console.warn('sync-admin-users POST: service unavailable (env vars missing)')
      return NextResponse.json({ success: true, count: 0, skipped: true })
    }

    const body = await request.json()
    const { users } = body

    if (!Array.isArray(users) || users.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    const { error } = await supabase.from('admin_users').upsert(users, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })

    if (error) {
      console.error('sync-admin-users upsert error:', error.message)
      return NextResponse.json({ success: false, count: 0, error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: users.length })
  } catch (err: any) {
    console.error('sync-admin-users POST fatal:', err.message)
    return NextResponse.json({ success: false, count: 0, error: err.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json({ users: [] })
    }

    const { data, error } = await supabase.from('admin_users').select('*')
    if (error) {
      console.error('sync-admin-users GET error:', error.message)
      return NextResponse.json({ users: [] })
    }

    return NextResponse.json({ users: data || [] })
  } catch (err: any) {
    console.error('sync-admin-users GET error:', err.message)
    return NextResponse.json({ users: [] })
  }
}
