'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { assessoriaService } from '@/services/assessoriaService'

export interface Diagnostico {
  id: string
  titulo: string
  empresa: string
  responsavel: string
  areasAvaliadas: string[]
  pontuacaoGeral: number
  status: 'rascunho' | 'concluido'
  dataCriacao: string
  observacoes: string
}

export interface Okr {
  id: string
  objetivo: string
  empresa: string
  ciclo: string
  keyResults: { descricao: string; meta: number; atual: number; unidade: string }[]
  status: 'ativo' | 'concluido' | 'cancelado'
  dataCriacao: string
}

export interface Swot {
  id: string
  empresa: string
  forcas: string[]
  fraquezas: string[]
  oportunidades: string[]
  ameacas: string[]
  dataCriacao: string
}

export interface PlanoAcao {
  id: string
  titulo: string
  empresa: string
  responsavel: string
  itens: { acao: string; prazo: string; responsavel: string; status: 'pendente' | 'andamento' | 'concluido' }[]
  status: 'ativo' | 'concluido'
  dataCriacao: string
}

export interface Kpi {
  id: string
  nome: string
  empresa: string
  meta: number
  atual: number
  unidade: string
  periodo: string
  tendencia: 'subindo' | 'descendo' | 'estavel'
}

interface AssessoriaContextType {
  diagnosticos: Diagnostico[]
  okrs: Okr[]
  swots: Swot[]
  planosAcao: PlanoAcao[]
  kpis: Kpi[]
  addDiagnostico: (d: Omit<Diagnostico, 'id' | 'dataCriacao'>) => void
  updateDiagnostico: (id: string, updates: Partial<Diagnostico>) => void
  deleteDiagnostico: (id: string) => void
  addOkr: (o: Omit<Okr, 'id' | 'dataCriacao'>) => void
  updateOkr: (id: string, updates: Partial<Okr>) => void
  deleteOkr: (id: string) => void
  updateKr: (okrId: string, krIndex: number, atual: number) => void
  addSwot: (s: Omit<Swot, 'id' | 'dataCriacao'>) => void
  updateSwot: (id: string, updates: Partial<Swot>) => void
  deleteSwot: (id: string) => void
  addPlanoAcao: (p: Omit<PlanoAcao, 'id' | 'dataCriacao'>) => void
  updatePlanoAcao: (id: string, updates: Partial<PlanoAcao>) => void
  deletePlanoAcao: (id: string) => void
  addKpi: (k: Omit<Kpi, 'id'>) => void
  updateKpi: (id: string, updates: Partial<Kpi>) => void
  deleteKpi: (id: string) => void
}

const AssessoriaContext = createContext<AssessoriaContextType | undefined>(undefined)

function gid(): string { return 'ass-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6) }

export function AssessoriaProvider({ children }: { children: React.ReactNode }) {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])
  const [okrs, setOkrs] = useState<Okr[]>([])
  const [swots, setSwots] = useState<Swot[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])

  const queryClient = useQueryClient()

  useEffect(() => {
    if (typeof window === 'undefined') return

    Promise.all([
      assessoriaService.listDiagnosticos(),
      assessoriaService.listOkrs(),
      assessoriaService.listSwots(),
      assessoriaService.listPlanos(),
      assessoriaService.listKpis(),
    ]).then(([diag, okrList, swotList, planos, kpiList]) => {
      if (diag.length > 0) setDiagnosticos(diag)
      if (okrList.length > 0) setOkrs(okrList)
      if (swotList.length > 0) setSwots(swotList)
      if (planos.length > 0) setPlanosAcao(planos)
      if (kpiList.length > 0) setKpis(kpiList)
    }).catch((err) => console.error('[AssessoriaContext] load error:', err))
  }, [])

  // Persistência é feita individualmente nas operações CRUD

  const addDiagnostico = useCallback((d: Omit<Diagnostico, 'id' | 'dataCriacao'>) => { setDiagnosticos(prev => [...prev, { ...d, id: gid(), dataCriacao: new Date().toISOString() }]) }, [])
  const updateDiagnostico = useCallback((id: string, updates: Partial<Diagnostico>) => { setDiagnosticos(prev => prev.map(d => d.id === id ? { ...d, ...updates } : d)) }, [])
  const deleteDiagnostico = useCallback((id: string) => { setDiagnosticos(prev => prev.filter(d => d.id !== id)) }, [])

  const addOkr = useCallback((o: Omit<Okr, 'id' | 'dataCriacao'>) => { setOkrs(prev => [...prev, { ...o, id: gid(), dataCriacao: new Date().toISOString() }]) }, [])
  const updateOkr = useCallback((id: string, updates: Partial<Okr>) => { setOkrs(prev => prev.map(o => o.id === id ? { ...o, ...updates } : o)) }, [])
  const deleteOkr = useCallback((id: string) => { setOkrs(prev => prev.filter(o => o.id !== id)) }, [])
  const updateKr = useCallback((okrId: string, krIndex: number, atual: number) => { setOkrs(prev => prev.map(o => o.id === okrId ? { ...o, keyResults: o.keyResults.map((kr, i) => i === krIndex ? { ...kr, atual } : kr) } : o)) }, [])

  const addSwot = useCallback((s: Omit<Swot, 'id' | 'dataCriacao'>) => { setSwots(prev => [...prev, { ...s, id: gid(), dataCriacao: new Date().toISOString() }]) }, [])
  const updateSwot = useCallback((id: string, updates: Partial<Swot>) => { setSwots(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s)) }, [])
  const deleteSwot = useCallback((id: string) => { setSwots(prev => prev.filter(s => s.id !== id)) }, [])

  const addPlanoAcao = useCallback((p: Omit<PlanoAcao, 'id' | 'dataCriacao'>) => { setPlanosAcao(prev => [...prev, { ...p, id: gid(), dataCriacao: new Date().toISOString() }]) }, [])
  const updatePlanoAcao = useCallback((id: string, updates: Partial<PlanoAcao>) => { setPlanosAcao(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p)) }, [])
  const deletePlanoAcao = useCallback((id: string) => { setPlanosAcao(prev => prev.filter(p => p.id !== id)) }, [])

  const addKpi = useCallback((k: Omit<Kpi, 'id'>) => { setKpis(prev => [...prev, { ...k, id: gid() }]) }, [])
  const updateKpi = useCallback((id: string, updates: Partial<Kpi>) => { setKpis(prev => prev.map(k => k.id === id ? { ...k, ...updates } : k)) }, [])
  const deleteKpi = useCallback((id: string) => { setKpis(prev => prev.filter(k => k.id !== id)) }, [])

  return (
    <AssessoriaContext.Provider value={{
      diagnosticos, okrs, swots, planosAcao, kpis,
      addDiagnostico, updateDiagnostico, deleteDiagnostico,
      addOkr, updateOkr, deleteOkr, updateKr,
      addSwot, updateSwot, deleteSwot,
      addPlanoAcao, updatePlanoAcao, deletePlanoAcao,
      addKpi, updateKpi, deleteKpi,
    }}>
      {children}
    </AssessoriaContext.Provider>
  )
}

export function useAssessoria() {
  const ctx = useContext(AssessoriaContext)
  if (!ctx) throw new Error('useAssessoria must be used within AssessoriaProvider')
  return ctx
}
