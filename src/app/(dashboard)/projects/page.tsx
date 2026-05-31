'use client'

import { useState, useRef, useCallback } from 'react'
import { useTrainings } from '@/app/(dashboard)/trainings/context/TrainingsContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { Briefcase, Plus, Calendar, Users, DollarSign, CheckCircle, Clock, ChevronRight, X, Building2 } from 'lucide-react'

interface Project {
  id: string
  name: string
  companyId: string
  companyName: string
  description: string
  startDate: string
  endDate: string
  status: 'em_andamento' | 'planejado' | 'concluido' | 'pausado'
  budget: number
}

const STATUS_COLORS: Record<string, string> = {
  em_andamento: 'bg-blue-50 text-blue-700 border-blue-100',
  planejado: 'bg-slate-100 text-slate-700 border-slate-200',
  concluido: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pausado: 'bg-amber-50 text-amber-700 border-amber-100',
}

const STATUS_LABELS: Record<string, string> = {
  em_andamento: 'Em Andamento',
  planejado: 'Planejado',
  concluido: 'Concluído',
  pausado: 'Pausado',
}

const SEED_PROJECTS: Project[] = [
  {
    id: 'proj-1',
    name: 'PGR e Clima Organizacional',
    companyId: 'comp-2',
    companyName: 'Vale S.A.',
    description: 'Programa de Gerenciamento de Riscos e Pesquisa de Clima com foco em saúde mental e segurança psicológica.',
    startDate: '2026-03-01',
    endDate: '2026-09-30',
    status: 'em_andamento',
    budget: 120000,
  },
  {
    id: 'proj-2',
    name: 'Programa DHO Anual BR Distribuidora',
    companyId: 'comp-1',
    companyName: 'BR Distribuidora',
    description: 'Contrato anual de Desenvolvimento Humano e Organizacional: palestras, treinamentos e mentoria de líderes.',
    startDate: '2026-01-01',
    endDate: '2026-12-31',
    status: 'em_andamento',
    budget: 85000,
  },
  {
    id: 'proj-3',
    name: 'Workshop de Alta Performance Itaú',
    companyId: 'comp-3',
    companyName: 'Banco Itaú',
    description: 'Série de workshops de segurança psicológica e alta performance para times de tecnologia.',
    startDate: '2026-05-01',
    endDate: '2026-07-31',
    status: 'concluido',
    budget: 45000,
  },
]

export default function ProjectsPage() {
  const { events } = useTrainings()
  const { companies } = useCrm()

  const stored = typeof window !== 'undefined'
    ? (() => { try { const s = localStorage.getItem('erp_projects'); return s ? JSON.parse(s) : SEED_PROJECTS } catch { return SEED_PROJECTS } })()
    : SEED_PROJECTS

  const [projects, setProjects] = useState<Project[]>(stored)
  const [selected, setSelected] = useState<Project | null>(projects[0] || null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', companyId: '', description: '', startDate: '', endDate: '', status: 'planejado' as const, budget: 0 })

  const saveProjects = (list: Project[]) => {
    setProjects(list)
    if (typeof window !== 'undefined') localStorage.setItem('erp_projects', JSON.stringify(list))
  }

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault()
    const comp = companies.find(c => c.id === form.companyId)
    const np: Project = {
      ...form,
      id: `proj-${Date.now()}`,
      companyName: comp?.name || form.companyId,
    }
    const updated = [np, ...projects]
    saveProjects(updated)
    setSelected(np)
    setShowForm(false)
    setForm({ name: '', companyId: '', description: '', startDate: '', endDate: '', status: 'planejado', budget: 0 })
  }

  const projectEvents = selected ? events.filter(e => e.projectId === selected.id || e.companyId === selected.companyId) : []
  const totalEventRevenue = projectEvents.reduce((acc, e) => acc + e.cost, 0)
  const completedEvents = projectEvents.filter(e => e.status === 'realizado' || e.status === 'concluido').length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Gestão de Projetos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Projetos e contratos corporativos vinculados a clientes ativos</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-100 hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> Novo Projeto
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total de Projetos', value: projects.length, icon: Briefcase, color: 'violet' },
          { label: 'Em Andamento', value: projects.filter(p => p.status === 'em_andamento').length, icon: Clock, color: 'blue' },
          { label: 'Concluídos', value: projects.filter(p => p.status === 'concluido').length, icon: CheckCircle, color: 'emerald' },
          { label: 'Receita Total', value: `R$ ${projects.reduce((acc, p) => acc + p.budget, 0).toLocaleString('pt-BR')}`, icon: DollarSign, color: 'amber' },
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

      {/* Main two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left: Project list */}
        <div className="lg:col-span-1 space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">Projetos Cadastrados</span>
          {projects.map(p => (
            <div
              key={p.id}
              onClick={() => setSelected(p)}
              className={`p-4 bg-white rounded-xl border cursor-pointer transition-all hover:border-violet-200 hover:shadow-sm ${selected?.id === p.id ? 'border-violet-400 ring-2 ring-violet-50' : 'border-slate-100'}`}
            >
              <div className="flex justify-between items-start gap-2">
                <h3 className="font-bold text-slate-800 text-xs leading-tight flex-1">{p.name}</h3>
                <span className={`px-1.5 py-0.5 text-[9px] font-bold uppercase rounded border whitespace-nowrap ${STATUS_COLORS[p.status]}`}>
                  {STATUS_LABELS[p.status]}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 mt-1.5 flex items-center gap-1">
                <Building2 className="w-3 h-3" /> {p.companyName}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-[10px] text-violet-600 font-semibold">
                  R$ {p.budget.toLocaleString('pt-BR')}
                </p>
                <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
              </div>
            </div>
          ))}
        </div>

        {/* Right: Project detail */}
        <div className="lg:col-span-2">
          {selected ? (
            <div className="space-y-5">
              {/* Hero card */}
              <div className="bg-gradient-to-br from-slate-900 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-800/30 to-transparent" />
                <div className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <span className={`px-2.5 py-1 text-[9px] font-bold uppercase rounded-full border ${STATUS_COLORS[selected.status]}`}>
                        {STATUS_LABELS[selected.status]}
                      </span>
                      <h2 className="text-xl font-black leading-tight">{selected.name}</h2>
                      <p className="text-slate-400 text-xs">🏢 {selected.companyName}</p>
                      <p className="text-slate-300 text-xs leading-relaxed">{selected.description}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Início</p>
                      <p className="text-sm font-bold mt-0.5">{new Date(selected.startDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Encerramento</p>
                      <p className="text-sm font-bold mt-0.5">{new Date(selected.endDate).toLocaleDateString('pt-BR')}</p>
                    </div>
                    <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                      <p className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Orçamento</p>
                      <p className="text-sm font-bold mt-0.5">R$ {selected.budget.toLocaleString('pt-BR')}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Treinamentos vinculados */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-violet-500" />
                    Treinamentos & Eventos Vinculados
                  </h3>
                  <div className="flex gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-emerald-500" /> {completedEvents} concluídos</span>
                    <span className="flex items-center gap-1"><DollarSign className="w-3 h-3 text-amber-500" /> R$ {totalEventRevenue.toLocaleString('pt-BR')}</span>
                  </div>
                </div>

                <div className="space-y-2">
                  {projectEvents.length === 0 ? (
                    <div className="py-8 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                      <Calendar className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                      <p className="text-xs">Nenhum treinamento vinculado a este projeto/cliente.</p>
                      <p className="text-[10px] text-slate-300 mt-1">Crie um evento em Treinamentos {">"} Eventos e vincule-o.</p>
                    </div>
                  ) : projectEvents.map(evt => (
                    <div key={evt.id} className="flex items-center justify-between p-4 bg-slate-50/50 border border-slate-100 rounded-xl">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded uppercase">{evt.type}</span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded capitalize ${
                            evt.status === 'realizado' || evt.status === 'concluido' ? 'text-emerald-700 bg-emerald-50' :
                            evt.status === 'agendado' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100'
                          }`}>{evt.status}</span>
                        </div>
                        <p className="font-bold text-slate-800 text-xs mt-1.5">{evt.name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {new Date(evt.eventDate).toLocaleDateString('pt-BR')} · {evt.facilitator} · {evt.modality}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-700">R$ {evt.cost.toLocaleString('pt-BR')}</p>
                        <p className="text-[10px] text-slate-400">{evt.hoursDuration}h</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center text-slate-400 shadow-sm">
              <Briefcase className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-medium text-sm">Selecione ou crie um projeto</p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE FORM MODAL */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Novo Projeto</h2>
                <p className="text-sm text-slate-500">Vincule a um cliente ativo da carteira</p>
              </div>
              <button onClick={() => setShowForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Cliente *</label>
                <select required value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="">Selecione o Cliente...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Projeto *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: PGR 2026 — Vale Mariana" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Descreva o escopo do projeto..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Início *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Encerramento *</label>
                  <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="planejado">Planejado</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Orçamento (R$)</label>
                  <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                    placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
