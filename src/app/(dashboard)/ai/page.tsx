'use client'

import React, { useState, useRef, useEffect } from 'react'
import { useAi } from './context/AiContext'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import {
  Bot, Send, Plus, MessageSquare, History, Star, Trash2, Copy, FileText,
  ChevronLeft, ChevronRight, Settings, Search, Bookmark, Sparkles, X,
  Download, Loader2, PanelLeftClose, PanelLeft, Brain,
} from 'lucide-react'

const ASSISTANT_ICONS: Record<string, React.ReactNode> = {
  chat: <Bot className="w-4 h-4" />,
  reports: <FileText className="w-4 h-4" />,
  commercial: <TrendingIcon />,
  nr01: <ShieldIcon />,
  training: <GraduationIcon />,
  mentoring: <Brain className="w-4 h-4" />,
  financial: <DollarIcon />,
}

function TrendingIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg> }
function ShieldIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg> }
function GraduationIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg> }
function DollarIcon() { return <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg> }

function renderContent(content: string) {
  const lines = content.split('\n')
  return lines.map((line, i) => {
    if (line.startsWith('> ')) return <p key={i} className="text-[11px] text-slate-400 italic mt-1">{line.slice(2)}</p>
    if (line.startsWith('• ')) return <p key={i} className="text-[12px] text-slate-700 pl-3">• {line.slice(2)}</p>
    if (/^\d+\./.test(line)) return <p key={i} className="text-[12px] text-slate-700 pl-3">{line}</p>
    if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-[13px] font-bold text-slate-800 mt-2 mb-1">{line.slice(2, -2)}</p>
    const bolded = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    if (bolded !== line) return <p key={i} className="text-[12px] text-slate-700" dangerouslySetInnerHTML={{ __html: bolded }} />
    if (!line.trim()) return <div key={i} className="h-1" />
    return <p key={i} className="text-[12px] text-slate-700">{line}</p>
  })
}

export default function AiPage() {
  const ai = useAi()
  const crm = useCrm()
  const [input, setInput] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [showPrompts, setShowPrompts] = useState(false)
  const [showConfig, setShowConfig] = useState(false)
  const [newPromptTitle, setNewPromptTitle] = useState('')
  const [newPromptText, setNewPromptText] = useState('')
  const [newPromptCategory, setNewPromptCategory] = useState('geral')
  const [selectedCompany, setSelectedCompany] = useState('')
  const [selectedProject, setSelectedProject] = useState('')
  const [searchConversations, setSearchConversations] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [ai.currentConversation?.messages, ai.loading])

  const filteredConversations = ai.conversations.filter(c =>
    !searchConversations || c.title.toLowerCase().includes(searchConversations.toLowerCase())
  )

  const handleSend = () => {
    if (!input.trim() || ai.loading) return
    ai.sendMessage(input.trim(), { companyId: selectedCompany || undefined, projectId: selectedProject || undefined })
    setInput('')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleNewPrompt = () => {
    if (!newPromptTitle.trim() || !newPromptText.trim()) return
    ai.addPrompt({ title: newPromptTitle, prompt: newPromptText, category: newPromptCategory, tags: [] })
    setNewPromptTitle(''); setNewPromptText(''); setNewPromptCategory('geral')
  }

  const quickActions = [
    { label: 'Clientes Ativos', icon: <MessageSquare className="w-3.5 h-3.5" />, action: () => ai.sendMessage('Quais são os clientes ativos?') },
    { label: 'Resumo Financeiro', icon: <DollarIcon />, action: () => ai.sendMessage('Resumo financeiro do mês') },
    { label: 'Relatório Executivo', icon: <FileText className="w-3.5 h-3.5" />, action: () => { ai.setAssistantType('reports'); ai.sendMessage('Gere um relatório executivo') } },
    { label: 'Projetos Ativos', icon: <TrendingIcon />, action: () => ai.sendMessage('Quais são os projetos ativos?') },
  ]

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-0 bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
      {/* ── Sidebar ──────────────────────────── */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-white border-r border-slate-100 flex flex-col overflow-hidden shrink-0`}>
        {sidebarOpen && (
          <>
            <div className="p-3 border-b border-slate-100">
              <button onClick={ai.newConversation} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-[11px] font-bold rounded-xl transition-colors">
                <Plus className="w-3.5 h-3.5" /> Nova Conversa
              </button>
            </div>

            <div className="px-3 py-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={searchConversations} onChange={e => setSearchConversations(e.target.value)} placeholder="Buscar conversas..."
                  className="w-full pl-8 pr-3 py-1.5 text-[11px] border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-violet-200" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3">
              <div className="flex items-center gap-2 px-2 py-1.5">
                <History className="w-3 h-3 text-slate-400" />
                <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">Histórico</p>
              </div>
              {filteredConversations.length === 0 && (
                <p className="text-[10px] text-slate-400 text-center py-8">Nenhuma conversa ainda</p>
              )}
              {filteredConversations.map(conv => (
                <div key={conv.id}
                  onClick={() => ai.selectConversation(conv.id)}
                  className={`group flex items-start gap-2 px-2.5 py-2 rounded-xl cursor-pointer transition-all mb-0.5 ${ai.currentConversationId === conv.id ? 'bg-violet-50 border border-violet-100' : 'hover:bg-slate-50 border border-transparent'}`}>
                  <div className="mt-0.5">{ASSISTANT_ICONS[conv.assistantType] || <MessageSquare className="w-3.5 h-3.5 text-slate-400" />}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold text-slate-700 truncate">{conv.title}</p>
                    <p className="text-[9px] text-slate-400">{new Date(conv.updatedAt).toLocaleDateString('pt-BR')} · {conv.messages.length} msgs</p>
                  </div>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); ai.toggleFavorite(conv.id) }}
                      className={`p-1 rounded ${conv.favorite ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500'}`}>
                      <Star className="w-3 h-3" />
                    </button>
                    <button onClick={e => { e.stopPropagation(); ai.deleteConversation(conv.id) }}
                      className="p-1 rounded text-slate-300 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-100 p-2">
              <button onClick={() => setShowPrompts(!showPrompts)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-semibold transition-all ${showPrompts ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Bookmark className="w-3.5 h-3.5" /> Biblioteca de Prompts
              </button>
              <button onClick={() => setShowConfig(!showConfig)}
                className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-[10px] font-semibold transition-all ${showConfig ? 'bg-violet-50 text-violet-700' : 'text-slate-500 hover:bg-slate-50'}`}>
                <Settings className="w-3.5 h-3.5" /> Configuração
              </button>
            </div>
          </>
        )}
      </div>

      <button onClick={() => setSidebarOpen(!sidebarOpen)}
        className="absolute z-10 left-2 top-1/2 -translate-y-1/2 p-1 bg-white border border-slate-200 rounded-lg shadow-sm text-slate-400 hover:text-slate-600">
        {sidebarOpen ? <PanelLeftClose className="w-3.5 h-3.5" /> : <PanelLeft className="w-3.5 h-3.5" />}
      </button>

      {/* ── Main Chat ────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <Bot className="w-4 h-4 text-violet-600" />
            <h1 className="text-sm font-black text-slate-800">IA Crepaldi</h1>
            <span className="px-1.5 py-0.5 bg-violet-50 border border-violet-100 rounded text-[9px] font-bold text-violet-600">COPILOTO</span>
          </div>
          <div className="flex items-center gap-2">
            {ai.assistants.map(a => (
              <button key={a.type} onClick={() => ai.setAssistantType(a.type)}
                className={`p-1.5 rounded-lg transition-all ${ai.assistantType === a.type ? 'bg-violet-50 text-violet-700 shadow-sm' : 'text-slate-400 hover:bg-slate-50 hover:text-slate-600'}`}
                title={a.label}>
                {ASSISTANT_ICONS[a.type]}
              </button>
            ))}
          </div>
        </div>

        {/* Assistant description */}
        {!ai.currentConversation && (
          <div className="px-4 py-2 bg-gradient-to-r from-violet-50 to-transparent border-b border-slate-100">
            <p className="text-[10px] text-violet-600 font-medium">
              {ai.assistants.find(a => a.type === ai.assistantType)?.description}
            </p>
          </div>
        )}

        {/* Quick actions */}
        {(!ai.currentConversation || ai.currentConversation.messages.length === 0) && (
          <div className="px-4 py-3 border-b border-slate-100 bg-white">
            <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider mb-2">Ações rápidas</p>
            <div className="flex flex-wrap gap-1.5">
              {quickActions.map((q, i) => (
                <button key={i} onClick={q.action}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-50 hover:bg-violet-50 border border-slate-100 hover:border-violet-200 rounded-lg text-[10px] font-semibold text-slate-600 hover:text-violet-700 transition-all">
                  {q.icon} {q.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Context selectors */}
        <div className="flex items-center gap-2 px-4 py-1.5 bg-white border-b border-slate-100">
          <select value={selectedCompany} onChange={e => setSelectedCompany(e.target.value)}
            className="text-[9px] border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
            <option value="">Sem cliente</option>
            {crm.companies.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>)}
          </select>
          <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
            className="text-[9px] border border-slate-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
            <option value="">Sem projeto</option>
            {crm.contracts.filter(c => c.status === 'active').map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          {selectedCompany && (
            <span className="text-[9px] text-violet-600 font-semibold">Contexto: {crm.companies.find(c => c.id === selectedCompany)?.tradeName}</span>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-white">
          {!ai.currentConversation && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-purple-100 rounded-2xl flex items-center justify-center mb-4">
                <Bot className="w-8 h-8 text-violet-600" />
              </div>
              <h2 className="text-base font-black text-slate-800 mb-1">Olá! Como posso ajudar?</h2>
              <p className="text-[11px] text-slate-400 max-w-md">
                Selecione um assistente ao lado ou digite sua pergunta abaixo.
                Posso consultar dados de clientes, projetos, finanças, treinamentos e mais.
              </p>
            </div>
          )}

          {ai.currentConversation?.messages.map(msg => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                  <Bot className="w-4 h-4 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'bg-violet-50 border border-violet-100 rounded-2xl rounded-tr-md px-3.5 py-2.5' : 'bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-md px-3.5 py-2.5'}`}>
                <div className="space-y-0.5">{renderContent(msg.content)}</div>
                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100/50">
                  <p className="text-[9px] text-slate-400">{new Date(msg.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  {msg.role === 'assistant' && (
                    <button onClick={() => ai.copyToClipboard(msg.content)}
                      className="p-0.5 rounded text-slate-300 hover:text-slate-600 hover:bg-slate-100 transition-all">
                      <Copy className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center shrink-0 shadow-sm">
                  <span className="text-[10px] font-bold text-white">U</span>
                </div>
              )}
            </div>
          ))}

          {ai.loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-50 border border-slate-100 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 text-violet-500 animate-spin" />
                  <p className="text-[11px] text-slate-400">Gerando resposta...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="border-t border-slate-100 bg-white p-3">
          <div className="flex items-end gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus-within:ring-2 focus-within:ring-violet-200 focus-within:border-violet-300 transition-all">
            <textarea ref={inputRef} value={input} onChange={e => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder={`Pergunte sobre ${ai.assistants.find(a => a.type === ai.assistantType)?.label.toLowerCase()}...`}
              className="flex-1 bg-transparent border-none outline-none resize-none text-[12px] text-slate-700 placeholder:text-slate-400 min-h-[20px] max-h-[120px]"
              rows={1} />
            {input.trim() && !ai.loading && (
              <button onClick={handleSend}
                className="p-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shrink-0">
                <Send className="w-3.5 h-3.5" />
              </button>
            )}
            {ai.loading && <Loader2 className="w-4 h-4 text-violet-500 animate-spin shrink-0" />}
          </div>
          <p className="text-[8px] text-slate-400 text-center mt-1.5">
            IA Crepaldi responde com base nos dados do sistema. Dados sensíveis são protegidos por permissões de acesso.
          </p>
        </div>
      </div>

      {/* ── Right Panel (Prompts / Config) ───── */}
      {(showPrompts || showConfig) && (
        <div className="w-80 border-l border-slate-100 bg-white overflow-y-auto shrink-0">
          {showPrompts && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><Bookmark className="w-3.5 h-3.5 text-violet-600" /> Biblioteca</h3>
                <button onClick={() => setShowPrompts(false)}><X className="w-3.5 h-3.5 text-slate-400" /></button>
              </div>

              <div className="mb-4 bg-slate-50 rounded-xl p-3 border border-slate-100">
                <p className="text-[9px] font-semibold text-slate-400 uppercase mb-2">Novo Prompt</p>
                <input value={newPromptTitle} onChange={e => setNewPromptTitle(e.target.value)} placeholder="Título"
                  className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 mb-1.5 focus:outline-none focus:ring-2 focus:ring-violet-200" />
                <textarea value={newPromptText} onChange={e => setNewPromptText(e.target.value)} placeholder="Texto do prompt..."
                  className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-1.5 mb-1.5 min-h-[60px] focus:outline-none focus:ring-2 focus:ring-violet-200 resize-none" />
                <div className="flex gap-1.5">
                  <select value={newPromptCategory} onChange={e => setNewPromptCategory(e.target.value)}
                    className="flex-1 text-[10px] border border-slate-200 rounded-lg px-2 py-1 focus:outline-none">
                    <option value="geral">Geral</option><option value="comercial">Comercial</option><option value="nr01">NR-01</option>
                    <option value="relatorios">Relatórios</option><option value="treinamentos">Treinamentos</option>
                    <option value="mentorias">Mentorias</option><option value="financeiro">Financeiro</option><option value="comunicacao">Comunicação</option>
                  </select>
                  <button onClick={handleNewPrompt} className="px-2.5 py-1 bg-violet-600 text-white text-[10px] font-bold rounded-lg hover:bg-violet-700 transition-colors">Salvar</button>
                </div>
              </div>

              {ai.prompts.length === 0 && <p className="text-[10px] text-slate-400 text-center py-4">Nenhum prompt salvo</p>}
              {ai.prompts.map(p => (
                <div key={p.id} className="group bg-slate-50 rounded-xl p-2.5 border border-slate-100 mb-1.5 hover:border-violet-100 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] font-semibold text-slate-700 truncate">{p.title}</p>
                      <p className="text-[9px] text-slate-400">{p.prompt.substring(0, 60)}...</p>
                      <span className="inline-block mt-1 px-1.5 py-0.5 bg-slate-100 rounded text-[8px] font-semibold text-slate-500">{p.category}</span>
                    </div>
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { ai.sendMessage(p.prompt); ai.usePrompt(p.id) }}
                        className="p-1 rounded text-slate-400 hover:text-violet-600 hover:bg-violet-50"><Send className="w-3 h-3" /></button>
                      <button onClick={() => ai.deletePrompt(p.id)}
                        className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {showConfig && (
            <div className="p-3">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-black text-slate-700 flex items-center gap-1.5"><Settings className="w-3.5 h-3.5 text-violet-600" /> Configuração</h3>
                <button onClick={() => setShowConfig(false)}><X className="w-3.5 h-3.5 text-slate-400" /></button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Tom de Resposta</label>
                  <select value={ai.config.tone} onChange={e => ai.setConfig({ tone: e.target.value as any })}
                    className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option value="professional">Profissional</option>
                    <option value="friendly">Amigável</option>
                    <option value="technical">Técnico</option>
                    <option value="executive">Executivo</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Tamanho da Resposta</label>
                  <select value={ai.config.responseSize} onChange={e => ai.setConfig({ responseSize: e.target.value as any })}
                    className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option value="concise">Conciso</option>
                    <option value="balanced">Equilibrado</option>
                    <option value="detailed">Detalhado</option>
                  </select>
                </div>
                <div>
                  <label className="text-[9px] font-semibold text-slate-400 uppercase block mb-1">Máx. Histórico</label>
                  <select value={ai.config.maxHistory} onChange={e => ai.setConfig({ maxHistory: Number(e.target.value) })}
                    className="w-full text-[11px] border border-slate-200 rounded-lg px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200">
                    <option value={20}>20 mensagens</option>
                    <option value={50}>50 mensagens</option>
                    <option value={100}>100 mensagens</option>
                  </select>
                </div>

                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-700 mb-1">🔒 Permissões</p>
                  <p className="text-[9px] text-slate-500">A IA respeita as permissões do seu perfil ({crm.currentRole}). Dados de módulos sem acesso não serão exibidos.</p>
                </div>

                <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
                  <p className="text-[10px] font-bold text-amber-700 mb-1">⚠️ Informação</p>
                  <p className="text-[9px] text-amber-600">A IA Crepaldi respostas com base nos dados reais do sistema. Não compartilhe informações sensíveis fora da plataforma.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
