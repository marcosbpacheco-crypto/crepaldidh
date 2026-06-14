'use client'

import { useState, use } from 'react'
import { useOccupational } from '../../context/OccupationalHealthContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import Link from 'next/link'
import {
  User, FileText, Stethoscope, HeartPulse, UserX, UserCheck,
  Calendar, Building2, Briefcase, ArrowLeft, AlertTriangle,
  CheckCircle, XCircle, Download, Clock, Activity
} from 'lucide-react'

export default function EmployeeProntuario({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const occ = useOccupational()
  const crm = useCrm()
  const [tab, setTab] = useState<'info' | 'asos' | 'exams' | 'certificates' | 'absences'>('info')

  const employee = occ.employees.find(e => e.id === id)
  const company = crm.companies.find(c => c.id === employee?.companyId)

  const empAsos = occ.asos.filter(a => a.employeeId === id)
  const empExams = occ.exams.filter(e => e.employeeId === id)
  const empCertificates = occ.certificates.filter(c => c.employeeId === id)
  const empAbsences = occ.absences.filter(a => a.employeeId === id)
  const empRestrictions = occ.restrictions.filter(r => r.employeeId === id)
  const empReturnToWorks = occ.returnToWorks.filter(r => r.employeeId === id)

  if (!employee) {
    return <div className="text-center py-20 text-slate-400"><User className="w-16 h-16 mx-auto mb-4 text-slate-200" /><p className="font-bold text-lg">Colaborador não encontrado</p></div>
  }

  const statusColor = (s: string) => {
    const map: Record<string, string> = { ativo: 'bg-emerald-100 text-emerald-700', afastado: 'bg-orange-100 text-orange-700', ferias: 'bg-blue-100 text-blue-700', desligado: 'bg-red-100 text-red-700' }
    return map[s] || 'bg-slate-100 text-slate-500'
  }

  const resultBadge = (r: string) => {
    const map: Record<string, string> = { apto: 'text-emerald-600 bg-emerald-50', apto_com_restricoes: 'text-amber-600 bg-amber-50', inapto: 'text-red-600 bg-red-50' }
    return <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${map[r] || ''}`}>{r.replace(/_/g, ' ')}</span>
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Back */}
      <Link href="/occupational" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-600 transition-colors">
        <ArrowLeft className="w-3.5 h-3.5" /> Voltar
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-start gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center text-white font-black text-2xl shadow-lg shadow-violet-200">
            {employee.name.charAt(0)}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-slate-800">{employee.name}</h1>
              <span className={`px-3 py-1 rounded-lg text-xs font-bold ${statusColor(employee.status)}`}>{employee.status}</span>
            </div>
            <div className="flex items-center gap-4 mt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1"><Building2 className="w-4 h-4" />{employee.companyName}</span>
              {employee.sector && <span className="flex items-center gap-1"><Briefcase className="w-4 h-4" />{employee.sector}</span>}
              {employee.role && <span className="flex items-center gap-1"><User className="w-4 h-4" />{employee.role}</span>}
              {employee.registrationNumber && <span className="flex items-center gap-1">Matrícula: {employee.registrationNumber}</span>}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              {employee.cpf && <span>CPF: {employee.cpf}</span>}
              {employee.admissionDate && <span>Admissão: {new Date(employee.admissionDate).toLocaleDateString('pt-BR')}</span>}
              {employee.email && <span>{employee.email}</span>}
              {employee.phone && <span>{employee.phone}</span>}
            </div>
          </div>
        </div>

        {/* Summary KPIs */}
        <div className="grid grid-cols-5 gap-2 mt-6">
          <div className="p-3 bg-blue-50 rounded-xl text-center"><p className="text-lg font-black text-blue-700">{empAsos.length}</p><p className="text-[10px] text-blue-500 font-bold">ASO</p></div>
          <div className="p-3 bg-violet-50 rounded-xl text-center"><p className="text-lg font-black text-violet-700">{empExams.length}</p><p className="text-[10px] text-violet-500 font-bold">Exames</p></div>
          <div className="p-3 bg-rose-50 rounded-xl text-center"><p className="text-lg font-black text-rose-700">{empCertificates.length}</p><p className="text-[10px] text-rose-500 font-bold">Atestados</p></div>
          <div className="p-3 bg-orange-50 rounded-xl text-center"><p className="text-lg font-black text-orange-700">{empAbsences.length}</p><p className="text-[10px] text-orange-500 font-bold">Afastamentos</p></div>
          <div className="p-3 bg-emerald-50 rounded-xl text-center"><p className="text-lg font-black text-emerald-700">{empRestrictions.filter(r => r.status === 'ativa').length}</p><p className="text-[10px] text-emerald-500 font-bold">Restrições</p></div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white rounded-2xl border border-slate-100 p-1.5 shadow-sm overflow-x-auto">
        {([
          { id: 'info', label: 'Dados', icon: User },
          { id: 'asos', label: 'ASO', icon: FileText },
          { id: 'exams', label: 'Exames', icon: Stethoscope },
          { id: 'certificates', label: 'Atestados', icon: HeartPulse },
          { id: 'absences', label: 'Afastamentos', icon: UserX },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${tab === t.id ? 'bg-slate-800 text-white shadow-md' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        {/* Info Tab */}
        {tab === 'info' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-700">Dados Pessoais</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Nome', value: employee.name },
                  { label: 'CPF', value: employee.cpf },
                  { label: 'RG', value: employee.rg },
                  { label: 'Data Nascimento', value: employee.birthDate ? new Date(employee.birthDate).toLocaleDateString('pt-BR') : undefined },
                  { label: 'Gênero', value: employee.gender },
                  { label: 'Estado Civil', value: employee.maritalStatus },
                  { label: 'E-mail', value: employee.email },
                  { label: 'Telefone', value: employee.phone },
                ].filter(i => i.value).map(i => (
                  <div key={i.label} className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">{i.label}</span><span className="font-medium text-slate-700">{i.value}</span></div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-700">Dados Profissionais</h3>
              <div className="space-y-2 text-sm">
                {[
                  { label: 'Empresa', value: employee.companyName },
                  { label: 'Unidade', value: employee.unit },
                  { label: 'Setor', value: employee.sector },
                  { label: 'Cargo', value: employee.role },
                  { label: 'Função', value: employee.functionDescription },
                  { label: 'Matrícula', value: employee.registrationNumber },
                  { label: 'Admissão', value: employee.admissionDate ? new Date(employee.admissionDate).toLocaleDateString('pt-BR') : undefined },
                  { label: 'Regime', value: employee.workRegime },
                  { label: 'Turno', value: employee.shift },
                  { label: 'Líder Imediato', value: employee.directLeader },
                ].filter(i => i.value).map(i => (
                  <div key={i.label} className="flex justify-between border-b border-slate-50 pb-1.5"><span className="text-slate-400">{i.label}</span><span className="font-medium text-slate-700">{i.value}</span></div>
                ))}
              </div>

              {/* Active Restrictions */}
              {empRestrictions.filter(r => r.status === 'ativa').length > 0 && (
                <div>
                  <h3 className="font-bold text-sm text-amber-700 mt-4 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Restrições Ativas</h3>
                  {empRestrictions.filter(r => r.status === 'ativa').map(r => (
                    <div key={r.id} className="p-3 bg-amber-50 rounded-xl border border-amber-100 mb-2">
                      <p className="text-sm font-bold text-amber-800">{r.restriction}</p>
                      <p className="text-xs text-amber-600">{r.restrictionType === 'permanente' ? 'Permanente' : `Até ${r.endDate ? new Date(r.endDate).toLocaleDateString('pt-BR') : 'N/A'}`}</p>
                      {r.activitiesPrevented && <p className="text-xs text-amber-700 mt-1">Atividades impedidas: {r.activitiesPrevented}</p>}
                      {r.recommendations && <p className="text-xs text-amber-700 mt-0.5">Recomendações: {r.recommendations}</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ASO Tab */}
        {tab === 'asos' && (
          <div className="space-y-2">
            {empAsos.length === 0 && <p className="text-center py-8 text-slate-400">Nenhum ASO registrado</p>}
            {empAsos.map(a => (
              <div key={a.id} className="p-4 bg-slate-50 rounded-2xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold text-slate-800">ASO #{a.asoNumber}</span>{resultBadge(a.result)}<span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'ativo' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{a.status}</span></div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>{new Date(a.issueDate).toLocaleDateString('pt-BR')} → {a.validityDate ? new Date(a.validityDate).toLocaleDateString('pt-BR') : 'N/A'}</span>
                    <span>{a.examType.replace(/_/g, ' ')}</span>
                    <span>{a.doctorName}</span>
                  </div>
                  {a.restrictionDescription && <p className="text-xs text-amber-600 mt-1">Restrição: {a.restrictionDescription}</p>}
                  {a.observation && <p className="text-xs text-slate-500 mt-0.5">{a.observation}</p>}
                </div>
                {a.pdfUrl && <button className="p-2 rounded-lg hover:bg-white text-slate-400"><Download className="w-4 h-4" /></button>}
              </div>
            ))}
          </div>
        )}

        {/* Exams Tab */}
        {tab === 'exams' && (
          <div className="space-y-2">
            {empExams.length === 0 && <p className="text-center py-8 text-slate-400">Nenhum exame registrado</p>}
            {empExams.map(e => (
              <div key={e.id} className="p-4 bg-slate-50 rounded-2xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2"><span className="font-bold text-slate-800">{e.examTypeName}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${e.status === 'realizado' ? 'bg-emerald-100 text-emerald-700' : e.status === 'agendado' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>{e.status.replace(/_/g, ' ')}</span>
                    {e.result && resultBadge(e.result)}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                    <span>Data limite: {new Date(e.dueDate).toLocaleDateString('pt-BR')}</span>
                    {e.examDate && <span>Realizado: {new Date(e.examDate).toLocaleDateString('pt-BR')}</span>}
                    {e.clinicName && <span>{e.clinicName}</span>}
                  </div>
                  {e.resultDetails && <p className="text-xs text-slate-500 mt-0.5">{e.resultDetails}</p>}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Certificates Tab */}
        {tab === 'certificates' && (
          <div className="space-y-2">
            {empCertificates.length === 0 && <p className="text-center py-8 text-slate-400">Nenhum atestado registrado</p>}
            {empCertificates.map(c => (
              <div key={c.id} className="p-4 bg-rose-50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <HeartPulse className="w-4 h-4 text-rose-500" />
                    <span className="font-bold text-slate-800">{c.daysCount} dias</span>
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-700 rounded text-[10px] font-bold">{c.certificateType}</span>
                    {c.medicalLeave && <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-[10px] font-bold">Afastamento</span>}
                  </div>
                  <span className="text-xs text-slate-400">{new Date(c.startDate).toLocaleDateString('pt-BR')} → {new Date(c.endDate).toLocaleDateString('pt-BR')}</span>
                </div>
                {c.cid && <p className="text-xs text-slate-500 mt-1">CID {c.cid}: {c.cidDescription || ''}</p>}
                {c.diagnosis && <p className="text-xs text-slate-600 mt-0.5">{c.diagnosis}</p>}
                {c.doctorName && <p className="text-xs text-slate-400 mt-1">{c.doctorName}{c.doctorCrm ? ` — CRM ${c.doctorCrm}` : ''}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Absences Tab */}
        {tab === 'absences' && (
          <div className="space-y-2">
            {empAbsences.length === 0 && <p className="text-center py-8 text-slate-400">Nenhum afastamento registrado</p>}
            {empAbsences.map(a => (
              <div key={a.id} className="p-4 bg-orange-50 rounded-2xl">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <UserX className="w-4 h-4 text-orange-500" />
                    <span className="font-bold text-slate-800">{a.absenceType.replace(/_/g, ' ')}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${a.status === 'ativo' ? 'bg-orange-100 text-orange-700' : a.status === 'encerrado' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{a.status}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-600">{a.daysCount ? `${a.daysCount} dias` : ''}</span>
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                  <span>Início: {new Date(a.startDate).toLocaleDateString('pt-BR')}</span>
                  {a.expectedReturnDate && <span>Retorno previsto: {new Date(a.expectedReturnDate).toLocaleDateString('pt-BR')}</span>}
                  {a.cid && <span>CID: {a.cid}</span>}
                </div>
                {a.catIssued && <p className="text-xs text-orange-600 mt-1">CAT emitida — Nº {a.catNumber || 'N/A'}</p>}
                {a.notes && <p className="text-xs text-slate-500 mt-0.5">{a.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
