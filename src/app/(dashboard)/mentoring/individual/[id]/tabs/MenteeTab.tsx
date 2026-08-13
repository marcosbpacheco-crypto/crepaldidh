'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { User, Save } from 'lucide-react'

export default function MenteeTab({ program }: { program: MentoringProgram }) {
  const { updateProgram } = useMentoring()
  const [form, setForm] = useState({
    menteeName: program.menteeName || '',
    menteeRole: program.menteeRole || '',
    menteeDepartment: program.menteeDepartment || '',
    menteeContact: program.menteeContact || '',
    menteeGestor: program.menteeGestor || '',
  })
  const [saved, setSaved] = useState(false)

  const save = (e: React.FormEvent) => {
    e.preventDefault()
    updateProgram(program.id, {
      menteeName: form.menteeName.trim() || undefined,
      menteeRole: form.menteeRole.trim() || undefined,
      menteeDepartment: form.menteeDepartment.trim() || undefined,
      menteeContact: form.menteeContact.trim() || undefined,
      menteeGestor: form.menteeGestor.trim() || undefined,
    })
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const fields = [
    { key: 'menteeName' as const, label: 'Nome do Mentorado', placeholder: 'Nome completo', type: 'text' },
    { key: 'menteeRole' as const, label: 'Cargo', placeholder: 'Ex: Supervisor', type: 'text' },
    { key: 'menteeDepartment' as const, label: 'Departamento', placeholder: 'Ex: Operações', type: 'text' },
    { key: 'menteeContact' as const, label: 'Contato', placeholder: 'E-mail / telefone', type: 'text' },
    { key: 'menteeGestor' as const, label: 'Gestor', placeholder: 'Gestor imediato', type: 'text' },
  ]

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <form onSubmit={save} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-bold text-slate-800">Dados do Mentorado</h3>
        </div>
        <div className="space-y-4">
          {fields.map(f => (
            <label key={f.key} className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</span>
              <input
                type={f.type}
                value={form[f.key]}
                onChange={e => setForm({ ...form, [f.key]: e.target.value })}
                placeholder={f.placeholder}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </label>
          ))}
        </div>
        <button type="submit"
          className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
          <Save className="w-4 h-4" /> {saved ? 'Salvo!' : 'Salvar'}
        </button>
      </form>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <User className="w-5 h-5 text-violet-600" />
          <h3 className="text-lg font-bold text-slate-800">Resumo</h3>
        </div>
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-violet-50 border border-violet-100">
            <p className="text-2xl font-bold text-violet-700">
              {(form.menteeName || '—').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
            </p>
            <p className="text-sm font-bold text-slate-800 mt-1">{form.menteeName || 'Sem nome'}</p>
            <p className="text-xs text-slate-500">{form.menteeRole || '—'}{form.menteeDepartment ? ` · ${form.menteeDepartment}` : ''}</p>
          </div>
          <div className="space-y-2 text-sm">
            <p className="flex justify-between gap-3 border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Contato</span>
              <span className="font-semibold text-slate-700 text-right">{form.menteeContact || '—'}</span>
            </p>
            <p className="flex justify-between gap-3 border-b border-slate-50 pb-2">
              <span className="text-slate-400 font-medium">Gestor</span>
              <span className="font-semibold text-slate-700 text-right">{form.menteeGestor || '—'}</span>
            </p>
            <p className="flex justify-between gap-3">
              <span className="text-slate-400 font-medium">Empresa</span>
              <span className="font-semibold text-slate-700 text-right">{program.companyName || '—'}</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
