'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, Mail, Lock, Loader2, LogIn } from 'lucide-react'

export default function EntrarPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!email.trim() || !password.trim()) { setError('Preencha todos os campos'); return }
    setLoading(true)
    try {
      const stored = localStorage.getItem('acesso_temporario_users')
      if (stored) {
        const users = JSON.parse(stored)
        const found = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.active)
        if (found) {
          localStorage.setItem('temp_access_user', JSON.stringify(found))
          router.push('/acesso-temporario/coleta')
          return
        }
      }
      setError('E-mail ou senha inválidos.')
    } catch { setError('Erro ao conectar. Tente novamente.') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-xl mb-4">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white">Coleta de Dados</h1>
          <p className="text-sm text-slate-400 mt-1">Acesso restrito — Clientes CrepaldiDH</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-5 sm:p-8 shadow-2xl space-y-3 sm:space-y-4">
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors" autoFocus />
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Sua senha" className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2.5 sm:py-3 bg-white/10 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-violet-500 transition-colors" />
            </div>
          </div>

          {error && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-400 text-center">{error}</div>}

          <button type="submit" disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-600 mt-6">CrepaldiDH ERP v2.0 • Coleta de Dados</p>
      </div>
    </div>
  )
}
