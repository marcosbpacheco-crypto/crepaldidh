import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const [users, auditLogs, lgpdConsents, privacyRequests, permissions, tenants, plans, usage] =
      await Promise.all([
        prisma.admin_users.findMany({ where: { active: true }, orderBy: { created_at: 'desc' } }),
        prisma.admin_audit_logs.findMany({ orderBy: { created_at: 'desc' } }),
        prisma.admin_lgpd_consents.findMany({ orderBy: { created_at: 'desc' } }),
        prisma.admin_privacy_requests.findMany({ orderBy: { created_at: 'desc' } }),
        prisma.admin_permissions.findMany({ orderBy: { created_at: 'desc' } }),
        prisma.tenants.findMany({ orderBy: { created_at: 'desc' } }),
        prisma.tenant_plans.findMany({ orderBy: { created_at: 'desc' } }),
        prisma.tenant_usage.findMany({ orderBy: { recorded_at: 'desc' } }),
      ])
    return NextResponse.json({ users, auditLogs, lgpdConsents, privacyRequests, permissions, tenants, plans, usage })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'user' || !_type) {
      const uId = id || crypto.randomUUID()
      const user = await prisma.admin_users.upsert({
        where: { id: uId },
        create: {
          id: uId,
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          avatar: data.avatar || '',
          role_id: data.roleId || data.role_id || null,
          role_name: data.roleName || data.role_name,
          is_external: data.isExternal ?? data.is_external ?? false,
          company_id: data.companyId || data.company_id || null,
          company_name: data.companyName || data.company_name || null,
          active: data.active ?? data.active ?? true,
          password: data.password || null,
          login_attempts: data.loginAttempts ?? data.login_attempts ?? 0,
          mfa_enabled: data.mfaEnabled ?? data.mfa_enabled ?? false,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
        update: {
          name: data.name,
          email: data.email,
          phone: data.phone || '',
          avatar: data.avatar || '',
          role_id: data.roleId || data.role_id || null,
          role_name: data.roleName || data.role_name,
          is_external: data.isExternal ?? data.is_external ?? false,
          company_id: data.companyId || data.company_id || null,
          company_name: data.companyName || data.company_name || null,
          active: data.active ?? data.active ?? true,
          password: data.password || null,
          login_attempts: data.loginAttempts ?? data.login_attempts ?? 0,
          mfa_enabled: data.mfaEnabled ?? data.mfa_enabled ?? false,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
      })
      return NextResponse.json({ user })
    }

    if (_type === 'auditLog') {
      const auditLog = await prisma.admin_audit_logs.create({
        data: {
          user_id: data.userId || data.user_id || null,
          user_name: data.userName || data.user_name || null,
          user_role: data.userRole || data.user_role || null,
          action: data.action,
          entity: data.entity,
          entity_id: data.entityId || data.entity_id || null,
          description: data.description || null,
          ip_address: data.ipAddress || data.ip_address || '127.0.0.1',
        },
      })
      return NextResponse.json({ auditLog })
    }

    if (_type === 'lgpdConsent') {
      const lcId = id || crypto.randomUUID()
      const lgpdConsent = await prisma.admin_lgpd_consents.upsert({
        where: { id: lcId },
        create: {
          id: lcId,
          user_id: data.userId || data.user_id,
          consent_type: data.consentType || data.consent_type,
          legal_basis: data.legalBasis || data.legal_basis,
          granted: data.granted ?? false,
          granted_at: data.grantedAt || data.granted_at ? new Date(data.grantedAt || data.granted_at) : null,
          revoked_at: data.revokedAt || data.revoked_at ? new Date(data.revokedAt || data.revoked_at) : null,
          version: data.version,
        },
        update: {
          user_id: data.userId || data.user_id,
          consent_type: data.consentType || data.consent_type,
          legal_basis: data.legalBasis || data.legal_basis,
          granted: data.granted ?? false,
          granted_at: data.grantedAt || data.granted_at ? new Date(data.grantedAt || data.granted_at) : null,
          revoked_at: data.revokedAt || data.revoked_at ? new Date(data.revokedAt || data.revoked_at) : null,
          version: data.version,
        },
      })
      return NextResponse.json({ lgpdConsent })
    }

    if (_type === 'privacyRequest') {
      const prId = id || crypto.randomUUID()
      const privacyRequest = await prisma.admin_privacy_requests.upsert({
        where: { id: prId },
        create: {
          id: prId,
          user_id: data.userId || data.user_id,
          user_name: data.userName || data.user_name,
          request_type: data.requestType || data.request_type,
          status: data.status || 'pending',
          description: data.description || null,
          processed_by: data.processedBy || data.processed_by || null,
          processed_at: data.processedAt || data.processed_at ? new Date(data.processedAt || data.processed_at) : null,
          response_notes: data.responseNotes || data.response_notes || null,
        },
        update: {
          user_id: data.userId || data.user_id,
          user_name: data.userName || data.user_name,
          request_type: data.requestType || data.request_type,
          status: data.status || 'pending',
          description: data.description || null,
          processed_by: data.processedBy || data.processed_by || null,
          processed_at: data.processedAt || data.processed_at ? new Date(data.processedAt || data.processed_at) : null,
          response_notes: data.responseNotes || data.response_notes || null,
        },
      })
      return NextResponse.json({ privacyRequest })
    }

    if (_type === 'permission') {
      const permId = id || crypto.randomUUID()
      const permission = await prisma.admin_permissions.upsert({
        where: { id: permId },
        create: {
          id: permId,
          role_id: data.roleId || data.role_id || null,
          user_id: data.userId || data.user_id || null,
          module: data.module,
          can_view: data.canView ?? data.can_view ?? false,
          can_create: data.canCreate ?? data.can_create ?? false,
          can_edit: data.canEdit ?? data.can_edit ?? false,
          can_delete: data.canDelete ?? data.can_delete ?? false,
          can_export: data.canExport ?? data.can_export ?? false,
        },
        update: {
          role_id: data.roleId || data.role_id || null,
          user_id: data.userId || data.user_id || null,
          module: data.module,
          can_view: data.canView ?? data.can_view ?? false,
          can_create: data.canCreate ?? data.can_create ?? false,
          can_edit: data.canEdit ?? data.can_edit ?? false,
          can_delete: data.canDelete ?? data.can_delete ?? false,
          can_export: data.canExport ?? data.can_export ?? false,
        },
      })
      return NextResponse.json({ permission })
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

    if (_type === 'restore') {
      const user = await prisma.admin_users.update({
        where: { id },
        data: { active: true },
      })
      return NextResponse.json({ user })
    }

    if (_type === 'privacyRequest') {
      const privacyRequest = await prisma.admin_privacy_requests.update({
        where: { id },
        data: {
          ...(data.status && { status: data.status }),
          ...(data.processedBy && { processed_by: data.processedBy }),
          ...(data.processedAt && { processed_at: new Date(data.processedAt) }),
          ...(data.responseNotes !== undefined && { response_notes: data.responseNotes }),
        },
      })
      return NextResponse.json({ privacyRequest })
    }

    if (_type === 'permission') {
      const permission = await prisma.admin_permissions.update({
        where: { id },
        data: {
          ...(data.roleId !== undefined && { role_id: data.roleId }),
          ...(data.role_id !== undefined && { role_id: data.role_id }),
          ...(data.userId !== undefined && { user_id: data.userId }),
          ...(data.user_id !== undefined && { user_id: data.user_id }),
          ...(data.module && { module: data.module }),
          ...(data.canView !== undefined && { can_view: data.canView }),
          ...(data.can_view !== undefined && { can_view: data.can_view }),
          ...(data.canCreate !== undefined && { can_create: data.canCreate }),
          ...(data.can_create !== undefined && { can_create: data.can_create }),
          ...(data.canEdit !== undefined && { can_edit: data.canEdit }),
          ...(data.can_edit !== undefined && { can_edit: data.can_edit }),
          ...(data.canDelete !== undefined && { can_delete: data.canDelete }),
          ...(data.can_delete !== undefined && { can_delete: data.can_delete }),
          ...(data.canExport !== undefined && { can_export: data.canExport }),
          ...(data.can_export !== undefined && { can_export: data.can_export }),
        },
      })
      return NextResponse.json({ permission })
    }

    const user = await prisma.admin_users.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.roleId && { role_id: data.roleId }),
        ...(data.role_id && { role_id: data.role_id }),
        ...(data.roleName && { role_name: data.roleName }),
        ...(data.role_name && { role_name: data.role_name }),
        ...(data.isExternal !== undefined && { is_external: data.isExternal }),
        ...(data.is_external !== undefined && { is_external: data.is_external }),
        ...(data.companyId !== undefined && { company_id: data.companyId }),
        ...(data.company_id !== undefined && { company_id: data.company_id }),
        ...(data.companyName !== undefined && { company_name: data.companyName }),
        ...(data.company_name !== undefined && { company_name: data.company_name }),
        ...(data.active !== undefined && { active: data.active }),
        ...(data.password !== undefined && { password: data.password }),
        ...(data.lastLogin && { last_login: new Date(data.lastLogin) }),
        ...(data.last_login && { last_login: new Date(data.last_login) }),
        ...(data.loginAttempts !== undefined && { login_attempts: data.loginAttempts }),
        ...(data.login_attempts !== undefined && { login_attempts: data.login_attempts }),
        ...(data.mfaEnabled !== undefined && { mfa_enabled: data.mfaEnabled }),
        ...(data.mfa_enabled !== undefined && { mfa_enabled: data.mfa_enabled }),
        ...(data.tenantId && { tenant_id: data.tenantId }),
        ...(data.tenant_id && { tenant_id: data.tenant_id }),
      },
    })
    return NextResponse.json({ user })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'user' || !_type) {
      await prisma.admin_users.update({
        where: { id },
        data: { active: false },
      })
      return NextResponse.json({ success: true })
    }

    if (_type === 'auditLog') {
      await prisma.admin_audit_logs.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'lgpdConsent') {
      await prisma.admin_lgpd_consents.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'privacyRequest') {
      await prisma.admin_privacy_requests.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'permission') {
      await prisma.admin_permissions.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid _type' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
