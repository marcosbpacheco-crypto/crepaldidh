'use client'

import React, { useState, useMemo } from 'react'
import { useTenant, type TenantStatus } from '../context/TenantContext'
import { useAdmin } from '../context/AdminContext'
import {
  Building2, Plus, Search, Edit2, Trash2, Check, X, AlertTriangle,
  Users, HardDrive, Cpu, DollarSign, CreditCard, Calendar,
  Shield, ToggleLeft, ToggleRight, Activity, Globe, Clock,
} from 'lucide-react'

const STATUS_LABELS: Record<TenantStatus, string> = {
  active: 'Ativo', suspended: 'Suspenso', trial: 'Trial', cancelled: 'Cancelado',
}

const STATUS_COLORS: Record<TenantStatus, string> = {
  active: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  suspended: 'bg-red-50 text-red-700 border-red-100',
  trial: 'bg-blue-50 text-blue-700 border-blue-100',
  cancelled: 'bg-slate-50 text-slate-500 border-slate-100',
}

export default function TenantsPage() {
  const tenantCtx = useTenant()
  const admin = useAdmin()
  const [tab, setTab] = useState<'dashboard' | 'list'>('dashboard')
  const [showAddTenant, setShowAddTenant] = useState(false)
  const [editTenantId, setEditTenantId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [filterPlan, setFilterPlan] = useState<string>('')
  const [filterStatus, setFilterStatus] = useState<string>('')
  const [form, setForm] = useState({
    name: '', cnpj: '', planId: 'plan-professional', status: 'active' as TenantStatus,
    maxUsers: 10, storageLimitMb: 5000, responsibleName: '', responsibleEmail: '',
    responsiblePhone: '', startDate: new Date().toISOString().split('T')[0],
  })

  const filtered = useMemo(() => {
    let list = tenantCtx.tenants
    if (search) { const q = search.toLowerCase(); list = list.filter(t => t.name.toLowerCase().includes(q) || t.cnpj.includes(q)) }
    if (filterPlan) list = list.filter(t => t.planId === filterPlan)
    if (filterStatus) list = list.filter(t => t.status === filterStatus)
    return list
  }, [tenantCtx.tenants, search, filterPlan, filterStatus])

  const totalTenants = tenantCtx.tenants.length
  const activeTenants = tenantCtx.tenants.filter(t => t.status === 'active').length
  const suspendedTenants = tenantCtx.tenants.filter(t => t.status === 'suspended').length
  const trialTenants = tenantCtx.tenants.filter(t => t.status === 'trial').length

  const totalUsers = tenantCtx.tenants.reduce((acc, t) => acc + tenantCtx.getUsage(t.id, 'users'), 0)
  const totalStorage = tenantCtx.tenants.reduce((acc, t) => acc + tenantCtx.getUsage(t.id, 'storage_mb'), 0)
  const totalAiReqs = tenantCtx.tenants.reduce((acc, t) => acc + tenantCtx.getUsage(t.id, 'ai_requests'), 0)

  const monthlyRevenue = tenantCtx.billing
    .filter(b => b.status === 'paid')
    .reduce((acc, b) => acc + b.amount, 0)

  const pendingRevenue = tenantCtx.billing
    .filter(b => b.status === 'pending' || b.status === 'overdue')
    .reduce((acc, b) => acc + b.amount, 0)

  const handleSubmit = () => {
    if (!form.name.trim() || !form.cnpj.trim()) return
    const plan = tenantCtx.plans.find(p => p.id === form.planId)
    if (editTenantId) {
      tenantCtx.updateTenant(editTenantId, {
        name: form.name, cnpj: form.cnpj, planId: form.planId, planName: plan?.name || '',
        status: form.status, maxUsers: form.maxUsers, storageLimitMb: form.storageLimitMb,
        responsibleName: form.responsibleName, responsibleEmail: form.responsibleEmail,
        responsiblePhone: form.responsiblePhone, startDate: new Date(form.startDate).toISOString(),
      })
    } else {
      tenantCtx.addTenant({
        name: form.name, cnpj: form.cnpj, planId: form.planId, planName: plan?.name || '',
        status: form.status, maxUsers: form.maxUsers, storageLimitMb: form.storageLimitMb,
        responsibleName: form.responsibleName, responsibleEmail: form.responsibleEmail,
        responsiblePhone: form.responsiblePhone, startDate: new Date(form.startDate).toISOString(),
      })
    }
    setShowAddTenant(false); setEditTenantId(null); resetForm()
  }

  const resetForm = () => setForm({
    name: '', cnpj: '', planId: 'plan-professional', status: 'active' as TenantStatus,
    maxUsers: 10, storageLimitMb: 5000, responsibleName: '', responsibleEmail: '',
    responsiblePhone: '', startDate: new Date().toISOString().split('T')[0],
  })

  const openEdit = (t: typeof tenantCtx.tenants[0]) => {
    setEditTenantId(t.id)
    setForm({
      name: t.name, cnpj: t.cnpj, planId: t.planId, status: t.status,
      maxUsers: t.maxUsers, storageLimitMb: t.storageLimitMb,
      responsibleName: t.responsibleName, responsibleEmail: t.responsibleEmail,
      responsiblePhone: t.responsiblePhone, startDate: t.startDate.split('T')[0],
    })
    setShowAddTenant(true)
  }

  const tenantUsers = (tenantId: string) => admin.users.filter(u => u.tenantId === tenantId)

  return (
    <div className="min-h-screen">
      <div className="flex items-center gap-2 mb-4 sm:mb-6">
        <Building2 className="w-5 h-5 text-violet-600" />
        <h1 className="text-lg font-black text-slate-800">MULTI-TENANT</h1>
        <span className="px-1.5 py-0.5 bg-violet-50 border border-violet-100 rounded text-[9px] font-bold text-violet-600">SAAS</span>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-4 sm:mb-6">
        <button onClick={() => setTab('dashboard')}
          className={`px-3.5 py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center gap-1.5 ${tab === 'dashboard' ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
          <Activity className="w-3.5 h-3.5" /> Dashboard
        </button>
        <button onClick={() => setTab('list')}
          className={`px-3.5 py-2 text-[11px] font-bold rounded-xl border transition-all flex items-center gap-1.5 ${tab === 'list' ? 'bg-violet-50 border-violet-200 text-violet-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}>
          <Building2 className="w-3.5 h-3.5" /> Tenants ({totalTenants})
        </button>
      </div>

      {tab === 'dashboard' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
              <p className="text-[9px] font-semibold text-slate-400 uppercase">Total Tenants</p>
              <p className="text-lg font-black text-slate-800">{totalTenants}</p>
              <div className="flex gap-2 mt-1 text-[9px] text-slate-400">
                <span className="text-emerald-600">{activeTenants} ativos</span>
                {suspendedTenants > 0 && <span className="text-red-500">{suspendedTenants} suspensos</span>}
                {trialTenants > 0 && <span className="text-blue-500">{trialTenants} trial</span>}
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
              <p className="text-[9px] font-semibold text-slate-400 uppercase">Usuários Ativos</p>
              <p className="text-lg font-black text-emerald-600">{totalUsers}</p>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400"><Users className="w-3 h-3" /> em todos tenants</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
              <p className="text-[9px] font-semibold text-slate-400 uppercase">Armazenamento</p>
              <p className="text-lg font-black text-amber-600">{totalStorage} MB</p>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400"><HardDrive className="w-3 h-3" /> uso total</div>
            </div>
            <div className="bg-white rounded-xl border border-slate-100 p-3 shadow-sm">
              <p className="text-[9px] font-semibold text-slate-400 uppercase">IA Requests</p>
              <p className="text-lg font-black text-violet-600">{totalAiReqs}</p>
              <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-400"><Cpu className="w-3 h-3" /> requisições</div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-emerald-600" /> Faturamento</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-[11px] text-slate-600">Receita mensal (pago)</span>
                  <span className="text-sm font-black text-emerald-600">R$ {monthlyRevenue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-[11px] text-slate-600">A receber</span>
                  <span className="text-sm font-black text-amber-600">R$ {pendingRevenue.toLocaleString('pt-BR')}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-[11px] text-slate-600">Receita potencial total</span>
                  <span className="text-sm font-black text-violet-600">R$ {(monthlyRevenue + pendingRevenue).toLocaleString('pt-BR')}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
              <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4 text-amber-600" /> Alertas de Segurança</h3>
              <div className="space-y-2">
                {tenantCtx.tenants.filter(t => t.status === 'suspended').map(t => (
                  <div key={t.id} className="flex items-center gap-2 p-2 bg-red-50 rounded-lg">
                    <Shield className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                    <p className="text-[10px] text-red-700"><strong>{t.name}</strong> — Tenant suspenso</p>
                  </div>
                ))}
                {tenantCtx.tenants.filter(t => t.status === 'trial').map(t => (
                  <div key={t.id} className="flex items-center gap-2 p-2 bg-blue-50 rounded-lg">
                    <Clock className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                    <p className="text-[10px] text-blue-700"><strong>{t.name}</strong> — Período trial ativo</p>
                  </div>
                ))}
                {tenantCtx.billing.filter(b => b.status === 'overdue').map(b => {
                  const t = tenantCtx.tenants.find(x => x.id === b.tenantId)
                  return (
                    <div key={b.id} className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                      <p className="text-[10px] text-amber-700"><strong>{t?.name || 'N/A'}</strong> — Fatura {b.invoiceNumber} vencida</p>
                    </div>
                  )
                })}
                {tenantCtx.tenants.filter(t => t.status === 'active').length === totalTenants && tenantCtx.billing.filter(b => b.status === 'overdue').length === 0 && (
                  <p className="text-[11px] text-emerald-600 font-semibold">Nenhum alerta ativo</p>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4">
            <h3 className="text-xs font-black text-slate-700 mb-3 flex items-center gap-1.5"><CreditCard className="w-4 h-4 text-violet-600" /> Planos</h3>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              {tenantCtx.plans.map(plan => {
                const count = tenantCtx.tenants.filter(t => t.planId === plan.id).length
                return (
                  <div key={plan.id} className="border border-slate-100 rounded-xl p-3">
                    <p className="text-[11px] font-black text-slate-800">{plan.name}</p>
                    <p className="text-lg font-black text-violet-600">R$ {plan.monthlyPrice}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{count} tenant{count !== 1 ? 's' : ''}</p>
                    <div className="mt-2 space-y-1 text-[9px] text-slate-500">
                      <p>{plan.maxUsers} usuários</p>
                      <p>{plan.maxClients} clientes</p>
                      <p>{plan.maxProjects} projetos</p>
                      <p>{plan.storageLimitMb >= 1000 ? (plan.storageLimitMb / 1000).toFixed(0) + 'GB' : plan.storageLimitMb + 'MB'} armazenamento</p>
                      <p className={plan.hasAi ? 'text-emerald-600' : 'text-slate-300'}>{plan.hasAi ? '✓' : '✗'} IA</p>
                      <p className={plan.hasPortal ? 'text-emerald-600' : 'text-slate-300'}>{plan.hasPortal ? '✓' : '✗'} Portal</p>
                      <p className={plan.hasReports ? 'text-emerald-600' : 'text-slate-300'}>{plan.hasReports ? '✓' : '✗'} Relatórios</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-100 rounded-2xl p-4">
            <h3 className="text-xs font-black text-violet-800 mb-1">🚀 SaaS Multi-Tenant</h3>
            <p className="text-[10px] text-violet-700">CrepaldiDH é a plataforma master. Cada tenant opera com dados totalmente isolados via <strong>tenant_id</strong>. Super Admin (Marcos Crepaldi) tem visão global; admins de cada tenant gerenciam apenas seus próprios dados. RLS no Supabase garante isolamento em nível de banco de dados.</p>
          </div>
        </div>
      )}

      {tab === 'list' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar tenant..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-violet-200" />
            </div>
            <div className="flex gap-1.5">
              <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)}
                className="text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                <option value="">Todos os planos</option>
                {tenantCtx.plans.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="text-[11px] border border-slate-200 rounded-lg px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                <option value="">Todos os status</option>
                {(['active', 'suspended', 'trial', 'cancelled'] as TenantStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              {admin.checkPermission('admin', 'create') && (
                <button onClick={() => { resetForm(); setEditTenantId(null); setShowAddTenant(true) }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white text-[10px] font-bold rounded-xl hover:bg-violet-700 transition-colors">
                  <Plus className="w-3.5 h-3.5" /> Novo Tenant
                </button>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Empresa</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">CNPJ</th>
                    <th className="text-left px-4 py-2.5 font-semibold text-slate-500">Plano</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Status</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Usuários</th>
                    <th className="text-center px-4 py-2.5 font-semibold text-slate-500">Armazenamento</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Responsável</th>
                    <th className="text-right px-4 py-2.5 font-semibold text-slate-500">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => {
                    const uCount = tenantUsers(t.id).length
                    const storageUsed = tenantCtx.getUsage(t.id, 'storage_mb')
                    const usagePct = t.storageLimitMb > 0 ? Math.round((storageUsed / t.storageLimitMb) * 100) : 0
                    return (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
                              {t.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-800">{t.name}</p>
                              <p className="text-[10px] text-slate-400">Início: {new Date(t.startDate).toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{t.cnpj}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 bg-violet-50 border border-violet-100 rounded text-[10px] font-semibold text-violet-700">{t.planName}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${STATUS_COLORS[t.status]}`}>
                            {t.status === 'active' ? <Check className="w-3 h-3 inline mr-0.5" /> : t.status === 'suspended' ? <X className="w-3 h-3 inline mr-0.5" /> : null}
                            {STATUS_LABELS[t.status]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className="text-slate-700 font-semibold">{uCount}</span>
                          <span className="text-slate-400">/{t.maxUsers}</span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-slate-100 rounded-full h-1.5 overflow-hidden">
                              <div className={`h-full rounded-full transition-all ${usagePct > 80 ? 'bg-red-400' : usagePct > 50 ? 'bg-amber-400' : 'bg-emerald-400'}`}
                                style={{ width: Math.min(usagePct, 100) + '%' }} />
                            </div>
                            <span className="text-[9px] text-slate-400 w-14 text-right">{usagePct}%</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">{t.responsibleName}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {admin.checkPermission('admin', 'edit') && (
                              <button onClick={() => openEdit(t)} className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Editar">
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {admin.checkPermission('admin', 'edit') && (
                              <button onClick={() => tenantCtx.toggleTenantStatus(t.id)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                                title={t.status === 'suspended' ? 'Ativar' : 'Suspender'}>
                                {t.status === 'suspended' ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
                              </button>
                            )}
                            {admin.checkPermission('admin', 'delete') && (
                              <button onClick={() => { if (confirm(`Excluir ${t.name}?`)) tenantCtx.deleteTenant(t.id) }}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Excluir">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {filtered.length === 0 && <div className="p-12 text-center text-slate-400 text-xs">Nenhum tenant encontrado</div>}
          </div>
        </div>
      )}

      {/* Add/Edit Tenant Modal */}
      {showAddTenant && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => { setShowAddTenant(false); setEditTenantId(null) }}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">{editTenantId ? 'Editar Tenant' : 'Novo Tenant'}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nome da Empresa</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div className="col-span-2"><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">CNPJ</label>
                <input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Plano</label>
                <select value={form.planId} onChange={e => setForm(p => ({ ...p, planId: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200">
                  {tenantCtx.plans.map(p => <option key={p.id} value={p.id}>{p.name} — R$ {p.monthlyPrice}</option>)}
                </select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Status</label>
                <select value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as TenantStatus }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200">
                  {(['active', 'trial', 'suspended', 'cancelled'] as TenantStatus[]).map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
                </select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Máx. Usuários</label>
                <input type="number" value={form.maxUsers} onChange={e => setForm(p => ({ ...p, maxUsers: Number(e.target.value) }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Limite Armazenamento (MB)</label>
                <input type="number" value={form.storageLimitMb} onChange={e => setForm(p => ({ ...p, storageLimitMb: Number(e.target.value) }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Responsável</label>
                <input value={form.responsibleName} onChange={e => setForm(p => ({ ...p, responsibleName: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Email</label>
                <input value={form.responsibleEmail} onChange={e => setForm(p => ({ ...p, responsibleEmail: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Telefone</label>
                <input value={form.responsiblePhone} onChange={e => setForm(p => ({ ...p, responsiblePhone: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Data de Início</label>
                <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200" /></div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handleSubmit} className="flex-1 px-3 py-2 bg-violet-600 text-white text-[11px] font-bold rounded-xl hover:bg-violet-700 transition-colors">
                {editTenantId ? 'Salvar' : 'Criar Tenant'}
              </button>
              <button onClick={() => { setShowAddTenant(false); setEditTenantId(null) }} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
