'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useAdmin, type ModuleName } from './context/AdminContext'
import {
  Shield, Users, Key, FileSearch, Scale, Settings, Plus, Edit2, Trash2,
  Check, X, AlertTriangle, Search, Download, Eye, ToggleLeft, ToggleRight,
  Activity, LogIn, LogOut, UserPlus, Clock, Globe, Lock, Unlock,
} from 'lucide-react'

const TABS = [
  { key: 'users', label: 'Usuários', icon: <Users className="w-4 h-4" /> },
  { key: 'permissions', label: 'Permissões', icon: <Key className="w-4 h-4" /> },
  { key: 'audit', label: 'Auditoria', icon: <FileSearch className="w-4 h-4" /> },
  { key: 'lgpd', label: 'LGPD', icon: <Scale className="w-4 h-4" /> },
  { key: 'config', label: 'Configurações', icon: <Settings className="w-4 h-4" /> },
]

const MODULE_LABELS: Record<ModuleName, string> = {
  crm: 'CRM', clients: 'Clientes', projects: 'Projetos', nr01: 'NR-01',
  mentoring: 'Mentorias', trainings: 'Treinamentos', financial: 'Financeiro',
  calendar: 'Agenda', portal: 'Portal', documents: 'Documentos', bi: 'BI', ai: 'IA', admin: 'Admin',
  tasks: 'Tarefas', alerts: 'Alertas', import: 'Importação', assessoria: 'Assessoria Empresarial',
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Login', logout: 'Logout', create: 'Criação', update: 'Alteração', delete: 'Exclusão',
  download: 'Download', export: 'Exportação', view: 'Visualização',
}

function ActionIcon({ action }: { action: string }) {
  const cls = 'w-4 h-4'
  switch (action) {
    case 'login': return <LogIn className={`${cls} text-emerald-600`} />
    case 'logout': return <LogOut className={`${cls} text-slate-600`} />
    case 'create': return <UserPlus className={`${cls} text-blue-600`} />
    case 'update': return <Edit2 className={`${cls} text-amber-600`} />
    case 'delete': return <Trash2 className={`${cls} text-red-600`} />
    case 'download': return <Download className={`${cls} text-violet-600`} />
    case 'export': return <Activity className={`${cls} text-cyan-600`} />
    case 'view': return <Eye className={`${cls} text-slate-600`} />
    default: return <Activity className={`${cls} text-slate-400`} />
  }
}

export default function AdminPage() {
  const admin = useAdmin()
  const [tab, setTab] = useState('users')
  const [searchUser, setSearchUser] = useState('')
  const [searchAudit, setSearchAudit] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editUserId, setEditUserId] = useState<string | null>(null)
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', phone: '', roleId: 'role-consultant', isExternal: false, companyId: '', companyName: '' })
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [privacyForm, setPrivacyForm] = useState({ userId: '', requestType: 'access', description: '' })
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', phone: '', roleId: 'role-consultant', isExternal: false, companyId: '', companyName: '' })

  const filteredUsers = useMemo(() =>
    admin.users.filter(u => {
      if (searchUser) { const q = searchUser.toLowerCase(); return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.roleName.toLowerCase().includes(q) }
      return true
    }),
    [admin.users, searchUser]
  )

  const filteredAuditLogs = useMemo(() =>
    admin.auditLogs.filter(a => {
      if (searchAudit) { const q = searchAudit.toLowerCase(); return a.userName.toLowerCase().includes(q) || a.action.toLowerCase().includes(q) || a.entity.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) }
      return true
    }),
    [admin.auditLogs, searchAudit]
  )

  const pendingPrivacyRequests = admin.privacyRequests.filter(r => r.status === 'pending')

  const openEditUser = (u: typeof admin.users[0]) => {
    setEditUserId(u.id)
    setEditUserForm({ name: u.name, email: u.email, phone: u.phone, roleId: u.roleId, isExternal: u.isExternal, companyId: u.companyId || '', companyName: u.companyName || '' })
    setShowEditUser(true)
  }

  const handleEditUser = () => {
    if (!editUserId || !editUserForm.name.trim() || !editUserForm.email.trim()) return
    const role = admin.roles.find(r => r.id === editUserForm.roleId)
    const originalUser = admin.users.find(u => u.id === editUserId)
    admin.updateUser(editUserId, {
      name: editUserForm.name, email: editUserForm.email, phone: editUserForm.phone,
      avatar: editUserForm.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
      roleId: editUserForm.roleId, roleName: role?.label || 'Sem perfil', isExternal: editUserForm.isExternal,
      companyId: editUserForm.companyId || undefined, companyName: editUserForm.companyName || undefined,
    })
    admin.addAuditLog({
      userId: admin.currentUserId || '', userName: admin.currentUser?.name || 'Sistema', userRole: 'admin',
      action: 'update', entity: 'user', entityId: editUserId,
      description: `Editou usuário: ${originalUser?.name || 'N/A'}`,
      ipAddress: '127.0.0.1',
    })
    setShowEditUser(false)
    setEditUserId(null)
  }

  const handleAddUser = () => {
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) return
    const role = admin.roles.find(r => r.id === newUserForm.roleId)
    admin.addUser({
      name: newUserForm.name, email: newUserForm.email, phone: newUserForm.phone, avatar: newUserForm.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
      roleId: newUserForm.roleId, roleName: role?.label || 'Sem perfil', isExternal: newUserForm.isExternal,
      companyId: newUserForm.companyId || undefined, companyName: newUserForm.companyName || undefined,
      active: true, password: '123456', loginAttempts: 0, mfaEnabled: false,
    })
    setShowAddUser(false); setNewUserForm({ name: '', email: '', phone: '', roleId: 'role-consultant', isExternal: false, companyId: '', companyName: '' })
  }

  const handlePrivacyRequest = () => {
    const user = admin.users.find(u => u.id === privacyForm.userId)
    admin.addPrivacyRequest({ userId: privacyForm.userId, userName: user?.name || 'N/A', requestType: privacyForm.requestType, status: 'pending', description: privacyForm.description })
    setShowPrivacyModal(false); setPrivacyForm({ userId: '', requestType: 'access', description: '' })
  }

  // ── RENDER: USERS ────────────────────────────
  const renderUsers = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs"><Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Buscar usuários..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
        {admin.checkPermission('admin', 'create') && <button onClick={() => setShowAddUser(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-xl hover:bg-violet-700 transition-colors"><Plus className="w-3.5 h-3.5" /> Novo Usuário</button>}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Usuário</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Perfil</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Tipo</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Empresa</th>
              <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Status</th>
              <th className="text-center px-4 py-2.5 font-semibold text-slate-500">MFA</th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Ações</th>
            </tr></thead>
            <tbody>
              {filteredUsers.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${u.active ? 'bg-gradient-to-br from-violet-500 to-purple-600' : 'bg-slate-300'}`}>{u.avatar}</div>
                      <div><p className="font-semibold text-slate-800">{u.name}</p><p className="text-[10px] text-slate-400">{u.email}</p></div>
                    </div>
                  </td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-violet-50 border border-violet-100 rounded text-[10px] font-semibold text-violet-700">{u.roleName}</span></td>
                  <td className="px-4 py-3"><span className={`text-[10px] font-semibold ${u.isExternal ? 'text-amber-600' : 'text-blue-600'}`}>{u.isExternal ? 'Externo' : 'Interno'}</span></td>
                  <td className="px-4 py-3 text-slate-600">{u.companyName || '-'}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${u.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {u.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} {u.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {u.mfaEnabled ? <Lock className="w-3.5 h-3.5 text-emerald-600 mx-auto" /> : <Unlock className="w-3.5 h-3.5 text-slate-300 mx-auto" />}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {admin.checkPermission('admin', 'edit') && <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>}
                      {admin.checkPermission('admin', 'edit') && <button onClick={() => admin.toggleUserActive(u.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title={u.active ? 'Desativar' : 'Ativar'}>
                        {u.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                      </button>}
                      {admin.checkPermission('admin', 'delete') && <button onClick={() => admin.deleteUser(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && <div className="p-12 text-center text-slate-400 text-xs">Nenhum usuário encontrado</div>}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm"><p className="text-[9px] font-semibold text-slate-400 uppercase">Total</p><p className="text-lg font-black text-slate-800">{admin.users.length}</p></div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm"><p className="text-[9px] font-semibold text-slate-400 uppercase">Ativos</p><p className="text-lg font-black text-emerald-600">{admin.users.filter(u => u.active).length}</p></div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm"><p className="text-[9px] font-semibold text-slate-400 uppercase">Externos</p><p className="text-lg font-black text-amber-600">{admin.users.filter(u => u.isExternal).length}</p></div>
        <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm"><p className="text-[9px] font-semibold text-slate-400 uppercase">MFA Ativo</p><p className="text-lg font-black text-violet-600">{admin.users.filter(u => u.mfaEnabled).length}</p></div>
      </div>

      {showAddUser && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowAddUser(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">Novo Usuário</h3>
            <div className="space-y-3">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nome</label><input value={newUserForm.name} onChange={e => setNewUserForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Email</label><input value={newUserForm.email} onChange={e => setNewUserForm(p => ({ ...p, email: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Telefone</label><input value={newUserForm.phone} onChange={e => setNewUserForm(p => ({ ...p, phone: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Perfil</label>
                <select value={newUserForm.roleId} onChange={e => setNewUserForm(p => ({ ...p, roleId: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200">
                  {admin.roles.filter(r => !r.isExternal).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={newUserForm.isExternal} onChange={e => setNewUserForm(p => ({ ...p, isExternal: e.target.checked }))} className="rounded border-slate-300" />
                <span className="text-[11px] text-slate-600">Usuário externo (cliente)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handleAddUser} className="flex-1 px-3 py-2 bg-violet-600 text-white text-[11px] font-bold rounded-xl hover:bg-violet-700 transition-colors">Criar Usuário</button>
              <button onClick={() => setShowAddUser(false)} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {showEditUser && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => { setShowEditUser(false); setEditUserId(null) }}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">Editar Usuário</h3>
            <div className="space-y-3">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nome</label><input value={editUserForm.name} onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Email</label><input value={editUserForm.email} onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Telefone</label><input value={editUserForm.phone} onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Perfil</label>
                <select value={editUserForm.roleId} onChange={e => setEditUserForm(p => ({ ...p, roleId: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200">
                  {admin.roles.filter(r => !r.isExternal).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editUserForm.isExternal} onChange={e => setEditUserForm(p => ({ ...p, isExternal: e.target.checked }))} className="rounded border-slate-300" />
                <span className="text-[11px] text-slate-600">Usuário externo (cliente)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handleEditUser} className="flex-1 px-3 py-2 bg-violet-600 text-white text-[11px] font-bold rounded-xl hover:bg-violet-700 transition-colors">Salvar Alterações</button>
              <button onClick={() => { setShowEditUser(false); setEditUserId(null) }} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  // ── RENDER: PERMISSIONS ──────────────────────
  const renderPermissions = () => {
    const [selectedRole, setSelectedRole] = useState('role-admin')
    const rolePerms = admin.getPermissionsForRole(selectedRole)
    const [draft, setDraft] = useState<Record<string, Record<string, boolean>>>(() => {
      const init: Record<string, Record<string, boolean>> = {}
      for (const p of rolePerms) {
        init[p.id] = { canView: p.canView, canCreate: p.canCreate, canEdit: p.canEdit, canDelete: p.canDelete, canExport: p.canExport }
      }
      return init
    })
    const FIELDS = ['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport'] as const

    useEffect(() => {
      const init: Record<string, Record<string, boolean>> = {}
      for (const p of rolePerms) {
        init[p.id] = { canView: p.canView, canCreate: p.canCreate, canEdit: p.canEdit, canDelete: p.canDelete, canExport: p.canExport }
      }
      setDraft(init)
    }, [selectedRole])

    const toggleDraft = (permId: string, field: string) => {
      if (!admin.checkPermission('admin', 'edit')) return
      setDraft(prev => ({
        ...prev,
        [permId]: { ...prev[permId], [field]: !prev[permId]?.[field] }
      }))
    }

    const toggleAllForRow = (permId: string, value: boolean) => {
      if (!admin.checkPermission('admin', 'edit')) return
      setDraft(prev => ({
        ...prev,
        [permId]: { canView: value, canCreate: value, canEdit: value, canDelete: value, canExport: value }
      }))
    }

    const hasChanges = rolePerms.some(p => {
      const d = draft[p.id]
      return d && (d.canView !== p.canView || d.canCreate !== p.canCreate || d.canEdit !== p.canEdit || d.canDelete !== p.canDelete || d.canExport !== p.canExport)
    })

    const saveChanges = () => {
      for (const p of rolePerms) {
        const d = draft[p.id]
        if (!d) continue
        for (const field of FIELDS) {
          if (d[field] !== p[field]) {
            admin.updatePermission(p.id, field, d[field])
          }
        }
      }
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <label className="text-[9px] font-semibold text-slate-400 uppercase">Perfil:</label>
            <select value={selectedRole} onChange={e => setSelectedRole(e.target.value)}
              className="text-[11px] border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
              {admin.roles.filter(r => !r.isExternal).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
            </select>
          </div>
          {admin.checkPermission('admin', 'edit') && (
            <button onClick={saveChanges} disabled={!hasChanges}
              className={`px-4 py-1.5 text-[11px] font-bold rounded-xl transition-all ${hasChanges ? 'bg-violet-600 text-white hover:bg-violet-700 shadow-sm' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}>
              {hasChanges ? 'Salvar Alterações' : 'Salvo'}
            </button>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead><tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Módulo</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500" style={{width: 40}}>
                  <span className="text-[8px] text-slate-400">Sel.</span>
                </th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Visualizar</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Criar</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Editar</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Excluir</th>
                <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Exportar</th>
              </tr></thead>
              <tbody>
                {rolePerms.map(p => {
                  const rowDraft = draft[p.id] || { canView: false, canCreate: false, canEdit: false, canDelete: false, canExport: false }
                  const allOn = FIELDS.every(f => rowDraft[f])
                  return (
                    <tr key={p.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-2.5 font-semibold text-slate-700">{MODULE_LABELS[p.module] || p.module}</td>
                      <td className="px-4 py-2.5 text-center">
                        <button onClick={() => toggleAllForRow(p.id, !allOn)}
                          className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold transition-colors ${allOn ? 'bg-violet-100 text-violet-700 border border-violet-200' : 'bg-slate-50 text-slate-300 border border-slate-100 hover:border-slate-200'}`}>
                          {allOn ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        </button>
                      </td>
                      {FIELDS.map(field => (
                        <td key={field} className="px-4 py-2.5 text-center">
                          <button onClick={() => toggleDraft(p.id, field)}
                            className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${rowDraft[field] ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-50 text-slate-300 border border-slate-100 hover:border-slate-200'} ${!admin.checkPermission('admin', 'edit') ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
                            {rowDraft[field] ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                      ))}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // ── RENDER: AUDIT ────────────────────────────
  const renderAudit = () => (
    <div className="space-y-4">
      <div className="relative max-w-xs"><Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={searchAudit} onChange={e => setSearchAudit(e.target.value)} placeholder="Buscar nos logs..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-50">
          {filteredAuditLogs.length === 0 && <div className="p-12 text-center text-slate-400 text-xs">Nenhum registro de auditoria</div>}
          {filteredAuditLogs.map(a => (
            <div key={a.id} className="flex items-start gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
              <div className="mt-0.5"><ActionIcon action={a.action} /></div>
              <div className="flex-1 min-w-0">
                <p className="text-[12px] font-semibold text-slate-700">{ACTION_LABELS[a.action] || a.action} — <span className="text-slate-500">{a.entity}</span></p>
                <p className="text-[11px] text-slate-500">{a.description}</p>
                <div className="flex items-center gap-3 mt-1 text-[9px] text-slate-400">
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {a.userName}</span>
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(a.createdAt).toLocaleString('pt-BR')}</span>
                  <span className="flex items-center gap-1"><Globe className="w-3 h-3" /> {a.ipAddress}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  // ── RENDER: LGPD ─────────────────────────────
  const renderLgpd = () => (
    <div className="space-y-6">
      {/* Consentimentos */}
      <div>
        <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><Scale className="w-4 h-4 text-violet-600" /> Consentimentos LGPD</h3>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Usuário</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Tipo</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Base Legal</th>
              <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Status</th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Ações</th>
            </tr></thead>
            <tbody>
              {admin.lgpdConsents.map(c => {
                const user = admin.users.find(u => u.id === c.userId)
                return (
                  <tr key={c.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-700">{user?.name || 'N/A'}</td>
                    <td className="px-4 py-3 text-slate-600">{c.consentType}</td>
                    <td className="px-4 py-3 text-[10px] text-slate-500">{c.legalBasis}</td>
                    <td className="px-4 py-3 text-center">
                      {c.granted ? <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">Consentido</span>
                        : <span className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[10px] font-semibold">Revogado</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {c.granted && (
                        <button onClick={() => admin.revokeLgpdConsent(c.id)} className="px-2 py-1 text-[9px] font-semibold text-red-600 hover:bg-red-50 rounded-lg">Revogar</button>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Solicitações de Privacidade */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><FileSearch className="w-4 h-4 text-violet-600" /> Solicitações de Privacidade
            {pendingPrivacyRequests.length > 0 && <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-100 rounded text-[9px] font-bold text-amber-600">{pendingPrivacyRequests.length} pendentes</span>}
          </h3>
          {admin.checkPermission('admin', 'create') && <button onClick={() => setShowPrivacyModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-xl hover:bg-violet-700 transition-colors"><Plus className="w-3 h-3" /> Nova Solicitação</button>}
        </div>
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-[11px]">
            <thead><tr className="bg-slate-50 border-b border-slate-100">
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Usuário</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Tipo</th>
              <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Descrição</th>
              <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Status</th>
              <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Data</th>
            </tr></thead>
            <tbody>
              {admin.privacyRequests.length === 0 && <tr><td colSpan={5} className="p-12 text-center text-slate-400 text-xs">Nenhuma solicitação</td></tr>}
              {admin.privacyRequests.map(r => (
                <tr key={r.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3 font-semibold text-slate-700">{r.userName}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[10px] font-semibold text-slate-600">
                      {r.requestType === 'access' ? 'Acesso' : r.requestType === 'deletion' ? 'Exclusão' : r.requestType === 'rectification' ? 'Retificação' : r.requestType === 'portability' ? 'Portabilidade' : r.requestType === 'anonymization' ? 'Anonimização' : 'Restrição'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-[10px] max-w-[200px] truncate">{r.description}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${r.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' : r.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-100' : r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'}`}>
                      {r.status === 'pending' ? 'Pendente' : r.status === 'processing' ? 'Processando' : r.status === 'completed' ? 'Concluído' : 'Rejeitado'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-[10px] text-slate-400">{new Date(r.createdAt).toLocaleDateString('pt-BR')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pendingPrivacyRequests.length > 0 && (
          <div className="mt-3 bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-[10px] font-bold text-amber-700 mb-1.5">Ações Pendentes</p>
            {pendingPrivacyRequests.map(r => (
              <div key={r.id} className="flex items-center justify-between py-1">
                <p className="text-[10px] text-amber-700">{r.userName} — {r.requestType}</p>
                <div className="flex gap-1">
                  {admin.checkPermission('admin', 'edit') && <button onClick={() => admin.updatePrivacyRequest(r.id, { status: 'processing', processedBy: 'user-admin' })} className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-lg hover:bg-blue-600">Processar</button>}
                  {admin.checkPermission('admin', 'edit') && <button onClick={() => admin.updatePrivacyRequest(r.id, { status: 'completed', processedBy: 'user-admin', responseNotes: 'Solicitação atendida.' })} className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-lg hover:bg-emerald-600">Concluir</button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Política de Privacidade */}
      <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4">
        <h3 className="text-xs font-black text-violet-800 mb-2">📋 Política de Privacidade — CrepaldiDH</h3>
        <div className="text-[10px] text-violet-700 space-y-1">
          <p><strong>Base Legal:</strong> LGPD Lei 13.709/2018 — Art. 7º (Consentimento), Art. 10º (Legítimo Interesse)</p>
          <p><strong>Dados Coletados:</strong> Nome, email, telefone, empresa, cargo, histórico de interações</p>
          <p><strong>Finalidade:</strong> Prestação de serviços de DHO, comunicação comercial, cumprimento de obrigações contratuais</p>
          <p><strong>Compartilhamento:</strong> Dados não são compartilhados com terceiros sem consentimento explícito</p>
          <p><strong>Retenção:</strong> 5 anos para registros de auditoria, 2 anos para consentimentos após revogação</p>
          <p><strong>Direitos do Titular:</strong> Acesso, retificação, exclusão, portabilidade, anonimização, revogação de consentimento</p>
          <p><strong>Encarregado (DPO):</strong> Marcos Crepaldi — dpo@crepaldidh.com.br</p>
        </div>
      </div>
    </div>
  )

  // ── RENDER: CONFIG ───────────────────────────
  const renderConfig = () => (
    <div className="space-y-6 max-w-2xl">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><Shield className="w-4 h-4 text-violet-600" /> Segurança</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div><p className="text-[12px] font-semibold text-slate-700">Bloqueio por Tentativas</p><p className="text-[10px] text-slate-400">Bloquear após 5 tentativas de login inválidas</p></div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">Ativo</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div><p className="text-[12px] font-semibold text-slate-700">MFA Obrigatório</p><p className="text-[10px] text-slate-400">Exigir autenticação de dois fatores para admins</p></div>
            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[10px] font-semibold">Parcial</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50">
            <div><p className="text-[12px] font-semibold text-slate-700">Sessão</p><p className="text-[10px] text-slate-400">Expirar sessão após 8 horas de inatividade</p></div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">8h</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div><p className="text-[12px] font-semibold text-slate-700">Reset de Senha</p><p className="text-[10px] text-slate-400">Link de reset expira em 30 minutos</p></div>
            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">30 min</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-600" /> Retenção de Dados</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-[11px] text-slate-600">Logs de auditoria</span><span className="text-[10px] font-semibold text-slate-700">5 anos</span></div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-[11px] text-slate-600">Sessões de usuário</span><span className="text-[10px] font-semibold text-slate-700">90 dias</span></div>
          <div className="flex items-center justify-between py-2 border-b border-slate-50"><span className="text-[11px] text-slate-600">Consentimentos LGPD</span><span className="text-[10px] font-semibold text-slate-700">20 anos</span></div>
          <div className="flex items-center justify-between py-2"><span className="text-[11px] text-slate-600">Usuários inativos</span><span className="text-[10px] font-semibold text-slate-700">1 ano</span></div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><Users className="w-4 h-4 text-violet-600" /> Sessões Ativas</h3>
        <div className="space-y-2">
          {admin.users.filter(u => u.lastLogin && new Date(u.lastLogin).getTime() > Date.now() - 86400000).slice(0, 5).map(u => (
            <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white">{u.avatar}</div>
                <div><p className="text-[11px] font-semibold text-slate-700">{u.name}</p><p className="text-[9px] text-slate-400">{u.roleName}</p></div>
              </div>
              <span className="text-[9px] text-emerald-600 font-semibold">Online</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
        <h3 className="text-xs font-black text-amber-800 mb-1">🔒 Segurança do Sistema</h3>
        <p className="text-[10px] text-amber-700">Todas as operações são registradas em logs de auditoria. Consulte o módulo de BI para relatórios completos de segurança. Em caso de incidente, contate o DPO: dpo@crepaldidh.com.br</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Shield className="w-5 h-5 text-violet-600" />
        <h1 className="text-lg font-black text-slate-800">ADMINISTRAÇÃO</h1>
        <span className="px-1.5 py-0.5 bg-violet-50 border border-violet-100 rounded text-[9px] font-bold text-violet-600">PERMISSÕES & LGPD</span>
      </div>

      {/* User Simulation Bar */}
      <div className="bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-100 rounded-xl px-3 py-2 mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-violet-600" />
          <span className="text-[10px] font-semibold text-violet-700">Simular:</span>
          <select value={admin.currentUserId || ''} onChange={e => admin.setCurrentUserId(e.target.value || null)}
            className="text-[11px] border border-violet-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
            {admin.users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.roleName}){!u.active ? ' 🔒' : ''}</option>
            ))}
          </select>
        </div>
        {admin.currentUser && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[8px] font-bold text-white">{admin.currentUser.avatar}</div>
            <span className="text-[11px] font-semibold text-violet-700">{admin.currentUser.name}</span>
            <span className="text-[9px] text-violet-500">({admin.currentUser.roleName})</span>
            {!admin.currentUser.active && <span className="text-[9px] font-bold text-red-500">INATIVO</span>}
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-6">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center gap-1.5 ${tab === t.key ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'}`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'users' && renderUsers()}
      {tab === 'permissions' && renderPermissions()}
      {tab === 'audit' && renderAudit()}
      {tab === 'lgpd' && renderLgpd()}
      {tab === 'config' && renderConfig()}

      {/* Privacy Request Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">Nova Solicitação de Privacidade</h3>
            <div className="space-y-3">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Usuário</label>
                <select value={privacyForm.userId} onChange={e => setPrivacyForm(p => ({ ...p, userId: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200">
                  <option value="">Selecione...</option>
                  {admin.users.filter(u => u.isExternal).map(u => <option key={u.id} value={u.id}>{u.name} — {u.companyName}</option>)}
                </select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Tipo</label>
                <select value={privacyForm.requestType} onChange={e => setPrivacyForm(p => ({ ...p, requestType: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200">
                  <option value="access">Acesso aos dados</option>
                  <option value="rectification">Retificação de dados</option>
                  <option value="deletion">Exclusão de dados</option>
                  <option value="portability">Portabilidade</option>
                  <option value="anonymization">Anonimização</option>
                  <option value="restriction">Restrição de tratamento</option>
                </select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Descrição</label>
                <textarea value={privacyForm.description} onChange={e => setPrivacyForm(p => ({ ...p, description: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" /></div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handlePrivacyRequest} className="flex-1 px-3 py-2 bg-violet-600 text-white text-[11px] font-bold rounded-xl hover:bg-violet-700 transition-colors">Registrar</button>
              <button onClick={() => setShowPrivacyModal(false)} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
