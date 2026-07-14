import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [accesses, tempUsers, questionnaires, responses] = await Promise.all([
      prisma.temporary_accesses.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.temporary_users.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.temporary_questionnaires.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.temporary_responses.findMany({ orderBy: { submitted_at: 'desc' } }),
    ])
    return NextResponse.json({ accesses, tempUsers, questionnaires, responses })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'access' || !_type) {
      const aId = id || crypto.randomUUID()
      const access = await prisma.temporary_accesses.upsert({
        where: { id: aId },
        create: {
          id: aId,
          company_id: data.companyId || data.company_id || null,
          title: data.title,
          description: data.description || null,
          start_date: new Date(data.startDate || data.start_date),
          end_date: new Date(data.endDate || data.end_date),
          status: data.status || 'active',
        },
        update: {
          company_id: data.companyId || data.company_id || null,
          title: data.title,
          description: data.description || null,
          start_date: new Date(data.startDate || data.start_date),
          end_date: new Date(data.endDate || data.end_date),
          status: data.status || 'active',
        },
      })
      return NextResponse.json({ access })
    }

    if (_type === 'user') {
      const uId = id || crypto.randomUUID()
      const tempUser = await prisma.temporary_users.upsert({
        where: { id: uId },
        create: {
          id: uId,
          access_id: data.accessId || data.access_id,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          role: data.role || null,
        },
        update: {
          access_id: data.accessId || data.access_id,
          name: data.name,
          email: data.email,
          phone: data.phone || null,
          company: data.company || null,
          role: data.role || null,
        },
      })
      return NextResponse.json({ user: tempUser })
    }

    if (_type === 'questionnaire') {
      const qId = id || crypto.randomUUID()
      const questionnaire = await prisma.temporary_questionnaires.upsert({
        where: { id: qId },
        create: {
          id: qId,
          access_id: data.accessId || data.access_id,
          title: data.title,
          questions: data.questions || [],
        },
        update: {
          access_id: data.accessId || data.access_id,
          title: data.title,
          questions: data.questions || [],
        },
      })
      return NextResponse.json({ questionnaire })
    }

    if (_type === 'response') {
      const rId = id || crypto.randomUUID()
      const response = await prisma.temporary_responses.upsert({
        where: { id: rId },
        create: {
          id: rId,
          questionnaire_id: data.questionnaireId || data.questionnaire_id,
          user_id: data.userId || data.user_id,
          answers: data.answers || [],
        },
        update: {
          questionnaire_id: data.questionnaireId || data.questionnaire_id,
          user_id: data.userId || data.user_id,
          answers: data.answers || [],
        },
      })
      return NextResponse.json({ response })
    }

    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'questionnaire') {
      const questionnaire = await prisma.temporary_questionnaires.update({
        where: { id },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.questions !== undefined && { questions: data.questions }),
        },
      })
      return NextResponse.json({ questionnaire })
    }

    const access = await prisma.temporary_accesses.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.startDate && { start_date: new Date(data.startDate) }),
        ...(data.start_date && { start_date: new Date(data.start_date) }),
        ...(data.endDate && { end_date: new Date(data.endDate) }),
        ...(data.end_date && { end_date: new Date(data.end_date) }),
        ...(data.status && { status: data.status }),
        ...(data.companyId !== undefined && { company_id: data.companyId }),
        ...(data.company_id !== undefined && { company_id: data.company_id }),
      },
    })
    return NextResponse.json({ access })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'user') {
      await prisma.temporary_users.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'questionnaire') {
      await prisma.temporary_questionnaires.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'response') {
      await prisma.temporary_responses.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.temporary_accesses.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
