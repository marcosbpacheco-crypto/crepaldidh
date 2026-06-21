import { createClient } from '@supabase/supabase-js'

const STORAGE_BUCKET = 'app-sync'
const STORAGE_KEY = 'admin-users.json'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function ensureBucket(supabase: any) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.find((b: { name: string }) => b.name === STORAGE_BUCKET)) {
    await supabase.storage.createBucket(STORAGE_BUCKET, { public: false })
  }
}

export async function saveUsersToSupabase(usersJson: string) {
  try {
    const supabase = getServiceClient()
    if (!supabase) return
    await ensureBucket(supabase)
    await supabase.storage.from(STORAGE_BUCKET).upload(STORAGE_KEY, usersJson, {
      upsert: true,
      contentType: 'application/json',
    })
  } catch (err: any) {
    console.error('saveUsersToSupabase error:', err?.message)
  }
}

export async function loadUsersFromSupabase(): Promise<string | null> {
  try {
    const supabase = getServiceClient()
    if (!supabase) return null
    await ensureBucket(supabase)
    const { data } = await supabase.storage.from(STORAGE_BUCKET).download(STORAGE_KEY)
    if (data) {
      return await data.text()
    }
  } catch (err: any) {
    console.error('loadUsersFromSupabase error:', err?.message)
  }
  return null
}
