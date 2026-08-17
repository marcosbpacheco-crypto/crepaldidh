import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.services.findMany({
      where: { deleted_at: null },
      orderBy: { name: 'asc' },
    })
    return NextResponse.json({ services })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    const service = await prisma.services.upsert({
      where: { id: id || crypto.randomUUID() },
      create: { ...data, id: id || crypto.randomUUID() },
      update: { ...data },
    })
    return NextResponse.json({ service })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, ...data } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    const service = await prisma.services.update({ where: { id }, data })
    return NextResponse.json({ service })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })
    await prisma.services.update({ where: { id }, data: { deleted_at: new Date() } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}