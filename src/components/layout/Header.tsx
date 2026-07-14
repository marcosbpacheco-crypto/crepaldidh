'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, User, Menu, LogOut, X } from "lucide-react"
import { NotificationDropdown } from "./NotificationDropdown"
import { logout } from '@/app/(auth)/login/actions'
import { useSidebar } from "./SidebarContext"
import { useAdmin } from '@/app/(dashboard)/admin/context/AdminContext'

export function Header() {
  const { toggle, isOpen } = useSidebar()
  const { currentUser } = useAdmin()
  const [showDropdown, setShowDropdown] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

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
    await logout()
  }

  return (
    <header className="h-16 lg:h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-3 sm:px-6 lg:px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-2 sm:gap-4 w-full max-w-md">
        <button onClick={toggle} className="lg:hidden p-1.5 sm:p-2 text-slate-500 hover:text-brand-blue hover:bg-slate-100 rounded-lg transition-colors">
          {isOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
        <div className="flex-1 flex items-center bg-slate-100/80 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/20 transition-all">
          <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400 mr-2 sm:mr-3 shrink-0" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="bg-transparent border-none outline-none text-xs sm:text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-2 sm:gap-6" ref={dropdownRef}>
        <NotificationDropdown />
        
        <div className="h-6 sm:h-8 w-px bg-slate-200 hidden sm:block"></div>
        
        <div className="relative">
          <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-1 sm:gap-3 hover:bg-slate-50 p-1 sm:p-2 rounded-full sm:pr-4 transition-all border border-transparent hover:border-slate-200">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-brand-blue-light/10 text-brand-blue rounded-full flex items-center justify-center font-bold text-xs sm:text-sm">
              {currentUser?.name ? (
                <span>{currentUser.name.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <div className="flex-col items-start text-left hidden lg:flex">
              <span className="text-sm font-semibold text-slate-800 leading-none mb-1">{currentUser?.name || 'Carregando...'}</span>
              <span className="text-xs text-brand-teal font-medium uppercase tracking-wider">{currentUser?.roleName || ''}</span>
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
