'use client'

import { useState } from 'react'
import { useOccupational } from '../context/OccupationalHealthContext'
import { Plus, X, Edit2, Trash2, UserCheck, Search, Calendar, User, ClipboardList, AlertTriangle } from 'lucide-react'

export default function ReturnToWorkPage() {
  const occ = useOccupational()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ employeeId: '', absenceId: '', returnDate: '', returnType: 'normal', gradualHours: 0, gradualDays: 0, doctorRecommendations: '', restrictions: '', followUpRequired: false, followUpDate: '', notes: '' })

  const filtered = occ.returnToWorks.filter(r => {
    const emp = occ.employees.find(e => e.id === r.employeeId)
    const q = search.toLowerCase()
    return !q || (emp?.name || '').toLowerCase().includes(q)
  })

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { planejado: 'bg-blue-100 text-blue-700', em_andamento: 'bg-amber-100 text-amber-700', concluido: 'bg-emerald-100 text-emerald-700', cancelado: 'bg-slate-100 text-slate-500' }
    return <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${map[s] || ''}`}>{s.replace(/_/g, ' ')}</span>
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const emp = occ.employees.find(x => x.id === form.employeeId)
    const data = { ...form, companyId: emp?.companyId || '', companyName: emp?.companyName || '', status: 'planejado' as const }
    if (editing) { occ.updateReturnToWork(editing, data) } else { occ.addReturnToWork(data) }
    setShowModal(false); setEditing(null)
    setForm({ employeeId: '', absenceId: '', returnDate: '', returnType: 'normal', gradualHours: 0, gradualDays: 0, doctorRecommendations: '', restrictions: '', followUpRequired: false, followUpDate: '', notes: '' })
  }

  const openEdit = (id: string) => {
    const r = occ.returnToWorks.find(x => x.id === id); if (!r) return
    setEditing(id); setForm({ employeeId: r.employeeId, absenceId: r.absenceId || '', returnDate: r.returnDate, returnType: r.returnType, gradualHours: r.gradualHours || 0, gradualDays: r.gradualDays || 0, doctorRecommendations: r.doctorRecommendations || '', restrictions: r.restrictions || '', followUpRequired: r.followUpRequired, followUpDate: r.followUpDate || '', notes: r.notes || '' })
    setShowModal(true)
  }

  const activeCount = occ.returnToWorks.filter(r => r.status === 'planejado' || r.status === 'em_andamento').length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><UserCheck className="w-6 h-6 text-green-600" /> Retorno ao Trabalho</h1>
          <p className="text-slate-400 text-xs mt-1">Planejamento e acompanhamento de reintegração</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ employeeId: '', absenceId: '', returnDate: '', returnType: 'normal', gradualHours: 0, gradualDays: 0, doctorRecommendations: '', restrictions: '', followUpRequired: false, followUpDate: '', notes: '' }); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl font-bold text-xs shadow-md">
          <Plus className="w-4 h-4" /> Novo Retorno
        </button>
      </div>

      {activeCount > 0 && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-3">
          <UserCheck className="w-5 h-5 text-green-600 shrink-0" />
          <p className="text-sm text-green-800 font-medium">{activeCount} retorno{activeCount > 1 ? 's' : ''} em andamento</p>
        </div>
      )}

      <div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs" /></div>

      <div className="grid gap-3">
        {filtered.map(r => {
          const emp = occ.employees.find(e => e.id === r.employeeId)
          return (
            <div key={r.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${r.status === 'concluido' ? 'bg-emerald-500' : 'bg-gradient-to-br from-green-500 to-emerald-600'}`}><UserCheck className="w-5 h-5" /></div>
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-bold text-sm text-slate-800">{emp?.name || 'N/A'}</h3>{statusBadge(r.status)}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />Retorno: {new Date(r.returnDate).toLocaleDateString('pt-BR')}</span>
                    <span className="capitalize">Tipo: {r.returnType.replace(/_/g, ' ')}</span>
                    {r.gradualDays != null && r.gradualDays > 0 && <span>Adaptação: {r.gradualDays} dias ({r.gradualHours ?? 0}h/dia)</span>}
                  </div>
                  {r.doctorRecommendations && <p className="text-xs text-slate-500 mt-1">{r.doctorRecommendations}</p>}
                  {r.restrictions && <p className="text-xs text-amber-600 mt-0.5 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Restrições: {r.restrictions}</p>}
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(r.id)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir?')) occ.deleteReturnToWork(r.id) }} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><UserCheck className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="font-medium">Nenhum retorno registrado</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">{editing ? 'Editar Retorno' : 'Novo Retorno ao Trabalho'}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Colaborador *</label>
                <select required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="">Selecione...</option>
                  {occ.employees.filter(e => e.status === 'afastado' || e.status === 'ativo').map(e => <option key={e.id} value={e.id}>{e.name} — {e.companyName}</option>)}
                </select></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Vincular Afastamento</label>
                <select value={form.absenceId} onChange={e => setForm({ ...form, absenceId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="">Nenhum</option>
                  {occ.absences.filter(a => a.status === 'ativo').map(a => {
                    const emp = occ.employees.find(e => e.id === a.employeeId)
                    return <option key={a.id} value={a.id}>{emp?.name || 'N/A'} — {a.absenceType}</option>
                  })}
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Data Retorno *</label><input required type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Tipo de Retorno *</label>
                  <select value={form.returnType} onChange={e => setForm({ ...form, returnType: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                    <option value="normal">Normal</option><option value="gradual">Gradual</option><option value="reabilitacao">Reabilitação</option><option value="readaptacao">Readapatação</option>
                  </select></div>
              </div>
              {form.returnType === 'gradual' && <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Horas/dia</label><input type="number" value={form.gradualHours} onChange={e => setForm({ ...form, gradualHours: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Dias de Adaptação</label><input type="number" value={form.gradualDays} onChange={e => setForm({ ...form, gradualDays: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              </div>}
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Recomendações Médicas</label><textarea value={form.doctorRecommendations} onChange={e => setForm({ ...form, doctorRecommendations: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none" /></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Restrições</label><textarea value={form.restrictions} onChange={e => setForm({ ...form, restrictions: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.followUpRequired} onChange={e => setForm({ ...form, followUpRequired: e.target.checked })} className="rounded border-slate-300" /><span className="text-xs text-slate-600">Necessita follow-up</span></label>
                {form.followUpRequired && <div><label className="text-xs font-bold text-slate-400 mb-1 block">Data Follow-up</label><input type="date" value={form.followUpDate} onChange={e => setForm({ ...form, followUpDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null) }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl text-xs font-bold shadow-md">{editing ? 'Salvar' : 'Registrar Retorno'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
