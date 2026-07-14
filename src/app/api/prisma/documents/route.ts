import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const documents = await prisma.documents.findMany({
      where: { deleted_at: null },
      include: {
        document_versions: true,
        document_access_logs: true,
      },
      orderBy: { created_at: 'desc' },
    })
    return NextResponse.json({ documents })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { _type, id, ...data } = body

    if (_type === 'document' || !_type) {
      const docId = id || crypto.randomUUID()
      const document = await prisma.documents.upsert({
        where: { id: docId },
        create: {
          id: docId,
          title: data.title,
          description: data.description || null,
          type: data.type,
          file_url: data.fileUrl || data.file_url || null,
          file_size: data.fileSize ?? data.file_size ?? null,
          mime_type: data.mimeType || data.mime_type || null,
          company_id: data.companyId || data.company_id || null,
          uploaded_by: data.uploadedBy || data.uploaded_by || null,
          tags: data.tags || [],
          category: data.category || null,
          visibility: data.visibility || 'internal',
          status: data.status || 'draft',
          current_version: data.currentVersion ?? data.current_version ?? 1,
          approval_status: data.approvalStatus || data.approval_status || 'pending',
          signature_code: data.signatureCode || data.signature_code || null,
          signed_at: data.signedAt || data.signed_at ? new Date(data.signedAt || data.signed_at) : null,
          signed_by: data.signedBy || data.signed_by || null,
          valid_until: data.validUntil || data.valid_until ? new Date(data.validUntil || data.valid_until) : null,
          module: data.module || null,
          project_id: data.projectId || data.project_id || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
        update: {
          title: data.title,
          description: data.description || null,
          type: data.type,
          file_url: data.fileUrl || data.file_url || null,
          file_size: data.fileSize ?? data.file_size ?? null,
          mime_type: data.mimeType || data.mime_type || null,
          company_id: data.companyId || data.company_id || null,
          uploaded_by: data.uploadedBy || data.uploaded_by || null,
          tags: data.tags || [],
          category: data.category || null,
          visibility: data.visibility || 'internal',
          status: data.status || 'draft',
          current_version: data.currentVersion ?? data.current_version ?? 1,
          approval_status: data.approvalStatus || data.approval_status || 'pending',
          signature_code: data.signatureCode || data.signature_code || null,
          signed_at: data.signedAt || data.signed_at ? new Date(data.signedAt || data.signed_at) : null,
          signed_by: data.signedBy || data.signed_by || null,
          valid_until: data.validUntil || data.valid_until ? new Date(data.validUntil || data.valid_until) : null,
          module: data.module || null,
          project_id: data.projectId || data.project_id || null,
          tenant_id: data.tenantId || data.tenant_id || null,
        },
      })
      return NextResponse.json({ document })
    }

    if (_type === 'version') {
      const vId = id || crypto.randomUUID()
      const version = await prisma.document_versions.upsert({
        where: { id: vId },
        create: {
          id: vId,
          document_id: data.documentId || data.document_id,
          version_number: data.versionNumber ?? data.version_number ?? 1,
          file_url: data.fileUrl || data.file_url,
          file_size: data.fileSize ?? data.file_size ?? null,
          uploaded_by: data.uploadedBy || data.uploaded_by || null,
          change_notes: data.changeNotes || data.change_notes || null,
        },
        update: {
          document_id: data.documentId || data.document_id,
          version_number: data.versionNumber ?? data.version_number ?? 1,
          file_url: data.fileUrl || data.file_url,
          file_size: data.fileSize ?? data.file_size ?? null,
          uploaded_by: data.uploadedBy || data.uploaded_by || null,
          change_notes: data.changeNotes || data.change_notes || null,
        },
      })
      return NextResponse.json({ version })
    }

    if (_type === 'accessLog') {
      const alId = id || crypto.randomUUID()
      const accessLog = await prisma.document_access_logs.upsert({
        where: { id: alId },
        create: {
          id: alId,
          document_id: data.documentId || data.document_id,
          user_id: data.userId || data.user_id || null,
          user_name: data.userName || data.user_name || null,
          action: data.action,
        },
        update: {
          document_id: data.documentId || data.document_id,
          user_id: data.userId || data.user_id || null,
          user_name: data.userName || data.user_name || null,
          action: data.action,
        },
      })
      return NextResponse.json({ accessLog })
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
      const document = await prisma.documents.update({
        where: { id },
        data: { deleted_at: null, status: 'active' },
      })
      return NextResponse.json({ document })
    }

    const document = await prisma.documents.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type && { type: data.type }),
        ...(data.fileUrl !== undefined && { file_url: data.fileUrl }),
        ...(data.file_url !== undefined && { file_url: data.file_url }),
        ...(data.fileSize !== undefined && { file_size: data.fileSize }),
        ...(data.mimeType !== undefined && { mime_type: data.mimeType }),
        ...(data.mime_type !== undefined && { mime_type: data.mime_type }),
        ...(data.companyId && { company_id: data.companyId }),
        ...(data.tags && { tags: data.tags }),
        ...(data.category !== undefined && { category: data.category }),
        ...(data.visibility && { visibility: data.visibility }),
        ...(data.status && { status: data.status }),
        ...(data.currentVersion !== undefined && { current_version: data.currentVersion }),
        ...(data.approvalStatus && { approval_status: data.approvalStatus }),
        ...(data.signatureCode !== undefined && { signature_code: data.signatureCode }),
        ...(data.signedAt && { signed_at: new Date(data.signedAt) }),
        ...(data.signed_by && { signed_by: data.signed_by }),
        ...(data.validUntil && { valid_until: new Date(data.validUntil) }),
        ...(data.module !== undefined && { module: data.module }),
        ...(data.projectId && { project_id: data.projectId }),
      },
    })
    return NextResponse.json({ document })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json()
    const { id, _type } = body

    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    if (_type === 'version') {
      await prisma.document_versions.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    if (_type === 'accessLog') {
      await prisma.document_access_logs.delete({ where: { id } })
      return NextResponse.json({ success: true })
    }

    await prisma.documents.update({
      where: { id },
      data: { deleted_at: new Date(), status: 'archived' },
    })
    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
