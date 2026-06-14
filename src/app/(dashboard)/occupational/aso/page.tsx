'use client'

import { useState } from 'react'
import { useOccupational } from '../context/OccupationalHealthContext'
import { Plus, X, Edit2, Trash2, FileText, Search, Calendar, User, Building2, Download, Filter } from 'lucide-react'

export default function AsoPage() {
  const occ = useOccupational()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterResult, setFilterResult] = useState<string>('all')

  const filtered = occ.asos.filter(a => {
    const emp = occ.employees.find(e => e.id === a.employeeId)
    const q = search.toLowerCase()
    const matchSearch = !q || (emp?.name || '').toLowerCase().includes(q) || a.asoNumber.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    const matchResult = filterResult === 'all' || a.result === filterResult
    return matchSearch && matchStatus && matchResult
  })

  const resultBadge = (r: string) => {
    const map: Record<string, string> = { apto: 'bg-emerald-100 text-emerald-700', apto_com_restricoes: 'bg-amber-100 text-amber-700', inapto: 'bg-red-100 text-red-700' }
    return <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${map[r] || 'bg-slate-100 text-slate-500'}`}>{r.replace(/_/g, ' ')}</span>
  }
  const statusBadge = (s: string) => {
    const map: Record<string, string> = { ativo: 'bg-blue-100 text-blue-700', vencido: 'bg-red-100 text-red-700', cancelado: 'bg-slate-100 text-slate-500' }
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${map[s] || ''}`}>{s}</span>
  }
  const examTypeLabel = (t: string) => ({ admissional: 'Admissional', periodico: 'Periódico', retorno: 'Retorno', mudanca_funcao: 'Mudança de Função', demissional: 'Demissional' }[t] || t)

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><FileText className="w-6 h-6 text-blue-600" /> ASO</h1>
          <p className="text-slate-400 text-xs mt-1">Atestados de Saúde Ocupacional</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar colaborador..." className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs w-56" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="all">Todos status</option>
            <option value="ativo">Ativo</option>
            <option value="vencido">Vencido</option>
            <option value="cancelado">Cancelado</option>
          </select>
          <select value={filterResult} onChange={e => setFilterResult(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="all">Todos resultados</option>
            <option value="apto">Apto</option>
            <option value="apto_com_restricoes">Apto c/ restrições</option>
            <option value="inapto">Inapto</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4">Colaborador</th>
              <th className="py-3 px-3">Empresa</th>
              <th className="py-3 px-3">Nº ASO</th>
              <th className="py-3 px-3">Tipo</th>
              <th className="py-3 px-3">Emissão</th>
              <th className="py-3 px-3">Validade</th>
              <th className="py-3 px-3">Resultado</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(a => {
              const emp = occ.employees.find(e => e.id === a.employeeId)
              return (
                <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-3 px-4 font-bold text-slate-800">{emp?.name || 'N/A'}</td>
                  <td className="py-3 px-3 text-slate-500">{a.companyName}</td>
                  <td className="py-3 px-3 font-mono text-slate-600">{a.asoNumber}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">{examTypeLabel(a.examType)}</span></td>
                  <td className="py-3 px-3 text-slate-500">{new Date(a.issueDate).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-3 text-slate-500">{a.validityDate ? new Date(a.validityDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="py-3 px-3">{resultBadge(a.result)}</td>
                  <td className="py-3 px-3">{statusBadge(a.status)}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-blue-50 text-slate-400 hover:text-blue-600" title="Download"><Download className="w-3.5 h-3.5" /></button>
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600" title="Editar"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Excluir ASO?')) occ.deleteAso(a.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500" title="Excluir"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400"><FileText className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="font-medium">Nenhum ASO encontrado</p></div>
        )}
      </div>
    </div>
  )
}
