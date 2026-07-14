'use client'

import { useState } from 'react'
import { setSessionCookie } from './actions'
import { Mail, Lock, ArrowRight } from 'lucide-react'

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPending(true)

    const emailNorm = email.trim().toLowerCase()
    const passNorm = password.trim()

    try {
      const res = await fetch('/api/prisma/admin')
      if (!res.ok) throw new Error('Erro ao carregar usuários')
      const data = await res.json()
      const users: any[] = data.users || []

      const user = users.find(u => u.email?.trim().toLowerCase() === emailNorm)

      if (!user) {
        setError('E-mail ou senha inválidos.')
        setPending(false)
        return
      }

      if (!user.active) {
        setError('Usuário inativo. Contate o administrador.')
        setPending(false)
        return
      }

      if (user.password !== passNorm) {
        setError('E-mail ou senha inválidos.')
        setPending(false)
        return
      }

      await setSessionCookie(user.id, user.name, user.roleName)
      window.location.href = '/'
    } catch {
      setError('Erro ao conectar ao servidor. Tente novamente.')
      setPending(false)
    }
  }

  const handleForgotPassword = async () => {
    try {
      const res = await fetch('/api/prisma/admin')
      if (!res.ok) throw new Error()
      const data = await res.json()
      const users: any[] = data.users || []
      const targetUser = users.find(u => u.email === email)

      if (!targetUser) {
        setError('E-mail não encontrado no sistema.')
        return
      }

      setRecoverySent(true)
      setShowForgot(false)
    } catch {
      setError('Erro ao conectar ao servidor. Tente novamente.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
      {error && (
        <div className="p-2.5 sm:p-3 bg-red-50 text-red-600 rounded-lg text-xs sm:text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {recoverySent && (
        <div className="p-2.5 sm:p-3 bg-emerald-50 text-emerald-600 rounded-lg text-xs sm:text-sm font-medium border border-emerald-100">
          Solicitação enviada! Administradores e diretores foram notificados para redefinir sua senha.
        </div>
      )}

      <div className="space-y-3 sm:space-y-3.5">
        <div>
          <label className="block text-xs sm:text-sm font-medium text-slate-700 mb-1" htmlFor="email">
            E-mail Corporativo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all text-xs sm:text-sm"
              placeholder="seu.nome@empresa.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-xs sm:text-sm font-medium text-slate-700" htmlFor="password">
              Senha
            </label>
            {!recoverySent && (
              <button type="button" onClick={() => setShowForgot(!showForgot)}
                className="text-[10px] sm:text-xs font-semibold text-brand-teal hover:text-brand-teal/80 transition-colors">
                Esqueceu a senha?
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full pl-9 sm:pl-10 pr-3 py-2 sm:py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all text-xs sm:text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      {showForgot && (
        <div className="p-3 sm:p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-[10px] sm:text-xs text-amber-800 font-medium mb-1.5 sm:mb-2">
            Sua solicitação será enviada para administradores e diretores do sistema, que poderão redefinir sua senha.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleForgotPassword}
              className="flex-1 py-1.5 sm:py-2 bg-amber-600 text-white text-[10px] sm:text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors">
              Solicitar Redefinição
            </button>
            <button type="button" onClick={() => setShowForgot(false)}
              className="px-3 py-1.5 sm:py-2 border border-amber-200 text-[10px] sm:text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex justify-center items-center py-2.5 sm:py-3 px-5 sm:px-6 border border-transparent rounded-full shadow-md shadow-brand-teal/25 text-xs sm:text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-70 transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
      >
        {pending ? (
          <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            Entrar no Sistema
            <ArrowRight className="ml-1.5 sm:ml-2 w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
}
