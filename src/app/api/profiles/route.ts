import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export async function GET() {
  try {
    const supabase = getServiceClient()
    if (!supabase) return NextResponse.json({ profiles: [] })

    const { data, error } = await supabase.from('profiles').select('*')
    if (error) {
      console.error('profiles GET error:', error.message)
      return NextResponse.json({ profiles: [] })
    }
    return NextResponse.json({ profiles: data || [] })
  } catch (err: any) {
    console.error('profiles GET error:', err.message)
    return NextResponse.json({ profiles: [] })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { profiles } = body

    if (!Array.isArray(profiles) || profiles.length === 0) {
      return NextResponse.json({ success: true, count: 0 })
    }

    const { error } = await supabase.from('profiles').upsert(profiles, {
      onConflict: 'id',
      ignoreDuplicates: false,
    })

    if (error) {
      console.error('profiles POST error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, count: profiles.length })
  } catch (err: any) {
    console.error('profiles POST error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = getServiceClient()
    if (!supabase) {
      return NextResponse.json({ error: 'Supabase not configured' }, { status: 500 })
    }

    const body = await request.json()
    const { id } = body

    if (!id) {
      return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    }

    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) {
      console.error('profiles DELETE error:', error.message)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('profiles DELETE error:', err.message)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
