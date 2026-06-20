'use client'

import { useState } from 'react'
import { usePortal } from './context/PortalContext'
import { useRouter } from 'next/navigation'
import { Loader2, Building2, Mail, Lock, Key } from 'lucide-react'

const DEMO_USERS = [
  { email: 'carlos@brdistribuidora.com', name: 'Carlos Silva', role: 'Diretoria', company: 'BR Distribuidora' },
  { email: 'ana@brdistribuidora.com', name: 'Ana Oliveira', role: 'RH', company: 'BR Distribuidora' },
  { email: 'roberto@vale.com', name: 'Roberto Lima', role: 'Diretoria', company: 'Vale S.A.' },
  { email: 'marina@vale.com', name: 'Marina Costa', role: 'Líder', company: 'Vale S.A.' },
  { email: 'pedro@itau.com', name: 'Pedro Santos', role: 'Financeiro', company: 'Banco Itaú' },
]

type LoginMode = 'email' | 'token'

export default function PortalLoginPage() {
  const { login, loginWithToken } = usePortal()
  const router = useRouter()
  const [mode, setMode] = useState<LoginMode>('email')
  const [email, setEmail] = useState('')
  const [token, setToken] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      let ok = false
      if (mode === 'email') {
        if (!email.trim()) { setError('Informe seu e-mail'); setLoading(false); return }
        ok = await login(email.trim())
        if (!ok) setError('E-mail não encontrado ou usuário inativo.')
      } else {
        if (!token.trim()) { setError('Informe o token de acesso'); setLoading(false); return }
        ok = await loginWithToken(token.trim())
        if (!ok) setError('Token inválido ou expirado.')
      }
      if (ok) router.push('/portal/dashboard')
    } catch { setError('Erro ao conectar. Tente novamente.') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[420px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Portal do Cliente</h1>
          <p className="text-sm text-slate-400 mt-1">CrepaldiDH — Soluções em DHO</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 sm:p-8 shadow-2xl">
          <div className="flex mb-6 bg-white/5 rounded-xl p-1">
            <button type="button" onClick={() => setMode('email')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'email' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><Mail className="w-3.5 h-3.5" /> E-mail</button>
            <button type="button" onClick={() => setMode('token')} className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${mode === 'token' ? 'bg-violet-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}><Key className="w-3.5 h-3.5" /> Token</button>
          </div>
          {mode === 'email' ? (
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail de acesso</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors" autoFocus />
            </div>
          </div>
          ) : (
          <div className="mb-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Token de acesso</label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="text" value={token} onChange={e => setToken(e.target.value)} placeholder="Cole seu token aqui" className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors font-mono tracking-wider" autoFocus />
            </div>
          </div>
          )}

          {error && <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-5 sm:mt-8 bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-4 sm:p-6 max-h-[200px] sm:max-h-none overflow-y-auto">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-500 uppercase tracking-wider text-center mb-3 sm:mb-4">Contas de demonstração</p>
          <div className="space-y-1.5 sm:space-y-2">
            {DEMO_USERS.map(u => (
              <button key={u.email} onClick={() => setEmail(u.email)}
                className="w-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-xl hover:bg-white/5 transition-colors text-left group">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-white shrink-0">
                  {u.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] sm:text-xs font-bold text-slate-300 group-hover:text-white transition-colors truncate">{u.name}</p>
                  <p className="text-[8px] sm:text-[9px] text-slate-500 truncate">{u.company} • {u.role}</p>
                </div>
                <span className="text-[8px] sm:text-[9px] text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">Selecionar</span>
              </button>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-6">CrepaldiDH ERP v2.0 • Portal do Cliente</p>
      </div>
    </div>
  )
}
