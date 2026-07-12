'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

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

const SEED_DIAGNOSTICOS: Diagnostico[] = []

const SEED_OKRS: Okr[] = []

const SEED_SWOTS: Swot[] = []

const SEED_PLANOS_ACAO: PlanoAcao[] = []

const SEED_KPIS: Kpi[] = []

function getCrmCompanyNames(): string[] {
  try {
    const raw = localStorage.getItem('crm_companies')
    if (!raw) return []
    const companies: { name?: string; tradeName?: string }[] = JSON.parse(raw)
    const names = new Set<string>()
    companies.forEach(c => { if (c.name) names.add(c.name.toLowerCase().trim()); if (c.tradeName) names.add(c.tradeName.toLowerCase().trim()) })
    return [...names]
  } catch { return [] }
}

function filterOrphans<T extends { empresa: string }>(items: T[], companies: string[]): T[] {
  if (!companies.length) return items
  return items.filter(item => companies.includes(item.empresa.toLowerCase().trim()))
}

export function AssessoriaProvider({ children }: { children: React.ReactNode }) {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])
  const [okrs, setOkrs] = useState<Okr[]>([])
  const [swots, setSwots] = useState<Swot[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])

  const loadedRef = useRef(false)

  useEffect(() => {
    if (typeof window === 'undefined' || loadedRef.current) return
    loadedRef.current = true

    const get = <T,>(key: string, fallback: T): T => {
      try { const stored = localStorage.getItem(key); return stored ? JSON.parse(stored) : fallback }
      catch { return fallback }
    }

    const loadFromLocal = () => {
      const companies = getCrmCompanyNames()
      const applyFilter = <T extends { empresa: string }>(items: T[]) => filterOrphans(items, companies)
      setDiagnosticos(applyFilter(get('ass_diagnosticos', SEED_DIAGNOSTICOS)))
      setOkrs(applyFilter(get('ass_okrs', SEED_OKRS)))
      setSwots(applyFilter(get('ass_swots', SEED_SWOTS)))
      setPlanosAcao(applyFilter(get('ass_planos_acao', SEED_PLANOS_ACAO)))
      setKpis(applyFilter(get('ass_kpis', SEED_KPIS)))
    }

    fetch('/api/sync/assessoria')
      .then(r => r.ok ? r.json() : null)
      .then(res => {
        if (res?.data) {
          const d = res.data
          const companies = getCrmCompanyNames()
          const applyFilter = <T extends { empresa: string }>(items: T[]) => filterOrphans(items, companies)
          if (Array.isArray(d.diagnosticos) && d.diagnosticos.length > 0) setDiagnosticos(applyFilter(d.diagnosticos as Diagnostico[]))
          if (Array.isArray(d.okrs) && d.okrs.length > 0) setOkrs(applyFilter(d.okrs as Okr[]))
          if (Array.isArray(d.swots) && d.swots.length > 0) setSwots(applyFilter(d.swots as Swot[]))
          if (Array.isArray(d.planosAcao) && d.planosAcao.length > 0) setPlanosAcao(applyFilter(d.planosAcao as PlanoAcao[]))
          if (Array.isArray(d.kpis) && d.kpis.length > 0) setKpis(applyFilter(d.kpis as Kpi[]))
          for (const [k, v] of Object.entries(d)) {
            if (Array.isArray(v) && v.length > 0) localStorage.setItem(`ass_${k}`, JSON.stringify(v))
          }
        } else {
          loadFromLocal()
        }
      })
      .catch(() => loadFromLocal())

    window.addEventListener('crm:sync-companies', loadFromLocal)
    return () => window.removeEventListener('crm:sync-companies', loadFromLocal)
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const hasData = diagnosticos.length > 0 || okrs.length > 0 || swots.length > 0 || planosAcao.length > 0 || kpis.length > 0
    if (!hasData) return
    const timer = setTimeout(() => {
      const payload = { diagnosticos, okrs, swots, planosAcao, kpis }
      fetch('/api/sync/assessoria', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merged: payload }),
      }).catch(err => console.error('AssessoriaContext sync error:', err))
      localStorage.setItem('ass_diagnosticos', JSON.stringify(diagnosticos))
      localStorage.setItem('ass_okrs', JSON.stringify(okrs))
      localStorage.setItem('ass_swots', JSON.stringify(swots))
      localStorage.setItem('ass_planos_acao', JSON.stringify(planosAcao))
      localStorage.setItem('ass_kpis', JSON.stringify(kpis))
    }, 500)
    return () => clearTimeout(timer)
  }, [diagnosticos, okrs, swots, planosAcao, kpis])

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
