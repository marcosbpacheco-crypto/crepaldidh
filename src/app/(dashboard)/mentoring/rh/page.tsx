'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import Link from 'next/link'
import { Plus, Search, Users, Target, Calendar, Building2, ChevronRight, User } from 'lucide-react'

const STATUS_LABELS: Record<string, string> = {
  planejada: 'Planejada',
  ativa: 'Ativa',
  pausada: 'Pausada',
  concluida: 'Concluída',
  cancelada: 'Cancelada',
}

const STATUS_COLORS: Record<string, string> = {
  planejada: 'bg-slate-100 text-slate-700',
  ativa: 'bg-emerald-100 text-emerald-700',
  pausada: 'bg-amber-100 text-amber-700',
  concluida: 'bg-blue-100 text-blue-700',
  cancelada: 'bg-red-100 text-red-700',
}

export default function RHMentoringPage() {
  const { programs } = useMentoring()
  const [search, setSearch] = useState('')

  const rhPrograms = programs
    .filter(p => p.modality === 'rh')
    .filter(p => {
      if (!search.trim()) return true
      const q = search.toLowerCase()
      return (
        p.name.toLowerCase().includes(q) ||
        (p.companyName || '').toLowerCase().includes(q) ||
        (p.rhResponsible || '').toLowerCase().includes(q) ||
        (p.mentor || '').toLowerCase().includes(q)
      )
    })

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-sky-600" />
            <span className="text-sm font-semibold text-sky-600 uppercase tracking-wider">Consultoria Organizacional</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Programas RH</h1>
          <p className="text-slate-500 mt-1">Programas corporativos com diagnósticos, indicadores e ações — sem PDI</p>
        </div>
        <Link href="/mentoring/rh/novo"
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 text-white rounded-full text-sm font-bold hover:opacity-90 shadow-md shadow-sky-200 hover:-translate-y-0.5 transition-all duration-300">
          <Plus className="w-4 h-4" /> Novo Programa RH
        </Link>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, empresa, RH ou mentor..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300 bg-white shadow-sm"
        />
      </div>

      {/* List */}
      {rhPrograms.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-16 text-center">
          <div className="w-16 h-16 rounded-2xl bg-sky-50 flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-sky-500" />
          </div>
          <h3 className="font-bold text-slate-800">Nenhum programa RH</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">Crie seu primeiro programa corporativo de mentoring.</p>
          <Link href="/mentoring/rh/novo"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700 transition-colors">
            <Plus className="w-4 h-4" /> Criar Programa RH
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {rhPrograms.map(p => {
            const pObjectives = Array.isArray(p.objectives) ? p.objectives : []
            const done = pObjectives.filter(o => o.status === 'concluido').length
            const pct = pObjectives.length > 0 ? Math.round((done / pObjectives.length) * 100) : (p.progress || 0)
            const pParticipants = Array.isArray(p.participants) ? p.participants : []
            const pDiagnostics = Array.isArray(p.diagnostics) ? p.diagnostics : []
            return (
              <Link key={p.id} href={`/mentoring/rh/${p.id}`}
                className="bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-sky-200 transition-all overflow-hidden group">
                <div className="bg-gradient-to-br from-sky-600 to-blue-700 p-5 relative">
                  <div className="absolute top-3 right-3">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/20 text-white`}>
                      {STATUS_LABELS[p.status] || p.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-white/20 text-white font-bold text-sm flex items-center justify-center shadow-inner">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-white font-bold truncate">{p.name}</h3>
                      <p className="text-sky-200 text-xs truncate">{p.companyName || 'Sem empresa'}</p>
                    </div>
                  </div>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Users className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">{pParticipants.length} participante(s)</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span className="truncate">Resp. RH: {p.rhResponsible || '—'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{pDiagnostics.length} diagnóstico(s)</span>
                    <Target className="w-4 h-4 text-slate-400 ml-2 flex-shrink-0" />
                    <span>{pObjectives.length} objetivos</span>
                  </div>

                  {/* Progress */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-xs font-semibold text-slate-500">Progresso</span>
                      <span className="text-xs font-bold text-sky-700">{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
                    </div>
                    <div className="flex justify-between mt-2">
                      <span className="text-xs text-slate-400">{done}/{pObjectives.length} objetivos</span>
                      <span className="text-xs text-sky-500 font-medium flex items-center gap-0.5">
                        Abrir <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
