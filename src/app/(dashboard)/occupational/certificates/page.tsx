'use client'

import { useState } from 'react'
import { useOccupational } from '../context/OccupationalHealthContext'
import { Plus, X, Edit2, Trash2, HeartPulse, Search, Calendar, User, FileText, Upload } from 'lucide-react'

export default function CertificatesPage() {
  const occ = useOccupational()
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ employeeId: '', cid: '', cidDescription: '', diagnosis: '', startDate: '', endDate: '', daysCount: 0, doctorName: '', doctorCrm: '', certificateType: 'doenca', medicalLeave: false, notes: '' })

  const filtered = occ.certificates.filter(c => {
    const emp = occ.employees.find(e => e.id === c.employeeId)
    const q = search.toLowerCase()
    return !q || (emp?.name || '').toLowerCase().includes(q) || (c.cid || '').includes(q)
  })

  const typeBadge = (t: string) => {
    const map: Record<string, string> = { doenca: 'bg-rose-100 text-rose-700', acidente: 'bg-orange-100 text-orange-700', tratamento: 'bg-blue-100 text-blue-700', acompanhamento: 'bg-purple-100 text-purple-700', gestante: 'bg-pink-100 text-pink-700' }
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${map[t] || ''}`}>{t}</span>
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const emp = occ.employees.find(x => x.id === form.employeeId)
    const data = { ...form, companyId: emp?.companyId || '', companyName: emp?.companyName || '', daysCount: form.daysCount || Math.ceil((new Date(form.endDate).getTime() - new Date(form.startDate).getTime()) / 86400000) + 1 }
    if (editing) { occ.updateCertificate(editing, data) } else { occ.addCertificate(data) }
    setShowModal(false); setEditing(null)
    setForm({ employeeId: '', cid: '', cidDescription: '', diagnosis: '', startDate: '', endDate: '', daysCount: 0, doctorName: '', doctorCrm: '', certificateType: 'doenca', medicalLeave: false, notes: '' })
  }

  const openEdit = (id: string) => {
    const c = occ.certificates.find(x => x.id === id); if (!c) return
    setEditing(id); setForm({ employeeId: c.employeeId, cid: c.cid || '', cidDescription: c.cidDescription || '', diagnosis: c.diagnosis || '', startDate: c.startDate, endDate: c.endDate, daysCount: c.daysCount, doctorName: c.doctorName || '', doctorCrm: c.doctorCrm || '', certificateType: c.certificateType, medicalLeave: c.medicalLeave, notes: c.notes || '' })
    setShowModal(true)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><HeartPulse className="w-6 h-6 text-rose-600" /> Atestados Médicos</h1>
          <p className="text-slate-400 text-xs mt-1">Registro de atestados e licenças de saúde</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ employeeId: '', cid: '', cidDescription: '', diagnosis: '', startDate: '', endDate: '', daysCount: 0, doctorName: '', doctorCrm: '', certificateType: 'doenca', medicalLeave: false, notes: '' }); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl font-bold text-xs shadow-md">
          <Plus className="w-4 h-4" /> Novo Atestado
        </button>
      </div>

      <div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por colaborador ou CID..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs" /></div>

      <div className="grid gap-3">
        {filtered.map(c => {
          const emp = occ.employees.find(e => e.id === c.employeeId)
          return (
            <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-start justify-between hover:shadow-md transition-all">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500 to-pink-600 flex items-center justify-center text-white"><FileText className="w-5 h-5" /></div>
                <div>
                  <div className="flex items-center gap-2"><h3 className="font-bold text-sm text-slate-800">{emp?.name || 'N/A'}</h3>{typeBadge(c.certificateType)}{c.medicalLeave && <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded-md text-[10px] font-bold">Afastamento</span>}</div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>CID: <strong>{c.cid || 'N/A'}</strong></span>
                    <span>{new Date(c.startDate).toLocaleDateString('pt-BR')} → {new Date(c.endDate).toLocaleDateString('pt-BR')}</span>
                    <span><strong>{c.daysCount}</strong> {c.daysCount === 1 ? 'dia' : 'dias'}</span>
                  </div>
                  {c.diagnosis && <p className="text-xs text-slate-500 mt-1">{c.diagnosis}</p>}
                  <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-400"><User className="w-3 h-3" />{c.doctorName || 'Médico não informado'}{c.doctorCrm && <> · CRM {c.doctorCrm}</>}</div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(c.id)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir atestado?')) occ.deleteCertificate(c.id) }} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          )
        })}
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><HeartPulse className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="font-medium">Nenhum atestado registrado</p></div>}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">{editing ? 'Editar Atestado' : 'Novo Atestado'}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-5 space-y-3">
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Colaborador *</label>
                <select required value={form.employeeId} onChange={e => setForm({ ...form, employeeId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="">Selecione...</option>
                  {occ.employees.filter(e => e.status === 'ativo').map(e => <option key={e.id} value={e.id}>{e.name} — {e.companyName}</option>)}
                </select></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Tipo *</label>
                <select value={form.certificateType} onChange={e => setForm({ ...form, certificateType: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="doenca">Doença</option><option value="acidente">Acidente</option><option value="tratamento">Tratamento</option><option value="acompanhamento">Acompanhamento</option><option value="gestante">Gestante</option>
                </select></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Data Início *</label><input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Data Fim *</label><input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">CID</label><input value={form.cid} onChange={e => setForm({ ...form, cid: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Dias</label><input type="number" value={form.daysCount || ''} onChange={e => setForm({ ...form, daysCount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              </div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Diagnóstico</label><input value={form.diagnosis} onChange={e => setForm({ ...form, diagnosis: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">Médico</label><input value={form.doctorName} onChange={e => setForm({ ...form, doctorName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">CRM</label><input value={form.doctorCrm} onChange={e => setForm({ ...form, doctorCrm: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              </div>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={form.medicalLeave} onChange={e => setForm({ ...form, medicalLeave: e.target.checked })} className="rounded border-slate-300" /><span className="text-xs text-slate-600">Gerou afastamento do trabalho?</span></label>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Observações</label><textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm resize-none" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null) }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-rose-600 to-pink-600 text-white rounded-xl text-xs font-bold shadow-md">{editing ? 'Salvar' : 'Registrar Atestado'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
