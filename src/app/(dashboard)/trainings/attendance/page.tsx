'use client'

import { useState } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import { CheckCircle, Clock, QrCode, FileText, Users, AlertCircle, Shield } from 'lucide-react'

export default function AttendancePage() {
  const { events, participants, confirmAttendance, recordAbsenceJustification } = useTrainings()
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
  const [showQR, setShowQR] = useState(false)
  const [justificationInput, setJustificationInput] = useState<{ [id: string]: string }>({})

  const event = events.find(e => e.id === selectedEventId)
  const eventParts = participants.filter(p => p.eventId === selectedEventId)
  const presentCount = eventParts.filter(p => p.attendanceStatus === 'presente').length
  const absentCount = eventParts.filter(p => p.attendanceStatus === 'ausente').length
  const justifiedCount = eventParts.filter(p => p.attendanceStatus === 'justificado').length
  const attendanceRate = eventParts.length > 0 ? Math.round((presentCount / eventParts.length) * 100) : 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lista de Presença Digital</h1>
          <p className="text-slate-500 text-sm mt-0.5">Confirme presenças, registre justificativas e exporte a lista assinada</p>
        </div>
        <button
          onClick={() => setShowQR(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-100 hover:opacity-90 transition-all"
        >
          <QrCode className="w-4 h-4" /> Gerar QR Code
        </button>
      </div>

      {/* Event selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <label className="block text-xs font-bold text-slate-700 mb-2">Selecione o Evento</label>
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        >
          <option value="">Selecione um evento...</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.name} — {new Date(e.eventDate).toLocaleDateString('pt-BR')}</option>
          ))}
        </select>
      </div>

      {event && (
        <>
          {/* KPI row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Total Inscritos', value: eventParts.length, color: 'slate', icon: Users },
              { label: 'Presentes', value: presentCount, color: 'emerald', icon: CheckCircle },
              { label: 'Ausentes', value: absentCount, color: 'red', icon: AlertCircle },
              { label: 'Taxa de Presença', value: `${attendanceRate}%`, color: 'violet', icon: Shield },
            ].map(kpi => (
              <div key={kpi.label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                <div className={`p-2.5 rounded-xl bg-${kpi.color}-50 text-${kpi.color}-600`}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                  <p className="text-xl font-black text-slate-800">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Attendance list */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Controle de Presença: {event.name}</h3>
              <button
                onClick={() => {
                  const content = ['LISTA DE PRESENÇA\n', `Evento: ${event.name}`, `Data: ${new Date(event.eventDate).toLocaleDateString('pt-BR')}`, `Facilitador: ${event.facilitator}`, '', 'Nome | Cargo | Empresa | Status | Horário', ...eventParts.map(p => `${p.name} | ${p.role || '-'} | ${p.companyName} | ${p.attendanceStatus} | ${p.entryTime ? new Date(p.entryTime).toLocaleTimeString('pt-BR') : '-'}`)].join('\n')
                  const blob = new Blob([content], { type: 'text/plain' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `lista-presenca-${event.name}.txt`; a.click()
                }}
                className="flex items-center gap-2 px-4 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all"
              >
                <FileText className="w-3.5 h-3.5" /> Exportar Lista
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                    <th className="py-3 px-6">Nome & Cargo</th>
                    <th className="py-3 px-4">Empresa</th>
                    <th className="py-3 px-4">E-mail</th>
                    <th className="py-3 px-4">Horário Entrada</th>
                    <th className="py-3 px-4">Assinatura</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {eventParts.length === 0 ? (
                    <tr><td colSpan={7} className="py-12 text-center text-slate-400">Nenhum participante inscrito neste evento.</td></tr>
                  ) : eventParts.map(p => (
                    <tr key={p.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-3.5 px-6">
                        <p className="font-bold text-slate-800">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.role} — {p.sector}</p>
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">{p.companyName}</td>
                      <td className="py-3.5 px-4 text-slate-500">{p.email || '—'}</td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {p.entryTime ? (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-500" />
                            {new Date(p.entryTime).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500 italic">{p.signatureSimple || '—'}</td>
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          p.attendanceStatus === 'presente' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          p.attendanceStatus === 'justificado' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
                          {p.attendanceStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2 justify-end">
                          {p.attendanceStatus !== 'presente' && (
                            <button
                              onClick={() => confirmAttendance(p.id, new Date().toISOString(), p.name)}
                              className="px-3 py-1.5 text-[10px] font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                            >
                              Confirmar
                            </button>
                          )}
                          {p.attendanceStatus === 'ausente' && (
                            <div className="flex items-center gap-1.5">
                              <input
                                value={justificationInput[p.id] || ''}
                                onChange={e => setJustificationInput(prev => ({ ...prev, [p.id]: e.target.value }))}
                                placeholder="Justificativa..."
                                className="px-2 py-1 border border-slate-200 rounded-lg text-[10px] w-28 focus:outline-none focus:ring-1 focus:ring-violet-300"
                              />
                              <button
                                onClick={() => {
                                  if (justificationInput[p.id]) {
                                    recordAbsenceJustification(p.id, justificationInput[p.id])
                                    setJustificationInput(prev => { const n = { ...prev }; delete n[p.id]; return n })
                                  }
                                }}
                                className="px-2 py-1.5 text-[10px] font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors"
                              >
                                Justificar
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* QR Code Modal */}
      {showQR && event && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQR(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm text-center p-8 space-y-5" onClick={e => e.stopPropagation()}>
            <div>
              <h2 className="text-lg font-bold text-slate-800">QR Code de Presença</h2>
              <p className="text-sm text-slate-500 mt-1">{event.name}</p>
            </div>
            <div className="w-48 h-48 mx-auto bg-slate-100 rounded-2xl flex items-center justify-center border-2 border-dashed border-slate-300">
              <div className="text-center space-y-2">
                <QrCode className="w-16 h-16 text-violet-400 mx-auto" />
                <p className="text-xs text-slate-400 font-medium">QR Code Simulado</p>
                <p className="text-[9px] text-slate-300">CDH-{event.id.toUpperCase().slice(-6)}</p>
              </div>
            </div>
            <div className="p-3 bg-violet-50 rounded-xl text-xs text-violet-700 font-medium">
              Exiba o QR Code aos participantes para confirmação de entrada
            </div>
            <button onClick={() => setShowQR(false)} className="w-full py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-semibold hover:bg-slate-200 transition-colors">
              Fechar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
