'use client'

import { useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Calendar, Clock, Target } from 'lucide-react'

export function CalendarSection({ events }: { events: any[] }) {
  const router = useRouter()

  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return (events ?? []).filter(e => e.eventDate === today)
  }, [events])

  const upcomingEvents = useMemo(() => {
    return [...events].filter(e => e.status === 'scheduled' || e.status === 'confirmed')
      .sort((a, b) => new Date(a.eventDate + 'T' + a.startTime).getTime() - new Date(b.eventDate + 'T' + b.startTime).getTime())
      .slice(0, 5)
  }, [events])

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
      <div className="lg:col-span-2" />
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-brand-blue to-blue-700 rounded-2xl shadow-md p-6 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 blur-2xl rounded-full -translate-x-1/4 translate-y-1/4 pointer-events-none" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-teal" /> Hoje
              </h2>
              <span className="text-[10px] bg-white/20 rounded-full px-2 py-0.5">{todayEvents.length} eventos</span>
            </div>
            <div className="space-y-3">
              {todayEvents.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-200">Nenhum evento hoje</p>
                </div>
              ) : (
                <>
                  {todayEvents.slice(0, 3).map((evt) => (
                    <div key={evt.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                      <div className="flex items-start gap-3">
                        <div className="w-2 h-2 rounded-full bg-brand-teal mt-1.5 flex-shrink-0" style={{ backgroundColor: evt.color || '#14b8a6' }} />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-semibold truncate">{evt.title}</h4>
                          <p className="text-[10px] text-slate-200 mt-1 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {evt.startTime} - {evt.endTime}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
            <button onClick={() => router.push('/calendar')}
              className="w-full mt-4 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-black/10 hover:-translate-y-0.5">
              Agenda Completa
            </button>
          </div>
        </div>

        {upcomingEvents.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Target className="w-4 h-4 text-violet-500" /> Próximos Eventos
            </h2>
            <div className="space-y-3">
              {upcomingEvents.slice(0, 4).map(e => (
                <div key={e.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center w-8 flex-shrink-0">
                    <span className="text-[15px] font-black text-slate-700 leading-none">{new Date(e.eventDate).getDate()}</span>
                    <span className="text-[8px] text-slate-400 uppercase font-bold">
                      {new Date(e.eventDate).toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-800 truncate">{e.title}</p>
                    <p className="text-[10px] text-slate-400">{e.startTime}hs{e.companyName ? ` · ${e.companyName}` : ''}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}