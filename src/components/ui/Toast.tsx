'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface Toast {
  id: string
  type: ToastType
  title: string
  message?: string
}

interface ToastContextType {
  toasts: Toast[]
  addToast: (type: ToastType, title: string, message?: string) => void
  removeToast: (id: string) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    return { toasts: [], addToast: () => {}, removeToast: () => {} }
  }
  return ctx
}

const ICONS = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

const COLORS = {
  success: { bg: 'bg-emerald-50 border-emerald-200', icon: 'text-emerald-600', title: 'text-emerald-800', text: 'text-emerald-600' },
  error: { bg: 'bg-red-50 border-red-200', icon: 'text-red-600', title: 'text-red-800', text: 'text-red-600' },
  warning: { bg: 'bg-amber-50 border-amber-200', icon: 'text-amber-600', title: 'text-amber-800', text: 'text-amber-600' },
  info: { bg: 'bg-blue-50 border-blue-200', icon: 'text-blue-600', title: 'text-blue-800', text: 'text-blue-600' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map(t => {
          const c = COLORS[t.type]
          const Icon = ICONS[t.type]
          return (
            <div
              key={t.id}
              className={`${c.bg} border rounded-xl shadow-lg p-3 flex items-start gap-3 animate-in slide-in-from-right-4 fade-in duration-300 pointer-events-auto`}
            >
              <Icon className={`w-5 h-5 ${c.icon} flex-shrink-0 mt-0.5`} />
              <div className="flex-1 min-w-0">
                <p className={`text-xs font-bold ${c.title}`}>{t.title}</p>
                {t.message && <p className={`text-[11px] ${c.text} mt-0.5`}>{t.message}</p>}
              </div>
              <button onClick={() => removeToast(t.id)} className={`${c.icon} hover:opacity-70 transition-opacity flex-shrink-0`}>
                <X className="w-4 h-4" />
              </button>
            </div>
          )
        })}
      </div>
    </ToastContext.Provider>
  )
}
