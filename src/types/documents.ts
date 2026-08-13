export type DocType = 'contract' | 'proposal' | 'report' | 'diagnostic' | 'inventory' | 'action_plan' | 'certificate' | 'attendance_list' | 'training_material' | 'evidence' | 'meeting_minutes' | 'financial'
export type DocVisibility = 'internal' | 'portal' | 'restricted' | 'financial' | 'technical'
export type DocStatus = 'draft' | 'approved' | 'rejected' | 'archived' | 'expired'
export type DocApproval = 'pending' | 'approved' | 'rejected'
export type DocAction = 'view' | 'download' | 'edit' | 'delete' | 'share' | 'upload' | 'version'
export type DocViewMode = 'cards' | 'table'

export interface Document {
  id: string; name: string; type: DocType; description?: string; companyId?: string; companyName?: string
  projectId?: string; projectName?: string; module?: string; visibility: DocVisibility; status: DocStatus
  fileUrl?: string; fileSize?: number; fileType?: string; currentVersion: number; signatureCode?: string
  signedAt?: string; signedBy?: string; validUntil?: string; approvalStatus: DocApproval
  category?: string; tags?: string[]
  createdBy?: string; createdAt: string; updatedAt: string
}

export type ToolStatus = 'rascunho' | 'ativa' | 'arquivada'
export type ResourceType = 'tool' | 'dynamic' | 'document'

export interface ToolFile {
  name: string; type: string; size?: number; fileUrl: string
}

export interface ToolService {
  name: string; tipo?: string
}

export interface ToolHistoryEntry {
  data: string; usuario: string; evento: string; nota?: string; versao?: number
}

export interface KnowledgeTool {
  id: string
  tenantId?: string
  name: string
  description?: string
  finalidade?: string
  categoria: string
  tipo?: string
  servicoRelacionado?: string
  publicoAlvo?: string
  duracaoEstimada?: string
  objetivo?: string
  preparacao?: string
  passoAPasso?: string
  orientacoes?: string
  cuidados?: string
  resultadoEsperado?: string
  materiais?: string
  equipamentos?: string
  documentosComplementares?: string
  status: ToolStatus
  tags: string[]
  services: ToolService[]
  arquivoPrincipalUrl?: string
  arquivos: ToolFile[]
  historico: ToolHistoryEntry[]
  isClientVisible?: boolean
  versao?: number
  origemId?: string
  criadoPor?: string
  atualizadoPor?: string
  createdAt: string
  updatedAt: string
}

export type DynamicStatus = 'rascunho' | 'ativa' | 'arquivada'

export interface KnowledgeDynamic {
  id: string
  tenantId?: string
  name: string
  objetivo?: string
  publico?: string
  numParticipantes?: string
  duracao?: string
  dificuldade?: string
  contexto?: string
  materiais?: string
  preparacao?: string
  passoAPasso?: string
  perguntasDiscussao?: string
  resultadoEsperado?: string
  observacoesFacilitador?: string
  categoria: string
  tags: string[]
  status: DynamicStatus
  isClientVisible?: boolean
  arquivos: ToolFile[]
  historico: ToolHistoryEntry[]
  versao?: number
  origemId?: string
  criadoPor?: string
  atualizadoPor?: string
  createdAt: string
  updatedAt: string
}

export interface KnowledgeUsage {
  id: string
  tenantId?: string
  resourceType: ResourceType
  resourceId: string
  targetType: string
  targetId?: string
  targetName: string
  clientId?: string
  companyId?: string
  responsavel?: string
  data: string
  observacao?: string
  resultado?: string
  createdAt: string
}

export interface KnowledgeLink {
  id: string
  tenantId?: string
  resourceType: ResourceType
  resourceId: string
  targetType: string
  targetId?: string
  targetName: string
  createdAt: string
}

export interface KnowledgeFavorite {
  id: string
  userId: string
  resourceType: ResourceType
  resourceId: string
  createdAt: string
}
export interface DocumentVersion {
  id: string; documentId: string; versionNumber: number; fileUrl?: string; fileSize?: number; fileType?: string
  changeDescription?: string; uploadedBy?: string; uploadedAt: string
}
export interface AccessLog {
  id: string; documentId: string; userId?: string; userName?: string; action: DocAction; createdAt: string
}
export interface DocFilter {
  search: string; type: DocType | 'all'; companyId: string | 'all'; projectId: string | 'all'; status: DocStatus | 'all'; visibility: DocVisibility | 'all'
}
export interface DocumentCategory {
  id: string; name: string; description?: string; icon?: string; color?: string
}
export interface DocumentAccessLog {
  id: string; documentId: string; userId?: string; userName?: string; action: DocAction; accessedAt: string; createdAt: string
}
