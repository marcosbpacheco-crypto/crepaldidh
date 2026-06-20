'use client'

import React, { useState, useMemo, useEffect } from 'react'
import { useAdmin, type ModuleName, type Permission } from '../admin/context/AdminContext'
import {
  Settings, Users, Key, FileSearch, Scale, Plus, Edit2, Trash2,
  Check, X, Search, Download, Eye, ToggleLeft, ToggleRight,
  Activity, LogIn, LogOut, UserPlus, Clock, Globe, Lock, Unlock,
  Shield, AlertTriangle, KeyRound, Trash, Database
} from 'lucide-react'

// Only admin and director roles can access settings
const ALLOWED_ROLES = ['Administrador', 'Diretor']

const ALL_TABS = [
  { key: 'users', label: 'Usuários', icon: <Users className="w-4 h-4" />, adminOnly: false },
  { key: 'permissions', label: 'Permissões', icon: <Key className="w-4 h-4" />, adminOnly: false },
  { key: 'profile-view', label: 'Visualizar Perfil', icon: <Eye className="w-4 h-4" />, adminOnly: true },
  { key: 'audit', label: 'Auditoria', icon: <FileSearch className="w-4 h-4" />, adminOnly: false },
  { key: 'lgpd', label: 'LGPD', icon: <Scale className="w-4 h-4" />, adminOnly: false },
  { key: 'config', label: 'Configurações', icon: <Settings className="w-4 h-4" />, adminOnly: false },
]

const MODULE_LABELS: Record<ModuleName, string> = {
  crm: 'CRM', clients: 'Clientes', projects: 'Projetos', nr01: 'NR-01',
  mentoring: 'Mentorias', trainings: 'Treinamentos', financial: 'Financeiro',
  calendar: 'Agenda', portal: 'Portal', documents: 'Documentos', bi: 'BI', ai: 'IA', admin: 'Admin',
  tasks: 'Tarefas', alerts: 'Alertas', import: 'Importação', assessoria: 'Assessoria Empresarial',
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Login', logout: 'Logout', create: 'Criação', update: 'Alteração',
  delete: 'Exclusão', download: 'Download', export: 'Exportação', view: 'Visualização',
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

export default function SettingsPage() {
  const admin = useAdmin()
  const [currentRole, setCurrentRole] = useState<string | null>(null)
  const [tab, setTab] = useState('users')
  const [searchUser, setSearchUser] = useState('')
  const [searchAudit, setSearchAudit] = useState('')
  const [showAddUser, setShowAddUser] = useState(false)
  const [showEditUser, setShowEditUser] = useState(false)
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  const [showPrivacyModal, setShowPrivacyModal] = useState(false)
  const [privacyForm, setPrivacyForm] = useState({ userId: '', requestType: 'access', description: '' })
  const [newUserForm, setNewUserForm] = useState({ name: '', email: '', phone: '', roleId: 'role-consultant', isExternal: false, companyId: '', companyName: '' })
  const [editUserForm, setEditUserForm] = useState({ name: '', email: '', phone: '', roleId: '', isExternal: false, companyId: '', companyName: '' })
  const [showPasswordModal, setShowPasswordModal] = useState(false)
  const [passwordTargetUser, setPasswordTargetUser] = useState<typeof admin.users[0] | null>(null)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetConfirmText, setResetConfirmText] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem('current_user')
      if (stored) {
        const u = JSON.parse(stored)
        setCurrentRole(u.roleName)
      }
    } catch {}
  }, [])

  const hasAccess = currentRole && ALLOWED_ROLES.includes(currentRole)

  const openEditUser = (u: typeof admin.users[0]) => {
    setEditingUserId(u.id)
    setEditUserForm({ name: u.name, email: u.email, phone: u.phone, roleId: u.roleId, isExternal: u.isExternal, companyId: u.companyId || '', companyName: u.companyName || '' })
    setShowEditUser(true)
  }

  const handleEditUser = () => {
    if (!editingUserId || !editUserForm.name.trim() || !editUserForm.email.trim()) return
    const role = admin.roles.find(r => r.id === editUserForm.roleId)
    const originalUser = admin.users.find(u => u.id === editingUserId)
    admin.updateUser(editingUserId, {
      name: editUserForm.name, email: editUserForm.email, phone: editUserForm.phone,
      avatar: editUserForm.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
      roleId: editUserForm.roleId, roleName: role?.label || 'Sem perfil', isExternal: editUserForm.isExternal,
      companyId: editUserForm.companyId || undefined, companyName: editUserForm.companyName || undefined,
    })
    admin.addAuditLog({
      userId: admin.currentUserId || '', userName: admin.currentUser?.name || 'Sistema', userRole: 'admin',
      action: 'update', entity: 'user', entityId: editingUserId,
      description: `Editou usuário: ${originalUser?.name || 'N/A'}`,
      ipAddress: '127.0.0.1',
    })
    setShowEditUser(false)
    setEditingUserId(null)
  }

  const filteredUsers = useMemo(() =>
    admin.users.filter(u => {
      if (searchUser) { const q = searchUser.toLowerCase(); return u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.roleName.toLowerCase().includes(q) }
      return true
    }), [admin.users, searchUser])

  const filteredAuditLogs = useMemo(() =>
    admin.auditLogs.filter(a => {
      if (searchAudit) { const q = searchAudit.toLowerCase(); return a.userName.toLowerCase().includes(q) || a.action.toLowerCase().includes(q) || a.entity.toLowerCase().includes(q) || a.description.toLowerCase().includes(q) }
      return true
    }), [admin.auditLogs, searchAudit])

  const pendingPrivacyRequests = admin.privacyRequests.filter(r => r.status === 'pending')

  const handleAddUser = () => {
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) return
    const role = admin.roles.find(r => r.id === newUserForm.roleId)
    admin.addUser({
      name: newUserForm.name, email: newUserForm.email, phone: newUserForm.phone,
      avatar: newUserForm.name.split(' ').map(w => w[0]).join('').substring(0, 2).toUpperCase(),
      roleId: newUserForm.roleId, roleName: role?.label || 'Sem perfil', isExternal: newUserForm.isExternal,
      companyId: newUserForm.companyId || undefined, companyName: newUserForm.companyName || undefined,
      active: true, password: '123456', loginAttempts: 0, mfaEnabled: false,
    })
    setShowAddUser(false)
    setNewUserForm({ name: '', email: '', phone: '', roleId: 'role-consultant', isExternal: false, companyId: '', companyName: '' })
  }

  const handlePasswordChange = () => {
    if (!passwordTargetUser || !newPassword || newPassword !== confirmPassword) return
    admin.updateUser(passwordTargetUser.id, { password: newPassword })
    setShowPasswordModal(false)
    setPasswordTargetUser(null)
    setNewPassword('')
    setConfirmPassword('')
    admin.addAuditLog({
      userId: admin.currentUserId || '', userName: admin.currentUser?.name || 'Sistema', userRole: 'admin',
      action: 'update', entity: 'user_password', entityId: passwordTargetUser.id,
      description: `Alterou a senha do usuário: ${passwordTargetUser.name}`,
      ipAddress: '127.0.0.1',
    })
  }

  const handlePrivacyRequest = () => {
    const user = admin.users.find(u => u.id === privacyForm.userId)
    admin.addPrivacyRequest({
      userId: privacyForm.userId, userName: user?.name || 'N/A',
      requestType: privacyForm.requestType, status: 'pending', description: privacyForm.description,
    })
    setShowPrivacyModal(false)
    setPrivacyForm({ userId: '', requestType: 'access', description: '' })
  }

  if (!hasAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Acesso Restrito</h1>
          <p className="text-sm text-slate-500">Apenas administradores e diretores podem acessar as configurações do sistema.</p>
        </div>
    </div>
  )
}

// ── Profile View Panel (admin only — preview what a role sees) ──
function ProfileViewPanel({ admin }: { admin: ReturnType<typeof useAdmin> }) {
  const [selectedRoleId, setSelectedRoleId] = useState('role-consultant')

  const selectedRole = admin.roles.find(r => r.id === selectedRoleId)
  const rolePerms = admin.permissions.filter(p => p.roleId === selectedRoleId)

  const moduleList: ModuleName[] = ['crm', 'clients', 'projects', 'nr01', 'mentoring', 'trainings', 'financial', 'calendar', 'portal', 'documents', 'bi', 'ai', 'admin', 'tasks', 'alerts', 'import', 'assessoria']

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <label className="text-[9px] font-semibold text-slate-400 uppercase">Perfil:</label>
        <select value={selectedRoleId} onChange={e => setSelectedRoleId(e.target.value)}
          className="text-[11px] border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
          {admin.roles.filter(r => !r.isExternal).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
        </select>
        {selectedRole && (
          <span className="text-[10px] text-slate-400">{selectedRole.description}</span>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {moduleList.map(mod => {
          const perm = rolePerms.find(p => p.module === mod)
          const canView = perm?.canView ?? false
          const canCreate = perm?.canCreate ?? false
          const canEdit = perm?.canEdit ?? false
          const canDelete = perm?.canDelete ?? false
          const canExport = perm?.canExport ?? false
          return (
            <div key={mod} className={`bg-white rounded-xl border p-3 shadow-sm transition-colors ${canView ? 'border-slate-200' : 'border-slate-100 opacity-50'}`}>
              <p className="text-[11px] font-bold text-slate-700 mb-2">{MODULE_LABELS[mod] || mod}</p>
              <div className="space-y-1">
                {[
                  { label: 'Visualizar', value: canView },
                  { label: 'Criar', value: canCreate },
                  { label: 'Editar', value: canEdit },
                  { label: 'Excluir', value: canDelete },
                  { label: 'Exportar', value: canExport },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between">
                    <span className="text-[9px] text-slate-500">{item.label}</span>
                    {item.value
                      ? <Check className="w-3 h-3 text-emerald-600" />
                      : <X className="w-3 h-3 text-slate-300" />}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-2 mb-6">
        <Settings className="w-5 h-5 text-slate-600" />
        <h1 className="text-lg font-black text-slate-800">CONFIGURAÇÕES</h1>
        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500">USUÁRIOS & PERMISSÕES</span>
      </div>

      {/* Simulação de usuário */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-xl px-3 py-2 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-[10px] font-semibold text-slate-600">Visualizar como:</span>
          <select
            value={admin.currentUserId || ''}
            onChange={e => admin.setCurrentUserId(e.target.value || null)}
            className="text-[11px] border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
          >
            {admin.users.map(u => (
              <option key={u.id} value={u.id}>{u.name} ({u.roleName}){!u.active ? ' 🔒' : ''}</option>
            ))}
          </select>
        </div>
        {admin.currentUser && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-teal to-brand-blue flex items-center justify-center text-[8px] font-bold text-white">{admin.currentUser.avatar}</div>
            <span className="text-[11px] font-semibold text-slate-700">{admin.currentUser.name}</span>
            <span className="text-[9px] text-slate-400">({admin.currentUser.roleName})</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {ALL_TABS.filter(t => !t.adminOnly || currentRole === 'Administrador').map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`px-3.5 py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center gap-1.5 ${
              tab === t.key
                ? 'bg-brand-teal/10 border-brand-teal/30 text-brand-teal shadow-sm'
                : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-700'
            }`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Users */}
      {tab === 'users' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={searchUser} onChange={e => setSearchUser(e.target.value)} placeholder="Buscar usuários..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <button onClick={() => setShowAddUser(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white text-[10px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all"><Plus className="w-3.5 h-3.5" /> Novo Usuário</button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Usuário</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Perfil</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Tipo</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Empresa</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Status</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-slate-500">MFA</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(u => (
                    <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-[10px] font-bold text-white shadow-sm ${u.active ? 'bg-gradient-to-br from-brand-teal to-brand-blue' : 'bg-slate-300'}`}>{u.avatar}</div>
                          <div><p className="font-semibold text-slate-800">{u.name}</p><p className="text-[10px] text-slate-400">{u.email}</p></div>
                        </div>
                      </td>
                      <td className="px-4 py-3"><span className="px-2 py-0.5 bg-brand-teal/10 border border-brand-teal/20 rounded text-[10px] font-semibold text-brand-teal">{u.roleName}</span></td>
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
                          <button onClick={() => openEditUser(u)} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                          <button onClick={() => { setPasswordTargetUser(u); setNewPassword(''); setConfirmPassword(''); setShowPasswordModal(true) }} className="p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Alterar senha"><KeyRound className="w-3.5 h-3.5" /></button>
                          <button onClick={() => admin.toggleUserActive(u.id)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title={u.active ? 'Desativar' : 'Ativar'}>
                            {u.active ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                          </button>
                          <button onClick={() => admin.deleteUser(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
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
            <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm"><p className="text-[9px] font-semibold text-slate-400 uppercase">MFA</p><p className="text-lg font-black text-brand-teal">{admin.users.filter(u => u.mfaEnabled).length}</p></div>
          </div>

          {showAddUser && (
            <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowAddUser(false)}>
              <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
                <h3 className="text-sm font-black text-slate-800 mb-4">Novo Usuário</h3>
                <div className="space-y-3">
                  <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nome</label><input value={newUserForm.name} onChange={e => setNewUserForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
                  <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Email</label><input value={newUserForm.email} onChange={e => setNewUserForm(p => ({ ...p, email: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
                  <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Telefone</label><input value={newUserForm.phone} onChange={e => setNewUserForm(p => ({ ...p, phone: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
                  <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Perfil</label>
                    <select value={newUserForm.roleId} onChange={e => setNewUserForm(p => ({ ...p, roleId: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                      {admin.roles.filter(r => !r.isExternal).map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                    </select></div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={newUserForm.isExternal} onChange={e => setNewUserForm(p => ({ ...p, isExternal: e.target.checked }))} className="rounded border-slate-300" />
                    <span className="text-[11px] text-slate-600">Usuário externo (cliente)</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                  <button onClick={handleAddUser} className="flex-1 px-3 py-2 bg-brand-teal text-white text-[11px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all">Criar Usuário</button>
                  <button onClick={() => setShowAddUser(false)} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Edit User Modal */}
      {showEditUser && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => { setShowEditUser(false); setEditingUserId(null) }}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">Editar Usuário</h3>
            <div className="space-y-3">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nome</label>
                <input value={editUserForm.name} onChange={e => setEditUserForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Email</label>
                <input value={editUserForm.email} onChange={e => setEditUserForm(p => ({ ...p, email: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Telefone</label>
                <input value={editUserForm.phone} onChange={e => setEditUserForm(p => ({ ...p, phone: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Perfil</label>
                <select value={editUserForm.roleId} onChange={e => setEditUserForm(p => ({ ...p, roleId: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  {admin.roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                </select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Empresa</label>
                <input value={editUserForm.companyName} onChange={e => setEditUserForm(p => ({ ...p, companyName: e.target.value }))} placeholder="Ex: BR Distribuidora" className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={editUserForm.isExternal} onChange={e => setEditUserForm(p => ({ ...p, isExternal: e.target.checked }))} className="rounded border-slate-300" />
                <span className="text-[11px] text-slate-600">Usuário externo (cliente)</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handleEditUser} className="flex-1 px-3 py-2 bg-brand-teal text-white text-[11px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all">Salvar Alterações</button>
              <button onClick={() => { setShowEditUser(false); setEditingUserId(null) }} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Password Change Modal */}
      {showPasswordModal && passwordTargetUser && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowPasswordModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">Alterar Senha</h3>
            <p className="text-[11px] text-slate-500 mb-4">Usuário: <strong className="text-slate-700">{passwordTargetUser.name}</strong></p>
            <div className="space-y-3">
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nova Senha</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
              </div>
              <div>
                <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Confirmar Senha</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={`w-full text-[12px] border ${confirmPassword && newPassword !== confirmPassword ? 'border-red-300' : 'border-slate-200'} rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20`} />
                {confirmPassword && newPassword !== confirmPassword && <p className="text-[10px] text-red-500 mt-1">Senhas não conferem</p>}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handlePasswordChange} disabled={!newPassword || newPassword !== confirmPassword} className="flex-1 px-3 py-2 bg-amber-500 text-white text-[11px] font-bold rounded-xl hover:bg-amber-600 transition-all disabled:opacity-40">Alterar Senha</button>
              <button onClick={() => { setShowPasswordModal(false); setPasswordTargetUser(null) }} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Permissions */}
      {tab === 'permissions' && (
        <PermissionsPanel admin={admin} />
      )}

      {/* Profile View (admin only) */}
      {tab === 'profile-view' && (
        <ProfileViewPanel admin={admin} />
      )}

      {/* Audit */}
      {tab === 'audit' && (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input value={searchAudit} onChange={e => setSearchAudit(e.target.value)} placeholder="Buscar nos logs..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
          </div>
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
      )}

      {/* LGPD */}
      {tab === 'lgpd' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><Scale className="w-4 h-4 text-slate-600" /> Consentimentos LGPD</h3>
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
                          {c.granted
                            ? <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[10px] font-semibold">Consentido</span>
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

          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><FileSearch className="w-4 h-4 text-slate-600" /> Solicitações de Privacidade
                {pendingPrivacyRequests.length > 0 && <span className="px-1.5 py-0.5 bg-amber-50 border border-amber-100 rounded text-[9px] font-bold text-amber-600">{pendingPrivacyRequests.length} pendentes</span>}
              </h3>
              <button onClick={() => setShowPrivacyModal(true)} className="flex items-center gap-1 px-2.5 py-1.5 bg-brand-teal text-white text-[10px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all"><Plus className="w-3 h-3" /> Nova Solicitação</button>
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
                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                          r.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                          r.status === 'processing' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                          r.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                          'bg-red-50 text-red-700 border border-red-100'
                        }`}>
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
                      <button onClick={() => admin.updatePrivacyRequest(r.id, { status: 'processing', processedBy: 'user-admin' })} className="px-2 py-0.5 bg-blue-500 text-white text-[9px] font-bold rounded-lg hover:bg-blue-600">Processar</button>
                      <button onClick={() => admin.updatePrivacyRequest(r.id, { status: 'completed', processedBy: 'user-admin', responseNotes: 'Solicitação atendida.' })} className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-bold rounded-lg hover:bg-emerald-600">Concluir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-gradient-to-br from-slate-50 to-slate-100 border border-slate-200 rounded-2xl p-4">
            <h3 className="text-xs font-black text-slate-700 mb-2">Política de Privacidade — CrepaldiDH</h3>
            <div className="text-[10px] text-slate-600 space-y-1">
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
      )}

      {/* Config */}
      {tab === 'config' && (
        <div className="space-y-6 max-w-2xl">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><Shield className="w-4 h-4 text-slate-600" /> Segurança</h3>
            <div className="space-y-3">
              {[
                { title: 'Bloqueio por Tentativas', desc: 'Bloquear após 5 tentativas de login inválidas', status: 'Ativo', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { title: 'MFA Obrigatório', desc: 'Exigir autenticação de dois fatores para admins', status: 'Parcial', color: 'text-amber-600 bg-amber-50 border-amber-100' },
                { title: 'Sessão', desc: 'Expirar sessão após 8 horas de inatividade', status: '8h', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
                { title: 'Reset de Senha', desc: 'Link de reset expira em 30 minutos', status: '30 min', color: 'text-emerald-600 bg-emerald-50 border-emerald-100' },
              ].map(item => (
                <div key={item.title} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div><p className="text-[12px] font-semibold text-slate-700">{item.title}</p><p className="text-[10px] text-slate-400">{item.desc}</p></div>
                  <span className={`px-2 py-0.5 ${item.color} rounded text-[10px] font-semibold`}>{item.status}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-600" /> Retenção de Dados</h3>
            <div className="space-y-2">
              {[
                { label: 'Logs de auditoria', value: '5 anos' },
                { label: 'Sessões de usuário', value: '90 dias' },
                { label: 'Consentimentos LGPD', value: '20 anos' },
                { label: 'Usuários inativos', value: '1 ano' },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <span className="text-[11px] text-slate-600">{item.label}</span>
                  <span className="text-[10px] font-semibold text-slate-700">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
            <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><Users className="w-4 h-4 text-slate-600" /> Sessões Ativas</h3>
            <div className="space-y-2">
              {admin.users.filter(u => u.lastLogin && new Date(u.lastLogin).getTime() > Date.now() - 86400000).slice(0, 5).map(u => (
                <div key={u.id} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-teal to-brand-blue flex items-center justify-center text-[8px] font-bold text-white">{u.avatar}</div>
                    <div><p className="text-[11px] font-semibold text-slate-700">{u.name}</p><p className="text-[9px] text-slate-400">{u.roleName}</p></div>
                  </div>
                  <span className="text-[9px] text-emerald-600 font-semibold">Online</span>
                </div>
              ))}
            </div>
          </div>

          {currentRole === 'Administrador' && (
            <div className="bg-gradient-to-br from-red-50 to-rose-50 border border-red-200 rounded-2xl p-4">
              <h3 className="text-xs font-black text-red-800 mb-1 flex items-center gap-1.5"><Database className="w-4 h-4 text-red-600" /> Gerenciar Dados</h3>
              <p className="text-[10px] text-red-700 mb-3">Remova todos os dados fictícios e deixe o sistema pronto para começar do zero. Usuários, permissões e categorias financeiras serão mantidos.</p>
              <button onClick={() => setShowResetModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white text-[11px] font-bold rounded-xl hover:bg-red-700 transition-all">
                <Trash className="w-3.5 h-3.5" /> Limpar Sistema
              </button>
            </div>
          )}

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 rounded-2xl p-4">
            <h3 className="text-xs font-black text-amber-800 mb-1">Segurança do Sistema</h3>
            <p className="text-[10px] text-amber-700">Todas as operações são registradas em logs de auditoria. Consulte o módulo de BI para relatórios completos de segurança. Em caso de incidente, contate o DPO: dpo@crepaldidh.com.br</p>
          </div>
        </div>
      )}

      {/* Privacy Request Modal */}
      {showPrivacyModal && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowPrivacyModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">Nova Solicitação de Privacidade</h3>
            <div className="space-y-3">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Usuário</label>
                <select value={privacyForm.userId} onChange={e => setPrivacyForm(p => ({ ...p, userId: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  <option value="">Selecione...</option>
                  {admin.users.filter(u => u.isExternal).map(u => <option key={u.id} value={u.id}>{u.name} — {u.companyName}</option>)}
                </select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Tipo</label>
                <select value={privacyForm.requestType} onChange={e => setPrivacyForm(p => ({ ...p, requestType: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  <option value="access">Acesso aos dados</option>
                  <option value="rectification">Retificação de dados</option>
                  <option value="deletion">Exclusão de dados</option>
                  <option value="portability">Portabilidade</option>
                  <option value="anonymization">Anonimização</option>
                  <option value="restriction">Restrição de tratamento</option>
                </select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Descrição</label>
                <textarea value={privacyForm.description} onChange={e => setPrivacyForm(p => ({ ...p, description: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none" /></div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handlePrivacyRequest} className="flex-1 px-3 py-2 bg-brand-teal text-white text-[11px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all">Registrar</button>
              <button onClick={() => setShowPrivacyModal(false)} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset System Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-4" onClick={() => { setShowResetModal(false); setResetConfirmText('') }}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-2 flex items-center gap-2"><Trash className="w-4 h-4 text-red-500" /> Limpar Sistema</h3>
            <p className="text-[11px] text-slate-600 mb-3">Esta ação removerá <strong>todos os dados fictícios</strong> do sistema, mantendo apenas:</p>
            <ul className="text-[11px] text-slate-600 mb-4 space-y-1 ml-4 list-disc">
              <li>Usuários e permissões</li>
              <li>Categorias financeiras e métodos de pagamento</li>
              <li>Competências e ferramentas de mentoria</li>
            </ul>
            <p className="text-[10px] text-red-600 font-semibold mb-3">Digite <strong>LIMPAR</strong> para confirmar:</p>
            <input value={resetConfirmText} onChange={e => setResetConfirmText(e.target.value)}
              placeholder="Digite LIMPAR" maxLength={6}
              className="w-full text-[12px] border border-red-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-200 mb-4" />
            <div className="flex items-center gap-2">
              <button onClick={() => {
                if (resetConfirmText !== 'LIMPAR') return
                const { resetSystem } = require('@/utils/resetSystem')
                resetSystem()
                setShowResetModal(false)
                setResetConfirmText('')
                window.location.reload()
              }} disabled={resetConfirmText !== 'LIMPAR'}
                className="flex-1 px-3 py-2 bg-red-600 text-white text-[11px] font-bold rounded-xl hover:bg-red-700 transition-all disabled:opacity-40">
                Confirmar Limpeza
              </button>
              <button onClick={() => { setShowResetModal(false); setResetConfirmText('') }}
                className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Permissions Panel ──
function PermissionsPanel({ admin }: { admin: ReturnType<typeof useAdmin> }) {
  const [selectedUserId, setSelectedUserId] = useState('')

  const selectedUser = admin.users.find(u => u.id === selectedUserId)
  const isAdminUser = selectedUser?.roleName === 'Administrador'
  const canEdit = admin.currentUser?.roleName === 'Administrador' || admin.currentUser?.roleName === 'Diretor'

  const moduleList: ModuleName[] = ['crm', 'clients', 'projects', 'nr01', 'mentoring', 'trainings', 'financial', 'calendar', 'portal', 'documents', 'bi', 'ai', 'admin', 'tasks', 'alerts', 'import', 'assessoria']

  function getEffectivePerm(module: ModuleName, field: keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'>): boolean {
    if (!selectedUser) return false
    const userPerm = admin.permissions.find(p => p.userId === selectedUser.id && p.module === module)
    if (userPerm) return userPerm[field]
    const rolePerm = admin.permissions.find(p => p.roleId === selectedUser.roleId && p.module === module)
    return rolePerm ? rolePerm[field] : false
  }

  function handleToggle(module: ModuleName, field: keyof Pick<Permission, 'canView' | 'canCreate' | 'canEdit' | 'canDelete' | 'canExport'>) {
    if (!selectedUser || !canEdit) return
    const newValue = !getEffectivePerm(module, field)
    admin.setUserPermission(selectedUser.id, module, field, newValue)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <label className="text-[9px] font-semibold text-slate-400 uppercase">Usuário:</label>
        <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value)}
          className="text-[11px] border border-slate-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
          <option value="">Selecione um usuário...</option>
          {admin.users.filter(u => u.active).map(u => <option key={u.id} value={u.id}>{u.name} — {u.roleName}</option>)}
        </select>
        {selectedUser && (
          <span className="text-[10px] text-slate-400 ml-1">
            {isAdminUser ? 'Acesso total (Administrador)' : `Perfil base: ${selectedUser.roleName}`}
          </span>
        )}
      </div>

      {!selectedUser ? (
        <div className="p-12 text-center text-slate-400 text-xs bg-white rounded-2xl border border-slate-100 shadow-sm">
          Selecione um usuário para configurar as permissões.
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Módulo</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Visualizar</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Criar</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Editar</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Excluir</th>
                  <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Exportar</th>
                </tr>
              </thead>
              <tbody>
                {moduleList.map(mod => (
                  <tr key={mod} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-2.5 font-semibold text-slate-700">{MODULE_LABELS[mod] || mod}</td>
                    {(['canView', 'canCreate', 'canEdit', 'canDelete', 'canExport'] as const).map(field => {
                      const hasPerm = getEffectivePerm(mod, field)
                      const hasOverride = admin.permissions.some(p => p.userId === selectedUser.id && p.module === mod)
                      return (
                        <td key={field} className="px-4 py-2.5 text-center">
                          {isAdminUser ? (
                            <span className="inline-flex w-6 h-6 rounded-lg items-center justify-center bg-brand-teal/10 text-brand-teal border border-brand-teal/20">
                              <Check className="w-3.5 h-3.5" />
                            </span>
                          ) : (
                            <button onClick={() => handleToggle(mod, field)}
                              disabled={!canEdit}
                              className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                                hasPerm
                                  ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                  : 'bg-slate-50 text-slate-300 border border-slate-100'
                              } ${canEdit ? 'cursor-pointer hover:border-slate-300' : 'cursor-default opacity-60'}`}
                              title={hasOverride ? 'Permissão personalizada' : 'Permissão do perfil'}>
                              {hasPerm ? <Check className="w-3.5 h-3.5" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-2 bg-slate-50 border-t border-slate-100 flex items-center gap-3 text-[9px] text-slate-400">
            <span className="flex items-center gap-1"><Check className="w-3 h-3 text-emerald-600" /> Permitido</span>
            <span className="flex items-center gap-1"><X className="w-3 h-3 text-slate-300" /> Negado</span>
            <span className="flex items-center gap-1 text-brand-teal font-semibold">Administradores têm acesso total a todos os módulos.</span>
          </div>
        </div>
      )}
    </div>
  )
}
