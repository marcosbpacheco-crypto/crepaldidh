import type { Document, DocumentVersion, DocumentAccessLog, DocumentCategory } from '@/types/documents'

const BASE = '/api/prisma/documents'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const documentService = {
  async list(): Promise<Document[]> {
    const data = await api(BASE)
    return (data.documents || []).map(md)
  },
  async create(input: Partial<Document>): Promise<Document> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'document', ...input }),
    })
    return md(data.document)
  },
  async update(id: string, input: Partial<Document>): Promise<Document> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    })
    return md(data.document)
  },
  async remove(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },
  async listVersions(documentId?: string): Promise<DocumentVersion[]> {
    const data = await api(BASE)
    const all: DocumentVersion[] = []
    for (const d of data.documents || []) {
      for (const r of d.document_versions || []) {
        all.push(mv({ ...r, document_id: d.id }))
      }
    }
    return documentId ? all.filter(v => v.documentId === documentId) : all
  },
  async createVersion(input: Partial<DocumentVersion>): Promise<DocumentVersion> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'version', ...input }),
    })
    return mv(data.version)
  },
  async listAccessLogs(documentId?: string): Promise<DocumentAccessLog[]> {
    const data = await api(BASE)
    const all: DocumentAccessLog[] = []
    for (const d of data.documents || []) {
      for (const r of d.document_access_logs || []) {
        all.push(ma({ ...r, document_id: d.id }))
      }
    }
    return documentId ? all.filter(l => l.documentId === documentId) : all
  },
  async logAccess(input: Partial<DocumentAccessLog>): Promise<DocumentAccessLog> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'accessLog', ...input }),
    })
    return ma(data.accessLog)
  },
  async listCategories(): Promise<DocumentCategory[]> {
    const data = await api(BASE)
    return data.categories || []
  },
}

function md(r: any): Document { return { ...r, companyId: r.company_id, contractId: r.contract_id, categoryId: r.category_id, docType: r.doc_type, tags: r.tags, fileUrl: r.file_url, fileSize: r.file_size, uploadedBy: r.uploaded_by, createdAt: r.created_at, updatedAt: r.updated_at } }
function mv(r: any): DocumentVersion {
  return { ...r, documentId: r.document_id, versionNumber: r.version_number, fileUrl: r.file_url, fileSize: r.file_size, uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at || r.created_at }
}
function ma(r: any): DocumentAccessLog { return { ...r, documentId: r.document_id, userId: r.user_id, accessedAt: r.accessed_at, createdAt: r.accessed_at || r.created_at } }

function mdRow(r: any) {
  const { companyId, contractId, categoryId, docType, fileUrl, fileSize, uploadedBy, createdAt, updatedAt, ...rest } = r
  return { ...rest, company_id: r.companyId, contract_id: r.contractId, category_id: r.categoryId, doc_type: r.docType, file_url: r.fileUrl, file_size: r.fileSize, uploaded_by: r.uploadedBy, created_at: r.createdAt, updated_at: r.updatedAt }
}
function mvRow(r: any) {
  const { documentId, versionNumber, fileUrl, fileSize, uploadedBy, uploadedAt, ...rest } = r
  return { ...rest, document_id: r.documentId, version_number: r.versionNumber, file_url: r.fileUrl, file_size: r.fileSize, uploaded_by: r.uploadedBy, uploaded_at: r.uploadedAt }
}
function maRow(r: any) {
  const { documentId, userId, accessedAt, createdAt, ...rest } = r
  return { ...rest, document_id: r.documentId, user_id: r.userId, accessed_at: r.accessedAt, created_at: r.createdAt }
}
