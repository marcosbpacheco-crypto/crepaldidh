'use client'

import { useState, useRef } from 'react'
import { useOccupational } from '../context/OccupationalHealthContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { Activity, Download, FileText, PieChart, BarChart3, Table, Building2, Users, FileSpreadsheet } from 'lucide-react'

export default function ReportsPage() {
  const occ = useOccupational()
  const crm = useCrm()
  const [selectedCompany, setSelectedCompany] = useState('')
  const [reportType, setReportType] = useState<'indicators' | 'asos' | 'exams' | 'absences'>('indicators')
  const printRef = useRef<HTMLDivElement>(null)

  const companyFilter = (list: any[]) => !selectedCompany || selectedCompany === 'all' ? list : list.filter((i: any) => i.companyId === selectedCompany)

  const filteredAsos = companyFilter(occ.asos)
  const filteredExams = companyFilter(occ.exams)
  const filteredAbsences = companyFilter(occ.absences)
  const filteredEmployees = companyFilter(occ.employees)

  const handlePrint = () => {
    const w = window.open('', '_blank')
    if (!w) return
    const content = printRef.current?.innerHTML || ''
    w.document.write(`<html><head><title>Relatório Saúde Ocupacional</title>
      <style>body{font-family:sans-serif;padding:40px;color:#1e293b}
      h1{font-size:24px;font-weight:900;margin-bottom:4px}
      h2{font-size:16px;font-weight:700;margin-top:24px;margin-bottom:12px;border-bottom:2px solid #e2e8f0;padding-bottom:6px}
      table{width:100%;border-collapse:collapse;font-size:12px;margin-bottom:16px}
      th{background:#f1f5f9;text-align:left;padding:8px 10px;border:1px solid #e2e8f0;font-weight:700}
      td{padding:6px 10px;border:1px solid #e2e8f0}
      .kpi{display:inline-block;padding:8px 16px;margin:4px;background:#f0fdf4;border-radius:8px;font-weight:700}
      .footer{margin-top:40px;font-size:10px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}
    </style></head><body>
    <div style="text-align:center;margin-bottom:32px">
      <h1>Relatório de Saúde Ocupacional</h1>
      <p style="color:#64748b">${new Date().toLocaleDateString('pt-BR')} ${selectedCompany ? '— ' + (crm.companies.find(c => c.id === selectedCompany)?.tradeName || '') : '— Consolidado'}
    </div>
    ${content}
    <div class="footer">CrepaldiDH ERP — Módulo de Saúde Ocupacional — Gerado em ${new Date().toLocaleString('pt-BR')}</div>
    </body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 500)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-800 flex items-center gap-2"><Activity className="w-6 h-6 text-slate-700" /> Relatórios</h1>
          <p className="text-slate-400 text-xs mt-1">Indicadores, exportação em PDF e Excel</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-white">
            <option value="">Todas as empresas</option>
            {crm.companies.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>)}
          </select>
          <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-slate-700 to-slate-800 text-white rounded-xl font-bold text-xs shadow-md hover:opacity-90">
            <Download className="w-4 h-4" /> Exportar PDF
          </button>
        </div>
      </div>

      {/* Report type tabs */}
      <div className="flex gap-2">
        {([
          { id: 'indicators', label: 'Indicadores', icon: PieChart },
          { id: 'asos', label: 'ASO', icon: FileText },
          { id: 'exams', label: 'Exames', icon: BarChart3 },
          { id: 'absences', label: 'Afastamentos', icon: Table },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setReportType(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${reportType === t.id ? 'bg-slate-800 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Report Content */}
      <div ref={printRef} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
        {reportType === 'indicators' && (
          <>
            <h2 className="font-bold text-slate-800 text-lg">Indicadores de Saúde Ocupacional</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 bg-emerald-50 rounded-2xl"><p className="text-xs text-emerald-600 font-bold">Total Colaboradores</p><p className="text-2xl font-black text-emerald-800">{filteredEmployees.length}</p></div>
              <div className="p-4 bg-blue-50 rounded-2xl"><p className="text-xs text-blue-600 font-bold">ASO Válidos</p><p className="text-2xl font-black text-blue-800">{filteredAsos.filter(a => a.status === 'ativo').length}</p></div>
              <div className="p-4 bg-violet-50 rounded-2xl"><p className="text-xs text-violet-600 font-bold">Exames Realizados</p><p className="text-2xl font-black text-violet-800">{filteredExams.filter(e => e.status === 'realizado').length}</p></div>
              <div className="p-4 bg-orange-50 rounded-2xl"><p className="text-xs text-orange-600 font-bold">Afastamentos Ativos</p><p className="text-2xl font-black text-orange-800">{filteredAbsences.filter(a => a.status === 'ativo').length}</p></div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-bold text-sm text-slate-700 mb-3">Exames por Status</h3>
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50"><th className="p-2 text-left">Status</th><th className="p-2 text-right">Quantidade</th></tr></thead>
                  <tbody>
                    {[{ status: 'agendado' }, { status: 'realizado' }, { status: 'nao_compareceu' }, { status: 'cancelado' }, { status: 'reagendado' }].map(s => {
                      const count = filteredExams.filter(e => e.status === s.status).length
                      return count > 0 ? <tr key={s.status} className="border-t border-slate-50"><td className="p-2 capitalize">{s.status.replace(/_/g, ' ')}</td><td className="p-2 text-right font-bold">{count}</td></tr> : null
                    })}
                  </tbody>
                </table>
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-700 mb-3">ASO por Resultado</h3>
                <table className="w-full text-xs">
                  <thead><tr className="bg-slate-50"><th className="p-2 text-left">Resultado</th><th className="p-2 text-right">Quantidade</th></tr></thead>
                  <tbody>
                    {[{ result: 'apto' }, { result: 'apto_com_restricoes' }, { result: 'inapto' }].map(r => {
                      const count = filteredAsos.filter(a => a.result === r.result).length
                      return count > 0 ? <tr key={r.result} className="border-t border-slate-50"><td className="p-2 capitalize">{r.result.replace(/_/g, ' ')}</td><td className="p-2 text-right font-bold">{count}</td></tr> : null
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="font-bold text-sm text-slate-700 mb-3">Afastamentos por Tipo</h3>
              <table className="w-full text-xs">
                <thead><tr className="bg-slate-50"><th className="p-2 text-left">Tipo</th><th className="p-2 text-right">Quantidade</th></tr></thead>
                <tbody>
                  {(Object.entries(filteredAbsences.reduce((acc, a) => { acc[a.absenceType] = (acc[a.absenceType] || 0) + 1; return acc }, {} as Record<string, number>)) as [string, number][])
                    .map(([type, total]) => (
                      <tr key={type} className="border-t border-slate-50"><td className="p-2 capitalize">{type.replace(/_/g, ' ')}</td><td className="p-2 text-right font-bold">{total}</td></tr>
                    ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {reportType === 'asos' && (
          <>
            <h2 className="font-bold text-slate-800 text-lg">Relatório de ASO</h2>
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50"><th className="p-2 text-left">Colaborador</th><th className="p-2 text-left">Empresa</th><th className="p-2 text-left">Nº ASO</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">Emissão</th><th className="p-2 text-left">Validade</th><th className="p-2 text-left">Resultado</th><th className="p-2 text-left">Status</th></tr></thead>
              <tbody>
                {filteredAsos.map(a => {
                  const emp = occ.employees.find(e => e.id === a.employeeId)
                  return <tr key={a.id} className="border-t border-slate-50"><td className="p-2">{emp?.name || 'N/A'}</td><td className="p-2">{a.companyName}</td><td className="p-2">{a.asoNumber}</td><td className="p-2">{a.examType}</td><td className="p-2">{new Date(a.issueDate).toLocaleDateString('pt-BR')}</td><td className="p-2">{a.validityDate ? new Date(a.validityDate).toLocaleDateString('pt-BR') : '-'}</td><td className="p-2">{a.result}</td><td className="p-2">{a.status}</td></tr>
                })}
              </tbody>
            </table>
          </>
        )}

        {reportType === 'exams' && (
          <>
            <h2 className="font-bold text-slate-800 text-lg">Relatório de Exames</h2>
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50"><th className="p-2 text-left">Colaborador</th><th className="p-2 text-left">Exame</th><th className="p-2 text-left">Categoria</th><th className="p-2 text-left">Data Limite</th><th className="p-2 text-left">Realização</th><th className="p-2 text-left">Status</th><th className="p-2 text-left">Resultado</th></tr></thead>
              <tbody>
                {filteredExams.map(e => {
                  const emp = occ.employees.find(emp => emp.id === e.employeeId)
                  return <tr key={e.id} className="border-t border-slate-50"><td className="p-2">{emp?.name || 'N/A'}</td><td className="p-2">{e.examTypeName}</td><td className="p-2">{e.examCategory}</td><td className="p-2">{new Date(e.dueDate).toLocaleDateString('pt-BR')}</td><td className="p-2">{e.examDate ? new Date(e.examDate).toLocaleDateString('pt-BR') : '-'}</td><td className="p-2">{e.status}</td><td className="p-2">{e.result || '-'}</td></tr>
                })}
              </tbody>
            </table>
          </>
        )}

        {reportType === 'absences' && (
          <>
            <h2 className="font-bold text-slate-800 text-lg">Relatório de Afastamentos</h2>
            <table className="w-full text-xs">
              <thead><tr className="bg-slate-50"><th className="p-2 text-left">Colaborador</th><th className="p-2 text-left">Tipo</th><th className="p-2 text-left">CID</th><th className="p-2 text-left">Início</th><th className="p-2 text-left">Retorno Previsto</th><th className="p-2 text-left">Dias</th><th className="p-2 text-left">CAT</th><th className="p-2 text-left">Status</th></tr></thead>
              <tbody>
                {filteredAbsences.map(a => {
                  const emp = occ.employees.find(e => e.id === a.employeeId)
                  return <tr key={a.id} className="border-t border-slate-50"><td className="p-2">{emp?.name || 'N/A'}</td><td className="p-2 capitalize">{a.absenceType.replace(/_/g, ' ')}</td><td className="p-2">{a.cid || '-'}</td><td className="p-2">{new Date(a.startDate).toLocaleDateString('pt-BR')}</td><td className="p-2">{a.expectedReturnDate ? new Date(a.expectedReturnDate).toLocaleDateString('pt-BR') : '-'}</td><td className="p-2 font-bold">{a.daysCount || '-'}</td><td className="p-2">{a.catIssued ? 'Sim' : 'Não'}</td><td className="p-2">{a.status}</td></tr>
                })}
              </tbody>
            </table>
          </>
        )}
      </div>
    </div>
  )
}
