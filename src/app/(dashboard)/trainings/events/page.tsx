'use client'

import { useState } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import { useCrm } from '../../crm/context/CrmContext'
import type { TrainingEvent, TrainingParticipant } from '../context/TrainingsContext'
import {
  Calendar, Users, Plus, Trash2, Edit3, Compass,
  ArrowRight, Search, FileText, CheckCircle, XCircle,
  HelpCircle, Check, Play, UserPlus, FileSpreadsheet
} from 'lucide-react'

export default function EventsPage() {
  const {
    events,
    participants,
    addEvent,
    updateEvent,
    deleteEvent,
    addParticipant,
    deleteParticipant,
    confirmAttendance,
    recordAbsenceJustification,
    importParticipantsList
  } = useTrainings()

  const { companies, contacts } = useCrm()

  // Selected event for detail view and participant management
  const [selectedEvent, setSelectedEvent] = useState<TrainingEvent | null>(events[0] || null)

  // Modals / Form toggles
  const [showEventModal, setShowEventModal] = useState(false)
  const [showParticipantModal, setShowParticipantModal] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)

  // Event form state
  const [eventForm, setEventForm] = useState({
    companyId: '',
    projectId: '',
    projectName: '',
    type: 'Treinamento' as TrainingEvent['type'],
    name: '',
    theme: '',
    objective: '',
    targetAudience: '',
    facilitator: 'Bruno Crepaldi',
    modality: 'presencial' as TrainingEvent['modality'],
    location: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    hoursDuration: 2.0,
    expectedParticipants: 30,
    cost: 5000,
    status: 'agendado' as TrainingEvent['status'],
    notes: ''
  })

  // Participant form state
  const [partForm, setPartForm] = useState({
    crmContactId: '',
    name: '',
    companyName: '',
    unit: '',
    sector: '',
    role: '',
    email: '',
    phone: '',
  })

  // Spreadsheet/List Import string state (simple text comma-separated or lines format)
  const [importText, setImportText] = useState('')

  // Selected CRM Contact for linkage
  const handleCrmContactSelect = (contactId: string) => {
    const found = contacts.find(c => c.id === contactId)
    if (found) {
      const comp = companies.find(co => co.id === found.companyId)
      setPartForm({
        crmContactId: found.id,
        name: found.name,
        companyName: comp ? comp.name : '',
        unit: 'Matriz',
        sector: '',
        role: found.role || '',
        email: found.email || '',
        phone: found.phone || ''
      })
    }
  }

  const handleCreateEvent = (e: React.FormEvent) => {
    e.preventDefault()
    const selectedComp = companies.find(c => c.id === eventForm.companyId)
    const newEvent = addEvent({
      ...eventForm,
      companyName: selectedComp ? selectedComp.name : 'Cliente Geral',
    })
    setSelectedEvent(newEvent)
    setShowEventModal(false)
    // reset form
    setEventForm({
      companyId: '',
      projectId: '',
      projectName: '',
      type: 'Treinamento',
      name: '',
      theme: '',
      objective: '',
      targetAudience: '',
      facilitator: 'Bruno Crepaldi',
      modality: 'presencial',
      location: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      hoursDuration: 2.0,
      expectedParticipants: 30,
      cost: 5000,
      status: 'agendado',
      notes: ''
    })
  }

  const handleCreateParticipant = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent) return
    addParticipant({
      ...partForm,
      eventId: selectedEvent.id,
      attendanceStatus: 'ausente'
    })
    setShowParticipantModal(false)
    setPartForm({ crmContactId: '', name: '', companyName: '', unit: '', sector: '', role: '', email: '', phone: '' })
  }

  const handleImportText = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEvent || !importText) return
    // Lines format: Name, Email, Role, Sector
    const lines = importText.split('\n')
    const parsed: Omit<TrainingParticipant, 'id' | 'eventId'>[] = []
    
    lines.forEach(line => {
      if (line.trim()) {
        const parts = line.split(',')
        parsed.push({
          name: parts[0]?.trim() || 'Participante Importado',
          email: parts[1]?.trim() || '',
          role: parts[2]?.trim() || '',
          sector: parts[3]?.trim() || '',
          companyName: selectedEvent.companyName,
          attendanceStatus: 'ausente'
        })
      }
    })

    importParticipantsList(selectedEvent.id, parsed)
    setShowImportModal(false)
    setImportText('')
  }

  // Filter participants of the selected event
  const eventParticipants = participants.filter(p => p.eventId === selectedEvent?.id)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Eventos & Participantes</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gerencie os treinamentos programados, monte turmas e controle frequências</p>
        </div>
        <button
          onClick={() => setShowEventModal(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-100 hover:opacity-90 hover:-translate-y-0.5 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Evento / Workshop
        </button>
      </div>

      {/* Main Grid: Split List and Detail/Participants */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left Side: Events List */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-100 shadow-sm p-4 space-y-4 h-fit">
          <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block px-1">Selecione o Evento</span>
          
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {events.map(ev => (
              <div
                key={ev.id}
                onClick={() => setSelectedEvent(ev)}
                className={`p-4 rounded-xl border text-left cursor-pointer transition-all hover:border-violet-200 relative overflow-hidden group ${selectedEvent?.id === ev.id ? 'border-violet-500 ring-2 ring-violet-50' : 'border-slate-100'}`}
              >
                <div className="flex justify-between items-start gap-2">
                  <span className="text-[9px] font-bold px-1.5 py-0.5 bg-slate-50 text-slate-600 border border-slate-200 rounded uppercase">
                    {ev.type}
                  </span>
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                    ev.status === 'realizado' || ev.status === 'concluido' ? 'bg-emerald-50 text-emerald-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {ev.status}
                  </span>
                </div>

                <h3 className="font-bold text-slate-800 text-sm mt-2 leading-tight group-hover:text-violet-600 transition-colors">{ev.name}</h3>
                <p className="text-xs text-slate-500 mt-1">🏢 {ev.companyName}</p>
                
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-3 pt-2.5 border-t border-slate-50">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(ev.eventDate).toLocaleDateString('pt-BR')} ({ev.startTime})</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side: Event Details & Participants list */}
        <div className="lg:col-span-2 space-y-6">
          {selectedEvent ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              
              {/* Event Metadata Card */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-6 border-b border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold px-2.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-md uppercase tracking-wider">
                    {selectedEvent.type}
                  </span>
                  <h2 className="text-xl font-bold text-slate-800 mt-1.5 leading-tight">{selectedEvent.name}</h2>
                  <p className="text-sm text-slate-500">Tema central: {selectedEvent.theme}</p>
                </div>
                
                <button
                  onClick={() => {
                    if (confirm('Deseja realmente excluir este evento?')) {
                      deleteEvent(selectedEvent.id)
                      setSelectedEvent(events.find(e => e.id !== selectedEvent.id) || null)
                    }
                  }}
                  className="p-2 bg-slate-50 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl transition-colors self-start"
                  title="Excluir Evento"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Event technical specifications */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-50 text-xs">
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-bold">Cliente</span>
                  <span className="font-bold text-slate-700 mt-0.5 block">{selectedEvent.companyName}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-bold">Facilitador</span>
                  <span className="font-bold text-slate-700 mt-0.5 block">{selectedEvent.facilitator}</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-bold">Data & Duração</span>
                  <span className="font-bold text-slate-700 mt-0.5 block">
                    {new Date(selectedEvent.eventDate).toLocaleDateString('pt-BR')} ({selectedEvent.hoursDuration}h)
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase tracking-wider text-[9px] font-bold">Modalidade/Local</span>
                  <span className="font-bold text-slate-700 mt-0.5 block capitalize truncate max-w-[150px]">{selectedEvent.modality} - {selectedEvent.location || 'N/A'}</span>
                </div>
              </div>

              {/* Participants Management Section */}
              <div className="space-y-4 pt-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Lista de Participantes ({eventParticipants.length})</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Cadastre ou vincule colaboradores à turma do evento</p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowImportModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-semibold transition-all"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Importar Lista
                    </button>
                    <button
                      onClick={() => setShowParticipantModal(true)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-violet-100 transition-all"
                    >
                      <UserPlus className="w-3.5 h-3.5" /> Vincular Participante
                    </button>
                  </div>
                </div>

                {/* Participants Table List */}
                <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                        <th className="py-2.5 px-4">Nome</th>
                        <th className="py-2.5 px-3">Cargo / Setor</th>
                        <th className="py-2.5 px-3">E-mail / Fone</th>
                        <th className="py-2.5 px-3">Frequência</th>
                        <th className="py-2.5 px-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {eventParticipants.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-12 text-center text-slate-400">
                            Nenhum participante vinculado a este evento.
                          </td>
                        </tr>
                      ) : (
                        eventParticipants.map(part => (
                          <tr key={part.id} className="hover:bg-slate-50/30 transition-colors">
                            <td className="py-3 px-4 font-bold text-slate-800">{part.name}</td>
                            <td className="py-3 px-3 text-slate-600">
                              <p>{part.role || 'Não cadastrado'}</p>
                              <span className="text-[10px] text-slate-400">{part.sector}</span>
                            </td>
                            <td className="py-3 px-3 text-slate-500">
                              <p>{part.email || '-'}</p>
                              <p className="text-[10px] text-slate-400">{part.phone}</p>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => confirmAttendance(part.id, new Date().toISOString(), 'Assinatura Manual')}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    part.attendanceStatus === 'presente'
                                      ? 'bg-emerald-50 border-emerald-200 text-emerald-600'
                                      : 'bg-white border-slate-200 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600'
                                  }`}
                                  title="Confirmar Presença"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                
                                <button
                                  onClick={() => {
                                    const j = prompt('Justificativa da ausência:')
                                    if (j !== null) recordAbsenceJustification(part.id, j)
                                  }}
                                  className={`p-1.5 rounded-lg border transition-colors ${
                                    part.attendanceStatus === 'justificado'
                                      ? 'bg-amber-50 border-amber-200 text-amber-600'
                                      : 'bg-white border-slate-200 hover:bg-amber-50 text-slate-400 hover:text-amber-600'
                                  }`}
                                  title="Registrar Justificativa"
                                >
                                  <HelpCircle className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                            <td className="py-3 px-3 text-right">
                              <button
                                onClick={() => deleteParticipant(part.id)}
                                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center text-slate-400">
              <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-sm">Nenhum evento cadastrado</p>
              <p className="text-xs mt-1">Crie um evento no botão do painel superior para gerenciar.</p>
            </div>
          )}
        </div>

      </div>

      {/* CREATE EVENT MODAL */}
      {showEventModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEventModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl font-sans max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Agendar Novo Evento / Capacitação</h2>
              <p className="text-sm text-slate-500">Preencha os campos para programar na agenda corporativa</p>
            </div>
            
            <form onSubmit={handleCreateEvent} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cliente *</label>
                  <select required value={eventForm.companyId} onChange={e => setEventForm({ ...eventForm, companyId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="">Selecione o Cliente...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipo de Evento *</label>
                  <select required value={eventForm.type} onChange={e => setEventForm({ ...eventForm, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="Palestra">Palestra</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Workshop">Workshop</option>
                    <option value="SIPAT">SIPAT</option>
                    <option value="Capacitação">Capacitação</option>
                    <option value="Imersão">Imersão</option>
                    <option value="Mentoria coletiva">Mentoria coletiva</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Evento *</label>
                  <input required value={eventForm.name} onChange={e => setEventForm({ ...eventForm, name: e.target.value })}
                    placeholder="Ex: Treinamento de Saúde Ocupacional e Liderança" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-300" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tema Principal *</label>
                  <input required value={eventForm.theme} onChange={e => setEventForm({ ...eventForm, theme: e.target.value })}
                    placeholder="Ex: Comunicação Não-Violenta" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Facilitador / Palestrante *</label>
                  <input required value={eventForm.facilitator} onChange={e => setEventForm({ ...eventForm, facilitator: e.target.value })}
                    placeholder="Ex: Bruno Crepaldi" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Modalidade *</label>
                  <select required value={eventForm.modality} onChange={e => setEventForm({ ...eventForm, modality: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="presencial">Presencial</option>
                    <option value="online">Online / Remoto</option>
                    <option value="hibrido">Híbrido</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Local físico ou Link do Evento *</label>
                  <input required value={eventForm.location} onChange={e => setEventForm({ ...eventForm, location: e.target.value })}
                    placeholder="Ex: Sala de Reunião Matriz ou Link do Zoom" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data do Evento *</label>
                  <input required type="date" value={eventForm.eventDate} onChange={e => setEventForm({ ...eventForm, eventDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horário de Início *</label>
                  <input required type="time" value={eventForm.startTime} onChange={e => setEventForm({ ...eventForm, startTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Horário de Término *</label>
                  <input required type="time" value={eventForm.endTime} onChange={e => setEventForm({ ...eventForm, endTime: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Carga Horária (horas) *</label>
                  <input required type="number" step="0.5" value={eventForm.hoursDuration} onChange={e => setEventForm({ ...eventForm, hoursDuration: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Valor Contratado (R$) *</label>
                  <input required type="number" value={eventForm.cost} onChange={e => setEventForm({ ...eventForm, cost: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Previsão de Participantes *</label>
                  <input required type="number" value={eventForm.expectedParticipants} onChange={e => setEventForm({ ...eventForm, expectedParticipants: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>

              </div>

              <div className="flex gap-3 pt-4 border-t border-slate-100">
                <button type="button" onClick={() => setShowEventModal(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity">
                  Criar Evento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VINCULATE PARTICIPANT MODAL */}
      {showParticipantModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowParticipantModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md font-sans" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Vincular Novo Colaborador</h2>
              <p className="text-sm text-slate-500">Selecione do CRM ou cadastre manualmente</p>
            </div>
            
            <form onSubmit={handleCreateParticipant} className="p-6 space-y-4">
              
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Vincular do CRM (Gestão de Pessoas)</label>
                <select value={partForm.crmContactId} onChange={e => handleCrmContactSelect(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="">Selecione do CRM...</option>
                  {contacts.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome Completo *</label>
                <input required value={partForm.name} onChange={e => setPartForm({ ...partForm, name: e.target.value })}
                  placeholder="Ex: João da Silva" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Empresa *</label>
                  <input required value={partForm.companyName} onChange={e => setPartForm({ ...partForm, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo *</label>
                  <input required value={partForm.role} onChange={e => setPartForm({ ...partForm, role: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Unidade</label>
                  <input value={partForm.unit} onChange={e => setPartForm({ ...partForm, unit: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Setor</label>
                  <input value={partForm.sector} onChange={e => setPartForm({ ...partForm, sector: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                  <input type="email" value={partForm.email} onChange={e => setPartForm({ ...partForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                  <input value={partForm.phone} onChange={e => setPartForm({ ...partForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowParticipantModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity">
                  Vincular
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* IMPORT PARTICIPANTS MODAL */}
      {showImportModal && selectedEvent && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowImportModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md font-sans" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Importar Lista de Participantes</h2>
              <p className="text-sm text-slate-500">Envie múltiplos colaboradores de uma vez</p>
            </div>
            
            <form onSubmit={handleImportText} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cole os dados (Formato CSV simples - 1 participante por linha)</label>
                <span className="text-[10px] text-slate-400 block mb-2">Exemplo: Nome, E-mail, Cargo, Setor</span>
                <textarea
                  required
                  rows={6}
                  value={importText}
                  onChange={e => setImportText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-300 resize-none font-mono"
                  placeholder="Ricardo Mendes, ricardo@vale.com, Gerente, Logística&#10;Aline Souza, aline@vale.com, Analista, RH"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowImportModal(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-opacity">
                  Importar Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
