'use client'

import React, { useMemo } from 'react'
import { useAssessoria } from '../context/AssessoriaContext'
import {
  ClipboardList, Target, Zap, BarChart3, Building2,
  AlertTriangle, Activity, FileSearch,
} from 'lucide-react'

const okrProgress = (okr: { keyResults: { meta: number; atual: number }[] }) => {
  const total = okr.keyResults.reduce((acc, kr) => acc + (kr.meta > 0 ? kr.atual / kr.meta : 0), 0)
  return okr.keyResults.length > 0 ? Math.round((total / okr.keyResults.length) * 100) : 0
}

export const AssessoriaDashboard: React.FC<{ onNavigate?: (tab: string) => void }> = ({ onNavigate }) => {
  const { diagnosticos, okrs, swots, planosAcao, kpis } = useAssessoria()

  const stats = useMemo(() => {
    const diagConcluidos = diagnosticos.filter(d => d.status === 'concluido').length
    const okrsAtivos = okrs.filter(o => o.status === 'ativo')
    const okrAvgProgress = okrsAtivos.length > 0
      ? Math.round(okrsAtivos.reduce((acc, o) => acc + okrProgress(o), 0) / okrsAtivos.length)
      : 0
    const planosAtivos = planosAcao.filter(p => p.status === 'ativo')
    const itensConcluidos = planosAcao.reduce((acc, p) => acc + (Array.isArray(p.itens) ? p.itens.filter(i => i.status === 'concluido').length : 0), 0)
    const itensTotal = planosAcao.reduce((acc, p) => acc + (Array.isArray(p.itens) ? p.itens.length : 0), 0)
    const itensPendentes = planosAcao.reduce((acc, p) => acc + (Array.isArray(p.itens) ? p.itens.filter(i => i.status === 'pendente' || i.status === 'andamento').length : 0), 0)
    const demandasVencidasCount = planosAcao.reduce((acc, p) => acc + (Array.isArray(p.itens) ? p.itens.filter(i => (i.status === 'pendente' || i.status === 'andamento') && i.prazo && new Date(i.prazo) < new Date()).length : 0), 0)
    const kpiAvgProgress = kpis.length > 0
      ? Math.round(kpis.reduce((acc, k) => acc + (k.meta > 0 ? Math.min(100, (k.atual / k.meta) * 100) : 0), 0) / kpis.length)
      : 0
    const empresas = new Set([
      ...diagnosticos.map(d => d.empresa),
      ...okrs.map(o => o.empresa),
      ...swots.map(s => s.empresa),
      ...planosAcao.map(p => p.empresa),
      ...kpis.map(k => k.empresa),
    ].filter(Boolean))

    return {
      diagConcluidos, okrsAtivosCount: okrsAtivos.length, okrAvgProgress,
      planosAtivosCount: planosAtivos.length,       itensConcluidos, itensTotal, itensPendentes, demandasVencidasCount,
      kpiAvgProgress, empresasCount: empresas.size,
    }
  }, [diagnosticos, okrs, swots, planosAcao, kpis])

  const diagnosByEmpresa = useMemo(() => {
    const map: Record<string, number[]> = {}
    diagnosticos.forEach(d => {
      if (!d.empresa) return
      if (!map[d.empresa]) map[d.empresa] = []
      map[d.empresa].push(d.pontuacaoGeral)
    })
    const rows = Object.entries(map).map(([empresa, scores]) => ({
      empresa,
      score: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
      count: scores.length,
    }))
    const maxVal = Math.max(...rows.map(r => r.score), 1)
    return rows.map(r => ({ ...r, percentage: Math.round((r.score / maxVal) * 100) })).sort((a, b) => b.score - a.score)
  }, [diagnosticos])

  const topOkrs = useMemo(() => {
    return okrs
      .map(o => ({ ...o, progress: okrProgress(o) }))
      .sort((a, b) => b.progress - a.progress)
      .slice(0, 5)
  }, [okrs])

  const atRiskKpis = useMemo(() => {
    return kpis
      .map(k => ({ ...k, progress: k.meta > 0 ? Math.min(100, Math.round((k.atual / k.meta) * 100)) : 0 }))
      .filter(k => k.progress < 50)
      .sort((a, b) => a.progress - b.progress)
      .slice(0, 5)
  }, [kpis])

  const planosAndamento = useMemo(() => {
    return planosAcao
      .filter(p => p.status === 'ativo')
      .flatMap(p => (Array.isArray(p.itens) ? p.itens : [])
        .filter(i => i.status === 'andamento' || i.status === 'pendente')
        .map(i => ({ ...i, plano: p.titulo, empresa: p.empresa })))
      .slice(0, 6)
  }, [planosAcao])

  const demandasVencidas = useMemo(() => {
    return planosAcao
      .filter(p => p.status === 'ativo')
      .flatMap(p => (Array.isArray(p.itens) ? p.itens : [])
        .filter(i => (i.status === 'andamento' || i.status === 'pendente') && i.prazo && new Date(i.prazo) < new Date())
        .map(i => ({ ...i, plano: p.titulo, empresa: p.empresa })))
      .sort((a, b) => new Date(a.prazo).getTime() - new Date(b.prazo).getTime())
      .slice(0, 6)
  }, [planosAcao])

  const recentes = useMemo(() =>
    [...diagnosticos].sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime()).slice(0, 5),
  [diagnosticos])

  const kpiCards = [
    { label: 'Diagnósticos Realizados', value: diagnosticos.length, hint: `${stats.diagConcluidos} concluído(s)`, icon: ClipboardList, iconCls: 'bg-brand-teal/10 text-brand-teal', hintCls: 'text-brand-teal font-bold', tab: 'diagnosticos' },
    { label: 'OKRs Ativos', value: stats.okrsAtivosCount, hint: `${stats.okrAvgProgress}% progresso médio`, icon: Target, iconCls: 'bg-brand-blue/10 text-brand-blue', hintCls: 'text-slate-400', tab: 'okr' },
    { label: 'Planos de Ação Ativos', value: stats.planosAtivosCount, hint: `${stats.itensConcluidos}/${stats.itensTotal} itens concluídos`, icon: Zap, iconCls: 'bg-amber-500/10 text-amber-500', hintCls: 'text-slate-400', tab: 'plano_acao' },
    { label: 'Demandas/Prazos', value: stats.itensPendentes, hint: `${stats.demandasVencidasCount} vencida(s)`, icon: ClipboardList, iconCls: 'bg-red-500/10 text-red-500', hintCls: 'text-red-600 font-bold', tab: 'plano_acao' },
    { label: 'Indicadores (KPI)', value: kpis.length, hint: `${stats.kpiAvgProgress}% progresso médio`, icon: BarChart3, iconCls: 'bg-blue-500/10 text-blue-500', hintCls: 'text-slate-400', tab: 'kpi' },
    { label: 'Empresas Assessoradas', value: stats.empresasCount, hint: 'clientes com atividade', icon: Building2, iconCls: 'bg-emerald-500/10 text-emerald-500', hintCls: 'text-slate-400', tab: 'diagnosticos' },
  ]

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Upper Grid - KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {kpiCards.map(card => (
          <div key={card.label} onClick={() => onNavigate?.(card.tab)} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between cursor-pointer hover:border-slate-300 hover:shadow-md transition-all">
            <div>
              <span className="text-slate-400 text-xs font-semibold uppercase tracking-wider">{card.label}</span>
              <h3 className="text-3xl font-bold text-slate-800 mt-1">{card.value}</h3>
              <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${card.hintCls}`}>
                <Activity className="w-3.5 h-3.5" />
                <span>{card.hint}</span>
              </div>
            </div>
            <div className={`p-4 rounded-2xl ${card.iconCls}`}>
              <card.icon className="w-6 h-6" />
            </div>
          </div>
        ))}
      </div>

      {/* Middle Grid - Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Diagnóstico score by company */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h4 className="text-slate-800 font-bold text-lg mb-1">Pontuação de Diagnóstico por Empresa</h4>
            <p className="text-slate-400 text-xs mb-6">Média do índice geral de saúde organizacional.</p>
          </div>
          <div className="space-y-4">
            {diagnosByEmpresa.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum diagnóstico registrado.</p>
            ) : diagnosByEmpresa.map(item => (
              <div key={item.empresa} className="flex items-center gap-4">
                <span className="text-slate-500 text-xs font-medium w-36 truncate text-right">{item.empresa}</span>
                <div className="flex-1 bg-slate-50 h-5 rounded-full overflow-hidden border border-slate-100 relative">
                  <div className="h-full bg-gradient-to-r from-brand-blue to-brand-teal rounded-full transition-all duration-1000" style={{ width: `${item.percentage}%` }} />
                  <span className="absolute inset-y-0 right-3 flex items-center text-[10px] font-bold text-slate-600">
                    {item.score}% ({item.count})
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* OKR progress overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col">
          <div>
            <h4 className="text-slate-800 font-bold text-lg mb-1">Progresso de OKRs</h4>
            <p className="text-slate-400 text-xs mb-6">Top OKRs por avanço das key results.</p>
          </div>
          <div className="flex-1 space-y-4">
            {topOkrs.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum OKR registrado.</p>
            ) : topOkrs.map(o => (
              <div key={o.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 text-xs font-semibold truncate max-w-[240px]" title={o.objetivo}>{o.objetivo}</span>
                  <span className="text-xs font-black text-brand-teal">{o.progress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${o.progress >= 80 ? 'bg-emerald-500' : o.progress >= 50 ? 'bg-brand-teal' : 'bg-amber-500'}`}
                    style={{ width: `${o.progress}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Grid - Rankings and Attention lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Planos de ação em andamento */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            Ações Pendentes/Em Andamento
          </h4>
          {demandasVencidas.length > 0 && (
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-50 text-red-700 border border-red-100">{demandasVencidas.length} vencida(s)</span>
          )}
        </div>
        <div className="flex-1 space-y-3">
          {planosAndamento.length === 0 ? (
            <p className="text-slate-400 text-xs py-8 text-center">Nenhuma ação pendente registrada.</p>
          ) : planosAndamento.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl">
              <div className="min-w-0">
                <h5 className="text-slate-700 font-bold text-xs truncate" title={item.acao}>{item.acao}</h5>
                <span className="text-[10px] text-slate-400">{item.plano} • {item.empresa} · vence {item.prazo || 'sem prazo'}</span>
              </div>
              <span className={`flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase ${
                item.status === 'andamento' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
              }`}>{item.status === 'andamento' ? 'Em andamento' : 'Pendente'}</span>
            </div>
          ))}
        </div>
      </div>

        {/* KPIs em risco */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Indicadores em Risco
            </h4>
          </div>
          <div className="flex-1 space-y-4">
            {atRiskKpis.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum indicador abaixo da meta.</p>
            ) : atRiskKpis.map(k => (
              <div key={k.id}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-slate-600 text-xs font-semibold truncate max-w-[180px]" title={k.nome}>{k.nome}</span>
                  <span className="text-xs font-black text-red-500">{k.atual}/{k.meta}{k.unidade}</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${k.progress}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Diagnósticos recentes */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-brand-blue" />
              Diagnósticos Recentes
            </h4>
          </div>
          <div className="flex-1 space-y-3">
            {recentes.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhum diagnóstico registrado.</p>
            ) : recentes.map(d => (
              <div key={d.id} className="flex items-center justify-between p-3 bg-slate-50/50 border border-slate-100/50 rounded-xl">
                <div className="min-w-0">
                  <h5 className="text-slate-700 font-bold text-xs truncate" title={d.titulo}>{d.titulo}</h5>
                  <span className="text-[10px] text-slate-400">{d.empresa} • {new Date(d.dataCriacao).toLocaleDateString('pt-BR')}</span>
                </div>
                <span className={`flex-shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${
                  d.pontuacaoGeral >= 70 ? 'bg-emerald-50 text-emerald-700' : d.pontuacaoGeral >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                }`}>{d.pontuacaoGeral}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ações vencidas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-slate-800 font-bold text-base flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              Demandas Vencidas
            </h4>
          </div>
          <div className="flex-1 space-y-3">
            {demandasVencidas.length === 0 ? (
              <p className="text-slate-400 text-xs py-8 text-center">Nenhuma demanda vencida.</p>
            ) : demandasVencidas.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-red-50/50 border border-red-100/50 rounded-xl">
                <div className="min-w-0">
                  <h5 className="text-slate-700 font-bold text-xs truncate" title={item.acao}>{item.acao}</h5>
                  <span className="text-[10px] text-slate-600">{item.plano} • {item.empresa} · vence {new Date(item.prazo).toLocaleDateString('pt-BR')}</span>
                </div>
                <span className="flex-shrink-0 px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase bg-red-100 text-red-700">Vencida</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}