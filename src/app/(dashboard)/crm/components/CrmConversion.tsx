'use client'

import React from 'react'
import { useCrm } from '../context/CrmContext'
import { TrendingUp, Calendar } from 'lucide-react'

export const CrmConversion: React.FC = () => {
  const { deals, companies } = useCrm()

  // Projeção: empresas com 'dueDate' no futuro
  const futureOpportunities = deals
    .filter(d => d.stage !== 'Cliente perdido' && d.dueDate && new Date(d.dueDate) > new Date())
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
    .map(d => ({
      ...d,
      companyName: companies.find(c => c.id === d.companyId)?.tradeName || 'Empresa'
    }))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
        <h3 className="text-lg font-black text-slate-800 flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-brand-teal" />
          Projeção de Conversão Futura
        </h3>
        <p className="text-slate-400 text-xs">Análise de negócios com data de fechamento prevista para o futuro.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {futureOpportunities.map(deal => (
            <div key={deal.id} className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{deal.companyName}</span>
                    <span className="text-[10px] font-bold text-brand-teal bg-brand-teal/10 px-2 py-0.5 rounded-full">{deal.stage}</span>
                </div>
                <h4 className="font-bold text-sm text-slate-800 mb-1">{deal.title}</h4>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-3">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Fechamento: {new Date(deal.dueDate).toLocaleDateString('pt-BR')}</span>
                </div>
                <div className="mt-3 text-sm font-black text-brand-blue">
                    R$ {deal.value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </div>
            </div>
        ))}
        {futureOpportunities.length === 0 && (
            <div className="col-span-full p-12 text-center text-slate-400 text-sm">Nenhuma oportunidade futura encontrada.</div>
        )}
      </div>
    </div>
  )
}
