'use client'

import { useState } from 'react'
import { useTrainings } from './context/TrainingsContext'
import { useTrainingRealtime } from '@/hooks/useTrainingRealtime'
import { useAdmin } from '@/app/(dashboard)/admin/context/AdminContext'
import Link from 'next/link'
import {
  Calendar, Users, Award, Compass, TrendingUp, Plus, Search, Clock,
  ChevronRight, Sparkles, Star, Lock, LayoutDashboard, GraduationCap, Megaphone, Hammer
} from 'lucide-react'
import TypeWorkspace from './components/TypeWorkspace'

const NoAccess = () => (
  <span className="flex items-center gap-1 text-slate-300 font-bold"><Lock className="w-3 h-3" />---</span>
)

const TABS = [
  { key: 'indicadores', label: 'Indicadores', icon: LayoutDashboard },
  { key: 'treinamentos', label: 'Treinamentos', icon: GraduationCap },
  { key: 'palestras', label: 'Palestras', icon: Megaphone },
  { key: 'workshop', label: 'Workshop', icon: Hammer },
] as const

type TabKey = typeof TABS[number]['key']

const ACCENTS: Record<string, { accent: string; accentBg: string; accentText: string }> = {
  'Treinamento': { accent: '#7c3aed', accentBg: 'bg-violet-50', accentText: 'text-violet-600' },
  'Palestra': { accent: '#0ea5e9', accentBg: 'bg-sky-50', accentText: 'text-sky-600' },
  'Workshop': { accent: '#f59e0b', accentBg: 'bg-amber-50', accentText: 'text-amber-600' },
}

export default function TrainingsDashboardPage() {
  useTrainingRealtime()
  const hasFinancialAccess = useAdmin().checkPermission('financial', 'view')
  const {
    events,
    sipatPrograms,
    scheduledEvents,
    completedEvents,
    completedLectures,
    activeSipats,
    totalRegisteredParticipants,
    attendanceRate,
    certificatesIssued,
    averageNps,
    totalRevenue
  } = useTrainings()

  const [tab, setTab] = useState<TabKey>('indicadores')
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('Todos')
  const [filterStatus, setFilterStatus] = useState('Todos')

  const filteredEvents = events.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(search.toLowerCase()) ||
                          (e.companyName || '').toLowerCase().includes(search.toLowerCase()) ||
                          e.facilitator.toLowerCase().includes(search.toLowerCase())
    const matchesType = filterType === 'Todos' || e.type === filterType
    const matchesStatus = filterStatus === 'Todos' || e.status === filterStatus
    return matchesSearch && matchesType && matchesStatus
  })

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Premium Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-bold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" /> Módulo Corporativo
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mt-1">Treinamentos, Palestras e Workshop</h1>
          <p className="text-slate-500 text-sm mt-0.5">Capacitações para empresas e pessoas • catálogo de tipos • timeline por evento • agenda sincronizada</p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link href="/trainings/sipat" className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-sm font-bold transition-all">
            <Compass className="w-4 h-4" /> Gestão de SIPAT
          </Link>
          <Link href="/trainings/events" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-100 hover:opacity-90 hover:-translate-y-0.5 transition-all">
            <Plus className="w-4 h-4" /> Gestão Completa
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap ${
              tab === t.key ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-md shadow-violet-100' : 'text-slate-500 hover:bg-slate-100'
            }`}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {tab === 'indicadores' && (
        <>
          {/* KPI Matrix */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <Link href="/trainings/events" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow hover:border-violet-200">
              <div className="p-3.5 bg-violet-50 text-violet-600 rounded-xl"><Calendar className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eventos</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-slate-800">{scheduledEvents}</span>
                  <span className="text-xs text-slate-400 font-medium">agendados</span>
                </div>
                <p className="text-[10px] text-emerald-500 font-bold mt-1">✓ {completedEvents} realizados</p>
              </div>
            </Link>

            <Link href="/trainings/sipat" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow hover:border-violet-200">
              <div className="p-3.5 bg-blue-50 text-blue-600 rounded-xl"><Compass className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Palestras & SIPAT</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-slate-800">{completedLectures}</span>
                  <span className="text-xs text-slate-400 font-medium">palestras</span>
                </div>
                <p className="text-[10px] text-amber-500 font-bold mt-1">⚡ {activeSipats} SIPAT em andamento</p>
              </div>
            </Link>

            <Link href="/trainings/attendance" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow hover:border-violet-200">
              <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl"><Users className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Participantes</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-slate-800">{totalRegisteredParticipants}</span>
                  <span className="text-xs text-slate-400 font-medium">inscritos</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-bold mt-1">📈 {attendanceRate}% presença média</p>
              </div>
            </Link>

            <Link href="/trainings/certificates" className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow hover:border-violet-200">
              <div className="p-3.5 bg-purple-50 text-purple-600 rounded-xl"><Award className="w-5 h-5" /></div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Qualidade & Certificados</p>
                <div className="flex items-baseline gap-1.5 mt-0.5">
                  <span className="text-2xl font-black text-slate-800">{averageNps}</span>
                  <span className="text-xs text-slate-400 font-medium">NPS</span>
                </div>
                <p className="text-[10px] text-purple-600 font-bold mt-1">📜 {certificatesIssued} certificados emitidos</p>
              </div>
            </Link>
          </div>

          {/* Financial banner */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-lg flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center md:text-left">
              <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded uppercase tracking-wider">Receita Acumulada</span>
              <h2 className="text-3xl font-black mt-1">{hasFinancialAccess ? `R$ ${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : <NoAccess />}</h2>
              <p className="text-slate-400 text-xs font-normal">Soma dos valores contratados por eventos ativos e concluídos</p>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link href="/trainings/certificates" className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-all">
                <Award className="w-4 h-4" /> Certificados
              </Link>
              <Link href="/trainings/feedbacks" className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white border border-white/10 rounded-xl text-xs font-bold transition-all">
                <Star className="w-4 h-4" /> NPS & Avaliações
              </Link>
              <Link href="/trainings/ai" className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 hover:opacity-90 text-white rounded-xl text-xs font-bold transition-all">
                <Sparkles className="w-4 h-4" /> Assistente de IA
              </Link>
            </div>
          </div>

          {/* Cronograma geral */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h3 className="font-bold text-slate-800 text-base">Cronograma Geral de Eventos</h3>
                <div className="flex gap-2">
                  <select value={filterType} onChange={e => setFilterType(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-600 focus:outline-none">
                    <option value="Todos">Todos os Tipos</option>
                    <option value="Palestra">Palestra</option>
                    <option value="Treinamento">Treinamento</option>
                    <option value="Workshop">Workshop</option>
                    <option value="SIPAT">SIPAT</option>
                    <option value="Capacitação">Capacitação</option>
                  </select>
                  <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs bg-slate-50 text-slate-600 focus:outline-none">
                    <option value="Todos">Todos os Status</option>
                    <option value="planejado">Planejado</option>
                    <option value="agendado">Agendado</option>
                    <option value="realizado">Realizado</option>
                    <option value="cancelado">Cancelado</option>
                    <option value="concluido">Concluido</option>
                  </select>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar evento por nome, cliente ou facilitador..." className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-violet-300 bg-slate-50/50" />
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                      <th className="py-3 px-1">Evento</th>
                      <th className="py-3 px-1">Cliente / Público</th>
                      <th className="py-3 px-1">Data / Hora</th>
                      <th className="py-3 px-1">Facilitador</th>
                      <th className="py-3 px-1">Status</th>
                      <th className="py-3 px-1 text-right">Ação</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {filteredEvents.length === 0 ? (
                      <tr><td colSpan={6} className="py-8 text-center text-slate-400">Nenhum evento encontrado para os filtros selecionados.</td></tr>
                    ) : filteredEvents.map(ev => (
                      <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-1 font-bold text-slate-800">
                          <div className="space-y-0.5">
                            <p>{ev.name}</p>
                            <span className="text-[9px] font-bold px-1.5 py-0.5 bg-violet-50 text-violet-700 border border-violet-100 rounded">{ev.type}</span>
                          </div>
                        </td>
                        <td className="py-3.5 px-1 text-slate-600">{ev.companyName || (ev.targetType === 'pessoa' ? `${ev.expectedParticipants || 0} pessoas` : '—')}</td>
                        <td className="py-3.5 px-1 text-slate-500">
                          <div className="space-y-0.5">
                            <p>{new Date(ev.eventDate).toLocaleDateString('pt-BR')}</p>
                            <p className="text-[10px] text-slate-400">{ev.startTime} - {ev.endTime} ({ev.hoursDuration}h)</p>
                          </div>
                        </td>
                        <td className="py-3.5 px-1 text-slate-600">{ev.facilitator}</td>
                        <td className="py-3.5 px-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                            ev.status === 'realizado' || ev.status === 'concluido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                            : ev.status === 'agendado' ? 'bg-blue-50 text-blue-700 border border-blue-100'
                            : ev.status === 'cancelado' ? 'bg-red-50 text-red-700 border border-red-100'
                            : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-1 text-right">
                          <Link href="/trainings/events" className="p-1.5 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-lg inline-block"><ChevronRight className="w-4 h-4" /></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* SIPAT overview */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Atividade e Presença Digital</h3>
                <p className="text-slate-400 text-xs mt-0.5">Lista de presença rápida e geração de QR Codes</p>
              </div>
              <div className="space-y-4">
                <Link href="/trainings/attendance" className="w-full flex items-center justify-between p-3.5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl"><Users className="w-4 h-4" /></div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700">Lista de Presença Digital</p>
                      <p className="text-[10px] text-slate-400">Assinaturas e confirmações rápidas</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/trainings/certificates" className="w-full flex items-center justify-between p-3.5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><Award className="w-4 h-4" /></div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700">Central de Certificados</p>
                      <p className="text-[10px] text-slate-400">Emitir em lote e PDF individual</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                <Link href="/trainings/sipat" className="w-full flex items-center justify-between p-3.5 border border-slate-100 bg-slate-50/50 hover:bg-slate-50 rounded-2xl transition-all group">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl"><Compass className="w-4 h-4" /></div>
                    <div className="text-left">
                      <p className="text-xs font-bold text-slate-700">Mural de SIPATs Ativas</p>
                      <p className="text-[10px] text-slate-400">Semana SIPAT e cronogramas diários</p>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">SIPATs Agendadas</span>
                {sipatPrograms.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Nenhuma SIPAT programada.</p>
                ) : sipatPrograms.map(s => (
                  <div key={s.id} className="p-3 bg-violet-50/30 border border-violet-50 rounded-xl space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-800 truncate block max-w-[150px]">{s.title}</span>
                      <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded font-bold uppercase">{s.status}</span>
                    </div>
                    <p className="text-[10px] text-slate-500">Cliente: {s.companyName}</p>
                    <p className="text-[10px] text-violet-600 font-semibold mt-1">📅 {new Date(s.startDate).toLocaleDateString('pt-BR')} a {new Date(s.endDate).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {tab === 'treinamentos' && <TypeWorkspace category="Treinamento" {...ACCENTS['Treinamento']} />}
      {tab === 'palestras' && <TypeWorkspace category="Palestra" {...ACCENTS['Palestra']} />}
      {tab === 'workshop' && <TypeWorkspace category="Workshop" {...ACCENTS['Workshop']} />}

      {/* Barra de acesso rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { href: '/trainings/events', label: 'Gestão Completa', icon: Calendar },
          { href: '/trainings/attendance', label: 'Presença', icon: Users },
          { href: '/trainings/certificates', label: 'Certificados', icon: Award },
          { href: '/trainings/feedbacks', label: 'NPS', icon: Star },
        ].map(l => (
          <Link key={l.href} href={l.href} className="flex items-center gap-2.5 p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md hover:border-violet-200 transition-all">
            <div className="p-2.5 bg-violet-50 text-violet-600 rounded-xl"><l.icon className="w-4 h-4" /></div>
            <span className="text-xs font-bold text-slate-700">{l.label}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}