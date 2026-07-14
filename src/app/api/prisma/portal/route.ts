import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

function mapUser(u: any) {
  return {
    id: u.id,
    companyId: u.company_id,
    name: u.name,
    email: u.email,
    role: u.role,
    phone: u.phone || '',
    active: u.active ?? true,
    lastAccess: u.last_login?.toISOString?.() || '',
  }
}

function mapRequest(r: any) {
  let subject = ''
  let description = r.description || ''
  let priority = 'medium'
  let updatedAt = r.created_at?.toISOString?.() || ''
  try {
    const meta = JSON.parse(description)
    if (meta.subject !== undefined) { subject = meta.subject; description = meta.description || ''; priority = meta.priority || 'medium'; updatedAt = meta.updatedAt || updatedAt }
  } catch { subject = description }
  return {
    id: r.id,
    companyId: r.company_id || '',
    userId: r.user_id || '',
    userName: '',
    type: r.type,
    subject,
    description,
    priority,
    status: r.status || 'open',
    createdAt: r.created_at?.toISOString?.() || '',
    updatedAt,
  }
}

function mapNotification(n: any) {
  return {
    id: n.id,
    companyId: '',
    userId: n.user_id || '',
    title: n.title,
    description: n.message || '',
    type: n.type || 'info',
    link: '',
    read: n.is_read ?? false,
    createdAt: n.created_at?.toISOString?.() || '',
  }
}

function mapCalendarEvent(e: any) {
  return {
    id: e.id,
    companyId: e.company_id,
    title: e.title,
    description: e.description || '',
    eventType: e.event_type || 'event',
    type: e.event_type || 'event',
    startDate: e.start_date?.toISOString?.() || '',
    start_time: e.start_date?.toISOString?.() || '',
    endDate: e.end_date?.toISOString?.() || '',
    end_time: e.end_date?.toISOString?.() || '',
    allDay: e.all_day ?? false,
    createdAt: e.created_at?.toISOString?.() || '',
    status: 'confirmed',
  }
}

export async function GET() {
  try {
    const [users, permissions, requests, notifications, calendarEvents] = await Promise.all([
      prisma.portal_users.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.portal_permissions.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.portal_requests.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.portal_notifications.findMany({ orderBy: { created_at: 'desc' } }),
      prisma.portal_calendar_events.findMany({ orderBy: { created_at: 'desc' } }),
    ])
    return NextResponse.json({
      users: users.map(mapUser),
      permissions,
      requests: requests.map(mapRequest),
      notifications: notifications.map(mapNotification),
      calendarEvents: calendarEvents.map(mapCalendarEvent),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'login') {
      const email = data.email?.toLowerCase()?.trim()
      if (!email) return NextResponse.json({ user: null })
      const user = await prisma.portal_users.findFirst({ where: { email, active: true } })
      if (!user) return NextResponse.json({ user: null })
      await prisma.portal_users.update({ where: { id: user.id }, data: { last_login: new Date() } })
      return NextResponse.json({ user: mapUser(user) })
    }

    if (_type === 'request' || !_type) {
      const reqId = id || crypto.randomUUID()
      const meta = JSON.stringify({
        subject: data.subject || '',
        description: data.description || '',
        priority: data.priority || 'medium',
        updatedAt: new Date().toISOString(),
      })
      const record = await prisma.portal_requests.upsert({
        where: { id: reqId },
        create: {
          id: reqId,
          user_id: data.userId || data.user_id || '',
          company_id: data.companyId || data.company_id || null,
          type: data.type,
          description: meta,
          status: data.status || 'open',
          attachments: data.attachments || [],
        },
        update: {
          user_id: data.userId || data.user_id || '',
          company_id: data.companyId || data.company_id || null,
          type: data.type,
          description: meta,
          status: data.status || 'open',
          attachments: data.attachments || [],
        },
      })
      const requestMapped = mapRequest(record)
      requestMapped.userName = data.userName || ''
      return NextResponse.json({ request: requestMapped })
    }

    if (_type === 'notification') {
      const notifId = id || crypto.randomUUID()
      await prisma.portal_notifications.upsert({
        where: { id: notifId },
        create: {
          id: notifId,
          user_id: data.userId || data.user_id || '',
          title: data.title,
          message: data.description || data.message || null,
          type: data.type || 'info',
          is_read: data.read ?? data.is_read ?? false,
        },
        update: {
          user_id: data.userId || data.user_id || '',
          title: data.title,
          message: data.description || data.message || null,
          type: data.type || 'info',
          is_read: data.read ?? data.is_read ?? false,
        },
      })
      return NextResponse.json({ notification: mapNotification({ ...data, id: notifId, created_at: new Date() }) })
    }

    if (_type === 'calendar') {
      const calId = id || crypto.randomUUID()
      const event = await prisma.portal_calendar_events.upsert({
        where: { id: calId },
        create: {
          id: calId,
          company_id: data.companyId || data.company_id || null,
          title: data.title,
          description: data.description || null,
          event_type: data.eventType || data.event_type || data.type || 'event',
          start_date: new Date(data.startDate || data.start_date || data.start_time),
          end_date: data.endDate || data.end_date || data.end_time ? new Date(data.endDate || data.end_date || data.end_time) : null,
          all_day: data.allDay ?? data.all_day ?? false,
        },
        update: {
          company_id: data.companyId || data.company_id || null,
          title: data.title,
          description: data.description || null,
          event_type: data.eventType || data.event_type || data.type || 'event',
          start_date: new Date(data.startDate || data.start_date || data.start_time),
          end_date: data.endDate || data.end_date || data.end_time ? new Date(data.endDate || data.end_date || data.end_time) : null,
          all_day: data.allDay ?? data.all_day ?? false,
        },
      })
      return NextResponse.json({ event: mapCalendarEvent(event) })
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

    if (_type === 'notification') {
      const notification = await prisma.portal_notifications.update({
        where: { id },
        data: { is_read: data.read ?? data.is_read ?? true },
      })
      return NextResponse.json({ notification: mapNotification(notification) })
    }

    if (_type === 'request') {
      const existing = await prisma.portal_requests.findUnique({ where: { id } })
      if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      let desc = existing.description
      try {
        const meta = desc ? JSON.parse(desc) : { subject: '', description: '', priority: 'medium' }
        if (data.subject !== undefined) meta.subject = data.subject
        if (data.description !== undefined) meta.description = data.description
        if (data.priority !== undefined) meta.priority = data.priority
        meta.updatedAt = new Date().toISOString()
        desc = JSON.stringify(meta)
      } catch { /* keep original */ }
      const record = await prisma.portal_requests.update({
        where: { id },
        data: {
          ...(data.type && { type: data.type }),
          ...(data.status && { status: data.status }),
          description: desc,
        },
      })
      return NextResponse.json({ request: mapRequest(record) })
    }

    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'notification') {
      await prisma.portal_notifications.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'request') {
      await prisma.portal_requests.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'calendar') {
      await prisma.portal_calendar_events.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
