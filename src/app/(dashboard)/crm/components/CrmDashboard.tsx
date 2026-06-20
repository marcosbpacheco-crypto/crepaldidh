'use client'

import React, { useMemo } from 'react'
import { useCrm } from '../context/CrmContext'
import { useAdmin } from '../../admin/context/AdminContext'
import { 
  Building2, Users, FileText, CheckCircle, TrendingUp, DollarSign, 
  Calendar, AlertCircle, ArrowUpRight, Award, ChevronRight, Briefcase, Lock
} from 'lucide-react'

const NoAccess = () => (
  <div className="flex items-center gap-1 text-slate-300 font-bold">
    <Lock className="w-3.5 h-3.5" />
    ---
  </div>
)

export const CrmDashboard: React.FC = () => {
  const { companies, deals, proposals, contracts, tasks, sellers } = useCrm()
  const hasFinancialAccess = useAdmin().checkPermission('financial', 'view')

  // 1. Calculate Stats
  const stats = useMemo(() => {
    const totalLeads = deals.filter(d => d.stage !== 'Cliente ativo' && d.stage !== 'Cliente perdido').length
    const activeCompanies = companies.filter(c => c.status === 'active').length
    const inactiveCompanies = companies.filter(c => c.status === 'inactive').length
    
    const propsSent = proposals.filter(p => p.status === 'sent').length
    const propsApproved = proposals.filter(p => p.status === 'approved').length
    const activeContracts = contracts.filter(c => c.status === 'active').length

    // Predicted Revenue (deals in active stages: Lead novo up to Negociação)
    const activeStages = ['Lead novo', 'Primeiro contato', 'Reunião agendada', 'Diagnóstico realizado', 'Proposta enviada', 'Negociação']
    const predictedRevenue = deals
      .filter(d => activeStages.includes(d.stage))
      .reduce((sum, d) => sum + d.value, 0)

    // Closed Revenue (deals in closed won stages: Contrato aprovado, Implantação, Cliente ativo, Renovação)
    const closedStages = ['Contrato aprovado', 'Implantação', 'Cliente ativo', 'Renovação']
    const closedRevenue = deals
      .filter(d => closedStages.includes(d.stage))
      .reduce((sum, d) => sum + d.value, 0)

    return {
      totalLeads,
      activeCompanies,
      inactiveCompanies,
      propsSent,
      propsApproved,
      activeContracts,
      predictedRevenue,
      closedRevenue
    }
  }, [companies, deals, proposals, contracts])

  // 2. Conversion by Stage data
  const pipelineConversion = useMemo(() => {
    const stages = [
      'Lead novo',
      'Primeiro contato',
      'Reunião agendada',
      'Diagnóstico realizado',
      'Proposta enviada',
      'Negociação',
      'Contrato aprovado'
    ]

    const counts = stages.map(stage => {
      const numDeals = deals.filter(d => d.stage === stage).length
      return { stage, count: numDeals }
    })

    // Find max for percentage calculation
    const maxVal = Math.max(...counts.map(c => c.count), 1)

    return counts.map(c => ({
      ...c,
      percentage: Math.round((c.count / maxVal) * 100)
    }))
  }, [deals])

  // 3. Revenue by Service (for Donut Chart)
  const serviceRevenue = useMemo(() => {
    const revenueMap: Record<string, number> = {}
    
    deals.forEach(d => {
      const closedStages = ['Contrato aprovado', 'Implantação', 'Cliente ativo', 'Renovação']
      if (closedStages.includes(d.stage)) {
        revenueMap[d.service] = (revenueMap[d.service] || 0) + d.value
      }
    })

    const total = Object.values(revenueMap).reduce((sum, val) => sum + val, 0) || 1

    const colors = [
      '#2db2a5', // brand-teal
      '#1b3d52', // brand-blue
      '#3b82f6', // blue
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#f59e0b', // amber
      '#10b981', // emerald
      '#6366f1', // indigo
      '#ef4444', // red
      '#6b7280'  // gray
    ]

    return Object.entries(revenueMap)
      .map(([service, val], idx) => ({
        service,
        value: val,
        percentage: Math.round((val / total) * 100),
        color: colors[idx % colors.length]
      }))
      .sort((a, b) => b.value - a.value)
  }, [deals])

  // 4. Customer Ranking (top spenders)
  const customerRanking = useMemo(() => {
    const spentMap: Record<string, number> = {}

    deals.forEach(d => {
      const closedStages = ['Contrato aprovado', 'Implantação', 'Cliente ativo', 'Renovação']
      if (closedStages.includes(d.stage)) {
        spentMap[d.companyId] = (spentMap[d.companyId] || 0) + d.value
      }
    })

    return Object.entries(spentMap)
      .map(([companyId, value]) => {
        const comp = companies.find(c => c.id === companyId)
        return {
          id: companyId,
          name: comp ? comp.tradeName : 'Empresa Desconhecida',
          segment: comp ? comp.segment : 'N/A',
          value
        }
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [companies, deals])

  // 5. Seller Ranking
  const sellerRanking = useMemo(() => {
    const salesMap: Record<string, number> = {}

    deals.forEach(d => {
      const closedStages = ['Contrato aprovado', 'Implantação', 'Cliente ativo', 'Renovação']
      if (closedStages.includes(d.stage)) {
        salesMap[d.sellerId] = (salesMap[d.sellerId] || 0) + d.value
      }
    })

    return sellers.map(seller => ({
      ...seller,
      value: salesMap[seller.id] || 0
    })).sort((a, b) => b.value - a.value)
  }, [sellers, deals])

  // 6. Upcoming Follow-ups & Tasks
  const upcomingTasks = useMemo(() => {
    const today = new Date().toISOString().split('T')[0]
    return tasks
      .filter(t => t.status === 'pending')
      .map(t => {
        const comp = companies.find(c => c.id === t.companyId)
        const isLate = t.dueDate < today
        return {
          ...t,
          companyName: comp ? comp.tradeName : 'Empresa',
          isLate
        }
      })
      .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
      .slice(0, 5)
  }, [tasks, companies])

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper Grid - KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Leads */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Leads Ativos no Funil</span>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.totalLeads}</h3>
            <div className="flex items-center gap-1 mt-2 text-emerald-600 text-xs font-bold">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Pipeline saudável</span>
            </div>
          </div>
          <div className="p-4 bg-brand-teal/10 rounded-2xl text-brand-teal">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* Clientes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Empresas Cadastradas</span>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{stats.activeCompanies}</h3>
            <div className="text-slate-400 text-xs font-medium mt-2">
              <span className="text-slate-500 font-bold">{stats.inactiveCompanies}</span> inativas / suspensas
            </div>
          </div>
          <div className="p-4 bg-brand-blue/10 rounded-2xl text-brand-blue">
            <Building2 className="w-6 h-6" />
          </div>
        </div>

        {/* Receita Prevista */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Receita Prevista (Funil)</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">
              {hasFinancialAccess ? `R$ ${stats.predictedRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : <NoAccess />}
            </h3>
            <div className="flex items-center gap-1 mt-2 text-slate-400 text-xs font-medium">
              <Briefcase className="w-3.5 h-3.5 text-brand-teal" />
              <span>Oportunidades em aberto</span>
            </div>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Receita Fechada */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Receita Fechada (Contratos)</span>
            <h3 className="text-2xl font-black text-brand-teal mt-1">
              {hasFinancialAccess ? `R$ ${stats.closedRevenue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : <NoAccess />}
            </h3>
            <div className="flex items-center gap-1 mt-2 text-brand-teal text-xs font-bold">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>Metas batidas</span>
            </div>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* Middle Grid - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Pipeline conversion SVG chart */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-slate-800 font-bold text-lg mb-1">Taxa de Conversão por Etapa</h4>
            <p className="text-slate-400 text-xs mb-6">Volume acumulado de negócios ativos por fase comercial.</p>
          </div>
          <div className="space-y-4">
            {pipelineConversion.map((stageItem) => (
              <div key={stageItem.stage} className="flex items-center gap-4">
                <span className="text-slate-500 text-xs font-medium w-36 truncate text-right">{stageItem.stage}</span>
                <div className="flex-1 bg-slate-50 h-5 rounded-full overflow-hidden border border-slate-100 relative">
                  <div 
                    className="h-full bg-gradient-to-r from-brand-blue to-brand-teal rounded-full transition-all duration-1000"
                    style={{ width: `${stageItem.percentage}%` }}
                  />
                  <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-600">
                    {stageItem.count} ({stageItem.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Service (Donut Chart in SVG) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div>
            <h4 className="text-slate-800 font-bold text-lg mb-1">Receita Fechada por Serviço</h4>
            <p className="text-slate-400 text-xs mb-6">Distribuição percentual do faturamento total em serviços.</p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 flex-1">
            {/* SVG Donut */}
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#f1f5f9"
                  strokeWidth="10"
                />
                {serviceRevenue.length === 0 ? (
                  <circle
                    cx="50"
                    cy="50"
                    r="40"
                    fill="transparent"
                    stroke="#cbd5e1"
                    strokeWidth="10"
                  />
                ) : (
                  (() => {
                    let accumulatedPercent = 0
                    return serviceRevenue.map((item, index) => {
                      const strokeDasharray = `${item.percentage} ${100 - item.percentage}`
                      const strokeDashoffset = 100 - accumulatedPercent
                      accumulatedPercent += item.percentage
                      return (
                        <circle
                          key={item.service}
                          cx="50"
                          cy="50"
                          r="40"
                          fill="transparent"
                          stroke={item.color}
                          strokeWidth="10"
                          strokeDasharray={strokeDasharray}
                          strokeDashoffset={strokeDashoffset}
                          pathLength="100"
                        />
                      )
                    })
                  })()
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Faturamento</span>
                <span className="text-slate-800 text-xs font-black">CrepaldiDH</span>
              </div>
            </div>

            {/* Legend */}
            <div className="space-y-2 flex-1 max-w-[200px]">
              {serviceRevenue.length === 0 ? (
                <div className="text-slate-400 text-xs text-center">Nenhum contrato ativo cadastrado.</div>
              ) : (
                serviceRevenue.slice(0, 5).map(item => (
                  <div key={item.service} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                      <span className="text-slate-600 font-medium truncate" title={item.service}>{item.service}</span>
                    </div>
                    <span className="text-slate-800 font-bold ml-2">{item.percentage}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Grid - Rankings and Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Ranking de Clientes (Top 5) */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-teal" />
              Ranking de Clientes (Faturamento)
            </h4>
          </div>
          <div className="flex-1 space-y-4">
            {customerRanking.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum dado financeiro fechado.</p>
            ) : (
              customerRanking.map((cust, idx) => (
                <div key={cust.id} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all border border-slate-100/50">
                  <div className="flex items-center gap-3">
                    <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                      idx === 0 ? 'bg-amber-400 text-white' : 
                      idx === 1 ? 'bg-slate-300 text-slate-700' :
                      idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {idx + 1}
                    </span>
                    <div>
                      <h5 className="text-slate-700 font-bold text-xs truncate max-w-[120px]">{cust.name}</h5>
                      <span className="text-[10px] text-slate-400">{cust.segment}</span>
                    </div>
                  </div>
                  <span className="text-xs font-black text-brand-blue">
                    {hasFinancialAccess ? `R$ ${cust.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : <NoAccess />}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Ranking de Vendedores */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-brand-blue" />
              Ranking Comercial (Equipe)
            </h4>
          </div>
          <div className="flex-1 space-y-4">
            {sellerRanking.map((seller, idx) => (
              <div key={seller.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-xl border border-slate-100/50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center text-xs">
                    {seller.avatar}
                  </div>
                  <div>
                    <h5 className="text-slate-700 font-bold text-xs">{seller.name}</h5>
                    <span className="text-[10px] text-slate-400">{seller.role}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-black text-brand-teal block">
                    {hasFinancialAccess ? `R$ ${seller.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : <NoAccess />}
                  </span>
                  <span className="text-[9px] text-slate-400 font-semibold uppercase">Fechado</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Proximas tarefas / Retornos de Follow-up */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <Calendar className="w-5 h-5 text-amber-500" />
              Próximos Follow-ups & Ações
            </h4>
          </div>
          <div className="flex-1 space-y-3">
            {upcomingTasks.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum follow-up pendente registrado.</p>
            ) : (
              upcomingTasks.map(task => (
                <div 
                  key={task.id} 
                  className={`p-3 rounded-xl border transition-all ${
                    task.isLate 
                      ? 'bg-red-50/40 border-red-100 text-red-700' 
                      : 'bg-slate-50/50 border-slate-100 text-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider">{task.companyName}</span>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase ${
                      task.priority === 'high' ? 'bg-red-100 text-red-700' :
                      task.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                  <h5 className="font-semibold text-xs mt-1 truncate" title={task.title}>{task.title}</h5>
                  <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 font-medium">
                    {task.isLate ? (
                      <span className="flex items-center gap-1 text-red-600 font-bold">
                        <AlertCircle className="w-3 h-3" />
                        Atrasado ({task.dueDate})
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" />
                        Vence: {task.dueDate}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
