'use client'

import React, { useState, useMemo } from 'react'
import { useCrm, Activity } from '../context/CrmContext'
import { 
  Phone, Users, Mail, MessageSquare, MapPin, FileText, 
  Award, Shield, Calendar, Send, Plus, Filter, Search, User
} from 'lucide-react'

// Helper to get icons and styles for each activity type
const getActivityTypeStyle = (type: Activity['type']) => {
  switch (type) {
    case 'call':
      return {
        icon: <Phone className="w-4 h-4" />,
        bg: 'bg-blue-500 text-white',
        label: 'Ligação'
      }
    case 'meeting':
      return {
        icon: <Users className="w-4 h-4" />,
        bg: 'bg-violet-500 text-white',
        label: 'Reunião'
      }
    case 'whatsapp':
      return {
        icon: <MessageSquare className="w-4 h-4 text-emerald-600" />,
        bg: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
        label: 'WhatsApp'
      }
    case 'email':
      return {
        icon: <Mail className="w-4 h-4" />,
        bg: 'bg-indigo-500 text-white',
        label: 'E-mail'
      }
    case 'visit':
      return {
        icon: <MapPin className="w-4 h-4" />,
        bg: 'bg-orange-500 text-white',
        label: 'Visita'
      }
    case 'proposal':
      return {
        icon: <FileText className="w-4 h-4" />,
        bg: 'bg-brand-teal text-white',
        label: 'Proposta'
      }
    case 'contract':
      return {
        icon: <Award className="w-4 h-4" />,
        bg: 'bg-emerald-600 text-white',
        label: 'Contrato'
      }
    default:
      return {
        icon: <MessageSquare className="w-4 h-4" />,
        bg: 'bg-slate-500 text-white',
        label: 'Comentário'
      }
  }
}

export const CrmTimeline: React.FC = () => {
  const { activities, companies, deals, currentRole, addActivity } = useCrm()

  // 1. Filter States
  const [filterType, setFilterType] = useState<string>('all')
  const [filterCompany, setFilterCompany] = useState<string>('all')

  // 2. Logging Form State
  const [form, setForm] = useState({
    companyId: '',
    dealId: '',
    type: 'call' as Activity['type'],
    title: '',
    description: ''
  })

  // 3. Computed Names mapping
  const companyNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    companies.forEach(c => {
      map[c.id] = c.tradeName || c.name
    })
    return map
  }, [companies])

  const dealsForSelectedCompany = useMemo(() => {
    if (!form.companyId) return []
    return deals.filter(d => d.companyId === form.companyId)
  }, [form.companyId, deals])

  // Filtered Activities list
  const filteredActivities = useMemo(() => {
    return activities.filter(act => {
      const matchesType = filterType === 'all' || act.type === filterType
      const matchesCompany = filterCompany === 'all' || act.companyId === filterCompany
      return matchesType && matchesCompany
    })
  }, [activities, filterType, filterCompany])

  // 4. Form Submit
  const handleLogActivity = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.companyId || !form.title || !form.description) {
      alert('Selecione a empresa e preencha o título e a descrição.')
      return
    }

    addActivity({
      companyId: form.companyId,
      dealId: form.dealId ? form.dealId : undefined,
      type: form.type,
      title: form.title,
      description: form.description,
      author: getRoleUserName(currentRole)
    })

    // Reset Form
    setForm({
      companyId: '',
      dealId: '',
      type: 'call',
      title: '',
      description: ''
    })
  }

  function getRoleUserName(role: string): string {
    switch (role) {
      case 'admin': return 'Administrador'
      case 'commercial': return 'Ana Beatriz (Comercial)'
      case 'consultant': return 'Carlos Eduardo (Consultor)'
      case 'finance': return 'Financeiro'
      default: return 'Usuário'
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-fade-in">
      
      {/* LEFT COLUMN: Log Activity Form (4 cols) */}
      <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-y-auto">
        <h4 className="text-slate-800 font-black text-sm mb-4 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-teal" />
          Registrar Interação / Atividade
        </h4>
        
        <form onSubmit={handleLogActivity} className="space-y-4 text-xs flex-1 flex flex-col justify-between">
          
          <div className="space-y-4">
            {/* Company Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Empresa Interagida *</label>
              <select
                required
                value={form.companyId}
                onChange={e => setForm({ ...form, companyId: e.target.value, dealId: '' })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
              >
                <option value="">Selecione a empresa...</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                ))}
              </select>
            </div>

            {/* Optional Deal Association */}
            {form.companyId && dealsForSelectedCompany.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Negócio Relacionado (Opcional)</label>
                <select
                  value={form.dealId}
                  onChange={e => setForm({ ...form, dealId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                >
                  <option value="">Sem negócio específico</option>
                  {dealsForSelectedCompany.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
            )}

            {/* Activity Type Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Canal / Meio *</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: 'call', label: 'Ligação', icon: <Phone className="w-3.5 h-3.5" /> },
                  { value: 'meeting', label: 'Reunião', icon: <Users className="w-3.5 h-3.5" /> },
                  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="w-3.5 h-3.5" /> },
                  { value: 'email', label: 'E-mail', icon: <Mail className="w-3.5 h-3.5" /> },
                  { value: 'visit', label: 'Visita', icon: <MapPin className="w-3.5 h-3.5" /> },
                  { value: 'comment', label: 'Nota Interna', icon: <MessageSquare className="w-3.5 h-3.5" /> }
                ].map(item => {
                  const isSelected = form.type === item.value
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setForm({ ...form, type: item.value as Activity['type'] })}
                      className={`p-2.5 rounded-xl border flex items-center justify-center gap-1.5 font-bold transition-all ${
                        isSelected 
                          ? 'bg-brand-teal text-white border-brand-teal shadow-md shadow-brand-teal/15 scale-[1.02]' 
                          : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título da Atividade *</label>
              <input
                type="text"
                required
                placeholder="Ex: Reunião técnica ou Follow-up do PGR"
                value={form.title}
                onChange={e => setForm({ ...form, title: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Descrição / Detalhes *</label>
              <textarea
                required
                placeholder="Insira notas detalhadas sobre a conversa, próximos passos combinados, etc."
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                rows={5}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full mt-6 bg-brand-teal hover:bg-brand-teal/95 text-white font-bold py-3 px-6 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-teal/15"
          >
            <Send className="w-4 h-4" />
            Registrar Interação
          </button>

        </form>
      </div>

      {/* RIGHT COLUMN: Chronological Timeline Feed (8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* Timeline Header Filters */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
          <h4 className="text-slate-800 font-black text-sm flex items-center gap-2">
            <Calendar className="w-5 h-5 text-brand-blue" />
            Linha do Tempo Comercial
          </h4>

          {/* Filters */}
          <div className="flex items-center gap-3">
            {/* Filter by Company */}
            <div className="relative">
              <select
                value={filterCompany}
                onChange={e => setFilterCompany(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-full pl-4 pr-8 py-1.5 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
              >
                <option value="all">Todas as Empresas</option>
                {companies.map(c => (
                  <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Filter by Type */}
            <div className="relative">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-full pl-4 pr-8 py-1.5 text-[11px] font-bold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
              >
                <option value="all">Todos os Canais</option>
                <option value="call">Ligações</option>
                <option value="meeting">Reuniões</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="email">E-mails</option>
                <option value="visit">Visitas</option>
                <option value="proposal">Propostas</option>
                <option value="contract">Contratos</option>
                <option value="comment">Notas Internas</option>
              </select>
              <Filter className="w-3 h-3 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Timeline Flow Container */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {filteredActivities.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center text-xs">
              <Calendar className="w-12 h-12 text-slate-200 mb-2" />
              Nenhuma atividade registrada com estes filtros.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-8 py-2">
              {filteredActivities.map(act => {
                const style = getActivityTypeStyle(act.type)
                
                return (
                  <div key={act.id} className="relative group">
                    {/* Floating Icon Marker */}
                    <div className={`absolute -left-12 top-1 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${style.bg}`}>
                      {style.icon}
                    </div>

                    {/* Timeline Item Details Card */}
                    <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-4 rounded-2xl transition-all shadow-sm">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100/50 pb-2 mb-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-bold text-slate-400 uppercase bg-slate-200/50 border border-slate-200 px-2 py-0.5 rounded">
                            {style.label}
                          </span>
                          <span className="text-xs font-black text-slate-700">{act.title}</span>
                        </div>

                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {new Date(act.date).toLocaleDateString('pt-BR')} às {new Date(act.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      {/* Description Text */}
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">{act.description}</p>

                      {/* Card Footer tags */}
                      <div className="mt-4 flex items-center justify-between text-[9px] border-t border-slate-100/50 pt-2 text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-500">Empresa:</span>
                          <span className="bg-brand-blue/5 text-brand-blue px-2 py-0.5 rounded-full font-bold">
                            {companyNameMap[act.companyId] || 'Geral'}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <User className="w-3 h-3 text-slate-400" />
                          <span className="font-bold text-slate-500">{act.author}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
