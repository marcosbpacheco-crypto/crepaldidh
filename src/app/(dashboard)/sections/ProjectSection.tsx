'use client'

import { useRouter } from 'next/navigation'
import { Briefcase, Building2, ChevronRight } from 'lucide-react'

const STATUS_COLORS: Record<string, string> = {
  em_andamento: 'bg-blue-50 text-blue-700 border-blue-100',
  planejado: 'bg-slate-100 text-slate-700 border-slate-200',
  concluido: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  pausado: 'bg-amber-50 text-amber-700 border-amber-100',
}

const STATUS_LABELS: Record<string, string> = {
  em_andamento: 'Em Andamento',
  planejado: 'Planejado',
  concluido: 'Concluído',
  pausado: 'Pausado',
}

interface ProjectItem {
  id: string
  name: string
  companyName: string
  status: string
}

export function ProjectSection({ projects }: { projects: ProjectItem[] }) {
  const router = useRouter()

  if (projects.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-amber-500" /> Projetos Recentes
          </h2>
          <button onClick={() => router.push('/projects')} className="text-brand-teal text-sm font-medium hover:underline flex items-center">
            Ver todos <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
        <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
          <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
          <p className="text-xs">Nenhum projeto ainda.</p>
          <p className="text-[10px] text-slate-300 mt-1">Clique em "Novo Projeto" para começar.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-amber-500" /> Projetos Recentes
        </h2>
        <button onClick={() => router.push('/projects')} className="text-brand-teal text-sm font-medium hover:underline flex items-center">
          Ver todos <ChevronRight className="w-4 h-4 ml-1" />
        </button>
      </div>
      <div className="space-y-3">
        {projects.map((p) => (
          <div key={p.id} onClick={() => router.push('/projects')}
            className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 hover:border-slate-100 transition-all cursor-pointer group">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {p.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-800">{p.name}</h4>
                <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                  <Building2 className="w-3 h-3" /> {p.companyName}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`px-2 py-1 text-[10px] font-semibold rounded border ${STATUS_COLORS[p.status]}`}>
                {STATUS_LABELS[p.status]}
              </span>
              <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 transition-colors" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}