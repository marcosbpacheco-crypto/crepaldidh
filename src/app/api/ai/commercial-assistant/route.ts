import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import type { LeadScoreResult, RiskAlert, NextAction, SimulateResult, ExecutiveDossier, DashboardData, TimelineEvent } from '@/types/commercial-assistant'

const STAGE_WEIGHTS: Record<string, number> = {
  'Lead novo': 5, 'Primeiro contato': 10, 'Reunião agendada': 15,
  'Diagnóstico realizado': 25, 'Proposta enviada': 35, 'Negociação': 45,
  'Contrato aprovado': 60, 'Implantação': 70, 'Cliente ativo': 85, 'Cliente perdido': 0,
}

const AVG_DAYS_PER_STAGE: Record<string, number> = {
  'Lead novo': 3, 'Primeiro contato': 5, 'Reunião agendada': 7,
  'Diagnóstico realizado': 10, 'Proposta enviada': 10, 'Negociação': 14,
  'Contrato aprovado': 7, 'Implantação': 15, 'Cliente ativo': 0, 'Cliente perdido': 0,
}

function daysSince(d: Date | string | null | undefined): number {
  if (!d) return 999
  return Math.floor((Date.now() - new Date(d).getTime()) / (1000 * 60 * 60 * 24))
}

async function computeLeadScore(dealId: string): Promise<LeadScoreResult> {
  const deal = await prisma.crm_deals.findUnique({
    where: { id: dealId },
    include: {
      crm_companies: {
        include: {
          crm_contacts: true,
          crm_activities: { orderBy: { date: 'desc' } },
          crm_proposals: true,
          crm_contracts: true,
          crm_deals: true,
        }
      }
    }
  })

  if (!deal || !deal.crm_companies) throw new Error('Deal not found')

  const company = deal.crm_companies
  const contacts = company.crm_contacts || []
  const activities = company.crm_activities || []
  const proposals = company.crm_proposals || []
  const contracts = company.crm_contracts || []
  const allDeals = company.crm_deals || []

  let score = 30
  let dataPoints = 0
  const positiveFactors: string[] = []
  const negativeFactors: string[] = []
  const risks: RiskAlert[] = []
  const nextActions: NextAction[] = []

  score += STAGE_WEIGHTS[deal.stage] || 5
  dataPoints += 2

  const highInfluenceContacts = contacts.filter(c => c.influence === 'high')
  if (highInfluenceContacts.length > 0) {
    score += Math.min(15, highInfluenceContacts.length * 8)
    positiveFactors.push(`${highInfluenceContacts.length} contato(s) com alto poder de decisão.`)
    dataPoints += 2
  }

  const lastContactDays = activities.length > 0 ? daysSince(activities[0].date) : 999

  if (activities.length > 0) {
    if (lastContactDays <= 3) { score += 15; positiveFactors.push('Contato recente (menos de 3 dias).') }
    else if (lastContactDays <= 7) { score += 10; positiveFactors.push('Contato na última semana.') }
    else if (lastContactDays <= 14) { score += 5 }
    else {
      score -= 10
      negativeFactors.push(`Sem contato há ${lastContactDays} dias.`)
      risks.push({ type: lastContactDays > 30 ? 'urgent' : 'warning', title: 'Lead esfriando', description: `Último contato há ${lastContactDays} dias. Agende follow-up.` })
    }
    if (activities.length > 5) { score += 10; positiveFactors.push(`${activities.length} interações registradas.`) }
    else if (activities.length > 2) { score += 5 }
    dataPoints += 2
  } else {
    negativeFactors.push('Nenhuma interação registrada.')
    risks.push({ type: 'info', title: 'Sem interações', description: 'Registre atividades para melhorar a precisão.' })
  }

  const sentProposals = proposals.filter(p => ['sent', 'negotiation', 'approved'].includes(p.status || ''))
  if (sentProposals.length > 0) { score += 10; positiveFactors.push(`${sentProposals.length} proposta(s) ativa(s).`); dataPoints += 1 }

  const activeContracts = contracts.filter(c => c.status === 'active')
  if (activeContracts.length > 0) { score += 15; positiveFactors.push('Contrato ativo — relacionamento estabelecido.'); dataPoints += 1 }

  const value = Number(deal.value) || 0
  if (value > 100000) {
    score -= 5; negativeFactors.push('Ticket >R$100k — aprovação multi-nível.')
    risks.push({ type: 'info', title: 'Alto valor', description: 'Envolva a diretoria para acelerar aprovação.' })
  } else if (value > 0 && value < 15000) { score += 5; positiveFactors.push('Ticket reduzido — decisão mais ágil.') }

  const employees = company.employees || 0
  if (employees > 200) { score -= 3; negativeFactors.push('Grande porte — ciclo de vendas mais longo.') }
  else if (employees > 0 && employees < 30) { score += 3; positiveFactors.push('Pequeno porte — decisão centralizada.') }

  if (company.segment) {
    dataPoints += 1
    if (['industria', 'construção', 'metalurgica'].some(s => (company.segment || '').toLowerCase().includes(s))) {
      score += 3; positiveFactors.push('Segmento com alta demanda por SST.')
    }
  }

  const dealDays = deal.created_at ? daysSince(deal.created_at) : 0
  if (dealDays > 90) {
    score -= 5; negativeFactors.push(`Negócio aberto há ${dealDays} dias.`)
    risks.push({ type: 'warning', title: 'Ciclo muito longo', description: `Negócio aberto há ${dealDays} dias. Revise a estratégia.` })
  }

  const wonDeals = allDeals.filter(d => ['Cliente ativo', 'Implantação', 'Contrato aprovado'].includes(d.stage)).length
  const totalDeals = allDeals.length
  if (totalDeals > 0) {
    const conversionRate = wonDeals / totalDeals
    if (conversionRate > 0.5) { score += 5; positiveFactors.push('Histórico de conversão elevado com este cliente.') }
    else if (conversionRate < 0.2 && totalDeals > 2) { score -= 5; negativeFactors.push('Baixa taxa de conversão histórica com este cliente.') }
    dataPoints += 2
  }

  score = Math.max(0, Math.min(100, score))
  const confidence = Math.min(100, Math.round((dataPoints / 12) * 100))

  const stages = Object.keys(STAGE_WEIGHTS)
  const currentStageIdx = stages.indexOf(deal.stage)
  let remainingDays = 0
  for (let i = currentStageIdx; i < stages.length - 1; i++) {
    if (stages[i] === 'Cliente perdido' || stages[i] === 'Cliente ativo') continue
    remainingDays += AVG_DAYS_PER_STAGE[stages[i]] || 7
  }
  if (['Negociação', 'Contrato aprovado', 'Implantação'].includes(deal.stage)) {
    remainingDays = Math.max(5, remainingDays - 20)
  }

  const forecastedRevenue = Math.round(value * (score / 100))

  if (activities.length === 0) nextActions.push({ priority: 'high', action: 'Realizar primeiro contato com a empresa', reason: 'Nenhuma interação registrada.' })
  if (lastContactDays > 7) nextActions.push({ priority: 'high', action: 'Agendar follow-up urgente', reason: `Sem contato há ${lastContactDays} dias.` })
  if (deal.stage === 'Diagnóstico realizado' && sentProposals.length === 0) nextActions.push({ priority: 'high', action: 'Preparar e enviar proposta comercial', reason: 'Diagnóstico concluído.' })
  if (['Lead novo', 'Primeiro contato'].includes(deal.stage)) nextActions.push({ priority: 'medium', action: 'Agendar reunião de diagnóstico', reason: 'Avançar no funil.' })
  if (['Proposta enviada', 'Negociação'].includes(deal.stage)) {
    if (lastContactDays > 3) nextActions.push({ priority: 'medium', action: 'Enviar e-mail de follow-up', reason: 'Cliente analisando proposta.' })
    nextActions.push({ priority: 'low', action: 'Preparar minuta de contrato', reason: 'Antecipe-se ao fechamento.' })
  }

  if (positiveFactors.length === 0) positiveFactors.push('Oportunidade fresca no funil.')

  return { score, confidence, estimatedCloseDays: remainingDays, forecastedRevenue, positiveFactors, negativeFactors, risks, nextActions }
}

async function computeTimeline(dealId: string): Promise<TimelineEvent[]> {
  const deal = await prisma.crm_deals.findUnique({
    where: { id: dealId },
    include: {
      crm_companies: {
        include: {
          crm_activities: { orderBy: { date: 'asc' } },
          crm_proposals: { orderBy: { created_at: 'asc' } },
          crm_contracts: { orderBy: { created_at: 'asc' } },
        }
      }
    }
  })
  if (!deal || !deal.crm_companies) return []

  const events: TimelineEvent[] = []

  if (deal.created_at) {
    events.push({ date: deal.created_at.toISOString(), type: 'deal-created', title: 'Negócio criado', description: `Negócio "${deal.title}" foi cadastrado no pipeline.`, author: 'Sistema' })
  }

  const company = deal.crm_companies
  for (const act of company.crm_activities || []) {
    events.push({
      date: act.date?.toISOString() || '', type: `activity-${act.type}`, title: act.title,
      description: act.description || '', author: act.author || undefined
    })
  }

  for (const prop of company.crm_proposals || []) {
    events.push({
      date: prop.created_at?.toISOString() || '', type: `proposal-${prop.status}`,
      title: `Proposta ${prop.status === 'draft' ? 'criada' : prop.status === 'sent' ? 'enviada' : prop.status === 'approved' ? 'aprovada' : prop.status === 'rejected' ? 'rejeitada' : prop.status}`, description: `Proposta de ${prop.service} — R$ ${Number(prop.value).toLocaleString('pt-BR')}`, author: 'Sistema'
    })
  }

  for (const ct of company.crm_contracts || []) {
    events.push({
      date: ct.created_at?.toISOString() || '', type: `contract-${ct.status}`,
      title: `Contrato ${ct.status === 'active' ? 'assinado' : ct.status}`, description: `Contrato: ${ct.title}`, author: 'Sistema'
    })
  }

  events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return events
}

async function computeSimulation(dealId: string, changes: Record<string, any>): Promise<SimulateResult> {
  const original = await computeLeadScore(dealId)
  const deal = await prisma.crm_deals.findUnique({ where: { id: dealId } })
  if (!deal) throw new Error('Deal not found')

  const simulatedDeal = { ...deal, ...changes }
  const originalDeal = { ...deal }

  const stageWeightOrig = STAGE_WEIGHTS[originalDeal.stage] || 5
  const stageWeightSim = STAGE_WEIGHTS[simulatedDeal.stage] || 5
  const scoreDiff = stageWeightSim - stageWeightOrig

  let extraFromContacts = 0
  if (changes.hasOwnProperty('influence') && changes.influence === 'high') extraFromContacts = 10

  const simulatedScore = Math.max(0, Math.min(100, original.score + scoreDiff + extraFromContacts))
  const simulatedValue = changes.value !== undefined ? Number(changes.value) : Number(deal.value)
  const simulatedRevenue = Math.round(simulatedValue * (simulatedScore / 100))

  const changesList: { field: string; oldValue: string; newValue: string }[] = []
  for (const [key, val] of Object.entries(changes)) {
    if (key === 'influence') {
      changesList.push({ field: 'Influência do contato', oldValue: 'Média/Baixa', newValue: 'Alta' })
    } else {
      changesList.push({ field: key, oldValue: String((originalDeal as any)[key] ?? '-'), newValue: String(val ?? '-') })
    }
  }

  return {
    originalScore: original.score,
    simulatedScore,
    originalRevenue: original.forecastedRevenue,
    simulatedRevenue,
    estimatedDaysGain: ['Contrato aprovado', 'Implantação', 'Cliente ativo'].includes(simulatedDeal.stage) ? 15 : 0,
    changes: changesList,
  }
}

async function computeDossier(companyId: string): Promise<ExecutiveDossier> {
  const company = await prisma.crm_companies.findUnique({
    where: { id: companyId },
    include: {
      crm_contacts: true,
      crm_deals: true,
      crm_activities: { orderBy: { date: 'desc' }, take: 5 },
      crm_proposals: { orderBy: { created_at: 'desc' } },
      crm_contracts: { orderBy: { created_at: 'desc' }, take: 1 },
    }
  })
  if (!company) throw new Error('Company not found')

  const contacts = (company.crm_contacts || []).map(c => ({ name: c.name, role: c.role || '', influence: c.influence || 'medium' }))
  const activeDeals = (company.crm_deals || []).filter(d => d.stage !== 'Cliente perdido').map(d => ({ title: d.title, value: Number(d.value) || 0, stage: d.stage }))
  const recentActivities = (company.crm_activities || []).map(a => ({ type: a.type, title: a.title, date: a.date?.toISOString() || '' }))
  const lastActivity = company.crm_activities?.[0]
  const lastContactDays = lastActivity ? daysSince(lastActivity.date) : 999
  const totalRevenue = activeDeals.reduce((s, d) => s + d.value, 0)
  const latestContract = company.crm_contracts?.[0]
  const contractStatus = latestContract?.status || 'none'
  const wonDeals = (company.crm_deals || []).filter(d => ['Cliente ativo', 'Implantação', 'Contrato aprovado'].includes(d.stage)).length

  const summary = `${company.name || company.trade_name} atua no segmento ${company.segment || 'não informado'} com ${company.employees || '?'} colaboradores. ${contacts.length} contatos mapeados, ${activeDeals.length} negócio(s) ativo(s) totalizando R$ ${totalRevenue.toLocaleString('pt-BR')}. ${wonDeals} conversão(ões) anteriores. ${contractStatus !== 'none' ? `Contrato ${contractStatus === 'active' ? 'ativo' : contractStatus}.` : 'Sem contrato vigente.'}`

  const strengths: string[] = [
    contacts.length > 0 ? `${contacts.length} contato(s) mapeado(s) — agilidade na tomada de decisão.` : 'Contatos ainda não mapeados.',
    activeDeals.length > 0 ? `Oportunidade ativa de R$ ${totalRevenue.toLocaleString('pt-BR')}.` : 'Sem negócios abertos no funil.',
    wonDeals > 0 ? `${wonDeals} conversão(ões) anteriores com a CrepaldiDH.` : 'Primeira prospecção com esta empresa.',
  ]

  const risksList: string[] = [
    lastContactDays > 30 ? `Sem contato há ${lastContactDays} dias — risco de esfriamento.` : lastContactDays > 14 ? `Último contato há ${lastContactDays} dias.` : 'Contato recente — momento aquecido.',
    activeDeals.length === 0 ? 'Nenhum negócio ativo no pipeline.' : `${activeDeals.length} negócio(s) em andamento.`,
  ]

  const nextStep = activeDeals.length > 0
    ? `Dar continuidade ao negócio "${activeDeals[0].title}" (${activeDeals[0].stage}). ${lastContactDays > 7 ? 'Agendar follow-up imediato.' : 'Manter frequência de contato semanal.'}`
    : 'Iniciar prospecção: enviar material institucional e agendar reunião de apresentação.'

  return {
    companyId: company.id, companyName: company.name || '', tradeName: company.trade_name || '',
    segment: company.segment || '', city: company.city || '', state: company.state || '',
    employees: company.employees || 0, summary, strengths, risks: risksList, nextStep,
    contacts, activeDeals, recentActivities, totalRevenue, contractStatus, lastContactDays,
  }
}

async function computeDashboard(): Promise<DashboardData> {
  const allCompanies = await prisma.crm_companies.findMany({
    where: { deleted_at: null },
    include: {
      crm_deals: true,
      crm_activities: { orderBy: { date: 'desc' } },
      crm_contracts: true,
    }
  })

  let totalDeals = 0, totalPipelineValue = 0, totalScore = 0, scoredCount = 0
  let wonDeals = 0, wonRevenue = 0, lostDeals = 0
  const dealsByStage: Record<string, { count: number; value: number }> = {}
  const topRisks: RiskAlert[] = []
  const allActivities: { date: Date; companyId: string }[] = []
  const wonDealList: { date: Date }[] = []

  for (const company of allCompanies) {
    for (const deal of company.crm_deals || []) {
      totalDeals++
      const value = Number(deal.value) || 0
      totalPipelineValue += value
      if (!dealsByStage[deal.stage]) dealsByStage[deal.stage] = { count: 0, value: 0 }
      dealsByStage[deal.stage].count++
      dealsByStage[deal.stage].value += value

      if (['Cliente ativo', 'Implantação', 'Contrato aprovado'].includes(deal.stage)) {
        wonDeals++; wonRevenue += value
        if (deal.created_at) wonDealList.push({ date: deal.created_at })
      }
      if (deal.stage === 'Cliente perdido') lostDeals++

      const lastAct = company.crm_activities?.[0]
      const lastDays = lastAct ? daysSince(lastAct.date) : 999
      if (lastDays > 14) {
        topRisks.push({ type: lastDays > 30 ? 'urgent' : 'warning', title: `${company.trade_name || company.name} — sem contato`, description: `Há ${lastDays} dias sem interação no negócio "${deal.title}".` })
      }
    }
    for (const act of company.crm_activities || []) {
      if (act.date) allActivities.push({ date: act.date, companyId: company.id })
    }
  }

  const conversionRate = totalDeals > 0 ? Math.round((wonDeals / totalDeals) * 100) : 0
  const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0

  const topActions: NextAction[] = topRisks.slice(0, 3).map(r => ({
    priority: r.type === 'urgent' ? 'high' : r.type === 'warning' ? 'medium' : 'low',
    action: `Follow-up: ${r.title}`,
    reason: r.description,
  }))

  const performanceTrend = [
    { label: 'Pipeline total', score: totalPipelineValue },
    { label: 'Negócios ativos', score: totalDeals },
    { label: 'Taxa de conversão', score: conversionRate },
    { label: 'Receita conquistada', score: wonRevenue },
  ]

  return {
    totalDeals, totalPipelineValue, avgScore, wonDeals, wonRevenue, lostDeals, conversionRate,
    dealsByStage: Object.entries(dealsByStage).map(([stage, data]) => ({ stage, count: data.count, value: data.value })),
    topRisks: topRisks.slice(0, 5), topActions: topActions.slice(0, 3), performanceTrend,
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, dealId, companyId, changes } = body

    switch (action) {
      case 'score': {
        if (!dealId) return NextResponse.json({ error: 'dealId is required' }, { status: 400 })
        const result = await computeLeadScore(dealId)
        return NextResponse.json(result)
      }
      case 'timeline': {
        if (!dealId) return NextResponse.json({ error: 'dealId is required' }, { status: 400 })
        const events = await computeTimeline(dealId)
        return NextResponse.json({ events })
      }
      case 'simulate': {
        if (!dealId || !changes) return NextResponse.json({ error: 'dealId and changes are required' }, { status: 400 })
        const result = await computeSimulation(dealId, changes)
        return NextResponse.json(result)
      }
      case 'dossier': {
        if (!companyId) return NextResponse.json({ error: 'companyId is required' }, { status: 400 })
        const dossier = await computeDossier(companyId)
        return NextResponse.json(dossier)
      }
      case 'dashboard': {
        const dashboard = await computeDashboard()
        return NextResponse.json(dashboard)
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 })
    }
  } catch (err: any) {
    console.error('[AI Commercial Assistant]', err)
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 })
  }
}
