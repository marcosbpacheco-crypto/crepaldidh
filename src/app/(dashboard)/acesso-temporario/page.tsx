'use client'

import { useState, useMemo } from 'react'
import { useAcessoTemporario, QuestionType, QuestionOption, Question } from './context/AcessoTemporarioContext'
import { useCrm } from '../crm/context/CrmContext'
import { useAdmin } from '../admin/context/AdminContext'
import {
  Plus, X, Copy, Check, Trash2, Clock, ExternalLink, Key,
  UserCheck, UserX, Search, Calendar, Building2, Users,
  FileQuestion, ClipboardList, Eye, ToggleLeft, ToggleRight,
  ChevronDown, ChevronUp, GripVertical, AlertTriangle,
  Mail, Lock, User, Edit3, Save, Send,
} from 'lucide-react'

type AdminTab = 'tokens' | 'usuarios' | 'questionarios' | 'respostas'

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  text: 'Texto Curto', textarea: 'Texto Longo', select: 'Seleção Única',
  radio: 'Múltipla Escolha', date: 'Data', number: 'Número',
  email: 'E-mail', phone: 'Telefone', cnpj: 'CNPJ',
}

export default function AcessoTemporarioPage() {
  const ctx = useAcessoTemporario()
  const crm = useCrm()
  const [tab, setTab] = useState<AdminTab>('tokens')

  const stats = useMemo(() => ({
    tokensTotal: ctx.accesses.length,
    tokensAtivos: ctx.accesses.filter(a => a.active && new Date(a.expiresAt) > new Date()).length,
    usuariosAtivos: ctx.tempUsers.filter(u => u.active).length,
    questionariosAtivos: ctx.questionnaires.filter(q => q.active).length,
    respostasEnviadas: ctx.responses.filter(r => r.status === 'submitted').length,
  }), [ctx])

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Key className="w-5 h-5 text-slate-600" />
        <h1 className="text-lg font-black text-slate-800">ACESSO TEMPORÁRIO</h1>
        <span className="px-1.5 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-bold text-slate-500">EMPRESAS & CLIENTES</span>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-50 rounded-xl p-1 border border-slate-100">
        {([
          { id: 'tokens' as AdminTab, label: 'Tokens', icon: Key },
          { id: 'usuarios' as AdminTab, label: 'Usuários', icon: Users },
          { id: 'questionarios' as AdminTab, label: 'Questionários', icon: FileQuestion },
          { id: 'respostas' as AdminTab, label: 'Respostas', icon: ClipboardList },
        ]).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center justify-center gap-1.5 px-1.5 py-2 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all flex-1 min-w-0 ${tab === t.id ? 'bg-white text-slate-800 shadow-sm border border-slate-200' : 'text-slate-500 hover:text-slate-700'}`}>
            <t.icon className="w-3 h-3 sm:w-3.5 sm:h-3.5 shrink-0" /><span className="truncate">{t.label}</span>
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-3 shadow-sm"><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase">Tokens</p><p className="text-base sm:text-lg font-black text-slate-800">{stats.tokensTotal}</p></div>
        <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-3 shadow-sm"><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase">Ativos</p><p className="text-base sm:text-lg font-black text-emerald-600">{stats.tokensAtivos}</p></div>
        <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-3 shadow-sm"><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase">Usuários</p><p className="text-base sm:text-lg font-black text-blue-600">{stats.usuariosAtivos}</p></div>
        <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-3 shadow-sm"><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase">Questionários</p><p className="text-base sm:text-lg font-black text-violet-600">{stats.questionariosAtivos}</p></div>
        <div className="bg-white rounded-xl border border-slate-100 p-2 sm:p-3 shadow-sm"><p className="text-[8px] sm:text-[9px] font-semibold text-slate-400 uppercase">Respostas</p><p className="text-base sm:text-lg font-black text-amber-600">{stats.respostasEnviadas}</p></div>
      </div>

      {tab === 'tokens' && <TokensTab ctx={ctx} crm={crm} />}
      {tab === 'usuarios' && <UsuariosTab ctx={ctx} crm={crm} />}
      {tab === 'questionarios' && <QuestionariosTab ctx={ctx} />}
      {tab === 'respostas' && <RespostasTab ctx={ctx} />}
    </div>
  )
}

// ==================== TOKENS TAB ====================
function TokensTab({ ctx, crm }: { ctx: ReturnType<typeof useAcessoTemporario>; crm: ReturnType<typeof useCrm> }) {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [expiresDays, setExpiresDays] = useState(30)
  const [copiedToken, setCopiedToken] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search) return ctx.accesses
    const q = search.toLowerCase()
    return ctx.accesses.filter(a => a.companyName.toLowerCase().includes(q) || a.token.toLowerCase().includes(q) || a.createdBy.toLowerCase().includes(q))
  }, [ctx.accesses, search])

  const handleCreate = () => {
    if (!selectedCompanyId) return
    const company = crm.companies.find(c => c.id === selectedCompanyId)
    if (!company) return
    const expires = new Date(Date.now() + expiresDays * 86400000).toISOString()
    const currentUserName = useAdmin().currentUser?.name || 'Administrador'
    ctx.createAccess(company.id, company.tradeName || company.name, expires, currentUserName)
    setShowCreate(false); setSelectedCompanyId(''); setExpiresDays(30)
  }

  const handleCopy = (token: string) => {
    const link = `${window.location.origin}/portal?token=${token}`
    navigator.clipboard.writeText(link)
    setCopiedToken(token); setTimeout(() => setCopiedToken(null), 2500)
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar acessos..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white text-[10px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all"><Plus className="w-3.5 h-3.5" /> Novo Acesso</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Empresa</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Token</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 hidden sm:table-cell">Criado por</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Expira</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 hidden md:table-cell">Último acesso</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Status</th>
                <th className="text-right px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(a => {
                const isExpired = new Date(a.expiresAt) <= new Date()
                const isValid = a.active && !isExpired
                return (
                  <tr key={a.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                    <td className="px-2 sm:px-4 py-2 sm:py-3"><div className="flex items-center gap-1.5 sm:gap-2"><Building2 className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" /><span className="font-semibold text-slate-700 truncate max-w-[80px] sm:max-w-none">{a.companyName}</span></div></td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3"><code className="px-1 sm:px-2 py-0.5 bg-slate-100 rounded text-[9px] sm:text-[10px] font-mono font-bold text-slate-600">{a.token}</code></td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 hidden sm:table-cell">{a.createdBy}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center"><span className={`inline-flex items-center justify-center gap-1 text-[9px] sm:text-[10px] ${isExpired ? 'text-red-500' : 'text-slate-600'}`}><Calendar className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">{new Date(a.expiresAt).toLocaleDateString('pt-BR')}</span><span className="xs:hidden">{new Date(a.expiresAt).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}</span></span></td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-slate-400 text-[9px] sm:text-[10px] hidden md:table-cell">{a.lastAccess ? new Date(a.lastAccess).toLocaleDateString('pt-BR') : '-'}</td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                      {isValid ? <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[8px] sm:text-[10px] font-semibold"><UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">Ativo</span></span>
                      : a.active && isExpired ? <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[8px] sm:text-[10px] font-semibold"><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">Expirado</span></span>
                      : <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 bg-red-50 text-red-700 border border-red-100 rounded text-[8px] sm:text-[10px] font-semibold"><UserX className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">Revogado</span></span>}
                    </td>
                    <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                      <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                        <button onClick={() => handleCopy(a.token)} className="p-1 sm:p-1.5 rounded-lg hover:bg-brand-teal/10 text-slate-400 hover:text-brand-teal" title="Copiar link">{copiedToken === a.token ? <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-500" /> : <Copy className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}</button>
                        {isValid && <button onClick={() => ctx.revokeAccess(a.id)} className="p-1 sm:p-1.5 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600" title="Revogar"><UserX className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>}
                        <button onClick={() => ctx.deleteAccess(a.id)} className="p-1 sm:p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Excluir"><Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 sm:p-12 text-center text-slate-400 text-[10px] sm:text-xs">Nenhum acesso temporário encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">Novo Acesso Temporário</h3>
            <div className="space-y-3">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Empresa</label>
                <select value={selectedCompanyId} onChange={e => setSelectedCompanyId(e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  <option value="">Selecione...</option>{crm.companies.map(c => <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>)}</select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Expirar em (dias)</label>
                <input type="number" min={1} max={365} value={expiresDays} onChange={e => setExpiresDays(Number(e.target.value))} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <p className="text-[10px] text-slate-500">Expira em: <strong>{new Date(Date.now() + expiresDays * 86400000).toLocaleDateString('pt-BR')}</strong></p>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handleCreate} disabled={!selectedCompanyId} className="flex-1 px-3 py-2 bg-brand-teal text-white text-[11px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all disabled:opacity-40">Criar Acesso</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==================== USUÁRIOS TAB ====================
function UsuariosTab({ ctx, crm }: { ctx: ReturnType<typeof useAcessoTemporario>; crm: ReturnType<typeof useCrm> }) {
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [form, setForm] = useState({ companyId: '', name: '', email: '', password: '' })

  const filtered = useMemo(() => {
    if (!search) return ctx.tempUsers
    const q = search.toLowerCase()
    return ctx.tempUsers.filter(u => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.companyName.toLowerCase().includes(q))
  }, [ctx.tempUsers, search])

  const handleCreate = () => {
    if (!form.companyId || !form.name.trim() || !form.email.trim() || !form.password.trim()) return
    const company = crm.companies.find(c => c.id === form.companyId)
    if (!company) return
    const currentUserName = useAdmin().currentUser?.name || 'Administrador'
    ctx.createTempUser({ companyId: form.companyId, companyName: company.tradeName || company.name, name: form.name.trim(), email: form.email.trim(), password: form.password, createdBy: currentUserName })
    setShowCreate(false); setForm({ companyId: '', name: '', email: '', password: '' })
    setSearch('')
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar usuários..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white text-[10px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all"><Plus className="w-3.5 h-3.5" /> Novo Usuário</button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px] sm:text-[11px]">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                <th className="text-left px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Nome</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 hidden sm:table-cell">E-mail</th>
                <th className="text-left px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Empresa</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 hidden md:table-cell">Criado em</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500 hidden lg:table-cell">Último acesso</th>
                <th className="text-center px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Status</th>
                <th className="text-right px-2 sm:px-4 py-2 sm:py-2.5 font-semibold text-slate-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(u => (
                <tr key={u.id} className="border-b border-slate-50 hover:bg-slate-50 transition-colors">
                  <td className="px-2 sm:px-4 py-2 sm:py-3"><div className="flex items-center gap-1.5 sm:gap-2"><User className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400 shrink-0" /><span className="font-semibold text-slate-700 truncate max-w-[80px] sm:max-w-none">{u.name}</span></div></td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 hidden sm:table-cell truncate max-w-[120px]">{u.email}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-slate-600 truncate max-w-[80px] sm:max-w-none">{u.companyName}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-slate-500 text-[9px] sm:text-[10px] hidden md:table-cell">{new Date(u.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center text-slate-400 text-[9px] sm:text-[10px] hidden lg:table-cell">{u.lastAccess ? new Date(u.lastAccess).toLocaleDateString('pt-BR') : 'Nunca'}</td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-center">
                    {u.active ? <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[8px] sm:text-[10px] font-semibold"><UserCheck className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">Ativo</span></span>
                    : <span className="inline-flex items-center gap-0.5 sm:gap-1 px-1 sm:px-2 py-0.5 bg-slate-100 text-slate-500 border border-slate-200 rounded text-[8px] sm:text-[10px] font-semibold"><UserX className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">Inativo</span></span>}
                  </td>
                  <td className="px-2 sm:px-4 py-2 sm:py-3 text-right">
                    <div className="flex items-center justify-end gap-0.5 sm:gap-1">
                      <button onClick={() => ctx.toggleTempUser(u.id)} className={`p-1 sm:p-1.5 rounded-lg ${u.active ? 'hover:bg-amber-50 text-amber-600' : 'hover:bg-emerald-50 text-emerald-600'}`} title={u.active ? 'Desativar' : 'Ativar'}>{u.active ? <ToggleRight className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> : <ToggleLeft className="w-3 h-3 sm:w-3.5 sm:h-3.5" />}</button>
                      <button onClick={() => ctx.deleteTempUser(u.id)} className="p-1 sm:p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600" title="Excluir"><Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && <tr><td colSpan={7} className="p-8 sm:p-12 text-center text-slate-400 text-[10px] sm:text-xs">Nenhum usuário encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      {showCreate && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowCreate(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-sm font-black text-slate-800 mb-4">Novo Usuário</h3>
            <div className="space-y-3">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Empresa</label>
                <select value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                  <option value="">Selecione...</option>{crm.companies.map(c => <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>)}</select></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Nome</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Nome completo" className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">E-mail</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@empresa.com" className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Senha</label>
                <input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Mínimo 6 caracteres" minLength={6} className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
            </div>
            <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
              <button onClick={handleCreate} disabled={!form.companyId || !form.name.trim() || !form.email.trim() || !form.password.trim()}
                className="flex-1 px-3 py-2 bg-brand-teal text-white text-[11px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all disabled:opacity-40">Criar Usuário</button>
              <button onClick={() => setShowCreate(false)} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==================== QUESTIONÁRIOS TAB ====================
function QuestionariosTab({ ctx }: { ctx: ReturnType<typeof useAcessoTemporario> }) {
  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const editing = editId ? ctx.questionnaires.find(q => q.id === editId) : null

  const [form, setForm] = useState({ title: '', description: '', instructions: '' })
  const [questions, setQuestions] = useState<Question[]>([])

  const resetForm = () => { setForm({ title: '', description: '', instructions: '' }); setQuestions([]); setEditId(null) }

  const openNew = () => { resetForm(); setShowCreate(true) }

  const openEdit = (q: typeof ctx.questionnaires[0]) => {
    setForm({ title: q.title, description: q.description || '', instructions: q.instructions || '' })
    setQuestions(q.questions.map(qq => ({ ...qq, options: qq.options ? qq.options.map(o => ({ ...o })) : undefined })))
    setEditId(q.id); setShowCreate(true)
  }

  const addQuestion = () => {
    setQuestions(prev => [...prev, { id: 'q-' + Date.now() + '-' + Math.random().toString(36).substring(2, 4), text: '', type: 'text', required: false, options: undefined, placeholder: '' }])
  }

  const removeQuestion = (id: string) => { setQuestions(prev => prev.filter(q => q.id !== id)) }

  const updateQuestion = (id: string, data: Partial<Question>) => { setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...data } : q)) }

  const addOption = (qId: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: [...(q.options || []), { id: 'opt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 4), label: '' }] } : q))
  }

  const updateOption = (qId: string, optId: string, label: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options?.map(o => o.id === optId ? { ...o, label } : o) } : q))
  }

  const removeOption = (qId: string, optId: string) => {
    setQuestions(prev => prev.map(q => q.id === qId ? { ...q, options: q.options?.filter(o => o.id !== optId) } : q))
  }

  const handleSave = () => {
    if (!form.title.trim()) return
    const currentUserName = useAdmin().currentUser?.name || 'Administrador'
    if (editId) {
      ctx.updateQuestionnaire(editId, { title: form.title.trim(), description: form.description.trim() || undefined, instructions: form.instructions.trim() || undefined, questions })
    } else {
      ctx.createQuestionnaire({ title: form.title.trim(), description: form.description.trim() || undefined, instructions: form.instructions.trim() || undefined, questions, createdBy: currentUserName })
    }
    setShowCreate(false); resetForm()
  }

  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[10px] text-slate-500">{ctx.questionnaires.filter(q => q.active).length} questionário(s) ativo(s)</p>
        <button onClick={openNew} className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-teal text-white text-[10px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all"><Plus className="w-3.5 h-3.5" /> Novo Questionário</button>
      </div>

      <div className="space-y-3">
        {ctx.questionnaires.map(q => (
          <div key={q.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(expandedId === q.id ? null : q.id)}>
              <div className="flex items-center gap-3">
                <FileQuestion className="w-4 h-4 text-violet-500" />
                <div><p className="text-sm font-bold text-slate-800">{q.title}</p><p className="text-[10px] text-slate-400">{q.questions.length} pergunta(s) • {q.description && <span>{q.description} • </span>}{new Date(q.createdAt).toLocaleDateString('pt-BR')}</p></div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); openEdit(q) }} className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600"><Edit3 className="w-3.5 h-3.5" /></button>
                <button onClick={e => { e.stopPropagation(); ctx.deleteQuestionnaire(q.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                {expandedId === q.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </div>
            </div>
            {expandedId === q.id && (
              <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                {q.instructions && <div className="mb-3 p-3 bg-amber-50 border border-amber-100 rounded-xl text-[10px] text-amber-800"><AlertTriangle className="w-3 h-3 inline mr-1" />{q.instructions}</div>}
                <div className="space-y-2">
                  {q.questions.map((qq, i) => (
                    <div key={qq.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] font-bold text-slate-400 w-5 mt-0.5">{i + 1}.</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-semibold text-slate-800">{qq.text}{qq.required && <span className="text-red-400 ml-0.5">*</span>}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-1.5 py-0.5 bg-slate-200 rounded text-[8px] font-bold text-slate-500">{QUESTION_TYPE_LABELS[qq.type]}</span>
                          {qq.placeholder && <span className="text-[9px] text-slate-400">Ex: {qq.placeholder}</span>}
                        </div>
                        {qq.options && qq.options.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">{qq.options.map(o => <span key={o.id} className="px-1.5 py-0.5 bg-violet-50 border border-violet-100 rounded text-[8px] text-violet-600">{o.label}</span>)}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
        {ctx.questionnaires.length === 0 && <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm"><FileQuestion className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-xs font-medium">Nenhum questionário cadastrado</p></div>}
      </div>

      {/* Create/Edit Modal */}
      {(showCreate || editId) && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center p-2 sm:p-4" onClick={() => { setShowCreate(false); resetForm() }}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 w-full max-w-2xl max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 shrink-0 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-800">{editId ? 'Editar Questionário' : 'Novo Questionário'}</h3>
              <button onClick={() => { setShowCreate(false); resetForm() }} className="p-1 rounded-lg hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-4 min-h-0">
            <div className="p-5 space-y-4">
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Título *</label>
                <input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Diagnóstico Organizacional" className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Descrição</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição do questionário" className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" /></div>
              <div><label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Instruções</label>
                <textarea value={form.instructions} onChange={e => setForm({ ...form, instructions: e.target.value })} rows={2} placeholder="Instruções para o preenchimento..." className="w-full text-[12px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none" /></div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase">Perguntas ({questions.length})</h4>
                  <button onClick={addQuestion} className="flex items-center gap-1 px-2.5 py-1.5 bg-violet-50 text-violet-700 border border-violet-200 rounded-lg text-[9px] font-bold hover:bg-violet-100"><Plus className="w-3 h-3" /> Adicionar</button>
                </div>
                {questions.length === 0 && <p className="text-center text-[11px] text-slate-400 py-6">Nenhuma pergunta adicionada. Clique em "Adicionar" para começar.</p>}
                <div className="space-y-3">{questions.map((q, i) => (
                  <div key={q.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold text-slate-400 bg-slate-200 rounded-full w-5 h-5 flex items-center justify-center">{i + 1}</span>
                      <input value={q.text} onChange={e => updateQuestion(q.id, { text: e.target.value })} placeholder="Digite a pergunta..." className="flex-1 text-[11px] font-semibold bg-transparent border-b border-transparent focus:border-slate-300 px-1 py-0.5 focus:outline-none" />
                      <button onClick={() => removeQuestion(q.id)} className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={q.type} onChange={e => updateQuestion(q.id, { type: e.target.value as QuestionType })} className="text-[9px] border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none">
                        {Object.entries(QUESTION_TYPE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      {q.placeholder !== undefined && (
                        <input value={q.placeholder || ''} onChange={e => updateQuestion(q.id, { placeholder: e.target.value })} placeholder="Placeholder..." className="text-[9px] border border-slate-200 rounded-lg px-2 py-1 bg-white w-32 focus:outline-none" />
                      )}
                      <label className="flex items-center gap-1 text-[9px] text-slate-500 cursor-pointer">
                        <input type="checkbox" checked={q.required} onChange={e => updateQuestion(q.id, { required: e.target.checked })} className="rounded border-slate-300" />
                        Obrigatória
                      </label>
                    </div>
                    {(q.type === 'select' || q.type === 'radio') && (
                      <div className="mt-2 pl-4 space-y-1">
                        {(q.options || []).map(o => (
                          <div key={o.id} className="flex items-center gap-1">
                            <span className="text-[8px] text-slate-400">{q.type === 'radio' ? '◉' : '▾'}</span>
                            <input value={o.label} onChange={e => updateOption(q.id, o.id, e.target.value)} placeholder="Opção..." className="text-[10px] border-b border-dotted border-slate-200 bg-transparent px-1 py-0.5 flex-1 focus:outline-none focus:border-slate-400" />
                            <button onClick={() => removeOption(q.id, o.id)} className="text-slate-300 hover:text-red-400"><X className="w-2.5 h-2.5" /></button>
                          </div>
                        ))}
                        <button onClick={() => addOption(q.id)} className="text-[9px] text-violet-600 font-semibold hover:text-violet-800 flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> Opção</button>
                      </div>
                    )}
                  </div>
                ))}</div>
            </div>
            </div>
          </div>
          <div className="shrink-0 px-4 sm:px-5 py-3 sm:py-4 border-t border-slate-100 flex items-center gap-2">
            <button onClick={handleSave} disabled={!form.title.trim() || questions.length === 0 || questions.some(q => !q.text.trim())}
              className="flex-1 px-3 py-2 bg-brand-teal text-white text-[11px] font-bold rounded-xl hover:bg-brand-teal/90 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
              <Save className="w-3.5 h-3.5" /> {editId ? 'Salvar Alterações' : 'Criar Questionário'}
            </button>
            <button onClick={() => { setShowCreate(false); resetForm() }} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
          </div>
          </div>
        </div>
      )}
    </>
  )
}

// ==================== RESPOSTAS TAB ====================
function RespostasTab({ ctx }: { ctx: ReturnType<typeof useAcessoTemporario> }) {
  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const filtered = useMemo(() => {
    if (!search) return ctx.responses
    const q = search.toLowerCase()
    return ctx.responses.filter(r => r.companyName.toLowerCase().includes(q) || r.questionnaireTitle.toLowerCase().includes(q) || r.userName.toLowerCase().includes(q))
  }, [ctx.responses, search])

  return (
    <>
      <div className="relative max-w-xs">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar respostas..." className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
      </div>

      <div className="space-y-3">
        {filtered.map(r => {
          const q = ctx.questionnaires.find(qq => qq.id === r.questionnaireId)
          return (
            <div key={r.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}>
                <div className="flex items-center gap-3">
                  <ClipboardList className="w-4 h-4 text-amber-500" />
                  <div>
                    <p className="text-sm font-bold text-slate-800">{r.questionnaireTitle}</p>
                    <p className="text-[10px] text-slate-400">{r.companyName} • {r.userName} • {new Date(r.submittedAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${r.status === 'submitted' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>{r.status === 'submitted' ? 'Enviado' : 'Rascunho'}</span>
                  {expandedId === r.id ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </div>
              {expandedId === r.id && q && (
                <div className="px-4 pb-4 border-t border-slate-100 pt-3">
                  <div className="space-y-2">
                    {q.questions.map(qq => {
                      const answer = r.answers.find(a => a.questionId === qq.id)
                      const value = answer ? (Array.isArray(answer.value) ? answer.value.join(', ') : answer.value) : '-'
                      return (
                        <div key={qq.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                          <p className="text-[10px] font-semibold text-slate-600 mb-1">{qq.text}{qq.required && <span className="text-red-400 ml-0.5">*</span>}</p>
                          <p className="text-[12px] font-medium text-slate-800">{value}</p>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>
          )
        })}
        {filtered.length === 0 && <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center text-slate-400 shadow-sm"><ClipboardList className="w-10 h-10 text-slate-200 mx-auto mb-3" /><p className="text-xs font-medium">Nenhuma resposta encontrada.</p></div>}
      </div>
    </>
  )
}
