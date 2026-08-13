'use client'

import { useState } from 'react'
import { useMentoring } from '../../context/MentoringContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Building2, Calendar, Target, AlertCircle } from 'lucide-react'

export default function NovaMentoriaIndividualPage() {
  const router = useRouter()
  const { addProgram } = useMentoring()
  const { companies } = useCrm()
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    name: '',
    companyId: '',
    mentor: '',
    status: 'planejada',
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    mainObjective: '',
    menteeName: '',
    menteeRole: '',
    menteeDepartment: '',
    menteeContact: '',
    menteeGestor: '',
  })

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) {
      setError('Informe o nome da mentoria.')
      return
    }
    const company = companies.find(c => c.id === form.companyId)
    const program = addProgram({
      modality: 'individual',
      name: form.name.trim(),
      companyId: form.companyId || undefined,
      companyName: company?.tradeName || company?.name,
      mentor: form.mentor.trim() || undefined,
      status: form.status as any,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      mainObjective: form.mainObjective.trim() || undefined,
      progress: 0,
      menteeName: form.menteeName.trim() || undefined,
      menteeRole: form.menteeRole.trim() || undefined,
      menteeDepartment: form.menteeDepartment.trim() || undefined,
      menteeContact: form.menteeContact.trim() || undefined,
      menteeGestor: form.menteeGestor.trim() || undefined,
    })
    router.push(`/mentoring/individual/${program.id}`)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <Link href="/mentoring/individual" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Mentorias Individuais
      </Link>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-100 flex items-center justify-center">
            <User className="w-6 h-6 text-violet-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Nova Mentoria Individual</h1>
            <p className="text-slate-500 text-sm">Programa 1:1 — objetivos, ações e sessões substituem o PDI</p>
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
                <span className="block text-xs font-semibold text-slate-600 mb-1">Nome da Mentoria *</span>
                <input
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: Desenvolvimento de Liderança"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
              <label className="block sm:col-span-2">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Objetivo Principal</span>
                <textarea
                  value={form.mainObjective}
                  onChange={e => setForm({ ...form, mainObjective: e.target.value })}
                  rows={3}
                  placeholder="Descreva o objetivo principal desta mentoria..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Empresa / Cliente</span>
                <select
                  value={form.companyId}
                  onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                  <option value="">Selecionar empresa...</option>
                  {companies.filter(c => c.status === 'active').map(c => (
                    <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Mentor</span>
                <input
                  value={form.mentor}
                  onChange={e => setForm({ ...form, mentor: e.target.value })}
                  placeholder="Nome do mentor"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Status</span>
                <select
                  value={form.status}
                  onChange={e => setForm({ ...form, status: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
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
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Previsão de Encerramento</span>
                <input
                  type="date"
                  value={form.endDate}
                  onChange={e => setForm({ ...form, endDate: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
            </div>
          </div>

          {/* Mentorado */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-violet-500" /> Mentorado
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Nome do Mentorado</span>
                <input
                  value={form.menteeName}
                  onChange={e => setForm({ ...form, menteeName: e.target.value })}
                  placeholder="Nome completo"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Cargo</span>
                <input
                  value={form.menteeRole}
                  onChange={e => setForm({ ...form, menteeRole: e.target.value })}
                  placeholder="Ex: Supervisor"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Departamento</span>
                <input
                  value={form.menteeDepartment}
                  onChange={e => setForm({ ...form, menteeDepartment: e.target.value })}
                  placeholder="Ex: Operações"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Contato</span>
                <input
                  value={form.menteeContact}
                  onChange={e => setForm({ ...form, menteeContact: e.target.value })}
                  placeholder="E-mail / telefone"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">Gestor</span>
                <input
                  value={form.menteeGestor}
                  onChange={e => setForm({ ...form, menteeGestor: e.target.value })}
                  placeholder="Gestor imediato"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-5 border-t border-slate-100">
            <Link href="/mentoring/individual" className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </Link>
            <button type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-md shadow-violet-200 hover:opacity-90 hover:-translate-y-0.5 transition-all duration-300">
              <Calendar className="w-4 h-4" /> Criar Mentoria
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
