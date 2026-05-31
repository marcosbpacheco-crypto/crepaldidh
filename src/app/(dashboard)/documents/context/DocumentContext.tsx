'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'

export type DocType =
  'contract' | 'proposal' | 'report' | 'diagnostic' | 'inventory' |
  'action_plan' | 'certificate' | 'attendance_list' | 'training_material' |
  'evidence' | 'meeting_minutes' | 'financial'

export type DocVisibility = 'internal' | 'portal' | 'restricted' | 'financial' | 'technical'
export type DocStatus = 'draft' | 'approved' | 'rejected' | 'archived' | 'expired'
export type DocApproval = 'pending' | 'approved' | 'rejected'
export type DocAction = 'view' | 'download' | 'edit' | 'delete' | 'share' | 'upload' | 'version'
export type DocViewMode = 'cards' | 'table'

export interface Document {
  id: string
  name: string
  type: DocType
  description?: string
  companyId?: string
  companyName?: string
  projectId?: string
  projectName?: string
  module?: string
  visibility: DocVisibility
  status: DocStatus
  fileUrl?: string
  fileSize?: number
  fileType?: string
  currentVersion: number
  signatureCode?: string
  signedAt?: string
  signedBy?: string
  validUntil?: string
  approvalStatus: DocApproval
  createdBy?: string
  createdAt: string
  updatedAt: string
}

export interface DocumentVersion {
  id: string
  documentId: string
  versionNumber: number
  fileUrl?: string
  fileSize?: number
  fileType?: string
  changeDescription?: string
  uploadedBy?: string
  uploadedAt: string
}

export interface AccessLog {
  id: string
  documentId: string
  userId?: string
  userName?: string
  action: DocAction
  createdAt: string
}

export interface DocFilter {
  search: string
  type: DocType | 'all'
  companyId: string | 'all'
  projectId: string | 'all'
  status: DocStatus | 'all'
  visibility: DocVisibility | 'all'
}

const DOC_TYPE_CONFIG: Record<DocType, { label: string; color: string; bg: string }> = {
  contract: { label: 'Contrato', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
  proposal: { label: 'Proposta', color: 'text-violet-600', bg: 'bg-violet-50 border-violet-100' },
  report: { label: 'Relatório', color: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100' },
  diagnostic: { label: 'Diagnóstico', color: 'text-sky-600', bg: 'bg-sky-50 border-sky-100' },
  inventory: { label: 'Inventário', color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
  action_plan: { label: 'Plano de Ação', color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
  certificate: { label: 'Certificado', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
  attendance_list: { label: 'Lista de Presença', color: 'text-lime-600', bg: 'bg-lime-50 border-lime-100' },
  training_material: { label: 'Material de Treinamento', color: 'text-teal-600', bg: 'bg-teal-50 border-teal-100' },
  evidence: { label: 'Evidência', color: 'text-pink-600', bg: 'bg-pink-50 border-pink-100' },
  meeting_minutes: { label: 'Ata', color: 'text-orange-600', bg: 'bg-orange-50 border-orange-100' },
  financial: { label: 'Financeiro', color: 'text-green-600', bg: 'bg-green-50 border-green-100' },
}

const VISIBILITY_CONFIG: Record<DocVisibility, { label: string; color: string }> = {
  internal: { label: 'Interno', color: 'text-slate-600 bg-slate-100' },
  portal: { label: 'Portal do Cliente', color: 'text-violet-600 bg-violet-100' },
  restricted: { label: 'Restrito', color: 'text-red-600 bg-red-100' },
  financial: { label: 'Financeiro', color: 'text-green-600 bg-green-100' },
  technical: { label: 'Técnico', color: 'text-blue-600 bg-blue-100' },
}

const STATUS_CONFIG: Record<DocStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'text-slate-500 bg-slate-100' },
  approved: { label: 'Aprovado', color: 'text-emerald-600 bg-emerald-100' },
  rejected: { label: 'Rejeitado', color: 'text-red-600 bg-red-100' },
  archived: { label: 'Arquivado', color: 'text-slate-400 bg-slate-100' },
  expired: { label: 'Expirado', color: 'text-orange-600 bg-orange-100' },
}

const SEED_DOCUMENTS: Document[] = [
  { id: 'doc-1', name: 'Contrato Anual DHO - BR Distribuidora', type: 'contract', description: 'Contrato de prestação de serviços de desenvolvimento humano e organizacional para o ano de 2026.', companyId: 'comp-1', companyName: 'BR Distribuidora', module: 'crm', visibility: 'internal', status: 'approved', currentVersion: 2, approvalStatus: 'approved', createdAt: new Date(Date.now() - 2592000000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'doc-2', name: 'Proposta PGR e Clima - Vale S.A.', type: 'proposal', description: 'Proposta comercial para diagnóstico de clima organizacional e elaboração de PGR.', companyId: 'comp-2', companyName: 'Vale S.A.', projectId: 'contract-3', projectName: 'Diagnóstico de Clima Vale', module: 'crm', visibility: 'portal', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 1209600000).toISOString(), updatedAt: new Date(Date.now() - 1209600000).toISOString() },
  { id: 'doc-3', name: 'Relatório Diagnóstico Psicossocial - BR', type: 'report', description: 'Relatório completo do diagnóstico psicossocial realizado na BR Distribuidora.', companyId: 'comp-1', companyName: 'BR Distribuidora', module: 'nr01', visibility: 'portal', status: 'approved', currentVersion: 3, signatureCode: 'DIG-2026-001', signedAt: new Date(Date.now() - 172800000).toISOString(), signedBy: 'Dr. Marcos Crepaldi', validUntil: '2027-05-15', approvalStatus: 'approved', createdAt: new Date(Date.now() - 518400000).toISOString(), updatedAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'doc-4', name: 'Inventário de Riscos - Itaú', type: 'inventory', description: 'Inventário completo de riscos psicossociais e ergonômicos.', companyId: 'comp-3', companyName: 'Banco Itaú', module: 'nr01', visibility: 'technical', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 1814400000).toISOString(), updatedAt: new Date(Date.now() - 1700000000).toISOString() },
  { id: 'doc-5', name: 'Plano de Ação - Setor Operacional BR', type: 'action_plan', description: 'Plano de ação para mitigação de riscos identificados no setor operacional.', companyId: 'comp-1', companyName: 'BR Distribuidora', projectId: 'contract-1', projectName: 'Consultoria DHO BR Distribuidora', module: 'nr01', visibility: 'portal', status: 'approved', currentVersion: 2, approvalStatus: 'approved', createdAt: new Date(Date.now() - 432000000).toISOString(), updatedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'doc-6', name: 'Certificados NR01 - Turma Maio/2026 BR', type: 'certificate', description: 'Certificados do treinamento de NR01 realizado em maio de 2026.', companyId: 'comp-1', companyName: 'BR Distribuidora', module: 'trainings', visibility: 'portal', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 864000000).toISOString(), updatedAt: new Date(Date.now() - 864000000).toISOString() },
  { id: 'doc-7', name: 'Lista de Presença - Treinamento Lideranças', type: 'attendance_list', description: 'Lista de presença do treinamento de lideranças em segurança psicológica.', companyId: 'comp-2', companyName: 'Vale S.A.', module: 'trainings', visibility: 'internal', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 604800000).toISOString(), updatedAt: new Date(Date.now() - 600000000).toISOString() },
  { id: 'doc-8', name: 'Apostila NR01 - Segurança Psicológica', type: 'training_material', description: 'Material didático completo do treinamento de segurança psicológica.', companyId: 'comp-2', companyName: 'Vale S.A.', module: 'trainings', visibility: 'portal', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 700000000).toISOString(), updatedAt: new Date(Date.now() - 690000000).toISOString() },
  { id: 'doc-9', name: 'Evidência - Adequação Ergonômica Itaú', type: 'evidence', description: 'Fotos e registros da adequação ergonômica realizada no Banco Itaú.', companyId: 'comp-3', companyName: 'Banco Itaú', module: 'nr01', visibility: 'internal', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 345600000).toISOString(), updatedAt: new Date(Date.now() - 340000000).toISOString() },
  { id: 'doc-10', name: 'Ata Reunião Alinhamento - Vale', type: 'meeting_minutes', description: 'Ata da reunião de alinhamento do projeto de mentoria regional.', companyId: 'comp-2', companyName: 'Vale S.A.', projectId: 'contract-3', projectName: 'Diagnóstico de Clima Vale', module: 'crm', visibility: 'internal', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 250000000).toISOString() },
  { id: 'doc-11', name: 'Nota Fiscal - Serviços BR Distribuidora', type: 'financial', description: 'Nota fiscal referente aos serviços prestados no mês de abril/2026.', companyId: 'comp-1', companyName: 'BR Distribuidora', module: 'financial', visibility: 'financial', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 1209600000).toISOString(), updatedAt: new Date(Date.now() - 1209600000).toISOString() },
  { id: 'doc-12', name: 'Relatório Mensal Mentoria - Maio/2026', type: 'report', description: 'Relatório mensal de acompanhamento do programa de mentoria.', companyId: 'comp-2', companyName: 'Vale S.A.', projectId: 'contract-3', projectName: 'Diagnóstico de Clima Vale', module: 'mentoring', visibility: 'portal', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 250000000).toISOString() },
  { id: 'doc-13', name: 'Diagnóstico Psicossocial - Gerdau', type: 'diagnostic', description: 'Diagnóstico psicossocial completo da empresa Gerdau.', companyId: 'comp-4', companyName: 'Gerdau', module: 'nr01', visibility: 'technical', status: 'draft', currentVersion: 1, approvalStatus: 'pending', createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 80000000).toISOString() },
  { id: 'doc-14', name: 'Proposta Palestra SIPAT 2026', type: 'proposal', description: 'Proposta para palestra na SIPAT 2026 da BR Distribuidora.', companyId: 'comp-1', companyName: 'BR Distribuidora', module: 'crm', visibility: 'internal', status: 'draft', currentVersion: 1, approvalStatus: 'pending', createdAt: new Date(Date.now() - 43200000).toISOString(), updatedAt: new Date(Date.now() - 40000000).toISOString() },
  { id: 'doc-15', name: 'Diagnóstico de Clima - Itaú Financeiro', type: 'financial', description: 'Relatório financeiro do diagnóstico de clima organizacional.', companyId: 'comp-3', companyName: 'Banco Itaú', module: 'financial', visibility: 'financial', status: 'approved', currentVersion: 1, approvalStatus: 'approved', createdAt: new Date(Date.now() - 500000000).toISOString(), updatedAt: new Date(Date.now() - 490000000).toISOString() },
]

const SEED_VERSIONS: DocumentVersion[] = [
  { id: 'dv-1', documentId: 'doc-1', versionNumber: 1, changeDescription: 'Versão inicial do contrato.', uploadedBy: 'Admin', uploadedAt: new Date(Date.now() - 2592000000).toISOString() },
  { id: 'dv-2', documentId: 'doc-1', versionNumber: 2, changeDescription: 'Atualização de cláusulas e valores.', uploadedBy: 'Admin', uploadedAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'dv-3', documentId: 'doc-3', versionNumber: 1, changeDescription: 'Versão inicial do relatório.', uploadedBy: 'Admin', uploadedAt: new Date(Date.now() - 518400000).toISOString() },
  { id: 'dv-4', documentId: 'doc-3', versionNumber: 2, changeDescription: 'Revisão após feedback do cliente.', uploadedBy: 'Admin', uploadedAt: new Date(Date.now() - 345600000).toISOString() },
  { id: 'dv-5', documentId: 'doc-3', versionNumber: 3, changeDescription: 'Versão final assinada digitalmente.', uploadedBy: 'Admin', uploadedAt: new Date(Date.now() - 172800000).toISOString() },
  { id: 'dv-6', documentId: 'doc-5', versionNumber: 1, changeDescription: 'Plano inicial.', uploadedBy: 'Admin', uploadedAt: new Date(Date.now() - 432000000).toISOString() },
  { id: 'dv-7', documentId: 'doc-5', versionNumber: 2, changeDescription: 'Ajustes conforme reunião com cliente.', uploadedBy: 'Admin', uploadedAt: new Date(Date.now() - 86400000).toISOString() },
]

const SEED_LOGS: AccessLog[] = [
  { id: 'al-1', documentId: 'doc-1', userName: 'Admin', action: 'upload', createdAt: new Date(Date.now() - 2592000000).toISOString() },
  { id: 'al-2', documentId: 'doc-3', userName: 'Carlos Silva', action: 'view', createdAt: new Date(Date.now() - 86400000).toISOString() },
  { id: 'al-3', documentId: 'doc-3', userName: 'Admin', action: 'download', createdAt: new Date(Date.now() - 43200000).toISOString() },
  { id: 'al-4', documentId: 'doc-5', userName: 'Ana Oliveira', action: 'view', createdAt: new Date(Date.now() - 7200000).toISOString() },
]

interface DocumentContextType {
  documents: Document[]
  versions: DocumentVersion[]
  accessLogs: AccessLog[]
  docTypeConfig: typeof DOC_TYPE_CONFIG
  visibilityConfig: typeof VISIBILITY_CONFIG
  statusConfig: typeof STATUS_CONFIG
  addDocument: (d: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>) => Document
  updateDocument: (id: string, data: Partial<Document>) => void
  deleteDocument: (id: string) => void
  addVersion: (docId: string, v: Omit<DocumentVersion, 'id' | 'uploadedAt' | 'versionNumber'>) => DocumentVersion
  getVersions: (docId: string) => DocumentVersion[]
  getDocumentsByCompany: (companyId: string) => Document[]
  getDocumentsByProject: (projectId: string) => Document[]
  logAccess: (docId: string, userName: string | undefined, action: DocAction) => void
  getAccessLogs: (docId: string) => AccessLog[]
  saveFile: (file: File) => Promise<string>
}

const DocumentContext = createContext<DocumentContextType | undefined>(undefined)

export const DocumentProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [documents, setDocuments] = useState<Document[]>([])
  const [versions, setVersions] = useState<DocumentVersion[]>([])
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const stored = localStorage.getItem('doc_documents')
    if (stored) { try { setDocuments(JSON.parse(stored)) } catch {} }
    else { setDocuments(SEED_DOCUMENTS) }
    const storedVersions = localStorage.getItem('doc_versions')
    if (storedVersions) { try { setVersions(JSON.parse(storedVersions)) } catch {} }
    else { setVersions(SEED_VERSIONS) }
    const storedLogs = localStorage.getItem('doc_access_logs')
    if (storedLogs) { try { setAccessLogs(JSON.parse(storedLogs)) } catch {} }
    else { setAccessLogs(SEED_LOGS) }
  }, [])

  const syncDocuments = (d: Document[]) => { setDocuments(d); localStorage.setItem('doc_documents', JSON.stringify(d)) }
  const syncVersions = (v: DocumentVersion[]) => { setVersions(v); localStorage.setItem('doc_versions', JSON.stringify(v)) }
  const syncLogs = (l: AccessLog[]) => { setAccessLogs(l); localStorage.setItem('doc_access_logs', JSON.stringify(l)) }

  const addDocument = useCallback((d: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>): Document => {
    const now = new Date().toISOString()
    const doc: Document = { ...d, id: `doc-${Date.now()}`, currentVersion: 1, createdAt: now, updatedAt: now }
    syncDocuments([doc, ...documents])
    logAccess(doc.id, d.createdBy, 'upload')
    return doc
  }, [documents])

  const updateDocument = useCallback((id: string, data: Partial<Document>) => {
    syncDocuments(documents.map(d => d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d))
  }, [documents])

  const deleteDocument = useCallback((id: string) => {
    syncDocuments(documents.filter(d => d.id !== id))
    syncVersions(versions.filter(v => v.documentId !== id))
  }, [documents, versions])

  const addVersion = useCallback((docId: string, v: Omit<DocumentVersion, 'id' | 'uploadedAt' | 'versionNumber'>): DocumentVersion => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) throw new Error('Documento não encontrado')
    const newVersionNumber = doc.currentVersion + 1
    const nv: DocumentVersion = {
      ...v, id: `dv-${Date.now()}`, documentId: docId,
      versionNumber: newVersionNumber, uploadedAt: new Date().toISOString(),
    }
    syncVersions([nv, ...versions])
    updateDocument(docId, { currentVersion: newVersionNumber })
    logAccess(docId, v.uploadedBy, 'version')
    return nv
  }, [documents, versions])

  const getVersions = useCallback((docId: string) => versions.filter(v => v.documentId === docId).sort((a, b) => b.versionNumber - a.versionNumber), [versions])

  const getDocumentsByCompany = useCallback((companyId: string) => documents.filter(d => d.companyId === companyId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [documents])

  const getDocumentsByProject = useCallback((projectId: string) => documents.filter(d => d.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [documents])

  const logAccess = useCallback((docId: string, userName: string | undefined, action: DocAction) => {
    const entry: AccessLog = { id: `al-${Date.now()}`, documentId: docId, userName, action, createdAt: new Date().toISOString() }
    syncLogs([entry, ...accessLogs])
  }, [accessLogs])

  const getAccessLogs = useCallback((docId: string) => accessLogs.filter(l => l.documentId === docId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()), [accessLogs])

  const saveFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result as string)
      reader.readAsDataURL(file)
    })
  }, [])

  return (
    <DocumentContext.Provider value={{
      documents, versions, accessLogs,
      docTypeConfig: DOC_TYPE_CONFIG,
      visibilityConfig: VISIBILITY_CONFIG,
      statusConfig: STATUS_CONFIG,
      addDocument, updateDocument, deleteDocument,
      addVersion, getVersions,
      getDocumentsByCompany, getDocumentsByProject,
      logAccess, getAccessLogs,
      saveFile,
    }}>
      {children}
    </DocumentContext.Provider>
  )
}

export const useDocuments = () => {
  const ctx = useContext(DocumentContext)
  if (!ctx) throw new Error('useDocuments must be used within a DocumentProvider')
  return ctx
}
