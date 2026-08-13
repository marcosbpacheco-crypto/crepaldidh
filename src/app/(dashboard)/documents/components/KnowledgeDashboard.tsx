'use client'

import { useDocuments } from '../context/DocumentContext'
import { FileText, Hammer, Compass, Tag, BarChart3 } from 'lucide-react'
import { safeArray } from '@/lib/safe-array'

export default function KnowledgeDashboard() {
  const { documents, tools, dynamics, favorites, usage } = useDocuments()

  const docs = safeArray(documents)
  const tls = safeArray(tools)
  const dys = safeArray(dynamics)
  const favs = safeArray(favorites)
  const uses = safeArray(usage)

  const counts = (type: string) => {
    if (type === 'tool') return tls.filter(t => (t.status || '') === 'ativa').length
    if (type === 'dynamic') return dys.filter(d => (d.status || '') === 'ativa').length
    if (type === 'modelos') return docs.filter(d => d.category === 'modelos').length
    if (type === 'materiais') return docs.filter(d => d.category === 'materiais').length
    return 0
  }

  const topTools = tls.slice().sort((a,b) => (
    uses.filter(u => u.resourceType === 'tool' && u.resourceId === a.id).length -
    uses.filter(u => u.resourceType === 'tool' && u.resourceId === b.id).length
  )).reverse().slice(0,3)

  const recent = [...docs, ...tls, ...dys].slice().sort((a,b) => Date.parse(b.updatedAt || b.createdAt || '') - Date.parse(a.updatedAt || a.createdAt || '')).slice(0,5)

  return (
    <div className="space-y-6 mb-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Stat icon={FileText} color="text-blue-600" label="Documentos" value={docs.length} />
        <Stat icon={Hammer} color="text-violet-600" label="Ferramentas (ativas)" value={counts('tool')} border />
        <Stat icon={Compass} color="text-sky-600" label="Dinâmicas (ativas)" value={counts('dynamic')} />
        <Stat icon={Tag} color="text-amber-600" label="Templates/Materiais" value={counts('modelos') + counts('materiais')} />
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 mb-3">Ferramentas mais utilizadas</h3>
          {topTools.length === 0 ? <p className="text-xs text-slate-400">Nenhuma utilização ainda.</p> : (
            <div className="space-y-2">{topTools.map(t => (
              <div key={t.id} className="flex items-center justify-between text-xs">
                <span className="font-medium text-slate-700">{t.name}</span>
                <span className="text-slate-400">{uses.filter(u => u.resourceId === t.id).length} uso(s)</span>
              </div>
            ))}
          </div>
          )}
        </div>
        <div className="bg-white p-4 rounded-2xl border border-slate-100">
          <h3 className="text-xs font-bold text-slate-400 mb-3">Últimos recursos adicionados</h3>
          {recent.length === 0 ? <p className="text-xs text-slate-400">Nenhum recurso.</p> : (
            <div className="space-y-2">{recent.map(r => (
              <div key={r.id} className="flex items-center gap-2 text-xs">
                <BarChart3 className="w-3 h-3 text-slate-400" />
                <span className="font-medium text-slate-700 truncate">{r.name}</span>
              </div>
            ))}
          </div>
          )}
        </div>
      </div>
    </div>
  )
}

function Stat({ icon: Icon, color, label, value, border }: { icon: any; color: string; label: string; value: number; border?: boolean }) {
  return (
    <div className={`bg-white p-4 rounded-2xl border ${border ? 'border-slate-100' : 'shadow-sm'} flex items-center gap-3`}>
      <div className={`p-2.5 rounded-xl bg-slate-50 ${color}`}><Icon className="w-5 h-5" /></div>
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase">{label}</p>
        <p className={`text-xl font-black ${color}`}>{value}</p>
      </div>
    </div>
  )
}

