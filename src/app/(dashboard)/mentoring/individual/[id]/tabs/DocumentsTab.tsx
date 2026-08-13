'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { FileText, Plus, Trash2, Link as LinkIcon, ExternalLink } from 'lucide-react'

const emptyForm = {
  name: '',
  type: '',
  fileUrl: '',
  description: '',
  sessionId: '',
}

export default function DocumentsTab({ program }: { program: MentoringProgram }) {
  const { addDocument, deleteDocument } = useMentoring()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  const documents = [...(Array.isArray(program.documents) ? program.documents : [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    addDocument({
      programId: program.id,
      sessionId: form.sessionId || undefined,
      name: form.name.trim(),
      type: form.type.trim() || undefined,
      fileUrl: form.fileUrl.trim() || undefined,
      description: form.description.trim() || undefined,
    })
    setShowForm(false)
    setForm(emptyForm)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-bold text-slate-800">Documentos</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{documents.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Materiais, relatórios e arquivos da mentoria</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> Novo Documento
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700">Novo Documento</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Nome *</span>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Relatório da 3ª sessão"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Tipo</span>
              <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                placeholder="Ex: relatorio, material, certificado"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">URL do arquivo</span>
              <input value={form.fileUrl} onChange={e => setForm({ ...form, fileUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Sessão vinculada</span>
              <select value={form.sessionId} onChange={e => setForm({ ...form, sessionId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                <option value="">Sem vínculo...</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Descrição</span>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
              Salvar Documento
            </button>
          </div>
        </form>
      )}

      {documents.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum documento vinculado</p>
          <p className="text-xs text-slate-400 mt-1">Anexe materiais e relatórios desta mentoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {documents.map(d => {
            const session = sessions.find(s => s.id === d.sessionId)
            return (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-violet-600" />
                  </div>
                  <button onClick={() => confirm('Excluir este documento?') && deleteDocument(d.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-sm font-bold text-slate-800 mt-3">{d.name}</h4>
                {d.type && <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 inline-block mt-1">{d.type}</span>}
                {d.description && <p className="text-xs text-slate-500 mt-2">{d.description}</p>}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50 text-[11px] text-slate-400">
                  <span>{session ? session.title : 'Sem sessão'}</span>
                  <span>{new Date(d.createdAt).toLocaleDateString('pt-BR')}</span>
                </div>
                {d.fileUrl && (
                  <a href={d.fileUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full mt-3 py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-xs font-bold transition-colors">
                    <ExternalLink className="w-3.5 h-3.5" /> Abrir arquivo
                  </a>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
