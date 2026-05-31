'use client'

import { useState, useMemo } from 'react'
import { usePortal, PortalTab, RequestType, RequestPriority } from '../context/PortalContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useFinancial } from '@/app/(dashboard)/financial/context/FinancialContext'
import { useDocuments } from '@/app/(dashboard)/documents/context/DocumentContext'
import { useRouter } from 'next/navigation'
import {
  LayoutDashboard, FolderKanban, ClipboardCheck, GraduationCap, FileText,
  Calendar, DollarSign, MessageSquare, Bell, LogOut,
  Plus, Search, X, Building2, Clock, AlertTriangle,
  Loader2, User, Menu, TrendingUp, Download, MapPin, ExternalLink,
  Briefcase, Award, Users, Target, Send, CheckSquare, AlertCircle
} from 'lucide-react'

type NavItem = { id: PortalTab; label: string; icon: React.ElementType }

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'projects', label: 'Projetos', icon: FolderKanban },
  { id: 'nr01', label: 'NR01', icon: ClipboardCheck },
  { id: 'trainings', label: 'Treinamentos', icon: GraduationCap },
  { id: 'documents', label: 'Documentos', icon: FileText },
  { id: 'agenda', label: 'Agenda', icon: Calendar },
  { id: 'financial', label: 'Financeiro', icon: DollarSign },
  { id: 'requests', label: 'Solicitações', icon: MessageSquare },
]

const REQUEST_TYPE_CONFIG: Record<RequestType, { label: string; icon: string }> = {
  meeting: { label: 'Nova Reunião', icon: '📅' },
  training: { label: 'Novo Treinamento', icon: '📚' },
  doubt: { label: 'Dúvida', icon: '❓' },
  document: { label: 'Envio de Documento', icon: '📎' },
  support: { label: 'Suporte', icon: '🔧' },
  action_plan_adjust: { label: 'Ajuste Plano de Ação', icon: '📝' },
}

function fmt(v: number) { return `R$ ${v.toLocaleString('pt-BR')}` }
function sd(d: string) { return new Date(d + 'T12:00:00').toLocaleDateString('pt-BR') }

export default function PortalDashboard() {
  const portal = usePortal()
  const crm = useCrm()
  const fin = useFinancial()
  const docCtx = useDocuments()
  const router = useRouter()

  const [tab, setTab] = useState<PortalTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showRequestForm, setShowRequestForm] = useState(false)
  const [searchDocs, setSearchDocs] = useState('')
  const [reqForm, setReqForm] = useState({ type: 'meeting' as RequestType, subject: '', description: '', priority: 'medium' as RequestPriority })

  const companyContracts = crm.contracts.filter(c => c.companyId === portal.companyId)
  const companyRecs = fin.receivables.filter(r => r.companyId === portal.companyId)

  const filteredDocs = useMemo(() => {
    let list = portal.companyDocuments
    if (searchDocs) { const q = searchDocs.toLowerCase(); list = list.filter(d => (d.name || '').toLowerCase().includes(q) || (d.description || '').toLowerCase().includes(q)) }
    return list
  }, [portal.companyDocuments, searchDocs])

  const handleLogout = () => { portal.logout(); router.push('/portal') }

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault()
    portal.addRequest({
      companyId: portal.companyId || '', userId: portal.user?.id,
      userName: portal.user?.name,
      type: reqForm.type, subject: reqForm.subject,
      description: reqForm.description, priority: reqForm.priority,
      status: 'open',
    })
    setShowRequestForm(false)
    setReqForm({ type: 'meeting', subject: '', description: '', priority: 'medium' })
  }

  const sidebar = (
    <div className="w-64 bg-white border-r border-slate-100 h-full flex flex-col">
      <div className="p-5 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center shadow-md"><Building2 className="w-5 h-5 text-white" /></div>
          <div className="min-w-0"><p className="text-sm font-black text-slate-800 truncate">Portal do Cliente</p><p className="text-[9px] text-slate-400 truncate">{portal.companyName}</p></div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <button key={item.id} onClick={() => { setTab(item.id); setSidebarOpen(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${tab === item.id ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm' : 'text-slate-600 hover:bg-slate-100'}`}>
            <item.icon className="w-4 h-4" /><span className="flex-1 text-left">{item.label}</span>
          </button>
        ))}
      </div>
      <div className="p-3 border-t border-slate-100">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[9px] font-bold text-white">{portal.user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
          <div className="min-w-0 flex-1"><p className="text-[11px] font-bold text-slate-800 truncate">{portal.user?.name}</p><p className="text-[8px] text-slate-400 capitalize">{portal.user?.role === 'rh' ? 'RH' : portal.user?.role === 'diretoria' ? 'Diretoria' : portal.user?.role === 'lider' ? 'Líder' : 'Financeiro'}</p></div>
        </div>
        <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"><LogOut className="w-3.5 h-3.5" /> Sair</button>
      </div>
    </div>
  )

  // ========== RENDER FUNCTIONS ==========

  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-violet-600 to-purple-700 rounded-3xl p-6 text-white shadow-xl">
        <h2 className="text-xl font-black">Olá, {portal.user?.name?.split(' ')[0]}! 👋</h2>
        <p className="text-sm text-violet-200 mt-1">Bem-vindo ao Portal do Cliente CrepaldiDH</p>
        <div className="flex gap-4 mt-4">
          <div className="bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm"><p className="text-[9px] text-violet-200 uppercase">Empresa</p><p className="text-sm font-bold">{portal.companyName}</p></div>
          <div className="bg-white/10 rounded-xl px-4 py-2 backdrop-blur-sm"><p className="text-[9px] text-violet-200 uppercase">Perfil</p><p className="text-sm font-bold capitalize">{portal.user?.role === 'rh' ? 'RH' : portal.user?.role === 'diretoria' ? 'Diretoria' : portal.user?.role === 'lider' ? 'Líder' : 'Financeiro'}</p></div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {portal.indicators.map(ind => (
          <div key={ind.label} className={`rounded-2xl bg-gradient-to-br ${ind.color} p-[1px] shadow-lg`}>
            <div className="bg-white rounded-[calc(1rem-1px)] p-3 h-full">
              <div className="flex items-center justify-between mb-1"><span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider">{ind.label}</span><span className="text-sm">{ind.icon}</span></div>
              <p className="text-xs font-black text-slate-800">{ind.value}</p>
            </div>
          </div>
        ))}
      </div>

      {portal.companyNotifications.filter(n => !n.read).length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><Bell className="w-4 h-4 text-amber-500" /> Notificações</h3>
          <div className="space-y-2">
            {portal.companyNotifications.filter(n => !n.read).slice(0, 4).map(n => {
              const notifTab = n.link?.includes('nr01') ? 'nr01' : n.link?.includes('financial') ? 'financial' : null
              return (
                <div key={n.id} onClick={() => { portal.markNotificationRead(n.id); if (notifTab) setTab(notifTab as PortalTab) }}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-all hover:shadow-sm ${n.type === 'alert' ? 'border-red-100 bg-red-50' : n.type === 'warning' ? 'border-amber-100 bg-amber-50' : n.type === 'success' ? 'border-emerald-100 bg-emerald-50' : 'border-blue-100 bg-blue-50'}`}>
                  <div className={`p-1 rounded-lg ${n.type === 'alert' ? 'bg-red-100 text-red-600' : n.type === 'warning' ? 'bg-amber-100 text-amber-600' : n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}><Bell className="w-3.5 h-3.5" /></div>
                  <div className="flex-1 min-w-0"><p className="text-[11px] font-bold text-slate-800">{n.title}</p><p className="text-[9px] text-slate-500 mt-0.5">{n.description}</p></div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><Briefcase className="w-4 h-4 text-violet-500" /> Contratos Ativos</h3>
          {companyContracts.filter(c => c.status === 'active').length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Nenhum contrato ativo</p> :
            <div className="space-y-2">{companyContracts.filter(c => c.status === 'active').map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div><p className="text-[11px] font-bold text-slate-800">{c.title}</p><p className="text-[9px] text-slate-400">R$ {c.value.toLocaleString('pt-BR')}</p></div>
                <span className="px-2 py-0.5 text-[8px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">Ativo</span>
              </div>
            ))}</div>
          }
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-500" /> Financeiro Resumo</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-emerald-50 rounded-xl border border-emerald-100"><span className="text-xs font-medium text-slate-600">Recebido no mês</span><span className="text-sm font-black text-emerald-600">{fmt(companyRecs.filter(r => r.status === 'paid').reduce((a, r) => a + r.amount, 0))}</span></div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-xl border border-blue-100"><span className="text-xs font-medium text-slate-600">A Receber</span><span className="text-sm font-black text-blue-600">{fmt(companyRecs.filter(r => r.status === 'pending').reduce((a, r) => a + r.amount, 0))}</span></div>
            <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100"><span className="text-xs font-medium text-slate-600">Em Atraso</span><span className="text-sm font-black text-red-600">{fmt(portal.overdueAmount)}</span></div>
          </div>
        </div>
      </div>
    </div>
  )

  const renderProjects = () => (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 flex items-center gap-2"><FolderKanban className="w-4 h-4" /> {companyContracts.filter(c => c.status === 'active').length} projeto(s) ativo(s)</p>
      {companyContracts.filter(c => c.status === 'active').length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm"><FolderKanban className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-xs font-medium">Nenhum projeto ativo</p></div>
      ) : (
        <div className="grid gap-4">{companyContracts.filter(c => c.status === 'active').map(c => (
          <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div><h3 className="text-sm font-black text-slate-800">{c.title}</h3><p className="text-[10px] text-slate-400 mt-0.5">Contrato • Início {sd(c.startDate)}</p></div>
              <span className="px-2 py-1 text-[9px] font-bold bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100">Em andamento</span>
            </div>
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-[9px] text-slate-400">Valor</p><p className="text-xs font-black text-slate-800">{fmt(c.value)}</p></div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-[9px] text-slate-400">Término</p><p className="text-xs font-black text-slate-800">{sd(c.endDate)}</p></div>
              <div className="bg-slate-50 rounded-xl p-3 border border-slate-100"><p className="text-[9px] text-slate-400">Progresso</p><p className="text-xs font-black text-violet-600">65%</p></div>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2"><div className="bg-gradient-to-r from-violet-500 to-purple-500 h-2 rounded-full" style={{ width: '65%' }} /></div>
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-3 text-[10px] text-slate-500">
                <User className="w-3 h-3" /> {docCtx.getDocumentsByProject(c.id).length} documento(s)
              </div>
              <div className="flex gap-2">
                <button onClick={() => setTab('documents')} className="text-[9px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1">Documentos <ExternalLink className="w-3 h-3" /></button>
                <button onClick={() => setTab('financial')} className="text-[9px] font-bold text-violet-600 hover:text-violet-800 flex items-center gap-1">Financeiro <ExternalLink className="w-3 h-3" /></button>
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )

  const renderNr01 = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Diagnósticos', value: '2 ativos', icon: Search, color: 'from-blue-500 to-indigo-600' },
          { label: 'Unidades Avaliadas', value: '4', icon: Building2, color: 'from-violet-500 to-purple-600' },
          { label: 'Planos de Ação', value: '3 pendentes', icon: CheckSquare, color: 'from-amber-500 to-orange-600' },
          { label: 'Relatórios', value: '2 disponíveis', icon: FileText, color: 'from-emerald-500 to-teal-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-[1px] shadow-lg`}>
            <div className="bg-white rounded-[calc(1rem-1px)] p-4 h-full">
              <div className="flex items-center justify-between mb-1"><span className="text-[8px] font-bold text-slate-400 uppercase">{s.label}</span><s.icon className="w-3.5 h-3.5 text-slate-400" /></div>
              <p className="text-xs font-black text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-800 mb-4">Diagnósticos Ativos</h3>
        <div className="space-y-3">
          {[{ name: 'Diagnóstico Psicossocial', unit: 'Matriz', sector: 'Administrativo, Operacional', status: 'Em andamento', progress: 70 },
            { name: 'Inventário de Riscos', unit: 'Filial 1', sector: 'Produção', status: 'Relatório final', progress: 100 },
          ].map(d => (
            <div key={d.name} className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <div className="flex items-start justify-between mb-2">
                <div><p className="text-xs font-bold text-slate-800">{d.name}</p><p className="text-[10px] text-slate-400">{d.unit} • {d.sector}</p></div>
                <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${d.progress === 100 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{d.status}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-1.5"><div className="bg-gradient-to-r from-violet-500 to-purple-500 h-1.5 rounded-full" style={{ width: `${d.progress}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Matriz de Riscos</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Críticos', value: 2, color: 'bg-red-100 text-red-700 border-red-200' },
              { label: 'Altos', value: 5, color: 'bg-orange-100 text-orange-700 border-orange-200' },
              { label: 'Médios', value: 8, color: 'bg-amber-100 text-amber-700 border-amber-200' },
              { label: 'Baixos', value: 12, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
            ].map(r => (
              <div key={r.label} className={`rounded-xl border p-4 text-center ${r.color}`}><p className="text-2xl font-black">{r.value}</p><p className="text-[10px] font-bold">{r.label}</p></div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Planos de Ação</h3>
          {[
            { action: 'Implementar pausas ativas no setor operacional', sector: 'Produção', deadline: '15/06/2026', status: 'Em andamento' },
            { action: 'Treinamento de lideranças em segurança psicológica', sector: 'Administrativo', deadline: '30/06/2026', status: 'Pendente' },
            { action: 'Adequação ergonômica dos postos de trabalho', sector: 'Operacional', deadline: '10/06/2026', status: 'Atrasado' },
          ].map((a, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
              <div className="flex items-start gap-3">
                <div className={`p-1 rounded-lg mt-0.5 ${a.status === 'Atrasado' ? 'bg-red-100 text-red-600' : a.status === 'Em andamento' ? 'bg-blue-100 text-blue-600' : 'bg-amber-100 text-amber-600'}`}><AlertTriangle className="w-3 h-3" /></div>
                <div><p className="text-[11px] font-bold text-slate-800">{a.action}</p><p className="text-[9px] text-slate-400">{a.sector} • Prazo: {a.deadline}</p></div>
              </div>
              <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${a.status === 'Atrasado' ? 'bg-red-50 text-red-600 border-red-100' : a.status === 'Em andamento' ? 'bg-blue-50 text-blue-600 border-blue-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>{a.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderTrainings = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Próximos Eventos', value: portal.upcomingTrainings.length, icon: GraduationCap, color: 'from-blue-500 to-indigo-600' },
          { label: 'Certificados', value: '8 disponíveis', icon: Award, color: 'from-emerald-500 to-teal-600' },
          { label: 'Participações', value: '15', icon: Users, color: 'from-violet-500 to-purple-600' },
          { label: 'Média Avaliação', value: '4.8 ★', icon: Target, color: 'from-amber-500 to-orange-600' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.color} p-[1px] shadow-lg`}>
            <div className="bg-white rounded-[calc(1rem-1px)] p-4 h-full">
              <div className="flex items-center justify-between mb-1"><span className="text-[8px] font-bold text-slate-400 uppercase">{s.label}</span><s.icon className="w-3.5 h-3.5 text-slate-400" /></div>
              <p className="text-sm font-black text-slate-800">{s.value}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-800 mb-4">Próximos Eventos</h3>
        {portal.upcomingTrainings.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Nenhum evento agendado</p> : (
          <div className="space-y-3">{portal.upcomingTrainings.map((e: any) => (
            <div key={e.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl border border-slate-100">
              <div className="text-center min-w-[40px]"><p className="text-lg font-black text-violet-600">{new Date(e.eventDate + 'T12:00:00').getDate()}</p><p className="text-[9px] text-slate-400 uppercase">{new Date(e.eventDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</p></div>
              <div className="flex-1 min-w-0"><p className="text-xs font-bold text-slate-800">{e.title}</p><p className="text-[10px] text-slate-400">{e.startTime?.slice(0, 5)} - {e.endTime?.slice(0, 5)}</p></div>
              <span className="px-2 py-0.5 text-[8px] font-bold bg-blue-50 text-blue-700 rounded-full border border-blue-100">Agendado</span>
            </div>
          ))}</div>
        )}
      </div>
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-bold text-slate-800 mb-4">Histórico de Treinamentos</h3>
        {[
          { name: 'NR01 Básico', date: '15/05/2026', participants: 12, rating: 4.9 },
          { name: 'Segurança Psicológica', date: '08/05/2026', participants: 8, rating: 4.7 },
          { name: 'Oratória para Líderes', date: '22/04/2026', participants: 15, rating: 4.8 },
        ].map(t => (
          <div key={t.name} className="flex items-center justify-between py-3 border-b border-slate-50 last:border-0">
            <div><p className="text-[11px] font-bold text-slate-800">{t.name}</p><p className="text-[9px] text-slate-400">{t.date} • {t.participants} participantes</p></div>
            <div className="flex items-center gap-2"><span className="text-[10px] font-bold text-amber-600">★ {t.rating}</span><button onClick={() => { const blob = new Blob(['Certificado: ' + t.name], { type: 'text/plain' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'certificado_' + t.name.replace(/\s+/g, '_') + '.pdf'; a.click(); URL.revokeObjectURL(url) }} className="hover:text-violet-600 transition-colors"><Download className="w-3 h-3 text-slate-400 hover:text-violet-600" /></button></div>
          </div>
        ))}
      </div>
    </div>
  )

  const renderDocuments = () => (
    <div className="space-y-4">
      <div className="relative max-w-xs"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={searchDocs} onChange={e => setSearchDocs(e.target.value)} placeholder="Buscar documentos..." className="pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs w-full bg-white" /></div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {filteredDocs.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm"><FileText className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-xs font-medium">Nenhum documento disponível</p></div>
        ) : filteredDocs.map(d => {
          const docType = ((d as any).type || 'contract') as import('@/app/(dashboard)/documents/context/DocumentContext').DocType
          const tc = docCtx.docTypeConfig[docType]
          return (
          <div key={d.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md hover:border-violet-200 transition-all group">
            <div className={`p-2.5 rounded-xl w-fit mb-3 ${tc?.bg || 'bg-slate-50'}`}><FileText className={`w-4 h-4 ${tc?.color || 'text-slate-600'}`} /></div>
            <p className="text-xs font-bold text-slate-800 truncate group-hover:text-violet-700 transition-colors">{(d as any).name || (d as any).documentName}</p>
            <p className="text-[9px] text-slate-400 mt-0.5 truncate">{d.description || ''}</p>
            <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-50">
              <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${tc?.bg || 'bg-slate-50'}`}>{tc?.label || 'Documento'}</span>
              <button onClick={(e) => { e.stopPropagation(); portal.downloadDocument(d.id) }}
                className="text-[9px] text-violet-600 font-bold flex items-center gap-0.5 hover:text-violet-800 transition-colors"><Download className="w-2.5 h-2.5" /> Download</button>
            </div>
          </div>
          )
        })}
      </div>
    </div>
  )

  const renderAgenda = () => (
    <div className="space-y-4">
      <p className="text-xs text-slate-500 flex items-center gap-2"><Calendar className="w-4 h-4" /> Próximos eventos da empresa</p>
      {portal.companyCalendarEvents.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm"><Calendar className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-xs font-medium">Nenhum evento agendado</p></div>
      ) : (
        <div className="space-y-3">{portal.companyCalendarEvents.sort((a: any, b: any) => a.eventDate.localeCompare(b.eventDate)).map((e: any) => (
          <div key={e.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-all">
            <div className="flex items-start gap-3">
              <div className="text-center min-w-[44px] bg-slate-50 rounded-xl p-2 border border-slate-100"><p className="text-sm font-black text-slate-800">{new Date(e.eventDate + 'T12:00:00').getDate()}</p><p className="text-[8px] font-bold text-slate-400 uppercase">{new Date(e.eventDate + 'T12:00:00').toLocaleDateString('pt-BR', { month: 'short' })}</p></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <p className="text-xs font-bold text-slate-800">{e.title}</p>
                  <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full border whitespace-nowrap ${e.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : e.status === 'scheduled' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{e.status === 'confirmed' ? 'Confirmado' : e.status === 'scheduled' ? 'Agendado' : e.status}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{e.startTime?.slice(0, 5)} - {e.endTime?.slice(0, 5)}</span>
                  {e.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{e.location}</span>}
                  {e.responsible && <span className="flex items-center gap-1"><User className="w-3 h-3" />{e.responsible}</span>}
                </div>
              </div>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )

  const renderFinancial = () => {
    const pending = companyRecs.filter(r => r.status === 'pending')
    const overdue = companyRecs.filter(r => r.status === 'overdue')
    const paid = companyRecs.filter(r => r.status === 'paid')
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total Faturado', value: fmt(companyRecs.reduce((a, r) => a + r.amount, 0)), bg: 'from-slate-500 to-slate-600' },
            { label: 'Recebido', value: fmt(paid.reduce((a, r) => a + r.amount, 0)), bg: 'from-emerald-500 to-teal-600' },
            { label: 'A Receber', value: fmt(pending.reduce((a, r) => a + r.amount, 0)), bg: 'from-blue-500 to-indigo-600' },
            { label: 'Em Atraso', value: fmt(overdue.reduce((a, r) => a + r.amount, 0)), bg: 'from-red-500 to-rose-600' },
          ].map(s => (
            <div key={s.label} className={`rounded-2xl bg-gradient-to-br ${s.bg} p-[1px] shadow-lg`}>
              <div className="bg-white rounded-[calc(1rem-1px)] p-4 h-full">
                <span className="text-[8px] font-bold text-slate-400 uppercase">{s.label}</span>
                <p className="text-sm font-black mt-1 text-slate-800">{s.value}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100"><h3 className="text-xs font-bold text-slate-800">Contas a Receber</h3></div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="text-left py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Serviço</th>
                <th className="text-right py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Valor</th>
                <th className="text-center py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Vencimento</th>
                <th className="text-center py-2 px-3 text-[9px] font-bold text-slate-400 uppercase">Status</th>
              </tr></thead>
              <tbody>{companyRecs.length === 0 ? <tr><td colSpan={4} className="text-center py-12 text-slate-400">Nenhuma conta</td></tr> :
                companyRecs.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()).map(r => (
                  <tr key={r.id} className="border-b border-slate-50">
                    <td className="py-2 px-3 font-medium text-slate-700">{r.serviceName}</td>
                    <td className="py-2 px-3 text-right font-bold text-slate-800">{fmt(r.amount)}</td>
                    <td className="py-2 px-3 text-center text-slate-600">{sd(r.dueDate)}</td>
                    <td className="py-2 px-3 text-center">
                      <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${r.status === 'paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : r.status === 'overdue' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>
                        {r.status === 'paid' ? 'Recebido' : r.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                      </span>
                    </td>
                  </tr>
                ))}</tbody>
            </table>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-xs font-bold text-slate-800 mb-4">Contratos</h3>
          {companyContracts.length === 0 ? <p className="text-xs text-slate-400 text-center py-4">Nenhum contrato</p> : (
            <div className="space-y-2">{companyContracts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div><p className="text-xs font-bold text-slate-800">{c.title}</p><p className="text-[9px] text-slate-400">R$ {c.value.toLocaleString('pt-BR')} • {sd(c.startDate)} - {sd(c.endDate)}</p></div>
                <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{c.status === 'active' ? 'Ativo' : 'Inativo'}</span>
              </div>
            ))}</div>
          )}
        </div>
      </div>
    )
  }

  const renderRequests = () => {
    const myRequests = portal.companyRequests
    return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-xs text-slate-500">{myRequests.length} solicitação(ões)</p>
        <button onClick={() => setShowRequestForm(true)} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md"><Plus className="w-3.5 h-3.5" /> Nova Solicitação</button>
      </div>
      {myRequests.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm"><MessageSquare className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-xs font-medium">Nenhuma solicitação</p></div>
      ) : (
        <div className="space-y-2">{myRequests.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <span className="text-lg">{REQUEST_TYPE_CONFIG[r.type]?.icon || '📝'}</span>
                <div>
                  <p className="text-xs font-bold text-slate-800">{r.subject}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">{REQUEST_TYPE_CONFIG[r.type]?.label}</p>
                  {r.description && <p className="text-[10px] text-slate-500 mt-1">{r.description}</p>}
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full border ${r.priority === 'urgent' ? 'bg-red-50 text-red-700 border-red-100' : r.priority === 'high' ? 'bg-orange-50 text-orange-700 border-orange-100' : r.priority === 'medium' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>{r.priority === 'urgent' ? 'Urgente' : r.priority === 'high' ? 'Alta' : r.priority === 'medium' ? 'Média' : 'Baixa'}</span>
                    <span className={`px-1.5 py-0.5 text-[8px] font-bold rounded-full border ${r.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-100' : r.status === 'in_progress' ? 'bg-amber-50 text-amber-700 border-amber-100' : r.status === 'resolved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>{r.status === 'open' ? 'Aberta' : r.status === 'in_progress' ? 'Em andamento' : r.status === 'resolved' ? 'Resolvida' : 'Fechada'}</span>
                  </div>
                </div>
              </div>
              <span className="text-[9px] text-slate-400">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</span>
            </div>
          </div>
        ))}</div>
      )}
    </div>
  )
  }

  const modalRequestForm = showRequestForm && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowRequestForm(false)}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between">
          <div><h2 className="text-lg font-bold text-slate-800">Nova Solicitação</h2><p className="text-xs text-slate-500">O que você precisa?</p></div>
          <button onClick={() => setShowRequestForm(false)} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmitRequest} className="p-6 space-y-4">
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Tipo</label>
            <select value={reqForm.type} onChange={e => setReqForm({ ...reqForm, type: e.target.value as RequestType })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
              {Object.entries(REQUEST_TYPE_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.label}</option>)}
            </select></div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Assunto *</label>
            <input required value={reqForm.subject} onChange={e => setReqForm({ ...reqForm, subject: e.target.value })} placeholder="Ex: Agendar reunião de alinhamento" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Descrição</label>
            <textarea value={reqForm.description} onChange={e => setReqForm({ ...reqForm, description: e.target.value })} rows={3} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" placeholder="Detalhe sua solicitação..." /></div>
          <div><label className="block text-[10px] font-bold text-slate-700 mb-1">Prioridade</label>
            <select value={reqForm.priority} onChange={e => setReqForm({ ...reqForm, priority: e.target.value as RequestPriority })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
              <option value="low">Baixa</option><option value="medium">Média</option><option value="high">Alta</option><option value="urgent">Urgente</option>
            </select></div>
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={() => setShowRequestForm(false)} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5"><Send className="w-3.5 h-3.5" /> Enviar</button>
          </div>
        </form>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition-transform duration-200`}>{sidebar}</div>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="lg:hidden bg-white border-b border-slate-100 px-4 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl hover:bg-slate-100"><Menu className="w-5 h-5 text-slate-600" /></button>
          <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-purple-600 flex items-center justify-center"><Building2 className="w-4 h-4 text-white" /></div><span className="text-xs font-bold text-slate-800">Portal do Cliente</span></div>
          <button onClick={handleLogout} className="p-2 rounded-xl hover:bg-red-50"><LogOut className="w-4 h-4 text-slate-400" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 lg:p-6">
          <div className="max-w-5xl mx-auto space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex overflow-x-auto gap-1 pb-1 custom-scrollbar">
              {NAV_ITEMS.map(item => (
                <button key={item.id} onClick={() => setTab(item.id)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all whitespace-nowrap ${tab === item.id ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-sm' : 'bg-white text-slate-600 border border-slate-100 hover:border-violet-200 shadow-sm'}`}>
                  <item.icon className="w-3.5 h-3.5" />{item.label}
                </button>
              ))}
            </div>

            {tab === 'dashboard' && renderDashboard()}
            {tab === 'projects' && renderProjects()}
            {tab === 'nr01' && renderNr01()}
            {tab === 'trainings' && renderTrainings()}
            {tab === 'documents' && renderDocuments()}
            {tab === 'agenda' && renderAgenda()}
            {tab === 'financial' && renderFinancial()}
            {tab === 'requests' && renderRequests()}
          </div>
        </div>
      </div>

      {modalRequestForm}
    </div>
  )
}
