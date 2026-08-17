import type { Document, DocumentVersion, DocumentAccessLog, DocumentCategory, KnowledgeTool, KnowledgeDynamic, KnowledgeUsage, KnowledgeLink, KnowledgeFavorite } from '@/types/documents'
import { createSingleFlight } from '@/lib/single-flight'

const BASE = '/api/prisma/documents'

async function api(url: string, opts?: RequestInit) {
  if (opts?.method && opts.method !== 'GET') flight.invalidate()
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

const flight = createSingleFlight(() => api(BASE))

export const documentService = {
  async list(): Promise<Document[]> {
    const data = await flight.get()
    return (data.documents || []).map(md)
  },
  async listTools(): Promise<KnowledgeTool[]> {
    const data = await flight.get()
    return (data.tools || []).map(mt)
  },
  async listDynamics(): Promise<KnowledgeDynamic[]> {
    const data = await flight.get()
    return (data.dynamics || []).map(mdy)
  },
  async listUsage(): Promise<KnowledgeUsage[]> {
    const data = await flight.get()
    return (data.usage || []).map(mu)
  },
  async listLinks(): Promise<KnowledgeLink[]> {
    const data = await flight.get()
    return (data.links || []).map(ml)
  },
  async listFavorites(): Promise<KnowledgeFavorite[]> {
    const data = await flight.get()
    return (data.favorites || []).map(mf)
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
    const data = await flight.get()
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
    const data = await flight.get()
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
    const data = await flight.get()
    return data.categories || []
  },
  async createTool(input: Partial<KnowledgeTool>): Promise<KnowledgeTool> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'tool', ...input }),
    })
    return mt(data.tool)
  },
  async updateTool(id: string, input: Partial<KnowledgeTool>): Promise<KnowledgeTool> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'tool', id, ...input }),
    })
    return mt(data.tool)
  },
  async removeTool(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'tool', id }),
    })
  },
  async createDynamic(input: Partial<KnowledgeDynamic>): Promise<KnowledgeDynamic> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'dynamic', ...input }),
    })
    return mdy(data.dynamic)
  },
  async updateDynamic(id: string, input: Partial<KnowledgeDynamic>): Promise<KnowledgeDynamic> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'dynamic', id, ...input }),
    })
    return mdy(data.dynamic)
  },
  async removeDynamic(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'dynamic', id }),
    })
  },
  async createUsage(input: Partial<KnowledgeUsage>): Promise<KnowledgeUsage> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'usage', ...input }),
    })
    return mu(data.usage)
  },
  async updateUsage(id: string, input: Partial<KnowledgeUsage>): Promise<KnowledgeUsage> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'usage', id, ...input }),
    })
    return mu(data.usage)
  },
  async removeUsage(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'usage', id }),
    })
  },
  async createLink(input: Partial<KnowledgeLink>): Promise<KnowledgeLink> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'link', ...input }),
    })
    return ml(data.link)
  },
  async removeLink(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'link', id }),
    })
  },
  async createFavorite(input: Partial<KnowledgeFavorite>): Promise<KnowledgeFavorite> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'favorite', ...input }),
    })
    return mf(data.favorite)
  },
  async removeFavorite(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'favorite', id }),
    })
  },
}

function md(r: any): Document { return { ...r, companyId: r.company_id, contractId: r.contract_id, categoryId: r.category_id, docType: r.doc_type, tags: r.tags, fileUrl: r.file_url, fileSize: r.file_size, uploadedBy: r.uploaded_by, createdAt: r.created_at, updatedAt: r.updated_at } }
function mv(r: any): DocumentVersion {
  return { ...r, documentId: r.document_id, versionNumber: r.version_number, fileUrl: r.file_url, fileSize: r.file_size, uploadedBy: r.uploaded_by, uploadedAt: r.uploaded_at || r.created_at }
}
function ma(r: any): DocumentAccessLog { return { ...r, documentId: r.document_id, userId: r.user_id, accessedAt: r.accessed_at, createdAt: r.accessed_at || r.created_at } }

function mt(r: any): KnowledgeTool {
  return {
    ...r,
    tenantId: r.tenant_id,
    servicoRelacionado: r.servico_relacionado,
    publicoAlvo: r.publico_alvo,
    duracaoEstimada: r.duracao_estimada,
    passoAPasso: r.passo_a_passo,
    resultadoEsperado: r.resultado_esperado,
    documentosComplementares: r.documentos_complementares,
    arquivoPrincipalUrl: r.arquivo_principal_url,
    criadoPor: r.criado_por,
    atualizadoPor: r.atualizado_por,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function mdy(r: any): KnowledgeDynamic {
  return {
    ...r,
    tenantId: r.tenant_id,
    numParticipantes: r.num_participantes,
    perguntasDiscussao: r.perguntas_discussao,
    resultadoEsperado: r.resultado_esperado,
    observacoesFacilitador: r.observacoes_facilitador,
    isClientVisible: r.is_client_visible,
    origemId: r.origem_id,
    criadoPor: r.criado_por,
    atualizadoPor: r.atualizado_por,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function mf(r: any): KnowledgeFavorite {
  return {
    ...r,
    userId: r.user_id,
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    createdAt: r.created_at,
  }
}

function mu(r: any): KnowledgeUsage {
  return {
    ...r,
    tenantId: r.tenant_id,
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    targetType: r.target_type,
    targetId: r.target_id,
    targetName: r.target_name,
    clientId: r.client_id,
    companyId: r.company_id,
    createdAt: r.created_at,
  }
}

function ml(r: any): KnowledgeLink {
  return {
    ...r,
    tenantId: r.tenant_id,
    resourceType: r.resource_type,
    resourceId: r.resource_id,
    targetType: r.target_type,
    targetId: r.target_id,
    targetName: r.target_name,
    createdAt: r.created_at,
  }
}


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
