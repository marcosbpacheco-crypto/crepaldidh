'use client'

import React, { useState, useMemo } from 'react'
import { useCrm, Proposal, Contract } from '../context/CrmContext'
import { 
  FileText, Award, DollarSign, Calendar, Plus, Printer, 
  Trash2, X, Eye, CheckCircle2, AlertTriangle, RefreshCw, Paperclip,
  Brain, Sparkles, Download, Upload
} from 'lucide-react'

// Helper to provide realistic technical description for proposals based on CrepaldiDH services
const getServiceScope = (service: string): string => {
  switch (service) {
    case 'Diagnóstico Psicossocial':
      return 'Mapeamento completo dos riscos psicossociais no ambiente de trabalho através de questionários estruturados, entrevistas e grupos focais. Emissão de relatório quantitativo e qualitativo com plano de ação conforme recomendações da OMS e MTE.'
    case 'NR01':
      return 'Implementação do Gerenciamento de Riscos Ocupacionais (GRO) e Programa de Gerenciamento de Riscos (PGR), com foco específico na identificação, avaliação e controle dos fatores de risco psicossociais relacionados ao trabalho.'
    case 'Palestras':
      return 'Ciclo de palestras de conscientização de 1h a 2h de duração, abordando temas como Saúde Mental no Trabalho, Gestão do Estresse, Burnout, Equilíbrio Vida-Trabalho e Inteligência Emocional.'
    case 'Treinamentos':
      return 'Treinamentos técnicos e comportamentais in-company. Inclui material de apoio, dinâmicas práticas, avaliações de reação e certificados de conclusão de acordo com a metodologia ativa CrepaldiDH.'
    case 'SIPAT':
      return 'Organização completa e curadoria de conteúdo para a Semana Interna de Prevenção de Acidentes do Trabalho. Inclui intervenções dinâmicas, jogos corporativos e palestras integradas sobre segurança comportamental e saúde mental.'
    case 'Mentorias':
      return 'Processo individual ou em grupo focado no desenvolvimento acelerado de competências estratégicas para profissionais-chave da organização, com sessões quinzenais estruturadas.'
    case 'Desenvolvimento de Lideranças':
      return 'Programa vivencial para formação de líderes humanos e de alta performance. Módulos focados em comunicação não-violenta, feedback construtivo, gestão de conflitos, liderança situacional e segurança psicológica.'
    case 'Cultura Organizacional':
      return 'Consultoria especializada para diagnóstico, desenho e consolidação dos valores, crenças e comportamentos desejados pela organização. Alinhamento estratégico e ações práticas de aculturamento.'
    case 'PDI':
      return 'Estruturação do Plano de Desenvolvimento Individual para os colaboradores da empresa. Mapeamento de competências atuais, gaps de desenvolvimento e definição de cronograma de capacitação personalizada.'
    case 'Consultoria Estratégica':
      return 'Assessoria executiva continuada para a diretoria e conselho de administração nas tomadas de decisão que impactam o capital humano, reorganização estrutural, governança e remuneração estratégica.'
    default:
      return 'Prestação de serviços corporativos em desenvolvimento humano e saúde organizacional personalizada sob demanda.'
  }
}

const DEFAULT_TEMPLATE = `CONTRATO DE PRESTAÇÃO DE SERVIÇOS

Pelo presente instrumento, de um lado [CREDENCIADO], doravante denominado CONTRATADA, e de outro lado [CLIENTE], doravante denominado CONTRATANTE, têm entre si justo e acertado o presente Contrato de Prestação de Serviços, mediante as cláusulas e condições seguintes:

CLÁUSULA PRIMEIRA - DO OBJETO
A CONTRATADA se obriga a prestar ao CONTRATANTE os serviços de [SERVICO], conforme escopo detalhado no Anexo I.

CLÁUSULA SEGUNDA - DO PRAZO E VIGÊNCIA
O presente contrato terá vigência de [VIGENCIA], iniciando-se em [DATA_INICIO] e encerrando-se em [DATA_FIM].

CLÁUSULA TERCEIRA - DO VALOR E CONDIÇÕES DE PAGAMENTO
O valor total do presente contrato é de R$ [VALOR], a ser pago conforme condições estabelecidas na Proposta Comercial.

CLÁUSULA QUARTA - DAS OBRIGAÇÕES DA CONTRATADA
A CONTRATADA se compromete a executar os serviços com a mais perfeita técnica e diligência, alocando profissionais qualificados e utilizando metodologias atualizadas em Desenvolvimento Humano e Organizacional.

CLÁUSULA QUINTA - DAS OBRIGAÇÕES DO CONTRATANTE
O CONTRATANTE se compromete a fornecer todas as informações necessárias, disponibilizar os recursos solicitados e garantir o acesso aos colaboradores para a execução dos serviços contratados.

CLÁUSULA SEXTA - DA CONFIDENCIALIDADE
As partes se comprometem a manter sigilo absoluto sobre todas as informações confidenciais compartilhadas durante a execução deste contrato, em conformidade com a LGPD.

CLÁUSULA SÉTIMA - DA RESCISÃO
Qualquer das partes poderá rescindir o presente contrato mediante notificação prévia de 30 (trinta) dias, sem prejuízo das obrigações já contraídas.

E, por assim estarem justas e contratadas, as partes assinam o presente instrumento em 2 (duas) vias de igual teor e forma.

[DATA_LOCAL], [DATA_EXTENSO]

__________________________              __________________________
CREPALDI DESENVOLVIMENTO HUMANO        CONTRATANTE`

function generateAiContract(template: string, data: {
  client: string
  service: string
  value: string
  duration: string
  startDate: string
  endDate: string
  local: string
  dateExtenso: string
}): string {
  return template
    .replace(/\[CREDENCIADO\]/g, 'CREPALDI DESENVOLVIMENTO HUMANO LTDA')
    .replace(/\[CLIENTE\]/g, data.client)
    .replace(/\[SERVICO\]/g, data.service)
    .replace(/\[VALOR\]/g, data.value)
    .replace(/\[VIGENCIA\]/g, data.duration)
    .replace(/\[DATA_INICIO\]/g, data.startDate)
    .replace(/\[DATA_FIM\]/g, data.endDate)
    .replace(/\[DATA_LOCAL\]/g, data.local)
    .replace(/\[DATA_EXTENSO\]/g, data.dateExtenso)
}

const DEFAULT_PROPOSAL_TEMPLATE = `PROPOSTA COMERCIAL - CREPALDI DESENVOLVIMENTO HUMANO

REF: PRO-2026-[CODIGO]

1. APRESENTAÇÃO
A Crepaldi Desenvolvimento Humano apresenta sua proposta comercial para [CLIENTE], visando a prestação de serviços em Desenvolvimento Humano e Organizacional.

2. OBJETO
Prestação de serviços de [SERVICO], conforme escopo detalhado no Anexo Técnico deste documento.

3. ESCOPO DO SERVIÇO
[SCOPE]

4. METODOLOGIA
A Crepaldi DH adota abordagem humanizada e baseada em evidências, com entregas construídas em cocriação com o cliente, alinhadas à cultura corporativa e às diretrizes de compliance em SST e ESG.

5. INVESTIMENTO
O valor total da proposta é de R$ [VALOR], com vigência de [VIGENCIA].

6. CONDIÇÕES DE PAGAMENTO
- Faturamento por Nota Fiscal de Serviço
- Pagamento via Boleto Bancário
- Condição: [CONDICAO_PAGAMENTO]

7. PRAZO DE VALIDADE
Esta proposta tem validade de 15 (quinze) dias a contar da data de emissão.

8. DADOS PARA EMPENHO
Razão Social: CREPALDI DESENVOLVIMENTO HUMANO LTDA
CNPJ: 00.000.000/0001-00
Endereço: [ENDERECO]

Atenciosamente,

__________________________
CREPALDI DESENVOLVIMENTO HUMANO
Diretoria Comercial

[DATA_LOCAL], [DATA_EXTENSO]`

function generateAiProposal(template: string, data: {
  client: string
  service: string
  scope: string
  value: string
  duration: string
  local: string
  dateExtenso: string
  codigo: string
}): string {
  return template
    .replace(/\[CLIENTE\]/g, data.client)
    .replace(/\[SERVICO\]/g, data.service)
    .replace(/\[SCOPE\]/g, data.scope)
    .replace(/\[VALOR\]/g, data.value)
    .replace(/\[VIGENCIA\]/g, data.duration)
    .replace(/\[CONDICAO_PAGAMENTO\]/g, 'Pagamento em parcelas mensais fixas ou sinal de 50% e 50% na conclusão')
    .replace(/\[ENDERECO\]/g, 'Campinas - SP')
    .replace(/\[DATA_LOCAL\]/g, data.local)
    .replace(/\[DATA_EXTENSO\]/g, data.dateExtenso)
    .replace(/\[CODIGO\]/g, data.codigo)
}

function dateExtenso(): string {
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const d = new Date()
  return `${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

export const CrmProposals: React.FC = () => {
  const { 
    proposals, contracts, companies, services,
    addProposal, updateProposalStatus, addContract
  } = useCrm()

  // 1. Tab State: 'proposals' | 'contracts'
  const [activeTab, setActiveTab] = useState<'proposals' | 'contracts'>('proposals')
  
  // Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [previewProposal, setPreviewProposal] = useState<Proposal | null>(null)

  // Forms
  const [proposalForm, setProposalForm] = useState({
    companyId: '',
    service: services[0] || '',
    value: 0,
    duration: '12 meses',
    status: 'draft' as Proposal['status'],
    notes: ''
  })

  // Attachment upload fake state
  const [selectedContractForAttach, setSelectedContractForAttach] = useState<string | null>(null)
  const [fakeAttachName, setFakeAttachName] = useState('')

  // AI Contract Generator State
  const [showAiGenerator, setShowAiGenerator] = useState(false)
  const [aiTemplate, setAiTemplate] = useState(() => {
    try { return localStorage.getItem('crm_contract_template') || DEFAULT_TEMPLATE } catch { return DEFAULT_TEMPLATE }
  })
  const [aiCompanyId, setAiCompanyId] = useState('')
  const [aiProposalId, setAiProposalId] = useState('')
  const [aiService, setAiService] = useState('')
  const [aiValue, setAiValue] = useState(0)
  const [aiDuration, setAiDuration] = useState('12 meses')
  const [aiGeneratedContract, setAiGeneratedContract] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiEditMode, setAiEditMode] = useState(false)

  // AI Proposal Generator State
  const [showAiProposalGenerator, setShowAiProposalGenerator] = useState(false)
  const [aiPropTemplate, setAiPropTemplate] = useState(() => {
    try { return localStorage.getItem('crm_proposal_template') || DEFAULT_PROPOSAL_TEMPLATE } catch { return DEFAULT_PROPOSAL_TEMPLATE }
  })
  const [aiPropCompanyId, setAiPropCompanyId] = useState('')
  const [aiPropService, setAiPropService] = useState('')
  const [aiPropValue, setAiPropValue] = useState(0)
  const [aiPropDuration, setAiPropDuration] = useState('12 meses')
  const [aiPropCondPag, setAiPropCondPag] = useState('Pagamento em parcelas mensais fixas')
  const [aiGeneratedProposal, setAiGeneratedProposal] = useState('')
  const [aiPropLoading, setAiPropLoading] = useState(false)
  const [aiPropEditMode, setAiPropEditMode] = useState(false)

  // 2. Computed Names Mapping
  const companyNameMap = useMemo(() => {
    const map: Record<string, string> = {}
    companies.forEach(c => {
      map[c.id] = c.tradeName || c.name
    })
    return map
  }, [companies])

  // 3. Handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!proposalForm.companyId) {
      alert('Selecione uma empresa.')
      return
    }

    addProposal(proposalForm)
    setIsCreateModalOpen(false)
    setProposalForm({
      companyId: '',
      service: services[0] || '',
      value: 0,
      duration: '12 meses',
      status: 'draft',
      notes: ''
    })
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="space-y-6 animate-fade-in flex flex-col h-[calc(100vh-140px)]">
      
      {/* Sub Tabs and Actions */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        
        {/* Navigation Buttons */}
        <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto">
          <button
            onClick={() => setActiveTab('proposals')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'proposals' ? 'bg-white text-brand-teal shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <FileText className="w-4 h-4" />
            Propostas
          </button>
          <button
            onClick={() => setActiveTab('contracts')}
            className={`flex-1 sm:flex-none px-6 py-2 rounded-lg font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'contracts' ? 'bg-white text-brand-blue shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Award className="w-4 h-4" />
            Contratos
          </button>
        </div>

        {/* Action Button */}
        {activeTab === 'proposals' ? (
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="flex-1 sm:flex-none bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-teal/10 hover:shadow-lg"
            >
              <Plus className="w-4 h-4" />
              Nova Proposta
            </button>
            <button
              onClick={() => { setShowAiProposalGenerator(true); setAiGeneratedProposal(''); setAiPropService(''); setAiPropValue(0); setAiPropDuration('12 meses') }}
              className="flex-1 sm:flex-none bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 text-white font-bold text-xs py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md shadow-violet-600/10 hover:shadow-lg"
            >
              <Brain className="w-4 h-4" />
              Gerar Proposta com IA
            </button>
          </div>
        ) : (
          <button
            onClick={() => { setShowAiGenerator(true); setAiGeneratedContract(''); setAiProposalId(''); setAiService(''); setAiValue(0); setAiDuration('12 meses') }}
            className="w-full sm:w-auto bg-gradient-to-r from-brand-teal to-brand-blue hover:opacity-90 text-white font-bold text-xs py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-teal/10 hover:shadow-lg"
          >
            <Brain className="w-4 h-4" />
            Gerar Contrato com IA
          </button>
        )}
      </div>

      {/* Main Grid Content */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-100 shadow-sm overflow-y-auto">
        
        {activeTab === 'proposals' ? (
          
          /* PROPOSALS LIST TAB */
          <div className="overflow-x-auto text-xs min-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Serviço</th>
                  <th className="p-4">Vigência</th>
                  <th className="p-4">Valor</th>
                  <th className="p-4">Criada em</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-center">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {proposals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400">Nenhuma proposta comercial gerada.</td>
                  </tr>
                ) : (
                  proposals.map(prop => (
                    <tr key={prop.id} className="hover:bg-slate-50/40">
                      <td className="p-4 font-bold text-slate-800">{companyNameMap[prop.companyId] || 'Empresa'}</td>
                      <td className="p-4">{prop.service}</td>
                      <td className="p-4">{prop.duration}</td>
                      <td className="p-4 font-bold text-brand-blue">
                        R$ {prop.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4 text-slate-400">
                        {new Date(prop.createdAt).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4">
                        <select
                          value={prop.status}
                          onChange={e => updateProposalStatus(prop.id, e.target.value as Proposal['status'])}
                          className={`appearance-none font-bold px-3 py-1 rounded-full text-[9px] border focus:outline-none cursor-pointer ${
                            prop.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            prop.status === 'rejected' ? 'bg-red-50 text-red-700 border-red-200' :
                            prop.status === 'sent' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                            prop.status === 'negotiation' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-100 text-slate-600 border-slate-200'
                          }`}
                        >
                          <option value="draft">Rascunho</option>
                          <option value="sent">Enviada</option>
                          <option value="negotiation">Em Negociação</option>
                          <option value="approved">Aprovada</option>
                          <option value="rejected">Reprovada</option>
                        </select>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => setPreviewProposal(prop)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-brand-teal hover:text-white rounded-lg transition-colors font-bold text-[10px] inline-flex items-center gap-1 text-slate-600"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Visualizar PDF
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

        ) : (
          
          /* CONTRACTS LIST TAB */
          <div className="overflow-x-auto text-xs min-w-full">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 font-bold text-slate-500">
                  <th className="p-4">Título do Contrato</th>
                  <th className="p-4">Empresa</th>
                  <th className="p-4">Vigência</th>
                  <th className="p-4">Valor Total</th>
                  <th className="p-4">Anexos</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {contracts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-slate-400">Nenhum contrato ativo cadastrado.</td>
                  </tr>
                ) : (
                  contracts.map(contr => (
                    <tr key={contr.id} className="hover:bg-slate-50/40">
                      <td className="p-4 font-bold text-slate-800">{contr.title}</td>
                      <td className="p-4">{companyNameMap[contr.companyId] || 'Empresa'}</td>
                      <td className="p-4">
                        {new Date(contr.startDate).toLocaleDateString('pt-BR')} até {new Date(contr.endDate).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="p-4 font-bold text-brand-teal">
                        R$ {contr.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-1">
                          {contr.attachments.map((attach, idx) => (
                            <span key={idx} className="flex items-center gap-1 text-brand-blue font-semibold">
                              <Paperclip className="w-3 h-3 text-slate-400 flex-shrink-0" />
                              {attach}
                            </span>
                          ))}
                          
                          {/* Fictional upload trigger */}
                          {selectedContractForAttach === contr.id ? (
                            <div className="flex items-center gap-1.5 mt-1.5">
                              <input
                                type="text"
                                placeholder="Nome do arquivo..."
                                value={fakeAttachName}
                                onChange={e => setFakeAttachName(e.target.value)}
                                className="px-2 py-1 border border-slate-200 rounded text-[10px] focus:outline-none"
                              />
                              <button
                                onClick={() => {
                                  if (fakeAttachName) {
                                    contr.attachments.push(fakeAttachName)
                                    setFakeAttachName('')
                                    setSelectedContractForAttach(null)
                                  }
                                }}
                                className="px-2 py-1 bg-brand-teal text-white rounded font-bold text-[9px]"
                              >
                                Salvar
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setSelectedContractForAttach(contr.id)}
                              className="text-[10px] text-slate-400 hover:text-brand-teal font-bold block text-left"
                            >
                              + Anexar documento
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <span className={`px-2.5 py-0.5 rounded-full font-bold uppercase ${
                          contr.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                          contr.status === 'expired' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {contr.status === 'active' ? 'Ativo' : contr.status === 'expired' ? 'Expirado' : 'Encerrado'}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* ==========================================
          MODAL: CRIAR PROPOSTA
          ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-black text-lg">Nova Proposta Comercial</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-xs">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Empresa Destinatária *</label>
                <select
                  required
                  value={proposalForm.companyId}
                  onChange={e => setProposalForm({ ...proposalForm, companyId: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                >
                  <option value="">Selecione uma empresa...</option>
                  {companies.map(c => (
                    <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Serviço da Crepaldi</label>
                  <select
                    value={proposalForm.service}
                    onChange={e => setProposalForm({ ...proposalForm, service: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  >
                    {services.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Vigência do Contrato</label>
                  <input
                    type="text"
                    placeholder="Ex: 12 meses, 6 meses, Evento único"
                    value={proposalForm.duration}
                    onChange={e => setProposalForm({ ...proposalForm, duration: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Valor da Proposta (R$)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={proposalForm.value || ''}
                    onChange={e => setProposalForm({ ...proposalForm, value: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status Inicial</label>
                  <select
                    value={proposalForm.status}
                    onChange={e => setProposalForm({ ...proposalForm, status: e.target.value as Proposal['status'] })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  >
                    <option value="draft">Rascunho</option>
                    <option value="sent">Enviada</option>
                    <option value="negotiation">Em Negociação</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas Comerciais Específicas</label>
                <textarea
                  placeholder="Informações adicionais sobre faturamento ou condições especiais."
                  value={proposalForm.notes}
                  onChange={e => setProposalForm({ ...proposalForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs shadow-md"
                >
                  Criar Proposta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: VISUALIZADOR DE PDF DE PROPOSTA
          ========================================== */}
      {previewProposal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static">
          
          {/* Printable Container */}
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col h-[90vh] print:h-auto print:shadow-none print:border-none print:w-full">
            
            {/* Modal Control Bar (hidden when printing) */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between print:hidden">
              <span className="text-slate-600 font-bold text-xs">Visualização da Proposta Oficial</span>
              <div className="flex items-center gap-3">
                <button
                  onClick={handlePrint}
                  className="px-4 py-2 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-md shadow-brand-teal/10"
                >
                  <Printer className="w-4 h-4" />
                  Imprimir / Salvar PDF
                </button>
                <button
                  onClick={() => setPreviewProposal(null)}
                  className="p-1.5 hover:bg-slate-200 text-slate-400 hover:text-slate-600 rounded-full transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Simulated Printed Page Sheet */}
            <div className="flex-1 overflow-y-auto p-12 text-slate-800 print:overflow-visible print:p-0">
              <div className="max-w-[700px] mx-auto space-y-8 text-xs font-serif bg-white p-4 print:p-0">
                
                {/* Proposal Header (CrepaldiDH Identity) */}
                <div className="flex items-center justify-between border-b-2 border-brand-teal pb-6">
                  <div>
                    <h1 className="text-2xl font-black text-brand-blue tracking-tight font-sans">
                      CREPALDI <span className="text-brand-teal">DH</span>
                    </h1>
                    <p className="text-[10px] text-slate-400 font-semibold tracking-wider uppercase font-sans mt-0.5">
                      Desenvolvimento Humano & Saúde Organizacional
                    </p>
                  </div>
                  <div className="text-right font-sans text-[10px] text-slate-400">
                    <p>www.crepaldidh.com.br</p>
                    <p>contato@crepaldidh.com.br</p>
                    <p>Campinas - SP</p>
                  </div>
                </div>

                {/* Proposal Document Title */}
                <div className="text-center py-4">
                  <h2 className="text-lg font-black tracking-wide uppercase text-slate-800 font-sans">Proposta Comercial de Prestação de Serviços</h2>
                  <span className="text-[10px] text-slate-400 font-bold block mt-1 font-sans">REF: PRO-2026-{previewProposal.id.split('-')[1]}</span>
                </div>

                {/* Destinatário */}
                <div className="space-y-2 border border-slate-100 p-4 bg-slate-50/50 rounded-xl font-sans text-[11px] leading-relaxed">
                  <h4 className="font-bold text-slate-700 uppercase text-[10px] tracking-wider">Apresentado a:</h4>
                  {(() => {
                    const comp = companies.find(c => c.id === previewProposal.companyId)
                    return comp ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p><strong className="text-slate-600">Empresa:</strong> {comp.name}</p>
                          <p><strong className="text-slate-600">Nome Fantasia:</strong> {comp.tradeName}</p>
                          <p><strong className="text-slate-600">CNPJ:</strong> {comp.cnpj}</p>
                        </div>
                        <div>
                          <p><strong className="text-slate-600">Cidade/UF:</strong> {comp.city} - {comp.state}</p>
                          <p><strong className="text-slate-600">Responsável:</strong> {comp.respPrincipal || comp.respRH || 'À Diretoria'}</p>
                        </div>
                      </div>
                    ) : (
                      <p>Cliente Comercial</p>
                    )
                  })()}
                </div>

                {/* Escopo do Serviço */}
                <div className="space-y-3 font-sans">
                  <h3 className="text-sm font-bold text-brand-blue border-b border-slate-200 pb-1 uppercase">1. Objeto do Serviço</h3>
                  <p className="font-bold text-slate-700 text-xs">Serviço Selecionado: {previewProposal.service}</p>
                  <p className="text-slate-600 leading-relaxed text-xs text-justify">
                    {getServiceScope(previewProposal.service)}
                  </p>
                </div>

                {/* Metodologia CrepaldiDH */}
                <div className="space-y-3 font-sans">
                  <h3 className="text-sm font-bold text-brand-blue border-b border-slate-200 pb-1 uppercase">2. Metodologia de Trabalho</h3>
                  <p className="text-slate-600 leading-relaxed text-xs text-justify">
                    A Crepaldi Desenvolvimento Humano adota uma abordagem humanizada e baseada em evidências científicas. 
                    Nossa entrega baseia-se na coconstrução com os clientes, garantindo que o programa se alinhe com a cultura 
                    corporativa existente, gerando engajamento ativo dos colaboradores e assegurando conformidade com as diretrizes de compliance em SST e ESG.
                  </p>
                </div>

                {/* Condições Comerciais */}
                <div className="space-y-4 font-sans">
                  <h3 className="text-sm font-bold text-brand-blue border-b border-slate-200 pb-1 uppercase">3. Valores e Condições de Pagamento</h3>
                  
                  <div className="border border-slate-100 rounded-xl overflow-hidden">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 font-bold border-b border-slate-100">
                          <th className="p-3">Descrição do Escopo</th>
                          <th className="p-3">Vigência</th>
                          <th className="p-3 text-right">Valor do Investimento</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td className="p-3">{previewProposal.service} - Execução Geral</td>
                          <td className="p-3">{previewProposal.duration}</td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            R$ {previewProposal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div className="text-[11px] text-slate-500 leading-relaxed space-y-1 bg-slate-50/50 p-3 rounded-lg border border-slate-100/50">
                    <p><strong>Faturamento:</strong> Emissão de Nota Fiscal de Serviços via Boleto Bancário.</p>
                    <p><strong>Condição de Pagamento:</strong> Faturamento em parcelas mensais fixas ou sinal de 50% e 50% na conclusão.</p>
                    <p><strong>Validade desta proposta:</strong> 15 dias a contar da data de emissão.</p>
                    {previewProposal.notes && (
                      <p className="mt-2 text-slate-600 italic"><strong>Nota:</strong> {previewProposal.notes}</p>
                    )}
                  </div>
                </div>

                {/* Assinaturas */}
                <div className="pt-12 grid grid-cols-2 gap-12 font-sans text-center text-[11px] print:pt-24">
                  <div className="space-y-1">
                    <div className="border-t border-slate-300 w-48 mx-auto pt-2" />
                    <p className="font-bold">CREPALDI DESENVOLVIMENTO HUMANO</p>
                    <p className="text-slate-400">Diretoria Comercial</p>
                  </div>
                  <div className="space-y-1">
                    <div className="border-t border-slate-300 w-48 mx-auto pt-2" />
                    <p className="font-bold">DE ACORDO - CLIENTE</p>
                    <p className="text-slate-400">Assinatura e Carimbo</p>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: GERAR PROPOSTA COM IA
          ========================================== */}
      {showAiProposalGenerator && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-violet-600/5 to-indigo-600/5">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-600" />
                <h3 className="text-sm font-black text-slate-800">Gerar Proposta com Inteligência Artificial</h3>
                <span className="px-1.5 py-0.5 bg-violet-600/10 border border-violet-600/20 rounded text-[9px] font-bold text-violet-600">BETA</span>
              </div>
              <button onClick={() => setShowAiProposalGenerator(false)} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Panel - Configuration */}
              <div className="w-1/3 border-r border-slate-100 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Empresa</label>
                  <select value={aiPropCompanyId} onChange={e => {
                    setAiPropCompanyId(e.target.value)
                    const comp = companies.find(c => c.id === e.target.value)
                    if (comp) setAiPropService(comp.segment || '')
                  }} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                    <option value="">Selecione...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Serviço</label>
                  <select value={aiPropService} onChange={e => setAiPropService(e.target.value)} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                    {services.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Valor (R$)</label>
                    <input type="number" value={aiPropValue || ''} onChange={e => setAiPropValue(Number(e.target.value))} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Vigência</label>
                    <input value={aiPropDuration} onChange={e => setAiPropDuration(e.target.value)} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Condição de Pagamento</label>
                  <select value={aiPropCondPag} onChange={e => setAiPropCondPag(e.target.value)} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                    <option value="Pagamento em parcelas mensais fixas">Parcelas mensais fixas</option>
                    <option value="Sinal de 50% e 50% na conclusão">Sinal 50% + 50% conclusão</option>
                    <option value="Pagamento único à vista">À vista</option>
                    <option value="Faturamento pós-entrega">Pós-entrega</option>
                  </select>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Modelo de Proposta</label>
                    <button onClick={() => setAiPropEditMode(!aiPropEditMode)} className="text-[9px] font-semibold text-brand-teal hover:text-brand-teal/80">
                      {aiPropEditMode ? 'Visualizar' : 'Editar modelo'}
                    </button>
                  </div>
                  {aiPropEditMode ? (
                    <textarea value={aiPropTemplate} onChange={e => { setAiPropTemplate(e.target.value); localStorage.setItem('crm_proposal_template', e.target.value) }}
                      className="w-full text-[10px] border border-slate-200 rounded-lg px-3 py-2 h-60 font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none" />
                  ) : (
                    <pre className="w-full text-[10px] text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 h-60 overflow-y-auto font-mono whitespace-pre-wrap">{aiPropTemplate}</pre>
                  )}
                </div>

                <button onClick={() => {
                  if (!aiPropCompanyId) { alert('Selecione uma empresa.'); return }
                  if (!aiPropService) { alert('Informe o serviço.'); return }
                  setAiPropLoading(true)
                  setTimeout(() => {
                    const comp = companies.find(c => c.id === aiPropCompanyId)
                    const hoje = new Date()
                    const local = comp ? `${comp.city} - ${comp.state}` : 'Campinas - SP'
                    const generated = generateAiProposal(aiPropTemplate, {
                      client: comp?.name || 'CLIENTE',
                      service: aiPropService,
                      scope: getServiceScope(aiPropService),
                      value: aiPropValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                      duration: aiPropDuration,
                      local,
                      dateExtenso: dateExtenso(),
                      codigo: String(Date.now()).slice(-6),
                    })
                    setAiGeneratedProposal(generated)
                    setAiPropLoading(false)
                  }, 1200)
                }} disabled={aiPropLoading || !aiPropCompanyId}
                  className="w-full py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 text-white text-[11px] font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {aiPropLoading ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gerando proposta...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Gerar Proposta com IA</>
                  )}
                </button>
              </div>

              {/* Right Panel - Generated Proposal Preview */}
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">
                    {aiGeneratedProposal ? 'Proposta Gerada' : 'Pré-visualização'}
                  </span>
                  <div className="flex items-center gap-2">
                    {aiGeneratedProposal && (
                      <>
                        <button onClick={() => {
                          const blob = new Blob([aiGeneratedProposal], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url; a.download = `proposta_${(companies.find(c => c.id === aiPropCompanyId)?.name || 'cliente').replace(/\s+/g, '_')}.txt`
                          a.click(); URL.revokeObjectURL(url)
                        }} className="px-3 py-1.5 bg-brand-teal text-white text-[9px] font-bold rounded-lg hover:bg-brand-teal/90 flex items-center gap-1">
                          <Download className="w-3 h-3" /> Baixar .txt
                        </button>
                        <button onClick={() => {
                          if (!aiPropCompanyId) return
                          const comp = companies.find(c => c.id === aiPropCompanyId)
                          addProposal({
                            companyId: aiPropCompanyId,
                            service: aiPropService,
                            value: aiPropValue,
                            duration: aiPropDuration,
                            status: 'draft',
                            notes: `Proposta gerada por IA em ${new Date().toLocaleDateString('pt-BR')}. Condição: ${aiPropCondPag}`,
                          })
                          setShowAiProposalGenerator(false)
                        }} className="px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Salvar Proposta
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {aiGeneratedProposal ? (
                    <pre className="text-[11px] font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">{aiGeneratedProposal}</pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <Brain className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="text-xs font-medium">Preencha os dados ao lado e clique em</p>
                        <p className="text-xs font-bold text-violet-600 mt-1">"Gerar Proposta com IA"</p>
                        <p className="text-[10px] text-slate-400 mt-3">A proposta será gerada com base no modelo definido</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: GERAR CONTRATO COM IA
          ========================================== */}
      {showAiGenerator && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-brand-teal/5 to-brand-blue/5">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-brand-teal" />
                <h3 className="text-sm font-black text-slate-800">Gerar Contrato com Inteligência Artificial</h3>
                <span className="px-1.5 py-0.5 bg-brand-teal/10 border border-brand-teal/20 rounded text-[9px] font-bold text-brand-teal">BETA</span>
              </div>
              <button onClick={() => setShowAiGenerator(false)} className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Left Panel - Configuration */}
              <div className="w-1/3 border-r border-slate-100 p-4 overflow-y-auto space-y-4 bg-slate-50/30">
                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Empresa</label>
                  <select value={aiCompanyId} onChange={e => {
                    setAiCompanyId(e.target.value)
                    const comp = companies.find(c => c.id === e.target.value)
                    if (comp) setAiService(comp.segment || '')
                  }} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                    <option value="">Selecione...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Proposta (opcional)</label>
                  <select value={aiProposalId} onChange={e => {
                    const pid = e.target.value
                    setAiProposalId(pid)
                    const prop = proposals.find(p => p.id === pid)
                    if (prop) { setAiService(prop.service); setAiValue(prop.value); setAiDuration(prop.duration) }
                  }} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20">
                    <option value="">Sem proposta vinculada</option>
                    {proposals.filter(p => !aiCompanyId || p.companyId === aiCompanyId).map(p => (
                      <option key={p.id} value={p.id}>{p.service} — R$ {p.value.toLocaleString('pt-BR')}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Serviço</label>
                  <input value={aiService} onChange={e => setAiService(e.target.value)} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" placeholder="Ex: NR-01, Mentoria, SIPAT" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Valor (R$)</label>
                    <input type="number" value={aiValue || ''} onChange={e => setAiValue(Number(e.target.value))} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-500 uppercase block mb-1">Vigência</label>
                    <input value={aiDuration} onChange={e => setAiDuration(e.target.value)} className="w-full text-[11px] border border-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                  </div>
                </div>

                <div className="border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[9px] font-bold text-slate-500 uppercase">Modelo de Contrato</label>
                    <button onClick={() => setAiEditMode(!aiEditMode)} className="text-[9px] font-semibold text-brand-teal hover:text-brand-teal/80">
                      {aiEditMode ? 'Visualizar' : 'Editar modelo'}
                    </button>
                  </div>
                  {aiEditMode ? (
                    <textarea value={aiTemplate} onChange={e => { setAiTemplate(e.target.value); localStorage.setItem('crm_contract_template', e.target.value) }}
                      className="w-full text-[10px] border border-slate-200 rounded-lg px-3 py-2 h-60 font-mono focus:outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none" />
                  ) : (
                    <pre className="w-full text-[10px] text-slate-600 bg-white border border-slate-200 rounded-lg px-3 py-2 h-60 overflow-y-auto font-mono whitespace-pre-wrap">{aiTemplate}</pre>
                  )}
                </div>

                <button onClick={() => {
                  if (!aiCompanyId) { alert('Selecione uma empresa.'); return }
                  if (!aiService) { alert('Informe o serviço.'); return }
                  setAiLoading(true)
                  setTimeout(() => {
                    const comp = companies.find(c => c.id === aiCompanyId)
                    const hoje = new Date()
                    const fim = new Date(hoje)
                    const meses = aiDuration.match(/(\d+)\s*meses?/)
                    if (meses) fim.setMonth(fim.getMonth() + parseInt(meses[1]))
                    else fim.setFullYear(fim.getFullYear() + 1)
                    const startStr = hoje.toLocaleDateString('pt-BR')
                    const endStr = fim.toLocaleDateString('pt-BR')
                    const local = comp ? `${comp.city} - ${comp.state}` : 'Campinas - SP'
                    const generated = generateAiContract(aiTemplate, {
                      client: comp?.name || 'CLIENTE',
                      service: aiService,
                      value: aiValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 }),
                      duration: aiDuration,
                      startDate: startStr,
                      endDate: endStr,
                      local,
                      dateExtenso: dateExtenso(),
                    })
                    setAiGeneratedContract(generated)
                    setAiLoading(false)
                  }, 1200)
                }} disabled={aiLoading || !aiCompanyId}
                  className="w-full py-2.5 bg-gradient-to-r from-brand-teal to-brand-blue text-white text-[11px] font-bold rounded-xl hover:opacity-90 transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {aiLoading ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Gerando contrato...</>
                  ) : (
                    <><Sparkles className="w-3.5 h-3.5" /> Gerar Contrato com IA</>
                  )}
                </button>
              </div>

              {/* Right Panel - Generated Contract Preview */}
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                  <span className="text-[9px] font-bold text-slate-500 uppercase">
                    {aiGeneratedContract ? 'Contrato Gerado' : 'Pré-visualização'}
                  </span>
                  <div className="flex items-center gap-2">
                    {aiGeneratedContract && (
                      <>
                        <button onClick={() => {
                          const blob = new Blob([aiGeneratedContract], { type: 'text/plain' })
                          const url = URL.createObjectURL(blob)
                          const a = document.createElement('a')
                          a.href = url; a.download = `contrato_${(companies.find(c => c.id === aiCompanyId)?.name || 'cliente').replace(/\s+/g, '_')}.txt`
                          a.click(); URL.revokeObjectURL(url)
                        }} className="px-3 py-1.5 bg-brand-teal text-white text-[9px] font-bold rounded-lg hover:bg-brand-teal/90 flex items-center gap-1">
                          <Download className="w-3 h-3" /> Baixar .txt
                        </button>
                        <button onClick={() => {
                          if (!aiCompanyId) return
                          const comp = companies.find(c => c.id === aiCompanyId)
                          const newContract = addContract({
                            companyId: aiCompanyId,
                            title: `Contrato - ${aiService} - ${comp?.tradeName || 'Cliente'}`,
                            value: aiValue,
                            startDate: new Date().toISOString().split('T')[0],
                            endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            autoRenew: true,
                            status: 'draft',
                            attachments: [`contrato_gerado_ia_${Date.now()}.txt`],
                          })
                          try {
                            const stored = JSON.parse(localStorage.getItem('crm_contracts') || '[]')
                            const idx = stored.findIndex((c: any) => c.id === newContract.id)
                            if (idx !== -1) {
                              stored[idx].attachments = stored[idx].attachments || []
                              stored[idx].attachments.push(`contrato_gerado_ia_${Date.now()}.txt`)
                              localStorage.setItem('crm_contracts', JSON.stringify(stored))
                            }
                          } catch {}
                          setShowAiGenerator(false)
                        }} className="px-3 py-1.5 bg-emerald-600 text-white text-[9px] font-bold rounded-lg hover:bg-emerald-700 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Salvar Contrato
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-6">
                  {aiGeneratedContract ? (
                    <pre className="text-[11px] font-sans text-slate-800 whitespace-pre-wrap leading-relaxed">{aiGeneratedContract}</pre>
                  ) : (
                    <div className="flex items-center justify-center h-full text-slate-400">
                      <div className="text-center">
                        <Brain className="w-10 h-10 mx-auto mb-3 text-slate-300" />
                        <p className="text-xs font-medium">Preencha os dados ao lado e clique em</p>
                        <p className="text-xs font-bold text-brand-teal mt-1">"Gerar Contrato com IA"</p>
                        <p className="text-[10px] text-slate-400 mt-3">O contrato será gerado com base no modelo definido</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
