'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { useCrm, Deal } from '../context/CrmContext'
import { commercialAssistantService } from '@/services/commercialAssistantService'
import type { LeadScoreResult, RiskAlert, NextAction, SimulateResult, ExecutiveDossier, DashboardData, TimelineEvent } from '@/types/commercial-assistant'
import {
  Sparkles, Mail, Target, Award, Brain, RefreshCw,
  Copy, Check, FileText, ChevronRight, MessageSquare, AlertCircle,
  TrendingUp, BarChart3, Clock, DollarSign, Shield, Zap,
  Activity, CalendarDays, Play, Settings, Server, Cpu, Loader2
} from 'lucide-react'

const generateFakeEmail = (tone: string, compName: string, contactName: string, service: string, value: number) => {
  const formattedValue = value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  switch (tone) {
    case 'persuasive':
      return `Olá, ${contactName}.\n\nEspero que esteja tudo bem na ${compName}.\n\nAcompanhando o nosso diagnóstico recente sobre a área de saúde organizacional, identificamos uma oportunidade excelente para iniciarmos o projeto de ${service}.\n\nAo estruturarmos essa parceria, conseguiremos reduzir substancialmente os riscos de afastamentos e maximizar a produtividade do time, retornando o investimento de R$ ${formattedValue} logo no primeiro semestre.\n\nPodemos falar brevemente amanhã às 14h para definirmos o cronograma?\n\nAtenciosamente,\nEquipe CrepaldiDH`
    case 'informal':
      return `Oi, ${contactName}! Tudo bem?\n\nPassando aqui para dar um alô e ver como estão as coisas na ${compName}.\n\nConseguiu dar uma olhada na nossa proposta de ${service} que te enviei? Queria saber se ficou com alguma dúvida sobre o escopo ou se faz sentido marcarmos um bate-papo rápido para ajustar o que for preciso.\n\nFico no seu aguardo!\n\nAbraços,\nEquipe CrepaldiDH`
    case 'urgent':
      return `Prezada ${contactName},\n\nGostaria de avisar que as condições especiais da proposta de ${service} apresentadas para a ${compName} expiram nesta semana.\n\nComo o valor proposto (R$ ${formattedValue}) está com bonificação especial de lançamento corporativo, recomendamos a formalização para garantir o início das dinâmicas in-company ainda este mês.\n\nPodemos assinar o contrato amanhã?\n\nNo aguardo,\nEquipe CrepaldiDH`
    default:
      return `Prezado(a) ${contactName},\n\nEm continuidade à nossa conversa comercial a respeito das soluções em desenvolvimento humano para a ${compName}, enviamos em anexo os detalhes do escopo para ${service}.\n\nEstamos convictos de que a metodologia CrepaldiDH agregará grande valor estratégico aos seus líderes e colaboradores, otimizando os índices de engajamento interno.\n\nFicamos à disposição para agendarmos uma conferência de alinhamento.\n\nCordialmente,\nBruno Crepaldi\nDiretor Comercial | CrepaldiDH`
  }
}

const PIPELINE_STAGES = ['Lead novo', 'Primeiro contato', 'Reunião agendada', 'Diagnóstico realizado', 'Proposta enviada', 'Negociação', 'Contrato aprovado', 'Implantação', 'Cliente ativo', 'Cliente perdido']

export const CrmAIHelper: React.FC = () => {
  const { deals, companies, contacts, activities } = useCrm()

  type ToolId = 'scoring' | 'email' | 'dossier' | 'timeline' | 'simulator' | 'dashboard' | 'ai-arch'
  const [activeTool, setActiveTool] = useState<ToolId>('scoring')

  // --- Tool 1: Lead Scoring ---
  const [selectedDealId, setSelectedDealId] = useState<string>('')
  const [scoreResult, setScoreResult] = useState<LeadScoreResult | null>(null)
  const [scoreLoading, setScoreLoading] = useState(false)
  const [scoreError, setScoreError] = useState('')

  useEffect(() => {
    if (deals.length > 0 && !selectedDealId) setSelectedDealId(deals[0].id)
  }, [deals, selectedDealId])

  const fetchScore = useCallback(async () => {
    if (!selectedDealId) return
    setScoreLoading(true)
    setScoreError('')
    try {
      const result = await commercialAssistantService.getLeadScore(selectedDealId)
      setScoreResult(result)
    } catch (err: any) {
      setScoreError(err.message || 'Erro ao calcular score')
    } finally {
      setScoreLoading(false)
    }
  }, [selectedDealId])

  useEffect(() => { fetchScore() }, [fetchScore])

  // --- Tool 2: Email Generator ---
  const [emailDealId, setEmailDealId] = useState<string>('')
  const [emailTone, setEmailTone] = useState<string>('formal')
  const [generatedEmail, setGeneratedEmail] = useState<string>('')
  const [isCopied, setIsCopied] = useState(false)

  useEffect(() => {
    if (deals.length > 0 && !emailDealId) setEmailDealId(deals[0].id)
  }, [deals, emailDealId])

  const handleGenerateEmail = () => {
    const deal = deals.find(d => d.id === emailDealId)
    if (!deal) return
    const comp = companies.find(c => c.id === deal.companyId)
    const firstContact = contacts.find(c => c.companyId === deal.companyId)
    const email = generateFakeEmail(emailTone, comp ? comp.tradeName : 'Empresa', firstContact ? firstContact.name : 'Responsável', deal.service, deal.value)
    setGeneratedEmail(email)
    setIsCopied(false)
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  // --- Tool 3: Dossier ---
  const [dossierCompanyId, setDossierCompanyId] = useState<string>('')
  const [dossierResult, setDossierResult] = useState<ExecutiveDossier | null>(null)
  const [dossierLoading, setDossierLoading] = useState(false)
  const [dossierError, setDossierError] = useState('')

  useEffect(() => {
    if (companies.length > 0 && !dossierCompanyId) setDossierCompanyId(companies[0].id)
  }, [companies, dossierCompanyId])

  const handleGenerateDossier = useCallback(async () => {
    if (!dossierCompanyId) return
    setDossierLoading(true)
    setDossierError('')
    try {
      const result = await commercialAssistantService.getDossier(dossierCompanyId)
      setDossierResult(result)
    } catch (err: any) {
      setDossierError(err.message || 'Erro ao gerar dossiê')
    } finally {
      setDossierLoading(false)
    }
  }, [dossierCompanyId])

  // --- Tool 4: Timeline ---
  const [timelineDealId, setTimelineDealId] = useState<string>('')
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([])
  const [timelineLoading, setTimelineLoading] = useState(false)
  const [timelineError, setTimelineError] = useState('')

  useEffect(() => {
    if (deals.length > 0 && !timelineDealId) setTimelineDealId(deals[0].id)
  }, [deals, timelineDealId])

  const fetchTimeline = useCallback(async () => {
    if (!timelineDealId) return
    setTimelineLoading(true)
    setTimelineError('')
    try {
      const events = await commercialAssistantService.getTimeline(timelineDealId)
      setTimelineEvents(events)
    } catch (err: any) {
      setTimelineError(err.message || 'Erro ao carregar timeline')
    } finally {
      setTimelineLoading(false)
    }
  }, [timelineDealId])

  useEffect(() => { fetchTimeline() }, [fetchTimeline])

  // --- Tool 5: Simulator ---
  const [simDealId, setSimDealId] = useState<string>('')
  const [simStage, setSimStage] = useState('')
  const [simValue, setSimValue] = useState<number>(0)
  const [simResult, setSimResult] = useState<SimulateResult | null>(null)
  const [simLoading, setSimLoading] = useState(false)
  const [simError, setSimError] = useState('')

  useEffect(() => {
    if (deals.length > 0 && !simDealId) {
      setSimDealId(deals[0].id)
      setSimStage(deals[0].stage)
      setSimValue(deals[0].value)
    }
  }, [deals, simDealId])

  useEffect(() => {
    const deal = deals.find(d => d.id === simDealId)
    if (deal) { setSimStage(deal.stage); setSimValue(deal.value) }
  }, [simDealId, deals])

  const handleSimulate = useCallback(async () => {
    if (!simDealId) return
    setSimLoading(true)
    setSimError('')
    try {
      const changes: Record<string, any> = {}
      const deal = deals.find(d => d.id === simDealId)
      if (deal) {
        if (simStage !== deal.stage) changes.stage = simStage
        if (simValue !== deal.value) changes.value = simValue
      }
      if (Object.keys(changes).length === 0) { setSimError('Altere ao menos um campo para simular.'); setSimLoading(false); return }
      const result = await commercialAssistantService.simulate(simDealId, changes)
      setSimResult(result)
    } catch (err: any) {
      setSimError(err.message || 'Erro na simulação')
    } finally {
      setSimLoading(false)
    }
  }, [simDealId, simStage, simValue, deals])

  // --- Tool 6: Dashboard ---
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [dashboardLoading, setDashboardLoading] = useState(false)
  const [dashboardError, setDashboardError] = useState('')

  const fetchDashboard = useCallback(async () => {
    setDashboardLoading(true)
    setDashboardError('')
    try {
      const data = await commercialAssistantService.getDashboard()
      setDashboardData(data)
    } catch (err: any) {
      setDashboardError(err.message || 'Erro ao carregar dashboard')
    } finally {
      setDashboardLoading(false)
    }
  }, [])

  useEffect(() => { if (activeTool === 'dashboard') fetchDashboard() }, [activeTool, fetchDashboard])

  // --- Tool 7: AI Architecture (static info) ---

  const menuItems = [
    { id: 'scoring' as ToolId, label: 'Lead Scoring IA', icon: <Target className="w-4 h-4" />, desc: 'Previsibilidade de fechamento' },
    { id: 'email' as ToolId, label: 'Gerador de E-mails', icon: <Mail className="w-4 h-4" />, desc: 'Follow-ups inteligentes' },
    { id: 'dossier' as ToolId, label: 'Dossiê do Cliente', icon: <FileText className="w-4 h-4" />, desc: 'Resumo executivo consolidado' },
    { id: 'timeline' as ToolId, label: 'Linha do Tempo', icon: <Activity className="w-4 h-4" />, desc: 'Jornada do negócio' },
    { id: 'simulator' as ToolId, label: 'Simulador What-If', icon: <Zap className="w-4 h-4" />, desc: 'Cenários hipotéticos' },
    { id: 'dashboard' as ToolId, label: 'Dashboard Executivo', icon: <BarChart3 className="w-4 h-4" />, desc: 'KPIs do pipeline' },
    { id: 'ai-arch' as ToolId, label: 'Arq. Conversacional', icon: <Server className="w-4 h-4" />, desc: 'Arquitetura GPT' },
  ]

  const renderDossierContent = () => {
    if (!dossierCompanyId) return <div className="text-slate-400 text-xs py-8">Selecione uma empresa.</div>
    if (dossierLoading) return <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-teal" /></div>
    if (dossierError) return <div className="text-red-500 text-xs py-4">{dossierError}</div>
    if (!dossierResult) return <div className="text-slate-400 text-xs py-8">Clique em "Gerar Dossiê" para iniciar.</div>

    return (
      <div className="space-y-6 pt-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Segmento</span><span className="text-xs font-bold text-slate-700">{dossierResult.segment || '-'}</span></div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Colaboradores</span><span className="text-xs font-bold text-slate-700">{dossierResult.employees}</span></div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Contatos</span><span className="text-xs font-bold text-slate-700">{dossierResult.contacts.length}</span></div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Último contato</span><span className="text-xs font-bold text-slate-700">{dossierResult.lastContactDays > 90 ? '90+ dias' : `${dossierResult.lastContactDays} dias`}</span></div>
        </div>

        <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
          <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Resumo Executivo</h4>
          <p className="text-xs text-slate-700 leading-relaxed">{dossierResult.summary}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <h5 className="text-emerald-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1 mb-2"><Check className="w-3.5 h-3.5" />Oportunidades</h5>
            <ul className="space-y-1.5 text-xs text-slate-600">{dossierResult.strengths.map((s, i) => <li key={i} className="flex items-start gap-1"><ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" /><span>{s}</span></li>)}</ul>
          </div>
          <div>
            <h5 className="text-amber-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1 mb-2"><AlertCircle className="w-3.5 h-3.5" />Atenção</h5>
            <ul className="space-y-1.5 text-xs text-slate-600">{dossierResult.risks.map((r, i) => <li key={i} className="flex items-start gap-1"><ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" /><span>{r}</span></li>)}</ul>
          </div>
        </div>

        <div className="bg-brand-blue/5 border border-brand-blue/15 p-4 rounded-xl">
          <h4 className="text-[10px] text-brand-blue font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1"><Sparkles className="w-3.5 h-3.5 text-brand-teal" />Ação Recomendada (Next Best Action)</h4>
          <p className="text-xs text-slate-700 font-bold">{dossierResult.nextStep}</p>
        </div>

        {dossierResult.activeDeals.length > 0 && (
          <div>
            <h5 className="text-slate-700 font-bold text-xs uppercase tracking-wider mb-2">Negócios Ativos</h5>
            {dossierResult.activeDeals.map((d, i) => (
              <div key={i} className="flex items-center justify-between bg-white border border-slate-100 p-2.5 rounded-xl mb-1.5">
                <span className="text-xs font-semibold text-slate-700">{d.title}</span>
                <div className="flex items-center gap-3"><span className="text-[11px] text-brand-teal font-bold">R$ {d.value.toLocaleString('pt-BR')}</span><span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded text-slate-500">{d.stage}</span></div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-fade-in">
      {/* LEFT PANEL */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col p-4 space-y-1 h-full overflow-y-auto">
        <div className="p-2 flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-brand-teal" />
          <div>
            <h4 className="text-slate-800 font-black text-sm">Assistente IA</h4>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Comercial Inteligente</span>
          </div>
        </div>
        {menuItems.map(tool => (
          <button key={tool.id} onClick={() => setActiveTool(tool.id)} className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${activeTool === tool.id ? 'bg-brand-blue border-brand-blue text-white shadow-md shadow-brand-blue/10 scale-[1.01]' : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'}`}>
            <div className={`p-2 rounded-lg ${activeTool === tool.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>{tool.icon}</div>
            <div><span className="font-bold text-xs block">{tool.label}</span><span className={`text-[10px] block mt-0.5 ${activeTool === tool.id ? 'text-white/70' : 'text-slate-400'}`}>{tool.desc}</span></div>
          </button>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
        <div className="p-6 flex flex-col h-full overflow-y-auto space-y-6">
          {/* TOOL 1: Lead Scoring */}
          {activeTool === 'scoring' && (
            <>
              <div>
                <h3 className="text-slate-800 font-black text-lg flex items-center gap-2"><Target className="w-5 h-5 text-brand-teal" />Análise de Previsibilidade de Fechamento</h3>
                <p className="text-slate-400 text-xs mt-1">IA calcula probabilidade, confiança, prazo estimado e receita projetada com base em dados reais do CRM.</p>
              </div>

              <div className="max-w-md flex items-end gap-3">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione o Negócio</label>
                  <select value={selectedDealId} onChange={e => { setSelectedDealId(e.target.value); setScoreResult(null) }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs">
                    <option value="">Selecione...</option>
                    {deals.map(d => <option key={d.id} value={d.id}>{d.title} (R$ {d.value.toLocaleString()})</option>)}
                  </select>
                </div>
              </div>

              {scoreLoading && <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-teal" /></div>}
              {scoreError && <div className="text-red-500 text-xs py-4">{scoreError}</div>}

              {scoreResult && !scoreLoading && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* Score Dial */}
                    <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score do Lead</span>
                      <div className="relative w-36 h-36 mt-4">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="transparent" stroke="#e2e8f0" strokeWidth="8" />
                          <circle cx="50" cy="50" r="42" fill="transparent" stroke="url(#tealGradient)" strokeWidth="8" strokeDasharray="263" strokeDashoffset={263 - (263 * scoreResult.score) / 100} strokeLinecap="round" />
                          <defs><linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#1b3d52" /><stop offset="100%" stopColor="#2db2a5" /></linearGradient></defs>
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-3xl font-black text-slate-800">{scoreResult.score}%</span>
                          <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">Probabilidade</span>
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mt-6">
                        {scoreResult.score > 70 ? 'Alta probabilidade de conversão.' : scoreResult.score > 40 ? 'Média probabilidade — requer atenção.' : 'Baixa probabilidade — ação necessária.'}
                      </p>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white border border-slate-100 p-4 rounded-xl"><span className="text-[10px] text-slate-400 font-bold uppercase block">Confiança</span><span className="text-xl font-black text-slate-800 mt-1 block">{scoreResult.confidence}%</span><span className="text-[10px] text-slate-400">da previsão</span></div>
                      <div className="bg-white border border-slate-100 p-4 rounded-xl"><span className="text-[10px] text-slate-400 font-bold uppercase block">Prazo Estimado</span><span className="text-xl font-black text-slate-800 mt-1 block">{scoreResult.estimatedCloseDays}d</span><span className="text-[10px] text-slate-400">para fechamento</span></div>
                      <div className="bg-white border border-slate-100 p-4 rounded-xl col-span-2"><span className="text-[10px] text-slate-400 font-bold uppercase block">Receita Projetada</span><span className="text-xl font-black text-brand-teal mt-1 block">R$ {scoreResult.forecastedRevenue.toLocaleString('pt-BR')}</span><span className="text-[10px] text-slate-400">valor × probabilidade</span></div>
                    </div>
                  </div>

                  {/* Positive / Negative Factors */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div><h5 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-600"><Check className="w-4 h-4" />Fatores Positivos</h5><ul className="space-y-2">{scoreResult.positiveFactors.map((f, i) => <li key={i} className="text-xs text-slate-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />{f}</li>)}</ul></div>
                    <div><h5 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-amber-500"><AlertCircle className="w-4 h-4" />Fatores de Risco</h5><ul className="space-y-2">{scoreResult.negativeFactors.map((f, i) => <li key={i} className="text-xs text-slate-600 bg-amber-50/30 p-2.5 rounded-xl border border-amber-100/50 flex items-start gap-2"><ChevronRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />{f}</li>)}</ul></div>
                  </div>

                  {/* Risk Alerts */}
                  {scoreResult.risks.length > 0 && (
                    <div><h5 className="text-red-600 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"><Shield className="w-4 h-4" />Alertas de Risco</h5><div className="space-y-2">{scoreResult.risks.map((r, i) => <div key={i} className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${r.type === 'urgent' ? 'bg-red-50 border-red-200 text-red-700' : r.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><div><span className="font-bold block">{r.title}</span><span>{r.description}</span></div></div>)}</div></div>
                  )}

                  {/* Next Best Actions */}
                  {scoreResult.nextActions.length > 0 && (
                    <div><h5 className="text-brand-blue font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5"><Zap className="w-4 h-4" />Próximas Ações Recomendadas</h5><div className="space-y-2">{scoreResult.nextActions.map((a, i) => <div key={i} className="flex items-start gap-2 bg-brand-blue/5 border border-brand-blue/10 p-3 rounded-xl"><div className={`p-1 rounded ${a.priority === 'high' ? 'bg-red-100 text-red-600' : a.priority === 'medium' ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}><Zap className="w-3 h-3" /></div><div><span className="text-xs font-bold text-slate-700">{a.action}</span><span className="text-[10px] text-slate-400 block">{a.reason}</span></div></div>)}</div></div>
                  )}
                </div>
              )}

              {!scoreResult && !scoreLoading && !scoreError && <div className="text-slate-400 text-xs py-8">Selecione um negócio para analisar.</div>}
            </>
          )}

          {/* TOOL 2: Email Generator */}
          {activeTool === 'email' && (
            <>
              <div><h3 className="text-slate-800 font-black text-lg flex items-center gap-2"><Mail className="w-5 h-5 text-brand-teal" />Gerador de E-mails e Follow-up IA</h3><p className="text-slate-400 text-xs mt-1">Crie abordagens personalizadas com o tom comercial perfeito.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Negócio</label><select value={emailDealId} onChange={e => setEmailDealId(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"><option value="">Selecione...</option>{deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tom</label><select value={emailTone} onChange={e => setEmailTone(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"><option value="formal">Corporativo / Formal</option><option value="persuasive">Persuasivo / Foco em Valor</option><option value="informal">Descontraído / Amigável</option><option value="urgent">Urgente / Escassez</option></select></div>
              </div>
              <button onClick={handleGenerateEmail} disabled={!emailDealId} className="bg-brand-teal hover:bg-brand-teal/95 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md self-start text-xs"><Sparkles className="w-4 h-4" />Gerar Mensagem</button>
              {generatedEmail && <div className="space-y-3 pt-4 border-t border-slate-100 flex-1 flex flex-col"><div className="flex items-center justify-between"><span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cópia Gerada</span><button onClick={handleCopyEmail} className="text-xs text-brand-blue hover:text-brand-blue/80 font-bold flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200">{isCopied ? <><Check className="w-3.5 h-3.5 text-emerald-600" />Copiado!</> : <><Copy className="w-3.5 h-3.5" />Copiar</>}</button></div><textarea readOnly value={generatedEmail} rows={10} className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-mono focus:outline-none flex-1 leading-relaxed text-slate-700 select-all" /></div>}
            </>
          )}

          {/* TOOL 3: Dossier */}
          {activeTool === 'dossier' && (
            <>
              <div><h3 className="text-slate-800 font-black text-lg flex items-center gap-2"><FileText className="w-5 h-5 text-brand-teal" />Dossiê Executivo do Cliente</h3><p className="text-slate-400 text-xs mt-1">Síntese completa do cliente com dados de CRM, contratos e interações.</p></div>
              <div className="max-w-md flex items-end gap-3">
                <div className="flex-1"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Empresa</label><select value={dossierCompanyId} onChange={e => { setDossierCompanyId(e.target.value); setDossierResult(null) }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"><option value="">Selecione...</option>{companies.map(c => <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>)}</select></div>
                <button onClick={handleGenerateDossier} disabled={!dossierCompanyId || dossierLoading} className="bg-brand-blue hover:bg-brand-blue/95 disabled:bg-slate-200 text-white font-bold py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all text-xs h-[42px]">{dossierLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Gerando...</> : <><Brain className="w-4 h-4" />Gerar Dossiê</>}</button>
              </div>
              {dossierError && <div className="text-red-500 text-xs py-2">{dossierError}</div>}
              {renderDossierContent()}
            </>
          )}

          {/* TOOL 4: Timeline */}
          {activeTool === 'timeline' && (
            <>
              <div><h3 className="text-slate-800 font-black text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-brand-teal" />Linha do Tempo do Negócio</h3><p className="text-slate-400 text-xs mt-1">Jornada completa desde a criação até o estágio atual.</p></div>
              <div className="max-w-md"><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Negócio</label><select value={timelineDealId} onChange={e => { setTimelineDealId(e.target.value); setTimelineEvents([]) }} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"><option value="">Selecione...</option>{deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select></div>
              {timelineLoading && <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-teal" /></div>}
              {timelineError && <div className="text-red-500 text-xs py-4">{timelineError}</div>}
              {!timelineLoading && !timelineError && timelineEvents.length === 0 && <div className="text-slate-400 text-xs py-8">Nenhum evento encontrado para este negócio.</div>}
              {!timelineLoading && timelineEvents.length > 0 && (
                <div className="relative border-l-2 border-slate-100 ml-4 pl-8 space-y-6 py-2">
                  {timelineEvents.map((evt, i) => {
                    const typeColors: Record<string, string> = {
                      'deal-created': 'bg-brand-blue text-white',
                      'activity-call': 'bg-blue-500 text-white',
                      'activity-meeting': 'bg-violet-500 text-white',
                      'activity-whatsapp': 'bg-emerald-500 text-white',
                      'activity-email': 'bg-indigo-500 text-white',
                      'activity-visit': 'bg-orange-500 text-white',
                      'activity-comment': 'bg-slate-500 text-white',
                      'proposal-draft': 'bg-slate-400 text-white',
                      'proposal-sent': 'bg-brand-teal text-white',
                      'proposal-negotiation': 'bg-amber-500 text-white',
                      'proposal-approved': 'bg-emerald-600 text-white',
                      'proposal-rejected': 'bg-red-500 text-white',
                      'contract-draft': 'bg-slate-400 text-white',
                      'contract-active': 'bg-emerald-600 text-white',
                      'contract-expired': 'bg-slate-500 text-white',
                      'contract-terminated': 'bg-red-500 text-white',
                    }
                    const color = typeColors[evt.type] || 'bg-slate-400 text-white'
                    return (
                      <div key={i} className="relative group">
                        <div className={`absolute -left-12 top-1 w-8 h-8 rounded-full flex items-center justify-center shadow-sm ${color}`}><Activity className="w-4 h-4" /></div>
                        <div className="bg-slate-50/50 hover:bg-slate-50 border border-slate-100 p-4 rounded-2xl transition-all">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100/50 pb-2 mb-2">
                            <span className="text-xs font-black text-slate-700">{evt.title}</span>
                            <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(evt.date).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>
                          {evt.author && <div className="mt-2 text-[10px] text-slate-400 font-semibold">Por: {evt.author}</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </>
          )}

          {/* TOOL 5: Simulator */}
          {activeTool === 'simulator' && (
            <>
              <div><h3 className="text-slate-800 font-black text-lg flex items-center gap-2"><Zap className="w-5 h-5 text-brand-teal" />Simulador What-If</h3><p className="text-slate-400 text-xs mt-1">Simule mudanças de estágio e valor para ver o impacto no score e receita projetada.</p></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Negócio</label><select value={simDealId} onChange={e => setSimDealId(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"><option value="">Selecione...</option>{deals.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Estágio</label><select value={simStage} onChange={e => setSimStage(e.target.value)} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs">{PIPELINE_STAGES.map(s => <option key={s} value={s}>{s}</option>)}</select></div>
                <div><label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor (R$)</label><input type="number" value={simValue} onChange={e => setSimValue(Number(e.target.value))} className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs" /></div>
              </div>
              <button onClick={handleSimulate} disabled={!simDealId || simLoading} className="bg-brand-teal hover:bg-brand-teal/95 disabled:bg-slate-200 text-white font-bold py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md self-start text-xs">{simLoading ? <><RefreshCw className="w-4 h-4 animate-spin" />Simulando...</> : <><Zap className="w-4 h-4" />Simular Cenário</>}</button>
              {simError && <div className="text-red-500 text-xs py-2">{simError}</div>}
              {simResult && !simLoading && (
                <div className="space-y-6 pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Score Atual</span><span className="text-lg font-black text-slate-600">{simResult.originalScore}%</span></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Score Simulado</span><span className="text-lg font-black text-brand-teal">{simResult.simulatedScore}%</span></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Receita Projetada (atual)</span><span className="text-lg font-black text-slate-600">R$ {simResult.originalRevenue.toLocaleString('pt-BR')}</span></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Receita Projetada (nova)</span><span className="text-lg font-black text-brand-teal">R$ {simResult.simulatedRevenue.toLocaleString('pt-BR')}</span></div>
                  </div>
                  {simResult.estimatedDaysGain > 0 && <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-center gap-2 text-xs text-emerald-700"><Clock className="w-4 h-4" />Ganho estimado de {simResult.estimatedDaysGain} dias no ciclo de vendas.</div>}
                  <div><h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Alterações Simuladas</h5>{simResult.changes.map((c, i) => <div key={i} className="flex items-center gap-2 text-xs bg-slate-50 p-2 rounded-lg mb-1"><span className="font-bold text-slate-600 w-32">{c.field}:</span><span className="text-slate-400 line-through">{c.oldValue}</span><ChevronRight className="w-3 h-3 text-slate-400" /><span className="text-brand-teal font-bold">{c.newValue}</span></div>)}</div>
                </div>
              )}
            </>
          )}

          {/* TOOL 6: Dashboard */}
          {activeTool === 'dashboard' && (
            <>
              <div className="flex items-center justify-between">
                <div><h3 className="text-slate-800 font-black text-lg flex items-center gap-2"><BarChart3 className="w-5 h-5 text-brand-teal" />Dashboard Executivo do Pipeline</h3><p className="text-slate-400 text-xs mt-1">Indicadores em tempo real do funil comercial.</p></div>
                <button onClick={fetchDashboard} disabled={dashboardLoading} className="text-xs text-brand-blue font-bold flex items-center gap-1 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200"><RefreshCw className={`w-3.5 h-3.5 ${dashboardLoading ? 'animate-spin' : ''}`} />Atualizar</button>
              </div>
              {dashboardLoading && <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-brand-teal" /></div>}
              {dashboardError && <div className="text-red-500 text-xs py-4">{dashboardError}</div>}
              {dashboardData && !dashboardLoading && (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Total Pipeline</span><span className="text-lg font-black text-slate-800 mt-1 block">R$ {dashboardData.totalPipelineValue.toLocaleString('pt-BR')}</span></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Negócios Ativos</span><span className="text-lg font-black text-slate-800 mt-1 block">{dashboardData.totalDeals}</span></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Conversão</span><span className="text-lg font-black text-brand-teal mt-1 block">{dashboardData.conversionRate}%</span></div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100"><span className="text-[10px] text-slate-400 block">Receita Conquistada</span><span className="text-lg font-black text-brand-teal mt-1 block">R$ {dashboardData.wonRevenue.toLocaleString('pt-BR')}</span></div>
                  </div>

                  <div><h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Distribuição por Estágio</h5><div className="space-y-2">{dashboardData.dealsByStage.map((s, i) => <div key={i} className="flex items-center gap-3"><span className="text-[11px] font-semibold text-slate-600 w-36 truncate">{s.stage}</span><div className="flex-1 bg-slate-100 h-3 rounded-full overflow-hidden"><div className="h-full bg-brand-teal rounded-full transition-all" style={{ width: `${Math.min(100, (s.value / Math.max(1, dashboardData.totalPipelineValue)) * 100)}%` }} /></div><span className="text-[11px] text-slate-500 w-16 text-right">{s.count}</span><span className="text-[11px] text-slate-600 font-bold w-24 text-right">R$ {s.value.toLocaleString('pt-BR')}</span></div>)}</div></div>

                  {dashboardData.topRisks.length > 0 && <div><h5 className="text-xs font-bold text-slate-500 uppercase mb-2">Principais Alertas</h5>{dashboardData.topRisks.map((r, i) => <div key={i} className={`p-2.5 rounded-xl border flex items-start gap-2 text-xs mb-1.5 ${r.type === 'urgent' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}><AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" /><span><span className="font-bold">{r.title}</span>: {r.description}</span></div>)}</div>}
                </div>
              )}
            </>
          )}

          {/* TOOL 7: AI Architecture */}
          {activeTool === 'ai-arch' && (
            <>
              <div><h3 className="text-slate-800 font-black text-lg flex items-center gap-2"><Server className="w-5 h-5 text-brand-teal" />Arquitetura Conversacional</h3><p className="text-slate-400 text-xs mt-1">Preparação para integração com modelos de linguagem (GPT/LLM).</p></div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-brand-blue mb-3 flex items-center gap-1.5"><Cpu className="w-4 h-4" />Prompt Templates</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Score Analysis</span><code className="text-[10px] text-slate-600 font-mono">Analise o negócio {`{deal_title}`} da empresa {`{company_name}`} no estágio {`{stage}`}. Score: {`{score}%`}. Fatores positivos: {`{positives}`}. Riscos: {`{risks}`}. Recomende a próxima ação.</code></div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Email Generation</span><code className="text-[10px] text-slate-600 font-mono">Gere um e-mail comercial em português com tom {`{tone}`} para {`{contact_name}`} da {`{company_name}`} sobre {`{service}`}. Valor: R$ {`{value}`}. Use o nome do remetente: Bruno Crepaldi.</code></div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Dossier</span><code className="text-[10px] text-slate-600 font-mono">Resuma o perfil da empresa {`{company_name}`} ({`{segment}`}, {`{employees}`} funcionários). Histórico: {`{deal_history}`}. Contatos-chave: {`{contacts}`}. Recomende estratégia comercial.</code></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100">
                  <h4 className="text-xs font-bold text-brand-teal mb-3 flex items-center gap-1.5"><Settings className="w-4 h-4" />Contexto da Conversa</h4>
                  <div className="space-y-3">
                    <div className="bg-white p-3 rounded-xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">System Prompt</span><code className="text-[10px] text-slate-600 font-mono">Você é um assistente comercial especializado em SST e saúde ocupacional da CrepaldiDH. Responda com dados reais do CRM. Seja objetivo e direto.</code></div>
                    <div className="bg-white p-3 rounded-xl border border-slate-100"><span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Tools (Function Calling)</span><code className="text-[10px] text-slate-600 font-mono">get_lead_score(dealId) → {`{score, confidence, risks}`}; get_dossier(companyId) → {`{summary, contacts, deals}`}; simulate(dealId, changes) → {`{projection}`}; get_timeline(dealId) → {`{events[]}`}</code></div>
                  </div>
                </div>

                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 md:col-span-2">
                  <h4 className="text-xs font-bold text-slate-700 mb-3 flex items-center gap-1.5"><TrendingUp className="w-4 h-4" />Fluxo de Integração</h4>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-700">Usuário</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-brand-blue">Next.js App Router</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-brand-teal">/api/ai/commercial-assistant</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-700">Prisma ORM</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-amber-600">PostgreSQL</span>
                  </div>
                  <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                    <span className="bg-brand-teal/10 text-brand-teal px-3 py-1.5 rounded-lg font-bold">GPT-4o / Claude</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-700">Function Calling</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-700">API Route</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-slate-700">Resposta Estruturada</span>
                    <ChevronRight className="w-3 h-3 text-slate-300" />
                    <span className="bg-white border border-slate-200 px-3 py-1.5 rounded-lg font-bold text-brand-blue">UI Componente</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
