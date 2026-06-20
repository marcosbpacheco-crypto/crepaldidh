'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, Menu, LogOut } from "lucide-react"
import { NotificationDropdown } from "./NotificationDropdown"
import { logout } from '@/app/(auth)/login/actions'

export function Header() {
  const [user, setUser] = useState<{ name: string; roleName: string } | null>(null)
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('current_user')
      if (stored) setUser(JSON.parse(stored))
    } catch {}
  }, [])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('current_user')
    await logout()
  }

  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4 w-full max-w-md">
        <button className="md:hidden p-2 text-slate-500 hover:text-brand-blue">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 flex items-center bg-slate-100/80 rounded-full px-4 py-2.5 border border-slate-200 focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/20 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Buscar no sistema..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6" ref={dropdownRef}>
        <NotificationDropdown />
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
        
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-full pr-4 transition-all border border-transparent hover:border-slate-200">
            <div className="w-10 h-10 bg-brand-blue-light/10 text-brand-blue rounded-full flex items-center justify-center font-bold text-sm">
              {user?.name ? (
                <span>{user.name.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="flex flex-col items-start text-left hidden sm:flex">
              <span className="text-sm font-semibold text-slate-800 leading-none mb-1">{user?.name || 'Carregando...'}</span>
              <span className="text-xs text-brand-teal font-medium uppercase tracking-wider">{user?.roleName || ''}</span>
            </div>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1 z-50">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                <LogOut className="w-4 h-4" />
                Sair do Sistema
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
