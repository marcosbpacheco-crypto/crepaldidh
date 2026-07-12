'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react'
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

const SEED_DOCUMENTS: Document[] = []

const SEED_VERSIONS: DocumentVersion[] = []

const SEED_LOGS: AccessLog[] = []

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
  const loadedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || loadedRef.current) return
    loadedRef.current = true

    const get = <T,>(key: string, fallback: T): T => {
      try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback }
      catch { return fallback }
    }

    const loadFromLocal = () => {
      setDocuments(get('doc_documents', SEED_DOCUMENTS))
      setVersions(get('doc_versions', SEED_VERSIONS))
      setAccessLogs(get('doc_access_logs', SEED_LOGS))
    }

    loadFromLocal()

    fetch('/api/sync/documents')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data) {
          const d = res.data
          if (get('doc_documents', []).length === 0 && Array.isArray(d.documents) && d.documents.length > 0) setDocuments(d.documents as Document[])
          if (get('doc_versions', []).length === 0 && Array.isArray(d.versions) && d.versions.length > 0) setVersions(d.versions as DocumentVersion[])
          if (get('doc_access_logs', []).length === 0 && Array.isArray(d.accessLogs) && d.accessLogs.length > 0) setAccessLogs(d.accessLogs as AccessLog[])
          for (const [k, v] of Object.entries(d)) {
            if (Array.isArray(v) && v.length > 0) localStorage.setItem(`doc_${k}`, JSON.stringify(v))
          }
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasData = documents.length > 0 || versions.length > 0 || accessLogs.length > 0
    if (!hasData) return
    const timer = setTimeout(() => {
      const payload = { documents, versions, accessLogs }
      fetch('/api/sync/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merged: payload }),
      }).catch(err => console.error('DocumentContext sync error:', err))
      localStorage.setItem('doc_documents', JSON.stringify(documents))
      localStorage.setItem('doc_versions', JSON.stringify(versions))
      localStorage.setItem('doc_access_logs', JSON.stringify(accessLogs))
    }, 500)
    return () => clearTimeout(timer)
  }, [documents, versions, accessLogs])

  const addDocument = useCallback((d: Omit<Document, 'id' | 'createdAt' | 'updatedAt' | 'currentVersion'>): Document => {
    const now = new Date().toISOString()
    const doc: Document = { ...d, id: `doc-${Date.now()}`, currentVersion: 1, createdAt: now, updatedAt: now }
    setDocuments([doc, ...documents])
    logAccess(doc.id, d.createdBy, 'upload')
    return doc
  }, [documents])

  const updateDocument = useCallback((id: string, data: Partial<Document>) => {
    setDocuments(documents.map(d => d.id === id ? { ...d, ...data, updatedAt: new Date().toISOString() } : d))
  }, [documents])

  const deleteDocument = useCallback((id: string) => {
    setDocuments(documents.filter(d => d.id !== id))
    setVersions(versions.filter(v => v.documentId !== id))
  }, [documents, versions])

  const addVersion = useCallback((docId: string, v: Omit<DocumentVersion, 'id' | 'uploadedAt' | 'versionNumber'>): DocumentVersion => {
    const doc = documents.find(d => d.id === docId)
    if (!doc) throw new Error('Documento não encontrado')
    const newVersionNumber = doc.currentVersion + 1
    const nv: DocumentVersion = {
      ...v, id: `dv-${Date.now()}`, documentId: docId,
      versionNumber: newVersionNumber, uploadedAt: new Date().toISOString(),
    }
    setVersions(prev => [nv, ...prev])
    updateDocument(docId, { currentVersion: newVersionNumber })
    logAccess(docId, v.uploadedBy, 'version')
    return nv
  }, [documents, versions])

  const getVersions = useCallback((docId: string) => versions.filter(v => v.documentId === docId).sort((a, b) => b.versionNumber - a.versionNumber), [versions])

  const getDocumentsByCompany = useCallback((companyId: string) => documents.filter(d => d.companyId === companyId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [documents])

  const getDocumentsByProject = useCallback((projectId: string) => documents.filter(d => d.projectId === projectId).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()), [documents])

  const logAccess = useCallback((docId: string, userName: string | undefined, action: DocAction) => {
    const entry: AccessLog = { id: `al-${Date.now()}`, documentId: docId, userName, action, createdAt: new Date().toISOString() }
    setAccessLogs(prev => [entry, ...prev])
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
