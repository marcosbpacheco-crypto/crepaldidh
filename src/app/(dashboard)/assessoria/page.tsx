'use client'

import { useState, useMemo } from 'react'
import { useAssessoria, type Diagnostico, type Okr, type Swot, type PlanoAcao, type Kpi } from './context/AssessoriaContext'
import {
  Search, Plus, X, Check, Trash2, Edit2, AlertTriangle,
  Target, Layers, BarChart3, ClipboardList, Zap, Building2,
  TrendingUp, TrendingDown, Minus, ArrowUp, ArrowDown,
} from 'lucide-react'

const TABS = [
  { key: 'diagnosticos', label: 'Diagnóstico', icon: <ClipboardList className="w-4 h-4" /> },
  { key: 'okr', label: 'OKR', icon: <Target className="w-4 h-4" /> },
  { key: 'swot', label: 'Matriz SWOT', icon: <Layers className="w-4 h-4" /> },
  { key: 'plano_acao', label: 'Plano de Ação', icon: <Zap className="w-4 h-4" /> },
  { key: 'kpi', label: 'Indicadores (KPI)', icon: <BarChart3 className="w-4 h-4" /> },
]

export default function AssessoriaPage() {
  const ctx = useAssessoria()
  const [tab, setTab] = useState('diagnosticos')
  const [showForm, setShowForm] = useState(false)
  const [search, setSearch] = useState('')

  const showAddButton = ['diagnosticos', 'okr', 'swot', 'plano_acao', 'kpi'].includes(tab)

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="w-5 h-5 text-slate-600" />
        <h1 className="text-lg font-black text-slate-800">ASSESSORIA EMPRESARIAL</h1>
        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500">FERRAMENTAS</span>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
          <p className="text-[9px] font-semibold text-slate-400 uppercase">Diagnósticos</p>
          <p className="text-lg font-black text-slate-800">{ctx.diagnosticos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
          <p className="text-[9px] font-semibold text-slate-400 uppercase">OKRs Ativos</p>
          <p className="text-lg font-black text-brand-teal">{ctx.okrs.filter(o => o.status === 'ativo').length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
          <p className="text-[9px] font-semibold text-slate-400 uppercase">Planos de Ação</p>
          <p className="text-lg font-black text-amber-600">{ctx.planosAcao.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
          <p className="text-[9px] font-semibold text-slate-400 uppercase">Indicadores (KPI)</p>
          <p className="text-lg font-black text-blue-600">{ctx.kpis.length}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              tab === t.key ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
        </div>
        {showAddButton && (
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white text-[10px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all"><Plus className="w-3.5 h-3.5" /> Novo</button>
        )}
      </div>

      {/* Tab Content */}
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
              <td className="px-4 py-3 text-slate-500 text-[10px]">{d.areasAvaliadas.join(', ')}</td>
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

function PlanosAcaoTab({ ctx, search }: { ctx: ReturnType<typeof useAssessoria>; search: string }) {
  const filtered = ctx.planosAcao.filter(p => !search || p.titulo.toLowerCase().includes(search.toLowerCase()) || p.empresa.toLowerCase().includes(search.toLowerCase()))
  return (
    <div className="space-y-3">
      {filtered.map(p => (
        <div key={p.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${p.status === 'ativo' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-600'}`}>{p.status === 'ativo' ? 'Ativo' : 'Concluído'}</span>
              <h3 className="text-[13px] font-bold text-slate-800 mt-1">{p.titulo}</h3>
              <p className="text-[10px] text-slate-500">{p.empresa} • Responsável: {p.responsavel}</p>
            </div>
            <button onClick={() => ctx.deletePlanoAcao(p.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
          <div className="space-y-1.5">
            {p.itens.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-[10px]">
                <span className={`w-4 h-4 rounded-full flex items-center justify-center ${item.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' : item.status === 'andamento' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-400'}`}>
                  {item.status === 'concluido' ? <Check className="w-2.5 h-2.5" /> : item.status === 'andamento' ? <AlertTriangle className="w-2.5 h-2.5" /> : <Minus className="w-2.5 h-2.5" />}
                </span>
                <span className="flex-1 text-slate-700">{item.acao}</span>
                <span className="text-slate-400">{item.responsavel}</span>
                <span className="text-slate-400">Prazo: {item.prazo}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      {filtered.length === 0 && <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 shadow-sm">Nenhum plano de ação registrado.</div>}
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
  const [empresa, setEmpresa] = useState('')
  const [titulo, setTitulo] = useState('')
  const [objetivo, setObjetivo] = useState('')
  const [ciclo, setCiclo] = useState('')
  const [responsavel, setResponsavel] = useState('')
  const [pontuacao, setPontuacao] = useState(50)
  const [status, setStatus] = useState<string>('rascunho')

  const handleSubmit = () => {
    if (!empresa) return
    switch (tab) {
      case 'diagnosticos':
        ctx.addDiagnostico({ titulo: titulo || 'Novo Diagnóstico', empresa, responsavel: responsavel || 'Sistema', areasAvaliadas: ['Geral'], pontuacaoGeral: pontuacao, status: status as 'rascunho' | 'concluido', observacoes: '' })
        break
      case 'okr':
        ctx.addOkr({ objetivo: objetivo || 'Novo Objetivo', empresa, ciclo: ciclo || new Date().getFullYear().toString(), keyResults: [{ descricao: 'KR padrão', meta: 100, atual: 0, unidade: '%' }], status: 'ativo' })
        break
      case 'swot':
        ctx.addSwot({ empresa, forcas: ['Força padrão'], fraquezas: ['Fraqueza padrão'], oportunidades: ['Oportunidade padrão'], ameacas: ['Ameaça padrão'] })
        break
      case 'plano_acao':
        ctx.addPlanoAcao({ titulo: titulo || 'Novo Plano', empresa, responsavel: responsavel || 'Sistema', itens: [{ acao: 'Ação padrão', prazo: new Date().toISOString().split('T')[0], responsavel: responsavel || 'Sistema', status: 'pendente' as const }], status: 'ativo' })
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
          <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Empresa</label><input value={empresa} onChange={e => setEmpresa(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
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
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Responsável</label><input value={responsavel} onChange={e => setResponsavel(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
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
