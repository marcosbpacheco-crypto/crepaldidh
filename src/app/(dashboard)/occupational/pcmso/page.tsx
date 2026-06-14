'use client'

import { useState } from 'react'
import { useOccupational } from '../context/OccupationalHealthContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { Plus, X, Edit2, Trash2, FileText, Shield, Calendar, Building2, User, ChevronRight, Clipboard } from 'lucide-react'

export default function PcmsoPage() {
  const occ = useOccupational()
  const crm = useCrm()
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({
    companyId: '', programType: 'completo', riskClassification: '3',
    totalEmployees: 0, startDate: '', endDate: '', renewalDate: '',
    coordinatorDoctorId: '', clinicalDirectorId: '', objectives: '', scope: '', methodology: '', notes: '',
  })

  const openEdit = (id: string) => {
    const p = occ.pcmsoList.find(x => x.id === id)
    if (!p) return
    setEditing(id)
    setForm({
      companyId: p.companyId, programType: p.programType, riskClassification: p.riskClassification || '3',
      totalEmployees: p.totalEmployees, startDate: p.startDate, endDate: p.endDate, renewalDate: p.renewalDate || '',
      coordinatorDoctorId: p.coordinatorDoctorId || '', clinicalDirectorId: p.clinicalDirectorId || '',
      objectives: p.objectives || '', scope: p.scope || '', methodology: p.methodology || '', notes: p.notes || '',
    })
    setShowModal(true)
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    const comp = crm.companies.find(c => c.id === form.companyId)
    const coord = occ.doctors.find(d => d.id === form.coordinatorDoctorId)
    const clin = occ.doctors.find(d => d.id === form.clinicalDirectorId)
    const data = {
      ...form,
      companyName: comp?.name || comp?.tradeName || form.companyId,
      coordinatorDoctorName: coord?.name,
      clinicalDirectorName: clin?.name,
      status: 'vigente' as const,
    }
    if (editing) {
      occ.updatePcmso(editing, data)
    } else {
      occ.addPcmso(data)
    }
    setShowModal(false); setEditing(null)
    setForm({ companyId: '', programType: 'completo', riskClassification: '3', totalEmployees: 0, startDate: '', endDate: '', renewalDate: '', coordinatorDoctorId: '', clinicalDirectorId: '', objectives: '', scope: '', methodology: '', notes: '' })
  }

  const statusBadge = (s: string) => {
    const map: Record<string, string> = { vigente: 'bg-emerald-100 text-emerald-700', vencido: 'bg-red-100 text-red-700', cancelado: 'bg-slate-100 text-slate-500', rascunho: 'bg-amber-100 text-amber-700' }
    return <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${map[s] || 'bg-slate-100 text-slate-500'}`}>{s}</span>
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2">
            <Clipboard className="w-6 h-6 text-emerald-600" /> PCMSO
          </h1>
          <p className="text-slate-400 text-xs mt-1">Programa de Controle Médico de Saúde Ocupacional</p>
        </div>
        <button onClick={() => { setEditing(null); setForm({ companyId: '', programType: 'completo', riskClassification: '3', totalEmployees: 0, startDate: '', endDate: '', renewalDate: '', coordinatorDoctorId: '', clinicalDirectorId: '', objectives: '', scope: '', methodology: '', notes: '' }); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-bold text-xs shadow-md hover:opacity-90 transition-all">
          <Plus className="w-4 h-4" /> Novo PCMSO
        </button>
      </div>

      <div className="grid gap-4">
        {occ.pcmsoList.map(p => (
          <div key={p.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-200">
                  <Shield className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-800">{p.companyName}</h3>
                    {statusBadge(p.status)}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><Building2 className="w-3.5 h-3.5" />{p.companyName}</span>
                    <span className="flex items-center gap-1"><User className="w-3.5 h-3.5" />{p.coordinatorDoctorName || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{new Date(p.startDate).toLocaleDateString('pt-BR')} → {new Date(p.endDate).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-2">{p.objectives || 'Sem descrição'}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-semibold">Tipo: {p.programType}</span>
                    <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-semibold">{p.totalEmployees} colaboradores</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => openEdit(p.id)} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-emerald-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => { if (confirm('Excluir PCMSO?')) occ.deletePcmso(p.id) }} className="p-2 rounded-xl hover:bg-red-50 text-slate-400 hover:text-red-500 transition-all"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
        {occ.pcmsoList.length === 0 && (
          <div className="text-center py-16 text-slate-400"><Shield className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="font-medium">Nenhum PCMSO cadastrado</p><p className="text-xs mt-1">Clique em "Novo PCMSO" para começar</p></div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-bold text-slate-800">{editing ? 'Editar PCMSO' : 'Novo PCMSO'}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Cliente *</label>
                <select required value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                  <option value="">Selecione...</option>
                  {crm.companies.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Tipo de Programa</label>
                  <select value={form.programType} onChange={e => setForm({ ...form, programType: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                    <option value="completo">Completo</option>
                    <option value="simplificado">Simplificado</option>
                    <option value="setorial">Setorial</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Classificação de Risco</label>
                  <select value={form.riskClassification} onChange={e => setForm({ ...form, riskClassification: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                    <option value="1">Grau 1</option><option value="2">Grau 2</option><option value="3">Grau 3</option><option value="4">Grau 4</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Data Início *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Data Fim *</label>
                  <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Data Renovação</label>
                  <input type="date" value={form.renewalDate} onChange={e => setForm({ ...form, renewalDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Total Colaboradores</label>
                  <input type="number" value={form.totalEmployees} onChange={e => setForm({ ...form, totalEmployees: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Médico Coordenador</label>
                  <select value={form.coordinatorDoctorId} onChange={e => setForm({ ...form, coordinatorDoctorId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                    <option value="">Selecione...</option>
                    {occ.doctors.map(d => <option key={d.id} value={d.id}>{d.name} — CRM {d.crm}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-400 mb-1 block">Diretor Clínico</label>
                  <select value={form.clinicalDirectorId} onChange={e => setForm({ ...form, clinicalDirectorId: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm">
                    <option value="">Selecione...</option>
                    {occ.doctors.map(d => <option key={d.id} value={d.id}>{d.name} — CRM {d.crm}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Objetivos</label>
                <textarea value={form.objectives} onChange={e => setForm({ ...form, objectives: e.target.value })} rows={2}
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null) }}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl text-xs font-bold shadow-md">{editing ? 'Salvar' : 'Criar PCMSO'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
