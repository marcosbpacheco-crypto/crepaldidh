'use client'

import React, { useState, useMemo } from 'react'
import { useCrm, Deal } from '../context/CrmContext'
import { useAdmin } from '../../admin/context/AdminContext'
import { 
  Plus, Search, Filter, DollarSign, Calendar, User, 
  ChevronRight, Trash2, Edit2, X, AlertCircle, Lock
} from 'lucide-react'

const NoAccess = () => (
  <span className="flex items-center gap-1 text-slate-300 font-bold">
    <Lock className="w-3 h-3" />
    ---
  </span>
)

export const CrmPipeline: React.FC = () => {
  const { 
    deals, companies, sellers, services, pipelineStages, 
    addDeal, updateDeal, moveDeal, deleteDeal 
  } = useCrm()
  const hasFinancialAccess = useAdmin().checkPermission('financial', 'view')

  // 1. Filter States
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedService, setSelectedService] = useState('all')
  const [selectedSeller, setSelectedSeller] = useState('all')
  const [draggedOverStage, setDraggedOverStage] = useState<string | null>(null)

  // 2. Modals States
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null)

  // Create Form State
  const [newDealForm, setNewDealForm] = useState({
    title: '',
    companyId: '',
    service: services[0] || '',
    value: 0,
    stage: pipelineStages[0] || '',
    sellerId: sellers[0]?.id || '',
    notes: '',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] // 7 days from now
  })

  // Edit Form State
  const [editDealForm, setEditDealForm] = useState<Partial<Deal>>({})

  // 3. Filtered Deals
  const filteredDeals = useMemo(() => {
    return deals.filter(deal => {
      const comp = companies.find(c => c.id === deal.companyId)
      const matchesSearch = 
        deal.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (comp && comp.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (comp && comp.tradeName.toLowerCase().includes(searchTerm.toLowerCase()))

      const matchesService = selectedService === 'all' || deal.service === selectedService
      const matchesSeller = selectedSeller === 'all' || deal.sellerId === selectedSeller

      return matchesSearch && matchesService && matchesSeller
    })
  }, [deals, companies, searchTerm, selectedService, selectedSeller])

  // Group deals by stage
  const dealsByStage = useMemo(() => {
    const groups: Record<string, Deal[]> = {}
    pipelineStages.forEach(stage => {
      groups[stage] = []
    })
    filteredDeals.forEach(deal => {
      if (groups[deal.stage]) {
        groups[deal.stage].push(deal)
      }
    })
    return groups
  }, [filteredDeals, pipelineStages])

  // Sum values by stage
  const stageValues = useMemo(() => {
    const sums: Record<string, number> = {}
    pipelineStages.forEach(stage => {
      sums[stage] = (dealsByStage[stage] || []).reduce((sum, d) => sum + d.value, 0)
    })
    return sums
  }, [dealsByStage, pipelineStages])

  // 4. Drag and Drop handlers
  const handleDragStart = (e: React.DragEvent, dealId: string) => {
    e.dataTransfer.setData('text/plain', dealId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    setDraggedOverStage(stage)
  }

  const handleDragLeave = () => {
    setDraggedOverStage(null)
  }

  const handleDrop = (e: React.DragEvent, stage: string) => {
    e.preventDefault()
    setDraggedOverStage(null)
    const dealId = e.dataTransfer.getData('text/plain')
    if (dealId) {
      moveDeal(dealId, stage)
    }
  }

  // 5. Submit handlers
  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newDealForm.title || !newDealForm.companyId) {
      alert('Preencha o título e selecione uma empresa!')
      return
    }

    addDeal({
      title: newDealForm.title,
      companyId: newDealForm.companyId,
      service: newDealForm.service,
      value: Number(newDealForm.value),
      stage: newDealForm.stage,
      sellerId: newDealForm.sellerId,
      notes: newDealForm.notes,
      dueDate: newDealForm.dueDate
    })

    // Reset Form & Close
    setNewDealForm({
      title: '',
      companyId: '',
      service: services[0] || '',
      value: 0,
      stage: pipelineStages[0] || '',
      sellerId: sellers[0]?.id || '',
      notes: '',
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    })
    setIsCreateModalOpen(false)
  }

  const handleEditClick = (deal: Deal) => {
    setSelectedDeal(deal)
    setEditDealForm(deal)
    setIsEditModalOpen(true)
  }

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedDeal && editDealForm.title) {
      updateDeal(selectedDeal.id, editDealForm)
      setIsEditModalOpen(false)
      setSelectedDeal(null)
    }
  }

  return (
    <div className="space-y-6 flex flex-col h-[calc(100vh-140px)] animate-fade-in">
      
      {/* Top Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Left Side: Search and Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[200px] md:flex-initial">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar negócio ou empresa..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-full focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all text-xs"
            />
          </div>

          {/* Service Filter */}
          <div className="relative">
            <select
              value={selectedService}
              onChange={e => setSelectedService(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-full pl-4 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all"
            >
              <option value="all">Todos os Serviços</option>
              {services.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Seller Filter */}
          <div className="relative">
            <select
              value={selectedSeller}
              onChange={e => setSelectedSeller(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 rounded-full pl-4 pr-8 py-2 text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal transition-all"
            >
              <option value="all">Todos os Responsáveis</option>
              {sellers.map(sel => (
                <option key={sel.id} value={sel.id}>{sel.name}</option>
              ))}
            </select>
            <Filter className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Right Side: Add Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="w-full md:w-auto bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs py-2.5 px-5 rounded-full flex items-center justify-center gap-1.5 transition-all shadow-md shadow-brand-teal/10 hover:shadow-lg"
        >
          <Plus className="w-4 h-4" />
          Novo Negócio
        </button>
      </div>

      {/* Kanban Board Layout */}
      <div className="flex-1 overflow-x-auto pb-4 flex gap-4 scrollbar-thin select-none">
        
        {pipelineStages.map(stage => {
          const stageDeals = dealsByStage[stage] || []
          const stageSum = stageValues[stage] || 0
          const isOver = draggedOverStage === stage

          return (
            <div
              key={stage}
              onDragOver={e => handleDragOver(e, stage)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, stage)}
              className={`flex-shrink-0 w-80 rounded-2xl flex flex-col h-full transition-all duration-300 ${
                isOver ? 'bg-brand-teal/5 border-2 border-dashed border-brand-teal' : 'bg-slate-50/50 border border-slate-100'
              }`}
            >
              {/* Stage Header */}
              <div className="p-4 flex items-center justify-between border-b border-slate-100/60 bg-white/65 backdrop-blur-sm rounded-t-2xl">
                <div>
                  <h5 className="text-slate-700 font-bold text-xs flex items-center gap-1.5">
                    {stage}
                    <span className="bg-slate-100 text-slate-500 font-semibold px-2 py-0.5 rounded-full text-[10px]">
                      {stageDeals.length}
                    </span>
                  </h5>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase mt-0.5 block">
                    {hasFinancialAccess ? `R$ ${stageSum.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}` : <NoAccess />}
                  </span>
                </div>
              </div>

              {/* Deals Container */}
              <div className="flex-1 overflow-y-auto p-3 space-y-3 scrollbar-none">
                {stageDeals.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                    <span className="text-[10px] font-bold uppercase tracking-wider">Solte os cards aqui</span>
                  </div>
                ) : (
                  stageDeals.map(deal => {
                    const comp = companies.find(c => c.id === deal.companyId)
                    const seller = sellers.find(s => s.id === deal.sellerId)
                    const isLost = deal.stage === 'Cliente perdido'

                    return (
                      <div
                        key={deal.id}
                        draggable
                        onDragStart={e => handleDragStart(e, deal.id)}
                        className={`bg-white p-4 rounded-xl border border-slate-100 shadow-sm hover:shadow-md cursor-grab active:cursor-grabbing transition-all border-l-4 group relative ${
                          isLost ? 'border-l-red-500' : 'border-l-brand-teal'
                        }`}
                      >
                        {/* Edit & Delete Action Hover buttons */}
                        <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 flex gap-1 transition-opacity">
                          <button
                            onClick={() => handleEditClick(deal)}
                            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded transition-colors"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Excluir o negócio "${deal.title}"?`)) {
                                deleteDeal(deal.id)
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title and Company */}
                        <div className="pr-12">
                          <span className="text-[9px] font-black uppercase text-brand-blue tracking-wider">
                            {comp ? comp.tradeName : 'Empresa Indefinida'}
                          </span>
                          <h6 className="text-slate-700 font-bold text-xs mt-0.5 leading-snug line-clamp-1">{deal.title}</h6>
                        </div>

                        {/* Service Label */}
                        <div className="mt-2.5">
                          <span className="bg-slate-50 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-100">
                            {deal.service}
                          </span>
                        </div>

                        {/* Footer details: Value & Owner */}
                        <div className="mt-4 flex items-center justify-between border-t border-slate-50 pt-2 text-[10px]">
                          <div className="flex items-center gap-1 text-slate-700 font-bold">
                            <DollarSign className="w-3.5 h-3.5 text-brand-teal flex-shrink-0" />
                            {hasFinancialAccess ? (
                              <span>{deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            ) : (
                              <NoAccess />
                            )}
                          </div>

                          <div className="flex items-center gap-1.5">
                            {deal.dueDate && (
                              <div className="flex items-center text-slate-400 font-medium mr-1.5" title="Follow-up">
                                <Calendar className="w-3 h-3 text-slate-400 mr-0.5" />
                                <span>{deal.dueDate.split('-').slice(1).reverse().join('/')}</span>
                              </div>
                            )}
                            <div
                              className="w-5 h-5 rounded-full bg-brand-blue text-white font-bold flex items-center justify-center text-[9px]"
                              title={seller ? seller.name : 'Responsável'}
                            >
                              {seller ? seller.avatar : '?'}
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )
        })}

      </div>

      {/* ==========================================
          MODAL: CRIAR NEGÓCIO
          ========================================== */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-black text-lg">Adicionar Negócio</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título do Negócio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Diagnóstico Psicossocial - Vale"
                  value={newDealForm.title}
                  onChange={e => setNewDealForm({ ...newDealForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Empresa *</label>
                  <select
                    required
                    value={newDealForm.companyId}
                    onChange={e => setNewDealForm({ ...newDealForm, companyId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  >
                    <option value="">Selecione uma empresa...</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Service selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Serviço da Crepaldi</label>
                  <select
                    value={newDealForm.service}
                    onChange={e => setNewDealForm({ ...newDealForm, service: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  >
                    {services.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0.00"
                    value={newDealForm.value || ''}
                    onChange={e => setNewDealForm({ ...newDealForm, value: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  />
                </div>

                {/* Next Follow-up Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Próxima Ação (Follow-up)</label>
                  <input
                    type="date"
                    value={newDealForm.dueDate}
                    onChange={e => setNewDealForm({ ...newDealForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stage */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Etapa Inicial</label>
                  <select
                    value={newDealForm.stage}
                    onChange={e => setNewDealForm({ ...newDealForm, stage: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  >
                    {pipelineStages.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Seller */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Responsável Comercial</label>
                  <select
                    value={newDealForm.sellerId}
                    onChange={e => setNewDealForm({ ...newDealForm, sellerId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  >
                    {sellers.map(se => (
                      <option key={se.id} value={se.id}>{se.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações / Próximos Passos</label>
                <textarea
                  placeholder="Detalhamento do contato inicial, escopo pré-definido, etc."
                  value={newDealForm.notes}
                  onChange={e => setNewDealForm({ ...newDealForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs transition-all shadow-md shadow-brand-teal/10"
                >
                  Adicionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODAL: EDITAR NEGÓCIO
          ========================================== */}
      {isEditModalOpen && selectedDeal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl border border-slate-100 overflow-hidden flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-slate-800 font-black text-lg">Editar Negócio</h3>
              <button
                onClick={() => {
                  setIsEditModalOpen(false)
                  setSelectedDeal(null)
                }}
                className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-full transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Título do Negócio *</label>
                <input
                  type="text"
                  required
                  value={editDealForm.title || ''}
                  onChange={e => setEditDealForm({ ...editDealForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Company Selection (ReadOnly for safety) */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Empresa</label>
                  <select
                    disabled
                    value={editDealForm.companyId || ''}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 text-slate-500 cursor-not-allowed text-xs"
                  >
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.tradeName || c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Service selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Serviço da Crepaldi</label>
                  <select
                    value={editDealForm.service || ''}
                    onChange={e => setEditDealForm({ ...editDealForm, service: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  >
                    {services.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Value */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Valor Estimado (R$)</label>
                  <input
                    type="number"
                    min="0"
                    value={editDealForm.value || ''}
                    onChange={e => setEditDealForm({ ...editDealForm, value: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  />
                </div>

                {/* Next Follow-up Date */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Próxima Ação (Follow-up)</label>
                  <input
                    type="date"
                    value={editDealForm.dueDate || ''}
                    onChange={e => setEditDealForm({ ...editDealForm, dueDate: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Stage */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Etapa do Funil</label>
                  <select
                    value={editDealForm.stage || ''}
                    onChange={e => setEditDealForm({ ...editDealForm, stage: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  >
                    {pipelineStages.map(st => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                {/* Seller */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Responsável Comercial</label>
                  <select
                    value={editDealForm.sellerId || ''}
                    onChange={e => setEditDealForm({ ...editDealForm, sellerId: e.target.value })}
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                  >
                    {sellers.map(se => (
                      <option key={se.id} value={se.id}>{se.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Conditional Lost Reason */}
              {editDealForm.stage === 'Cliente perdido' && (
                <div>
                  <label className="block text-xs font-bold text-red-600 uppercase tracking-wider mb-1">Motivo da Perda *</label>
                  <select
                    required
                    value={editDealForm.lostReason || ''}
                    onChange={e => setEditDealForm({ ...editDealForm, lostReason: e.target.value })}
                    className="w-full px-4 py-2.5 border border-red-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-red-500/50 focus:border-red-500 text-xs"
                  >
                    <option value="">Selecione um motivo...</option>
                    <option value="Sem orçamento">Falta de orçamento</option>
                    <option value="Perdido para concorrente">Perdido para concorrente</option>
                    <option value="Decisão adiada">Decisão adiada internamente</option>
                    <option value="Escopo incompatível">Escopo incompatível</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Observações / Histórico de Negociação</label>
                <textarea
                  value={editDealForm.notes || ''}
                  onChange={e => setEditDealForm({ ...editDealForm, notes: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-teal/50 focus:border-brand-teal text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false)
                    setSelectedDeal(null)
                  }}
                  className="px-5 py-2.5 rounded-full border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-xs transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-full bg-brand-teal hover:bg-brand-teal/95 text-white font-bold text-xs transition-all shadow-md shadow-brand-teal/10"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
