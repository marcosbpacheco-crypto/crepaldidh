'use client'

import React, { useMemo } from 'react'
import { useCrm } from '../context/CrmContext'
import { TrendingUp, Calendar, Target, DollarSign, Building2, Clock, Award } from 'lucide-react'

const FUTURE_STAGE = 'Interesse Futuro'

function periodLabel(dueDate: string): string {
  const now = new Date()
  const d = new Date(dueDate)
  const diffMonths = (d.getFullYear() - now.getFullYear()) * 12 + (d.getMonth() - now.getMonth())
  if (diffMonths <= 0) return 'Este mês'
  if (diffMonths <= 3) return 'Próximos 3 meses'
  if (diffMonths <= 6) return 'Próximos 6 meses'
  return 'Mais de 6 meses'
}

const PERIOD_ORDER = ['Este mês', 'Próximos 3 meses', 'Próximos 6 meses', 'Mais de 6 meses']

export const CrmConversion: React.FC = () => {
  const { deals, companies } = useCrm()

  // Negócios no estágio "Interesse Futuro": empresa quer os serviços, mas só fecha depois
  const futureInterest = useMemo(
    () => deals
      .filter(d => d.stage === FUTURE_STAGE)
      .map(d => ({
        ...d,
        companyName: companies.find(c => c.id === d.companyId)?.tradeName || 'Empresa',
        period: d.dueDate ? periodLabel(d.dueDate) : 'Sem data prevista',
      }))
      .sort((a, b) => {
        if (!a.dueDate) return 1
        if (!b.dueDate) return -1
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
      }),
    [deals, companies],
  )

  // Projeção: empresas com 'dueDate' no futuro (fora do estágio de interesse futuro)
  const futureOpportunities = useMemo(
    () => deals
      .filter(d => d.stage !== 'Cliente perdido' && d.stage !== FUTURE_STAGE && d.dueDate && new Date(d.dueDate) > new Date())
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .map(d => ({
        ...d,
        companyName: companies.find(c => c.id === d.companyId)?.tradeName || 'Empresa',
      })),
    [deals, companies],
  )

  const totalValue = futureInterest.reduce((sum, d) => sum + (d.value || 0), 0)

  // Receita potencial por serviço (donut)
  const serviceRevenue = useMemo(() => {
    const revenueMap: Record<string, number> = {}
    futureInterest.forEach(d => { revenueMap[d.service] = (revenueMap[d.service] || 0) + (d.value || 0) })
    const total = Object.values(revenueMap).reduce((sum, v) => sum + v, 0) || 1
    const colors = ['#2db2a5', '#1b3d52', '#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#6366f1', '#ef4444', '#6b7280']
    return Object.entries(revenueMap)
      .map(([service, value], idx) => ({ service, value, percentage: Math.round((value / total) * 100), color: colors[idx % colors.length] }))
      .sort((a, b) => b.value - a.value)
  }, [futureInterest])

  // Distribuição por período previsto
  const periodBreakdown = useMemo(() => {
    const map: Record<string, number> = {}
    futureInterest.forEach(d => { map[d.period] = (map[d.period] || 0) + 1 })
    const max = Math.max(...Object.values(map), 1)
    return PERIOD_ORDER
      .filter(p => map[p])
      .map(p => ({ period: p, count: map[p], value: futureInterest.filter(d => d.period === p).reduce((s, d) => s + (d.value || 0), 0), percentage: Math.round((map[p] / max) * 100) }))
  }, [futureInterest])

  // Ranking de empresas por valor estimado
  const companyRanking = useMemo(() => {
    const map: Record<string, { name: string; value: number }> = {}
    futureInterest.forEach(d => {
      if (!map[d.companyId]) map[d.companyId] = { name: d.companyName, value: 0 }
      map[d.companyId].value += d.value || 0
    })
    return Object.entries(map)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
  }, [futureInterest])

  const uniqueServices = useMemo(() => new Set(futureInterest.map(d => d.service).filter(Boolean)).size, [futureInterest])
  const soonBucket = futureInterest.filter(d => d.period === 'Este mês' || d.period === 'Próximos 3 meses')

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-brand-teal" />
          Conversão & Interesse Futuro
        </h3>
        <p className="text-slate-400 text-xs">Empresas que demonstraram interesse nos serviços da CrepaldiDH, mas pretendem fechar apenas em data futura, além da projeção de conversão com fechamento previsto.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Interesse Futuro</span>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{futureInterest.length}</h3>
            <div className="text-slate-400 text-xs font-medium mt-2">
              <span className="text-brand-teal font-bold">{uniqueServices}</span> serviço(s) pretendido(s)
            </div>
          </div>
          <div className="p-4 bg-brand-teal/10 rounded-2xl text-brand-teal">
            <Target className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Receita Potencial</span>
            <h3 className="text-2xl font-black text-slate-800 mt-1">R$ {totalValue.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</h3>
            <div className="flex items-center gap-1 mt-2 text-slate-400 text-xs font-medium">
              <DollarSign className="w-3.5 h-3.5 text-brand-teal" />
              <span>Valor estimado total</span>
            </div>
          </div>
          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Fechamento até 3 Meses</span>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{soonBucket.length}</h3>
            <div className="text-slate-400 text-xs font-medium mt-2">
              <span className="text-emerald-600 font-bold">R$ {soonBucket.reduce((s, d) => s + (d.value || 0), 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span> previstos
            </div>
          </div>
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Empresas na Base</span>
            <h3 className="text-3xl font-bold text-slate-800 mt-1">{companyRanking.length}</h3>
            <div className="text-slate-400 text-xs font-medium mt-2">
              <span className="text-slate-500 font-bold">{futureInterest.length}</span> oportunidades registradas
            </div>
          </div>
          <div className="p-4 bg-brand-blue/10 rounded-2xl text-brand-blue">
            <Building2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Donut: Receita por serviço */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div>
            <h4 className="text-slate-800 font-bold text-lg mb-1">Receita Potencial por Serviço</h4>
            <p className="text-slate-400 text-xs mb-6">Distribuição do valor estimado dos interesses futuros por serviço.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6 flex-1">
            <div className="relative w-40 h-40">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="transparent" stroke="#f1f5f9" strokeWidth="10" />
                {serviceRevenue.length === 0 ? (
                  <circle cx="50" cy="50" r="40" fill="transparent" stroke="#cbd5e1" strokeWidth="10" />
                ) : (() => {
                  let accumulated = 0
                  return serviceRevenue.map(item => {
                    const offset = 100 - accumulated
                    accumulated += item.percentage
                    return (
                      <circle key={item.service} cx="50" cy="50" r="40" fill="transparent"
                        stroke={item.color} strokeWidth="10"
                        strokeDasharray={`${item.percentage} ${100 - item.percentage}`}
                        strokeDashoffset={offset} pathLength="100" />
                    )
                  })
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">Potencial</span>
                <span className="text-slate-800 text-xs font-black">Futuro</span>
              </div>
            </div>
            <div className="space-y-2 flex-1 max-w-[220px]">
              {serviceRevenue.length === 0 ? (
                <div className="text-slate-400 text-xs text-center">Nenhum interesse futuro registrado.</div>
              ) : serviceRevenue.slice(0, 5).map(item => (
                <div key={item.service} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-slate-600 font-medium truncate" title={item.service}>{item.service}</span>
                  </div>
                  <span className="text-slate-800 font-bold ml-2">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Distribuição por período previsto */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-slate-800 font-bold text-lg mb-1">Distribuição por Período Previsto</h4>
            <p className="text-slate-400 text-xs mb-6">Quando as empresas pretendem fechar o serviço, a partir do follow-up previsto (dueDate).</p>
          </div>
          <div className="space-y-4">
            {periodBreakdown.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum interesse futuro com data prevista.</p>
            ) : periodBreakdown.map(p => (
              <div key={p.period} className="flex items-center gap-4">
                <span className="text-slate-500 text-xs font-medium w-36 truncate text-right">{p.period}</span>
                <div className="flex-1 bg-slate-50 h-5 rounded-full overflow-hidden border border-slate-100 relative">
                  <div className="h-full bg-gradient-to-r from-brand-blue to-brand-teal rounded-full transition-all duration-1000" style={{ width: `${p.percentage}%` }} />
                  <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-600">
                    {p.count} · R$ {p.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Ranking + Lista */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Ranking de empresas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <Award className="w-5 h-5 text-brand-teal" />
              Ranking de Interesse Futuro
            </h4>
          </div>
          <div className="flex-1 space-y-4">
            {companyRanking.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum dado de interesse futuro.</p>
            ) : companyRanking.map((c, idx) => (
              <div key={c.id} className="flex items-center justify-between p-3 bg-slate-50/50 hover:bg-slate-50 rounded-xl transition-all border border-slate-100/50">
                <div className="flex items-center gap-3">
                  <span className={`w-6 h-6 flex items-center justify-center rounded-full text-xs font-black ${
                    idx === 0 ? 'bg-amber-400 text-white' : idx === 1 ? 'bg-slate-300 text-slate-700' : idx === 2 ? 'bg-amber-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}>{idx + 1}</span>
                  <h5 className="text-slate-700 font-bold text-xs truncate max-w-[140px]">{c.name}</h5>
                </div>
                <span className="text-xs font-black text-brand-blue">R$ {c.value.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Oportunidades com interesse futuro */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-blue" />
              Oportunidades com Interesse Futuro
            </h4>
            <span className="text-[10px] text-slate-400">{futureInterest.length} registro(s)</span>
          </div>
          <div className="flex-1 space-y-3">
            {futureInterest.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhuma oportunidade no estágio "Interesse Futuro". Mova negócios para esse estágio no funil para acompanhar empresas que só fecharão no futuro.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {futureInterest.map(deal => (
                  <div key={deal.id} className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{deal.companyName}</span>
                      <span className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">{deal.service}</span>
                    </div>
                    <h5 className="font-bold text-sm text-slate-800 mb-1">{deal.title}</h5>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                      <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {deal.dueDate ? new Date(deal.dueDate).toLocaleDateString('pt-BR') : 'Sem data'}</span>
                      <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {deal.period}</span>
                    </div>
                    <div className="mt-2 text-sm font-black text-brand-blue">R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Projeção de conversão futura */}
      <div className="space-y-4">
        <h4 className="text-slate-800 font-bold text-base mb-2">Projeção de Conversão Futura</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {futureOpportunities.map(deal => (
            <div key={deal.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
              <div className="flex justify-between items-start mb-3">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{deal.companyName}</span>
                <span className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">{deal.stage}</span>
              </div>
              <h4 className="font-bold text-sm text-slate-800 mb-1">{deal.title}</h4>
              <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                <Calendar className="w-3.5 h-3.5" />
                <span>Fechamento: {new Date(deal.dueDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="mt-3 text-sm font-black text-brand-blue">
                R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          ))}
          {futureOpportunities.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400 text-sm">Nenhuma oportunidade futura encontrada.</div>
          )}
        </div>
      </div>
    </div>
  )
}