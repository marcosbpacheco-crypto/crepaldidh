'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import type { MentoringDiagnosticArea } from '@/types/mentoring'
import { ClipboardList, Plus, Trash2, Pencil } from 'lucide-react'

const GROUPS = ['Organizacional', 'GestÃ£o de Pessoas', 'LideranÃ§a', 'ComunicaÃ§Ã£o', 'Cultura', 'Processos']

export default function DiagnosticsTab({ program }: { program: MentoringProgram }) {
  const { addDiagnostic, updateDiagnostic, deleteDiagnostic } = useMentoring()
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [period, setPeriod] = useState('')
  const [observations, setObservations] = useState('')
  const [areas, setAreas] = useState<MentoringDiagnosticArea[]>([])

  const diagnostics = [...(Array.isArray(program.diagnostics) ? program.diagnostics : [])]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const cleanAreas = areas.filter(a => a.area.trim() && a.note > 0)
    const payload = {
      period: period.trim() || undefined,
      status: 'concluido' as const,
      areas: cleanAreas,
      observations: observations.trim() || undefined,
      programId: program.id,
    }
    if (editingId) {
      updateDiagnostic(editingId, payload)
    } else {
      addDiagnostic(payload)
    }
    setShowForm(false)
    setEditingId(null)
    setPeriod('')
    setObservations('')
    setAreas([])
  }

  const startEdit = (d: any) => {
    setEditingId(d.id)
    setPeriod(d.period || '')
    setObservations(d.observations || '')
    setAreas(Array.isArray(d.areas) ? d.areas : [])
    setShowForm(true)
  }

  const setArea = (i: number, patch: Partial<MentoringDiagnosticArea>) => {
    setAreas(prev => prev.map((a, idx) => idx === i ? { ...a, ...patch } : a))
  }

  const addArea = () => setAreas(prev => [...prev, { group: GROUPS[0], area: '', note: 0, maturity: '', comment: '', evidence: '', recommendations: '' }])
  const removeArea = (i: number) => setAreas(prev => prev.filter((_, idx) => idx !== i))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-sky-600" />
            <h3 className="text-lg font-bold text-slate-800">DiagnÃ³sticos</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full">{diagnostics.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">AvaliaÃ§Ã£o por Ã¡reas com nota, maturidade e recomendaÃ§Ãµes</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setEditingId(null); setPeriod(''); setObservations(''); setAreas([]) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700 transition-colors">
          <Plus className="w-4 h-4" /> Novo DiagnÃ³stico
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-700">{editingId ? 'Editar DiagnÃ³stico' : 'Novo DiagnÃ³stico'}</h4>
            <button type="button" onClick={addArea} className="flex items-center gap-1.5 text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Adicionar Ãrea
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">PerÃ­odo</span>
              <input value={period} onChange={e => setPeriod(e.target.value)}
                placeholder="Ex: 2026/1Âº Semestre"
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">ObservaÃ§Ãµes</span>
              <input value={observations} onChange={e => setObservations(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-300" />
            </label>
          </div>

          {areas.length > 0 && (
            <div className="space-y-3 border-t border-slate-100 pt-4">
              {areas.map((a, i) => (
                <div key={i} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end p-3 rounded-xl bg-slate-50/60 border border-slate-100">
                  <label className="block md:col-span-1">
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">Grupo</span>
                    <select value={a.group} onChange={e => setArea(i, { group: e.target.value })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-2 focus:ring-sky-300">
                      {GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </label>
                  <label className="block md:col-span-2">
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">Ãrea</span>
                    <input value={a.area} onChange={e => setArea(i, { area: e.target.value })} placeholder="Ex: ComunicaÃ§Ã£o interna"
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  </label>
                  <label className="block md:col-span-1">
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">Nota (0-10)</span>
                    <input type="number" min={0} max={10} value={a.note || ''} onChange={e => setArea(i, { note: parseInt(e.target.value) || 0 })}
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  </label>
                  <label className="block md:col-span-1">
                    <span className="block text-[10px] font-semibold text-slate-500 mb-1">Maturidade</span>
                    <input value={a.maturity || ''} onChange={e => setArea(i, { maturity: e.target.value })} placeholder="Ex: BÃ¡sico"
                      className="w-full px-2.5 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-sky-300" />
                  </label>
                  <button type="button" onClick={() => removeArea(i)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors md:col-span-1 justify-self-start">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 bg-sky-600 text-white rounded-full text-sm font-bold hover:bg-sky-700 transition-colors">
              {editingId ? 'Salvar AlteraÃ§Ãµes' : 'Salvar DiagnÃ³stico'}
            </button>
          </div>
        </form>
      )}

      {diagnostics.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <ClipboardList className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum diagnÃ³stico registrado</p>
          <p className="text-xs text-slate-400 mt-1">Registre diagnÃ³sticos por Ã¡reas para basear o plano de aÃ§Ã£o.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {diagnostics.map(d => {
            const dAreas = Array.isArray(d.areas) ? d.areas : []
            const avg = dAreas.length ? (dAreas.reduce((s, a) => s + a.note, 0) / dAreas.length).toFixed(1) : 'â€”'
            return (
              <div key={d.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-xl bg-sky-100 flex items-center justify-center flex-shrink-0">
                      <ClipboardList className="w-4 h-4 text-sky-600" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-800">{d.period || 'DiagnÃ³stico'}</h4>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${d.status === 'concluido' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                          {d.status === 'concluido' ? 'ConcluÃ­do' : 'Rascunho'}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">MÃ©dia {avg}</span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">{dAreas.length} Ã¡rea(s) avaliada(s) Â· {new Date(d.createdAt).toLocaleDateString('pt-BR')}</p>
                      {d.observations && <p className="text-xs text-slate-500 mt-1">{d.observations}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button onClick={() => startEdit(d)} className="p-2 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={() => confirm('Excluir este diagnÃ³stico?') && deleteDiagnostic(d.id)} className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {dAreas.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {dAreas.map((a, i) => (
                      <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100">
                        <div className="w-8 h-8 rounded-lg bg-white border border-slate-100 flex items-center justify-center flex-shrink-0">
                          <span className="text-xs font-bold text-slate-600">{a.note}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-slate-700 truncate">{a.area}</p>
                          <p className="text-[10px] text-slate-400">{a.group}{a.maturity ? ` Â· ${a.maturity}` : ''}</p>
                        </div>
                        {a.comment && <p className="text-[10px] text-slate-400 italic hidden md:block max-w-[40%] truncate">{a.comment}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
