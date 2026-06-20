'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Building2, FileQuestion, ClipboardList, CheckCircle, Clock, AlertCircle, LogOut, ChevronRight, User } from 'lucide-react'

interface User { id: string; companyId: string; companyName: string; name: string; email: string }

export default function ColetaPage() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [questionnaires, setQuestionnaires] = useState<any[]>([])
  const [responses, setResponses] = useState<any[]>([])

  useEffect(() => {
    const stored = localStorage.getItem('temp_access_user')
    if (!stored) { router.push('/acesso-temporario/entrar'); return }
    try {
      const u = JSON.parse(stored)
      setUser(u)
      const qs = localStorage.getItem('acesso_temporario_questionnaires')
      if (qs) setQuestionnaires(JSON.parse(qs).filter((q: any) => q.active))
      const rs = localStorage.getItem('acesso_temporario_responses')
      if (rs) setResponses(JSON.parse(rs).filter((r: any) => r.companyId === u.companyId))
    } catch { router.push('/acesso-temporario/entrar') }
  }, [router])

  const handleLogout = () => { localStorage.removeItem('temp_access_user'); router.push('/acesso-temporario/entrar') }

  const qStats = useMemo(() => {
    if (!user) return { total: 0, pendentes: 0, enviados: 0 }
    const total = questionnaires.length
    const enviados = responses.filter(r => r.status === 'submitted').length
    return { total, pendentes: total - enviados, enviados }
  }, [questionnaires, responses, user])

  const getStatus = (qId: string) => {
    const r = responses.find(r => r.questionnaireId === qId)
    if (!r) return 'pending'
    return r.status === 'submitted' ? 'submitted' : 'draft'
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-gradient-to-br from-violet-600 to-purple-700">
        <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
          <div className="flex items-center justify-between mb-4 sm:mb-6 gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white/10 backdrop-blur-sm flex items-center justify-center shrink-0">
                <Building2 className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-base sm:text-lg font-black text-white truncate">Coleta de Dados</h1>
                <p className="text-[10px] sm:text-[11px] text-violet-200 truncate">CrepaldiDH — Soluções em DHO</p>
              </div>
            </div>
            <button onClick={handleLogout} className="flex items-center gap-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-white/10 backdrop-blur-sm rounded-xl text-[9px] sm:text-[10px] font-bold text-white hover:bg-white/20 transition-all shrink-0">
              <LogOut className="w-3 h-3 sm:w-3.5 sm:h-3.5" /><span className="hidden xs:inline">Sair</span>
            </button>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-xl sm:rounded-2xl p-3 sm:p-4">
            <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
              <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shrink-0">
                {user.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
              </div>
              <div className="min-w-0">
                <p className="text-xs sm:text-sm font-bold text-white truncate">{user.name}</p>
                <p className="text-[9px] sm:text-[10px] text-violet-200 truncate">{user.companyName}</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                <p className="text-base sm:text-lg font-black text-white">{qStats.total}</p>
                <p className="text-[8px] sm:text-[9px] text-violet-200">Questionários</p>
              </div>
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                <p className="text-base sm:text-lg font-black text-amber-300">{qStats.pendentes}</p>
                <p className="text-[8px] sm:text-[9px] text-violet-200">Pendentes</p>
              </div>
              <div className="bg-white/5 rounded-lg sm:rounded-xl p-2 sm:p-3 text-center">
                <p className="text-base sm:text-lg font-black text-emerald-300">{qStats.enviados}</p>
                <p className="text-[8px] sm:text-[9px] text-violet-200">Enviados</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
        <h2 className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase mb-3 sm:mb-4">Questionários Disponíveis</h2>
        <div className="space-y-2 sm:space-y-3">
          {questionnaires.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 sm:p-12 text-center shadow-sm">
              <FileQuestion className="w-8 h-8 sm:w-10 sm:h-10 text-slate-200 mx-auto mb-2 sm:mb-3" />
              <p className="text-[11px] sm:text-xs font-medium text-slate-400">Nenhum questionário disponível no momento.</p>
            </div>
          ) : questionnaires.map(q => {
            const status = getStatus(q.id)
            return (
              <div key={q.id}
                onClick={() => router.push(`/acesso-temporario/questionario/${q.id}`)}
                className="bg-white rounded-xl sm:rounded-2xl border border-slate-100 shadow-sm p-3 sm:p-4 hover:shadow-md hover:border-violet-200 transition-all cursor-pointer group">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-start gap-2 sm:gap-3 min-w-0">
                    <FileQuestion className="w-4 h-4 sm:w-5 sm:h-5 text-violet-500 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 group-hover:text-violet-700 transition-colors truncate">{q.title}</p>
                      {q.description && <p className="text-[9px] sm:text-[10px] text-slate-400 mt-0.5 truncate">{q.description}</p>}
                      <p className="text-[8px] sm:text-[9px] text-slate-400 mt-0.5">{q.questions?.length || 0} pergunta(s)</p>
                      {q.instructions && <p className="text-[9px] sm:text-[10px] text-amber-700 mt-1 flex items-center gap-1"><AlertCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3 shrink-0" /><span className="truncate">{q.instructions}</span></p>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                    {status === 'submitted' ? (
                      <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded text-[8px] sm:text-[9px] font-bold"><CheckCircle className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">Enviado</span></span>
                    ) : status === 'draft' ? (
                      <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[8px] sm:text-[9px] font-bold"><Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">Rascunho</span></span>
                    ) : (
                      <span className="flex items-center gap-0.5 sm:gap-1 px-1.5 sm:px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[8px] sm:text-[9px] font-bold"><FileQuestion className="w-2.5 h-2.5 sm:w-3 sm:h-3" /><span className="hidden xs:inline">Pendente</span></span>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-300 group-hover:text-violet-500 transition-colors shrink-0" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
