'use client'

import React, { useState } from 'react'
import { ClientsProvider, useClients, Client } from './context/ClientsContext'
import {
  Search, Plus, Building2, ChevronRight, Phone, Mail, MapPin,
  Calendar, DollarSign, Tag, User, MessageSquare, FileText,
  Star, Activity, MoreHorizontal, Edit3, Trash2, X, Clock,
  CheckCircle, AlertCircle, PauseCircle
} from 'lucide-react'

function ClientsMainContent() {
  const { clients, contacts, interactions, documents, feedbacks, addClient, deleteClient, addContact, addInteraction, addFeedback } = useClients()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'churned'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showNewContact, setShowNewContact] = useState(false)

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.companyName.toLowerCase().includes(q) || c.companyTradeName.toLowerCase().includes(q) || c.cnpj.includes(q) || c.city.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const selected = clients.find(c => c.id === selectedId)

  const statusIcon = (s: Client['status']) => {
    switch (s) {
      case 'active': return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'suspended': return <PauseCircle className="w-4 h-4 text-amber-500" />
      case 'churned': return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const statusLabel: Record<Client['status'], string> = { active: 'Ativo', suspended: 'Suspenso', churned: 'Cancelado' }

  const formatCurrency = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-brand-teal" />
            Clientes
          </h1>
          <p className="text-slate-400 text-xs mt-1">Gerencie todos os clientes ativos e acompanhe informações completas.</p>
        </div>
        <button
          onClick={() => setShowNewForm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-teal text-white rounded-xl font-bold text-xs hover:bg-brand-teal/90 transition-all shadow-lg shadow-brand-teal/20"
        >
          <Plus className="w-4 h-4" />
          Novo Cliente
        </button>
      </div>

      <div className="flex gap-6">
        {/* List panel */}
        <div className={`${selectedId ? 'w-[420px]' : 'flex-1'} transition-all duration-300 flex-shrink-0`}>
          {/* Search & Filters */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar por nome, CNPJ ou cidade..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 focus:border-brand-teal bg-white"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-4">
            {(['all', 'active', 'suspended', 'churned'] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === s
                    ? 'bg-brand-teal text-white'
                    : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                }`}
              >
                {s === 'all' ? 'Todos' : statusLabel[s]}
              </button>
            ))}
          </div>

          {/* Client list */}
          <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto pr-1">
            {filtered.map(c => {
              const isSelected = selectedId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(isSelected ? null : c.id)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all ${
                    isSelected
                      ? 'border-brand-teal bg-brand-teal/5 shadow-md shadow-brand-teal/10'
                      : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-800 truncate">{c.companyTradeName}</h3>
                        {statusIcon(c.status)}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{c.companyName}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}/{c.state}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{formatCurrency(c.monthlyValue)}/m</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1 max-w-[140px] justify-end">
                      {c.services.slice(0, 2).map(s => (
                        <span key={s} className="px-2 py-0.5 bg-brand-blue/10 text-brand-blue rounded-md text-[10px] font-semibold truncate max-w-full">{s}</span>
                      ))}
                      {c.services.length > 2 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-semibold">+{c.services.length - 2}</span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
            {filtered.length === 0 && (
              <div className="text-center py-12 text-slate-400 text-sm">Nenhum cliente encontrado.</div>
            )}
          </div>
        </div>

        {/* Detail panel */}
        {selected && (
          <ClientDetail
            client={selected}
            contacts={contacts.filter(c => c.clientId === selected.id)}
            interactions={interactions.filter(i => i.clientId === selected.id)}
            documents={documents.filter(d => d.clientId === selected.id)}
            feedbacks={feedbacks.filter(f => f.clientId === selected.id)}
            onClose={() => setSelectedId(null)}
            onDelete={deleteClient}
            onAddContact={addContact}
            onAddInteraction={addInteraction}
            onAddFeedback={addFeedback}
            showNewContact={showNewContact}
            setShowNewContact={setShowNewContact}
            formatCurrency={formatCurrency}
          />
        )}
      </div>

      {/* New Client Modal */}
      {showNewForm && (
        <NewClientModal
          onSave={addClient}
          onClose={() => setShowNewForm(false)}
          formatCurrency={formatCurrency}
        />
      )}
    </div>
  )
}

// ==========================================
// Client Detail Component
// ==========================================

function ClientDetail({
  client, contacts, interactions, documents, feedbacks,
  onClose, onDelete, onAddContact, onAddInteraction, onAddFeedback,
  showNewContact, setShowNewContact, formatCurrency
}: {
  client: Client
  contacts: any[]
  interactions: any[]
  documents: any[]
  feedbacks: any[]
  onClose: () => void
  onDelete: (id: string) => void
  onAddContact: (c: any) => void
  onAddInteraction: (i: any) => void
  onAddFeedback: (f: any) => void
  showNewContact: boolean
  setShowNewContact: (v: boolean) => void
  formatCurrency: (v: number) => string
}) {
  const [tab, setTab] = useState<'info' | 'contacts' | 'interactions' | 'documents' | 'feedbacks'>('info')
  const [newContactName, setNewContactName] = useState('')
  const [newContactRole, setNewContactRole] = useState('')
  const [newContactPhone, setNewContactPhone] = useState('')
  const [newContactEmail, setNewContactEmail] = useState('')
  const [newIntTitle, setNewIntTitle] = useState('')
  const [newIntDesc, setNewIntDesc] = useState('')
  const [newIntType, setNewIntType] = useState<'call' | 'meeting' | 'whatsapp' | 'email' | 'visit' | 'support'>('call')
  const [newFbScore, setNewFbScore] = useState(10)
  const [newFbComment, setNewFbComment] = useState('')

  const statusBadge = (s: Client['status']) => {
    const map: Record<Client['status'], { label: string, color: string }> = {
      active: { label: 'Ativo', color: 'bg-emerald-100 text-emerald-700' },
      suspended: { label: 'Suspenso', color: 'bg-amber-100 text-amber-700' },
      churned: { label: 'Cancelado', color: 'bg-red-100 text-red-700' }
    }
    const { label, color } = map[s]
    return <span className={`px-3 py-1 rounded-lg text-xs font-bold ${color}`}>{label}</span>
  }

  const handleAddContact = () => {
    if (!newContactName.trim()) return
    onAddContact({
      clientId: client.id,
      name: newContactName,
      role: newContactRole,
      phone: newContactPhone,
      email: newContactEmail,
      isPrimary: contacts.length === 0
    })
    setNewContactName(''); setNewContactRole(''); setNewContactPhone(''); setNewContactEmail('')
    setShowNewContact(false)
  }

  const handleAddInteraction = () => {
    if (!newIntTitle.trim()) return
    onAddInteraction({ clientId: client.id, type: newIntType, title: newIntTitle, description: newIntDesc, author: 'Administrador' })
    setNewIntTitle(''); setNewIntDesc('')
  }

  const handleAddFeedback = () => {
    if (!newFbComment.trim()) return
    onAddFeedback({ clientId: client.id, score: newFbScore, comment: newFbComment })
    setNewFbComment('')
  }

  return (
    <div className="flex-1 bg-white rounded-3xl border border-slate-100 shadow-lg overflow-hidden">
      {/* Detail header */}
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-blue flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg shadow-brand-teal/20">
              {client.companyTradeName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-slate-800">{client.companyTradeName}</h2>
                {statusBadge(client.status)}
              </div>
              <p className="text-sm text-slate-400 mt-0.5">{client.companyName}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" />{client.city}/{client.state}</span>
                <span className="flex items-center gap-1"><Tag className="w-3.5 h-3.5" />{client.cnpj}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
              <X className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(client.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition-all">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-6 pt-4 border-b border-slate-100">
        {[
          { id: 'info', label: 'Informações', icon: <Building2 className="w-3.5 h-3.5" /> },
          { id: 'contacts', label: 'Contatos', icon: <User className="w-3.5 h-3.5" /> },
          { id: 'interactions', label: 'Interações', icon: <MessageSquare className="w-3.5 h-3.5" /> },
          { id: 'documents', label: 'Documentos', icon: <FileText className="w-3.5 h-3.5" /> },
          { id: 'feedbacks', label: 'Feedbacks', icon: <Star className="w-3.5 h-3.5" /> }
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all border-b-2 -mb-[1px] ${
              tab === t.id
                ? 'border-brand-teal text-brand-teal bg-brand-teal/5'
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="p-6 overflow-y-auto max-h-[calc(100vh-280px)]">
        {/* Info Tab */}
        {tab === 'info' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Serviços Contratados</h4>
              <div className="flex flex-wrap gap-2">
                {client.services.map(s => (
                  <span key={s} className="px-3 py-1.5 bg-brand-blue/10 text-brand-blue rounded-lg text-xs font-semibold">{s}</span>
                ))}
              </div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Responsável Interno</h4>
              <p className="text-sm text-slate-700 font-medium">{client.internalResponsible || 'Não definido'}</p>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Observações</h4>
              <p className="text-sm text-slate-600 leading-relaxed">{client.notes || 'Sem observações.'}</p>
            </div>
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Período do Contrato</h4>
              <div className="flex items-center gap-2 text-sm text-slate-700">
                <Calendar className="w-4 h-4 text-slate-400" />
                <span>{new Date(client.startDate).toLocaleDateString('pt-BR')}</span>
                <span className="text-slate-300">→</span>
                <span>{new Date(client.endDate).toLocaleDateString('pt-BR')}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Valores</h4>
              <div className="bg-slate-50 rounded-2xl p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Valor Mensal</span>
                  <span className="font-bold text-slate-800">{formatCurrency(client.monthlyValue)}</span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                  <span className="text-slate-400">Valor Total</span>
                  <span className="font-bold text-brand-teal">{formatCurrency(client.totalValue)}</span>
                </div>
              </div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Segmento</h4>
              <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold inline-block">{client.segment}</span>
            </div>
          </div>
        )}

        {/* Contacts Tab */}
        {tab === 'contacts' && (
          <div className="space-y-3">
            {contacts.map(c => (
              <div key={c.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-slate-800">{c.name}</span>
                    {c.isPrimary && <span className="px-2 py-0.5 bg-brand-teal/10 text-brand-teal rounded-md text-[10px] font-bold">Principal</span>}
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">{c.role}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>
                  </div>
                </div>
              </div>
            ))}
            {showNewContact ? (
              <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
                <input value={newContactName} onChange={e => setNewContactName(e.target.value)} placeholder="Nome *" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                <input value={newContactRole} onChange={e => setNewContactRole(e.target.value)} placeholder="Cargo" className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                <div className="flex gap-2">
                  <input value={newContactPhone} onChange={e => setNewContactPhone(e.target.value)} placeholder="Telefone" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                  <input value={newContactEmail} onChange={e => setNewContactEmail(e.target.value)} placeholder="Email" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button onClick={handleAddContact} className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold hover:bg-brand-teal/90">Salvar</button>
                  <button onClick={() => setShowNewContact(false)} className="px-4 py-2 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100">Cancelar</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowNewContact(true)} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-2xl text-xs font-bold text-slate-400 hover:border-brand-teal hover:text-brand-teal transition-all">
                + Adicionar Contato
              </button>
            )}
          </div>
        )}

        {/* Interactions Tab */}
        {tab === 'interactions' && (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {interactions.map(i => (
                <div key={i.id} className="p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-brand-teal" />
                      <span className="font-bold text-sm text-slate-800">{i.title}</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(i.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 ml-6">{i.description}</p>
                  <div className="flex items-center gap-2 mt-1.5 ml-6">
                    <span className="px-2 py-0.5 bg-slate-200 text-slate-500 rounded-md text-[10px] font-semibold">{i.type}</span>
                    <span className="text-[10px] text-slate-400">por {i.author}</span>
                  </div>
                </div>
              ))}
              {interactions.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhuma interação registrada.</p>}
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
              <div className="flex gap-2">
                <input value={newIntTitle} onChange={e => setNewIntTitle(e.target.value)} placeholder="Título da interação *" className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
                <select value={newIntType} onChange={e => setNewIntType(e.target.value as any)} className="px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20 bg-white">
                  <option value="call">Ligação</option>
                  <option value="meeting">Reunião</option>
                  <option value="whatsapp">WhatsApp</option>
                  <option value="email">E-mail</option>
                  <option value="visit">Visita</option>
                  <option value="support">Suporte</option>
                </select>
              </div>
              <textarea value={newIntDesc} onChange={e => setNewIntDesc(e.target.value)} placeholder="Descrição..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none h-16" />
              <button onClick={handleAddInteraction} className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold hover:bg-brand-teal/90">Registrar Interação</button>
            </div>
          </div>
        )}

        {/* Documents Tab */}
        {tab === 'documents' && (
          <div className="space-y-2">
            {documents.map(d => (
              <div key={d.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-brand-teal" />
                  <div>
                    <p className="font-bold text-sm text-slate-800">{d.name}</p>
                    <p className="text-[10px] text-slate-400">{new Date(d.uploadedAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                </div>
                <span className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-lg text-[10px] font-bold">Download</span>
              </div>
            ))}
            {documents.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhum documento anexado.</p>}
          </div>
        )}

        {/* Feedbacks Tab */}
        {tab === 'feedbacks' && (
          <div className="space-y-3">
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {feedbacks.map(f => (
                <div key={f.id} className="p-4 bg-slate-50 rounded-2xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className={`w-4 h-4 ${i < f.score / 2 ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                      ))}
                      <span className="ml-2 text-sm font-bold text-slate-800">{f.score}/10</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{new Date(f.date).toLocaleDateString('pt-BR')}</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">{f.comment}</p>
                </div>
              ))}
              {feedbacks.length === 0 && <p className="text-xs text-slate-400 text-center py-4">Nenhum feedback registrado.</p>}
            </div>
            <div className="p-4 bg-white border border-slate-200 rounded-2xl space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">NPS:</span>
                {[0, 2, 4, 6, 8, 10].map(v => (
                  <button key={v} onClick={() => setNewFbScore(v)} className={`w-8 h-8 rounded-lg text-xs font-bold transition-all ${newFbScore === v ? 'bg-brand-teal text-white' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>{v}</button>
                ))}
              </div>
              <textarea value={newFbComment} onChange={e => setNewFbComment(e.target.value)} placeholder="Comentário..." className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none h-16" />
              <button onClick={handleAddFeedback} className="px-4 py-2 bg-brand-teal text-white rounded-xl text-xs font-bold hover:bg-brand-teal/90">Registrar Feedback</button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ==========================================
// New Client Modal
// ==========================================

function NewClientModal({ onSave, onClose, formatCurrency }: {
  onSave: (c: any) => any
  onClose: () => void
  formatCurrency: (v: number) => string
}) {
  const [form, setForm] = useState({
    companyId: `cli-comp-${Date.now()}`,
    companyName: '',
    companyTradeName: '',
    cnpj: '',
    segment: '',
    city: '',
    state: '',
    services: [] as string[],
    internalResponsible: '',
    status: 'active' as Client['status'],
    startDate: '',
    endDate: '',
    monthlyValue: 0,
    totalValue: 0,
    notes: ''
  })

  const serviceOptions = ['Diagnóstico Psicossocial', 'NR01', 'Palestras', 'Treinamentos', 'SIPAT', 'Mentorias', 'Desenvolvimento de Lideranças', 'Cultura Organizacional', 'PDI', 'Consultoria Estratégica']

  const toggleService = (s: string) => {
    setForm(f => ({ ...f, services: f.services.includes(s) ? f.services.filter(x => x !== s) : [...f.services, s] }))
  }

  const calcTotal = () => {
    if (!form.startDate || !form.endDate || !form.monthlyValue) return
    const start = new Date(form.startDate)
    const end = new Date(form.endDate)
    const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth())
    if (months > 0) setForm(f => ({ ...f, totalValue: f.monthlyValue * months }))
  }

  const handleSave = () => {
    if (!form.companyName.trim() || !form.companyTradeName.trim()) return
    const client = onSave(form)
    if (client) onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">Novo Cliente</h2>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-bold text-slate-400 mb-1 block">Razão Social *</label>
              <input value={form.companyName} onChange={e => setForm(f => ({ ...f, companyName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Nome Fantasia *</label>
              <input value={form.companyTradeName} onChange={e => setForm(f => ({ ...f, companyTradeName: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">CNPJ</label>
              <input value={form.cnpj} onChange={e => setForm(f => ({ ...f, cnpj: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Segmento</label>
              <input value={form.segment} onChange={e => setForm(f => ({ ...f, segment: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Cidade</label>
                <input value={form.city} onChange={e => setForm(f => ({ ...f, city: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">UF</label>
                <input value={form.state} onChange={e => setForm(f => ({ ...f, state: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" maxLength={2} />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Responsável Interno</label>
              <input value={form.internalResponsible} onChange={e => setForm(f => ({ ...f, internalResponsible: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Status</label>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as any }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 bg-white">
                <option value="active">Ativo</option>
                <option value="suspended">Suspenso</option>
                <option value="churned">Cancelado</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 mb-2 block">Serviços</label>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.map(s => (
                <button key={s} onClick={() => toggleService(s)} className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${form.services.includes(s) ? 'bg-brand-teal text-white border-brand-teal' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Data Início</label>
              <input type="date" value={form.startDate} onChange={e => { setForm(f => ({ ...f, startDate: e.target.value })); calcTotal() }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Data Fim</label>
              <input type="date" value={form.endDate} onChange={e => { setForm(f => ({ ...f, endDate: e.target.value })); calcTotal() }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Valor Mensal</label>
              <input type="number" value={form.monthlyValue || ''} onChange={e => { setForm(f => ({ ...f, monthlyValue: Number(e.target.value) })); calcTotal() }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 mb-1 block">Valor Total</label>
              <input type="number" value={form.totalValue || ''} onChange={e => setForm(f => ({ ...f, totalValue: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-400 mb-1 block">Observações</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 resize-none h-20" />
          </div>
        </div>
        <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2.5 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-100">Cancelar</button>
          <button onClick={handleSave} className="px-6 py-2.5 bg-brand-teal text-white rounded-xl text-xs font-bold hover:bg-brand-teal/90 shadow-lg shadow-brand-teal/20">Salvar Cliente</button>
        </div>
      </div>
    </div>
  )
}

export default function ClientsPage() {
  return (
    <ClientsProvider>
      <ClientsMainContent />
    </ClientsProvider>
  )
}
