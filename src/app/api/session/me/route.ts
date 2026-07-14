import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  try {
    const cookieStore = await cookies()
    const raw = cookieStore.get('session')?.value
    if (!raw) return NextResponse.json({ user: null })
    const parsed = JSON.parse(raw)
    return NextResponse.json({ user: parsed })
  } catch {
    return NextResponse.json({ user: null })
  }
}
