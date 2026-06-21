'use client'

import { useState, useEffect } from 'react'
import { setSessionCookie, syncUsersToCookie, getUsersFromCookie } from './actions'
import { Mail, Lock, ArrowRight } from 'lucide-react'
import type { User } from '@/app/(dashboard)/admin/context/AdminContext'

// BOOTSTRAP_ADMIN — unico usuario de bootstrap para primeiro acesso.
// Usado SOMENTE quando nao ha nenhum dado em localStorage nem no servidor.
// Nunca e reinserido apos o primeiro login — usuarios deletados permanecem deletados.
const BOOTSTRAP_ADMIN: User = {
  id: 'user-admin', name: 'Administrador Master', email: 'admin@crepaldidh.com.br',
  phone: '(11) 99999-0000', avatar: 'AD', roleId: 'role-admin', roleName: 'Administrador',
  isExternal: false, active: true, password: 'admin123', loginAttempts: 0, mfaEnabled: false,
  createdAt: '2025-01-01T00:00:00Z', tenantId: 'tnt-crepaldi',
}

// IDs do antigo SEED_USERS que devem ser removidos na migracao (cross-device)
const OLD_SEED_IDS = new Set(['user-admin', 'user-dir', 'user-cons', 'user-comm', 'user-fin', 'user-rh', 'user-dho', 'user-op'])

export function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, setPending] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [recoverySent, setRecoverySent] = useState(false)

  // Fetch users from server store (cross-device sync) on mount
  const [serverUsers, setServerUsers] = useState<User[]>([])
  useEffect(() => {
    getUsersFromCookie().then(json => {
      if (json) {
        try {
          const parsed = JSON.parse(json)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setServerUsers(parsed)
          }
        } catch {}
      }
    }).catch(() => {})
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setPending(true)

    const emailNorm = email.trim().toLowerCase()
    const passNorm = password.trim()

    // Try to fetch latest users from server store in case useEffect hasn't completed yet
    let liveServerUsers = serverUsers
    if (liveServerUsers.length === 0) {
      try {
        const json = await getUsersFromCookie()
        if (json) {
          const parsed = JSON.parse(json)
          if (Array.isArray(parsed) && parsed.length > 0) {
            liveServerUsers = parsed
          }
        }
      } catch {}
    }
    // Migracao: limpa IDs do antigo SEED_USERS do servidor tambem
    if (liveServerUsers.length > 0) {
      liveServerUsers = liveServerUsers.filter(user => {
        if (!OLD_SEED_IDS.has(user.id)) return true
        return user.email === BOOTSTRAP_ADMIN.email && user.id === BOOTSTRAP_ADMIN.id
      })
    }

    // Read users from localStorage (set by AdminContext) — fonte de verdade
    let storedUsers: User[] = []
    try {
      const stored = localStorage.getItem('admin_users')
      if (stored) storedUsers = JSON.parse(stored)
      // Migracao: remove usuarios com IDs do antigo SEED_USERS (cross-device cleanup)
      if (Array.isArray(storedUsers) && storedUsers.length > 0) {
        storedUsers = storedUsers.filter(user => {
          if (!OLD_SEED_IDS.has(user.id)) return true
          return user.email === BOOTSTRAP_ADMIN.email && user.id === BOOTSTRAP_ADMIN.id
        })
      }
    } catch {}

    const hasLocalData = storedUsers.length > 0
    const hasServerData = liveServerUsers.length > 0

    // Determinar se e bootstrap (primeiro acesso, nenhum dado existe)
    const isBootstrap = !hasLocalData && !hasServerData
    const availableUsers = isBootstrap ? [BOOTSTRAP_ADMIN] : [...liveServerUsers, ...storedUsers]

    // Find user by email
    const user = availableUsers.find(u => u.email.trim().toLowerCase() === emailNorm)

    if (!user) {
      setError('E-mail ou senha inválidos.')
      setPending(false)
      return
    }

    // Verificar senha
    const sourcePass = isBootstrap
      ? BOOTSTRAP_ADMIN.password
      : (storedUsers.find(u => u.id === user.id)?.password || liveServerUsers.find(u => u.id === user.id)?.password)

    if (!sourcePass || passNorm !== sourcePass) {
      setError('E-mail ou senha inválidos.')
      setPending(false)
      return
    }

    if (!user.active) {
      setError('Usuário inativo. Contate o administrador.')
      setPending(false)
      return
    }

    // Construir lista final: localStorage sempre vence sobre dados do servidor
    // NUNCA inclui BOOTSTRAP_ADMIN ou seed — usuarios deletados permanecem deletados
    const mergedMap = new Map<string, User>()
    liveServerUsers.forEach(u => mergedMap.set(u.id, u))
    storedUsers.forEach(u => mergedMap.set(u.id, u))
    // Se for bootstrap, adiciona o admin ao mapa para persistir
    if (isBootstrap) {
      const bootstrapUser = { ...BOOTSTRAP_ADMIN, password: passNorm }
      mergedMap.set(bootstrapUser.id, bootstrapUser)
    }
    // Atualizar senha para o valor digitado
    if (mergedMap.has(user.id)) {
      mergedMap.get(user.id)!.password = passNorm
    }
    const mergedUsers = [...mergedMap.values()]

    // Update lastLogin
    user.lastLogin = new Date().toISOString()
    try { localStorage.setItem('admin_users', JSON.stringify(mergedUsers)) } catch {}

    // Store current user info
    localStorage.setItem('current_user', JSON.stringify({ id: user.id, name: user.name, email: user.email, roleId: user.roleId, roleName: user.roleName }))

    // Set session cookie via server action + client-side fallback
    try { await setSessionCookie(user.id, user.name, user.roleName) } catch {}
    document.cookie = `sb-mock-session=${JSON.stringify({ userId: user.id, userName: user.name, userRole: user.roleName })}; path=/; max-age=86400`

    // Sync merged user list to server store (cookie + in-memory) so all devices see the latest users
    try { await syncUsersToCookie(JSON.stringify(mergedUsers)) } catch {}
    document.cookie = `admin_users_cache=${JSON.stringify(mergedUsers)}; path=/; max-age=${86400 * 30}`

    window.location.href = '/'
  }

  const handleForgotPassword = () => {
    let storedUsers: User[] = []
    try {
      const stored = localStorage.getItem('admin_users')
      if (stored) storedUsers = JSON.parse(stored)
    } catch {}

    // Find user by email — apenas dados reais, nunca seed mock
    const targetUser = storedUsers.find(u => u.email === email)

    if (!targetUser) {
      setError('E-mail não encontrado no sistema.')
      return
    }

    // Find admins and directors to notify
    const adminsAndDirectors = storedUsers.filter(u =>
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
