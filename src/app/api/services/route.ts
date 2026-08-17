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
