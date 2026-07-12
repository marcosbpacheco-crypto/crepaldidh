'use client'

import React, { useState } from 'react'
import { ClientsProvider, useClients, Client, ClientService, ContractType } from './context/ClientsContext'
import { useCalendar } from '@/app/(dashboard)/calendar/context/CalendarContext'
import { useAdmin } from '@/app/(dashboard)/admin/context/AdminContext'
import {
  Search, Plus, Building2, Phone, Mail, MapPin,
  Calendar, DollarSign, Tag, User, MessageSquare, FileText,
  Star, Activity, Trash2, X, Clock, Edit2,
  CheckCircle, AlertCircle, PauseCircle, Play, RotateCcw, Lock
} from 'lucide-react'

const NoAccess = () => (
  <span className="flex items-center gap-1 text-slate-300 font-bold"><Lock className="w-3 h-3" />---</span>
)

function ClientsMainContent() {
  const admin = useAdmin()
  const hasFinancialAccess = admin.checkPermission('financial', 'view')
  const currentRoleName = admin.currentUser?.roleName || ''
  const isAdminOrDiretor = currentRoleName === 'Administrador' || currentRoleName === 'Diretor'
  const { clients, contacts, interactions, documents, feedbacks, addClient, updateClient, deleteClient, hardDeleteClient, addContact, addInteraction, addFeedback } = useClients()
  const calendar = useCalendar()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended' | 'churned'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)
  const [showNewContact, setShowNewContact] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)

  const filtered = clients.filter(c => {
    const q = search.toLowerCase()
    const matchSearch = !q || c.companyName.toLowerCase().includes(q) || c.companyTradeName.toLowerCase().includes(q) || c.cnpj.includes(q) || c.city.toLowerCase().includes(q)
    const matchStatus = statusFilter === 'all' || c.status === statusFilter
    return matchSearch && matchStatus
  })

  const selected = clients.find(c => c.id === selectedId)

  const clientStatusIcon = (s: Client['status']) => {
    switch (s) {
      case 'active': return <CheckCircle className="w-4 h-4 text-emerald-500" />
      case 'suspended': return <PauseCircle className="w-4 h-4 text-amber-500" />
      case 'churned': return <AlertCircle className="w-4 h-4 text-red-500" />
    }
  }

  const serviceStatusIcon = (s: ClientService['status']) => {
    switch (s) {
      case 'not_started': return <Play className="w-3 h-3 text-slate-400" />
      case 'in_progress': return <RotateCcw className="w-3 h-3 text-blue-500" />
      case 'completed': return <CheckCircle className="w-3 h-3 text-emerald-500" />
      case 'delayed': return <AlertCircle className="w-3 h-3 text-red-500" />
    }
  }

  const serviceStatusLabel = (s: ClientService['status']) => {
    switch (s) {
      case 'not_started': return 'Não iniciado'
      case 'in_progress': return 'Em andamento'
      case 'completed': return 'Concluído'
      case 'delayed': return 'Atrasado'
    }
  }

  const statusLabel: Record<Client['status'], string> = { active: 'Ativo', suspended: 'Suspenso', churned: 'Cancelado' }

  const formatCurrency = (v: number | undefined | null) => (v ?? 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })

  const getClientCalendarEvents = (clientId: string) =>
    calendar.events.filter(e => e.clientId === clientId || (e.companyName && clients.find(c => c.id === clientId && (c.companyName === e.companyName || c.companyTradeName === e.companyName))))

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
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
        <div className={`${selectedId ? 'w-[420px]' : 'flex-1'} transition-all duration-300 flex-shrink-0`}>
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
                        {clientStatusIcon(c.status)}
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">{c.companyName}</p>
                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{c.city}/{c.state}</span>
                        <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{hasFinancialAccess ? `${formatCurrency(c.monthlyValue)}/m` : <NoAccess />}</span>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 max-w-[160px] items-end">
                      {c.services.slice(0, 2).map(s => (
                        <span key={s.name} className="flex items-center gap-1 px-2 py-0.5 bg-brand-blue/10 text-brand-blue rounded-md text-[10px] font-semibold truncate max-w-full">
                          {serviceStatusIcon(s.status)}
                          {s.name}
                        </span>
                      ))}
                      {c.services.length > 2 && (
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-md text-[10px] font-semibold">+{c.services.length - 2} serviços</span>
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

        {selected && (
          <ClientDetail
            client={selected}
            contacts={contacts.filter(c => c.clientId === selected.id)}
            interactions={interactions.filter(i => i.clientId === selected.id)}
            documents={documents.filter(d => d.clientId === selected.id)}
            feedbacks={feedbacks.filter(f => f.clientId === selected.id)}
            calendarEvents={getClientCalendarEvents(selected.id)}
            onClose={() => setSelectedId(null)}
            onDelete={deleteClient}
            onHardDelete={hardDeleteClient}
            onEdit={() => setEditingClient(selected)}
            onAddContact={addContact}
            onAddInteraction={addInteraction}
            onAddFeedback={addFeedback}
            showNewContact={showNewContact}
            setShowNewContact={setShowNewContact}
            formatCurrency={formatCurrency}
            serviceStatusIcon={serviceStatusIcon}
            serviceStatusLabel={serviceStatusLabel}
            hasFinancialAccess={hasFinancialAccess}
            isAdminOrDiretor={isAdminOrDiretor}
          />
        )}
      </div>

      {showNewForm && !editingClient && (
        <NewClientModal
          onSave={addClient}
          onClose={() => setShowNewForm(false)}
          formatCurrency={formatCurrency}
          hasFinancialAccess={hasFinancialAccess}
        />
      )}
      {editingClient && (
        <NewClientModal
          editData={editingClient}
          onUpdate={updateClient}
          onClose={() => setEditingClient(null)}
          formatCurrency={formatCurrency}
          hasFinancialAccess={hasFinancialAccess}
        />
      )}
    </div>
  )
}

// ==========================================
// Client Detail Component
// ==========================================

function ClientDetail({
  client, contacts, interactions, documents, feedbacks, calendarEvents,
  onClose, onDelete, onHardDelete, onEdit, onAddContact, onAddInteraction, onAddFeedback,
  showNewContact, setShowNewContact, formatCurrency, serviceStatusIcon, serviceStatusLabel,
  hasFinancialAccess, isAdminOrDiretor
}: {
  hasFinancialAccess: boolean
  client: Client
  contacts: any[]
  interactions: any[]
  documents: any[]
  feedbacks: any[]
  calendarEvents: any[]
  onClose: () => void
  onDelete: (id: string) => void
  onHardDelete: (id: string) => void
  onEdit: () => void
  isAdminOrDiretor: boolean
  onAddContact: (c: any) => void
  onAddInteraction: (i: any) => void
  onAddFeedback: (f: any) => void
  showNewContact: boolean
  setShowNewContact: (v: boolean) => void
  formatCurrency: (v: number) => string
  serviceStatusIcon: (s: ClientService['status']) => React.ReactNode
  serviceStatusLabel: (s: ClientService['status']) => string
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

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
      <div className="p-6 border-b border-slate-100">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-teal to-brand-blue flex items-center justify-center text-white font-black text-lg flex-shrink-0 shadow-lg shadow-brand-teal/20">
              {(client.companyTradeName || '?').charAt(0)}
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
            <button onClick={onEdit} className="p-2 rounded-xl hover:bg-brand-teal/10 text-brand-teal transition-all" title="Editar cliente">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 transition-all">
              <X className="w-4 h-4" />
            </button>
            {isAdminOrDiretor && (
              <>
                <button onClick={() => onHardDelete(client.id)} className="p-2 rounded-xl hover:bg-red-50 text-red-400 transition-all" title="Excluir permanentemente">
                  <Trash2 className="w-4 h-4" />
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="p-2 rounded-xl hover:bg-amber-50 text-amber-400 transition-all" title="Inativar cliente">
                  <AlertCircle className="w-4 h-4" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

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

      <div className="p-6 overflow-y-auto max-h-[calc(100vh-280px)]">
        {tab === 'info' && (
          <div className="space-y-6">
            {/* Services with schedule */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Serviços Contratados</h4>
              <div className="space-y-3">
                {client.services.map(s => {
                  const daysTotal = Math.ceil(Math.max(1, (new Date(s.endDate).getTime() - new Date(s.startDate).getTime()) / (1000 * 60 * 60 * 24)))
                  const daysElapsed = Math.max(0, Math.ceil((Date.now() - new Date(s.startDate).getTime()) / (1000 * 60 * 60 * 24)))
                  const calcProgress = s.status === 'not_started' ? 0 : s.status === 'completed' ? 100 : Math.min(100, Math.round((daysElapsed / daysTotal) * 100))
                  const barProgress = s.progress > 0 ? s.progress : calcProgress
                  return (
                    <div key={s.name} className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {serviceStatusIcon(s.status)}
                          <span className="font-bold text-sm text-slate-800">{s.name}</span>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                          s.status === 'not_started' ? 'bg-slate-200 text-slate-600' :
                          s.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
                          s.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {serviceStatusLabel(s.status)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 mb-2">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(s.startDate).toLocaleDateString('pt-BR')}</span>
                        <span className="text-slate-300">→</span>
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(s.endDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div className={`h-full rounded-full transition-all ${
                            s.status === 'completed' ? 'bg-emerald-500' :
                            s.status === 'delayed' ? 'bg-red-500' :
                            s.status === 'not_started' ? 'bg-slate-300' :
                            'bg-blue-500'
                          }`} style={{ width: `${barProgress}%` }} />
                        </div>
                        <span className="text-[10px] font-bold text-slate-500 w-8 text-right">{barProgress}%</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Contract type & timeline */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tipo de Contrato</h4>
                <div className="flex items-center gap-2">
                  {client.contractType === 'first' ? (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-brand-teal/10 flex items-center justify-center">
                        <Star className="w-4 h-4 text-brand-teal" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Primeiro Contrato</p>
                        <p className="text-[10px] text-slate-400">Cliente novo na carteira</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center">
                        <RotateCcw className="w-4 h-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">Renovação</p>
                        <p className="text-[10px] text-slate-400">Cliente recorrente</p>
                      </div>
                    </>
                  )}
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Responsável Interno</h4>
                <p className="text-sm text-slate-700 font-medium">{client.internalResponsible || 'Não definido'}</p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Vigência do Contrato</h4>
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
                    <span className="font-bold text-slate-800">{hasFinancialAccess ? formatCurrency(client.monthlyValue) : <NoAccess />}</span>
                  </div>
                  <div className="flex justify-between text-sm border-t border-slate-200 pt-2">
                    <span className="text-slate-400">Valor Total</span>
                    <span className="font-bold text-brand-teal">{hasFinancialAccess ? formatCurrency(client.totalValue) : <NoAccess />}</span>
                  </div>
                </div>

                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider pt-2">Segmento</h4>
                <span className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold inline-block">{client.segment}</span>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Observações</h4>
              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 rounded-2xl p-3">{client.notes || 'Sem observações.'}</p>
            </div>
          </div>
        )}

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

        {tab === 'interactions' && (
          <div className="space-y-3">
            {/* Calendar events */}
            {calendarEvents.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" /> Agenda
                </h4>
                <div className="space-y-2">
                  {calendarEvents.map(ev => (
                    <div key={ev.id} className="p-3 bg-violet-50 rounded-2xl border border-violet-100">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ev.color || '#8b5cf6' }} />
                          <span className="font-bold text-sm text-slate-800">{ev.title}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                            ev.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                            ev.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                            ev.status === 'completed' ? 'bg-slate-200 text-slate-500' :
                            ev.status === 'canceled' ? 'bg-red-100 text-red-400' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {ev.status === 'scheduled' ? 'Agendado' : ev.status === 'confirmed' ? 'Confirmado' : ev.status === 'completed' ? 'Realizado' : ev.status === 'canceled' ? 'Cancelado' : 'Reagendado'}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[11px] text-slate-400">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(ev.eventDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{ev.startTime.slice(0, 5)} - {ev.endTime.slice(0, 5)}</span>
                        {ev.responsible && <span className="flex items-center gap-1"><User className="w-3 h-3" />{ev.responsible}</span>}
                      </div>
                      {ev.description && <p className="text-xs text-slate-500 mt-1">{ev.description}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Manual interactions */}
            <div>
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" /> Registros Manuais
              </h4>
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
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
                {interactions.length === 0 && <p className="text-xs text-slate-400 text-center py-2">Nenhum registro manual.</p>}
              </div>
            </div>

            {/* Add interaction form */}
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/20 flex items-center justify-center" onClick={() => setShowDeleteConfirm(false)}>
          <div className="bg-white rounded-2xl shadow-xl border border-slate-100 p-5 w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600"><AlertCircle className="w-5 h-5" /></div>
              <div>
                <h3 className="text-sm font-black text-slate-800">Inativar Cliente</h3>
                <p className="text-xs text-slate-500 mt-0.5">O cliente ficará como cancelado no histórico.</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-4">
              Tem certeza que deseja inativar o cliente <strong>{client.companyTradeName || client.companyName}</strong>?
              O cliente será marcado como <strong>cancelado</strong> e todos os dados vinculados (contatos, interações, documentos, feedbacks) serão preservados.
            </p>
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button onClick={() => { onDelete(client.id); setShowDeleteConfirm(false) }} className="flex-1 px-3 py-2 bg-amber-600 text-white text-[11px] font-bold rounded-xl hover:bg-amber-700 transition-all">Confirmar Inativação</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-2 border border-slate-200 text-[11px] font-semibold rounded-xl hover:bg-slate-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ==========================================
// New Client Modal
// ==========================================

function NewClientModal({ onSave, onUpdate, onClose, formatCurrency, editData, hasFinancialAccess }: {
  onSave?: (c: any) => any
  onUpdate?: (id: string, updates: Partial<Client>) => void
  onClose: () => void
  formatCurrency: (v: number) => string
  editData?: Client
  hasFinancialAccess?: boolean
}) {
  const isEdit = !!editData
  const initialForm = isEdit ? {
    companyId: editData.companyId,
    companyName: editData.companyName,
    companyTradeName: editData.companyTradeName,
    cnpj: editData.cnpj,
    segment: editData.segment,
    city: editData.city,
    state: editData.state,
    services: editData.services.map(s => s.name),
    contractType: editData.contractType,
    internalResponsible: editData.internalResponsible,
    status: editData.status,
    startDate: editData.startDate,
    endDate: editData.endDate,
    monthlyValue: editData.monthlyValue,
    totalValue: editData.totalValue,
    notes: editData.notes
  } : {
    companyId: `cli-comp-${Date.now()}`,
    companyName: '',
    companyTradeName: '',
    cnpj: '',
    segment: '',
    city: '',
    state: '',
    services: [] as string[],
    contractType: 'first' as ContractType,
    internalResponsible: '',
    status: 'active' as Client['status'],
    startDate: '',
    endDate: '',
    monthlyValue: 0,
    totalValue: 0,
    notes: ''
  }
  const [form, setForm] = useState(initialForm)

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
    if (isEdit && onUpdate && editData) {
      onUpdate(editData.id, {
        ...form,
        services: form.services.map(name => {
          const existing = editData.services.find(s => s.name === name)
          return existing || { name, status: 'not_started' as const, startDate: form.startDate, endDate: form.endDate, progress: 0 }
        })
      })
      onClose()
    } else if (onSave) {
      const clientData = {
        ...form,
        services: form.services.map(name => ({
          name,
          status: 'not_started' as const,
          startDate: form.startDate,
          endDate: form.endDate,
          progress: 0
        }))
      }
      const client = onSave(clientData)
      if (client) onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="p-6 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-800">{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</h2>
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
              <label className="text-xs font-bold text-slate-400 mb-1 block">Tipo de Contrato</label>
              <select value={form.contractType} onChange={e => setForm(f => ({ ...f, contractType: e.target.value as ContractType }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20 bg-white">
                <option value="first">Primeiro Contrato</option>
                <option value="renewal">Renovação</option>
              </select>
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
            {hasFinancialAccess && (
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Valor Mensal</label>
                <input type="number" value={form.monthlyValue || ''} onChange={e => { setForm(f => ({ ...f, monthlyValue: Number(e.target.value) })); calcTotal() }} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
              </div>
            )}
            {hasFinancialAccess && (
              <div>
                <label className="text-xs font-bold text-slate-400 mb-1 block">Valor Total</label>
                <input type="number" value={form.totalValue || ''} onChange={e => setForm(f => ({ ...f, totalValue: Number(e.target.value) }))} className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-brand-teal/20" />
              </div>
            )}
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
