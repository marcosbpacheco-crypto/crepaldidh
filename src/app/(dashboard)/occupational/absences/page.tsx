'use client'

import { useState } from 'react'
import { useOccupational } from '../context/OccupationalHealthContext'
import { Plus, X, Edit2, Trash2, UserX, Search, Calendar, User, Building2, AlertTriangle, FileText } from 'lucide-react'

export default function AbsencesPage() {
  const occ = useOccupational()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')

  const filtered = occ.absences.filter(a => {
    const emp = occ.employees.find(e => e.id === a.employeeId)
    const q = search.toLowerCase()
    const matchSearch = !q || (emp?.name || '').toLowerCase().includes(q) || (a.cid || '').includes(q)
    const matchStatus = filterStatus === 'all' || a.status === filterStatus
    return matchSearch && matchStatus
  })

  const typeLabel = (t: string) => ({ doenca: 'Doença', acidente_trabalho: 'Acidente Trabalho', acidente_trajeto: 'Acidente Trajeto', doenca_ocupacional: 'Doença Ocupacional', maternidade: 'Maternidade', paternidade: 'Paternidade', licenca_medica: 'Licença Médica', outros: 'Outros' }[t] || t)
  const statusBadge = (s: string) => {
    const map: Record<string, string> = { ativo: 'bg-orange-100 text-orange-700', prorrogado: 'bg-amber-100 text-amber-700', encerrado: 'bg-emerald-100 text-emerald-700', convertido_aposentadoria: 'bg-red-100 text-red-700' }
    return <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${map[s] || ''}`}>{s}</span>
  }

  const activeCount = occ.absences.filter(a => a.status === 'ativo').length

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><UserX className="w-6 h-6 text-orange-600" /> Afastamentos</h1>
          <p className="text-slate-400 text-xs mt-1">Controle de afastamentos, CAT e benefícios</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs w-48" /></div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="all">Todos</option><option value="ativo">Ativo</option><option value="prorrogado">Prorrogado</option><option value="encerrado">Encerrado</option>
          </select>
        </div>
      </div>

      {activeCount > 0 && (
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-orange-500 shrink-0" />
          <p className="text-sm text-orange-800 font-medium">{activeCount} afastamento{activeCount > 1 ? 's' : ''} ativo{activeCount > 1 ? 's' : ''} — {occ.indicators.prolongedAbsences} prolongado{occ.indicators.prolongedAbsences > 1 ? 's' : ''} ({'>'}15 dias)</p>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4">Colaborador</th>
              <th className="py-3 px-3">Empresa</th>
              <th className="py-3 px-3">Tipo</th>
              <th className="py-3 px-3">CID</th>
              <th className="py-3 px-3">Início</th>
              <th className="py-3 px-3">Previsão Retorno</th>
              <th className="py-3 px-3">Dias</th>
              <th className="py-3 px-3">CAT</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(a => {
              const emp = occ.employees.find(e => e.id === a.employeeId)
              return (
                <tr key={a.id} className={`hover:bg-slate-50/50 transition-colors ${a.status === 'ativo' ? 'bg-orange-50/30' : ''}`}>
                  <td className="py-3 px-4 font-bold text-slate-800">{emp?.name || 'N/A'}</td>
                  <td className="py-3 px-3 text-slate-500">{a.companyName}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">{typeLabel(a.absenceType)}</span></td>
                  <td className="py-3 px-3 font-mono text-slate-600">{a.cid || '-'}</td>
                  <td className="py-3 px-3 text-slate-500">{new Date(a.startDate).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-3 text-slate-500">{a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="py-3 px-3 font-bold text-slate-600">{a.daysCount || '-'}</td>
                  <td className="py-3 px-3">{a.catIssued ? <span className="text-emerald-600 font-bold">Sim</span> : <span className="text-slate-400">Não</span>}</td>
                  <td className="py-3 px-3">{statusBadge(a.status)}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Excluir afastamento?')) occ.deleteAbsence(a.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div className="text-center py-16 text-slate-400"><UserX className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="font-medium">Nenhum afastamento registrado</p></div>}
      </div>
    </div>
  )
}
