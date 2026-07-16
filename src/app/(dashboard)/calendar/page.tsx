'use client'

import { useState, useMemo, useRef } from 'react'
import { useCalendar, CalendarEvent, CalendarView, EventType } from './context/CalendarContext'
import { useCalendarRealtime } from '@/hooks/useCalendarRealtime'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useClients } from '@/app/(dashboard)/clients/context/ClientsContext'
import {
  ChevronLeft, ChevronRight, Plus, X, CalendarDays, CalendarRange,
  Clock, MapPin, Link2, Users, Bell, Trash2, CheckCircle, XCircle,
  AlertCircle, Loader2, Brain, Building2, Briefcase, User, FileText,
  List, Search, Filter, MoreHorizontal, Edit2
} from 'lucide-react'

const HOURS = Array.from({ length: 14 }, (_, i) => `${String(i + 7).padStart(2, '0')}:00`)

const EVENT_TYPE_CONFIG: Record<EventType, { icon: string; label: string; color: string }> = {
  commercial_meeting: { icon: '🤝', label: 'Reunião Comercial', color: '#3b82f6' },
  client_meeting: { icon: '👔', label: 'Reunião com Cliente', color: '#8b5cf6' },
  mentoring: { icon: '🎯', label: 'Mentoria', color: '#06b6d4' },
  training: { icon: '📚', label: 'Treinamento', color: '#10b981' },
  lecture: { icon: '🎤', label: 'Palestra', color: '#f59e0b' },
  sipat: { icon: '🛡️', label: 'SIPAT', color: '#ef4444' },
  nr01_interview: { icon: '📋', label: 'Entrevista NR01', color: '#ec4899' },
  technical_visit: { icon: '🔧', label: 'Visita Técnica', color: '#6366f1' },
  internal_activity: { icon: '📌', label: 'Atividade Interna', color: '#64748b' },
}

function fmtTime(t: string) {
  const [h, m] = t.split(':')
  return `${h}h${m === '00' ? '' : m}`
}

function getDuration(start: string, end: string) {
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  const min = eh * 60 + em - sh * 60 - sm
  return min >= 60 ? `${Math.floor(min / 60)}h${min % 60 > 0 ? `${min % 60}min` : ''}` : `${min}min`
}

export default function CalendarPage() {
  useCalendarRealtime()
  const cal = useCalendar()
  const { companies } = useCrm()
  const { clients } = useClients()

  // View state
  const [search, setSearch] = useState('')

  // Modal state
  const [showForm, setShowForm] = useState(false)
  const [editEvent, setEditEvent] = useState<CalendarEvent | null>(null)
  const [viewEvent, setViewEvent] = useState<CalendarEvent | null>(null)
  const [showDashboard, setShowDashboard] = useState(false)

  // Form state
  const [form, setForm] = useState({
    title: '', type: 'client_meeting' as EventType, description: '',
    companyId: '', projectId: '', contractId: '',
    responsible: 'Equipe CrepaldiDH', location: '', link: '',
    eventDate: new Date().toISOString().split('T')[0],
    startTime: '09:00', endTime: '10:00',
    allDay: false, status: 'scheduled' as CalendarEvent['status'],
    color: '#8b5cf6', notes: '', reminderMinutes: 30,
  })

  // AI state
  const [aiResult, setAiResult] = useState('')
  const [aiLoading, setAiLoading] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  // Filter events for list views
  const filteredUpcoming = useMemo(() => {
    let list = cal.upcomingEvents
    if (search) { const q = search.toLowerCase(); list = list.filter(e => e.title.toLowerCase().includes(q) || (e.companyName || '').toLowerCase().includes(q)) }
    return list
  }, [cal.upcomingEvents, search])

  const filteredAgenda = useMemo(() => {
    let list = cal.agendaEvents
    if (search) { const q = search.toLowerCase(); list = list.filter(e => e.title.toLowerCase().includes(q) || (e.companyName || '').toLowerCase().includes(q)) }
    return list
  }, [cal.agendaEvents, search])

  // Form handlers
  const openNewForm = (date?: string, start?: string) => {
    setEditEvent(null)
    setForm({
      title: '', type: 'client_meeting', description: '',
      companyId: '', projectId: '', contractId: '',
      responsible: 'Equipe CrepaldiDH', location: '', link: '',
      eventDate: date || new Date().toISOString().split('T')[0],
      startTime: start || '09:00', endTime: start ? `${String(Number(start.split(':')[0]) + 1).padStart(2, '0')}:${start.split(':')[1]}` : '10:00',
      allDay: false, status: 'scheduled',
      color: '#8b5cf6', notes: '', reminderMinutes: 30,
    })
    setShowForm(true)
  }

  const openEditForm = (e: CalendarEvent) => {
    setEditEvent(e)
    setForm({
      title: e.title, type: e.type, description: e.description || '',
      companyId: e.companyId || '', projectId: e.projectId || '', contractId: e.contractId || '',
      responsible: e.responsible, location: e.location || '', link: e.link || '',
      eventDate: e.eventDate, startTime: e.startTime, endTime: e.endTime,
      allDay: e.allDay, status: e.status,
      color: e.color, notes: e.notes || '', reminderMinutes: e.reminderMinutes,
    })
    setShowForm(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const companyName = form.companyId ? companies.find(c => c.id === form.companyId)?.name : undefined
    const matchedClient = form.companyId ? clients.find(c => c.companyName === companyName || c.companyTradeName === companyName) : undefined
    const data = {
      title: form.title, type: form.type, description: form.description || undefined,
      companyId: form.companyId || undefined, companyName,
      clientId: matchedClient?.id,
      projectId: form.projectId || undefined, contractId: form.contractId || undefined,
      responsible: form.responsible, location: form.location || undefined, link: form.link || undefined,
      eventDate: form.eventDate, startTime: form.startTime, endTime: form.endTime,
      allDay: form.allDay, status: form.status, color: form.color,
      notes: form.notes || undefined, reminderMinutes: form.reminderMinutes,
    }
    if (editEvent) cal.updateEvent(editEvent.id, data)
    else cal.addEvent(data)
    setShowForm(false); setEditEvent(null)
  }

  const handleDelete = () => {
    if (editEvent && confirm(`Excluir "${editEvent.title}"?`)) {
      cal.deleteEvent(editEvent.id)
      setShowForm(false); setEditEvent(null)
    }
  }

  const runAi = async (fn: () => Promise<string>) => {
    setAiLoading(true); setAiResult('')
    try { const r = await fn(); setAiResult(r) }
    catch { setAiResult('Erro ao gerar resposta.') }
    setAiLoading(false)
  }

  // ========== VIEWS ==========

  const renderMonthView = () => {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const weeks: typeof cal.monthDays[] = []
    for (let i = 0; i < cal.monthDays.length; i += 7) weeks.push(cal.monthDays.slice(i, i + 7))

    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-100">
          {weekDays.map(d => (
            <div key={d} className="py-2 text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="divide-y divide-slate-50">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 min-h-[100px]">
              {week.map((day, di) => {
                const dayDate = day.date.toISOString().split('T')[0]
                const maxShow = 2
                return (
                  <div
                    key={di}
                    onClick={() => openNewForm(dayDate, '09:00')}
                    className={`p-1.5 border-r border-slate-50 cursor-pointer hover:bg-violet-50/30 transition-colors relative ${
                      dayDate === new Date().toISOString().split('T')[0] ? 'bg-violet-50/50' : ''
                    }`}
                  >
                    <p className={`text-[11px] font-bold mb-1 ${
                      day.isCurrentMonth ? 'text-slate-800' : 'text-slate-300'
                    } ${dayDate === new Date().toISOString().split('T')[0] ? 'text-violet-700' : ''}`}>
                      {day.date.getDate()}
                    </p>
                    <div className="space-y-0.5">
                      {day.events.slice(0, maxShow).map(ev => (
                        <div
                          key={ev.id}
                          onClick={(e) => { e.stopPropagation(); setViewEvent(ev) }}
                          className="text-[8px] font-bold text-white px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80"
                          style={{ backgroundColor: ev.color || '#8b5cf6' }}
                        >
                          {ev.startTime.slice(0, 5)} {ev.title}
                        </div>
                      ))}
                      {day.events.length > maxShow && (
                        <p className="text-[8px] text-slate-400 font-medium px-1">+{day.events.length - maxShow} mais</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  const renderWeekView = () => {
    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    return (
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-100">
          <div />
          {cal.weekDays.map((day, i) => (
            <div key={i} className={`py-2 text-center border-r border-slate-50 ${day.isToday ? 'bg-violet-50' : ''}`}>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{weekDays[i]}</p>
              <p className={`text-lg font-black ${day.isToday ? 'text-violet-700' : 'text-slate-800'}`}>{day.date.getDate()}</p>
            </div>
          ))}
        </div>
        <div className="overflow-y-auto max-h-[600px]" ref={scrollRef}>
          <div className="relative">
            {HOURS.map((hour, hi) => {
              const hourNum = parseInt(hour)
              return (
                <div key={hour} className="grid grid-cols-[60px_repeat(7,1fr)] border-b border-slate-50 min-h-[48px]">
                  <div className="text-[9px] text-slate-400 font-medium pr-2 text-right pt-1">{hour}</div>
                  {[0, 1, 2, 3, 4, 5, 6].map(dayIdx => {
                    const day = cal.weekDays[dayIdx]
                    const dayStr = day.date.toISOString().split('T')[0]
                    const hourEvents = day.events.filter(e => {
                      const eh = parseInt(e.startTime)
                      return eh >= hourNum && eh < hourNum + 1
                    })
                    return (
                      <div
                        key={dayIdx}
                        onClick={() => openNewForm(dayStr, `${String(hourNum).padStart(2, '0')}:00`)}
                        className="border-r border-slate-50 relative cursor-pointer hover:bg-violet-50/20 transition-colors"
                      >
                        {hourEvents.map(ev => {
                          const [sh] = ev.startTime.split(':').map(Number)
                          const [eh] = ev.endTime.split(':').map(Number)
                          const top = ((sh - hourNum) / 1) * 100
                          const height = Math.max(((eh - sh) / 1) * 100, 20)
                          return (
                            <div
                              key={ev.id}
                              onClick={(e) => { e.stopPropagation(); setViewEvent(ev) }}
                              className="absolute left-0.5 right-0.5 rounded px-1 py-0.5 text-[9px] text-white font-bold cursor-pointer overflow-hidden z-10 hover:opacity-80"
                              style={{ top: `${top}%`, height: `${height}%`, backgroundColor: ev.color || '#8b5cf6' }}
                            >
                              {ev.title}
                            </div>
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    )
  }

  const renderDayView = () => (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <div className="p-4 border-b border-slate-100">
        <p className="text-lg font-black text-slate-800">
          {cal.currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
        <p className="text-xs text-slate-400">{cal.dayEvents.length} compromisso(s)</p>
      </div>
      <div className="overflow-y-auto max-h-[600px]">
        {HOURS.map((hour, hi) => {
          const hourNum = parseInt(hour)
          const hourEvents = cal.dayEvents.filter(e => {
            const eh = parseInt(e.startTime)
            return eh >= hourNum && eh < hourNum + 1
          })
          return (
            <div
              key={hour}
              onClick={() => openNewForm(cal.currentDate.toISOString().split('T')[0], `${String(hourNum).padStart(2, '0')}:00`)}
              className="flex border-b border-slate-50 min-h-[56px] cursor-pointer hover:bg-violet-50/20 transition-colors"
            >
              <div className="w-16 text-[9px] text-slate-400 font-medium pr-2 text-right pt-1 shrink-0">{hour}</div>
              <div className="flex-1 relative border-l border-slate-100 ml-2">
                {hourEvents.map(ev => {
                  const [sh] = ev.startTime.split(':').map(Number)
                  const [eh] = ev.endTime.split(':').map(Number)
                  const top = ((sh - hourNum) / 1) * 100
                  const height = Math.max(((eh - sh) / 1) * 100, 24)
                  return (
                    <div
                      key={ev.id}
                      onClick={(e) => { e.stopPropagation(); setViewEvent(ev) }}
                      className="absolute left-1 right-1 rounded-lg px-2 py-1 text-[11px] text-white font-bold cursor-pointer z-10 hover:opacity-80"
                      style={{ top: `${top}%`, height: `${height}%`, backgroundColor: ev.color || '#8b5cf6' }}
                    >
                      <p className="truncate">{ev.title}</p>
                      <p className="text-[9px] opacity-80">{ev.startTime.slice(0, 5)} - {ev.endTime.slice(0, 5)}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )

  const renderAgendaView = () => {
    const grouped = filteredAgenda.reduce((acc, e) => {
      if (!acc[e.eventDate]) acc[e.eventDate] = []
      acc[e.eventDate].push(e)
      return acc
    }, {} as Record<string, CalendarEvent[]>)

    return (
      <div className="space-y-4">
        <div className="relative max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar compromissos..." className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-full bg-white" />
        </div>
        {Object.keys(grouped).length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm">
            <CalendarDays className="w-10 h-10 text-slate-200 mx-auto mb-3" />
            <p className="text-xs font-medium">Nenhum compromisso encontrado</p>
          </div>
        ) : (
          Object.entries(grouped).map(([date, evts]) => {
            const d = new Date(date + 'T12:00:00')
            const isToday = date === new Date().toISOString().split('T')[0]
            return (
              <div key={date}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`px-3 py-1 rounded-full text-[10px] font-bold ${isToday ? 'bg-violet-100 text-violet-700' : 'bg-slate-100 text-slate-600'}`}>
                    {isToday ? 'Hoje' : d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
                  </div>
                  <span className="text-[10px] text-slate-400">{evts.length} compromisso(s)</span>
                </div>
                <div className="space-y-2">
                  {evts.map(ev => (
                    <div key={ev.id} onClick={() => setViewEvent(ev)} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer">
                      <div className="flex items-start gap-3">
                        <div className="w-1 h-full min-h-[40px] rounded-full shrink-0 mt-0.5" style={{ backgroundColor: ev.color || '#8b5cf6' }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <h3 className="text-sm font-bold text-slate-800">{ev.title}</h3>
                              <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {fmtTime(ev.startTime)} - {fmtTime(ev.endTime)} ({getDuration(ev.startTime, ev.endTime)})
                              </p>
                            </div>
                            <span className={`px-2 py-0.5 text-[8px] font-bold uppercase rounded-full border whitespace-nowrap ${cal.getStatusColor(ev.status)}`}>
                              {cal.getStatusLabel(ev.status)}
                            </span>
                          </div>
                          {ev.companyName && <p className="text-[11px] text-slate-600 mt-1 flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400" />{ev.companyName}</p>}
                          {ev.location && <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><MapPin className="w-3 h-3" />{ev.location}</p>}
                          {ev.link && <p className="text-[10px] text-violet-500 mt-0.5 flex items-center gap-1"><Link2 className="w-3 h-3" /><a href={ev.link} target="_blank" rel="noopener noreferrer" className="underline">{ev.link}</a></p>}
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[9px] text-slate-400 flex items-center gap-1">{EVENT_TYPE_CONFIG[ev.type]?.icon} {EVENT_TYPE_CONFIG[ev.type]?.label}</span>
                            <span className="text-[9px] text-slate-400 flex items-center gap-1"><User className="w-2.5 h-2.5" />{ev.responsible}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })
        )}
      </div>
    )
  }

  const renderDashboard = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Hoje', value: cal.todayEvents.length, sub: `${cal.todayEvents.reduce((a, e) => {
            const [sh, sm] = e.startTime.split(':').map(Number)
            const [eh, em] = e.endTime.split(':').map(Number)
            return a + (eh * 60 + em - sh * 60 - sm)
          }, 0)}min agendados`, icon: CalendarDays, g: 'from-violet-500 to-purple-600' },
          { label: 'Próximos', value: cal.upcomingEvents.length, sub: 'compromissos futuros', icon: CalendarRange, g: 'from-blue-500 to-indigo-600' },
          { label: 'Atrasados', value: cal.overdueEvents.length, sub: cal.overdueEvents.length > 0 ? 'requerem atenção' : 'nenhum atrasado', icon: AlertCircle, g: 'from-red-500 to-rose-600' },
          { label: 'Horas Semana', value: `${cal.weekHours.toFixed(1)}h`, sub: 'agendadas esta semana', icon: Clock, g: 'from-emerald-500 to-teal-600' },
        ].map(kpi => (
          <div key={kpi.label} className={`rounded-2xl bg-gradient-to-br ${kpi.g} p-[1px] shadow-lg`}>
            <div className="bg-white rounded-[calc(1rem-1px)] p-4 h-full">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{kpi.label}</span>
                <div className={`p-1.5 rounded-lg bg-gradient-to-br ${kpi.g} text-white`}><kpi.icon className="w-3.5 h-3.5" /></div>
              </div>
              <p className="text-xl font-black text-slate-800">{typeof kpi.value === 'number' ? kpi.value : kpi.value}</p>
              <p className="text-[9px] text-slate-400 mt-0.5">{kpi.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's timeline */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-violet-500" /> Agenda de Hoje</h3>
        {cal.todayEvents.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Nenhum compromisso agendado para hoje</p>
        ) : (
          <div className="space-y-3">
            {cal.todayEvents.map(ev => {
              const [sh, sm] = ev.startTime.split(':').map(Number)
              const top = ((sh - 7) / 14) * 100
              return (
                <div key={ev.id} onClick={() => setViewEvent(ev)} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100 cursor-pointer hover:bg-violet-50/50 transition-colors">
                  <div className="text-center min-w-[48px]">
                    <p className="text-sm font-black text-slate-700">{fmtTime(ev.startTime)}</p>
                    <p className="text-[9px] text-slate-400">{getDuration(ev.startTime, ev.endTime)}</p>
                  </div>
                  <div className="w-0.5 h-auto rounded-full shrink-0" style={{ backgroundColor: ev.color || '#8b5cf6' }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <p className="text-sm font-bold text-slate-800">{ev.title}</p>
                      <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full border ${cal.getStatusColor(ev.status)}`}>{cal.getStatusLabel(ev.status)}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[9px] text-slate-400 mt-1">
                      {ev.companyName && <span className="flex items-center gap-1"><Building2 className="w-2.5 h-2.5" />{ev.companyName}</span>}
                      {ev.location && <span className="flex items-center gap-1"><MapPin className="w-2.5 h-2.5" />{ev.location}</span>}
                      {ev.responsible && <span className="flex items-center gap-1"><User className="w-2.5 h-2.5" />{ev.responsible}</span>}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Upcoming */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><CalendarRange className="w-4 h-4 text-blue-500" /> Próximos Compromissos</h3>
          {cal.upcomingEvents.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum compromisso futuro</p>
          ) : (
            <div className="space-y-2">
              {cal.upcomingEvents.slice(0, 5).map(ev => (
                <div key={ev.id} onClick={() => setViewEvent(ev)} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 cursor-pointer hover:bg-blue-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="text-center min-w-[36px]">
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{new Date(ev.eventDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</p>
                    </div>
                    <div>
                      <p className="text-[11px] font-bold text-slate-800">{ev.title}</p>
                      <p className="text-[9px] text-slate-400">{fmtTime(ev.startTime)} • {ev.companyName || ev.responsible}</p>
                    </div>
                  </div>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color || '#8b5cf6' }} />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><FileText className="w-4 h-4 text-emerald-500" /> Distribuição por Tipo</h3>
          {cal.typeDistribution.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">Nenhum dado disponível</p>
          ) : (
            <div className="space-y-2">
              {cal.typeDistribution.map(t => {
                const config = EVENT_TYPE_CONFIG[t.type as EventType]
                return (
                  <div key={t.type} className="flex items-center gap-3">
                    <span className="text-sm">{config?.icon || '📌'}</span>
                    <div className="flex-1">
                      <div className="flex justify-between text-xs mb-0.5">
                        <span className="font-medium text-slate-700">{t.label}</span>
                        <span className="font-bold text-slate-800">{t.count}</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5">
                        <div className="h-1.5 rounded-full" style={{ width: `${(t.count / Math.max(...cal.typeDistribution.map(x => x.count))) * 100}%`, backgroundColor: config?.color || '#8b5cf6' }} />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* AI Assistant */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><Brain className="w-4 h-4 text-violet-500" /> Assistente IA</h3>
        <div className="flex gap-2 flex-wrap mb-4">
          <button onClick={() => runAi(() => cal.generateDaySummary(new Date()))} disabled={aiLoading} className="px-3 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-[10px] font-bold shadow-sm disabled:opacity-50"><Loader2 className={`w-3 h-3 inline mr-1 ${aiLoading ? 'animate-spin' : ''}`} />Resumir Hoje</button>
          <button onClick={() => runAi(() => cal.generateWeekReport())} disabled={aiLoading} className="px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl text-[10px] font-bold shadow-sm disabled:opacity-50">Relatório Semanal</button>
          <button onClick={() => runAi(() => cal.suggestBestTime(new Date().toISOString().split('T')[0], 60))} disabled={aiLoading} className="px-3 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl text-[10px] font-bold shadow-sm disabled:opacity-50">Sugerir Horário</button>
        </div>
        {aiResult && (
          <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-xl p-4">
            <p className="text-xs leading-relaxed whitespace-pre-wrap">{aiResult}</p>
          </div>
        )}
      </div>
    </div>
  )

  // ========== MODAL: Event Detail View ==========

  const modalViewEvent = viewEvent && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setViewEvent(null)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-start">
          <div className="flex items-start gap-3">
            <div className="w-3 h-full min-h-[40px] rounded-full mt-1" style={{ backgroundColor: viewEvent.color }} />
            <div>
              <h2 className="text-lg font-bold text-slate-800">{viewEvent.title}</h2>
              <span className={`inline-block mt-1 px-2 py-0.5 text-[9px] font-bold rounded-full border ${cal.getStatusColor(viewEvent.status)}`}>
                {cal.getStatusLabel(viewEvent.status)}
              </span>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => { setViewEvent(null); openEditForm(viewEvent) }} className="p-2 text-slate-400 hover:text-violet-600 rounded-xl hover:bg-violet-50"><Edit2 className="w-4 h-4" /></button>
            <button onClick={() => setViewEvent(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Tipo</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{EVENT_TYPE_CONFIG[viewEvent.type]?.icon} {EVENT_TYPE_CONFIG[viewEvent.type]?.label}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Responsável</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{viewEvent.responsible}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Data</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{new Date(viewEvent.eventDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
              <p className="text-[9px] font-bold text-slate-400 uppercase">Horário</p>
              <p className="text-xs font-bold text-slate-700 mt-0.5">{fmtTime(viewEvent.startTime)} - {fmtTime(viewEvent.endTime)} ({getDuration(viewEvent.startTime, viewEvent.endTime)})</p>
            </div>
          </div>

          {viewEvent.companyName && (
            <div className="flex items-center gap-2 text-xs text-slate-600 p-3 bg-blue-50 rounded-xl border border-blue-100">
              <Building2 className="w-4 h-4 text-blue-500" />
              <span><span className="font-bold">Cliente:</span>{' '}
                {viewEvent.clientId && clients.find(c => c.id === viewEvent.clientId) ? (
                  <a href="/clients" className="text-violet-600 underline font-semibold hover:text-violet-800">{viewEvent.companyName}</a>
                ) : viewEvent.companyName}
              </span>
            </div>
          )}

          {viewEvent.description && (
            <div>
              <p className="text-[9px] font-bold text-slate-400 uppercase mb-1">Descrição</p>
              <p className="text-xs text-slate-600">{viewEvent.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-600">
            {viewEvent.location && <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{viewEvent.location}</p>}
            {viewEvent.link && <p className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-slate-400" /><a href={viewEvent.link} target="_blank" rel="noopener noreferrer" className="text-violet-600 underline">{viewEvent.link}</a></p>}
            {viewEvent.notes && <p className="flex items-center gap-1.5"><FileText className="w-3.5 h-3.5 text-slate-400" />{viewEvent.notes}</p>}
          </div>

          <div className="flex gap-2 pt-2 border-t border-slate-100">
            {viewEvent.status === 'scheduled' && (
              <>
                <button onClick={() => { cal.completeEvent(viewEvent.id); setViewEvent(null) }} className="flex-1 py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 flex items-center justify-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Concluir</button>
                <button onClick={() => { cal.cancelEvent(viewEvent.id); setViewEvent(null) }} className="flex-1 py-2 border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 flex items-center justify-center gap-1.5"><XCircle className="w-3.5 h-3.5" /> Cancelar</button>
              </>
            )}
            {viewEvent.status === 'completed' && (
              <button onClick={() => { cal.updateEvent(viewEvent.id, { status: 'scheduled' }); setViewEvent(null) }} className="flex-1 py-2 border border-amber-200 text-amber-600 rounded-xl text-xs font-bold hover:bg-amber-50">Reabrir</button>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <p className="text-[9px] text-slate-400">Criado em {new Date(viewEvent.createdAt).toLocaleString('pt-BR')}</p>
        </div>
      </div>
    </div>
  )

  // ========== MODAL: Event Form ==========

  const modalForm = showForm && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={() => setShowForm(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl my-8" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{editEvent ? 'Editar Compromisso' : 'Novo Compromisso'}</h2>
            <p className="text-xs text-slate-500">Preencha os detalhes do evento</p>
          </div>
          <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Título *</label>
              <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Reunião de alinhamento" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Tipo *</label>
              <select required value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EventType, color: EVENT_TYPE_CONFIG[e.target.value as EventType]?.color || '#8b5cf6' })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                {Object.entries(EVENT_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Responsável *</label>
              <input required value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Cliente</label>
              <select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                <option value="">Sem cliente</option>
                {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-700 mb-1">Status</label>
              <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as CalendarEvent['status'] })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                <option value="scheduled">Agendado</option>
                <option value="confirmed">Confirmado</option>
                <option value="completed">Realizado</option>
                <option value="rescheduled">Reagendado</option>
              </select>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-[10px] font-bold text-slate-700 mb-3">Data e Horário</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">Data *</label>
                <input required type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">Início *</label>
                <input required type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">Fim *</label>
                <input required type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.allDay} onChange={e => setForm({ ...form, allDay: e.target.checked })} className="rounded border-slate-300 text-violet-600" />
                  <span className="text-[10px] text-slate-600 font-medium">Dia inteiro</span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-4">
            <p className="text-[10px] font-bold text-slate-700 mb-3">Local e Link</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">Local</label>
                <input value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} placeholder="Sala, endereço..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-[9px] text-slate-400 mb-1">Link (Meet/Zoom)</label>
                <input value={form.link} onChange={e => setForm({ ...form, link: e.target.value })} placeholder="https://meet.google.com/..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Descrição</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" placeholder="Descreva o objetivo do compromisso..." />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-700 mb-1">Observações</label>
            <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" placeholder="Informações adicionais..." />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-[10px] font-bold text-slate-700">Lembrete:</label>
            <select value={form.reminderMinutes} onChange={e => setForm({ ...form, reminderMinutes: Number(e.target.value) })} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-white">
              <option value={5}>5 min antes</option>
              <option value={15}>15 min antes</option>
              <option value={30}>30 min antes</option>
              <option value={60}>1 hora antes</option>
              <option value={120}>2 horas antes</option>
              <option value={1440}>1 dia antes</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4 border-t border-slate-100">
            {editEvent && (
              <button type="button" onClick={handleDelete} className="px-4 py-2.5 border border-red-200 text-red-500 rounded-xl text-xs font-bold hover:bg-red-50 flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Excluir</button>
            )}
            <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md">
              {editEvent ? 'Salvar Alterações' : 'Criar Compromisso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )

  // ========== MAIN RENDER ==========

  const viewLabel = useMemo(() => {
    if (cal.view === 'day') return cal.currentDate.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })
    if (cal.view === 'week') {
      const start = cal.weekDays[0]?.date
      const end = cal.weekDays[6]?.date
      if (start && end) return `${start.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })} - ${end.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: 'numeric' })}`
    }
    if (cal.view === 'month') return cal.currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    return 'Agenda'
  }, [cal.view, cal.currentDate, cal.weekDays])

  return (
    <div className="space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agenda Inteligente</h1>
          <p className="text-slate-500 text-sm mt-0.5">Compromissos, reuniões, mentorias e treinamentos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => { setShowDashboard(!showDashboard); if (!showDashboard) cal.setView('month') }}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all ${showDashboard ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 hover:border-violet-200'}`}>
            <List className="w-3.5 h-3.5" /> Dashboard
          </button>
          <button onClick={() => openNewForm()} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md"><Plus className="w-3.5 h-3.5" /> Novo</button>
        </div>
      </div>

      {showDashboard ? (
        renderDashboard()
      ) : (
        <>
          {/* Navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button onClick={cal.goPrev} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"><ChevronLeft className="w-4 h-4" /></button>
              <button onClick={cal.goToday} className="px-3 py-1.5 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-600 hover:bg-slate-50">Hoje</button>
              <button onClick={cal.goNext} className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600"><ChevronRight className="w-4 h-4" /></button>
              <h2 className="text-base font-black text-slate-800 capitalize ml-2">{viewLabel}</h2>
            </div>
            <div className="flex gap-1 bg-slate-100 rounded-xl p-0.5">
              {(['month', 'week', 'day', 'agenda'] as CalendarView[]).map(v => (
                <button key={v} onClick={() => cal.setView(v)}
                  className={`px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all capitalize ${
                    cal.view === v ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                  }`}>
                  {v === 'month' ? 'Mês' : v === 'week' ? 'Semana' : v === 'day' ? 'Dia' : 'Agenda'}
                </button>
              ))}
            </div>
          </div>

          {/* Calendar View */}
          {cal.view === 'month' && renderMonthView()}
          {cal.view === 'week' && renderWeekView()}
          {cal.view === 'day' && renderDayView()}
          {cal.view === 'agenda' && renderAgendaView()}
        </>
      )}

      {modalForm}
      {modalViewEvent}
    </div>
  )
}
