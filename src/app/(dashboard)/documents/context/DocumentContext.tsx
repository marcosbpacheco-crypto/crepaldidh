'use client'

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { documentService } from '@/services/documentService'
import type { Document as DocT, DocumentVersion as DocVersionT, DocumentAccessLog, DocType, DocVisibility, DocStatus, DocApproval, DocAction } from '@/types/documents'

// Re-export types (backward compat with pages)
export type { DocType, DocVisibility, DocStatus, DocApproval, DocAction }
export type DocViewMode = 'cards' | 'table'

export interface Document extends DocT {}
export interface DocumentVersion extends DocVersionT {}
export interface AccessLog {
  id: string; documentId: string; userId?: string; userName?: string; action: DocAction; accessedAt: string; createdAt: string
}
export interface DocFilter {
  search: string; type: DocType | 'all'; companyId: string | 'all'; projectId: string | 'all'; status: DocStatus | 'all'; visibility: DocVisibility | 'all'
}

const DOC_TYPE_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
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
  template: { label: 'Modelo', color: 'text-slate-600', bg: 'bg-slate-50 border-slate-100' },
  other: { label: 'Outros', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-100' },
}

const VISIBILITY_CONFIG: Record<string, { label: string; color: string }> = {
  internal: { label: 'Interno', color: 'text-slate-600 bg-slate-100' },
  portal: { label: 'Portal do Cliente', color: 'text-violet-600 bg-violet-100' },
  restricted: { label: 'Restrito', color: 'text-red-600 bg-red-100' },
  financial: { label: 'Financeiro', color: 'text-green-600 bg-green-100' },
  technical: { label: 'Técnico', color: 'text-blue-600 bg-blue-100' },
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'text-slate-500 bg-slate-100' },
  approved: { label: 'Aprovado', color: 'text-emerald-600 bg-emerald-100' },
  rejected: { label: 'Rejeitado', color: 'text-red-600 bg-red-100' },
  archived: { label: 'Arquivado', color: 'text-slate-400 bg-slate-100' },
  expired: { label: 'Expirado', color: 'text-orange-600 bg-orange-100' },
}

const OLD_TYPE_ALIASES: Record<string, string> = {
  contrato: 'contract',
  contratos: 'contract',
  proposta: 'proposal',
  propostas: 'proposal',
  relatorio: 'report',
  relatório: 'report',
  relatorios: 'report',
  relatórios: 'report',
  certificado: 'certificate',
  certificados: 'certificate',
  outros: 'other',
}

const FALLBACK_DOC_TYPE = { label: 'Outros', color: 'text-slate-500', bg: 'bg-slate-50 border-slate-100' }
const FALLBACK_VISIBILITY = { label: 'Interno', color: 'text-slate-600 bg-slate-100' }
const FALLBACK_STATUS = { label: 'Rascunho', color: 'text-slate-500 bg-slate-100' }

function normalizeDocType(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) return 'other'
  const key = value.trim().toLowerCase()
  return OLD_TYPE_ALIASES[key] ?? key
}

function getDocTypeConfig(value: unknown): { label: string; color: string; bg: string } {
  if (typeof value !== 'string' || !value.trim()) return FALLBACK_DOC_TYPE
  const key = normalizeDocType(value)
  return DOC_TYPE_CONFIG[key] ?? FALLBACK_DOC_TYPE
}

function getVisibilityConfig(value: unknown): { label: string; color: string } {
  if (typeof value !== 'string' || !value.trim()) return FALLBACK_VISIBILITY
  const key = value.trim().toLowerCase()
  return VISIBILITY_CONFIG[key] ?? FALLBACK_VISIBILITY
}

function getStatusConfig(value: unknown): { label: string; color: string } {
  if (typeof value !== 'string' || !value.trim()) return FALLBACK_STATUS
  const key = value.trim().toLowerCase()
  return STATUS_CONFIG[key] ?? FALLBACK_STATUS
}

interface DocumentContextType {
  documents: Document[]; versions: DocumentVersion[]; accessLogs: AccessLog[]
  docTypeConfig: typeof DOC_TYPE_CONFIG; visibilityConfig: typeof VISIBILITY_CONFIG; statusConfig: typeof STATUS_CONFIG
  getDocTypeConfig: (value: unknown) => { label: string; color: string; bg: string }
  getVisibilityConfig: (value: unknown) => { label: string; color: string }
  getStatusConfig: (value: unknown) => { label: string; color: string }
  normalizeDocType: (value: unknown) => string
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
  const qc = useQueryClient()
  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: ['documents'] }), [qc])

  const { data: documents = [] } = useQuery({ queryKey: ['documents'], queryFn: () => documentService.list() })
  const { data: versions = [] } = useQuery({ queryKey: ['documents', 'versions'], queryFn: () => documentService.listVersions() })
  const { data: accessLogs = [] } = useQuery({ queryKey: ['documents', 'accessLogs'], queryFn: () => documentService.listAccessLogs() })

  const addDocMut = useMutation({ mutationFn: (input: any) => documentService.create(input), onSuccess: invalidate })
  const updateDocMut = useMutation({ mutationFn: ({ id, ...i }: { id: string } & any) => documentService.update(id, i), onSuccess: invalidate })
  const deleteDocMut = useMutation({ mutationFn: (id: string) => documentService.remove(id), onSuccess: invalidate })
  const addVerMut = useMutation({ mutationFn: (input: any) => documentService.createVersion(input), onSuccess: invalidate })
  const logAccessMut = useMutation({ mutationFn: (input: any) => documentService.logAccess(input), onSuccess: invalidate })

  const addDocument = useCallback((d: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>): Document => {
    const now = new Date().toISOString()
    const doc: Document = { ...d, id: `doc-${Date.now()}`, currentVersion: 1, createdAt: now, updatedAt: now }
    addDocMut.mutate(doc)
    logAccessMut.mutate({ documentId: doc.id, userName: d.createdBy, action: 'upload' as DocAction })
    return doc
  }, [addDocMut, logAccessMut])

  const updateDocument = useCallback((id: string, data: Partial<Document>) => {
    updateDocMut.mutate({ id, ...data })
  }, [updateDocMut])

  const deleteDocument = useCallback((id: string) => {
    deleteDocMut.mutate(id)
  }, [deleteDocMut])

  const addVersion = useCallback((docId: string, v: Omit<DocumentVersion, 'id' | 'uploadedAt' | 'versionNumber'>): DocumentVersion => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) throw new Error('Documento não encontrado')
    const newVersionNumber = (doc.currentVersion || 1) + 1
    const nv: DocumentVersion = { ...v, id: `dv-${Date.now()}`, documentId: docId, versionNumber: newVersionNumber, uploadedAt: new Date().toISOString() }
    addVerMut.mutate(nv)
    updateDocMut.mutate({ id: docId, currentVersion: newVersionNumber })
    logAccessMut.mutate({ documentId: docId, userName: v.uploadedBy, action: 'version' as DocAction })
    return nv
  }, [documents, addVerMut, updateDocMut, logAccessMut])

  const getVersions = useCallback((docId: string) => versions.filter(v => v.documentId === docId).sort((a, b) => (b.versionNumber || 0) - (a.versionNumber || 0)), [versions])
  const getDocumentsByCompany = useCallback((companyId: string) => documents.filter(d => d.companyId === companyId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [documents])
  const getDocumentsByProject = useCallback((projectId: string) => documents.filter(d => d.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [documents])

  const logAccess = useCallback((docId: string, userName: string | undefined, action: DocAction) => {
    logAccessMut.mutate({ documentId: docId, userName, action, createdAt: new Date().toISOString(), id: `al-${Date.now()}` })
  }, [logAccessMut])

  const getAccessLogs = useCallback((docId: string) => (accessLogs as AccessLog[]).filter(l => l.documentId === docId).sort((a, b) => new Date(b.accessedAt || b.createdAt || 0).getTime() - new Date(a.accessedAt || a.createdAt || 0).getTime()), [accessLogs])

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
      docTypeConfig: DOC_TYPE_CONFIG, visibilityConfig: VISIBILITY_CONFIG, statusConfig: STATUS_CONFIG,
      getDocTypeConfig, getVisibilityConfig, getStatusConfig, normalizeDocType,
      addDocument, updateDocument, deleteDocument, addVersion, getVersions,
      getDocumentsByCompany, getDocumentsByProject, logAccess, getAccessLogs, saveFile,
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
