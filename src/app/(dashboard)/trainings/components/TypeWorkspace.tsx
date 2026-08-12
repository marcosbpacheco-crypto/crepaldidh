'use client'

import { useState } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import { useCrm } from '../../crm/context/CrmContext'
import type { TrainingEvent } from '../context/TrainingsContext'
import type { TrainingTargetType } from '@/types/trainings'
import TimelineManager from './TimelineManager'
import CatalogManager from './CatalogManager'
import { Plus, Pencil, Trash2, ChevronDown, Search, Users, Building2, User as UserIcon } from 'lucide-react'

const TYPE_STATUS = ['agendado', 'planejado', 'em_divulgacao', 'realizado', 'reagendado', 'concluido', 'cancelado'] as const

interface Props {
  category: 'Treinamento' | 'Palestra' | 'Workshop'
  accent: string
  accentBg: string
  accentText: string
}

const TARGET_LABEL: Record<TrainingTargetType, string> = {
  empresa: 'Empresa',
  pessoa: 'Pessoa',
  ambos: 'Empresa ou Pessoa',
}

export default function TypeWorkspace({ category, accent, accentBg, accentText }: Props) {
  const { events, trainingTypes, addEvent, updateEvent, deleteEvent, addParticipant } = useTrainings()
  const { companies } = useCrm()

  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<TrainingEvent | null>(null)
  const [expanded, setExpanded] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [people, setPeople] = useState(0)

  const [form, setForm] = useState({
    companyId: '',
    trainingTypeId: '',
    targetType: 'empresa' as TrainingTargetType,
    name: '',
    theme: '',
    objective: '',
    facilitator: 'Bruno Crepaldi',
    modality: 'presencial' as TrainingEvent['modality'],
    location: '',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    hoursDuration: 8,
    expectedParticipants: 30,
    cost: 5000,
    status: 'agendado' as TrainingEvent['status'],
    notes: '',
  })

  const catalogTypes = trainingTypes.filter(t => t.category === category)
  const list = events
    .filter(e => e.type === category && e.status !== 'cancelado')
    .filter(e => (e.name.toLowerCase().includes(search.toLowerCase()) || (e.companyName || '').toLowerCase().includes(search.toLowerCase())))
    .sort((a, b) => a.eventDate.localeCompare(b.eventDate))

  const closeForm = () => {
    setShowForm(false)
    setEditing(null)
    setPeople(0)
    setForm({
      companyId: '', trainingTypeId: '', targetType: 'empresa', name: '', theme: '', objective: '',
      facilitator: 'Bruno Crepaldi', modality: 'presencial', location: '', eventDate: new Date().toISOString().split('T')[0],
      startTime: '09:00', endTime: '17:00', hoursDuration: 8, expectedParticipants: 30, cost: 5000,
      status: 'agendado', notes: '',
    })
  }

  const openEdit = (ev: TrainingEvent) => {
    setEditing(ev)
    setForm({
      companyId: ev.companyId || '',
      trainingTypeId: ev.trainingTypeId || '',
      targetType: ev.targetType || 'empresa',
      name: ev.name,
      theme: ev.theme,
      objective: ev.objective || '',
      facilitator: ev.facilitator,
      modality: ev.modality,
      location: ev.location || '',
      eventDate: ev.eventDate,
      startTime: ev.startTime,
      endTime: ev.endTime,
      hoursDuration: ev.hoursDuration,
      expectedParticipants: ev.expectedParticipants,
      cost: ev.cost,
      status: ev.status,
      notes: ev.notes || '',
    })
    setShowForm(true)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedComp = form.companyId ? companies.find(c => c.id === form.companyId) : null
    const payload: TrainingEvent = {
      id: editing ? editing.id : `tr-event-${Date.now()}`,
      createdAt: editing?.createdAt || new Date().toISOString(),
      ...form,
      type: category,
      hoursDuration: Number(form.hoursDuration),
      expectedParticipants: form.targetType === 'pessoa' ? (people || 1) : form.expectedParticipants,
      companyId: form.targetType === 'pessoa' ? undefined : form.companyId || undefined,
      companyName: form.targetType === 'pessoa' ? undefined : (selectedComp ? (selectedComp.tradeName || selectedComp.name) : undefined),
      trainingTypeId: form.trainingTypeId || undefined,
    }
    if (editing) {
      updateEvent(editing.id, payload)
    } else {
      const ev = addEvent(payload)
      if (form.targetType === 'pessoa') {
        for (let i = 0; i < (people || 1); i++) {
          addParticipant({ eventId: ev.id, name: `Participante ${i + 1}`, companyName: form.theme || category, attendanceStatus: 'ausente' })
        }
      }
    }
    closeForm()
  }

  const statusColor = (s: string) =>
    s === 'realizado' || s === 'concluido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
    : s === 'agendado' || s === 'em_divulgacao' ? 'bg-blue-50 text-blue-700 border border-blue-100'
    : s === 'cancelado' ? 'bg-red-50 text-red-700 border border-red-100'
    : 'bg-slate-100 text-slate-700 border border-slate-200'

  return (
    <div className="space-y-5">
      {/* Cabecalho de acao */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-sm text-slate-500">
          {list.length} {category.toLowerCase()}(s) registrado(s) • <span className="font-bold text-slate-700">{catalogTypes.length} tipos no catálogo</span>
        </p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-xl shadow-sm hover:opacity-90 hover:-translate-y-0.5 transition-all"
          style={{ backgroundColor: accent }}
        >
          <Plus className="w-4 h-4" /> Novo {category}
        </button>
      </div>

      {/* Formulario */}
      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-base">{editing ? `Editar ${category}` : `Novo ${category}`}</h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={closeForm}
                className="px-3 py-1.5 text-[11px] font-bold rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-[11px] font-bold rounded-xl text-white hover:opacity-90"
                style={{ backgroundColor: accent }}
              >
                Salvar
              </button>
            </div>
          </div>

          {/* Vinculo: empresa ou pessoa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
              Vínculo
              <div className="flex gap-2">
                {(['empresa', 'pessoa', 'ambos'] as TrainingTargetType[]).map(t => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm({ ...form, targetType: t })}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-2 py-2 rounded-xl text-[11px] font-bold border transition-colors ${
                      form.targetType === t ? 'text-white border-transparent' : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                    style={form.targetType === t ? { backgroundColor: accent } : {}}
                  >
                    {t === 'empresa' ? <Building2 className="w-3.5 h-3.5" /> : t === 'pessoa' ? <UserIcon className="w-3.5 h-3.5" /> : <Users className="w-3.5 h-3.5" />}
                    {TARGET_LABEL[t]}
                  </button>
                ))}
              </div>
            </label>

            {form.targetType !== 'pessoa' ? (
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
                Empresa (obrigatório)
                <select
                  required
                  value={form.companyId}
                  onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-violet-300"
                >
                  <option value="">Selecionar empresa...</option>
                  {companies
                    .filter(c => c.status === 'active')
                    .map(c => <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>)}
                </select>
              </label>
            ) : (
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
                Quantidade de pessoas
                <input
                  type="number"
                  min={1}
                  value={people}
                  onChange={e => setPeople(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-violet-300"
                  placeholder="Ex: 30"
                />
              </label>
            )}
          </div>

          {/* Tipo do catalogo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {catalogTypes.length > 0 && (
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
                Tipo (do catálogo) — opcional
                <select
                  value={form.trainingTypeId}
                  onChange={e => {
                    const tt = catalogTypes.find(t => t.id === e.target.value)
                    setForm({ ...form, trainingTypeId: e.target.value, hoursDuration: tt?.hoursDuration || form.hoursDuration })
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none"
                >
                  <option value="">Personalizado...</option>
                  {catalogTypes.map(t => <option key={t.id} value={t.id}>{t.name}{t.hoursDuration ? ` (${t.hoursDuration}h)` : ''}</option>)}
                </select>
              </label>
            )}
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
              Nome do evento
              <input
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Primeiros Socorros Básico"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-violet-300"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Tema / Ementa
              <input
                value={form.theme}
                onChange={e => setForm({ ...form, theme: e.target.value })}
                placeholder="Tema abordado"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </label>
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Objetivo
              <input
                value={form.objective}
                onChange={e => setForm({ ...form, objective: e.target.value })}
                placeholder="Objetivo do evento"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Facilitador
              <input value={form.facilitator} onChange={e => setForm({ ...form, facilitator: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white" />
            </label>
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Modalidade
              <select value={form.modality} onChange={e => setForm({ ...form, modality: e.target.value as TrainingEvent['modality'] })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700">
                <option value="presencial">Presencial</option>
                <option value="online">Online</option>
                <option value="hibrido">Híbrido</option>
              </select>
            </label>
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Duração (h)
              <input type="number" min={0.5} step={0.5} value={form.hoursDuration} onChange={e => setForm({ ...form, hoursDuration: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white" />
            </label>
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Valor (R$)
              <input type="number" min={0} value={form.cost} onChange={e => setForm({ ...form, cost: Number(e.target.value) })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white" />
            </label>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Data
              <input type="date" required value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white" />
            </label>
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Início
              <input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white" />
            </label>
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Fim
              <input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white" />
            </label>
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Local
              <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Onde" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white" />
            </label>
            <label className="space-y-1 block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Status
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as TrainingEvent['status'] })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700">
                {TYPE_STATUS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
        </form>
      )}

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Buscar ${category.toLowerCase()} por nome ou cliente...`}
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-300 bg-white"
        />
      </div>

      {/* Lista */}
      {list.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-10 text-center">
          <p className="text-slate-400 text-sm">Nenhum {category.toLowerCase()} registrado ainda. Clique em {'"'}Novo {category}{'"'} para começar.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map(ev => {
            const isOpen = expanded === ev.id
            return (
              <div key={ev.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                <div
                  className="p-4 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/50 transition-colors"
                  onClick={() => setExpanded(isOpen ? null : ev.id)}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2.5 rounded-xl ${accentBg} ${accentText}`}>
                      <Users className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{ev.name}</p>
                      <p className="text-[10px] text-slate-400 flex items-center gap-2 flex-wrap">
                        <span className="flex items-center gap-0.5">{ev.targetType === 'pessoa' ? <UserIcon className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />} {ev.companyName || `${ev.expectedParticipants || 0} pessoas`}</span>
                        <span>{new Date(ev.eventDate + 'T12:00:00').toLocaleDateString('pt-BR')} • {ev.startTime}-{ev.endTime}</span>
                        <span>{ev.facilitator}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${statusColor(ev.status)}`}>{ev.status}</span>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); openEdit(ev) }}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); if (confirm(`Excluir o ${category.toLowerCase()} "${ev.name}"?`)) deleteEvent(ev.id) }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <ChevronDown className={`w-4 h-4 text-slate-300 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {isOpen && (
                  <div className="px-4 pb-4 space-y-3 border-t border-slate-50 pt-3">
                    <div className="text-[11px] text-slate-500 space-y-1">
                      {ev.theme && <p><b>Tema:</b> {ev.theme}</p>}
                      {ev.objective && <p><b>Objetivo:</b> {ev.objective}</p>}
                      {ev.location && <p><b>Local:</b> {ev.location} • <b>Modalidade:</b> {ev.modality}</p>}
                      <p><b>{ev.expectedParticipants || 0} participantes previstos</b> • {ev.hoursDuration}h • R$ {ev.cost.toLocaleString('pt-BR')}</p>
                    </div>
                    <TimelineManager eventId={ev.id} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Catalogo */}
      <CatalogManager category={category} />

      {/* Mensagem de calendario */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl p-5 flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold">Datas reportadas à Agenda</p>
          <p className="text-[11px] text-violet-100">Todo evento criado é sincronizado automaticamente no Calendário do sistema.</p>
        </div>
        <CalendarIcon accent={accent} />
      </div>
    </div>
  )
}

function CalendarIcon({ accent }: { accent: string }) {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" fill={accent} fillOpacity="0.2" stroke="currentColor" />
      <line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}