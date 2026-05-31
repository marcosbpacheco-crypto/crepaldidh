'use client'

import { LogOut } from 'lucide-react'
import { logout } from '@/app/(auth)/login/actions'

export function LogoutButton() {
  return (
    <button
      onClick={() => logout()}
      className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:bg-red-500/10 hover:text-red-400 transition-all duration-300 group"
    >
      <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform" />
      <span className="text-sm font-medium">Sair do Sistema</span>
    </button>
  )
}
