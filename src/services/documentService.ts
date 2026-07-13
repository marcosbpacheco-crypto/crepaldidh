import { getClient, handleError } from './base'
import type { Document, DocumentVersion, DocumentAccessLog, DocumentCategory } from '@/types/documents'

const DOCUMENTS_TABLE = 'documents'
const VERSIONS_TABLE = 'document_versions'
const ACCESS_LOGS_TABLE = 'document_access_logs'
const CATEGORIES_TABLE = 'document_categories'

export const documentService = {
  async list(): Promise<Document[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(DOCUMENTS_TABLE).select('*').order('created_at', { ascending: false })
    if (error) handleError(error, 'documentService.list')
    return (data || []).map(md)
  },
  async create(input: Partial<Document>): Promise<Document> {
    const supabase = getClient()
    const { data, error } = await supabase.from(DOCUMENTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'documentService.create')
    return md(data!)
  },
  async update(id: string, input: Partial<Document>): Promise<Document> {
    const supabase = getClient()
    const { data, error } = await supabase.from(DOCUMENTS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'documentService.update')
    return md(data!)
  },
  async remove(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(DOCUMENTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'documentService.remove')
  },
  async listVersions(documentId?: string): Promise<DocumentVersion[]> {
    const supabase = getClient()
    let q = supabase.from(VERSIONS_TABLE).select('*')
    if (documentId) q = q.eq('document_id', documentId)
    const { data, error } = await q.order('version_number', { ascending: false })
    if (error) handleError(error, 'documentService.listVersions')
    return (data || []).map(mv)
  },
  async createVersion(input: Partial<DocumentVersion>): Promise<DocumentVersion> {
    const supabase = getClient()
    const { data, error } = await supabase.from(VERSIONS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'documentService.createVersion')
    return mv(data!)
  },
  async listAccessLogs(documentId?: string): Promise<DocumentAccessLog[]> {
    const supabase = getClient()
    let q = supabase.from(ACCESS_LOGS_TABLE).select('*')
    if (documentId) q = q.eq('document_id', documentId)
    const { data, error } = await q.order('accessed_at', { ascending: false })
    if (error) handleError(error, 'documentService.listAccessLogs')
    return (data || []).map(ma)
  },
  async logAccess(input: Partial<DocumentAccessLog>): Promise<DocumentAccessLog> {
    const supabase = getClient()
    const { data, error } = await supabase.from(ACCESS_LOGS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'documentService.logAccess')
    return ma(data!)
  },
  async listCategories(): Promise<DocumentCategory[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CATEGORIES_TABLE).select('*').order('name')
    if (error) handleError(error, 'documentService.listCategories')
    return data || []
  },
}

function md(r: any): Document { return { ...r, companyId: r.company_id, contractId: r.contract_id, categoryId: r.category_id, docType: r.doc_type, tags: r.tags, fileUrl: r.file_url, fileSize: r.file_size, uploadedBy: r.uploaded_by, createdAt: r.created_at, updatedAt: r.updated_at } }
function mv(r: any): DocumentVersion {
  return { ...r, documentId: r.document_id, versionNumber: r.version_number, fileUrl: r.file_url, fileSize: r.file_size, uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at || r.created_at }
}
function ma(r: any): DocumentAccessLog { return { ...r, documentId: r.document_id, userId: r.user_id, accessedAt: r.accessed_at, createdAt: r.accessed_at || r.created_at } }
