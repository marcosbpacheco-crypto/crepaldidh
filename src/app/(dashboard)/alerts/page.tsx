'use client'

import { useAlerts } from './context/AlertsContext'
import { Bell, AlertTriangle, CheckCheck, Calendar, FileText, Building2, Briefcase, CheckCircle2 } from 'lucide-react'

const ALERT_ICONS: Record<string, any> = {
  project_delayed: Briefcase,
  task_overdue: AlertTriangle,
  client_no_interaction: Building2,
  contract_expiring: FileText,
  document_pending: FileText,
  training_upcoming: Calendar,
}

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-50 border-red-200 text-red-700',
  high: 'bg-orange-50 border-orange-200 text-orange-700',
  medium: 'bg-amber-50 border-amber-200 text-amber-700',
  low: 'bg-blue-50 border-blue-200 text-blue-700',
}

const SEVERITY_DOTS: Record<string, string> = {
  critical: 'bg-red-500', high: 'bg-orange-500', medium: 'bg-amber-500', low: 'bg-blue-500',
}

export default function AlertsPage() {
  const { alerts, markAsRead, markAllAsRead, unreadCount } = useAlerts()

  const grouped = {
    critical: alerts.filter(a => a.severity === 'critical'),
    high: alerts.filter(a => a.severity === 'high'),
    medium: alerts.filter(a => a.severity === 'medium'),
    low: alerts.filter(a => a.severity === 'low'),
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Alertas Operacionais</h1>
          <p className="text-slate-500 text-sm mt-0.5">{alerts.length} alerta(s) · {unreadCount} não lido(s)</p>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllAsRead} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
            <CheckCheck className="w-4 h-4" /> Marcar todos como lidos
          </button>
        )}
      </div>

      {alerts.length === 0 ? (
        <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
          <Bell className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-medium text-sm">Nenhum alerta no momento</p>
          <p className="text-xs text-slate-300 mt-1">Tudo em dia! Os alertas aparecerão automaticamente aqui.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {(['critical', 'high', 'medium', 'low'] as const).map(sev => {
            const items = grouped[sev]
            if (items.length === 0) return null
            return (
              <div key={sev}>
                <h3 className="text-xs font-bold uppercase text-slate-400 tracking-wider mb-3 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${SEVERITY_DOTS[sev]}`} />
                  {sev === 'critical' ? 'Críticos' : sev === 'high' ? 'Altos' : sev === 'medium' ? 'Médios' : 'Baixos'} ({items.length})
                </h3>
                <div className="space-y-2">
                  {items.map(a => {
                    const Icon = ALERT_ICONS[a.type] || Bell
                    const isUnread = !a.isRead
                    return (
                      <div
                        key={a.id}
                        onClick={() => markAsRead(a.id)}
                        className={`bg-white rounded-2xl border p-4 shadow-sm flex items-start gap-4 cursor-pointer transition-all hover:shadow-md ${SEVERITY_COLORS[a.severity].split(' ').slice(0, 2).join(' ')} ${isUnread ? 'ring-2 ring-violet-100' : 'opacity-70'}`}
                      >
                        <div className={`p-2.5 rounded-xl ${a.severity === 'critical' ? 'bg-red-50' : a.severity === 'high' ? 'bg-orange-50' : a.severity === 'medium' ? 'bg-amber-50' : 'bg-blue-50'}`}>
                          <Icon className={`w-5 h-5 ${a.severity === 'critical' ? 'text-red-600' : a.severity === 'high' ? 'text-orange-600' : a.severity === 'medium' ? 'text-amber-600' : 'text-blue-600'}`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="text-sm font-bold text-slate-800">{a.title}</h4>
                            {isUnread && <span className="w-2 h-2 rounded-full bg-violet-500" />}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>
                          <p className="text-[9px] text-slate-400 mt-1.5">{new Date(a.createdAt).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
