'use client'

import { useState } from 'react'
import { useAssessoria, PlanoAcao, PlanoAcaoItem } from './context/AssessoriaContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useAdmin } from '@/app/(dashboard)/admin/context/AdminContext'
import { useToast } from '@/components/ui/Toast'
import { AssessoriaDashboard } from './components/AssessoriaDashboard'
import {
  Search, Plus, X, Check, Trash2, AlertTriangle,
  Target, Layers, BarChart3, ClipboardList, Zap, Building2,
  TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown, LayoutDashboard, Link,
} from 'lucide-react'

const TABS = [
  { key: 'dashboard', label: 'Indicadores', icon: <LayoutDashboard className="w-4 h-4" /> },
  { key: 'diagnosticos', label: 'Diagnóstico', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'okr', label: 'OKR', icon: <Target className="w-4 h-4" /> },
  { key: 'swot', label: 'Matriz SWOT', icon: <Layers className="w-4 h-4" /> },
  { key: 'plano_acao', label: 'Plano de Ação', icon: <Zap className="w-4 h-4" /> },
  { key: 'kpi', label: 'Indicadores (KPI)', icon: <BarChart3 className="w-4 h-4" /> },
]

export default function AssessoriaPage() {
  const ctx = useAssessoria()
  const [tab, setTab] = useState('dashboard')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const showAddButton = tab !== 'dashboard'
  const showSearch = tab !== 'dashboard'

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Building2 className="w-6 h-6 text-brand-teal" />
            <span className="text-sm font-semibold text-brand-teal uppercase tracking-wider">Consultoria & Estratégia</span>
          </div>
          <h1 className="text-3xl font-black text-slate-800 tracking-tight">Assessoria Organizacional</h1>
          <p className="text-slate-500 text-sm mt-0.5">Diagnósticos, OKRs, matriz SWOT, planos de ação e indicadores</p>
        </div>
        {showAddButton && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-xs hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20">
            <Plus className="w-4 h-4" />
            Novo Registro
          </button>
        )}
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
        {TABS.map(t => {
          const isActive = tab === t.key
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-5 py-3 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all flex-shrink-0 border-b-2 -mb-[1px] ${
                isActive
                  ? 'border-brand-teal text-brand-teal bg-brand-teal/5'
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Search */}
      {showSearch && (
        <div className="flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
          </div>
        </div>
      )}

      {/* Tab Content */}
      {tab === 'dashboard' && <AssessoriaDashboard />}
      {tab === 'diagnosticos' && <DiagnosticosTab ctx={ctx} search={search} />}
      {tab === 'okr' && <OkrsTab ctx={ctx} search={search} />}
      {tab === 'swot' && <SwotTab ctx={ctx} search={search} />}
      {tab === 'plano_acao' && <PlanosAcaoTab ctx={ctx} search={search} />}
      {tab === 'kpi' && <KpiTab ctx={ctx} search={search} />}

      {/* Form Modal */}
      {showForm && <FormModal tab={tab} ctx={ctx} onClose={() => setShowForm(false)} />}
    </div>
  )
}

function DiagnosticosTab({ ctx, search }: { ctx: ReturnType<typeof useAssessoria>; search: string }) {
  const filtered = ctx.diagnosticos.filter(d => !search || d.titulo.toLowerCase().includes(search.toLowerCase()) || d.empresa.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
      <table className="w-full text-[11px]">
        <thead><tr className="bg-slate-50 border-b border-slate-100">
          <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Título</th>
          <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Empresa</th>
          <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Pontuação</th>
          <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Áreas</th>
          <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Status</th>
          <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Ações</th>
        </tr></thead>
        <tbody>
          {filtered.map(d => (
            <tr key={d.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
              <td className="px-4 py-3 font-semibold text-slate-700">{d.titulo}</td>
              <td className="px-4 py-3 text-slate-600">{d.empresa}</td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${d.pontuacaoGeral >= 70 ? 'bg-emerald-50 text-emerald-700' : d.pontuacaoGeral >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'}`}>{d.pontuacaoGeral}%</span>
              </td>
              <td className="px-4 py-3 text-slate-500 text-[10px]">{(Array.isArray(d.areasAvaliadas) ? d.areasAvaliadas : []).join(', ')}</td>
              <td className="px-4 py-3 text-center">
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${d.status === 'concluido' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-amber-50 text-amber-700 border border-amber-100'}`}>{d.status === 'concluido' ? 'Concluído' : 'Rascunho'}</span>
              </td>
              <td className="px-4 py-3 text-right">
                <button onClick={() => ctx.deleteDiagnostico(d.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
              </td>
            </tr>
          ))}
          {filtered.length === 0 && <tr><td colSpan={6} className="p-12 text-center text-slate-400 text-xs">Nenhum diagnóstico registrado.</td></tr>}
        </tbody>
      </table>
    </div>
  )
}

function OkrsTab({ ctx, search }: { ctx: ReturnType<typeof useAssessoria>; search: string }) {
  const filtered = ctx.okrs.filter(o => !search || o.objetivo.toLowerCase().includes(search.toLowerCase()) || o.empresa.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-3">
      {filtered.map(o => (
        <div key={o.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${o.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : o.status === 'concluido' ? 'bg-blue-50 text-blue-700' : 'bg-red-50 text-red-700'}`}>{o.status === 'ativo' ? 'Ativo' : o.status === 'concluido' ? 'Concluído' : 'Cancelado'}</span>
                <span className="text-[10px] text-slate-400">{o.ciclo}</span>
              </div>
              <h3 className="text-[13px] font-bold text-slate-800">{o.objetivo}</h3>
              <p className="text-[10px] text-slate-500">{o.empresa}</p>
            </div>
            <button onClick={() => ctx.deleteOkr(o.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-2">
            {o.keyResults.map((kr, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[10px] text-slate-600">{kr.descricao}</span>
                    <span className="text-[10px] font-bold text-slate-700">{kr.atual}/{kr.meta} {kr.unidade}</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${Math.min(100, (kr.atual / kr.meta) * 100)}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => ctx.updateKr(o.id, i, Math.max(0, kr.atual - 1))} className="p-1 rounded hover:bg-slate-100 text-slate-400"><Minus className="w-3 h-3" /></button>
                  <button onClick={() => ctx.updateKr(o.id, i, kr.atual + 1)} className="p-1 rounded hover:bg-slate-100 text-slate-400"><Plus className="w-3 h-3" /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 shadow-sm">Nenhum OKR registrado.</div>}
    </div>
  )
}

function SwotTab({ ctx, search }: { ctx: ReturnType<typeof useAssessoria>; search: string }) {
  const filtered = ctx.swots.filter(s => !search || s.empresa.toLowerCase().includes(search.toLowerCase()))
  const quadrantClass = 'rounded-xl p-3 border min-h-[120px]'
  return (
    <div className="space-y-3">
      {filtered.map(s => (
        <div key={s.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[13px] font-bold text-slate-800">{s.empresa}</h3>
            <button onClick={() => ctx.deleteSwot(s.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className={`${quadrantClass} bg-emerald-50/50 border-emerald-200`}>
              <p className="text-[9px] font-bold text-emerald-700 uppercase mb-1.5 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Forças</p>
              <ul className="list-disc list-inside text-[10px] text-emerald-800 space-y-0.5">{s.forcas.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
            <div className={`${quadrantClass} bg-red-50/50 border-red-200`}>
              <p className="text-[9px] font-bold text-red-700 uppercase mb-1.5 flex items-center gap-1"><ArrowDown className="w-3 h-3" /> Fraquezas</p>
              <ul className="list-disc list-inside text-[10px] text-red-800 space-y-0.5">{s.fraquezas.map((f, i) => <li key={i}>{f}</li>)}</ul>
            </div>
            <div className={`${quadrantClass} bg-blue-50/50 border-blue-200`}>
              <p className="text-[9px] font-bold text-blue-700 uppercase mb-1.5 flex items-center gap-1"><ArrowUp className="w-3 h-3" /> Oportunidades</p>
              <ul className="list-disc list-inside text-[10px] text-blue-800 space-y-0.5">{s.oportunidades.map((o, i) => <li key={i}>{o}</li>)}</ul>
            </div>
            <div className={`${quadrantClass} bg-amber-50/50 border-amber-200`}>
              <p className="text-[9px] font-bold text-amber-700 uppercase mb-1.5 flex items-center gap-1"><ArrowDown className="w-3 h-3" /> Ameaças</p>
              <ul className="list-disc list-inside text-[10px] text-amber-800 space-y-0.5">{s.ameacas.map((a, i) => <li key={i}>{a}</li>)}</ul>
            </div>
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 shadow-sm">Nenhuma matriz SWOT registrada.</div>}
    </div>
  )
}

const priorityColor = (p: 'alta' | 'media' | 'baixa') =>
  p === 'alta' ? 'bg-red-50 text-red-700' : p === 'baixa' ? 'bg-slate-100 text-slate-600' : 'bg-amber-50 text-amber-700'

const categoriaLabel = (c: 'demanda' | 'iniciativa' | 'tarefa' | 'projeto') =>
  c === 'demanda' ? 'Demanda' : c === 'iniciativa' ? 'Iniciativa' : c === 'tarefa' ? 'Tarefa' : 'Projeto'

const statusColor = (s: 'pendente' | 'andamento' | 'concluido') =>
  s === 'concluido' ? 'bg-emerald-100 text-emerald-700' : s === 'andamento' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'

const statusIcon = (s: 'pendente' | 'andamento' | 'concluido') =>
  s === 'concluido' ? <Check className="w-2.5 h-2.5" /> : s === 'andamento' ? <AlertTriangle className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />

function PlanosAcaoTab({ ctx, search }: { ctx: ReturnType<typeof useAssessoria>; search: string }) {
  const { companies, addTask } = useCrm()
  const { currentUser } = useAdmin()
  const toast = useToast()
  const currentUserName = currentUser?.name || 'Sistema'

  const matchCompany = (empresa: string) =>
    companies.find(
      c =>
        (c.name || '').toLowerCase() === empresa.toLowerCase() ||
        (c.tradeName || '').toLowerCase() === empresa.toLowerCase()
    )

  const syncToTasks = (plano: PlanoAcao) => {
    const company = matchCompany(plano.empresa)
    if (!company) {
      toast.addToast('error', 'Empresa não localizada', `A empresa "${plano.empresa}" não foi encontrada no CRM. Corrija o nome antes de sincronizar.`)
      return
    }
    let created = 0
    for (const item of plano.itens) {
      if (item.status === 'concluido' || item.linkedTaskId) continue
      const task = addTask({
        companyId: company.id,
        title: `[Plano: ${plano.titulo}] ${item.acao}`,
        dueDate: item.prazo || new Date().toISOString().split('T')[0],
        priority: item.prioridade === 'alta' ? 'high' : item.prioridade === 'baixa' ? 'low' : 'medium',
        assignedTo: item.responsavel || undefined,
        createdBy: `Assessoria → ${currentUserName}`,
      })
      ctx.updatePlanoItem(plano.id, item.id, { linkedTaskId: task.id })
      created++
    }
    toast.addToast('success', 'Tarefas sincronizadas', `${created} tarefa(s) do plano enviada(s) para o módulo Tarefas.`)
  }

  const filtered = ctx.planosAcao.filter(p => !search || p.titulo.toLowerCase().includes(search.toLowerCase()) || p.empresa.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-3">
      {filtered.map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'}`}>{p.status === 'ativo' ? 'Ativo' : 'Concluído'}</span>
                <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-violet-50 text-violet-700 border border-violet-100">{categoriaLabel(p.categoria)}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${priorityColor(p.prioridade)}`}>{p.prioridade}</span>
                <span className={`px-2 py-0.5 rounded text-[9px] border ${p.prazo ? 'bg-amber-50 text-amber-700 border-amber-100' : 'bg-slate-100 text-slate-600 border-slate-200'}`}>Prazo: {p.prazo || '—'}</span>
              </div>
              <h3 className="text-[13px] font-bold text-slate-800 mt-1">{p.titulo}</h3>
              <p className="text-[10px] text-slate-500">{p.empresa} · Responsável: {p.responsavel}</p>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => syncToTasks(p)}
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-violet-600"
                title="Sincronizar itens para Tarefas"
              >
                <ClipboardList className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => ctx.deletePlanoAcao(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="space-y-1.5">
            {p.itens.map((item) => (
              <PlanoItemRow key={item.id} item={item} planoId={p.id} ctx={ctx} />
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 shadow-sm">Nenhum plano de ação registrado.</div>}
    </div>
  )
}

function PlanoItemRow({ item, planoId, ctx }: {
  item: PlanoAcaoItem; planoId: string; ctx: ReturnType<typeof useAssessoria>
}) {
  return (
    <div className="flex items-center gap-2 text-[10px] bg-slate-25 rounded-xl px-2.5 py-1.5">
      <select
        value={item.status}
        onChange={e => ctx.updatePlanoItem(planoId, item.id, { status: e.target.value as PlanoAcaoItem['status'] })}
        className="text-[10px] border border-slate-100 rounded-lg bg-white px-1.5 py-0.5"
      >
        <option value="pendente">Pendente</option>
        <option value="andamento">Em andamento</option>
        <option value="concluido">Concluído</option>
      </select>
      <select
        value={item.categoria}
        onChange={e => ctx.updatePlanoItem(planoId, item.id, { categoria: e.target.value as PlanoAcaoItem['categoria'] })}
        className="text-[9px] border border-slate-100 rounded-lg bg-white px-1.5 py-0.5"
      >
        <option value="demanda">Demanda</option>
        <option value="iniciativa">Iniciativa</option>
        <option value="tarefa">Tarefa</option>
        <option value="projeto">Projeto</option>
      </select>
      <select
        value={item.prioridade}
        onChange={e => ctx.updatePlanoItem(planoId, item.id, { prioridade: e.target.value as PlanoAcaoItem['prioridade'] })}
        className="text-[9px] border border-slate-100 rounded-lg bg-white px-1.5 py-0.5"
      >
        <option value="baixa">Baixa</option>
        <option value="media">Média</option>
        <option value="alta">Alta</option>
      </select>
      <input
        value={item.acao}
        onChange={e => ctx.updatePlanoItem(planoId, item.id, { acao: e.target.value })}
        placeholder="Ação / demanda"
        className="flex-1 text-[10px] border border-slate-100 rounded-lg bg-white px-1.5 py-0.5"
      />
      <input
        type="date"
        value={item.prazo}
        onChange={e => ctx.updatePlanoItem(planoId, item.id, { prazo: e.target.value })}
        className="text-[9px] border border-slate-100 rounded-lg bg-white px-1 py-0.5 w-28"
      />
      <span className={`w-4 h-4 rounded-full flex-shrink-0 flex items-center justify-center ${statusColor(item.status)}`}>
        {statusIcon(item.status)}
      </span>
      {item.linkedTaskId && <Link className="w-3 h-3 text-slate-400" />}
    </div>
  )
}

function KpiTab({ ctx, search }: { ctx: ReturnType<typeof useAssessoria>; search: string }) {
  const filtered = ctx.kpis.filter(k => !search || k.nome.toLowerCase().includes(search.toLowerCase()) || k.empresa.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {filtered.map(k => {
        const progress = Math.min(100, (k.atual / k.meta) * 100)
        return (
          <div key={k.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-slate-400 font-medium">{k.empresa}</span>
              <span className="text-[9px] text-slate-400">{k.periodo}</span>
            </div>
            <p className="text-[12px] font-bold text-slate-800 mb-3">{k.nome}</p>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-lg font-black text-slate-800">{k.atual}<span className="text-[11px] text-slate-400 font-medium">/{k.meta}{k.unidade}</span></span>
              <span className={`flex items-center gap-0.5 text-[10px] font-bold ${k.tendencia === 'subindo' ? 'text-emerald-600' : k.tendencia === 'descendo' ? 'text-red-600' : 'text-slate-400'}`}>
                {k.tendencia === 'subindo' ? <TrendingUp className="w-3.5 h-3.5" /> : k.tendencia === 'descendo' ? <TrendingDown className="w-3.5 h-3.5" /> : <Minus className="w-3.5 h-3.5" />}
                {k.tendencia === 'subindo' ? 'Subindo' : k.tendencia === 'descendo' ? 'Descendo' : 'Estável'}
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div className={`h-full rounded-full transition-all ${progress >= 80 ? 'bg-emerald-500' : progress >= 50 ? 'bg-amber-500' : 'bg-red-500'}`} style={{ width: `${progress}%` }} />
            </div>
          </div>
        )
      })}
      {filtered.length === 0 && <div className="col-span-full p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 shadow-sm">Nenhum indicador (KPI) registrado.</div>}
    </div>
  )
}

function FormModal({ tab, ctx, onClose }: { tab: string; ctx: ReturnType<typeof useAssessoria>; onClose: () => void }) {
  const { companies, addTask } = useCrm()
  const { users } = useAdmin()
  const activeUsers = users.filter(u => u.active)
  
  const [empresaId, setEmpresaId] = useState('')
  const [titulo, setTitulo] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [ciclo, setCiclo] = useState('')
  const [responsavelName, setResponsavelName] = useState('')
  const [pontuacao, setPontuacao] = useState(50)
  const [status, setStatus] = useState<string>('rascunho')
  const [categoria, setCategoria] = useState<string>('demanda')
  const [prioridade, setPrioridade] = useState<string>('media')
  const [planoPrazo, setPlanoPrazo] = useState(new Date().toISOString().split('T')[0])

  const handleSubmit = () => {
    if (!empresaId) return
    const empresa = companies.find(c => c.id === empresaId)?.name || 'Empresa'
    
    switch (tab) {
      case 'diagnosticos':
        ctx.addDiagnostico({ titulo: titulo || 'Novo Diagnóstico', empresa, responsavel: responsavelName || 'Sistema', areasAvaliadas: ['Geral'], pontuacaoGeral: pontuacao, status: status as 'rascunho' | 'concluido', observacoes: '' })
        break
      case 'okr':
        ctx.addOkr({ objetivo: objetivo || 'Novo Objetivo', empresa, ciclo: ciclo || new Date().getFullYear().toString(), keyResults: [{ descricao: 'KR padrão', meta: 100, atual: 0, unidade: '%' }], status: 'ativo' })
        break
      case 'swot':
        ctx.addSwot({ empresa, forcas: ['Força padrão'], fraquezas: ['Fraqueza padrão'], oportunidades: ['Oportunidade padrão'], ameacas: ['Ameaça padrão'] })
        break
      case 'plano_acao':
        const plano = {
          titulo: titulo || 'Novo Plano',
          empresa,
          responsavel: responsavelName || 'Sistema',
          categoria: categoria as PlanoAcao['categoria'],
          prioridade: prioridade as PlanoAcao['prioridade'],
          prazo: planoPrazo,
          itens: [{
            id: crypto.randomUUID(),
            acao: 'Nova ação / demanda',
            descricao: '',
            prazo: planoPrazo,
            responsavel: responsavelName || 'Sistema',
            prioridade: prioridade as PlanoAcaoItem['prioridade'],
            categoria: categoria as PlanoAcaoItem['categoria'],
            status: 'pendente' as const,
            linkedTaskId: undefined,
          }],
          status: 'ativo' as const,
        }
        ctx.addPlanoAcao(plano)
        // Autocreation of tasks
        plano.itens.forEach(item => {
          addTask({
            companyId: empresaId,
            title: `[Plano: ${plano.titulo}] ${item.acao}`,
            dueDate: item.prazo,
            priority: item.prioridade === 'alta' ? 'high' : item.prioridade === 'baixa' ? 'low' : 'medium',
            assignedTo: item.responsavel || undefined,
            createdBy: 'Assessoria Automática',
          })
        })
        break
      case 'kpi':
        ctx.addKpi({ nome: titulo || 'Novo KPI', empresa, meta: 100, atual: 0, unidade: '%', periodo: new Date().toISOString().slice(0, 7), tendencia: 'estavel' })
        break
    }
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-sm font-black text-slate-800 mb-4">Novo Registro</h3>
        <div className="space-y-3">
          <div>
            <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Empresa</label>
            <select value={empresaId} onChange={e => setEmpresaId(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
              <option value="">Selecione...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>)}
            </select>
          </div>
          {tab === 'diagnosticos' && (
            <>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Título</label><input value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Pontuação (%)</label><input type="number" value={pontuacao} onChange={e => setPontuacao(Number(e.target.value))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Status</label>
                <select value={status} onChange={e => setStatus(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  <option value="rascunho">Rascunho</option><option value="concluido">Concluído</option>
                </select></div>
            </>
          )}
          {tab === 'okr' && (
            <>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Objetivo</label><input value={objetivo} onChange={e => setObjetivo(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Ciclo</label><input value={ciclo} onChange={e => setCiclo(e.target.value)} placeholder="Ex: 2026.Q2" className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
            </>
          )}
          {tab === 'plano_acao' && (
            <>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Título</label><input value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Responsável</label>
                <select value={responsavelName} onChange={e => setResponsavelName(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                    <option value="">Selecione...</option>
                    {activeUsers.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Demanda / Iniciativa</label>
                <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  <option value="demanda">Demanda</option><option value="iniciativa">Iniciativa</option><option value="tarefa">Tarefa</option><option value="projeto">Projeto</option>
                </select>
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Prioridade</label>
                <select value={prioridade} onChange={e => setPrioridade(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  <option value="baixa">Baixa</option><option value="media">Média</option><option value="alta">Alta</option>
                </select>
              </div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Prazo</label><input type="date" value={planoPrazo} onChange={e => setPlanoPrazo(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
            </>
          )}
          {tab === 'kpi' && (
            <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nome do Indicador</label><input value={titulo} onChange={e => setTitulo(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
          )}
        </div>
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
          <button onClick={handleSubmit} className="flex-1 px-3 py-2 bg-brand-teal text-white text-[11px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all">Salvar</button>
          <button onClick={onClose} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
        </div>
      </div>
    </div>
  )
}
