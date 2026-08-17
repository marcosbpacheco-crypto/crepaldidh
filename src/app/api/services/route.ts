import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const services = await prisma.services.findMany({
      where: { deleted_at: null, status: 'ativo' },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, description: true, category: true },
    })
    return NextResponse.json({ services })
  } catch (err: any) {
    return NextResponse.json({ error: err.message, services: [] }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const name = String(body.name || '').trim()
    if (!name) {
      return NextResponse.json({ error: 'Nome do serviço é obrigatório.' }, { status: 400 })
    }

    const existing = await prisma.services.findFirst({
      where: { name: { equals: name, mode: 'insensitive' }, deleted_at: null },
    })
    if (existing) {
      if (existing.status !== 'ativo') {
        await prisma.services.update({ where: { id: existing.id }, data: { status: 'ativo', deleted_at: null } })
      }
      return NextResponse.json({ service: existing })
    }

    const service = await prisma.services.create({
      data: { name, category: body.category || null, description: body.description || null, status: 'ativo' },
      select: { id: true, name: true, description: true, category: true },
    })
    return NextResponse.json({ service })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
