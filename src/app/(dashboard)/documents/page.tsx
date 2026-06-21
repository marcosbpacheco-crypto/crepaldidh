'use client'

import { useState, useMemo, useCallback } from 'react'
import { useDocuments, DocType, DocVisibility, DocStatus, DocViewMode, DocType as DocTypeT } from './context/DocumentContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useAdmin } from '@/app/(dashboard)/admin/context/AdminContext'
import {
  FileText, Search, Upload, Grid3X3, List, Filter, X, Download,
  Plus, Building2, FolderKanban, Eye, History, Shield, FileUp,
  ChevronDown, Clock, User, Tag, AlertCircle, CheckCircle2,
  Trash2, ExternalLink, Archive, RotateCcw, Menu, Lock
} from 'lucide-react'

type DocsTab = 'library' | 'byClient' | 'byProject'

function fmtSize(bytes?: number) {
  if (!bytes) return ''
  const s = bytes / 1024
  if (s < 1024) return `${s.toFixed(1)} KB`
  return `${(s / 1024).toFixed(1)} MB`
}

function fmtDate(d: string) { return new Date(d + (d.includes('T') ? '' : 'T12:00:00')).toLocaleDateString('pt-BR') }

const DOC_TYPES: { value: DocType; label: string }[] = [
  { value: 'contract', label: 'Contrato' }, { value: 'proposal', label: 'Proposta' },
  { value: 'report', label: 'Relatório' }, { value: 'diagnostic', label: 'Diagnóstico' },
  { value: 'inventory', label: 'Inventário' }, { value: 'action_plan', label: 'Plano de Ação' },
  { value: 'certificate', label: 'Certificado' }, { value: 'attendance_list', label: 'Lista de Presença' },
  { value: 'training_material', label: 'Material Treinamento' }, { value: 'evidence', label: 'Evidência' },
  { value: 'meeting_minutes', label: 'Ata' }, { value: 'financial', label: 'Financeiro' },
]

export default function DocumentsPage() {
  const doc = useDocuments()
  const crm = useCrm()
  const { currentUser } = useAdmin()
  const isContractAllowed = currentUser?.roleName === 'Administrador' || currentUser?.roleName === 'Diretor'
  const visibleDocuments = useMemo(() => isContractAllowed ? doc.documents : doc.documents.filter(d => d.type !== 'contract' && d.type !== 'proposal'), [doc.documents, isContractAllowed])
  const [tab, setTab] = useState<DocsTab>('library')
  const [viewMode, setViewMode] = useState<DocViewMode>('cards')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState<DocType | 'all'>('all')
  const [filterCompany, setFilterCompany] = useState<string | 'all'>('all')
  const [filterStatus, setFilterStatus] = useState<DocStatus | 'all'>('all')
  const [filterVisibility, setFilterVisibility] = useState<DocVisibility | 'all'>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showDetailModal, setShowDetailModal] = useState<string | null>(null)
  const [showVersionModal, setShowVersionModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)

  const filteredDocs = useMemo(() => {
    let list = visibleDocuments
    if (search) { const q = search.toLowerCase(); list = list.filter(d => d.name.toLowerCase().includes(q) || d.description?.toLowerCase().includes(q)) }
    if (filterType !== 'all') list = list.filter(d => d.type === filterType)
    if (filterCompany !== 'all') list = list.filter(d => d.companyId === filterCompany)
    if (filterStatus !== 'all') list = list.filter(d => d.status === filterStatus)
    if (filterVisibility !== 'all') list = list.filter(d => d.visibility === filterVisibility)
    return list.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }, [visibleDocuments, search, filterType, filterCompany, filterStatus, filterVisibility])

  const companies = crm.companies.filter(c => c.status === 'active' || !c.status)
  const activeFilters = [filterType, filterCompany, filterStatus, filterVisibility].filter(f => f !== 'all').length

  // Count docs per company
  const docsByCompany = useMemo(() => {
    const map = new Map<string, { company: (typeof crm.companies)[0]; docs: typeof doc.documents; count: number }>()
    visibleDocuments.forEach(d => {
      if (!d.companyId) return
      const company = crm.companies.find(c => c.id === d.companyId)
      if (!company) return
      const existing = map.get(d.companyId)
      if (existing) existing.docs.push(d)
      else map.set(d.companyId, { company, docs: [d], count: 0 })
    })
    map.forEach((v) => { v.count = v.docs.length })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [visibleDocuments, crm.companies])

  const docsByProject = useMemo(() => {
    const map = new Map<string, { project: (typeof crm.contracts)[0]; docs: typeof doc.documents; count: number }>()
    visibleDocuments.forEach(d => {
      if (!d.projectId) return
      const project = crm.contracts.find(c => c.id === d.projectId)
      if (!project) return
      const existing = map.get(d.projectId)
      if (existing) existing.docs.push(d)
      else map.set(d.projectId, { project, docs: [d], count: 0 })
    })
    map.forEach((v) => { v.count = v.docs.length })
    return Array.from(map.values()).sort((a, b) => b.count - a.count)
  }, [visibleDocuments, crm.contracts])

  // Upload form
  const [uploadForm, setUploadForm] = useState({
    name: '', type: 'contract' as DocType, description: '', companyId: '', projectId: '',
    module: '', visibility: 'internal' as DocVisibility, file: null as File | null,
  })
  const [uploading, setUploading] = useState(false)

  const handleUpload = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!uploadForm.name.trim()) return
    setUploading(true)
    let fileUrl: string | undefined
    let fileSize: number | undefined
    let fileType: string | undefined
    if (uploadForm.file) {
      fileUrl = await doc.saveFile(uploadForm.file)
      fileSize = uploadForm.file.size
      fileType = uploadForm.file.type || uploadForm.file.name.split('.').pop() || undefined
    }
    const company = crm.companies.find(c => c.id === uploadForm.companyId)
    const project = crm.contracts.find(c => c.id === uploadForm.projectId)
    doc.addDocument({
      name: uploadForm.name, type: uploadForm.type, description: uploadForm.description || undefined,
      companyId: uploadForm.companyId || undefined, companyName: company?.name || company?.tradeName || undefined,
      projectId: uploadForm.projectId || undefined, projectName: project?.title || undefined,
      module: uploadForm.module || undefined, visibility: uploadForm.visibility,
      status: 'draft', fileUrl, fileSize, fileType, approvalStatus: 'pending', createdBy: 'Admin',
    })
    setShowUploadModal(false)
    setUploadForm({ name: '', type: 'contract', description: '', companyId: '', projectId: '', module: '', visibility: 'internal', file: null })
    setUploading(false)
  }, [uploadForm, doc, crm.companies, crm.contracts])

  // Version upload
  const [versionForm, setVersionForm] = useState({ changeDescription: '', file: null as File | null })
  const [versioningDocId, setVersioningDocId] = useState<string | null>(null)
  const [versioning, setVersioning] = useState(false)

  const handleAddVersion = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    if (!versioningDocId) return
    setVersioning(true)
    let fileUrl: string | undefined
    let fileSize: number | undefined
    let fileType: string | undefined
    if (versionForm.file) {
      fileUrl = await doc.saveFile(versionForm.file)
      fileSize = versionForm.file.size
      fileType = versionForm.file.type || versionForm.file.name.split('.').pop() || undefined
    }
    doc.addVersion(versioningDocId, {
      documentId: versioningDocId, fileUrl, fileSize, fileType,
      changeDescription: versionForm.changeDescription || undefined, uploadedBy: 'Admin',
    })
    setShowVersionModal(false)
    setVersioningDocId(null)
    setVersionForm({ changeDescription: '', file: null })
    setVersioning(false)
  }, [versioningDocId, versionForm, doc])

  const selectedDoc = showDetailModal ? visibleDocuments.find(d => d.id === showDetailModal) : null
  const docVersions = showDetailModal ? doc.getVersions(showDetailModal) : []
  const docLogs = showDetailModal ? doc.getAccessLogs(showDetailModal) : []

  // ===== RENDER FUNCTIONS =====

  const renderFilters = () => (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative flex-1 min-w-[200px] max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar documentos..." className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400 transition-colors" />
      </div>
      <select value={filterType} onChange={e => setFilterType(e.target.value as DocType | 'all')} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400">
        <option value="all">Todos os tipos</option>
        {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>
      <select value={filterCompany} onChange={e => setFilterCompany(e.target.value)} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400 max-w-[160px]">
        <option value="all">Todos os clientes</option>
        {companies.map(c => <option key={c.id} value={c.id}>{c.name || c.tradeName}</option>)}
      </select>
      <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as DocStatus | 'all')} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400">
        <option value="all">Todos status</option>
        <option value="draft">Rascunho</option><option value="approved">Aprovado</option>
        <option value="rejected">Rejeitado</option><option value="archived">Arquivado</option>
        <option value="expired">Expirado</option>
      </select>
      <select value={filterVisibility} onChange={e => setFilterVisibility(e.target.value as DocVisibility | 'all')} className="px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400">
        <option value="all">Todas visibilidades</option>
        <option value="internal">Interno</option><option value="portal">Portal do Cliente</option>
        <option value="restricted">Restrito</option><option value="financial">Financeiro</option>
        <option value="technical">Técnico</option>
      </select>
      {activeFilters > 0 && <button onClick={() => { setFilterType('all'); setFilterCompany('all'); setFilterStatus('all'); setFilterVisibility('all'); setSearch('') }} className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-colors flex items-center gap-1"><X className="w-3 h-3" /> Limpar</button>}
    </div>
  )

  const renderDocCard = (d: typeof doc.documents[0]) => {
    const tc = doc.docTypeConfig[d.type]
    const sc = doc.statusConfig[d.status]
    return (
      <div key={d.id} onClick={() => setShowDetailModal(d.id)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group">
        <div className="flex items-start justify-between mb-3">
          <div className={`p-2.5 rounded-xl ${tc.bg}`}><FileText className={`w-5 h-5 ${tc.color}`} /></div>
          <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full ${sc.color} border`}>{sc.label}</span>
        </div>
        <p className="text-xs font-bold text-slate-800 mb-1 line-clamp-2 group-hover:text-violet-700 transition-colors">{d.name}</p>
        <p className="text-[10px] text-slate-400 mb-2 line-clamp-1">{d.companyName || 'Sem cliente'}</p>
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${tc.bg}`}>{tc.label}</span>
          <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${doc.visibilityConfig[d.visibility].color}`}>{doc.visibilityConfig[d.visibility].label}</span>
        </div>
        <div className="flex items-center justify-between text-[9px] text-slate-400 pt-2 border-t border-slate-50">
          <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{fmtDate(d.updatedAt)}</span>
          <span className="flex items-center gap-1"><History className="w-3 h-3" />v{d.currentVersion}</span>
        </div>
      </div>
    )
  }

  const renderDocRow = (d: typeof doc.documents[0]) => {
    const tc = doc.docTypeConfig[d.type]
    const sc = doc.statusConfig[d.status]
    return (
      <tr key={d.id} onClick={() => setShowDetailModal(d.id)} className="border-b border-slate-50 hover:bg-violet-50/30 cursor-pointer transition-colors">
        <td className="py-3 px-3"><div className="flex items-center gap-3">
          <div className={`p-1.5 rounded-lg ${tc.bg}`}><FileText className={`w-3.5 h-3.5 ${tc.color}`} /></div>
          <div><p className="text-xs font-bold text-slate-800">{d.name}</p><p className="text-[9px] text-slate-400">{d.companyName || 'Sem cliente'} • {d.projectName || 'Sem projeto'}</p></div>
        </div></td>
        <td className="py-3 px-3"><span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${tc.bg}`}>{tc.label}</span></td>
        <td className="py-3 px-3"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${doc.visibilityConfig[d.visibility].color}`}>{doc.visibilityConfig[d.visibility].label}</span></td>
        <td className="py-3 px-3"><span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full ${sc.color} border`}>{sc.label}</span></td>
        <td className="py-3 px-3 text-xs text-slate-600 text-center">{d.currentVersion}</td>
        <td className="py-3 px-3 text-[10px] text-slate-400">{fmtDate(d.updatedAt)}</td>
        <td className="py-3 px-3 text-right">
          <button onClick={(e) => { e.stopPropagation(); handleDownload(d) }} className="p-1.5 hover:bg-violet-100 rounded-lg text-slate-400 hover:text-violet-600 transition-colors"><Download className="w-3.5 h-3.5" /></button>
          <button onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(d.id) }} className="p-1.5 hover:bg-red-100 rounded-lg text-slate-400 hover:text-red-600 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
        </td>
      </tr>
    )
  }

  const handleDownload = (d: typeof doc.documents[0]) => {
    if (!isContractAllowed && (d.type === 'contract' || d.type === 'proposal')) return
    doc.logAccess(d.id, 'Admin', 'download')
    const content = `${d.name}\n\nTipo: ${doc.docTypeConfig[d.type].label}\nCliente: ${d.companyName || '-'}\nProjeto: ${d.projectName || '-'}\nDescrição: ${d.description || '-'}\nVersão: ${d.currentVersion}\nStatus: ${doc.statusConfig[d.status].label}`
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `${d.name.replace(/\s+/g, '_')}.txt`; a.click()
    URL.revokeObjectURL(url)
  }

  // ===== MAIN RENDER =====
  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-slate-800">Central de Documentos</h1>
          <p className="text-sm text-slate-500 mt-0.5">{visibleDocuments.length} documentos cadastrados</p>
        </div>
        <button onClick={() => setShowUploadModal(true)} className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition-all"><Upload className="w-4 h-4" /> Novo Documento</button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-slate-100 pb-1">
        {([{ id: 'library' as const, label: 'Biblioteca', icon: FileText },
          { id: 'byClient' as const, label: 'Por Cliente', icon: Building2 },
          { id: 'byProject' as const, label: 'Por Projeto', icon: FolderKanban },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all ${tab === t.id ? 'bg-white text-violet-700 border border-b-white border-slate-100 -mb-[1px] shadow-sm' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}>
            <t.icon className="w-4 h-4" />{t.label}
          </button>
        ))}
      </div>

      {/* Library Tab */}
      {tab === 'library' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            {renderFilters()}
            <div className="flex gap-1 bg-slate-100 rounded-lg p-0.5">
              <button onClick={() => setViewMode('cards')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}><Grid3X3 className="w-4 h-4" /></button>
              <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-md transition-colors ${viewMode === 'table' ? 'bg-white shadow-sm text-violet-600' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-4 h-4" /></button>
            </div>
          </div>

          {viewMode === 'cards' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredDocs.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
                  <FileText className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-sm font-medium text-slate-400">Nenhum documento encontrado</p>
                  <p className="text-xs text-slate-300 mt-1">Tente alterar os filtros ou cadastre um novo documento</p>
                </div>
              ) : filteredDocs.map(renderDocCard)}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase">Documento</th>
                    <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase">Tipo</th>
                    <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase">Visibilidade</th>
                    <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase">Status</th>
                    <th className="text-center py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase">Versão</th>
                    <th className="text-left py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase">Atualizado</th>
                    <th className="text-right py-2.5 px-3 text-[9px] font-bold text-slate-400 uppercase">Ações</th>
                  </tr></thead>
                  <tbody>{filteredDocs.length === 0 ? <tr><td colSpan={7} className="text-center py-16 text-slate-400 text-xs">Nenhum documento encontrado</td></tr> : filteredDocs.map(renderDocRow)}</tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* By Client Tab */}
      {tab === 'byClient' && (
        <div className="space-y-4">
          {docsByCompany.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
              <Building2 className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-400">Nenhum documento vinculado a cliente</p>
            </div>
          ) : docsByCompany.map(({ company, docs: cdocs, count }) => (
            <div key={company.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm"><Building2 className="w-5 h-5 text-white" /></div>
                  <div><h3 className="text-sm font-bold text-slate-800">{company.name || company.tradeName}</h3></div>
                </div>
                <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2.5 py-1 rounded-full">{count} documento(s)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                {cdocs.map(renderDocCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* By Project Tab */}
      {tab === 'byProject' && (
        <div className="space-y-4">
          {docsByProject.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center shadow-sm">
              <FolderKanban className="w-12 h-12 text-slate-200 mx-auto mb-4" />
              <p className="text-sm font-medium text-slate-400">Nenhum documento vinculado a projeto</p>
            </div>
          ) : docsByProject.map(({ project, docs: pdocs, count }) => (
            <div key={project.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-sm"><FolderKanban className="w-5 h-5 text-white" /></div>
                  <div><h3 className="text-sm font-bold text-slate-800">{project.title}</h3><p className="text-[10px] text-slate-400">R$ {project.value.toLocaleString('pt-BR')}</p></div>
                </div>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full">{count} documento(s)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 p-4">
                {pdocs.map(renderDocCard)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div><h2 className="text-lg font-bold text-slate-800">Novo Documento</h2><p className="text-xs text-slate-500">Cadastre um novo documento no sistema</p></div>
              <button onClick={() => setShowUploadModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2"><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Nome do Documento *</label>
                  <input required value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} placeholder="Ex: Contrato Anual - Cliente" className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-violet-400" /></div>
                <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Tipo</label>
                  <select value={uploadForm.type} onChange={e => setUploadForm({ ...uploadForm, type: e.target.value as DocType })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400">
                    {DOC_TYPES.filter(t => isContractAllowed || (t.value !== 'contract' && t.value !== 'proposal')).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select></div>
                <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Visibilidade</label>
                  <select value={uploadForm.visibility} onChange={e => setUploadForm({ ...uploadForm, visibility: e.target.value as DocVisibility })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400">
                    <option value="internal">Interno</option><option value="portal">Portal do Cliente</option>
                    <option value="restricted">Restrito à Diretoria</option><option value="financial">Financeiro</option>
                    <option value="technical">Técnico</option>
                  </select></div>
                <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Cliente</label>
                  <select value={uploadForm.companyId} onChange={e => setUploadForm({ ...uploadForm, companyId: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400">
                    <option value="">Sem cliente</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name || c.tradeName}</option>)}
                  </select></div>
                <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Projeto</label>
                  <select value={uploadForm.projectId} onChange={e => setUploadForm({ ...uploadForm, projectId: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400">
                    <option value="">Sem projeto</option>
                    {crm.contracts.filter(c => !uploadForm.companyId || c.companyId === uploadForm.companyId).map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select></div>
                <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Módulo de Origem</label>
                  <select value={uploadForm.module} onChange={e => setUploadForm({ ...uploadForm, module: e.target.value })} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:border-violet-400">
                    <option value="">Selecione</option>
                    <option value="crm">CRM</option><option value="nr01">NR01</option>
                    <option value="trainings">Treinamentos</option><option value="mentoring">Mentorias/PDI</option>
                    <option value="financial">Financeiro</option><option value="portal">Portal do Cliente</option>
                    <option value="documents">Central de Documentos</option>
                  </select></div>
              </div>
              <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Descrição</label>
                <textarea value={uploadForm.description} onChange={e => setUploadForm({ ...uploadForm, description: e.target.value })} rows={3} className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs resize-none focus:outline-none focus:border-violet-400" placeholder="Descreva o documento..." /></div>
              <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Arquivo (opcional)</label>
                <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-violet-300 transition-colors bg-slate-50/50">
                  <FileUp className="w-5 h-5 text-slate-400" />
                  <div className="flex-1 min-w-0"><p className="text-xs text-slate-600">{uploadForm.file ? uploadForm.file.name : 'Clique para selecionar um arquivo'}</p>
                    {uploadForm.file && <p className="text-[9px] text-slate-400">{fmtSize(uploadForm.file.size)}</p>}</div>
                  <input type="file" className="hidden" onChange={e => setUploadForm({ ...uploadForm, file: e.target.files?.[0] || null })} /></label></div>
              <div className="flex gap-3 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
                <button type="submit" disabled={uploading || !uploadForm.name.trim()} className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {uploading ? <><Upload className="w-3.5 h-3.5 animate-pulse" /> Enviando...</> : <><Upload className="w-3.5 h-3.5" /> Upload</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowDetailModal(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`p-2.5 rounded-xl ${doc.docTypeConfig[selectedDoc.type].bg}`}><FileText className={`w-5 h-5 ${doc.docTypeConfig[selectedDoc.type].color}`} /></div>
                <div className="min-w-0"><h2 className="text-lg font-bold text-slate-800 truncate">{selectedDoc.name}</h2><p className="text-xs text-slate-500">{doc.docTypeConfig[selectedDoc.type].label} • v{selectedDoc.currentVersion}</p></div>
              </div>
              <button onClick={() => setShowDetailModal(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-6">
              {/* Info grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Tipo', value: doc.docTypeConfig[selectedDoc.type].label },
                  { label: 'Status', value: doc.statusConfig[selectedDoc.status].label },
                  { label: 'Visibilidade', value: doc.visibilityConfig[selectedDoc.visibility].label },
                  { label: 'Versão Atual', value: String(selectedDoc.currentVersion) },
                  { label: 'Cliente', value: selectedDoc.companyName || '-' },
                  { label: 'Projeto', value: selectedDoc.projectName || '-' },
                  { label: 'Módulo', value: selectedDoc.module || '-' },
                  { label: 'Criado em', value: fmtDate(selectedDoc.createdAt) },
                ].map(info => (
                  <div key={info.label} className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{info.label}</p>
                    <p className="text-xs font-bold text-slate-700 mt-0.5">{info.value}</p>
                  </div>
                ))}
              </div>

              {/* Signature info */}
              {selectedDoc.signatureCode && (
                <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100 p-4">
                  <h4 className="text-xs font-bold text-emerald-800 flex items-center gap-2 mb-2"><Shield className="w-4 h-4" /> Documento Assinado Digitalmente</h4>
                  <div className="grid grid-cols-3 gap-3 text-[10px]">
                    <div><span className="text-emerald-500 font-bold">Código:</span> <span className="text-emerald-800 font-mono">{selectedDoc.signatureCode}</span></div>
                    <div><span className="text-emerald-500 font-bold">Assinado por:</span> <span className="text-emerald-800">{selectedDoc.signedBy}</span></div>
                    <div><span className="text-emerald-500 font-bold">Validade:</span> <span className="text-emerald-800">{selectedDoc.validUntil ? fmtDate(selectedDoc.validUntil) : 'Indeterminada'}</span></div>
                  </div>
                </div>
              )}

              {/* Description */}
              {selectedDoc.description && <div><h4 className="text-xs font-bold text-slate-700 mb-2">Descrição</h4><p className="text-xs text-slate-600 bg-slate-50 rounded-xl p-3 border border-slate-100">{selectedDoc.description}</p></div>}

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <button onClick={() => handleDownload(selectedDoc)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-colors ${isContractAllowed || (selectedDoc.type !== 'contract' && selectedDoc.type !== 'proposal') ? 'bg-violet-50 text-violet-700 hover:bg-violet-100' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`} disabled={!isContractAllowed && (selectedDoc.type === 'contract' || selectedDoc.type === 'proposal')}><Download className="w-3.5 h-3.5" /> Download</button>
                <button onClick={() => { setVersioningDocId(selectedDoc.id); setShowVersionModal(true); setShowDetailModal(null) }} className="flex items-center gap-1.5 px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-xs font-bold hover:bg-blue-100 transition-colors"><Upload className="w-3.5 h-3.5" /> Nova Versão</button>
                <button onClick={() => doc.updateDocument(selectedDoc.id, { status: selectedDoc.status === 'approved' ? 'archived' : 'approved' })} className="flex items-center gap-1.5 px-4 py-2 bg-amber-50 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-colors">
                  {selectedDoc.status === 'approved' ? <Archive className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                  {selectedDoc.status === 'approved' ? 'Arquivar' : selectedDoc.status === 'archived' ? 'Reativar' : 'Aprovar'}
                </button>
                <button onClick={() => { setShowDeleteConfirm(selectedDoc.id); setShowDetailModal(null) }} className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-700 rounded-xl text-xs font-bold hover:bg-red-100 transition-colors"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
              </div>

              {/* Version History */}
              <div><h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><History className="w-4 h-4 text-slate-400" /> Histórico de Versões</h4>
                {docVersions.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Nenhuma versão anterior</p> : (
                  <div className="space-y-2">{docVersions.map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">v{v.versionNumber}</div>
                        <div><p className="text-[11px] font-bold text-slate-800">{v.changeDescription || 'Sem descrição'}</p>
                          <p className="text-[9px] text-slate-400 flex items-center gap-2"><User className="w-2.5 h-2.5" />{v.uploadedBy || 'Admin'} • {fmtDate(v.uploadedAt)}</p></div>
                      </div>
                      {v.fileUrl && <button className="p-1.5 text-slate-400 hover:text-violet-600"><Download className="w-3.5 h-3.5" /></button>}
                    </div>
                  ))}</div>
                )}
              </div>

              {/* Access Logs */}
              <div><h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-2"><Eye className="w-4 h-4 text-slate-400" /> Registro de Acessos</h4>
                {docLogs.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Nenhum acesso registrado</p> : (
                  <div className="space-y-1 max-h-40 overflow-y-auto">{docLogs.map(l => (
                    <div key={l.id} className="flex items-center gap-3 p-2 text-[10px]">
                      <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-bold ${l.action === 'view' ? 'bg-blue-50 text-blue-600' : l.action === 'download' ? 'bg-emerald-50 text-emerald-600' : l.action === 'upload' || l.action === 'version' ? 'bg-violet-50 text-violet-600' : 'bg-slate-50 text-slate-600'}`}>{l.action}</span>
                      <span className="text-slate-600 font-medium">{l.userName || 'Admin'}</span>
                      <span className="text-slate-400 ml-auto">{fmtDate(l.createdAt)}</span>
                    </div>
                  ))}</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Version Upload Modal */}
      {showVersionModal && versioningDocId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4" onClick={() => setShowVersionModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div><h2 className="text-lg font-bold text-slate-800">Nova Versão</h2><p className="text-xs text-slate-500">Adicione uma nova versão do documento</p></div>
              <button onClick={() => setShowVersionModal(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleAddVersion} className="p-6 space-y-4">
              <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Arquivo</label>
                <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:border-violet-300 transition-colors bg-slate-50/50">
                  <FileUp className="w-5 h-5 text-slate-400" />
                  <div className="flex-1"><p className="text-xs text-slate-600">{versionForm.file ? versionForm.file.name : 'Selecionar arquivo'}</p></div>
                  <input type="file" className="hidden" onChange={e => setVersionForm({ ...versionForm, file: e.target.files?.[0] || null })} /></label></div>
              <div><label className="block text-[10px] font-bold text-slate-700 mb-1.5">Observações da Versão</label>
                <textarea value={versionForm.changeDescription} onChange={e => setVersionForm({ ...versionForm, changeDescription: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none focus:outline-none focus:border-violet-400" placeholder="O que mudou nesta versão?" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowVersionModal(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" disabled={versioning} className="flex-1 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 disabled:opacity-50">
                  {versioning ? 'Salvando...' : <><Upload className="w-3.5 h-3.5" /> Criar Versão</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[70] flex items-center justify-center p-4" onClick={() => setShowDeleteConfirm(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center mx-auto mb-4"><AlertCircle className="w-6 h-6 text-red-600" /></div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Excluir Documento?</h2>
            <p className="text-xs text-slate-500 mb-6">Esta ação não pode ser desfeita. O documento será permanentemente removido.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Cancelar</button>
              <button onClick={() => { doc.deleteDocument(showDeleteConfirm); setShowDeleteConfirm(null) }} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-700">Excluir</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
