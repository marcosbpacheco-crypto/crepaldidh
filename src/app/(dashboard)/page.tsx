'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useCalendar } from '@/app/(dashboard)/calendar/context/CalendarContext'
import { useTrainings } from '@/app/(dashboard)/trainings/context/TrainingsContext'
import { useFinancial } from '@/app/(dashboard)/financial/context/FinancialContext'
import {
  Users, Briefcase, GraduationCap, TrendingUp, Calendar, ChevronRight,
  Plus, X, FileDown, Building2, Clock, MapPin, Download, Loader2,
} from "lucide-react"

interface Project {
  id: string
  name: string
  companyId: string
  companyName: string
  description: string
  startDate: string
  endDate: string
  status: 'em_andamento' | 'planejado' | 'concluido' | 'pausado'
  budget: number
}

const SEED_PROJECTS: Project[] = []

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

const EVENT_TYPE_LABELS: Record<string, string> = {
  commercial_meeting: 'Reunião Comercial',
  client_meeting: 'Reunião com Cliente',
  mentoring: 'Mentoria',
  training: 'Treinamento',
  lecture: 'Palestra',
  sipat: 'SIPAT',
  nr01_interview: 'Entrevista NR01',
  technical_visit: 'Visita Técnica',
  internal_activity: 'Atividade Interna',
}

export default function DashboardPage() {
  const router = useRouter()
  const { companies } = useCrm()
  const { todayEvents } = useCalendar()
  const { completedEvents, totalRevenue: trainingRevenue } = useTrainings()
  const { dre, totalReceived } = useFinancial()

  const [showReportDropdown, setShowReportDropdown] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showCompanyReport, setShowCompanyReport] = useState(false)
  const [reportCompanyId, setReportCompanyId] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [form, setForm] = useState({ name: '', companyId: '', description: '', startDate: '', endDate: '', status: 'planejado' as const, budget: 0 })

  const reportRef = useRef<HTMLDivElement>(null)
  const reportContentRef = useRef<HTMLDivElement>(null)

  const stored = typeof window !== 'undefined'
    ? (() => { try { const s = localStorage.getItem('erp_projects'); return s ? JSON.parse(s) : SEED_PROJECTS } catch { return SEED_PROJECTS } })()
    : SEED_PROJECTS

  const [projects, setProjects] = useState<Project[]>(stored)

  const activeProjects = projects.filter(p => p.status === 'em_andamento' || p.status === 'planejado')
  const recentProjects = projects.slice(0, 3)

  const saveProjects = (list: Project[]) => {
    setProjects(list)
    if (typeof window !== 'undefined') localStorage.setItem('erp_projects', JSON.stringify(list))
  }

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    const comp = companies.find(c => c.id === form.companyId)
    const np: Project = {
      ...form,
      id: `proj-${Date.now()}`,
      companyName: comp?.name || form.companyId,
    }
    saveProjects([np, ...projects])
    setShowProjectForm(false)
    setForm({ name: '', companyId: '', description: '', startDate: '', endDate: '', status: 'planejado', budget: 0 })
  }

  const handleExportDashboardPDF = useCallback(async () => {
    setPdfLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'fixed'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.background = '#ffffff'
      tempDiv.style.padding = '40px'
      tempDiv.style.fontFamily = 'Inter, sans-serif'
      tempDiv.innerHTML = `
        <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
          <table style="width:100%"><tr>
            <td><h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:0">CrepaldiDH</h1>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0">Relatório do Dashboard</p></td>
            <td style="text-align:right;vertical-align:top">
              <p style="font-size:10px;color:#94a3b8;margin:0">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </td>
          </tr></table>
        </div>
        <h2 style="font-size:14px;font-weight:700;color:#334155;margin:0 0 12px">Indicadores</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;width:25%">
              <p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase;letter-spacing:0.5px">Clientes</p>
              <p style="font-size:24px;font-weight:800;color:#1e293b;margin:6px 0 0">${companies.length}</p>
            </td>
            <td style="width:8px"></td>
            <td style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;width:25%">
              <p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase;letter-spacing:0.5px">Projetos Ativos</p>
              <p style="font-size:24px;font-weight:800;color:#1e293b;margin:6px 0 0">${activeProjects.length}</p>
            </td>
            <td style="width:8px"></td>
            <td style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;width:25%">
              <p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase;letter-spacing:0.5px">Treinamentos</p>
              <p style="font-size:24px;font-weight:800;color:#1e293b;margin:6px 0 0">${completedEvents}</p>
            </td>
            <td style="width:8px"></td>
            <td style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;width:25%">
              <p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase;letter-spacing:0.5px">Receita</p>
              <p style="font-size:24px;font-weight:800;color:#059669;margin:6px 0 0">R$ ${(totalReceived > 0 ? totalReceived : trainingRevenue).toLocaleString('pt-BR')}</p>
            </td>
          </tr>
        </table>
        <h2 style="font-size:14px;font-weight:700;color:#334155;margin:0 0 12px">Projetos</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Projeto</th>
              <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Empresa</th>
              <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Status</th>
              <th style="padding:10px 14px;text-align:right;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Orçamento</th>
            </tr>
          </thead>
          <tbody>
            ${projects.slice(0, 15).map(p => `
              <tr>
                <td style="padding:10px 14px;font-size:11px;color:#1e293b;border:1px solid #e2e8f0;font-weight:600">${p.name}</td>
                <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${p.companyName}</td>
                <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${STATUS_LABELS[p.status]}</td>
                <td style="padding:10px 14px;font-size:11px;color:#059669;border:1px solid #e2e8f0;text-align:right;font-weight:700">R$ ${p.budget.toLocaleString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-top:32px">
          <table style="width:100%"><tr>
            <td><p style="font-size:9px;color:#94a3b8;margin:0">CrepaldiDH · Desenvolvimento Humano e Organizacional</p></td>
            <td style="text-align:right"><p style="font-size:9px;color:#94a3b8;margin:0">Relatório gerado automaticamente</p></td>
          </tr></table>
        </div>
      `
      document.body.appendChild(tempDiv)

      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const margin = 8
      const imgW = pw - margin * 2
      const imgH = (canvas.height / canvas.width) * imgW
      const totalPages = Math.ceil(imgH / (ph - margin * 2))
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()
        const srcY = (canvas.height / totalPages) * i
        const srcH = canvas.height / totalPages
        const destY = margin
        const destH = Math.min(imgH - (imgH / totalPages) * i, ph - margin * 2)
        pdf.addImage(imgData, 'PNG', margin, destY, imgW, destH, undefined, undefined, srcY)
        pdf.setFontSize(7)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Página ${i + 1} de ${totalPages} · CrepaldiDH ERP`, margin, ph - 4)
      }
      pdf.save(`relatorio-dashboard-${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.removeChild(tempDiv)
    } catch (err) {
      console.error('PDF error:', err)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setPdfLoading(false)
    }
  }, [companies, activeProjects, completedEvents, totalReceived, trainingRevenue, projects])

  const handleExportCompanyPDF = useCallback(async () => {
    if (!reportCompanyId) return
    const company = companies.find(c => c.id === reportCompanyId)
    if (!company) return

    setPdfLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const companyProjects = projects.filter(p => p.companyId === reportCompanyId)
      const companyEvents = todayEvents.filter(e => e.companyId === reportCompanyId)
      const companyRevenue = companyProjects.reduce((acc, p) => acc + p.budget, 0)

      const tempDiv = document.createElement('div')
      tempDiv.style.position = 'fixed'
      tempDiv.style.top = '-9999px'
      tempDiv.style.width = '800px'
      tempDiv.style.background = '#ffffff'
      tempDiv.style.padding = '40px'
      tempDiv.style.fontFamily = 'Inter, sans-serif'
      tempDiv.innerHTML = `
        <div style="border-bottom:3px solid #059669;padding-bottom:16px;margin-bottom:24px">
          <table style="width:100%"><tr>
            <td><h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:0">CrepaldiDH</h1>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0">Relatório por Empresa</p></td>
            <td style="text-align:right;vertical-align:top">
              <p style="font-size:10px;color:#94a3b8;margin:0">${new Date().toLocaleDateString('pt-BR')}</p>
            </td>
          </tr></table>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="background:#f0fdf4;padding:16px;border:1px solid #bbf7d0;width:33%">
              <p style="font-size:9px;color:#64748b;margin:0;text-transform:uppercase;letter-spacing:0.5px">Empresa</p>
              <p style="font-size:16px;font-weight:700;color:#1e293b;margin:6px 0 0">${company.name || company.tradeName || '—'}</p>
            </td>
            <td style="width:8px"></td>
            <td style="background:#f0fdf4;padding:16px;border:1px solid #bbf7d0;width:33%">
              <p style="font-size:9px;color:#64748b;margin:0;text-transform:uppercase;letter-spacing:0.5px">CNPJ</p>
              <p style="font-size:14px;font-weight:700;color:#1e293b;margin:6px 0 0">${company.cnpj || '—'}</p>
            </td>
            <td style="width:8px"></td>
            <td style="background:#f0fdf4;padding:16px;border:1px solid #bbf7d0;width:33%">
              <p style="font-size:9px;color:#64748b;margin:0;text-transform:uppercase;letter-spacing:0.5px">Cidade/UF</p>
              <p style="font-size:14px;font-weight:700;color:#1e293b;margin:6px 0 0">${company.city || '—'}/${company.state || ''}</p>
            </td>
          </tr>
        </table>
        <h2 style="font-size:14px;font-weight:700;color:#334155;margin:0 0 12px">Projetos (${companyProjects.length})</h2>
        ${companyProjects.length === 0 ? '<p style="font-size:12px;color:#94a3b8;padding:20px 0;text-align:center">Nenhum projeto vinculado a esta empresa.</p>' : `
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Projeto</th>
              <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Status</th>
              <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Período</th>
              <th style="padding:10px 14px;text-align:right;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Valor</th>
            </tr>
          </thead>
          <tbody>
            ${companyProjects.map(p => `
              <tr>
                <td style="padding:10px 14px;font-size:11px;color:#1e293b;border:1px solid #e2e8f0;font-weight:600">${p.name}</td>
                <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${STATUS_LABELS[p.status]}</td>
                <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${new Date(p.startDate).toLocaleDateString('pt-BR')} a ${new Date(p.endDate).toLocaleDateString('pt-BR')}</td>
                <td style="padding:10px 14px;font-size:11px;color:#059669;border:1px solid #e2e8f0;text-align:right;font-weight:700">R$ ${p.budget.toLocaleString('pt-BR')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        `}
        <p style="font-size:18px;font-weight:800;color:#059669;margin:16px 0;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;text-align:center">Receita total: R$ ${companyRevenue.toLocaleString('pt-BR')}</p>
        ${companyEvents.length > 0 ? `
        <h2 style="font-size:14px;font-weight:700;color:#334155;margin:24px 0 12px">Agenda</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead>
            <tr style="background:#f1f5f9">
              <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Evento</th>
              <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0;text-transform:uppercase;letter-spacing:0.5px">Horário</th>
            </tr>
          </thead>
          <tbody>
            ${companyEvents.map(e => `
              <tr>
                <td style="padding:10px 14px;font-size:11px;color:#1e293b;border:1px solid #e2e8f0;font-weight:600">${e.title}</td>
                <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${e.startTime} - ${e.endTime}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ` : ''}
        <div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-top:32px">
          <table style="width:100%"><tr>
            <td><p style="font-size:9px;color:#94a3b8;margin:0">CrepaldiDH · Desenvolvimento Humano e Organizacional</p></td>
            <td style="text-align:right"><p style="font-size:9px;color:#94a3b8;margin:0">Relatório gerado automaticamente</p></td>
          </tr></table>
        </div>
      `
      document.body.appendChild(tempDiv)

      const canvas = await html2canvas(tempDiv, { scale: 2, useCORS: true, logging: false })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      const margin = 8
      const imgW = pw - margin * 2
      const imgH = (canvas.height / canvas.width) * imgW
      const totalPages = Math.ceil(imgH / (ph - margin * 2))
      for (let i = 0; i < totalPages; i++) {
        if (i > 0) pdf.addPage()
        const srcY = (canvas.height / totalPages) * i
        const srcH = canvas.height / totalPages
        const destY = margin
        const destH = Math.min(imgH - (imgH / totalPages) * i, ph - margin * 2)
        pdf.addImage(imgData, 'PNG', margin, destY, imgW, destH, undefined, undefined, srcY)
        pdf.setFontSize(7)
        pdf.setTextColor(150, 150, 150)
        pdf.text(`Página ${i + 1} de ${totalPages} · CrepaldiDH ERP`, margin, ph - 4)
      }
      pdf.save(`relatorio-${company.name.replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`)
      document.body.removeChild(tempDiv)
      setShowCompanyReport(false)
      setReportCompanyId('')
    } catch (err) {
      console.error('PDF error:', err)
      alert('Erro ao gerar PDF. Tente novamente.')
    } finally {
      setPdfLoading(false)
    }
  }, [reportCompanyId, companies, projects, todayEvents])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (reportRef.current && !reportRef.current.contains(e.target as Node)) {
        setShowReportDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const revenueValue = totalReceived > 0 ? totalReceived : trainingRevenue > 0 ? trainingRevenue : projects.reduce((acc, p) => acc + p.budget, 0)

  const stats = [
    { label: "Total de Clientes", value: companies.length.toString(), icon: Users, color: "bg-blue-500", trend: companies.length > 0 ? `${companies.filter(c => c.status === 'active').length} ativos` : '0 ativos' },
    { label: "Projetos Ativos", value: activeProjects.length.toString(), icon: Briefcase, color: "bg-brand-teal", trend: activeProjects.length > 0 ? `${activeProjects.length} em andamento` : 'nenhum ativo' },
    { label: "Treinamentos Realizados", value: completedEvents.toString(), icon: GraduationCap, color: "bg-indigo-500", trend: `${completedEvents} concluídos` },
    { label: "Receita do Período", value: `R$ ${revenueValue.toLocaleString('pt-BR')}`, icon: TrendingUp, color: "bg-emerald-500", trend: `${dre?.profitMargin || 0}% margem` },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Bem-vindo de volta, Marcos. Aqui está o resumo de hoje.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative" ref={reportRef}>
            <button
              onClick={() => setShowReportDropdown(!showReportDropdown)}
              disabled={pdfLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 font-semibold transition-all duration-300 shadow-sm disabled:opacity-50"
            >
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {pdfLoading ? 'Gerando...' : 'Baixar Relatório'}
            </button>
            {showReportDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <button
                  onClick={() => { setShowReportDropdown(false); handleExportDashboardPDF() }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left"
                >
                  <FileDown className="w-4 h-4 text-violet-500" /> Relatório do Dashboard
                </button>
                <button
                  onClick={() => { setShowReportDropdown(false); setShowCompanyReport(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left border-t border-slate-50"
                >
                  <Building2 className="w-4 h-4 text-emerald-500" /> Relatório por Empresa
                </button>
              </div>
            )}
          </div>
          <button
            onClick={() => setShowProjectForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white rounded-full hover:bg-brand-teal/90 shadow-md shadow-brand-teal/25 font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
          >
            <Plus className="w-4 h-4" /> Novo Projeto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                {stat.trend}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
            </div>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.color} opacity-5 group-hover:scale-150 transition-transform duration-500`}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Projetos Recentes</h2>
            <button
              onClick={() => router.push('/projects')}
              className="text-brand-teal text-sm font-medium hover:underline flex items-center"
            >
              Ver todos <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {recentProjects.length === 0 ? (
              <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs">Nenhum projeto ainda.</p>
                <p className="text-[10px] text-slate-300 mt-1">Clique em "Novo Projeto" para começar.</p>
              </div>
            ) : recentProjects.map((p) => (
              <div
                key={p.id}
                onClick={() => router.push('/projects')}
                className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 hover:border-slate-100 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-blue-light/10 text-brand-blue flex items-center justify-center font-bold text-xs">
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">{p.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3 h-3" /> {p.companyName}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`px-2 py-1 text-[10px] font-semibold rounded border ${STATUS_COLORS[p.status]}`}>
                    {STATUS_LABELS[p.status]}
                  </span>
                  <ChevronRight className="w-4 h-4 text-slate-300" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-blue rounded-2xl shadow-md p-6 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 blur-2xl rounded-full -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Agenda de Hoje</h2>
              <Calendar className="w-5 h-5 text-brand-teal" />
            </div>
            
            <div className="space-y-4">
              {todayEvents.length === 0 ? (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10 text-center">
                  <Calendar className="w-6 h-6 mx-auto mb-2 opacity-50" />
                  <p className="text-xs text-slate-300">Nenhum evento agendado para hoje</p>
                </div>
              ) : todayEvents.slice(0, 4).map((evt) => (
                <div key={evt.id} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-brand-teal mt-1.5" style={{ backgroundColor: evt.color || '#14b8a6' }} />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold truncate">{evt.title}</h4>
                      <p className="text-xs text-slate-300 mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {evt.startTime} - {evt.endTime}
                        {evt.companyName && <><span className="mx-1">·</span><Building2 className="w-3 h-3" /> {evt.companyName}</>}
                      </p>
                      {evt.location && (
                        <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {evt.location}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={() => router.push('/calendar')}
              className="w-full mt-6 py-3 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-full text-sm font-bold transition-all duration-300 shadow-md shadow-black/10 hover:-translate-y-0.5"
            >
              Ver Agenda Completa ({todayEvents.length})
            </button>
          </div>
        </div>
      </div>

      {/* Relatório por Empresa Modal */}
      {showCompanyReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => { setShowCompanyReport(false); setReportCompanyId('') }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Relatório por Empresa</h2>
                <p className="text-sm text-slate-500">Selecione a empresa para gerar o relatório</p>
              </div>
              <button onClick={() => { setShowCompanyReport(false); setReportCompanyId('') }} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Empresa *</label>
                <select
                  value={reportCompanyId}
                  onChange={e => setReportCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white"
                >
                  <option value="">Selecione...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.city ? `· ${c.city}/${c.state}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              {reportCompanyId && (() => {
                const c = companies.find(x => x.id === reportCompanyId)
                const cp = projects.filter(p => p.companyId === reportCompanyId)
                const rev = cp.reduce((acc, p) => acc + p.budget, 0)
                const evts = todayEvents.filter(e => e.companyId === reportCompanyId)
                return (
                  <div className="bg-slate-50 rounded-xl p-4 space-y-2">
                    <p className="text-xs font-semibold text-slate-700">{c?.name}</p>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-[9px] text-slate-400">Projetos</p>
                        <p className="text-sm font-bold text-slate-800">{cp.length}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-[9px] text-slate-400">Receita</p>
                        <p className="text-sm font-bold text-emerald-600">R$ {rev.toLocaleString('pt-BR')}</p>
                      </div>
                      <div className="bg-white rounded-lg p-2">
                        <p className="text-[9px] text-slate-400">Eventos hoje</p>
                        <p className="text-sm font-bold text-slate-800">{evts.length}</p>
                      </div>
                    </div>
                  </div>
                )
              })()}
              <button
                onClick={handleExportCompanyPDF}
                disabled={!reportCompanyId || pdfLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {pdfLoading ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOVO PROJETO MODAL */}
      {showProjectForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProjectForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div>
                <h2 className="text-lg font-bold text-slate-800">Novo Projeto</h2>
                <p className="text-sm text-slate-500">Vincule a uma empresa ativa da carteira</p>
              </div>
              <button onClick={() => setShowProjectForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreateProject} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Empresa *</label>
                <select required value={form.companyId} onChange={e => setForm({ ...form, companyId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="">Selecione a Empresa...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Projeto *</label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ex: PGR 2026" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Descrição</label>
                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={3} placeholder="Descreva o escopo do projeto..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Início *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Data Encerramento *</label>
                  <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="planejado">Planejado</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="pausado">Pausado</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Orçamento (R$)</label>
                  <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })}
                    placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowProjectForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">
                  Criar Projeto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
