'use client'

import { useState } from 'react'
import { useCadastros, Unit, Sector, JobRole, Collaborator } from './context/CadastrosContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { Plus, X, Building2, Layers, Briefcase, Users, Search, Edit2, Trash2, MapPin, ChevronDown, UserCheck, CalendarDays, Phone, Mail, Hash } from 'lucide-react'

type Tab = 'unidades' | 'setores' | 'cargos' | 'colaboradores'

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'unidades', label: 'Unidades', icon: Building2 },
  { key: 'setores', label: 'Setores', icon: Layers },
  { key: 'cargos', label: 'Cargos', icon: Briefcase },
  { key: 'colaboradores', label: 'Colaboradores', icon: Users },
]

const LEVEL_LABELS: Record<string, string> = { junior: 'Júnior', pleno: 'Pleno', senior: 'Sênior', master: 'Master', estagio: 'Estágio', trainee: 'Trainee' }
const STATUS_LABELS: Record<string, string> = { active: 'Ativo', inactive: 'Inativo', vacation: 'Férias', terminated: 'Desligado' }

export default function CadastrosPage() {
  const { units, sectors, jobRoles, collaborators, addUnit, updateUnit, deleteUnit, addSector, updateSector, deleteSector, addJobRole, updateJobRole, deleteJobRole, addCollaborator, updateCollaborator, deleteCollaborator } = useCadastros()
  const { companies } = useCrm()
  const [tab, setTab] = useState<Tab>('unidades')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const resetModal = () => { setShowModal(false); setEditingId(null) }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Cadastros Base</h1>
        <p className="text-slate-500 text-sm mt-0.5">Unidades, setores, cargos e colaboradores</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl w-fit">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${tab === t.key ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* Search + Add */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`Buscar ${TABS.find(t => t.key === tab)?.label.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl text-xs" />
        </div>
        <button onClick={() => { setEditingId(null); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 ml-auto">
          <Plus className="w-4 h-4" /> {TABS.find(t => t.key === tab)?.label.slice(0, -1) || 'Novo'}
        </button>
      </div>

      {/* Content */}
      {tab === 'unidades' && <UnitsTab units={units} companies={companies} onEdit={(u) => { setEditingId(u.id); setShowModal(true) }} onDelete={deleteUnit} />}
      {tab === 'setores' && <SectorsTab sectors={sectors} units={units} onEdit={(s) => { setEditingId(s.id); setShowModal(true) }} onDelete={deleteSector} />}
      {tab === 'cargos' && <RolesTab roles={jobRoles} onEdit={(r) => { setEditingId(r.id); setShowModal(true) }} onDelete={deleteJobRole} />}
      {tab === 'colaboradores' && <CollaboratorsTab collaborators={collaborators} sectors={sectors} jobRoles={jobRoles} companies={companies} units={units} onEdit={(c) => { setEditingId(c.id); setShowModal(true) }} onDelete={deleteCollaborator} />}

      {/* Modal */}
      {showModal && (
        <EntityModal tab={tab} editingId={editingId} units={units} sectors={sectors} jobRoles={jobRoles} collaborators={collaborators} companies={companies}
          onSave={(data) => {
            if (tab === 'unidades') { if (editingId) updateUnit(editingId, data as any); else addUnit(data as any) }
            else if (tab === 'setores') { if (editingId) updateSector(editingId, data as any); else addSector(data as any) }
            else if (tab === 'cargos') { if (editingId) updateJobRole(editingId, data as any); else addJobRole(data as any) }
            else if (tab === 'colaboradores') { if (editingId) updateCollaborator(editingId, data as any); else addCollaborator(data as any) }
            resetModal()
          }}
          onClose={resetModal}
        />
      )}
    </div>
  )
}

function UnitsTab({ units, companies, onEdit, onDelete }: { units: Unit[]; companies: any[]; onEdit: (u: Unit) => void; onDelete: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {units.map(u => {
        const comp = companies.find(c => c.id === u.companyId)
        return (
          <div key={u.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-50 rounded-xl"><Building2 className="w-5 h-5 text-violet-600" /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{u.name}</h3>
                  <p className="text-[10px] text-slate-400">{comp?.name || u.companyName}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(u)} className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-slate-50"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(u.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            <div className="flex items-center gap-1 mt-2 text-[10px] text-slate-400"><MapPin className="w-3 h-3" /> {u.city}/{u.state}</div>
            <span className={`inline-block mt-2 px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{u.status === 'active' ? 'Ativa' : 'Inativa'}</span>
          </div>
        )
      })}
    </div>
  )
}

function SectorsTab({ sectors, units, onEdit, onDelete }: { sectors: Sector[]; units: Unit[]; onEdit: (s: Sector) => void; onDelete: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sectors.map(s => {
        const unit = units.find(u => u.id === s.unitId)
        return (
          <div key={s.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-xl"><Layers className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{s.name}</h3>
                  <p className="text-[10px] text-slate-400">{unit?.name || s.unitName}</p>
                </div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => onEdit(s)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-slate-50"><Edit2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => onDelete(s.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
            </div>
            {s.description && <p className="text-[10px] text-slate-500 mt-2">{s.description}</p>}
            <span className={`inline-block mt-2 px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${s.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{s.status === 'active' ? 'Ativo' : 'Inativo'}</span>
          </div>
        )
      })}
    </div>
  )
}

function RolesTab({ roles, onEdit, onDelete }: { roles: JobRole[]; onEdit: (r: JobRole) => void; onDelete: (id: string) => void }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {roles.map(r => (
        <div key={r.id} className="bg-white rounded-2xl border border-slate-100 p-4 shadow-sm">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-50 rounded-xl"><Briefcase className="w-5 h-5 text-amber-600" /></div>
              <div>
                <h3 className="font-bold text-slate-800 text-sm">{r.name}</h3>
                <p className="text-[10px] text-slate-400">{r.department}</p>
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => onEdit(r)} className="p-1.5 text-slate-400 hover:text-amber-600 rounded-lg hover:bg-slate-50"><Edit2 className="w-3.5 h-3.5" /></button>
              <button onClick={() => onDelete(r.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-[10px] font-semibold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{LEVEL_LABELS[r.level]}</span>
            <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${r.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>{STATUS_LABELS[r.status]}</span>
          </div>
          {r.description && <p className="text-[10px] text-slate-500 mt-2">{r.description}</p>}
        </div>
      ))}
    </div>
  )
}

function CollaboratorsTab({ collaborators, sectors, jobRoles, companies, units, onEdit, onDelete }: { collaborators: Collaborator[]; sectors: Sector[]; jobRoles: JobRole[]; companies: any[]; units: Unit[]; onEdit: (c: Collaborator) => void; onDelete: (id: string) => void }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            <th className="text-left p-3 font-bold text-slate-500">Nome</th>
            <th className="text-left p-3 font-bold text-slate-500">CPF</th>
            <th className="text-left p-3 font-bold text-slate-500">Empresa</th>
            <th className="text-left p-3 font-bold text-slate-500">Setor</th>
            <th className="text-left p-3 font-bold text-slate-500">Cargo</th>
            <th className="text-left p-3 font-bold text-slate-500">Status</th>
            <th className="text-right p-3 font-bold text-slate-500">Ações</th>
          </tr>
        </thead>
        <tbody>
          {collaborators.map(c => (
            <tr key={c.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="p-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-white flex items-center justify-center text-[9px] font-bold">{c.name.charAt(0)}{c.name.split(' ')[1]?.charAt(0) || ''}</div>
                  <div>
                    <p className="font-bold text-slate-800">{c.name}</p>
                    <p className="text-[9px] text-slate-400">{c.email}</p>
                  </div>
                </div>
              </td>
              <td className="p-3 text-slate-600">{c.document}</td>
              <td className="p-3 text-slate-600">{c.companyName}</td>
              <td className="p-3 text-slate-600">{c.sectorName}</td>
              <td className="p-3 text-slate-600">{c.roleName}</td>
              <td className="p-3">
                <span className={`px-2 py-0.5 text-[9px] font-bold uppercase rounded-full ${
                  c.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  c.status === 'vacation' ? 'bg-blue-50 text-blue-700' :
                  c.status === 'terminated' ? 'bg-red-50 text-red-700' : 'bg-slate-100 text-slate-500'
                }`}>{STATUS_LABELS[c.status]}</span>
              </td>
              <td className="p-3 text-right">
                <div className="flex gap-1 justify-end">
                  <button onClick={() => onEdit(c)} className="p-1.5 text-slate-400 hover:text-violet-600 rounded-lg hover:bg-slate-50"><Edit2 className="w-3.5 h-3.5" /></button>
                  <button onClick={() => onDelete(c.id)} className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function EntityModal({ tab, editingId, units, sectors, jobRoles, collaborators, companies, onSave, onClose }: {
  tab: Tab; editingId: string | null; units: Unit[]; sectors: Sector[]; jobRoles: JobRole[]; collaborators: Collaborator[]; companies: any[]; onSave: (data: any) => void; onClose: () => void
}) {
  const editingUnit = editingId ? units.find(u => u.id === editingId) : null
  const editingSector = editingId ? sectors.find(s => s.id === editingId) : null
  const editingRole = editingId ? jobRoles.find(r => r.id === editingId) : null
  const editingCollab = editingId ? collaborators.find(c => c.id === editingId) : null

  const [form, setForm] = useState<any>(() => {
    if (tab === 'unidades') return { companyId: editingUnit?.companyId || '', name: editingUnit?.name || '', city: editingUnit?.city || '', state: editingUnit?.state || '', status: editingUnit?.status || 'active' }
    if (tab === 'setores') return { unitId: editingSector?.unitId || '', name: editingSector?.name || '', description: editingSector?.description || '', status: editingSector?.status || 'active' }
    if (tab === 'cargos') return { name: editingRole?.name || '', description: editingRole?.description || '', department: editingRole?.department || '', level: editingRole?.level || 'pleno', status: editingRole?.status || 'active' }
    if (tab === 'colaboradores') return { name: editingCollab?.name || '', email: editingCollab?.email || '', phone: editingCollab?.phone || '', document: editingCollab?.document || '', birthDate: editingCollab?.birthDate || '', roleId: editingCollab?.roleId || '', sectorId: editingCollab?.sectorId || '', companyId: editingCollab?.companyId || '', status: editingCollab?.status || 'active', startDate: editingCollab?.startDate || new Date().toISOString().split('T')[0], endDate: editingCollab?.endDate || '' }
    return {}
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (tab === 'unidades') {
      const comp = companies.find(c => c.id === form.companyId)
      onSave({ ...form, companyName: comp?.name || form.companyId })
    } else if (tab === 'setores') {
      const unit = units.find(u => u.id === form.unitId)
      onSave({ ...form, unitName: unit?.name || form.unitId })
    } else if (tab === 'colaboradores') {
      const role = jobRoles.find(r => r.id === form.roleId)
      const sector = sectors.find(s => s.id === form.sectorId)
      const comp = companies.find(c => c.id === form.companyId)
      onSave({ ...form, roleName: role?.name || '', sectorName: sector?.name || '', companyName: comp?.name || '' })
    } else {
      onSave(form)
    }
  }

  const labels: Record<Tab, { title: string; subtitle: string }> = {
    unidades: { title: editingId ? 'Editar Unidade' : 'Nova Unidade', subtitle: editingId ? 'Altere os dados da unidade' : 'Cadastre uma nova unidade' },
    setores: { title: editingId ? 'Editar Setor' : 'Novo Setor', subtitle: editingId ? 'Altere os dados do setor' : 'Cadastre um novo setor' },
    cargos: { title: editingId ? 'Editar Cargo' : 'Novo Cargo', subtitle: editingId ? 'Altere os dados do cargo' : 'Cadastre um novo cargo' },
    colaboradores: { title: editingId ? 'Editar Colaborador' : 'Novo Colaborador', subtitle: editingId ? 'Altere os dados do colaborador' : 'Cadastre um novo colaborador' },
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white">
          <div><h2 className="text-lg font-bold text-slate-800">{labels[tab].title}</h2><p className="text-sm text-slate-500">{labels[tab].subtitle}</p></div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'unidades' && (
            <>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Empresa *</label>
                <select required value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="">Selecione...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Nome da Unidade *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Matriz Rio" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Cidade *</label>
                  <input required value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Estado *</label>
                  <input required value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} maxLength={2} placeholder="RJ" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="active">Ativa</option><option value="inactive">Inativa</option></select></div>
            </>
          )}
          {tab === 'setores' && (
            <>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Unidade *</label>
                <select required value={form.unitId} onChange={e => setForm({ ...form, unitId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="">Selecione...</option>{units.filter(u => u.status === 'active').map(u => <option key={u.id} value={u.id}>{u.name} - {u.companyName}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Nome do Setor *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Administrativo" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
            </>
          )}
          {tab === 'cargos' && (
            <>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Nome do Cargo *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: Analista de RH" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Departamento *</label>
                <input required value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} placeholder="Ex: RH" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Nível</label>
                  <select value={form.level} onChange={e => setForm({ ...form, level: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    {Object.entries(LEVEL_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="active">Ativo</option><option value="inactive">Inativo</option></select></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" /></div>
            </>
          )}
          {tab === 'colaboradores' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Nome *</label>
                  <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">CPF *</label>
                  <input required value={form.document} onChange={e => setForm({ ...form, document: e.target.value })} placeholder="000.000.000-00" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">E-mail</label>
                  <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Telefone</label>
                  <input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Data Nascimento</label>
                  <input type="date" value={form.birthDate} onChange={e => setForm({ ...form, birthDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Empresa *</label>
                  <select required value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="">Selecione...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Cargo *</label>
                  <select required value={form.roleId} onChange={e => setForm({ ...form, roleId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="">Selecione...</option>{jobRoles.filter(r => r.status === 'active').map(r => <option key={r.id} value={r.id}>{r.name}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Setor *</label>
                  <select required value={form.sectorId} onChange={e => setForm({ ...form, sectorId: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="">Selecione...</option>{sectors.filter(s => s.status === 'active').map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Data Início *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Data Término</label>
                  <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              </div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="active">Ativo</option><option value="inactive">Inativo</option><option value="vacation">Férias</option><option value="terminated">Desligado</option></select></div>
            </>
          )}
          <div className="flex gap-3 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
            <button type="submit" className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">{editingId ? 'Salvar Alterações' : 'Criar'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
