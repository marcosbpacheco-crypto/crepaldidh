'use client'

import { useState, useRef, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useCalendar } from '@/app/(dashboard)/calendar/context/CalendarContext'
import { useTrainings } from '@/app/(dashboard)/trainings/context/TrainingsContext'
import { useFinancial } from '@/app/(dashboard)/financial/context/FinancialContext'
import { useClients } from '@/app/(dashboard)/clients/context/ClientsContext'
import { useProjects } from '@/app/(dashboard)/projects/context/ProjectContext'
import {
  Users, Briefcase, GraduationCap, TrendingUp, Calendar, ChevronRight,
  Plus, X, FileDown, Building2, Clock, MapPin, Download, Loader2,
  Activity, Phone, Mail, MessageSquare, BarChart3, Target
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

const ACTIVITY_ICONS: Record<string, React.ElementType> = {
  call: Phone, meeting: Users, whatsapp: MessageSquare, email: Mail,
  visit: MapPin, proposal: FileDown, contract: FileDown, comment: MessageSquare,
}

export default function DashboardPage() {
  const router = useRouter()
  const { companies, activities } = useCrm()
  const { clients } = useClients()
  const { todayEvents, events } = useCalendar()
  const { completedEvents, totalRevenue: trainingRevenue } = useTrainings()
  const { dre, totalReceived, receivables } = useFinancial()

  const [showReportDropdown, setShowReportDropdown] = useState(false)
  const [showProjectForm, setShowProjectForm] = useState(false)
  const [showCompanyReport, setShowCompanyReport] = useState(false)
  const [reportCompanyId, setReportCompanyId] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)
  const [form, setForm] = useState({ name: '', companyId: '', description: '', startDate: '', endDate: '', status: 'planejado' as const, budget: 0 })
  const [loaded, setLoaded] = useState(false)

  const reportRef = useRef<HTMLDivElement>(null)

  const { projects: ctxProjects = [], createProject } = useProjects()

  useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 200)
    return () => clearTimeout(timer)
  }, [])

  const projects: Project[] = useMemo(() => ctxProjects.map(p => ({
    id: p.id,
    name: p.name,
    companyId: p.company_id,
    companyName: companies.find(c => c.id === p.company_id)?.name || '',
    description: p.description || '',
    startDate: p.start_date || '',
    endDate: p.end_date || '',
    status: p.status as Project['status'],
    budget: 0,
  })), [ctxProjects, companies])

  const activeProjects = projects.filter(p => p.status === 'em_andamento' || p.status === 'planejado')
  const recentProjects = projects.slice(0, 5)

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault()
    await createProject({
      company_id: form.companyId,
      name: form.name,
      description: form.description,
      start_date: form.startDate,
      end_date: form.endDate,
      status: form.status,
    })
    setShowProjectForm(false)
    setForm({ name: '', companyId: '', description: '', startDate: '', endDate: '', status: 'planejado', budget: 0 })
  }

  const revenueValue = totalReceived > 0 ? totalReceived : trainingRevenue > 0 ? trainingRevenue : projects.reduce((acc, p) => acc + p.budget, 0)
  const activeCompanies = companies.filter(c => c.status === 'active').length
  const activeClients = clients.filter(c => c.status === 'active').length
  const paidReceivables = receivables.filter(r => r.status === 'paid')
  const totalPaid = paidReceivables.reduce((s, r) => s + r.amount, 0)

  // Simulated monthly revenue for chart (last 6 months)
  const monthlyRevenue = useMemo(() => {
    const months: { label: string; value: number; pct: number }[] = []
    const maxVal = Math.max(totalPaid || revenueValue, 1)
    const now = new Date()
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const label = d.toLocaleDateString('pt-BR', { month: 'short' })
      const base = totalPaid / 6
      const variance = base * 0.4 * Math.sin(i * 1.2 + 1)
      const val = Math.max(0, base + variance)
      months.push({ label, value: val, pct: (val / maxVal) * 100 })
    }
    return months
  }, [totalPaid, revenueValue])

  const recentActivities = useMemo(() => {
    return [...activities].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()).slice(0, 6)
  }, [activities])

  const upcomingEvents = useMemo(() => {
    return [...events].filter(e => e.status === 'scheduled' || e.status === 'confirmed')
      .sort((a, b) => new Date(a.eventDate + 'T' + a.startTime).getTime() - new Date(b.eventDate + 'T' + b.startTime).getTime())
      .slice(0, 5)
  }, [events])

  const stats = [
    { label: "Empresas (CRM)", value: activeCompanies.toString(), icon: Building2, color: "bg-blue-500", trend: `${activeCompanies} ativas` },
    { label: "Clientes", value: activeClients.toString(), icon: Users, color: "bg-brand-teal", trend: `${activeClients} ativos` },
    { label: "Treinamentos", value: completedEvents.toString(), icon: GraduationCap, color: "bg-indigo-500", trend: `${completedEvents} realizados` },
    { label: "Receita", value: `R$ ${revenueValue.toLocaleString('pt-BR')}`, icon: TrendingUp, color: "bg-emerald-500", trend: `${dre?.profitMargin || 0}% margem` },
  ]

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
      const activeC = companies.filter(c => c.status === 'active').length
      tempDiv.innerHTML = `
        <div style="border-bottom:3px solid #7c3aed;padding-bottom:16px;margin-bottom:24px">
          <table style="width:100%"><tr>
            <td><h1 style="font-size:22px;font-weight:800;color:#1e293b;margin:0">CrepaldiDH</h1>
            <p style="font-size:12px;color:#64748b;margin:4px 0 0">Relat\u00f3rio do Dashboard</p></td>
            <td style="text-align:right;vertical-align:top">
              <p style="font-size:10px;color:#94a3b8;margin:0">${new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </td>
          </tr></table>
        </div>
        <h2 style="font-size:14px;font-weight:700;color:#334155;margin:0 0 12px">Indicadores</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <tr>
            <td style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;width:25%"><p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase">Clientes</p><p style="font-size:24px;font-weight:800;color:#1e293b;margin:6px 0 0">${activeC}</p></td>
            <td style="width:8px"></td>
            <td style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;width:25%"><p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase">Projetos Ativos</p><p style="font-size:24px;font-weight:800;color:#1e293b;margin:6px 0 0">${activeProjects.length}</p></td>
            <td style="width:8px"></td>
            <td style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;width:25%"><p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase">Treinamentos</p><p style="font-size:24px;font-weight:800;color:#1e293b;margin:6px 0 0">${completedEvents}</p></td>
            <td style="width:8px"></td>
            <td style="background:#f8fafc;padding:16px;border:1px solid #e2e8f0;width:25%"><p style="font-size:9px;color:#94a3b8;margin:0;text-transform:uppercase">Receita</p><p style="font-size:24px;font-weight:800;color:#059669;margin:6px 0 0">R$ ${revenueValue.toLocaleString('pt-BR')}</p></td>
          </tr>
        </table>
        <h2 style="font-size:14px;font-weight:700;color:#334155;margin:0 0 12px">Projetos</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f1f5f9">
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Projeto</th>
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Empresa</th>
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Status</th>
            <th style="padding:10px 14px;text-align:right;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Or\u00e7amento</th>
          </tr></thead>
          <tbody>${projects.slice(0, 15).map(p => `<tr>
            <td style="padding:10px 14px;font-size:11px;color:#1e293b;border:1px solid #e2e8f0;font-weight:600">${p.name}</td>
            <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${p.companyName}</td>
            <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${STATUS_LABELS[p.status]}</td>
            <td style="padding:10px 14px;font-size:11px;color:#059669;border:1px solid #e2e8f0;text-align:right;font-weight:700">R$ ${p.budget.toLocaleString('pt-BR')}</td>
          </tr>`).join('')}</tbody>
        </table>
        <div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-top:32px">
          <table style="width:100%"><tr>
            <td><p style="font-size:9px;color:#94a3b8;margin:0">CrepaldiDH · Desenvolvimento Humano e Organizacional</p></td>
            <td style="text-align:right"><p style="font-size:9px;color:#94a3b8;margin:0">Relat\u00f3rio gerado automaticamente</p></td>
          </tr></table>
        </div>`
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
    } catch { alert('Erro ao gerar PDF. Tente novamente.') }
    finally { setPdfLoading(false) }
  }, [companies, activeProjects, completedEvents, revenueValue, projects])

  const handleExportCompanyPDF = useCallback(async () => {
    if (!reportCompanyId) return
    const company = companies.find(c => c.id === reportCompanyId)
    if (!company) return
    setPdfLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const cp = projects.filter(p => p.companyId === reportCompanyId)
      const rev = cp.reduce((acc, p) => acc + p.budget, 0)
      const evts = todayEvents.filter(e => e.companyId === reportCompanyId)
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
            <p style="font-size:12px;color:#64748b;margin:4px 0 0">Relat\u00f3rio por Empresa</p></td>
            <td style="text-align:right;vertical-align:top"><p style="font-size:10px;color:#94a3b8;margin:0">${new Date().toLocaleDateString('pt-BR')}</p></td>
          </tr></table>
        </div>
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px"><tr>
          <td style="background:#f0fdf4;padding:16px;border:1px solid #bbf7d0;width:33%"><p style="font-size:9px;color:#64748b;margin:0;text-transform:uppercase">Empresa</p><p style="font-size:16px;font-weight:700;color:#1e293b;margin:6px 0 0">${company.name || company.tradeName || '—'}</p></td>
          <td style="width:8px"></td>
          <td style="background:#f0fdf4;padding:16px;border:1px solid #bbf7d0;width:33%"><p style="font-size:9px;color:#64748b;margin:0;text-transform:uppercase">CNPJ</p><p style="font-size:14px;font-weight:700;color:#1e293b;margin:6px 0 0">${company.cnpj || '—'}</p></td>
          <td style="width:8px"></td>
          <td style="background:#f0fdf4;padding:16px;border:1px solid #bbf7d0;width:33%"><p style="font-size:9px;color:#64748b;margin:0;text-transform:uppercase">Cidade/UF</p><p style="font-size:14px;font-weight:700;color:#1e293b;margin:6px 0 0">${company.city || '—'}/${company.state || ''}</p></td>
        </tr></table>
        <h2 style="font-size:14px;font-weight:700;color:#334155;margin:0 0 12px">Projetos (${cp.length})</h2>
        ${cp.length === 0 ? '<p style="font-size:12px;color:#94a3b8;padding:20px 0;text-align:center">Nenhum projeto vinculado.</p>' : `
        <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
          <thead><tr style="background:#f1f5f9">
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Projeto</th>
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Status</th>
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Per\u00edodo</th>
            <th style="padding:10px 14px;text-align:right;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Valor</th>
          </tr></thead>
          <tbody>${cp.map(p => `<tr>
            <td style="padding:10px 14px;font-size:11px;color:#1e293b;border:1px solid #e2e8f0;font-weight:600">${p.name}</td>
            <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${STATUS_LABELS[p.status]}</td>
            <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${new Date(p.startDate).toLocaleDateString('pt-BR')} a ${new Date(p.endDate).toLocaleDateString('pt-BR')}</td>
            <td style="padding:10px 14px;font-size:11px;color:#059669;border:1px solid #e2e8f0;text-align:right;font-weight:700">R$ ${p.budget.toLocaleString('pt-BR')}</td>
          </tr>`).join('')}</tbody>
        </table>`}
        <p style="font-size:18px;font-weight:800;color:#059669;margin:16px 0;padding:16px;background:#f0fdf4;border:1px solid #bbf7d0;text-align:center">Receita total: R$ ${rev.toLocaleString('pt-BR')}</p>
        ${evts.length > 0 ? `
        <h2 style="font-size:14px;font-weight:700;color:#334155;margin:24px 0 12px">Agenda</h2>
        <table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:#f1f5f9">
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Evento</th>
            <th style="padding:10px 14px;text-align:left;font-size:9px;color:#64748b;border:1px solid #e2e8f0">Hor\u00e1rio</th>
          </tr></thead>
          <tbody>${evts.map(e => `<tr>
            <td style="padding:10px 14px;font-size:11px;color:#1e293b;border:1px solid #e2e8f0;font-weight:600">${e.title}</td>
            <td style="padding:10px 14px;font-size:11px;color:#64748b;border:1px solid #e2e8f0">${e.startTime} - ${e.endTime}</td>
          </tr>`).join('')}</tbody>
        </table>` : ''}
        <div style="border-top:2px solid #e2e8f0;padding-top:16px;margin-top:32px">
          <table style="width:100%"><tr>
            <td><p style="font-size:9px;color:#94a3b8;margin:0">CrepaldiDH · Desenvolvimento Humano e Organizacional</p></td>
            <td style="text-align:right"><p style="font-size:9px;color:#94a3b8;margin:0">Relat\u00f3rio gerado automaticamente</p></td>
          </tr></table>
        </div>`
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
    } catch { alert('Erro ao gerar PDF. Tente novamente.') }
    finally { setPdfLoading(false) }
  }, [reportCompanyId, companies, projects, todayEvents])

  if (!loaded) {
    return (
      <div className="space-y-8 animate-in fade-in duration-500">
        <div className="flex justify-between items-end">
          <div>
            <div className="h-9 w-64 bg-slate-100 rounded-lg animate-pulse" />
            <div className="h-4 w-48 bg-slate-50 rounded mt-2 animate-pulse" />
          </div>
          <div className="flex gap-3">
            <div className="h-10 w-36 bg-slate-100 rounded-full animate-pulse" />
            <div className="h-10 w-40 bg-slate-100 rounded-full animate-pulse" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100">
              <div className="h-12 w-12 bg-slate-100 rounded-xl animate-pulse mb-4" />
              <div className="h-3 w-20 bg-slate-50 rounded animate-pulse mb-2" />
              <div className="h-8 w-32 bg-slate-100 rounded animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Bem-vindo de volta. Aqui está o resumo de hoje.</p>
        </div>
        <div className="flex gap-3">
          <div className="relative" ref={reportRef}>
            <button onClick={() => setShowReportDropdown(!showReportDropdown)} disabled={pdfLoading}
              className="flex items-center gap-2 px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 font-semibold transition-all duration-300 shadow-sm disabled:opacity-50">
              {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
              {pdfLoading ? 'Gerando...' : 'Baixar Relatório'}
            </button>
            {showReportDropdown && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden">
                <button onClick={() => { setShowReportDropdown(false); handleExportDashboardPDF() }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left">
                  <FileDown className="w-4 h-4 text-violet-500" /> Relatório do Dashboard
                </button>
                <button onClick={() => { setShowReportDropdown(false); setShowCompanyReport(true) }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-xs text-slate-700 hover:bg-slate-50 transition-colors text-left border-t border-slate-50">
                  <Building2 className="w-4 h-4 text-emerald-500" /> Relatório por Empresa
                </button>
              </div>
            )}
          </div>
          <button onClick={() => setShowProjectForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-teal text-white rounded-full hover:bg-brand-teal/90 shadow-md shadow-brand-teal/25 font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            <Plus className="w-4 h-4" /> Novo Projeto
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group animate-in fade-in slide-in-from-bottom-4 duration-500" style={{ animationDelay: `${i * 80}ms` } as React.CSSProperties}>
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${stat.color} shadow-sm group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{stat.trend}</span>
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
            </div>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.color} opacity-5 group-hover:scale-150 group-hover:opacity-10 transition-all duration-500`}></div>
          </div>
        ))}
      </div>

      {/* Row 2: Revenue Chart + Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Mini-Chart */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-emerald-500" /> Receita Mensal
            </h2>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">
              R$ {revenueValue.toLocaleString('pt-BR')}
            </span>
          </div>
          <div className="flex items-end gap-2 h-40">
            {monthlyRevenue.map((m, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                <span className="text-[9px] text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  R${Math.round(m.value).toLocaleString()}
                </span>
                <div className="w-full bg-slate-100 rounded-t-lg relative overflow-hidden" style={{ height: '100%' }}>
                  <div
                    className="absolute bottom-0 w-full bg-gradient-to-t from-emerald-500 to-emerald-300 rounded-t-lg transition-all duration-1000 ease-out"
                    style={{ height: `${m.pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 font-medium">{m.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-500" /> Atividades Recentes
            </h2>
            <button onClick={() => router.push('/crm')} className="text-brand-teal text-sm font-medium hover:underline flex items-center">
              Ver todas <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-0">
            {recentActivities.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-slate-200 rounded-xl">
                <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Nenhuma atividade registrada ainda.</p>
                <p className="text-[10px] text-slate-300 mt-1">As atividades do CRM aparecerão aqui.</p>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute left-[17px] top-2 bottom-2 w-0.5 bg-slate-100" />
                {recentActivities.map((a, i) => {
                  const Icon = ACTIVITY_ICONS[a.type] || Activity
                  const comp = companies.find(c => c.id === a.companyId)
                  return (
                    <div key={a.id} className="flex items-start gap-4 pb-5 relative animate-in fade-in slide-in-from-left-2 duration-300" style={{ animationDelay: `${i * 60}ms` } as React.CSSProperties}>
                      <div className="w-9 h-9 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center flex-shrink-0 z-10 border-2 border-white shadow-sm">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0 pt-1">
                        <p className="text-xs font-semibold text-slate-800">{a.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{a.description}</p>
                        <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400">
                          <span>{new Date(a.date).toLocaleDateString('pt-BR')}</span>
                          {comp && <><span>·</span><span>{comp.tradeName || comp.name}</span></>}
                          <span>·</span><span>{a.author}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Projects + Calendar + Upcoming Events */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-500" /> Projetos Recentes
            </h2>
            <button onClick={() => router.push('/projects')} className="text-brand-teal text-sm font-medium hover:underline flex items-center">
              Ver todos <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-3">
            {recentProjects.length === 0 ? (
              <div className="py-10 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-xl">
                <Briefcase className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                <p className="text-xs">Nenhum projeto ainda.</p>
                <p className="text-[10px] text-slate-300 mt-1">Clique em "Novo Projeto" para começar.</p>
              </div>
            ) : recentProjects.map((p) => (
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

        {/* Agenda + Próximos Eventos */}
        <div className="space-y-6">
          {/* Today's Agenda */}
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
                ) : todayEvents.slice(0, 3).map((evt) => (
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
              </div>
              <button onClick={() => router.push('/calendar')}
                className="w-full mt-4 py-2.5 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-black/10 hover:-translate-y-0.5">
                Agenda Completa
              </button>
            </div>
          </div>

          {/* Próximos Eventos */}
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

      {/* Modals remain the same */}
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
                <select value={reportCompanyId} onChange={e => setReportCompanyId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="">Selecione...</option>
                  {companies.map(c => <option key={c.id} value={c.id}>{c.name} {c.city ? `· ${c.city}/${c.state}` : ''}</option>)}
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
                      <div className="bg-white rounded-lg p-2"><p className="text-[9px] text-slate-400">Projetos</p><p className="text-sm font-bold text-slate-800">{cp.length}</p></div>
                      <div className="bg-white rounded-lg p-2"><p className="text-[9px] text-slate-400">Receita</p><p className="text-sm font-bold text-emerald-600">R$ {rev.toLocaleString('pt-BR')}</p></div>
                      <div className="bg-white rounded-lg p-2"><p className="text-[9px] text-slate-400">Eventos hoje</p><p className="text-sm font-bold text-slate-800">{evts.length}</p></div>
                    </div>
                  </div>
                )
              })()}
              <button onClick={handleExportCompanyPDF} disabled={!reportCompanyId || pdfLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50">
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {pdfLoading ? 'Gerando PDF...' : 'Gerar Relatório PDF'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showProjectForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowProjectForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <div><h2 className="text-lg font-bold text-slate-800">Novo Projeto</h2><p className="text-sm text-slate-500">Vincule a uma empresa ativa da carteira</p></div>
              <button onClick={() => setShowProjectForm(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
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
                  rows={3} placeholder="Descreva o escopo do projeto..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs resize-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Data Início *</label>
                  <input required type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Data Encerramento *</label>
                  <input required type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                  <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                    <option value="planejado">Planejado</option>
                    <option value="em_andamento">Em Andamento</option>
                    <option value="concluido">Concluído</option>
                    <option value="pausado">Pausado</option>
                  </select></div>
                <div><label className="block text-xs font-bold text-slate-700 mb-1">Orçamento (R$)</label>
                  <input type="number" value={form.budget} onChange={e => setForm({ ...form, budget: Number(e.target.value) })} placeholder="0" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" /></div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setShowProjectForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">Cancelar</button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">Criar Projeto</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
