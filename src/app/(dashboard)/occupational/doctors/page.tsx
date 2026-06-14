'use client'

import { useState } from 'react'
import { useOccupational } from '../context/OccupationalHealthContext'
import { Plus, X, Edit2, Trash2, Stethoscope, Search, User, Phone, Mail, MapPin, Building2 } from 'lucide-react'

export default function DoctorsPage() {
  const occ = useOccupational()
  const [tab, setTab] = useState<'doctors' | 'clinics'>('doctors')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', crm: '', crmUf: '', specialty: 'medico_trabalho', clinicId: '', phone: '', email: '' })

  const [showClinicModal, setShowClinicModal] = useState(false)
  const [editingClinic, setEditingClinic] = useState<string | null>(null)
  const [clinicForm, setClinicForm] = useState({ name: '', cnpj: '', phone: '', email: '', address: '', city: '', state: '', contactName: '' })

  const filteredDocs = occ.doctors.filter(d => {
    const q = search.toLowerCase()
    return !q || d.name.toLowerCase().includes(q) || d.crm.includes(q)
  })
  const filteredClinics = occ.clinics.filter(c => {
    const q = search.toLowerCase()
    return !q || c.name.toLowerCase().includes(q) || (c.city || '').toLowerCase().includes(q)
  })

  const handleSaveDoc = (e: React.FormEvent) => {
    e.preventDefault()
    const clinic = occ.clinics.find(c => c.id === form.clinicId)
    const data = { ...form, clinicName: clinic?.name || '', isActive: true }
    if (editing) { occ.updateDoctor(editing, data) } else { occ.addDoctor(data) }
    setShowModal(false); setEditing(null)
    setForm({ name: '', crm: '', crmUf: '', specialty: 'medico_trabalho', clinicId: '', phone: '', email: '' })
  }

  const handleSaveClinic = (e: React.FormEvent) => {
    e.preventDefault()
    const data = { ...clinicForm, isActive: true }
    if (editingClinic) { occ.updateClinic(editingClinic, data) } else { occ.addClinic(data) }
    setShowClinicModal(false); setEditingClinic(null)
    setClinicForm({ name: '', cnpj: '', phone: '', email: '', address: '', city: '', state: '', contactName: '' })
  }

  const specialtyLabel = (s?: string) => ({ medico_trabalho: 'Médico do Trabalho', clinico_geral: 'Clínico Geral', outros: 'Outros' }[s || ''] || s)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Stethoscope className="w-6 h-6 text-cyan-600" /> Médicos & Clínicas</h1>
          <p className="text-slate-400 text-xs mt-1">Cadastro de prestadores de saúde ocupacional</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button onClick={() => setTab('doctors')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'doctors' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Médicos ({occ.doctors.length})</button>
        <button onClick={() => setTab('clinics')} className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === 'clinics' ? 'bg-cyan-500 text-white shadow-lg shadow-cyan-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Clínicas ({occ.clinics.length})</button>
      </div>

      <div className="relative w-72"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs" /></div>

      {tab === 'doctors' && (
        <>
          <button onClick={() => { setEditing(null); setForm({ name: '', crm: '', crmUf: '', specialty: 'medico_trabalho', clinicId: '', phone: '', email: '' }); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-xs shadow-md mb-4">
            <Plus className="w-4 h-4" /> Novo Médico
          </button>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredDocs.map(d => (
              <div key={d.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold"><User className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">{d.name}</h3>
                      <p className="text-xs text-slate-400">CRM {d.crm}{d.crmUf ? `/${d.crmUf}` : ''}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{specialtyLabel(d.specialty)}</p>
                      {d.clinicName && <p className="text-[10px] text-slate-400 mt-1"><Building2 className="w-3 h-3 inline" /> {d.clinicName}</p>}
                      {(d.phone || d.email) && <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">{d.phone && <span><Phone className="w-3 h-3 inline" /> {d.phone}</span>}{d.email && <span><Mail className="w-3 h-3 inline" /> {d.email}</span>}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (confirm('Excluir médico?')) occ.deleteDoctor(d.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {tab === 'clinics' && (
        <>
          <button onClick={() => { setEditingClinic(null); setClinicForm({ name: '', cnpj: '', phone: '', email: '', address: '', city: '', state: '', contactName: '' }); setShowClinicModal(true) }}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl font-bold text-xs shadow-md mb-4">
            <Plus className="w-4 h-4" /> Nova Clínica
          </button>
          <div className="grid sm:grid-cols-2 gap-3">
            {filteredClinics.map(c => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center text-white"><Building2 className="w-5 h-5" /></div>
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">{c.name}</h3>
                      <p className="text-xs text-slate-400">{c.cnpj || ''}</p>
                      {(c.city || c.state) && <p className="text-xs text-slate-500 mt-0.5"><MapPin className="w-3 h-3 inline" /> {c.city}{c.state ? `/${c.state}` : ''}</p>}
                      {c.address && <p className="text-[10px] text-slate-400">{c.address}</p>}
                      {c.contactName && <p className="text-[10px] text-slate-400 mt-1">Contato: {c.contactName}</p>}
                      {(c.phone || c.email) && <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">{c.phone && <span><Phone className="w-3 h-3 inline" /> {c.phone}</span>}{c.email && <span><Mail className="w-3 h-3 inline" /> {c.email}</span>}</div>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                    <button onClick={() => { if (confirm('Excluir clínica?')) occ.deleteClinic(c.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {filteredDocs.length === 0 && filteredClinics.length === 0 && tab === 'doctors' && <div className="text-center py-16 text-slate-400"><Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="font-medium">Nenhum médico cadastrado</p></div>}

      {/* Doctor Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowModal(false); setEditing(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">{editing ? 'Editar Médico' : 'Novo Médico'}</h2>
              <button onClick={() => { setShowModal(false); setEditing(null) }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveDoc} className="p-5 space-y-3">
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Nome *</label><input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">CRM *</label><input required value={form.crm} onChange={e => setForm({ ...form, crm: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">UF CRM</label><input value={form.crmUf} onChange={e => setForm({ ...form, crmUf: e.target.value })} maxLength={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              </div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Especialidade</label>
                <select value={form.specialty} onChange={e => setForm({ ...form, specialty: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="medico_trabalho">Médico do Trabalho</option><option value="clinico_geral">Clínico Geral</option><option value="outros">Outros</option>
                </select></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Clínica</label>
                <select value={form.clinicId} onChange={e => setForm({ ...form, clinicId: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm">
                  <option value="">Nenhuma</option>{occ.clinics.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-400 mb-1 block">Telefone</label><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">E-mail</label><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowModal(false); setEditing(null) }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold shadow-md">{editing ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Clinic Modal */}
      {showClinicModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowClinicModal(false); setEditingClinic(null) }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-bold text-slate-800">{editingClinic ? 'Editar Clínica' : 'Nova Clínica'}</h2>
              <button onClick={() => { setShowClinicModal(false); setEditingClinic(null) }} className="p-1.5 rounded-lg hover:bg-slate-100"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveClinic} className="p-5 space-y-3">
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Nome *</label><input required value={clinicForm.name} onChange={e => setClinicForm({ ...clinicForm, name: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">CNPJ</label><input value={clinicForm.cnpj} onChange={e => setClinicForm({ ...clinicForm, cnpj: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-400 mb-1 block">Telefone</label><input value={clinicForm.phone} onChange={e => setClinicForm({ ...clinicForm, phone: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">E-mail</label><input value={clinicForm.email} onChange={e => setClinicForm({ ...clinicForm, email: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Endereço</label><input value={clinicForm.address} onChange={e => setClinicForm({ ...clinicForm, address: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              <div className="grid grid-cols-2 gap-3"><div><label className="text-xs font-bold text-slate-400 mb-1 block">Cidade</label><input value={clinicForm.city} onChange={e => setClinicForm({ ...clinicForm, city: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
                <div><label className="text-xs font-bold text-slate-400 mb-1 block">UF</label><input value={clinicForm.state} onChange={e => setClinicForm({ ...clinicForm, state: e.target.value })} maxLength={2} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div></div>
              <div><label className="text-xs font-bold text-slate-400 mb-1 block">Contato</label><input value={clinicForm.contactName} onChange={e => setClinicForm({ ...clinicForm, contactName: e.target.value })} className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowClinicModal(false); setEditingClinic(null) }} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold">Cancelar</button>
                <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl text-xs font-bold shadow-md">{editingClinic ? 'Salvar' : 'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
