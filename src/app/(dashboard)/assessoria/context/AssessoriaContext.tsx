'use client'

import React, { createContext, useContext, useCallback, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { assessoriaService } from '@/services/assessoriaService'
import type { Diagnostico, Okr, Swot, PlanoAcao, PlanoAcaoItem, Kpi, KpiMeta, Relatorio, Checkin, Ferramenta } from '@/types/assessoria'

export type { Diagnostico, Okr, Swot, PlanoAcao, PlanoAcaoItem, Kpi, KpiMeta, Relatorio, Checkin, Ferramenta }

interface AssessoriaContextType {
  diagnosticos: Diagnostico[]
  okrs: Okr[]
  swots: Swot[]
  planosAcao: PlanoAcao[]
  kpis: Kpi[]
  loading: boolean
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
  updatePlanoItem: (planoId: string, itemId: string, updates: Partial<PlanoAcaoItem>) => void
  deletePlanoAcao: (id: string) => void
  addKpi: (k: Omit<Kpi, 'id'>) => void
  updateKpi: (id: string, updates: Partial<Kpi>) => void
  deleteKpi: (id: string) => void
}

const AssessoriaContext = createContext<AssessoriaContextType | undefined>(undefined)

const D_KEY = ['assessoria', 'diagnosticos']
const O_KEY = ['assessoria', 'okrs']
const S_KEY = ['assessoria', 'swots']
const P_KEY = ['assessoria', 'planos']
const K_KEY = ['assessoria', 'kpis']

function normDiag(d: Diagnostico): Diagnostico {
  return {
    ...d,
    titulo: d.titulo || '',
    empresa: d.empresa || '',
    responsavel: d.responsavel || '',
    areasAvaliadas: Array.isArray(d.areasAvaliadas) ? d.areasAvaliadas : [],
    pontuacaoGeral: d.pontuacaoGeral ?? 0,
    status: d.status || 'rascunho',
    dataCriacao: d.dataCriacao || (d as any).createdAt || (d as any).created_at || '',
    observacoes: d.observacoes || '',
  }
}
function normOkr(o: Okr): Okr {
  return {
    ...o,
    objetivo: o.objetivo || '',
    empresa: o.empresa || '',
    ciclo: o.ciclo || '',
    keyResults: Array.isArray(o.keyResults) ? o.keyResults : [],
    status: o.status || 'ativo',
    dataCriacao: o.dataCriacao || (o as any).createdAt || (o as any).created_at || '',
  }
}
function normSwot(s: Swot): Swot {
  return {
    ...s,
    empresa: s.empresa || '',
    forcas: Array.isArray(s.forcas) ? s.forcas : [],
    fraquezas: Array.isArray(s.fraquezas) ? s.fraquezas : [],
    oportunidades: Array.isArray(s.oportunidades) ? s.oportunidades : [],
    ameacas: Array.isArray(s.ameacas) ? s.ameacas : [],
    dataCriacao: s.dataCriacao || (s as any).createdAt || (s as any).created_at || '',
  }
}
function normPlano(p: any): PlanoAcao {
  const itens: PlanoAcaoItem[] = Array.isArray(p.itens)
    ? p.itens.map((it: any) => ({
        id: it.id || crypto.randomUUID(),
        acao: it.acao || '',
        descricao: it.descricao || '',
        prazo: it.prazo || '',
        responsavel: it.responsavel || '',
        prioridade: it.prioridade || 'media',
        categoria: it.categoria || 'demanda',
        status: it.status || 'pendente',
        linkedTaskId: it.linkedTaskId,
      }))
    : []
  return {
    id: p.id,
    titulo: p.titulo || p.acao || '',
    empresa: p.empresa || '',
    responsavel: p.responsavel || '',
    categoria: p.categoria || 'demanda',
    prioridade: p.prioridade || 'media',
    prazo: p.prazo || '',
    status: p.status === 'concluido' ? 'concluido' : 'ativo',
    itens,
    dataCriacao: p.dataCriacao || p.createdAt || p.created_at || '',
  }
}
function normKpi(k: Kpi): Kpi {
  return {
    ...k,
    nome: k.nome || (k as any).indicador || '',
    empresa: k.empresa || '',
    meta: k.meta ?? 0,
    atual: k.atual ?? 0,
    unidade: k.unidade || '',
    periodo: k.periodo || '',
    tendencia: k.tendencia || 'estavel',
  }
}

export function AssessoriaProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient()

  const diagQuery = useQuery({
    queryKey: D_KEY,
    queryFn: () => assessoriaService.listDiagnosticos().then(list => list.map(normDiag)),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
  const okrQuery = useQuery({
    queryKey: O_KEY,
    queryFn: () => assessoriaService.listOkrs().then(list => list.map(normOkr)),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
  const swotQuery = useQuery({
    queryKey: S_KEY,
    queryFn: () => assessoriaService.listSwots().then(list => list.map(normSwot)),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
  const planoQuery = useQuery({
    queryKey: P_KEY,
    queryFn: () => assessoriaService.listPlanos().then(list => list.map(normPlano)),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })
  const kpiQuery = useQuery({
    queryKey: K_KEY,
    queryFn: () => assessoriaService.listKpis().then(list => list.map(normKpi)),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  })

  const invalidate = (keys: string[][]) => qc.invalidateQueries({ queryKey: keys.length === 1 ? keys[0] : keys })
  const invalidateAll = () => { invalidate([D_KEY, O_KEY, S_KEY, P_KEY, K_KEY]) }

  // ---- Diagnósticos ----
  const createDiag = useMutation({ mutationFn: (i: any) => assessoriaService.createDiagnostico(i), onSuccess: () => invalidate([D_KEY]) })
  const updateDiag = useMutation({ mutationFn: ({ id, ...i }: any) => assessoriaService.updateDiagnostico(id, i), onSuccess: () => invalidate([D_KEY]) })
  const deleteDiag = useMutation({ mutationFn: (id: string) => assessoriaService.removeDiagnostico(id), onSuccess: () => invalidate([D_KEY]) })

  const addDiagnostico = useCallback((d: Omit<Diagnostico, 'id' | 'dataCriacao'>) => {
    createDiag.mutate({ ...d, id: crypto.randomUUID(), dataCriacao: new Date().toISOString() })
  }, [createDiag])
  const updateDiagnostico = useCallback((id: string, updates: Partial<Diagnostico>) => {
    updateDiag.mutate({ id, ...updates })
  }, [updateDiag])
  const deleteDiagnostico = useCallback((id: string) => {
    deleteDiag.mutate(id)
  }, [deleteDiag])

  // ---- OKRs ----
  const createOkr = useMutation({ mutationFn: (i: any) => assessoriaService.createOkr(i), onSuccess: () => invalidate([O_KEY]) })
  const updateOkrM = useMutation({ mutationFn: ({ id, ...i }: any) => assessoriaService.updateOkr(id, i), onSuccess: () => invalidate([O_KEY]) })
  const deleteOkrM = useMutation({ mutationFn: (id: string) => assessoriaService.removeOkr(id), onSuccess: () => invalidate([O_KEY]) })

  const addOkr = useCallback((o: Omit<Okr, 'id' | 'dataCriacao'>) => {
    createOkr.mutate({ ...o, id: crypto.randomUUID(), dataCriacao: new Date().toISOString() })
  }, [createOkr])
  const updateOkr = useCallback((id: string, updates: Partial<Okr>) => {
    updateOkrM.mutate({ id, ...updates })
  }, [updateOkrM])
  const deleteOkr = useCallback((id: string) => {
    deleteOkrM.mutate(id)
  }, [deleteOkrM])

  const updateKr = useCallback((okrId: string, krIndex: number, atual: number) => {
    const okr = okrQuery.data?.find(o => o.id === okrId)
    if (!okr) return
    const keyResults = okr.keyResults.map((kr, i) => (i === krIndex ? { ...kr, atual } : kr))
    qc.setQueryData(O_KEY, (old: any) => (old || []).map((o: any) => (o.id === okrId ? { ...o, keyResults } : o)))
    updateOkrM.mutate({ id: okrId, keyResults })
  }, [okrQuery.data, updateOkrM, qc])

  // ---- SWOT ----
  const createSwot = useMutation({ mutationFn: (i: any) => assessoriaService.createSwot(i), onSuccess: () => invalidate([S_KEY]) })
  const updateSwotM = useMutation({ mutationFn: ({ id, ...i }: any) => assessoriaService.updateSwot(id, i), onSuccess: () => invalidate([S_KEY]) })
  const deleteSwotM = useMutation({ mutationFn: (id: string) => assessoriaService.removeSwot(id), onSuccess: () => invalidate([S_KEY]) })

  const addSwot = useCallback((s: Omit<Swot, 'id' | 'dataCriacao'>) => {
    createSwot.mutate({ ...s, id: crypto.randomUUID(), dataCriacao: new Date().toISOString() })
  }, [createSwot])
  const updateSwot = useCallback((id: string, updates: Partial<Swot>) => {
    updateSwotM.mutate({ id, ...updates })
  }, [updateSwotM])
  const deleteSwot = useCallback((id: string) => {
    deleteSwotM.mutate(id)
  }, [deleteSwotM])

  // ---- Plano de Ação ----
  const createPlano = useMutation({ mutationFn: (i: any) => assessoriaService.createPlano(i), onSuccess: () => invalidate([P_KEY]) })
  const updatePlanoM = useMutation({ mutationFn: ({ id, ...i }: any) => assessoriaService.updatePlano(id, i), onSuccess: () => invalidate([P_KEY]) })
  const deletePlanoM = useMutation({ mutationFn: (id: string) => assessoriaService.removePlano(id), onSuccess: () => invalidate([P_KEY]) })

  const addPlanoAcao = useCallback((p: Omit<PlanoAcao, 'id' | 'dataCriacao'>) => {
    const plano: PlanoAcao = {
      ...p,
      id: crypto.randomUUID(),
      dataCriacao: new Date().toISOString(),
      itens: (p.itens || []).map(item => ({ ...item, id: item.id || crypto.randomUUID() })),
    }
    createPlano.mutate(plano)
  }, [createPlano])
  const updatePlanoAcao = useCallback((id: string, updates: Partial<PlanoAcao>) => {
    updatePlanoM.mutate({ id, ...updates })
  }, [updatePlanoM])
  const deletePlanoAcao = useCallback((id: string) => {
    deletePlanoM.mutate(id)
  }, [deletePlanoM])

  // Debounce persistência de itens (evita request a cada tecla)
  const itemTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})
  const updatePlanoItem = useCallback((planoId: string, itemId: string, updates: Partial<PlanoAcaoItem>) => {
    qc.setQueryData(P_KEY, (old: any) => (old || []).map((p: any) =>
      p.id === planoId
        ? { ...p, itens: p.itens.map((it: any) => (it.id === itemId ? { ...it, ...updates } : it)) }
        : p
    ))
    if (itemTimers.current[planoId]) clearTimeout(itemTimers.current[planoId])
    itemTimers.current[planoId] = setTimeout(() => {
      const plano = (qc.getQueryData(P_KEY) as any[] | undefined)?.find((p: any) => p.id === planoId)
      if (plano) updatePlanoM.mutate({ id: planoId, itens: plano.itens, titulo: plano.titulo, empresa: plano.empresa })
      delete itemTimers.current[planoId]
    }, 600)
  }, [qc, updatePlanoM])

  // ---- KPIs ----
  const createKpi = useMutation({ mutationFn: (i: any) => assessoriaService.createKpi(i), onSuccess: () => invalidate([K_KEY]) })
  const updateKpiM = useMutation({ mutationFn: ({ id, ...i }: any) => assessoriaService.updateKpi(id, i), onSuccess: () => invalidate([K_KEY]) })
  const deleteKpiM = useMutation({ mutationFn: (id: string) => assessoriaService.removeKpi(id), onSuccess: () => invalidate([K_KEY]) })

  const addKpi = useCallback((k: Omit<Kpi, 'id'>) => {
    createKpi.mutate({ ...k, id: crypto.randomUUID() })
  }, [createKpi])
  const updateKpi = useCallback((id: string, updates: Partial<Kpi>) => {
    updateKpiM.mutate({ id, ...updates })
  }, [updateKpiM])
  const deleteKpi = useCallback((id: string) => {
    deleteKpiM.mutate(id)
  }, [deleteKpiM])

  return (
    <AssessoriaContext.Provider value={{
      diagnosticos: diagQuery.data ?? [],
      okrs: okrQuery.data ?? [],
      swots: swotQuery.data ?? [],
      planosAcao: planoQuery.data ?? [],
      kpis: kpiQuery.data ?? [],
      loading: diagQuery.isLoading || okrQuery.isLoading || swotQuery.isLoading || planoQuery.isLoading || kpiQuery.isLoading,
      addDiagnostico, updateDiagnostico, deleteDiagnostico,
      addOkr, updateOkr, deleteOkr, updateKr,
      addSwot, updateSwot, deleteSwot,
      addPlanoAcao, updatePlanoAcao, updatePlanoItem, deletePlanoAcao,
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