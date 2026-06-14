'use client'

import { useState } from 'react'
import { useOccupational } from '../context/OccupationalHealthContext'
import { Plus, X, Edit2, Trash2, Stethoscope, Search, Calendar, User, Filter, Clock, CheckCircle, AlertCircle } from 'lucide-react'

export default function ExamsPage() {
  const occ = useOccupational()
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterCategory, setFilterCategory] = useState<string>('all')

  const filtered = occ.exams.filter(e => {
    const emp = occ.employees.find(emp => emp.id === e.employeeId)
    const q = search.toLowerCase()
    const matchSearch = !q || (emp?.name || '').toLowerCase().includes(q) || e.examTypeName.toLowerCase().includes(q)
    const matchStatus = filterStatus === 'all' || e.status === filterStatus
    const matchCategory = filterCategory === 'all' || e.examCategory === filterCategory
    return matchSearch && matchStatus && matchCategory
  })

  const statusBadge = (s: string) => {
    const map: Record<string, string> = {
      agendado: 'bg-blue-100 text-blue-700', realizado: 'bg-emerald-100 text-emerald-700',
      cancelado: 'bg-slate-100 text-slate-500', nao_compareceu: 'bg-red-100 text-red-700',
      reagendado: 'bg-amber-100 text-amber-700',
    }
    return <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${map[s] || ''}`}>{s.replace(/_/g, ' ')}</span>
  }
  const resultBadge = (r?: string) => {
    const map: Record<string, string> = { normal: 'bg-emerald-100 text-emerald-700', alterado: 'bg-red-100 text-red-700', inconclusivo: 'bg-amber-100 text-amber-700', nao_realizado: 'bg-slate-100 text-slate-500' }
    return r ? <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${map[r] || ''}`}>{r}</span> : null
  }

  const isLate = (due: string) => new Date(due) < new Date()

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Stethoscope className="w-6 h-6 text-violet-600" /> Exames Ocupacionais</h1>
          <p className="text-slate-400 text-xs mt-1">Agendamento, realização e resultados</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs w-48" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="all">Todos status</option>
            <option value="agendado">Agendado</option>
            <option value="realizado">Realizado</option>
            <option value="nao_compareceu">Não compareceu</option>
            <option value="cancelado">Cancelado</option>
            <option value="reagendado">Reagendado</option>
          </select>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Agendados</p>
          <p className="text-lg font-black text-blue-600">{occ.exams.filter(e => e.status === 'agendado').length}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Realizados</p>
          <p className="text-lg font-black text-emerald-600">{occ.exams.filter(e => e.status === 'realizado').length}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Em Atraso</p>
          <p className="text-lg font-black text-red-600">{occ.exams.filter(e => e.status === 'agendado' && isLate(e.dueDate)).length}</p>
        </div>
        <div className="bg-white p-3 rounded-xl border border-slate-100">
          <p className="text-[10px] font-bold text-slate-400 uppercase">Não Compareceram</p>
          <p className="text-lg font-black text-amber-600">{occ.exams.filter(e => e.status === 'nao_compareceu').length}</p>
        </div>
      </div>

      {/* Exam Types */}
      <details className="bg-white rounded-2xl border border-slate-100 shadow-sm">
        <summary className="p-4 font-bold text-sm text-slate-800 cursor-pointer hover:bg-slate-50 rounded-2xl">Tipos de Exame ({occ.examTypes.length})</summary>
        <div className="px-4 pb-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {occ.examTypes.filter(et => et.isActive).map(et => (
            <div key={et.id} className="p-3 bg-slate-50 rounded-xl text-xs">
              <p className="font-bold text-slate-700">{et.name}</p>
              <p className="text-slate-400 text-[10px]">{et.category} · {et.validityMonths} meses</p>
            </div>
          ))}
        </div>
      </details>

      {/* Exams Table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4">Colaborador</th>
              <th className="py-3 px-3">Exame</th>
              <th className="py-3 px-3">Categoria</th>
              <th className="py-3 px-3">Solicitação</th>
              <th className="py-3 px-3">Data Limite</th>
              <th className="py-3 px-3">Realização</th>
              <th className="py-3 px-3">Status</th>
              <th className="py-3 px-3">Resultado</th>
              <th className="py-3 px-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filtered.map(e => {
              const emp = occ.employees.find(emp => emp.id === e.employeeId)
              const late = e.status === 'agendado' && isLate(e.dueDate)
              return (
                <tr key={e.id} className={`hover:bg-slate-50/50 transition-colors ${late ? 'bg-red-50/30' : ''}`}>
                  <td className="py-3 px-4 font-bold text-slate-800">{emp?.name || 'N/A'}</td>
                  <td className="py-3 px-3 text-slate-600">{e.examTypeName}</td>
                  <td className="py-3 px-3"><span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px]">{e.examCategory}</span></td>
                  <td className="py-3 px-3 text-slate-500">{new Date(e.requestDate).toLocaleDateString('pt-BR')}</td>
                  <td className="py-3 px-3">
                    <span className={`flex items-center gap-1 ${late ? 'text-red-600 font-bold' : 'text-slate-500'}`}>
                      {late && <AlertCircle className="w-3 h-3" />}
                      {new Date(e.dueDate).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-500">{e.examDate ? new Date(e.examDate).toLocaleDateString('pt-BR') : '-'}</td>
                  <td className="py-3 px-3">{statusBadge(e.status)}</td>
                  <td className="py-3 px-3">{resultBadge(e.result)}</td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-violet-600"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm('Excluir exame?')) occ.deleteExam(e.id) }} className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <div className="text-center py-16 text-slate-400"><Stethoscope className="w-12 h-12 mx-auto mb-3 text-slate-200" /><p className="font-medium">Nenhum exame encontrado</p></div>
        )}
      </div>
    </div>
  )
}
