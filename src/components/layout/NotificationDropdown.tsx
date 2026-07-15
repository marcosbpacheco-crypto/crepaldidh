'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X, LogIn, LogOut, UserPlus, Edit2, Trash2, Download, Eye, Activity, Clock } from 'lucide-react'
import { useAdmin } from '@/app/(dashboard)/admin/context/AdminContext'
import { safeArray } from '@/lib/safe-array'

const ACTION_ICONS: Record<string, typeof LogIn> = {
  login: LogIn, logout: LogOut, create: UserPlus, update: Edit2,
  delete: Trash2, download: Download, export: Activity, view: Eye,
}
const ACTION_COLORS: Record<string, string> = {
  login: 'text-emerald-600 bg-emerald-50', logout: 'text-slate-600 bg-slate-50',
  create: 'text-blue-600 bg-blue-50', update: 'text-amber-600 bg-amber-50',
  delete: 'text-red-600 bg-red-50', download: 'text-violet-600 bg-violet-50',
  export: 'text-cyan-600 bg-cyan-50', view: 'text-slate-600 bg-slate-50',
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'agora'
  if (mins < 60) return `${mins} min`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  const days = Math.floor(hrs / 24)
  return `${days}d`
}

export function NotificationDropdown() {
  const admin = useAdmin()
  const [open, setOpen] = useState(false)
  const [readIds, setReadIds] = useState<Set<string>>(new Set())
  const ref = useRef<HTMLDivElement>(null)

  const logs = safeArray(admin.auditLogs).slice(0, 10)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const unreadCount = logs.filter(l => !readIds.has(l.id)).length

  function markAllRead() {
    const ids = new Set(logs.map(l => l.id))
    const merged = new Set([...readIds, ...ids])
    setReadIds(merged)
  }

  function getIcon(action: string) {
    const Icon = ACTION_ICONS[action] || Activity
    return <Icon className="w-3.5 h-3.5" />
  }

  function getColor(action: string) {
    return ACTION_COLORS[action] || 'text-slate-600 bg-slate-50'
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 text-slate-400 hover:text-brand-teal transition-colors"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-teal rounded-full border-2 border-white" />
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-50">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-brand-teal" />
              <span className="text-xs font-bold text-slate-700 uppercase">Notificações</span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.5 bg-brand-teal/10 text-brand-teal text-[9px] font-bold rounded-full">{unreadCount} nova(s)</span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[9px] font-semibold text-brand-teal hover:text-brand-teal/80 px-2 py-1 rounded-lg hover:bg-brand-teal/5 transition-colors">
                  Marcar todas lidas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 text-slate-300 hover:text-slate-500">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">Nenhuma movimentação registrada.</div>
            ) : (
              logs.map((log) => {
                const isRead = readIds.has(log.id)
                return (
                  <div
                    key={log.id}
                    className={`flex items-start gap-3 px-4 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors ${!isRead ? 'bg-brand-teal/[0.02]' : ''}`}
                  >
                    <div className={`mt-0.5 w-7 h-7 rounded-lg flex items-center justify-center border ${getColor(log.action)}`}>
                      {getIcon(log.action)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">{log.description}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[9px] text-slate-400 font-medium">{log.userName}</span>
                        <span className="text-[9px] text-slate-300">•</span>
                        <span className="text-[9px] text-slate-400 flex items-center gap-0.5">
                          <Clock className="w-2.5 h-2.5" /> {timeAgo(log.createdAt)}
                        </span>
                      </div>
                    </div>
                    {!isRead && (
                      <span className="w-1.5 h-1.5 rounded-full bg-brand-teal mt-2 flex-shrink-0" />
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
