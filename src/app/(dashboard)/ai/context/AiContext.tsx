'use client'

import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useFinancial } from '@/app/(dashboard)/financial/context/FinancialContext'
import { useTrainings } from '@/app/(dashboard)/trainings/context/TrainingsContext'
import { useMentoring } from '@/app/(dashboard)/mentoring/context/MentoringContext'
import { useCalendar } from '@/app/(dashboard)/calendar/context/CalendarContext'
import { useDocuments } from '@/app/(dashboard)/documents/context/DocumentContext'

export type AiAssistantType = 'chat' | 'reports' | 'commercial' | 'nr01' | 'training' | 'mentoring' | 'financial'

export interface AiMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: string
  metadata?: Record<string, unknown>
}

export interface AiConversation {
  id: string
  title: string
  assistantType: AiAssistantType
  messages: AiMessage[]
  module?: string
  companyId?: string
  projectId?: string
  favorite: boolean
  createdAt: string
  updatedAt: string
}

export interface AiPrompt {
  id: string
  title: string
  prompt: string
  category: string
  tags: string[]
  usageCount: number
}

export interface AiConfig {
  tone: 'professional' | 'friendly' | 'technical' | 'executive'
  responseSize: 'concise' | 'balanced' | 'detailed'
  maxHistory: number
}

const ASSISTANTS: { type: AiAssistantType; label: string; icon: string; description: string }[] = [
  { type: 'chat', label: 'Chat Geral', icon: '💬', description: 'Tire dúvidas sobre qualquer módulo do sistema' },
  { type: 'reports', label: 'Relatórios', icon: '📊', description: 'Gere relatórios NR01, treinamento, mentoria, executivo, financeiro e comercial' },
  { type: 'commercial', label: 'Comercial', icon: '📈', description: 'Crie propostas, e-mails, follow-ups e identifique oportunidades' },
  { type: 'nr01', label: 'NR-01', icon: '🛡️', description: 'Analise riscos, sugira planos de ação e gere recomendações técnicas' },
  { type: 'training', label: 'Treinamentos', icon: '🎓', description: 'Crie roteiros, conteúdos, avaliações e certificados' },
  { type: 'mentoring', label: 'Mentorias/PDI', icon: '💡', description: 'Resuma sessões, sugira PDIs e metas de desenvolvimento' },
  { type: 'financial', label: 'Financeiro', icon: '💰', description: 'Analise finanças, inadimplência, projeções e cobranças' },
]

const fmt = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

function generateId(): string { return `ai-${Date.now()}-${Math.random().toString(36).substring(2, 8)}` }

interface AiContextType {
  conversations: AiConversation[]
  currentConversationId: string | null
  currentConversation: AiConversation | null
  assistantType: AiAssistantType
  setAssistantType: (t: AiAssistantType) => void
  assistants: typeof ASSISTANTS
  prompts: AiPrompt[]
  config: AiConfig
  setConfig: (c: Partial<AiConfig>) => void
  loading: boolean
  newConversation: () => void
  selectConversation: (id: string) => void
  deleteConversation: (id: string) => void
  toggleFavorite: (id: string) => void
  sendMessage: (content: string, context?: { companyId?: string; projectId?: string }) => Promise<void>
  generateReport: (type: string, params: Record<string, string>) => Promise<string>
  addPrompt: (p: Omit<AiPrompt, 'id' | 'usageCount'>) => void
  deletePrompt: (id: string) => void
  usePrompt: (id: string) => void
  copyToClipboard: (text: string) => void
  formatResponse: (content: string) => string
}

const AiContext = createContext<AiContextType | undefined>(undefined)

function generateAIResponse(assistantType: AiAssistantType, userMessage: string, crm: ReturnType<typeof useCrm>, fin: ReturnType<typeof useFinancial>, trn: ReturnType<typeof useTrainings>, men: ReturnType<typeof useMentoring>, cal: ReturnType<typeof useCalendar>, doc: ReturnType<typeof useDocuments>): string {
  const msg = userMessage.toLowerCase()

  // ── CHAT ──────────────────────────────────────
  if (assistantType === 'chat') {
    if (msg.includes('cliente') || msg.includes('empresa')) {
      const active = crm.companies.filter(c => c.status === 'active')
      return `📋 **Clientes Ativos (${active.length})**\n\n${active.map(c => `• **${c.tradeName || c.name}** — ${c.city}/${c.state} — ${c.employees} funcionários — Contato: ${c.phone}`).join('\n')}\n\n> Total de ${crm.companies.length} empresas cadastradas, ${active.length} ativas.`
    }
    if (msg.includes('projeto') || msg.includes('contrato')) {
      const contracts = crm.contracts.filter(c => c.status === 'active')
      if (!contracts.length) return '📋 **Projetos Ativos**\n\nNenhum projeto ativo no momento.'
      return `📋 **Projetos Ativos (${contracts.length})**\n\n${contracts.map(c => `• **${c.title}** — ${fmt(c.value)} — Cliente: ${crm.companies.find(co => co.id === c.companyId)?.tradeName || 'N/A'} — Vigência: ${new Date(c.startDate).toLocaleDateString('pt-BR')} a ${new Date(c.endDate).toLocaleDateString('pt-BR')}`).join('\n')}`
    }
    if (msg.includes('receita') || msg.includes('faturamento') || msg.includes('mrr')) {
      return `💰 **Indicadores Financeiros**\n\n• **MRR**: ${fmt(fin.mrr)}\n• **ARR**: ${fmt(fin.arr)}\n• **Receita Total**: ${fmt(fin.dre.grossRevenue)}\n• **Recebido**: ${fmt(fin.totalReceived)}\n• **A Receber**: ${fmt(fin.totalPendingReceivable)}\n• **Vencido**: ${fmt(fin.totalOverdue)}\n• **Margem**: ${fin.dre.profitMargin.toFixed(1)}%\n• **Despesas**: ${fmt(fin.dre.operatingExpenses)}`
    }
    if (msg.includes('treinamento') || msg.includes('evento')) {
      return `🎓 **Treinamentos**\n\n• **Realizados**: ${trn.completedEvents}\n• **Participantes**: ${trn.totalRegisteredParticipants}\n• **Presença**: ${trn.attendanceRate.toFixed(0)}%\n• **NPS**: ${Math.round(trn.averageNps)}/100\n• **Certificados**: ${trn.certificatesIssued}\n• **Receita**: ${fmt(trn.totalRevenue)}`
    }
    if (msg.includes('mentoria') || msg.includes('pdi')) {
      return `💡 **Mentorias & PDI**\n\n• **Sessões Realizadas**: ${men.sessions.filter(s => s.status === 'realizada').length}\n• **PDIs Ativos**: ${men.activePDIs}\n• **Participantes**: ${men.participants.length}\n• **Metas Concluídas**: ${men.completedGoals}\n• **Metas em Atraso**: ${men.overdueGoals}\n• **Sessões no Mês**: ${men.sessionsThisMonth}`
    }
    if (msg.includes('risco') || msg.includes('nr01') || msg.includes('diagnóstico')) {
      return `🛡️ **NR-01**\n\n• **Riscos Mapeados**: ${crm.risks.length}\n• **Críticos (alto)**: ${crm.risks.filter(r => r.level === 'high').length}\n• **Planos de Ação**: ${crm.actionPlans.length}\n• **Concluídos**: ${crm.actionPlans.filter(a => a.status === 'completed').length}\n• **Diagnósticos**: ${crm.diagnostics.length}`
    }
    if (msg.includes('agenda') || msg.includes('evento') || msg.includes('reunião')) {
      const upcoming = cal.events.filter(e => new Date(e.eventDate) >= new Date()).slice(0, 5)
      return `📅 **Próximos Eventos**\n\n${upcoming.length ? upcoming.map(e => `• **${e.title}** — ${new Date(e.eventDate).toLocaleDateString('pt-BR')} ${e.startTime} — ${e.type.replace('_', ' ')}`).join('\n') : 'Nenhum evento próximo.'}\n\n> Total de ${cal.events.length} eventos na agenda.`
    }
    if (msg.includes('documento') || msg.includes('central')) {
      return `📄 **Central de Documentos**\n\n• **Total**: ${doc.documents.length}\n• **Aprovados**: ${doc.documents.filter(d => d.status === 'approved').length}\n• **Rascunhos**: ${doc.documents.filter(d => d.status === 'draft').length}\n\n> Últimos: ${doc.documents.slice(-3).map(d => `"${d.name}"`).join(', ')}`
    }
    return `🤖 **Assistente IA CrepaldiDH**\n\nOlá! Posso ajudar com informações sobre:\n\n• **Clientes** — lista e status de empresas\n• **Projetos** — contratos ativos e valores\n• **Financeiro** — receitas, despesas, MRR, ARR\n• **Treinamentos** — eventos, NPS, participantes\n• **Mentorias/PDI** — sessões, metas, evolução\n• **NR-01** — riscos, planos de ação\n• **Agenda** — próximos eventos\n• **Documentos** — central de documentos\n\n> Pergunte sobre qualquer tema ou selecione um assistente especializado ao lado.`
  }

  // ── REPORTS ───────────────────────────────────
  if (assistantType === 'reports') {
    if (msg.includes('executivo') || msg.includes('resumo')) {
      return `📊 **Relatório Executivo — ${new Date().toLocaleDateString('pt-BR')}**\n\n**Visão Geral**\n• Clientes Ativos: ${crm.companies.filter(c => c.status === 'active').length}\n• Projetos em Andamento: ${crm.contracts.filter(c => c.status === 'active').length}\n• Faturamento MRR: ${fmt(fin.mrr)}\n• NPS Médio: ${Math.round(trn.averageNps)}/100\n\n**Saúde Financeira**\n• Margem Líquida: ${fin.dre.profitMargin.toFixed(1)}%\n• Inadimplência: ${fmt(fin.totalOverdue)} (${fin.totalOverdue > 0 ? '⚠️ Atenção' : '✅ OK'})\n• A Receber: ${fmt(Math.max(0, fin.totalPendingReceivable - fin.totalOverdue))}\n\n**Operações**\n• Treinamentos Realizados: ${trn.completedEvents}\n• Horas de Consultoria: ${trn.events.filter(e => e.status === 'realizado' || e.status === 'concluido').reduce((s, e) => s + e.hoursDuration, 0)}h\n• Mentorias Realizadas: ${men.sessions.length}\n• Documentos: ${doc.documents.length}\n\n> Relatório gerado automaticamente com dados do sistema.`
    }
    if (msg.includes('financeiro') || msg.includes('financ')) {
      const ticketMedio = crm.deals.length ? crm.deals.reduce((s, d) => s + d.value, 0) / crm.deals.length : 0
      const topClientes = fin.revenueByClient.slice(0, 3).map(c => '• ' + c.companyName + ': ' + fmt(c.total)).join('\n')
      return '💰 **Relatório Financeiro — ' + new Date().toLocaleDateString('pt-BR') + '**\n\n**Receitas**\n• Receita Bruta: ' + fmt(fin.dre.grossRevenue) + '\n• Recebido: ' + fmt(fin.totalReceived) + '\n• MRR: ' + fmt(fin.mrr) + ' | ARR: ' + fmt(fin.arr) + '\n• A Receber: ' + fmt(fin.totalPendingReceivable) + '\n\n**Despesas**\n• Total: ' + fmt(fin.dre.operatingExpenses) + '\n• Pagas: ' + fmt(fin.totalPaidPayable) + '\n\n**Indicadores**\n• Margem: ' + fin.dre.profitMargin.toFixed(1) + '%\n• Inadimplência: ' + fmt(fin.totalOverdue) + '\n• Ticket Médio: ' + fmt(ticketMedio) + '\n\n**Top Clientes por Receita**\n' + topClientes
    }
    if (msg.includes('comercial')) {
      const deals = crm.deals
      const won = deals.filter(d => d.stage === 'Cliente ativo' || d.stage === 'Contrato aprovado').length
      const stages = ['Lead novo', 'Proposta enviada', 'Negociação', 'Contrato aprovado']
      const funnel = stages.map(s => '• ' + s + ': ' + deals.filter(d => d.stage === s).length).join('\n')
      return '📈 **Relatório Comercial**\n\n**Pipeline**\n• Total de Deals: ' + deals.length + '\n• Leads Ativos: ' + deals.filter(d => !['Cliente perdido', 'Cliente ativo'].includes(d.stage)).length + '\n• Convertidos: ' + won + '\n• Taxa de Conversão: ' + (deals.length ? (won / deals.length * 100).toFixed(1) : '0') + '%\n• Pipeline Total: ' + fmt(deals.reduce((s, d) => s + d.value, 0)) + '\n\n**Funil**\n' + funnel
    }
    if (msg.includes('treinamento')) {
      return `🎓 **Relatório de Treinamentos**\n\n**Realizados**: ${trn.completedEvents}\n**Agendados**: ${trn.scheduledEvents}\n**Participantes**: ${trn.totalRegisteredParticipants}\n**Presença**: ${trn.attendanceRate.toFixed(0)}%\n**Certificados**: ${trn.certificatesIssued}\n**NPS Médio**: ${Math.round(trn.averageNps)}/100\n**Receita**: ${fmt(trn.totalRevenue)}\n\n**Feedbacks Recentes**\n${trn.feedbacks.slice(-3).map(f => `• NPS ${f.nps} — ${f.comments || ''}`).join('\n')}`
    }
    if (msg.includes('mentoria')) {
      return `💡 **Relatório de Mentorias**\n\n**Sessões Realizadas**: ${men.sessions.filter(s => s.status === 'realizada').length}\n**Agendadas**: ${men.sessions.filter(s => s.status === 'agendada').length}\n**Participantes**: ${men.participants.length}\n**PDIs Ativos**: ${men.activePDIs}\n**Metas Concluídas**: ${men.completedGoals}\n**Metas em Atraso**: ${men.overdueGoals}\n\n**Últimas Sessões**\n${men.sessions.filter(s => s.status === 'realizada').slice(-3).map(s => `• ${s.title} — ${new Date(s.date).toLocaleDateString('pt-BR')}`).join('\n')}`
    }
    if (msg.includes('nr01')) {
      return `🛡️ **Relatório NR-01**\n\n**Riscos**\n• Total Mapeados: ${crm.risks.length}\n• Críticos: ${crm.risks.filter(r => r.level === 'high').length}\n• Médio: ${crm.risks.filter(r => r.level === 'medium').length}\n• Baixo: ${crm.risks.filter(r => r.level === 'low').length}\n\n**Ações**\n• Planos: ${crm.actionPlans.length}\n• Concluídos: ${crm.actionPlans.filter(a => a.status === 'completed').length}\n• Pendentes: ${crm.actionPlans.filter(a => a.status === 'pending').length}\n\n**Diagnósticos**: ${crm.diagnostics.length}\n**Entrevistas**: ${crm.interviews.length}`
    }
    return '📊 **Assistente de Relatórios**\n\nEscolha um tipo de relatório:\n• **executivo** — visão geral da empresa\n• **financeiro** — receitas, despesas, margem\n• **comercial** — pipeline, conversão\n• **treinamento** — eventos, NPS, participantes\n• **mentoria** — mentorias, PDIs, metas\n• **nr01** — riscos, planos de ação'
  }

  // ── COMMERCIAL ────────────────────────────────
  if (assistantType === 'commercial') {
    if (msg.includes('proposta') || msg.includes('orçamento')) {
      const company = crm.companies.find(c => msg.includes(c.id) || msg.includes(c.name.toLowerCase().substring(0, 8)))
      return `📄 **Proposta Comercial**\n\n**Empresa**: ${company?.tradeName || '[Nome do Cliente]'}\n**Data**: ${new Date().toLocaleDateString('pt-BR')}\n\n**Escopo Proposto**\n• Diagnóstico organizacional completo\n• Mapeamento de riscos psicossociais\n• Plano de ação personalizado\n• Treinamentos para lideranças\n• Relatórios mensais de acompanhamento\n\n**Investimento**\n• Consultoria: ${fmt(company ? 85000 : 0)}/mês\n• Implementação: ${fmt(company ? 25000 : 0)} (único)\n• Total 12 meses: ${fmt(company ? 1045000 : 0)}\n\n**Benefícios**\n✅ Conformidade com NR-01\n✅ Redução de afastamentos\n✅ Aumento de produtividade\n✅ Melhora do clima organizacional`
    }
    if (msg.includes('email') || msg.includes('e-mail')) {
      return `📧 **E-mail Comercial**\n\n**Assunto**: Acompanhamento — Proposta CrepaldiDH\n\nPrezado(a) [Nome do Contato],\n\nEspero que esta mensagem o encontre bem.\n\nConforme conversamos, estou enviando nossa proposta de serviços de desenvolvimento humano e organizacional para a [Empresa].\n\nA CrepaldiDH tem mais de 15 anos de experiência em diagnóstico organizacional, NR-01, treinamentos e desenvolvimento de lideranças, tendo atendido empresas como BR Distribuidora, Vale e Itaú.\n\nSegue em anexo a proposta completa para sua análise. Fico à disposição para esclarecer quaisquer dúvidas.\n\nAtenciosamente,\nEquipe Comercial CrepaldiDH\ncontato@crepaldidh.com.br`
    }
    if (msg.includes('whatsapp') || msg.includes('whats')) {
      return `💬 **Mensagem WhatsApp**\n\nOlá [Nome]! 👋\n\nTudo bem?\n\nPassando para dar continuidade à nossa conversa sobre as soluções de desenvolvimento humano para a [Empresa].\n\nGostaria de agendar uma reunião rápida para alinharmos os próximos passos? 🗓️\n\nFico no aguardo!\n\nAbraço,\n[Seu Nome] — CrepaldiDH`
    }
    if (msg.includes('follow') || msg.includes('oportunidade')) {
      const deals = crm.deals.filter(d => d.stage === 'Lead novo' || d.stage === 'Primeiro contato' || d.stage === 'Reunião agendada' || d.stage === 'Diagnóstico realizado' || d.stage === 'Proposta enviada')
      if (deals.length) {
        return `🎯 **Oportunidades Detectadas (${deals.length})**\n\n${deals.map(d => {
          const company = crm.companies.find(c => c.id === d.companyId)
          return `• **${company?.tradeName || 'N/A'}** — ${d.title} (${fmt(d.value)}) — ${d.stage}\n  Último follow-up: ${new Date(d.dueDate).toLocaleDateString('pt-BR')}\n  Responsável: ${crm.sellers.find(s => s.id === d.sellerId)?.name || 'N/A'}`
        }).join('\n')}\n\n> Recomendação: priorizar follow-up dos leads em negociação.`
      }
      return '🎯 **Oportunidades**\n\nNenhum lead em estágio inicial no momento.'
    }
    return '📈 **Assistente Comercial**\n\nComandos disponíveis:\n• **proposta** — cria proposta comercial\n• **e-mail** — gera e-mail de follow-up\n• **whatsapp** — mensagem para WhatsApp\n• **oportunidade** — identifica leads quentes\n• **follow-up** — sugestão de follow-up'
  }

  // ── NR01 ──────────────────────────────────────
  if (assistantType === 'nr01') {
    if (msg.includes('classificação') || msg.includes('classificar')) {
      return `🛡️ **Classificação de Riscos**\n\nCom base nos dados atuais:\n\n**Níveis Identificados**\n• Alto: ${crm.risks.filter(r => r.level === 'high').length} riscos\n• Médio: ${crm.risks.filter(r => r.level === 'medium').length} riscos\n• Baixo: ${crm.risks.filter(r => r.level === 'low').length} riscos\n\n**Critérios de Classificação**\n• **Alto**: Probabilidade alta + impacto severo\n  → Ação imediata (prazo: 30 dias)\n• **Médio**: Probabilidade média + impacto moderado\n  → Ação planejada (prazo: 60 dias)\n• **Baixo**: Probabilidade baixa + impacto leve\n  → Monitoramento contínuo\n\n> Recomendação: revisar classificação dos riscos críticos ${crm.risks.filter(r => r.level === 'high').length > 0 ? 'urgentemente' : 'no próximo ciclo de avaliação'}.`
    }
    if (msg.includes('plano') || msg.includes('ação') || msg.includes('mitig')) {
      return `📋 **Sugestão de Planos de Ação**\n\n**Plano 1 — Risco Crítico**\n• Ação: Implementar programa de acompanhamento psicológico\n• Prazo: 30 dias\n• Responsável: RH + Gestor da área\n• Indicador: Redução de 50% dos afastamentos\n\n**Plano 2 — Risco Médio**\n• Ação: Treinamento de lideranças em saúde mental\n• Prazo: 60 dias\n• Responsável: DHO\n• Indicador: NPS de liderança > 80/100\n\n**Plano 3 — Risco Baixo**\n• Ação: Campanha de conscientização mensal\n• Prazo: Contínuo\n• Responsável: Comunicação interna`
    }
    if (msg.includes('resumo') || msg.includes('recomendação')) {
      return `📊 **Resumo Técnico NR-01**\n\n**Status Geral**\n• Riscos mapeados: ${crm.risks.length}\n• Diagnósticos realizados: ${crm.diagnostics.length}\n• Entrevistas: ${crm.interviews.length}\n\n**Recomendações**\n1. Realizar mapeamento de riscos psicossociais (já incluso na NR-01)\n2. Implementar comitê de saúde mental\n3. Treinar lideranças para identificação precoce\n4. Estabelecer canal de acolhimento\n5. Monitorar indicadores trimestralmente\n\n> A NR-01 exige que todos os riscos sejam identificados, avaliados e controlados.`
    }
    return '🛡️ **Assistente NR-01**\n\nComandos:\n• **classificar** — sugere classificação de riscos\n• **plano de ação** — sugere planos de mitigação\n• **resumo** — resumo técnico com recomendações\n• **recomendação** — recomendações técnicas'
  }

  // ── TRAINING ──────────────────────────────────
  if (assistantType === 'training') {
    if (msg.includes('roteiro') || msg.includes('palestra') || msg.includes('script')) {
      return `🎓 **Roteiro de Palestra**\n\n**Tema**: Saúde Mental e Segurança Psicológica no Trabalho\n**Duração**: 60 minutos\n**Público**: Colaboradores e lideranças\n\n**Abertura (5 min)**\n• Boas-vindas + dinâmica de quebra-gelo\n• Contextualização do tema\n\n**Bloco 1 — O que é Saúde Mental? (10 min)**\n• Definição e mitos\n• Impacto no trabalho e na vida pessoal\n• Dados: ${trn.attendanceRate.toFixed(0)}% de presença em treinamentos anteriores\n\n**Bloco 2 — Fatores de Risco (15 min)**\n• Estresse, ansiedade, burnout\n• Assédio moral e relações tóxicas\n• Como identificar sinais\n\n**Bloco 3 — Prevenção (15 min)**\n• Estratégias individuais (autocuidado)\n• Estratégias organizacionais (cultura)\n• Canal de acolhimento\n\n**Bloco 4 — Perguntas e Encerramento (15 min)**\n• Q&A aberto\n• Material de apoio\n• Pesquisa de satisfação (NPS)`
    }
    if (msg.includes('conteúdo') || msg.includes('material')) {
      return `📚 **Conteúdo para Treinamento**\n\n**Módulo**: Segurança Psicológica\n**Formato**: Apresentação + apostila\n\n**Slide 1** — O que é segurança psicológica?\n• Definição de Amy Edmondson\n• Por que é importante?\n\n**Slide 2** — Os 4 estágios\n1. Inclusão — ser aceito\n2. Aprendizado — errar sem medo\n3. Contribuição — fazer a diferença\n4. Desafio — questionar o status quo\n\n**Slide 3** — Como construir?\n• Liderança vulnerável\n• Escuta ativa\n• Feedback sem medo\n• Erro como aprendizado\n\n**Atividade Prática**: Dinâmica "O Presente" — exercício de vulnerabilidade em grupo.`
    }
    if (msg.includes('avaliação') || msg.includes('feedback') || msg.includes('nps')) {
      const avgNps = trn.feedbacks.length ? Math.round(trn.feedbacks.reduce((s, f) => s + f.nps, 0) / trn.feedbacks.length) : 0
      return `📝 **Avaliação de Reação**\n\n**Modelo de Pesquisa Pós-Treinamento**\n\n1. **Clareza do conteúdo** (1-5)\n2. **Aplicabilidade prática** (1-5)\n3. **Didática do facilitador** (1-5)\n4. **Organização do evento** (1-5)\n5. **Recomendaria para um colega?** (NPS 0-10)\n6. **O que mais gostou?** (texto)\n7. **O que pode melhorar?** (texto)\n\n**NPS Atual**: ${avgNps}/100 (${trn.feedbacks.length} respostas)\n> Utilize este modelo para coletar feedback consistente após cada treinamento.`
    }
    return '🎓 **Assistente de Treinamentos**\n\nComandos:\n• **roteiro** — cria roteiro de palestra\n• **conteúdo** — gera material didático\n• **avaliação** — modelo de pesquisa de reação\n• **certificado** — modelo de certificado'
  }

  // ── MENTORING ─────────────────────────────────
  if (assistantType === 'mentoring') {
    if (msg.includes('resumo') || msg.includes('sessão')) {
      const recent = men.sessions.filter(s => s.status === 'realizada').slice(-1)[0]
      if (recent) return `💡 **Resumo da Sessão**\n\n**Título**: ${recent.title}\n**Data**: ${new Date(recent.date).toLocaleDateString('pt-BR')}\n**Duração**: ${recent.duration} min\n\n**Tópicos**\n${recent.topics.split(',').map(t => `• ${t.trim()}`).join('\n')}\n\n**Insights**\n${recent.insights || 'N/A'}\n\n**Plano de Ação**\n${recent.actionPlan || 'N/A'}\n\n**Próximos Passos**\n${recent.nextSteps || 'N/A'}`
      return '💡 **Resumo de Sessão**\n\nNenhuma sessão realizada encontrada.'
    }
    if (msg.includes('pdi') || msg.includes('meta') || msg.includes('competência')) {
      return `📋 **Sugestão de PDI**\n\n**Participante**: [Nome]\n**Período**: 6 meses\n\n**Metas Sugeridas**\n\n1. **Comunicação Assertiva**\n   • Ação: Participar de workshop de CNV\n   • Prazo: 60 dias\n   • Indicador: Feedback 360 > 4/5\n\n2. **Liderança Inspiradora**\n   • Ação: Mentoria semanal + leitura guiada\n   • Prazo: 90 dias\n   • Indicador: Engajamento da equipe > 80%\n\n3. **Inteligência Emocional**\n   • Ação: Diário de emoções + sessões de coaching\n   • Prazo: 180 dias\n   • Indicador: Redução de conflitos em 50%\n\n**Competências a Desenvolver**\n• ${men.competencies.slice(0, 4).map(c => c.name).join(', ')}`
    }
    if (msg.includes('devolutiva') || msg.includes('feedback')) {
      return `💬 **Devolutiva de Mentoria**\n\nPrezado(a) [Nome],\n\nGostaria de compartilhar algumas observações sobre nossa sessão de mentoria:\n\n**Pontos Fortes**\n• Capacidade analítica e visão estratégica\n• Comprometimento com o desenvolvimento\n• Boa comunicação interpessoal\n\n**Oportunidades de Desenvolvimento**\n• Gestão do tempo — priorização de tarefas\n• Delegação — confiar mais na equipe\n• Autocuidado — equilibrar vida pessoal/profissional\n\n**Próximos Passos**\n1. Aplicar feedback SBI com 3 colaboradores\n2. Praticar escuta ativa em reuniões\n3. Relatório de progresso em 30 dias\n\n> Seguimos juntos nesta jornada de desenvolvimento!`
    }
    return '💡 **Assistente de Mentorias/PDI**\n\nComandos:\n• **resumo** — resume última sessão\n• **pdi** — sugere plano de desenvolvimento\n• **meta** — sugere metas por competência\n• **devolutiva** — gera devolutiva para o mentorado'
  }

  // ── FINANCIAL ─────────────────────────────────
  if (assistantType === 'financial') {
    if (msg.includes('resumo') || msg.includes('mês') || msg.includes('mensal')) {
      return `💰 **Resumo Financeiro — ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric'})}**\n\n**Receitas**\n• Faturamento: ${fmt(fin.dre.grossRevenue)}\n• Recebido: ${fmt(fin.totalReceived)}\n• MRR: ${fmt(fin.mrr)}\n\n**Despesas**\n• Total: ${fmt(fin.dre.operatingExpenses)}\n• Pagas: ${fmt(fin.totalPaidPayable)}\n\n**Resultado**\n• Lucro Líquido: ${fmt(fin.dre.netProfit)}\n• Margem: ${fin.dre.profitMargin.toFixed(1)}%\n\n**A Receber**\n• Pendente: ${fmt(Math.max(0, fin.totalPendingReceivable - fin.totalOverdue))}\n• Vencido: ${fmt(fin.totalOverdue)}`
    }
    if (msg.includes('inadimplência') || msg.includes('atraso') || msg.includes('cobrança')) {
      const overdue = fin.receivables.filter(r => r.status === 'overdue')
      return `⚠️ **Relatório de Inadimplência**\n\n**Total em Atraso**: ${fmt(fin.totalOverdue)}\n**Contas Vencidas**: ${overdue.length}\n\n${overdue.length ? overdue.map(r => `• **${r.companyName}** — ${r.serviceName} — ${fmt(r.amount)} — Vencimento: ${new Date(r.dueDate).toLocaleDateString('pt-BR')}`).join('\n') : 'Nenhuma conta vencida no momento.'}\n\n**Sugestão de Cobrança**\n1. Enviar e-mail de cortesia (7 dias atraso)\n2. Ligação de acompanhamento (15 dias)\n3. Notificação formal (30 dias)\n4. Negociação de parcelamento (60 dias)`
    }
    if (msg.includes('projetar') || msg.includes('projeção') || msg.includes('receita')) {
      return `📈 **Projeção de Receita**\n\n**Base Atual**\n• MRR: ${fmt(fin.mrr)}\n• ARR: ${fmt(fin.arr)}\n• Crescimento mensal estimado: 5-8%\n\n**Projeção 12 Meses**\n• Mês 1: ${fmt(fin.mrr)}\n• Mês 3: ${fmt(fin.mrr * 1.06 ** 3)}\n• Mês 6: ${fmt(fin.mrr * 1.06 ** 6)}\n• Mês 12: ${fmt(fin.mrr * 1.06 ** 12)}\n\n> Projeção baseada em crescimento conservador de 6% a.m.\n> Fatores de risco: sazonalidade, turnover de clientes, cenário econômico.`
    }
    if (msg.includes('rentabilidade') || msg.includes('análise')) {
      return `📊 **Análise de Rentabilidade**\n\n**Geral**\n• Margem: ${fin.dre.profitMargin.toFixed(1)}%\n• ${fin.dre.profitMargin > 20 ? '✅ Saudável' : fin.dre.profitMargin > 0 ? '⚠️ Atenção' : '🔴 Prejuízo'}\n\n**Por Cliente**\n${fin.revenueByClient.slice(0, 3).map(c => `• ${c.companyName}: ${fmt(c.total)}`).join('\n')}\n\n**Recomendações**\n1. Focar em serviços de maior margem (mentorias e diagnósticos)\n2. Reduzir inadimplência — ${fmt(fin.totalOverdue)} em risco\n3. Revisar despesas recorrentes abaixo do esperado`
    }
    if (msg.includes('nota fiscal') || msg.includes('nf-e') || msg.includes('nota')) {
      const totalInvoices = fin.invoices.length
      const recent = fin.invoices.slice(-3)
      return `📄 **Notas Fiscais de Entrada**\n\n**Total registradas**: ${totalInvoices}\n\n${recent.length ? `**Últimas notas:**\n${recent.map(inv => {
        const rec = fin.receivables.find(r => r.id === inv.receivableId)
        return `• **${inv.invoiceNumber}** — ${rec ? rec.companyName : 'N/A'} — ${rec ? fmt(rec.amount) : 'N/A'} — ${new Date(inv.issueDate).toLocaleDateString('pt-BR')} (${inv.status})`
      }).join('\n')}` : 'Nenhuma nota fiscal registrada ainda.'}\n\n💡 Para **cadastrar uma nova nota**, digite algo como:\n> "Cadastrar nota fiscal para BR Distribuidora, valor R$ 8.500, vencimento 20/07/2026"\n\nFormato: **Cliente, valor, vencimento** (e opcional: serviço, número da nota)`
    }
    return '💰 **Assistente Financeiro**\n\nComandos:\n• **resumo** — resumo financeiro do mês\n• **inadimplência** — contas vencidas e cobranças\n• **projeção** — projeção de receita futura\n• **rentabilidade** — análise de rentabilidade\n• **nota fiscal** — consultar ou cadastrar notas fiscais de entrada'
  }

  return '🤖 **IA CrepaldiDH**\n\nPosso ajudar com informações sobre clientes, projetos, finanças, treinamentos, mentorias, NR-01, agenda e documentos. Pergunte sobre qualquer tema!'
}

export function AiProvider({ children }: { children: React.ReactNode }) {
  const crm = useCrm()
  const fin = useFinancial()
  const trn = useTrainings()
  const men = useMentoring()
  const cal = useCalendar()
  const doc = useDocuments()

  const [conversations, setConversations] = useState<AiConversation[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [assistantType, setAssistantType] = useState<AiAssistantType>('chat')
  const [config, setConfigState] = useState<AiConfig>({ tone: 'professional', responseSize: 'balanced', maxHistory: 50 })
  const [prompts, setPrompts] = useState<AiPrompt[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai_conversations')
      if (stored) { setConversations(JSON.parse(stored)) }
      else {
        const seed: AiConversation[] = [
          { id: 'ai-seed-1', title: 'Análise de clientes ativos', assistantType: 'chat', messages: [
            { id: 'm1', role: 'user', content: 'Quais são os clientes ativos da CrepaldiDH?', timestamp: new Date(Date.now() - 86400000).toISOString() },
            { id: 'm2', role: 'assistant', content: generateAIResponse('chat', 'quais são os clientes ativos', crm, fin, trn, men, cal, doc), timestamp: new Date(Date.now() - 86300000).toISOString() },
          ], favorite: true, createdAt: new Date(Date.now() - 86400000).toISOString(), updatedAt: new Date(Date.now() - 86300000).toISOString() },
          { id: 'ai-seed-2', title: 'Resumo financeiro do mês', assistantType: 'financial', messages: [
            { id: 'm3', role: 'user', content: 'Resumo financeiro deste mês', timestamp: new Date(Date.now() - 172800000).toISOString() },
            { id: 'm4', role: 'assistant', content: generateAIResponse('financial', 'resumo', crm, fin, trn, men, cal, doc), timestamp: new Date(Date.now() - 172700000).toISOString() },
          ], favorite: true, createdAt: new Date(Date.now() - 172800000).toISOString(), updatedAt: new Date(Date.now() - 172700000).toISOString() },
          { id: 'ai-seed-3', title: 'Relatório executivo', assistantType: 'reports', messages: [
            { id: 'm5', role: 'user', content: 'Gere um relatório executivo', timestamp: new Date(Date.now() - 259200000).toISOString() },
            { id: 'm6', role: 'assistant', content: generateAIResponse('reports', 'executivo', crm, fin, trn, men, cal, doc), timestamp: new Date(Date.now() - 259100000).toISOString() },
          ], favorite: false, createdAt: new Date(Date.now() - 259200000).toISOString(), updatedAt: new Date(Date.now() - 259100000).toISOString() },
        ]
        setConversations(seed)
      }
    } catch { setConversations([]) }
    try { const p = localStorage.getItem('ai_prompts'); if (p) setPrompts(JSON.parse(p)) } catch { setPrompts([]) }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('ai_conversations', JSON.stringify(conversations)) } catch {}
  }, [conversations])

  useEffect(() => {
    try { localStorage.setItem('ai_prompts', JSON.stringify(prompts)) } catch {}
  }, [prompts])

  const setConfig = useCallback((c: Partial<AiConfig>) => setConfigState(prev => ({ ...prev, ...c })), [])

  const currentConversation = useMemo(() => conversations.find(c => c.id === currentConversationId) || null, [conversations, currentConversationId])

  const newConversation = useCallback(() => {
    const id = generateId()
    const conv: AiConversation = { id, title: 'Nova conversa', assistantType, messages: [], favorite: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
    setConversations(prev => [conv, ...prev])
    setCurrentConversationId(id)
  }, [assistantType])

  const selectConversation = useCallback((id: string) => {
    setCurrentConversationId(id)
    const conv = conversations.find(c => c.id === id)
    if (conv) setAssistantType(conv.assistantType)
  }, [conversations])

  const deleteConversation = useCallback((id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id))
    if (currentConversationId === id) setCurrentConversationId(null)
  }, [currentConversationId])

  const toggleFavorite = useCallback((id: string) => {
    setConversations(prev => prev.map(c => c.id === id ? { ...c, favorite: !c.favorite } : c))
  }, [])

  const sendMessage = useCallback(async (content: string, ctx?: { companyId?: string; projectId?: string }) => {
    if (!content.trim()) return

    let convId = currentConversationId
    if (!convId) {
      convId = generateId()
      const conv: AiConversation = { id: convId, title: content.substring(0, 40), assistantType, messages: [], favorite: false, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), companyId: ctx?.companyId, projectId: ctx?.projectId }
      setConversations(prev => [conv, ...prev])
      setCurrentConversationId(convId)
    }

    const userMsg: AiMessage = { id: generateId(), role: 'user', content, timestamp: new Date().toISOString() }
    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, userMsg], updatedAt: new Date().toISOString() } : c))

    setLoading(true)
    await new Promise(r => setTimeout(r, 800 + Math.random() * 1200))

    // ── Detect invoice creation intent ──────────────
    const isInvoiceCreate = /(cadastr|criar|emitir|registrar|lançar|nova|novo)\s.*(nota\s*fiscal|nf-e|nf)/i.test(content)
    let response: string

    if (isInvoiceCreate && fin) {
      // Try to extract company name from CRM companies
      const matchedCompany = crm.companies.find(c =>
        content.toLowerCase().includes(c.name.toLowerCase().substring(0, 6)) ||
        content.toLowerCase().includes((c.tradeName || '').toLowerCase().substring(0, 6))
      )

      // Extract amount via regex
      const amountMatch = content.match(/(?:R\$\s*)?([\d.,]+)/)
      const parsedAmount = amountMatch ? parseFloat(amountMatch[1].replace(/\./g, '').replace(',', '.')) : 0

      // Extract due date via regex (dd/mm or dd/mm/yyyy)
      const dateMatch = content.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?/)
      const today = new Date()
      let dueDate = ''
      if (dateMatch) {
        const day = parseInt(dateMatch[1]), month = parseInt(dateMatch[2]) - 1
        const year = dateMatch[3] ? parseInt(dateMatch[3]) : (month < today.getMonth() ? today.getFullYear() + 1 : today.getFullYear())
        const d = new Date(year, month, day)
        dueDate = d.toISOString().split('T')[0]
      } else {
        // Default: 30 days from now
        const d = new Date()
        d.setDate(d.getDate() + 30)
        dueDate = d.toISOString().split('T')[0]
      }

      if (matchedCompany && parsedAmount > 0) {
        const invoiceNumber = `NF-e-${Date.now().toString().slice(-6)}`
        const serviceName = 'Serviços DHO'

        const rec = fin.addReceivable({
          companyId: matchedCompany.id,
          companyName: matchedCompany.tradeName || matchedCompany.name,
          serviceName,
          amount: parsedAmount,
          dueDate,
          status: 'pending',
          notes: `Criado via IA — ${content.substring(0, 80)}`,
        })

        fin.addInvoice({
          receivableId: rec.id,
          invoiceNumber,
          issueDate: new Date().toISOString().split('T')[0],
          status: 'draft',
        })

        response = `✅ **Nota Fiscal cadastrada com sucesso!**\n\n📄 **${invoiceNumber}**\n🏢 Cliente: **${matchedCompany.tradeName || matchedCompany.name}**\n💰 Valor: **${fmt(parsedAmount)}**\n📅 Vencimento: **${new Date(dueDate + 'T12:00:00').toLocaleDateString('pt-BR')}**\n📋 Serviço: ${serviceName}\n📌 Status: Rascunho\n\nA nota foi vinculada à conta a receber **${rec.id}**. Para faturar, acesse o módulo **Financeiro > Contas a Receber** e emita o documento fiscal oficial.`
      } else if (!matchedCompany && parsedAmount > 0) {
        const clientList = crm.companies.filter(c => c.status === 'active').slice(0, 8)
        response = `⚠️ **Não identifiquei o cliente.** Encontrei estes clientes ativos:\n\n${clientList.map(c => `• **${c.tradeName || c.name}**`).join('\n')}\n\n💡 *Tente novamente incluindo o nome do cliente, por exemplo:*\n> "Cadastrar nota fiscal para **${clientList[0]?.tradeName || 'Cliente'}**, valor R$ 10.000, vencimento 15/07/2026"`
      } else if (parsedAmount === 0) {
        response = `⚠️ **Não identifiquei o valor da nota.** Inclua o valor no formato:\n\n> "Cadastrar nota fiscal para [cliente], valor **R$ 8.500**, vencimento 20/07/2026"`
      } else {
        response = `⚠️ **Não foi possível cadastrar a nota.** Verifique os dados e tente novamente no formato:\n\n> "Cadastrar nota fiscal para NOME DO CLIENTE, valor R$ X.XXX, vencimento DD/MM/AAAA"`
      }
    } else {
      response = generateAIResponse(assistantType, content, crm, fin, trn, men, cal, doc)
    }

    const assistantMsg: AiMessage = { id: generateId(), role: 'assistant', content: response, timestamp: new Date().toISOString() }

    setConversations(prev => prev.map(c => c.id === convId ? { ...c, messages: [...c.messages, assistantMsg], title: c.messages.length === 0 ? content.substring(0, 40) : c.title, updatedAt: new Date().toISOString() } : c))
    setLoading(false)
  }, [currentConversationId, assistantType, crm, fin, trn, men, cal, doc])

  const generateReport = useCallback(async (type: string, params: Record<string, string>): Promise<string> => {
    const msg = type + ' ' + Object.values(params).join(' ')
    await new Promise(r => setTimeout(r, 500))
    return generateAIResponse('reports', msg, crm, fin, trn, men, cal, doc)
  }, [crm, fin, trn, men, cal, doc])

  const addPrompt = useCallback((p: Omit<AiPrompt, 'id' | 'usageCount'>) => {
    const newP: AiPrompt = { ...p, id: generateId(), usageCount: 0 }
    setPrompts(prev => [...prev, newP])
  }, [])

  const deletePrompt = useCallback((id: string) => setPrompts(prev => prev.filter(p => p.id !== id)), [])
  const usePrompt = useCallback((id: string) => setPrompts(prev => prev.map(p => p.id === id ? { ...p, usageCount: p.usageCount + 1 } : p)), [])

  const copyToClipboard = useCallback((text: string) => {
    if (typeof navigator !== 'undefined') navigator.clipboard.writeText(text)
  }, [])

  const formatResponse = useCallback((content: string): string => {
    return content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>')
      .replace(/•/g, '&nbsp;&nbsp;•')
      .replace(/> /g, '<span class="text-slate-400">→ </span>')
  }, [])

  return (
    <AiContext.Provider value={{
      conversations, currentConversationId, currentConversation, assistantType, setAssistantType,
      assistants: ASSISTANTS, prompts, config, setConfig, loading,
      newConversation, selectConversation, deleteConversation, toggleFavorite,
      sendMessage, generateReport, addPrompt, deletePrompt, usePrompt, copyToClipboard, formatResponse,
    }}>
      {children}
    </AiContext.Provider>
  )
}

export function useAi() {
  const ctx = useContext(AiContext)
  if (!ctx) throw new Error('useAi must be used within AiProvider')
  return ctx
}
