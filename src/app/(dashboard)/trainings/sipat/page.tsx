'use client'

import { useState } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import type { SipatDay, SipatProgram } from '../context/TrainingsContext'
import { useCrm } from '../../crm/context/CrmContext'
import { Compass, Plus, Calendar, Clock, MapPin, User, Trash2, ChevronDown, CheckCircle } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  planejado: 'bg-slate-100 text-slate-700 border-slate-200',
  agendado: 'bg-blue-50 text-blue-700 border-blue-100',
  em_andamento: 'bg-amber-50 text-amber-700 border-amber-100',
  concluido: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  cancelado: 'bg-red-50 text-red-700 border-red-100',
}

export default function SipatPage() {
  const { sipatPrograms, addSipatProgram, updateSipatStatus, deleteSipatProgram } = useTrainings()
  const { companies } = useCrm()

  const [selectedSipat, setSelectedSipat] = useState<SipatProgram | null>(sipatPrograms[0] || null)
  const [showForm, setShowForm] = useState(false)

  // SIPAT form
  const [sipatForm, setSipatForm] = useState({
    companyId: '',
    title: '',
    theme: '',
    startDate: '',
    endDate: '',
    status: 'planejado' as const,
    observations: ''
  })

  // Dynamic schedule days state
  const [scheduleDays, setScheduleDays] = useState<Omit<SipatDay, 'id' | 'sipatProgramId'>[]>([
    { dayNumber: 1, date: '', startTime: '09:00', endTime: '10:30', theme: '', facilitator: '', location: '' }
  ])

  const addScheduleDay = () => {
    setScheduleDays(prev => [
      ...prev,
      { dayNumber: prev.length + 1, date: '', startTime: '09:00', endTime: '10:30', theme: '', facilitator: '', location: '' }
    ])
  }

  const removeScheduleDay = (idx: number) => {
    setScheduleDays(prev => prev.filter((_, i) => i !== idx).map((d, i) => ({ ...d, dayNumber: i + 1 })))
  }

  const updateScheduleDay = (idx: number, updates: Partial<Omit<SipatDay, 'id' | 'sipatProgramId'>>) => {
    setScheduleDays(prev => prev.map((d, i) => i === idx ? { ...d, ...updates } : d))
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const comp = companies.find(c => c.id === sipatForm.companyId)
    const newSipat = addSipatProgram(
      {
        ...sipatForm,
        companyName: comp ? comp.name : 'Cliente',
        status: sipatForm.status as any,
      },
      scheduleDays
    )
    setSelectedSipat(newSipat)
    setShowForm(false)
    setSipatForm({ companyId: '', title: '', theme: '', startDate: '', endDate: '', status: 'planejado', observations: '' })
    setScheduleDays([{ dayNumber: 1, date: '', startTime: '09:00', endTime: '10:30', theme: '', facilitator: '', location: '' }])
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Semana SIPAT — Planejamento Corporativo</h1>
          <p className="text-slate-500 text-sm mt-0.5">Organize semanas inteiras de prevenção, palestras, cronogramas e evidências</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-100 hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Nova SIPAT
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* SIPAT List (left panel) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-3 h-fit">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1 block">Programas Cadastrados</span>
          
          {sipatPrograms.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Compass className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-xs">Nenhuma SIPAT cadastrada</p>
            </div>
          ) : sipatPrograms.map(s => (
            <div
              key={s.id}
              onClick={() => setSelectedSipat(s)}
              className={`p-4 rounded-xl border cursor-pointer transition-all hover:border-violet-200 ${selectedSipat?.id === s.id ? 'border-violet-500 ring-2 ring-violet-50' : 'border-slate-100'}`}
            >
              <div className="flex justify-between items-start gap-2">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded border ${STATUS_COLORS[s.status] || 'bg-slate-100 text-slate-600 border-slate-200'}`}>
                  {s.status}
                </span>
              </div>
              <h3 className="font-bold text-slate-800 text-xs mt-2 leading-tight">{s.title}</h3>
              <p className="text-[10px] text-slate-400 mt-1">🏢 {s.companyName}</p>
              <p className="text-[10px] text-violet-600 font-semibold mt-1">
                📅 {new Date(s.startDate).toLocaleDateString('pt-BR')} a {new Date(s.endDate).toLocaleDateString('pt-BR')}
              </p>
            </div>
          ))}
        </div>

        {/* SIPAT Detail Panel (right/main) */}
        <div className="lg:col-span-2">
          {selectedSipat ? (
            <div className="space-y-5">
              
              {/* Header card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-800/30 to-transparent" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full border ${STATUS_COLORS[selectedSipat.status]}`}>
                          {selectedSipat.status}
                        </span>
                        <span className="px-2.5 py-1 text-[9px] font-bold text-indigo-300 bg-indigo-500/20 border border-indigo-400/30 rounded-full uppercase">
                          SIPAT
                        </span>
                      </div>
                      <h2 className="text-xl font-black leading-tight">{selectedSipat.title}</h2>
                      <p className="text-slate-400 text-sm">Tema: <span className="text-slate-200 font-semibold">{selectedSipat.theme}</span></p>
                      <p className="text-slate-400 text-xs">Cliente: {selectedSipat.companyName}</p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Deseja excluir esta SIPAT?')) {
                          deleteSipatProgram(selectedSipat.id)
                          setSelectedSipat(sipatPrograms.find(s => s.id !== selectedSipat.id) || null)
                        }
                      }}
                      className="p-2 text-slate-400 hover:text-red-400 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Início</p>
                      <p className="text-sm font-bold mt-0.5">{new Date(selectedSipat.startDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Encerramento</p>
                      <p className="text-sm font-bold mt-0.5">{new Date(selectedSipat.endDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Dias Programados</p>
                      <p className="text-sm font-bold mt-0.5">{selectedSipat.schedule.length} dias</p>
                    </div>
                  </div>

                  {/* Status change actions */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {(['planejado', 'agendado', 'em_andamento', 'concluido'] as const).map(s => (
                      <button
                        key={s}
                        onClick={() => updateSipatStatus(selectedSipat.id, s)}
                        className={`px-3 py-1.5 text-[10px] font-bold rounded-lg border transition-all ${
                          selectedSipat.status === s
                            ? 'bg-white text-slate-900 border-white'
                            : 'bg-white/10 text-slate-300 border-white/20 hover:bg-white/20'
                        }`}
                      >
                        {s === 'em_andamento' ? 'Em Andamento' : s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Schedule / Cronograma */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
                <h3 className="font-bold text-slate-800 text-sm">Cronograma Diário</h3>

                <div className="space-y-3">
                  {selectedSipat.schedule.map((day, idx) => (
                    <div key={day.id} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-violet-600 text-white text-[11px] font-black flex items-center justify-center flex-shrink-0">
                          {day.dayNumber}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{day.theme}</p>
                          <p className="text-[10px] text-slate-400">{day.date ? new Date(day.date).toLocaleDateString('pt-BR') : 'Data não definida'}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-3 text-[10px] text-slate-500 pl-9">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {day.startTime} — {day.endTime}</span>
                        <span className="flex items-center gap-1"><User className="w-3 h-3" /> {day.facilitator}</span>
                        {day.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {day.location}</span>}
                      </div>
                    </div>
                  ))}

                  {selectedSipat.schedule.length === 0 && (
                    <div className="py-8 text-center text-slate-400 text-xs">Nenhum dia programado cadastrado.</div>
                  )}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center text-slate-400 shadow-sm">
              <Compass className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-sm">Selecione ou crie uma SIPAT</p>
              <p className="text-xs mt-1">Gerencie semanas completas de prevenção e desenvolvimento</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE SIPAT MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl font-sans max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Cadastrar Programa SIPAT</h2>
              <p className="text-sm text-slate-500">Defina o tema, cronograma e dados do cliente</p>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cliente *</label>
                  <select required value={sipatForm.companyId} onChange={e => setSipatForm({ ...sipatForm, companyId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="">Selecione o Cliente...</option>
                    {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Título da SIPAT *</label>
                  <input required value={sipatForm.title} onChange={e => setSipatForm({ ...sipatForm, title: e.target.value })}
                    placeholder="Ex: Semana SIPAT 2026 - Vale" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tema Geral da Semana *</label>
                  <input required value={sipatForm.theme} onChange={e => setSipatForm({ ...sipatForm, theme: e.target.value })}
                    placeholder="Ex: Cuidado, Saúde e Prevenção - Juntos por um Ambiente Seguro" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Início *</label>
                  <input required type="date" value={sipatForm.startDate} onChange={e => setSipatForm({ ...sipatForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Encerramento *</label>
                  <input required type="date" value={sipatForm.endDate} onChange={e => setSipatForm({ ...sipatForm, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>

              {/* Dynamic Schedule Days */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-700">Cronograma Diário de Palestras</span>
                  <button type="button" onClick={addScheduleDay}
                    className="flex items-center gap-1 text-[10px] font-bold text-violet-600 hover:text-violet-800 transition-colors">
                    <Plus className="w-3 h-3" /> Adicionar Dia
                  </button>
                </div>

                {scheduleDays.map((day, idx) => (
                  <div key={idx} className="p-4 border border-slate-100 rounded-xl bg-slate-50/30 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-violet-600">Dia {day.dayNumber}</span>
                      {scheduleDays.length > 1 && (
                        <button type="button" onClick={() => removeScheduleDay(idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Data</label>
                        <input type="date" value={day.date} onChange={e => updateScheduleDay(idx, { date: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Tema da Palestra *</label>
                        <input required value={day.theme} onChange={e => updateScheduleDay(idx, { theme: e.target.value })}
                          placeholder="Ex: Gestão de Stress" className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Facilitador *</label>
                        <input required value={day.facilitator} onChange={e => updateScheduleDay(idx, { facilitator: e.target.value })}
                          placeholder="Bruno Crepaldi" className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Local</label>
                        <input value={day.location || ''} onChange={e => updateScheduleDay(idx, { location: e.target.value })}
                          placeholder="Auditório Principal" className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Início</label>
                        <input type="time" value={day.startTime} onChange={e => updateScheduleDay(idx, { startTime: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Fim</label>
                        <input type="time" value={day.endTime} onChange={e => updateScheduleDay(idx, { endTime: e.target.value })}
                          className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">
                  Cadastrar SIPAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
