'use client'

import { useState } from 'react'
import { useMentoring } from '../../context/MentoringContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Building2, Users, Calendar, Target, AlertCircle } from 'lucide-react'

export default function NovoProgramaRHPage() {
  const router = useRouter()
  const { addProgram } = useMentoring()
  const { companies } = useCrm()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    companyId: '',
    rhResponsible: '',
    mentor: '',
    status: 'planejada',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    mainObjective: '',
    notes: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Informe o nome do programa.')
      return
    }
    const company = companies.find(c => c.id === form.companyId)
    const program = addProgram({
      modality: 'rh',
      name: form.name.trim(),
      companyId: form.companyId || undefined,
      companyName: company?.tradeName || company?.name,
      rhResponsible: form.rhResponsible.trim() || undefined,
      mentor: form.mentor.trim() || undefined,
      status: form.status as any,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      mainObjective: form.mainObjective.trim() || undefined,
      notes: form.notes.trim() || undefined,
      progress: 0,
    })
    router.push(`/mentoring/rh/${program.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <Link href="/mentoring/rh" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Programas RH
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-sky-100 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-sky-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Novo Programa RH</h1>
            <p className="text-slate-500 text-sm">Programa corporativo — diagnósticos, indicadores e ações substituem o PDI</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-sm font-semibold">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={submit} className="space-y-6">
          {/* Identificação */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3">Identificação</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block sm:col-span-2">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Nome do Programa *</span>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Programa de Formação de Lideranças"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Objetivo Principal</span>
                <textarea
                  value={form.mainObjective}
                  onChange={e => setForm({ ...form, mainObjective: e.target.value })}
                  rows={3}
                  placeholder="Descreva o objetivo principal deste programa..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Empresa / Cliente</span>
                <select
                  value={form.companyId}
                  onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="">Selecionar empresa...</option>
                  {companies.filter(c => c.status === 'active').map(c => (
                    <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Responsável RH</span>
                <input
                  value={form.rhResponsible}
                  onChange={e => setForm({ ...form, rhResponsible: e.target.value })}
                  placeholder="Nome do responsável de RH"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Mentor / Consultor</span>
                <input
                  value={form.mentor}
                  onChange={e => setForm({ ...form, mentor: e.target.value })}
                  placeholder="Nome do mentor ou consultor"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Status</span>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                  <option value="planejada">Planejada</option>
                  <option value="ativa">Ativa</option>
                  <option value="pausada">Pausada</option>
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Data de Início</span>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={e => setForm({ ...form, startDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Previsão de Encerramento</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Observações</span>
                <textarea
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                  rows={2}
                  placeholder="Notas gerais sobre o programa..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 resize-none"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
            <Link href="/mentoring/rh" className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </Link>
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-full text-sm font-bold shadow-md shadow-sky-200 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300">
              <Calendar className="w-4 h-4" /> Criar Programa
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
