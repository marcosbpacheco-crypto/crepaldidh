'use client'

import React, { useState, useMemo } from 'react'
import { useCrm, Deal, Company, Contact } from '../context/CrmContext'
import { 
  Sparkles, Mail, Target, Award, Brain, RefreshCw, 
  Copy, Check, FileText, ChevronRight, MessageSquare, AlertCircle
} from 'lucide-react'

// Simulated AI text generators
const generateFakeEmail = (tone: string, compName: string, contactName: string, service: string, value: number) => {
  const formattedValue = value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  switch (tone) {
    case 'persuasive':
      return `Olá, ${contactName}.\n\nEspero que esteja tudo bem na ${compName}.\n\nAcompanhando o nosso diagnóstico recente sobre a área de saúde organizacional, identificamos uma oportunidade excelente para iniciarmos o projeto de ${service}.\n\nAo estruturarmos essa parceria, conseguiremos reduzir substancialmente os riscos de afastamentos e maximizar a produtividade do time, retornando o investimento de R$ ${formattedValue} logo no primeiro semestre.\n\nPodemos falar brevemente amanhã às 14h para definirmos o cronograma?\n\nAtenciosamente,\nEquipe CrepaldiDH`
    case 'informal':
      return `Oi, ${contactName}! Tudo bem?\n\nPassando aqui para dar um alô e ver como estão as coisas na ${compName}.\n\nConseguiu dar uma olhada na nossa proposta de ${service} que te enviei? Queria saber se ficou com alguma dúvida sobre o escopo ou se faz sentido marcarmos um bate-papo rápido para ajustar o que for preciso.\n\nFico no seu aguardo!\n\nAbraços,\nEquipe CrepaldiDH`
    case 'urgent':
      return `Prezada ${contactName},\n\nGostaria de avisar que as condições especiais da proposta de ${service} apresentadas para a ${compName} expiram nesta semana.\n\nComo o valor proposto (R$ ${formattedValue}) está com bonificação especial de lançamento corporativo, recomendamos a formalização para garantir o início das dinâmicas in-company ainda este mês.\n\nPodemos assinar o contrato amanhã?\n\nNo aguardo,\nEquipe CrepaldiDH`
    default: // formal
      return `Prezado(a) ${contactName},\n\nEm continuidade à nossa conversa comercial a respeito das soluções em desenvolvimento humano para a ${compName}, enviamos em anexo os detalhes do escopo para ${service}.\n\nEstamos convictos de que a metodologia CrepaldiDH agregará grande valor estratégico aos seus líderes e colaboradores, otimizando os índices de engajamento interno.\n\nFicamos à disposição para agendarmos uma conferência de alinhamento.\n\nCordialmente,\nBruno Crepaldi\nDiretor Comercial | CrepaldiDH`
  }
}

export const CrmAIHelper: React.FC = () => {
  const { deals, companies, contacts, activities } = useCrm()

  // 1. Tool selection state: 'scoring' | 'email' | 'dossier'
  const [activeTool, setActiveTool] = useState<'scoring' | 'email' | 'dossier'>('scoring')

  // Tool 1: Scoring State
  const [selectedDealId, setSelectedDealId] = useState<string>(deals[0]?.id || '')
  
  // Tool 2: Email Generator State
  const [emailDealId, setEmailDealId] = useState<string>(deals[0]?.id || '')
  const [emailTone, setEmailTone] = useState<string>('formal')
  const [generatedEmail, setGeneratedEmail] = useState<string>('')
  const [isCopied, setIsCopied] = useState(false)

  // Tool 3: Dossier State
  const [dossierCompanyId, setDossierCompanyId] = useState<string>(companies[0]?.id || '')
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false)
  const [generatedDossier, setGeneratedDossier] = useState<{
    summary: string
    strengths: string[]
    risks: string[]
    nextStep: string
  } | null>(null)

  // 2. Lead Scoring IA Calculation
  const computedScore = useMemo(() => {
    if (!selectedDealId) return null
    const deal = deals.find(d => d.id === selectedDealId)
    if (!deal) return null

    const comp = companies.find(c => c.id === deal.companyId)
    const compContacts = contacts.filter(c => c.companyId === deal.companyId)
    const compActivities = activities.filter(a => a.companyId === deal.companyId)

    let score = 30 // Base score

    // Stage weight
    if (deal.stage === 'Lead novo') score += 5
    else if (deal.stage === 'Primeiro contato') score += 10
    else if (deal.stage === 'Reunião agendada') score += 15
    else if (deal.stage === 'Diagnóstico realizado') score += 25
    else if (deal.stage === 'Proposta enviada') score += 35
    else if (deal.stage === 'Negociação') score += 45
    else if (deal.stage === 'Contrato aprovado' || deal.stage === 'Implantação' || deal.stage === 'Cliente ativo') score += 65
    else if (deal.stage === 'Cliente perdido') score = 5

    // Contact influence
    const hasHighInfluenceContact = compContacts.some(c => c.influence === 'high')
    if (hasHighInfluenceContact) score += 15

    // Interaction weight
    if (compActivities.length > 5) score += 15
    else if (compActivities.length > 2) score += 8

    // Value filter
    if (deal.value > 100000) score -= 5 // Larger deals are slightly harder to close
    else if (deal.value > 0 && deal.value < 30000) score += 5 // Smaller deals close faster

    // Clamp score
    score = Math.max(0, Math.min(100, score))

    // Formulate factors
    const positiveFactors: string[] = []
    const negativeFactors: string[] = []

    if (deal.stage === 'Diagnóstico realizado' || deal.stage === 'Proposta enviada' || deal.stage === 'Negociação') {
      positiveFactors.push('Etapa comercial avançada com interação direta.')
    }
    if (hasHighInfluenceContact) {
      positiveFactors.push('Contato com alto poder de decisão (Diretoria/RH) mapeado.')
    }
    if (compActivities.length > 3) {
      positiveFactors.push(`Relação aquecida: ${compActivities.length} interações registradas no CRM.`)
    }
    if (deal.value > 100000) {
      negativeFactors.push('Ticket médio elevado exige aprovação do comitê financeiro.')
    }
    if (compActivities.length === 0) {
      negativeFactors.push('Nenhuma interação ou follow-up realizado nos últimos dias.')
    }

    if (positiveFactors.length === 0) positiveFactors.push('Estágio inicial de prospecção.')
    if (negativeFactors.length === 0) negativeFactors.push('Sem impeditivos comerciais aparentes.')

    return {
      score,
      positiveFactors,
      negativeFactors
    }

  }, [selectedDealId, deals, companies, contacts, activities])

  // 3. Actions
  const handleGenerateEmail = () => {
    const deal = deals.find(d => d.id === emailDealId)
    if (!deal) return
    const comp = companies.find(c => c.id === deal.companyId)
    const firstContact = contacts.find(c => c.companyId === deal.companyId)
    
    const email = generateFakeEmail(
      emailTone, 
      comp ? comp.tradeName : 'Empresa', 
      firstContact ? firstContact.name : 'Responsável',
      deal.service,
      deal.value
    )
    setGeneratedEmail(email)
    setIsCopied(false)
  }

  const handleCopyEmail = () => {
    navigator.clipboard.writeText(generatedEmail)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleGenerateDossier = () => {
    if (!dossierCompanyId) return
    setIsGeneratingDossier(true)
    
    setTimeout(() => {
      const comp = companies.find(c => c.id === dossierCompanyId)
      if (!comp) return

      const compDeals = deals.filter(d => d.companyId === comp.id)
      const compContacts = contacts.filter(c => c.companyId === comp.id)

      const activeDealsList = compDeals.map(d => d.service).join(', ')

      const dossier = {
        summary: `A ${comp.name} (${comp.tradeName}) opera no segmento de ${comp.segment} com ${comp.employees} colaboradores. Possui lideranças mapeadas no RH e DHO. O relacionamento comercial está focado em prover soluções de saúde mental e governança de SST.`,
        strengths: [
          `Mapeados ${compContacts.length} contatos diretos para agilizar a tomada de decisão.`,
          compDeals.length > 0 ? `Oportunidade ativa de R$ ${compDeals.reduce((sum,d)=>sum+d.value,0).toLocaleString('pt-BR')} em andamento.` : 'Cliente aberto para novas prospecções.'
        ],
        risks: [
          comp.status === 'inactive' ? 'A empresa está marcada como inativa no cadastro interno.' : 'Aprovação financeira demorada comum ao porte da organização.',
          compDeals.length === 0 ? 'Falta de negócios abertos no funil de vendas atual.' : 'Concorrência agressiva no segmento de segurança e medicina ocupacional.'
        ],
        nextStep: compDeals.length > 0 
          ? `Entrar em contato com o contato de decisão para apresentar a proposta comercial de ${compDeals[0].service}.` 
          : 'Enviar material corporativo e agendar um café presencial para apresentação de portfólio institucional.'
      }

      setGeneratedDossier(dossier)
      setIsGeneratingDossier(false)
    }, 800) // fake loading delay
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-fade-in">
      
      {/* LEFT PANEL: Menu of AI Utilities (3 cols) */}
      <div className="lg:col-span-3 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col p-4 space-y-2 h-full">
        <div className="p-2 flex items-center gap-2 mb-4">
          <Brain className="w-6 h-6 text-brand-teal" />
          <div>
            <h4 className="text-slate-800 font-black text-sm">Copiloto IA</h4>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Comercial Crepaldi</span>
          </div>
        </div>

        {[
          { id: 'scoring', label: 'Lead Scoring IA', icon: <Target className="w-4 h-4" />, desc: 'Previsibilidade de fechamento' },
          { id: 'email', label: 'Gerador de E-mails', icon: <Mail className="w-4 h-4" />, desc: 'Follow-ups inteligentes' },
          { id: 'dossier', label: 'Dossiê do Cliente', icon: <FileText className="w-4 h-4" />, desc: 'Resumo executivo consolidado' }
        ].map(tool => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id as any)}
            className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
              activeTool === tool.id 
                ? 'bg-brand-blue border-brand-blue text-white shadow-md shadow-brand-blue/10 scale-[1.01]' 
                : 'bg-white border-slate-100 hover:bg-slate-50 text-slate-700'
            }`}
          >
            <div className={`p-2 rounded-lg ${activeTool === tool.id ? 'bg-white/10 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {tool.icon}
            </div>
            <div>
              <span className="font-bold text-xs block">{tool.label}</span>
              <span className={`text-[10px] block mt-0.5 ${activeTool === tool.id ? 'text-white/70' : 'text-slate-400'}`}>
                {tool.desc}
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* RIGHT PANEL: Workspace for the Selected AI Tool (9 cols) */}
      <div className="lg:col-span-9 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* TOOL 1: Lead Scoring */}
        {activeTool === 'scoring' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto space-y-6">
            <div>
              <h3 className="text-slate-800 font-black text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-brand-teal" />
                Análise de Previsibilidade de Fechamento (Lead Scoring)
              </h3>
              <p className="text-slate-400 text-xs mt-1">Nossa IA cruza dados de estágio, interações e contatos decisores para calcular a probabilidade de venda.</p>
            </div>

            <div className="max-w-md">
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione o Negócio do Funil</label>
              <select
                value={selectedDealId}
                onChange={e => setSelectedDealId(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
              >
                <option value="">Selecione...</option>
                {deals.map(d => (
                  <option key={d.id} value={d.id}>{d.title} (R$ {d.value.toLocaleString()})</option>
                ))}
              </select>
            </div>

            {computedScore ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                
                {/* Score Dial */}
                <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Score do Lead</span>
                  
                  <div className="relative w-36 h-36 mt-4">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="transparent"
                        stroke="#e2e8f0"
                        strokeWidth="8"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="transparent"
                        stroke="url(#tealGradient)"
                        strokeWidth="8"
                        strokeDasharray="263"
                        strokeDashoffset={263 - (263 * computedScore.score) / 100}
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="tealGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#1b3d52" />
                          <stop offset="100%" stopColor="#2db2a5" />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-slate-800">{computedScore.score}%</span>
                      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">De Sucesso</span>
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-500 leading-relaxed mt-6">
                    Este lead apresenta {computedScore.score > 70 ? 'altíssima' : computedScore.score > 40 ? 'média' : 'baixa'} probabilidade de conversão no ciclo atual.
                  </p>
                </div>

                {/* Score Factors */}
                <div className="space-y-6">
                  <div>
                    <h5 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-emerald-600">
                      <Check className="w-4 h-4" />
                      Fatores Positivos (Alavancas)
                    </h5>
                    <ul className="space-y-2">
                      {computedScore.positiveFactors.map((f, i) => (
                        <li key={i} className="text-xs text-slate-600 bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-100/50 flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div>
                    <h5 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5 text-amber-500">
                      <AlertCircle className="w-4 h-4" />
                      Fatores de Risco (Atenção)
                    </h5>
                    <ul className="space-y-2">
                      {computedScore.negativeFactors.map((f, i) => (
                        <li key={i} className="text-xs text-slate-600 bg-amber-50/30 p-2.5 rounded-xl border border-amber-100/50 flex items-start gap-2">
                          <ChevronRight className="w-3.5 h-3.5 text-amber-500 mt-0.5 flex-shrink-0" />
                          {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-slate-400 text-xs py-8">Selecione um negócio para analisar o lead scoring.</div>
            )}
          </div>
        )}

        {/* TOOL 2: Email & Follow-up Generator */}
        {activeTool === 'email' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto space-y-6">
            <div>
              <h3 className="text-slate-800 font-black text-lg flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-teal" />
                Gerador de E-mails e Mensagens de Follow-up IA
              </h3>
              <p className="text-slate-400 text-xs mt-1">Crie abordagens personalizadas com o tom comercial perfeito para cada cliente.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Selecione o Negócio</label>
                <select
                  value={emailDealId}
                  onChange={e => setEmailDealId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                >
                  <option value="">Selecione...</option>
                  {deals.map(d => (
                    <option key={d.id} value={d.id}>{d.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Tom de Linguagem</label>
                <select
                  value={emailTone}
                  onChange={e => setEmailTone(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                >
                  <option value="formal">Corporativo / Formal</option>
                  <option value="persuasive">Persuasivo / Foco em Valor</option>
                  <option value="informal">Descontraído / Amigável</option>
                  <option value="urgent">Urgente / Escassez de Vagas</option>
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerateEmail}
              disabled={!emailDealId}
              className="bg-brand-teal hover:bg-brand-teal/95 disabled:bg-slate-200 disabled:cursor-not-allowed text-white font-bold py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md self-start text-xs"
            >
              <Sparkles className="w-4 h-4" />
              Gerar Mensagem com IA
            </button>

            {generatedEmail && (
              <div className="space-y-3 pt-4 border-t border-slate-100 flex-1 flex flex-col">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cópia Gerada</span>
                  <button
                    onClick={handleCopyEmail}
                    className="text-xs text-brand-blue hover:text-brand-blue/80 font-bold flex items-center gap-1 bg-slate-50 hover:bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
                  >
                    {isCopied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copiado!
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copiar Mensagem
                      </>
                    )}
                  </button>
                </div>
                <textarea
                  readOnly
                  value={generatedEmail}
                  rows={10}
                  className="w-full p-4 border border-slate-200 rounded-2xl bg-slate-50 text-xs font-mono focus:outline-none flex-1 leading-relaxed text-slate-700 select-all"
                />
              </div>
            )}
          </div>
        )}

        {/* TOOL 3: Dossier Generator */}
        {activeTool === 'dossier' && (
          <div className="p-6 flex flex-col h-full overflow-y-auto space-y-6">
            <div>
              <h3 className="text-slate-800 font-black text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-teal" />
                Geração de Dossiê Executivo de Cliente
              </h3>
              <p className="text-slate-400 text-xs mt-1">Sintetize informações do histórico da empresa, contatos e oportunidades em um dossiê executivo instantâneo.</p>
            </div>

            <div className="max-w-md flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Selecione o Cliente / Empresa</label>
                <select
                  value={dossierCompanyId}
                  onChange={e => setDossierCompanyId(e.target.value)}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                >
                  <option value="">Selecione...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleGenerateDossier}
                disabled={!dossierCompanyId || isGeneratingDossier}
                className="bg-brand-blue hover:bg-brand-blue/95 disabled:bg-slate-200 text-white font-bold py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all text-xs h-[42px]"
              >
                {isGeneratingDossier ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    Gerar Dossiê
                  </>
                )}
              </button>
            </div>

            {generatedDossier && !isGeneratingDossier && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                
                {/* Summary */}
                <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                  <h4 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Resumo Executivo do Perfil</h4>
                  <p className="text-xs text-slate-700 leading-relaxed text-justify">{generatedDossier.summary}</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <div className="space-y-2">
                    <h5 className="text-emerald-600 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                      <Check className="w-3.5 h-3.5" />
                      Pontos de Apoio / Oportunidades
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {generatedDossier.strengths.map((str, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risks */}
                  <div className="space-y-2">
                    <h5 className="text-amber-500 font-bold text-xs uppercase tracking-wider flex items-center gap-1">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Gargalos Mapeados
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-600">
                      {generatedDossier.risks.map((risk, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Next Step */}
                <div className="bg-brand-blue/5 border border-brand-blue/15 p-4 rounded-xl">
                  <h4 className="text-[10px] text-brand-blue font-bold uppercase tracking-wider mb-1.5 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-brand-teal" />
                    Ação Comercial Recomendada (Next Best Action)
                  </h4>
                  <p className="text-xs text-slate-700 font-bold leading-relaxed">{generatedDossier.nextStep}</p>
                </div>

              </div>
            )}
          </div>
        )}

      </div>

    </div>
  )
}
