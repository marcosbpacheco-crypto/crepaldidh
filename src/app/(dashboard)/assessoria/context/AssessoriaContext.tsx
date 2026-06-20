'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

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

const SEED_DIAGNOSTICOS: Diagnostico[] = [
  { id: 'diag-1', titulo: 'Diagnóstico Cultural', empresa: 'BR Distribuidora', responsavel: 'Marcos Crepaldi', areasAvaliadas: ['Liderança', 'Comunicação', 'Clima Organizacional'], pontuacaoGeral: 72, status: 'concluido', dataCriacao: '2026-03-15T00:00:00Z', observacoes: 'Necessidade de fortalecer canais de comunicação interna.' },
  { id: 'diag-2', titulo: 'Mapeamento de Competências', empresa: 'Vale S.A.', responsavel: 'Ana Oliveira', areasAvaliadas: ['Técnicas', 'Comportamentais', 'Gerenciais'], pontuacaoGeral: 65, status: 'rascunho', dataCriacao: '2026-04-01T00:00:00Z', observacoes: 'Aguardando aplicação dos questionários.' },
]

const SEED_OKRS: Okr[] = [
  { id: 'okr-1', objetivo: 'Fortalecer cultura de inovação', empresa: 'BR Distribuidora', ciclo: '2026.Q1', keyResults: [{ descricao: 'Workshops realizados', meta: 12, atual: 8, unidade: 'un' }, { descricao: 'Colaboradores engajados', meta: 200, atual: 145, unidade: 'un' }], status: 'ativo', dataCriacao: '2026-01-10T00:00:00Z' },
  { id: 'okr-2', objetivo: 'Reduzir turnover em 20%', empresa: 'Banco Itaú', ciclo: '2026.Q2', keyResults: [{ descricao: 'Pesquisa de clima aplicada', meta: 1, atual: 1, unidade: 'un' }, { descricao: 'Planos de ação implementados', meta: 10, atual: 4, unidade: 'un' }], status: 'ativo', dataCriacao: '2026-04-01T00:00:00Z' },
]

const SEED_SWOTS: Swot[] = [
  { id: 'swot-1', empresa: 'BR Distribuidora', forcas: ['Marca consolidada', 'Equipe técnica qualificada'], fraquezas: ['Processos manuais', 'Baixa digitalização'], oportunidades: ['Expansão para novos mercados', 'Incentivos fiscais'], ameacas: ['Concorrência agressiva', 'Mudanças regulatórias'], dataCriacao: '2026-02-20T00:00:00Z' },
  { id: 'swot-2', empresa: 'Vale S.A.', forcas: ['Liderança de mercado', 'Capital robusto'], fraquezas: ['Estrutura hierárquica rígida'], oportunidades: ['Inovação em sustentabilidade', 'Parcerias estratégicas'], ameacas: ['Crise econômica', 'Pressão sindical'], dataCriacao: '2026-03-10T00:00:00Z' },
]

const SEED_PLANOS_ACAO: PlanoAcao[] = [
  { id: 'plan-1', titulo: 'Melhoria do Clima Organizacional', empresa: 'BR Distribuidora', responsavel: 'Juliana Costa', itens: [{ acao: 'Realizar pesquisa de clima', prazo: '2026-05-30', responsavel: 'RH', status: 'concluido' }, { acao: 'Criar canal de denúncias', prazo: '2026-06-15', responsavel: 'Compliance', status: 'andamento' }, { acao: 'Implementar programa de reconhecimento', prazo: '2026-07-30', responsavel: 'DHO', status: 'pendente' }], status: 'ativo', dataCriacao: '2026-04-05T00:00:00Z' },
  { id: 'plan-2', titulo: 'Digitalização de Processos', empresa: 'Vale S.A.', responsavel: 'Carlos Souza', itens: [{ acao: 'Mapear processos críticos', prazo: '2026-05-15', responsavel: 'TI', status: 'concluido' }, { acao: 'Selecionar ferramenta de gestão', prazo: '2026-06-30', responsavel: 'Gestão', status: 'andamento' }], status: 'ativo', dataCriacao: '2026-04-10T00:00:00Z' },
]

const SEED_KPIS: Kpi[] = [
  { id: 'kpi-1', nome: 'Satisfação dos Colaboradores', empresa: 'BR Distribuidora', meta: 85, atual: 72, unidade: '%', periodo: '2026.Q1', tendencia: 'subindo' },
  { id: 'kpi-2', nome: 'Taxa de Conclusão de Treinamentos', empresa: 'Vale S.A.', meta: 90, atual: 78, unidade: '%', periodo: '2026.Q1', tendencia: 'estavel' },
  { id: 'kpi-3', nome: 'Índice de Inovação', empresa: 'Banco Itaú', meta: 70, atual: 55, unidade: '%', periodo: '2026.Q2', tendencia: 'subindo' },
]

export function AssessoriaProvider({ children }: { children: React.ReactNode }) {
  const [diagnosticos, setDiagnosticos] = useState<Diagnostico[]>([])
  const [okrs, setOkrs] = useState<Okr[]>([])
  const [swots, setSwots] = useState<Swot[]>([])
  const [planosAcao, setPlanosAcao] = useState<PlanoAcao[]>([])
  const [kpis, setKpis] = useState<Kpi[]>([])

  useEffect(() => {
    try {
      const d = localStorage.getItem('ass_diagnosticos'); if (d) setDiagnosticos(JSON.parse(d)); else setDiagnosticos(SEED_DIAGNOSTICOS)
      const o = localStorage.getItem('ass_okrs'); if (o) setOkrs(JSON.parse(o)); else setOkrs(SEED_OKRS)
      const s = localStorage.getItem('ass_swots'); if (s) setSwots(JSON.parse(s)); else setSwots(SEED_SWOTS)
      const p = localStorage.getItem('ass_planos_acao'); if (p) setPlanosAcao(JSON.parse(p)); else setPlanosAcao(SEED_PLANOS_ACAO)
      const k = localStorage.getItem('ass_kpis'); if (k) setKpis(JSON.parse(k)); else setKpis(SEED_KPIS)
    } catch { setDiagnosticos(SEED_DIAGNOSTICOS); setOkrs(SEED_OKRS); setSwots(SEED_SWOTS); setPlanosAcao(SEED_PLANOS_ACAO); setKpis(SEED_KPIS) }
  }, [])

  useEffect(() => { try { localStorage.setItem('ass_diagnosticos', JSON.stringify(diagnosticos)) } catch {} }, [diagnosticos])
  useEffect(() => { try { localStorage.setItem('ass_okrs', JSON.stringify(okrs)) } catch {} }, [okrs])
  useEffect(() => { try { localStorage.setItem('ass_swots', JSON.stringify(swots)) } catch {} }, [swots])
  useEffect(() => { try { localStorage.setItem('ass_planos_acao', JSON.stringify(planosAcao)) } catch {} }, [planosAcao])
  useEffect(() => { try { localStorage.setItem('ass_kpis', JSON.stringify(kpis)) } catch {} }, [kpis])

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
