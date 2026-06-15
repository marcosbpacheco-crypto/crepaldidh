'use client'

import { useState, useEffect } from 'react'
import { localLogin } from './actions'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import Image from 'next/image'
import type { User } from '@/app/(dashboard)/admin/context/AdminContext'

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

    // Load users from localStorage
    let users: User[] = []
    try {
      const stored = localStorage.getItem('admin_users')
      if (stored) users = JSON.parse(stored)
    } catch {}

    const user = users.find(u => u.email === email && u.password === password)

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

    // Update lastLogin
    user.lastLogin = new Date().toISOString()
    try { localStorage.setItem('admin_users', JSON.stringify(users)) } catch {}

    // Store current user info for the app to use
    localStorage.setItem('current_user', JSON.stringify({ id: user.id, name: user.name, email: user.email, roleId: user.roleId, roleName: user.roleName }))

    // Call server action to set session cookie
    try {
      await localLogin(user.id, user.name, user.roleName)
    } catch {
      // If server action fails (e.g., in dev), redirect manually
      window.location.href = '/'
    }
  }

  const handleForgotPassword = () => {
    let users: User[] = []
    try {
      const stored = localStorage.getItem('admin_users')
      if (stored) users = JSON.parse(stored)
    } catch {}

    const targetUser = users.find(u => u.email === email)
    if (!targetUser) {
      setError('E-mail não encontrado no sistema.')
      return
    }

    // Find admins and directors to notify
    const adminsAndDirectors = users.filter(u =>
      (u.roleName === 'Administrador' || u.roleName === 'Diretor') && u.active
    )

    // Add a recovery request notification (via audit log in localStorage)
    try {
      const auditLogs = JSON.parse(localStorage.getItem('admin_audit_logs') || '[]')
      auditLogs.unshift({
        id: `aud-${Date.now()}`,
        userId: targetUser.id,
        userName: targetUser.name,
        userRole: targetUser.roleName,
        action: 'password_recovery',
        entity: 'user',
        entityId: targetUser.id,
        description: `Solicitação de recuperação de senha para ${targetUser.name} (${targetUser.email}). Notificados: ${adminsAndDirectors.map(u => u.name).join(', ')}`,
        ipAddress: '127.0.0.1',
        createdAt: new Date().toISOString(),
      })
      localStorage.setItem('admin_audit_logs', JSON.stringify(auditLogs.slice(0, 1000)))
    } catch {}

    setRecoverySent(true)
    setShowForgot(false)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">
          {error}
        </div>
      )}

      {recoverySent && (
        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-lg text-sm font-medium border border-emerald-100">
          Solicitação enviada! Administradores e diretores foram notificados para redefinir sua senha.
        </div>
      )}

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5" htmlFor="email">
            E-mail Corporativo
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all text-sm"
              placeholder="seu.nome@empresa.com"
            />
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-sm font-medium text-slate-700" htmlFor="password">
              Senha
            </label>
            {!recoverySent && (
              <button type="button" onClick={() => setShowForgot(!showForgot)}
                className="text-xs font-semibold text-brand-teal hover:text-brand-teal/80 transition-colors">
                Esqueceu a senha?
              </button>
            )}
          </div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-slate-400" />
            </div>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all text-sm"
              placeholder="••••••••"
            />
          </div>
        </div>
      </div>

      {showForgot && (
        <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
          <p className="text-xs text-amber-800 font-medium mb-2">
            Sua solicitação será enviada para administradores e diretores do sistema, que poderão redefinir sua senha.
          </p>
          <div className="flex gap-2">
            <button type="button" onClick={handleForgotPassword}
              className="flex-1 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl hover:bg-amber-700 transition-colors">
              Solicitar Redefinição
            </button>
            <button type="button" onClick={() => setShowForgot(false)}
              className="px-3 py-2 border border-amber-200 text-xs font-semibold rounded-xl hover:bg-amber-100 transition-colors">
              Cancelar
            </button>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full flex justify-center items-center py-3 px-6 border border-transparent rounded-full shadow-md shadow-brand-teal/25 text-sm font-bold text-white bg-brand-teal hover:bg-brand-teal/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-teal disabled:opacity-70 transition-all duration-300 group hover:shadow-lg hover:-translate-y-0.5"
      >
        {pending ? (
          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <>
            Entrar no Sistema
            <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </button>
    </form>
  )
}
