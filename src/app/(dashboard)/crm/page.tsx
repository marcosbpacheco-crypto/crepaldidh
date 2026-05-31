'use client'

import React, { useState } from 'react'
import { CrmProvider, useCrm } from './context/CrmContext'
import { CrmDashboard } from './components/CrmDashboard'
import { CrmPipeline } from './components/CrmPipeline'
import { CrmCompanies } from './components/CrmCompanies'
import { CrmProposals } from './components/CrmProposals'
import { CrmTimeline } from './components/CrmTimeline'
import { CrmAIHelper } from './components/CrmAIHelper'
import { 
  BarChart3, Kanban, Building2, FileText, Calendar, 
  Brain, ShieldAlert, Users2, ShieldCheck, ShieldAlert as AlertIcon
} from 'lucide-react'

function CrmMainContent() {
  const { currentRole, setCurrentRole } = useCrm()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'pipeline' | 'companies' | 'proposals' | 'timeline' | 'ai'>('dashboard')

  // Permission Alerts helper
  const renderPermissionNotice = () => {
    if (currentRole === 'consultant' && activeTab === 'proposals') {
      return (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl flex items-start gap-3 text-amber-800 text-xs mb-6 font-semibold animate-pulse">
          <AlertIcon className="w-5 h-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Perfil Consultor - Acesso Limitado</p>
            <p className="text-[11px] font-normal text-amber-700/90 mt-0.5">Você possui permissão de leitura para propostas comerciais. A criação de propostas e edição de contratos está bloqueada para seu perfil.</p>
          </div>
        </div>
      )
    }

    if (currentRole === 'finance' && activeTab === 'pipeline') {
      return (
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4 rounded-xl flex items-start gap-3 text-blue-800 text-xs mb-6 font-semibold animate-pulse">
          <ShieldAlert className="w-5 h-5 text-blue-600 flex-shrink-0" />
          <div>
            <p className="font-bold">Perfil Financeiro - Modo Faturamento</p>
            <p className="text-[11px] font-normal text-blue-700/90 mt-0.5">O funil de vendas destina-se a fins informativos para previsão de receita. Recomenda-se focar na aba de Contratos para gerenciar faturamento.</p>
          </div>
        </div>
      )
    }

    return null
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-6">
      
      {/* Page Title & Role Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Gestão Comercial (CRM)
          </h1>
          <p className="text-slate-400 text-xs mt-1">Acompanhe funil de prospecção, emita propostas oficiais e veja histórico de relacionamento da CrepaldiDH.</p>
        </div>

        {/* Role-Based Simulation Selector */}
        <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm self-start sm:self-center">
          <div className="p-1.5 bg-brand-blue/10 rounded-xl text-brand-blue">
            <Users2 className="w-4 h-4" />
          </div>
          <div>
            <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Visualizar Perfil</span>
            <select
              value={currentRole}
              onChange={e => setCurrentRole(e.target.value as any)}
              className="bg-transparent font-bold text-xs text-slate-700 focus:outline-none cursor-pointer pr-4"
            >
              <option value="admin">Administrador (Total)</option>
              <option value="commercial">Comercial (Vendas)</option>
              <option value="consultant">Consultor (Técnico)</option>
              <option value="finance">Financeiro (Contratos)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Navigation Tab Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none border-b border-slate-100">
        {[
          { id: 'dashboard', label: 'Indicadores', icon: <BarChart3 className="w-4 h-4" /> },
          { id: 'pipeline', label: 'Funil Kanban', icon: <Kanban className="w-4 h-4" /> },
          { id: 'companies', label: 'Clientes & Contatos', icon: <Building2 className="w-4 h-4" /> },
          { id: 'proposals', label: 'Propostas & Contratos', icon: <FileText className="w-4 h-4" /> },
          { id: 'timeline', label: 'Linha do Tempo', icon: <Calendar className="w-4 h-4" /> },
          { id: 'ai', label: 'Copiloto IA', icon: <Brain className="w-4 h-4" /> }
        ].map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded-t-xl font-bold text-xs flex items-center gap-2 transition-all flex-shrink-0 border-b-2 -mb-[1px] ${
                isActive 
                  ? 'border-brand-teal text-brand-teal bg-brand-teal/5' 
                  : 'border-transparent text-slate-400 hover:text-slate-600'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Warnings & Notices */}
      {renderPermissionNotice()}

      {/* Main Panel Content Render */}
      <div className="transition-all duration-300">
        {activeTab === 'dashboard' && <CrmDashboard />}
        {activeTab === 'pipeline' && <CrmPipeline />}
        {activeTab === 'companies' && <CrmCompanies />}
        {activeTab === 'proposals' && <CrmProposals />}
        {activeTab === 'timeline' && <CrmTimeline />}
        {activeTab === 'ai' && <CrmAIHelper />}
      </div>

    </div>
  )
}

export default function CrmPage() {
  return (
    <CrmProvider>
      <CrmMainContent />
    </CrmProvider>
  )
}
