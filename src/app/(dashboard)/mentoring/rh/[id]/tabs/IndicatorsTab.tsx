'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { Activity, Plus, Trash2, Pencil, TrendingUp, TrendingDown, Minus } from 'lucide-react'

const TREND_LABELS: Record<string, string> = { subindo: 'Subindo', estavel: 'EstÃ¡vel', descendo: 'Descendo' }
const TREND_ICONS: Record<string, any> = { subindo: TrendingUp, estavel: Minus, descendo: TrendingDown }
const TREND_COLORS: Record<string, string> = {
  subindo: 'bg-emerald-100 text-emerald-700',
  estavel: 'bg-slate-100 text-slate-600',
  descendo: 'bg-red-100 text-red-700',
}

export default function IndicatorsTab({ program }: { program: MentoringProgram }) {
  const { addIndicator, updateIndicator, deleteIndicator } = useMentoring()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: '',
    description: '',
    unit: '',
    initialValue: '',
    currentValue: '',
    targetValue: '',
    trend: 'estavel',
    period: '',
    source: '',
  })

  const indicators = [...(Array.isArray(program.indicators) ? program.indicators : [])]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const payload = {
      name: form.name.trim(),
      description: form.description.trim() || undefined,
      unit: form.unit.trim() || undefined,
      initialValue: form.initialValue.trim() || undefined,
      currentValue: form.currentValue.trim() || undefined,
      targetValue: form.targetValue.trim() || undefined,
      trend: form.trend,
      period: form.period.trim() || undefined,
      source: form.source.trim() || undefined,
      programId: program.id,
    }
    if (editingId) {
      updateIndicator(editingId, payload)
    } else {
      addIndicator(payload)
    }
    setShowForm(false)
    setEditingId(null)
    setForm({ name: '', description: '', unit: '', initialValue: '', currentValue: '', targetValue: '', trend: 'estavel', period: '', source: '' })
  }

  const startEdit = (i: any) => {
    setEditingId(i.id)
    setForm({
      name: i.name || '',
      description: i.description || '',
      unit: i.unit || '',
      initialValue: i.initialValue || '',
      currentValue: i.currentValue || '',
      targetValue: i.targetValue || '',
      trend: i.trend || 'estavel',
      period: i.period || '',
      source: i.source || '',
    })
    setShowForm(true)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-800">Indicadores</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">{indicators.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Metas quantitativas para medir o impacto do programa</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setForm({ name: '', description: '', unit: '', initialValue: '', currentValue: '', targetValue: '', trend: 'estavel', period: '', source: '' }) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700 transition-colors">
          <Plus className="w-4 h-4" /> Novo Indicador
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700">{editingId ? 'Editar Indicador' : 'Novo Indicador'}</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Nome *</span>
              <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Ãndice de satisfaÃ§Ã£o dos participantes"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">DescriÃ§Ã£o</span>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Unidade</span>
              <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="Ex: %"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">PerÃ­odo</span>
              <input value={form.period} onChange={e => setForm({ ...form, period: e.target.value })} placeholder="Ex: Mensal"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Valor Inicial</span>
              <input value={form.initialValue} onChange={e => setForm({ ...form, initialValue: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Valor Atual</span>
              <input value={form.currentValue} onChange={e => setForm({ ...form, currentValue: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Meta</span>
              <input value={form.targetValue} onChange={e => setForm({ ...form, targetValue: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">TendÃªncia</span>
              <select value={form.trend} onChange={e => setForm({ ...form, trend: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                {Object.entries(TREND_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Fonte</span>
              <input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}
                placeholder="Ex: Pesquisa interna, RH"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700 transition-colors">
              {editingId ? 'Salvar AlteraÃ§Ãµes' : 'Criar Indicador'}
            </button>
          </div>
        </form>
      )}

      {indicators.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <Activity className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum indicador cadastrado</p>
          <p className="text-xs text-slate-400 mt-1">Cadastre indicadores para medir o impacto do programa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {indicators.map(i => {
            const TrendIcon = TREND_ICONS[i.trend || 'estavel'] || Minus
            const pctOfTarget = (n: string) => {
              const t = parseFloat(i.targetValue || '')
              const c = parseFloat(n)
              if (!t || isNaN(c)) return null
              return Math.round((c / t) * 100)
            }
            const pct = pctOfTarget(i.currentValue || '')
            return (
              <div key={i.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-slate-800 truncate">{i.name}</h4>
                    {i.description && <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{i.description}</p>}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(i)} className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => confirm('Excluir este indicador?') && deleteIndicator(i.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 rounded-xl bg-slate-50">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Inicial</p>
                    <p className="text-sm font-bold text-slate-700">{i.initialValue ?? 'â€”'}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-sky-50">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Atual</p>
                    <p className="text-sm font-bold text-sky-700">{i.currentValue ?? 'â€”'}</p>
                  </div>
                  <div className="p-2 rounded-xl bg-slate-50">
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">Meta</p>
                    <p className="text-sm font-bold text-slate-700">{i.targetValue ?? 'â€”'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${TREND_COLORS[i.trend || 'estavel'] || 'bg-slate-100 text-slate-600'}`}>
                    <TrendIcon className="w-3 h-3" /> {TREND_LABELS[i.trend || 'estavel'] || i.trend}
                  </span>
                  {pct !== null && (
                    <span className={`text-xs font-bold ${pct >= 100 ? 'text-emerald-600' : pct >= 60 ? 'text-amber-600' : 'text-red-500'}`}>{pct}% da meta</span>
                  )}
                </div>
                {(i.period || i.source) && (
                  <p className="text-[10px] text-slate-400 mt-2">
                    {i.period && <span>{i.period}</span>}{i.period && i.source && ' Â· '}{i.source && <span>Fonte: {i.source}</span>}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
