'use client'

import React, { useState, useMemo } from 'react'
import { useCrm, Company, Contact } from '../context/CrmContext'
import { 
  Building2, Users, Search, Plus, Mail, Phone, MapPin, 
  Globe, Link2, Edit2, Trash2, X, PlusCircle, Check,
  AlertCircle, FileText
} from 'lucide-react'

export const CrmCompanies: React.FC = () => {
  const { 
    companies, contacts, deals, activities,
    addCompany, updateCompany, deleteCompany,
    addContact, updateContact, deleteContact
  } = useCrm()

  // 1. Selection & Search States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(companies[0]?.id || '')

  // Modals States
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false)
  const [isEditCompanyOpen, setIsEditCompanyOpen] = useState(false)
  const [isContactModalOpen, setIsContactModalOpen] = useState(false)
  const [isEditContactOpen, setIsEditContactOpen] = useState(false)
  
  // Selected Contact for editing
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)

  // Forms
  const [companyForm, setCompanyForm] = useState({
    name: '',
    tradeName: '',
    cnpj: '',
    segment: 'Indústria',
    employees: 10,
    city: '',
    state: '',
    website: '',
    instagram: '',
    respPrincipal: '',
    respRH: '',
    respFinanceiro: '',
    phone: '',
    email: '',
    notes: '',
    status: 'active' as 'active' | 'inactive'
  })

  const [contactForm, setContactForm] = useState({
    name: '',
    role: '',
    phone: '',
    whatsapp: '',
    email: '',
    birthday: '',
    influence: 'medium' as 'high' | 'medium' | 'low',
    notes: ''
  })

  // 2. Computed Data
  const filteredCompanies = useMemo(() => {
    return companies.filter(c => {
      const term = searchTerm.toLowerCase()
      return (
        c.name.toLowerCase().includes(term) ||
        c.tradeName.toLowerCase().includes(term) ||
        c.cnpj.includes(term) ||
        c.segment.toLowerCase().includes(term)
      )
    })
  }, [companies, searchTerm])

  const selectedCompany = useMemo(() => {
    return companies.find(c => c.id === selectedCompanyId) || filteredCompanies[0]
  }, [companies, selectedCompanyId, filteredCompanies])

  const selectedCompanyContacts = useMemo(() => {
    if (!selectedCompany) return []
    return contacts.filter(c => c.companyId === selectedCompany.id)
  }, [contacts, selectedCompany])

  const selectedCompanyDeals = useMemo(() => {
    if (!selectedCompany) return []
    return deals.filter(d => d.companyId === selectedCompany.id)
  }, [deals, selectedCompany])

  // 3. Actions
  const handleCreateCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!companyForm.name || !companyForm.tradeName) {
      alert('Razão Social e Nome Fantasia são obrigatórios.')
      return
    }

    const created = addCompany(companyForm)
    setSelectedCompanyId(created.id)
    setIsCompanyModalOpen(false)
    
    // Reset Form
    setCompanyForm({
      name: '',
      tradeName: '',
      cnpj: '',
      segment: 'Indústria',
      employees: 10,
      city: '',
      state: '',
      website: '',
      instagram: '',
      respPrincipal: '',
      respRH: '',
      respFinanceiro: '',
      phone: '',
      email: '',
      notes: '',
      status: 'active'
    })
  }

  const handleEditCompanySubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedCompany && companyForm.name) {
      updateCompany(selectedCompany.id, companyForm)
      setIsEditCompanyOpen(false)
    }
  }

  const handleOpenEditCompany = () => {
    if (!selectedCompany) return
    setCompanyForm({
      name: selectedCompany.name,
      tradeName: selectedCompany.tradeName,
      cnpj: selectedCompany.cnpj,
      segment: selectedCompany.segment,
      employees: selectedCompany.employees,
      city: selectedCompany.city,
      state: selectedCompany.state,
      website: selectedCompany.website,
      instagram: selectedCompany.instagram,
      respPrincipal: selectedCompany.respPrincipal,
      respRH: selectedCompany.respRH,
      respFinanceiro: selectedCompany.respFinanceiro,
      phone: selectedCompany.phone,
      email: selectedCompany.email,
      notes: selectedCompany.notes,
      status: selectedCompany.status
    })
    setIsEditCompanyOpen(true)
  }

  const handleAddContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCompany) return
    if (!contactForm.name) {
      alert('Nome do contato é obrigatório.')
      return
    }

    addContact({
      ...contactForm,
      companyId: selectedCompany.id
    })

    setIsContactModalOpen(false)
    setContactForm({
      name: '',
      role: '',
      phone: '',
      whatsapp: '',
      email: '',
      birthday: '',
      influence: 'medium',
      notes: ''
    })
  }

  const handleOpenEditContact = (cont: Contact) => {
    setSelectedContact(cont)
    setContactForm({
      name: cont.name,
      role: cont.role,
      phone: cont.phone,
      whatsapp: cont.whatsapp,
      email: cont.email,
      birthday: cont.birthday,
      influence: cont.influence,
      notes: cont.notes
    })
    setIsEditContactOpen(true)
  }

  const handleEditContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedContact) {
      updateContact(selectedContact.id, contactForm)
      setIsEditContactOpen(false)
      setSelectedContact(null)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)] animate-fade-in">
      
      {/* LEFT SIDEBAR: List of Companies (4 cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
        
        {/* Header with Search and Add */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-slate-800 font-black text-sm flex items-center gap-2">
              <Building2 className="w-5 h-5 text-brand-teal" />
              Empresas
            </h4>
            <button
              onClick={() => setIsCompanyModalOpen(true)}
              className="p-1.5 bg-brand-teal hover:bg-brand-teal/95 text-white rounded-full transition-all shadow-sm"
              title="Nova Empresa"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nome, CNPJ, segmento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs transition-all"
            />
          </div>
        </div>

        {/* Companies List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredCompanies.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">Nenhuma empresa encontrada.</div>
          ) : (
            filteredCompanies.map(c => {
              const isSelected = selectedCompany && c.id === selectedCompany.id
              return (
                <div
                  key={c.id}
                  onClick={() => setSelectedCompanyId(c.id)}
                  className={`p-4 cursor-pointer hover:bg-slate-50 transition-colors flex items-center justify-between border-l-4 ${
                    isSelected ? 'bg-slate-50/80 border-l-brand-teal' : 'border-l-transparent'
                  }`}
                >
                  <div className="min-w-0 pr-4">
                    <h5 className="text-slate-700 font-bold text-xs truncate">{c.tradeName || c.name}</h5>
                    <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{c.segment}</span>
                  </div>
                  <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                    c.status === 'active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    {c.status === 'active' ? 'Ativa' : 'Inativa'}
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Details of Selected Company (8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-100 shadow-sm flex flex-col h-full overflow-hidden">
        {selectedCompany ? (
          <div className="flex-1 flex flex-col h-full overflow-hidden">
            
            {/* Detail Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{selectedCompany.cnpj}</span>
                <h3 className="text-slate-800 font-black text-xl flex items-center gap-2 mt-1">
                  {selectedCompany.tradeName || selectedCompany.name}
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full uppercase ${
                    selectedCompany.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {selectedCompany.status === 'active' ? 'Ativa' : 'Inativa'}
                  </span>
                </h3>
                <span className="text-xs text-slate-500 font-semibold">{selectedCompany.name}</span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenEditCompany}
                  className="p-2 border border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                  title="Editar Cadastro"
                >
                  <Edit2 className="w-4 h-4" />
                  Editar
                </button>
                <button
                  onClick={() => {
                    if (confirm(`Atenção: Excluir a empresa "${selectedCompany.tradeName}" e todos os contatos/negócios vinculados?`)) {
                      deleteCompany(selectedCompany.id)
                    }
                  }}
                  className="p-2 border border-red-200 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all flex items-center justify-center gap-1.5 text-xs font-bold"
                  title="Excluir Empresa"
                >
                  <Trash2 className="w-4 h-4" />
                  Excluir
                </button>
              </div>
            </div>

            {/* Details and Lists (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-thin">
              
              {/* Core Information Section */}
              <div className="bg-slate-50/50 border border-slate-100 p-5 rounded-2xl">
                <h4 className="text-slate-800 font-bold text-xs uppercase tracking-wider mb-4 border-b border-slate-100 pb-2">Informações Cadastrais</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-xs">
                  <div>
                    <span className="text-slate-400 block font-medium">Segmento</span>
                    <span className="text-slate-700 font-bold">{selectedCompany.segment}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Nº de Colaboradores</span>
                    <span className="text-slate-700 font-bold">{selectedCompany.employees}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Localização</span>
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCompany.city} - {selectedCompany.state}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Site</span>
                    {selectedCompany.website ? (
                      <a href={`https://${selectedCompany.website}`} target="_blank" rel="noreferrer" className="text-brand-teal hover:underline font-bold flex items-center gap-1">
                        <Globe className="w-3.5 h-3.5" />
                        {selectedCompany.website}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Instagram</span>
                    {selectedCompany.instagram ? (
                      <a href={`https://instagram.com/${selectedCompany.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className="text-pink-600 hover:underline font-bold flex items-center gap-1">
                        <Link2 className="w-3.5 h-3.5" />
                        {selectedCompany.instagram}
                      </a>
                    ) : (
                      <span className="text-slate-400 italic">Não informado</span>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Telefone Principal</span>
                    <span className="text-slate-700 font-bold flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      {selectedCompany.phone || 'N/A'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs mt-6 pt-4 border-t border-slate-100/50">
                  <div>
                    <span className="text-slate-400 block font-medium">Responsável Principal</span>
                    <span className="text-slate-700 font-bold">{selectedCompany.respPrincipal || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Responsável RH/DHO</span>
                    <span className="text-slate-700 font-bold">{selectedCompany.respRH || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Responsável Financeiro</span>
                    <span className="text-slate-700 font-bold">{selectedCompany.respFinanceiro || 'N/A'}</span>
                  </div>
                </div>

                {selectedCompany.notes && (
                  <div className="mt-6 pt-4 border-t border-slate-100/50 text-xs">
                    <span className="text-slate-400 block font-medium mb-1">Observações Internas</span>
                    <p className="text-slate-600 leading-relaxed italic bg-white p-3 rounded-xl border border-slate-100">{selectedCompany.notes}</p>
                  </div>
                )}
              </div>

              {/* Contacts Subsection */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-slate-800 font-bold text-sm flex items-center gap-2">
                    <Users className="w-5 h-5 text-brand-blue" />
                    Múltiplos Contatos ({selectedCompanyContacts.length})
                  </h4>
                  <button
                    onClick={() => setIsContactModalOpen(true)}
                    className="text-xs text-brand-teal hover:text-brand-teal/80 font-bold flex items-center gap-1"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Novo Contato
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedCompanyContacts.length === 0 ? (
                    <div className="md:col-span-2 p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs">
                      Nenhum contato associado a esta empresa.
                    </div>
                  ) : (
                    selectedCompanyContacts.map(cont => (
                      <div key={cont.id} className="bg-white p-4 rounded-xl border border-slate-100 shadow-sm relative group hover:shadow">
                        {/* Edit & Delete Action Buttons */}
                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button
                            onClick={() => handleOpenEditContact(cont)}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o contato "${cont.name}"?`)) {
                                deleteContact(cont.id)
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>

                        <div className="pr-12">
                          <h5 className="font-bold text-slate-800 text-xs">{cont.name}</h5>
                          <span className="text-[10px] text-slate-400 font-medium block mt-0.5">{cont.role}</span>
                        </div>

                        <div className="mt-3 space-y-1.5 text-[10px] text-slate-600">
                          {cont.email && (
                            <div className="flex items-center gap-2">
                              <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span className="truncate">{cont.email}</span>
                            </div>
                          )}
                          {(cont.phone || cont.whatsapp) && (
                            <div className="flex items-center gap-2">
                              <Phone className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              <span>{cont.whatsapp || cont.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-2 text-[10px]">
                          <span className={`px-2 py-0.5 rounded-full font-bold uppercase ${
                            cont.influence === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                            cont.influence === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                          }`}>
                            Poder de Decisão: {cont.influence}
                          </span>
                          
                          {cont.birthday && (
                            <span className="text-slate-400 font-medium">Aniv: {cont.birthday.split('-').slice(1).reverse().join('/')}</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Active Deals Subsection */}
              <div>
                <h4 className="text-slate-800 font-bold text-sm mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-amber-500" />
                  Negócios no Funil ({selectedCompanyDeals.length})
                </h4>
                {selectedCompanyDeals.length === 0 ? (
                  <div className="p-6 bg-slate-50/50 rounded-2xl border border-slate-100 text-center text-slate-400 text-xs">
                    Nenhum negócio ativo associado a esta empresa no momento.
                  </div>
                ) : (
                  <div className="border border-slate-100 rounded-xl overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 font-bold text-slate-500 border-b border-slate-100">
                          <th className="p-3">Título</th>
                          <th className="p-3">Serviço</th>
                          <th className="p-3">Valor</th>
                          <th className="p-3">Etapa</th>
                          <th className="p-3">Próx. Ação</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {selectedCompanyDeals.map(deal => (
                          <tr key={deal.id} className="hover:bg-slate-50/40">
                            <td className="p-3 font-bold text-slate-700">{deal.title}</td>
                            <td className="p-3 text-slate-600">{deal.service}</td>
                            <td className="p-3 font-bold text-brand-blue">R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                            <td className="p-3">
                              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded-full text-[9px]">
                                {deal.stage}
                              </span>
                            </td>
                            <td className="p-3 text-slate-500">{deal.dueDate || 'Sem data'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-400 p-12">
            <Building2 className="w-12 h-12 text-slate-300 mb-2 animate-bounce" />
            <h4 className="font-bold text-sm">Selecione uma empresa</h4>
            <p className="text-xs mt-1 text-slate-400">Clique em um dos itens da lista lateral para ver e gerenciar os dados da empresa.</p>
          </div>
        )}
      </div>

      {/* ==========================================
          MODAL: ADICIONAR EMPRESA
          ========================================== */}
      {isCompanyModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-black text-lg">Nova Empresa</h3>
              <button
                onClick={() => setIsCompanyModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCompanySubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Petrobras Distribuidora S.A."
                    value={companyForm.name}
                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: BR Distribuidora"
                    value={companyForm.tradeName}
                    onChange={e => setCompanyForm({ ...companyForm, tradeName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CNPJ</label>
                  <input
                    type="text"
                    placeholder="00.000.000/0000-00"
                    value={companyForm.cnpj}
                    onChange={e => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Segmento</label>
                  <input
                    type="text"
                    placeholder="Ex: Mineração, Energia"
                    value={companyForm.segment}
                    onChange={e => setCompanyForm({ ...companyForm, segment: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaboradores</label>
                  <input
                    type="number"
                    min="1"
                    value={companyForm.employees}
                    onChange={e => setCompanyForm({ ...companyForm, employees: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    placeholder="Cidade"
                    value={companyForm.city}
                    onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                  <input
                    type="text"
                    maxLength={2}
                    placeholder="UF"
                    value={companyForm.state}
                    onChange={e => setCompanyForm({ ...companyForm, state: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Site</label>
                  <input
                    type="text"
                    placeholder="www.site.com.br"
                    value={companyForm.website}
                    onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instagram</label>
                  <input
                    type="text"
                    placeholder="@perfil"
                    value={companyForm.instagram}
                    onChange={e => setCompanyForm({ ...companyForm, instagram: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resp. Principal</label>
                  <input
                    type="text"
                    value={companyForm.respPrincipal}
                    onChange={e => setCompanyForm({ ...companyForm, respPrincipal: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resp. RH/DHO</label>
                  <input
                    type="text"
                    value={companyForm.respRH}
                    onChange={e => setCompanyForm({ ...companyForm, respRH: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resp. Financeiro</label>
                  <input
                    type="text"
                    value={companyForm.respFinanceiro}
                    onChange={e => setCompanyForm({ ...companyForm, respFinanceiro: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone Principal</label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Principal</label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações / Histórico de Perfil</label>
                <textarea
                  value={companyForm.notes}
                  onChange={e => setCompanyForm({ ...companyForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCompanyModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs transition-all shadow-md"
                >
                  Criar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: EDITAR EMPRESA
          ========================================== */}
      {isEditCompanyOpen && selectedCompany && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-black text-lg">Editar Empresa</h3>
              <button
                onClick={() => setIsEditCompanyOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCompanySubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Razão Social *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.name}
                    onChange={e => setCompanyForm({ ...companyForm, name: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Fantasia *</label>
                  <input
                    type="text"
                    required
                    value={companyForm.tradeName}
                    onChange={e => setCompanyForm({ ...companyForm, tradeName: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">CNPJ</label>
                  <input
                    type="text"
                    value={companyForm.cnpj}
                    onChange={e => setCompanyForm({ ...companyForm, cnpj: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Segmento</label>
                  <input
                    type="text"
                    value={companyForm.segment}
                    onChange={e => setCompanyForm({ ...companyForm, segment: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Colaboradores</label>
                  <input
                    type="number"
                    min="1"
                    value={companyForm.employees}
                    onChange={e => setCompanyForm({ ...companyForm, employees: Number(e.target.value) })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cidade</label>
                  <input
                    type="text"
                    value={companyForm.city}
                    onChange={e => setCompanyForm({ ...companyForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Estado</label>
                  <input
                    type="text"
                    maxLength={2}
                    value={companyForm.state}
                    onChange={e => setCompanyForm({ ...companyForm, state: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Site</label>
                  <input
                    type="text"
                    value={companyForm.website}
                    onChange={e => setCompanyForm({ ...companyForm, website: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Instagram</label>
                  <input
                    type="text"
                    value={companyForm.instagram}
                    onChange={e => setCompanyForm({ ...companyForm, instagram: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resp. Principal</label>
                  <input
                    type="text"
                    value={companyForm.respPrincipal}
                    onChange={e => setCompanyForm({ ...companyForm, respPrincipal: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resp. RH/DHO</label>
                  <input
                    type="text"
                    value={companyForm.respRH}
                    onChange={e => setCompanyForm({ ...companyForm, respRH: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Resp. Financeiro</label>
                  <input
                    type="text"
                    value={companyForm.respFinanceiro}
                    onChange={e => setCompanyForm({ ...companyForm, respFinanceiro: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone Principal</label>
                  <input
                    type="text"
                    value={companyForm.phone}
                    onChange={e => setCompanyForm({ ...companyForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail Principal</label>
                  <input
                    type="email"
                    value={companyForm.email}
                    onChange={e => setCompanyForm({ ...companyForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Status</label>
                  <select
                    value={companyForm.status}
                    onChange={e => setCompanyForm({ ...companyForm, status: e.target.value as 'active' | 'inactive' })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  >
                    <option value="active">Ativa</option>
                    <option value="inactive">Inativa / Suspensa</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações Internas</label>
                <textarea
                  value={companyForm.notes}
                  onChange={e => setCompanyForm({ ...companyForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditCompanyOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs transition-all shadow-md"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: ADICIONAR CONTATO
          ========================================== */}
      {isContactModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-black text-lg">Novo Contato</h3>
              <button
                onClick={() => setIsContactModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddContactSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Nome do contato"
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
                  <input
                    type="text"
                    placeholder="Ex: Gerente de RH"
                    value={contactForm.role}
                    onChange={e => setContactForm({ ...contactForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Aniversário</label>
                  <input
                    type="date"
                    value={contactForm.birthday}
                    onChange={e => setContactForm({ ...contactForm, birthday: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone / Ramal</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                  <input
                    type="text"
                    placeholder="(XX) 9XXXX-XXXX"
                    value={contactForm.whatsapp}
                    onChange={e => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    placeholder="email@empresa.com"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Poder de Decisão</label>
                  <select
                    value={contactForm.influence}
                    onChange={e => setContactForm({ ...contactForm, influence: e.target.value as 'high' | 'medium' | 'low' })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  >
                    <option value="high">Alto (Decisor Final)</option>
                    <option value="medium">Médio (Influenciador)</option>
                    <option value="low">Baixo (Técnico / Operacional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações sobre o Contato</label>
                <textarea
                  value={contactForm.notes}
                  onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsContactModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs shadow-md"
                >
                  Adicionar Contato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: EDITAR CONTATO
          ========================================== */}
      {isEditContactOpen && selectedContact && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-black text-lg">Editar Contato</h3>
              <button
                onClick={() => {
                  setIsEditContactOpen(false)
                  setSelectedContact(null)
                }}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditContactSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
              
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo *</label>
                <input
                  type="text"
                  required
                  value={contactForm.name}
                  onChange={e => setContactForm({ ...contactForm, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cargo</label>
                  <input
                    type="text"
                    value={contactForm.role}
                    onChange={e => setContactForm({ ...contactForm, role: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Data de Aniversário</label>
                  <input
                    type="date"
                    value={contactForm.birthday}
                    onChange={e => setContactForm({ ...contactForm, birthday: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                  <input
                    type="text"
                    value={contactForm.phone}
                    onChange={e => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">WhatsApp</label>
                  <input
                    type="text"
                    value={contactForm.whatsapp}
                    onChange={e => setContactForm({ ...contactForm, whatsapp: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">E-mail</label>
                  <input
                    type="email"
                    value={contactForm.email}
                    onChange={e => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Poder de Decisão</label>
                  <select
                    value={contactForm.influence}
                    onChange={e => setContactForm({ ...contactForm, influence: e.target.value as 'high' | 'medium' | 'low' })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                  >
                    <option value="high">Alto (Decisor Final)</option>
                    <option value="medium">Médio (Influenciador)</option>
                    <option value="low">Baixo (Técnico / Operacional)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Observações</label>
                <textarea
                  value={contactForm.notes}
                  onChange={e => setContactForm({ ...contactForm, notes: e.target.value })}
                  rows={2}
                  className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditContactOpen(false)
                    setSelectedContact(null)
                  }}
                  className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs shadow-md"
                >
                  Salvar Contato
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
