'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { Users, Plus, Trash2, Pencil, Mail, Phone, Building2 } from 'lucide-react'

const TYPE_LABELS: Record<string, string> = {
  rh: 'RH',
  lideranca: 'LideranÃ§a',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
  direcao: 'DireÃ§Ã£o',
  outro: 'Outro',
}

export default function ParticipantsTab({ program }: { program: MentoringProgram }) {
  const { participants, addParticipant, updateParticipant, deleteParticipant } = useMentoring()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    role: 'Participante',
    participantType: 'colaborador',
    email: '',
    phone: '',
    unit: '',
    sector: '',
    directLeader: '',
    startDate: new Date().toISOString().split('T')[0],
  })

  const progParticipants = (Array.isArray(program.participants) ? program.participants : [])

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      role: form.role.trim() || 'Participante',
      participantType: form.participantType as any,
      email: form.email.trim() || '',
      phone: form.phone.trim() || undefined,
      unit: form.unit.trim() || undefined,
      sector: form.sector.trim() || undefined,
      directLeader: form.directLeader.trim() || undefined,
      startDate: form.startDate,
      companyId: program.companyId,
      companyName: program.companyName || 'â€”',
      programId: program.id,
    }
    if (editingId) {
      updateParticipant(editingId, payload)
    } else {
      addParticipant(payload)
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', role: 'Participante', participantType: 'colaborador', email: '', phone: '', unit: '', sector: '', directLeader: '', startDate: new Date().toISOString().split('T')[0] })
  }

  const startEdit = (p: any) => {
    setEditingId(p.id)
    setForm({
      name: p.name || '',
      role: p.role || 'Participante',
      participantType: p.participantType || 'colaborador',
      email: p.email || '',
      phone: p.phone || '',
      unit: p.unit || '',
      sector: p.sector || '',
      directLeader: p.directLeader || '',
      startDate: p.startDate?.split('T')[0] || new Date().toISOString().split('T')[0],
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-800">Participantes</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">{progParticipants.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Profissionais vinculados ao programa corporativo</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700 transition-colors">
          <Plus className="w-4 h-4" /> Adicionar Participante
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700">{editingId ? 'Editar Participante' : 'Novo Participante'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Nome *</span>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Nome completo"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Tipo</span>
              <select value={form.participantType} onChange={e => setForm({ ...form, participantType: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                {Object.entries(TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Cargo</span>
              <input value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
                placeholder="Ex: Supervisor"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">E-mail</span>
              <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Telefone</span>
              <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Unidade</span>
              <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })}
                placeholder="Ex: Filial Centro"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Setor</span>
              <input value={form.sector} onChange={e => setForm({ ...form, sector: e.target.value })}
                placeholder="Ex: OperaÃ§Ãµes"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">LÃ­der Direto</span>
              <input value={form.directLeader} onChange={e => setForm({ ...form, directLeader: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Data de InÃ­cio</span>
              <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700 transition-colors">
              {editingId ? 'Salvar AlteraÃ§Ãµes' : 'Adicionar'}
            </button>
          </div>
        </form>
      )}

      {progParticipants.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum participante cadastrado</p>
          <p className="text-xs text-slate-400 mt-1">Adicione profissionais vinculados ao programa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {progParticipants.map(p => (
            <div key={p.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 flex items-start gap-4">
              <div className="w-11 h-11 rounded-xl bg-sky-100 text-sky-700 font-bold text-sm flex items-center justify-center flex-shrink-0">
                {p.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-sm font-bold text-slate-800 truncate">{p.name}</h4>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => confirm('Excluir este participante?') && deleteParticipant(p.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1 text-xs text-slate-500">
                  <span>{TYPE_LABELS[p.participantType || ''] || p.participantType || 'Participante'}</span>
                  {p.role && <span>Â· {p.role}</span>}
                  {p.sector && <span>Â· {p.sector}</span>}
                </div>
                {(p.email || p.phone) && (
                  <div className="flex flex-col gap-1 mt-2 text-[11px] text-slate-400">
                    {p.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {p.email}</span>}
                    {p.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {p.phone}</span>}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
