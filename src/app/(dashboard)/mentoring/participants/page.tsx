'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import type { Participant } from '../context/MentoringContext'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Users, Plus, Search, Filter, ChevronRight, Mail, Phone, Building2, Briefcase, Trash2, Edit3 } from 'lucide-react'

export default function ParticipantsPage() {
  const { participants, pdiPlans, sessions, addParticipant, deleteParticipant } = useMentoring()
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<Omit<Participant, 'id' | 'createdAt'>>({
    name: '', companyId: '', companyName: '', unit: '', sector: '', role: '',
    directLeader: '', email: '', phone: '', startDate: '', notes: '', avatar: '',
  })

  const filtered = participants.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.companyName.toLowerCase().includes(search.toLowerCase()) ||
    p.role.toLowerCase().includes(search.toLowerCase())
  )

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const initials = form.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
    addParticipant({ ...form, avatar: initials || 'P' })
    setShowForm(false)
    setForm({ name: '', companyId: '', companyName: '', unit: '', sector: '', role: '', directLeader: '', email: '', phone: '', startDate: '', notes: '', avatar: '' })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Participantes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Colaboradores e líderes em acompanhamento</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-full text-sm font-bold shadow-md shadow-violet-200 hover:opacity-90 hover:-translate-y-0.5 transition-all">
          <Plus className="w-4 h-4" /> Novo Participante
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Buscar por nome, empresa ou cargo..."
          className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white shadow-sm"
        />
      </div>

      {/* Stats row */}
      <div className="flex gap-3 flex-wrap">
        {[
          { label: 'Total', value: participants.length, color: 'bg-violet-100 text-violet-700' },
          { label: 'Com PDI', value: pdiPlans.length, color: 'bg-blue-100 text-blue-700' },
          { label: 'Com Sessões', value: participants.filter(p => sessions.some(s => s.participantIds.includes(p.id))).length, color: 'bg-emerald-100 text-emerald-700' },
        ].map(s => (
          <div key={s.label} className={`px-4 py-2 rounded-xl text-sm font-semibold ${s.color}`}>
            {s.value} {s.label}
          </div>
        ))}
      </div>

      {/* Participants grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {filtered.map(p => {
          const pPDI = pdiPlans.find(pl => pl.participantId === p.id)
          const completedPDI = (pPDI && Array.isArray(pPDI.goals)) ? pPDI.goals.filter(g => g?.status === 'concluido').length : 0
          const totalPDI = (pPDI && Array.isArray(pPDI.goals)) ? pPDI.goals.length : 0
          const pct = totalPDI > 0 ? Math.round((completedPDI / totalPDI) * 100) : 0
          const sessCount = sessions.filter(s => s.participantIds.includes(p.id)).length

          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden group">
              {/* Card Header */}
              <div className="bg-gradient-to-br from-violet-600 to-purple-700 p-5 relative">
                <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Link href={`/mentoring/participants/${p.id}`}
                    className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors">
                    <Edit3 className="w-3.5 h-3.5 text-white" />
                  </Link>
                  <button onClick={() => deleteParticipant(p.id)}
                    className="p-1.5 bg-white/20 hover:bg-red-400/40 rounded-lg transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-white/20 text-white font-bold text-lg flex items-center justify-center shadow-inner">
                    {p.avatar}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{p.name}</h3>
                    <p className="text-violet-200 text-xs">{p.role}</p>
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{p.companyName}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Briefcase className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{p.unit} · {p.sector}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 text-slate-400 flex-shrink-0" />
                  <span className="truncate">{p.email}</span>
                </div>
                {p.phone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <span>{p.phone}</span>
                  </div>
                )}

                {/* PDI progress */}
                <div className="pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs font-semibold text-slate-500">PDI Progress</span>
                    <span className="text-xs font-bold text-violet-700">{pct}%</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }} />
                  </div>
                  <div className="flex justify-between mt-2">
                    <span className="text-xs text-slate-400">{completedPDI}/{totalPDI} metas</span>
                    <span className="text-xs text-slate-400">{sessCount} sessões</span>
                  </div>
                </div>

                <Link href={`/mentoring/participants/${p.id}`}
                  className="flex items-center justify-center gap-1.5 w-full py-2 bg-violet-50 hover:bg-violet-100 text-violet-700 rounded-xl text-sm font-semibold transition-colors">
                  Ver perfil <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          )
        })}

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-16 text-center">
            <Users className="w-12 h-12 text-slate-200 mb-3" />
            <p className="text-slate-500 font-medium">Nenhum participante encontrado</p>
            <p className="text-slate-400 text-sm mt-1">Ajuste a busca ou cadastre um novo participante</p>
          </div>
        )}
      </div>

      {/* New Participant Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Novo Participante</h2>
              <p className="text-sm text-slate-500">Cadastre um colaborador ou líder para acompanhamento</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Nome completo *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="João da Silva" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Empresa *</label>
                  <input required value={form.companyName} onChange={e => setForm({ ...form, companyName: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Nome da empresa" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Cargo *</label>
                  <input required value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Gerente de Operações" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Unidade</label>
                  <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Unidade SP" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Setor</label>
                  <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Recursos Humanos" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Liderança Direta</label>
                  <input value={form.directLeader} onChange={e => setForm({ ...form, directLeader: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="Diretor Regional" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">E-mail *</label>
                  <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="joao@empresa.com" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Telefone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" placeholder="(11) 99999-9999" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Início do Acompanhamento *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Observações</label>
                  <textarea rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 resize-none" placeholder="Focos de desenvolvimento, contexto..." />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-opacity">
                  Cadastrar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
