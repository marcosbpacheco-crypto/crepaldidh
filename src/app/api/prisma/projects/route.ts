import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const projects = await prisma.projects.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
    })
    const tasks = await prisma.project_tasks.findMany({
      where: { deleted_at: null },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json({ projects, tasks })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'task') {
      const task = await prisma.project_tasks.upsert({
        where: { id: id || crypto.randomUUID() },
        create: { ...data, id: id || crypto.randomUUID() },
        update: { ...data },
      })
      return NextResponse.json({ task })
    }

    const project = await prisma.projects.upsert({
      where: { id: id || crypto.randomUUID() },
      create: { ...data, id: id || crypto.randomUUID() },
      update: { ...data },
    })
    return NextResponse.json({ project })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { id, _type, ...data } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'task') {
      const task = await prisma.project_tasks.update({ where: { id }, data })
      return NextResponse.json({ task })
    }

    const project = await prisma.projects.update({ where: { id }, data })
    return NextResponse.json({ project })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'task') {
      await prisma.project_tasks.update({ where: { id }, data: { deleted_at: new Date() } })
    } else {
      await prisma.projects.update({ where: { id }, data: { deleted_at: new Date() } })
    }
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
