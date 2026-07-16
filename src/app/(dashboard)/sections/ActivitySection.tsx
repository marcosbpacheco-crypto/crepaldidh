'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Activity, ChevronRight, Phone, Users, MessageSquare, Mail, MapPin, FileDown } from 'lucide-react'

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  call: Phone, meeting: Users, whatsapp: MessageSquare, email: Mail,
  visit: MapPin, proposal: FileDown, contract: FileDown, comment: MessageSquare,
}

export function ActivitySection({ activities, companies }: { activities: any[]; companies: any[] }) {
  const router = useRouter()

  const recentActivities = useMemo(() => {
    return [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
  }, [activities])

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Activity className="w-5 h-5 text-violet-500" /> Atividades Recentes
        </h2>
        <button onClick={() => router.push('/crm')} className="text-brand-teal text-sm font-medium hover:underline flex items-center">
          Ver todas <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="space-y-0">
        {recentActivities.length === 0 ? (
          <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
            <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
            <p className="text-xs text-slate-400">Nenhuma atividade registrada ainda.</p>
            <p className="text-[10px] text-slate-300 mt-1">As atividades do CRM aparecerão aqui.</p>
          </div>
        ) : (
          <div className="relative">
            <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100" />
            {recentActivities.map((a, i) => {
              const Icon = ACTIVITY_ICONS[a.type] || Activity
              const comp = companies.find(c => c.id === a.companyId)
              return (
                <div key={a.id} className="flex items-start gap-4 pb-5 relative animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties}>
                  <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0 pt-1">
                    <p className="text-xs font-semibold text-slate-800">{a.title}</p>
                    <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{a.description}</p>
                    <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                      <span>{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                      {comp && <><span>·</span><span>{comp.tradeName || comp.name}</span></>}
                      <span>·</span><span>{a.author}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}