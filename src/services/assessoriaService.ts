import type { Diagnostico, Okr, Swot, PlanoAcao, Kpi, KpiMeta, Relatorio, Checkin, Ferramenta } from '@/types/assessoria'

const BASE = '/api/prisma/assessoria'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const assessoriaService = {
  async listDiagnosticos(empresa?: string): Promise<Diagnostico[]> {
    const data = await api(BASE)
    const all = (data.diagnosticos || []).map((d: any) => md(d))
    return empresa ? all.filter((d: any) => d.empresa === empresa) : all
  },
  async createDiagnostico(input: Partial<Diagnostico>): Promise<Diagnostico> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'diagnostico', ...input }),
    })
    return md(data.diagnostico)
  },
  async updateDiagnostico(id: string, input: Partial<Diagnostico>): Promise<Diagnostico> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'diagnostico', id, ...input }),
    })
    return md(data.diagnostico)
  },
  async removeDiagnostico(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'diagnostico', id }),
    })
  },
  async listOkrs(empresa?: string): Promise<Okr[]> {
    const data = await api(BASE)
    const all = (data.okrs || []).map((o: any) => mo(o))
    return empresa ? all.filter((o: any) => o.empresa === empresa) : all
  },
  async createOkr(input: Partial<Okr>): Promise<Okr> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'okr', ...input }),
    })
    return mo(data.okr)
  },
  async updateOkr(id: string, input: Partial<Okr>): Promise<Okr> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'okr', id, ...input }),
    })
    return mo(data.okr)
  },
  async removeOkr(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'okr', id }),
    })
  },
  async listSwots(empresa?: string): Promise<Swot[]> {
    const data = await api(BASE)
    const all = (data.swots || []).map((s: any) => ms(s))
    return empresa ? all.filter((s: any) => s.empresa === empresa) : all
  },
  async createSwot(input: Partial<Swot>): Promise<Swot> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'swot', ...input }),
    })
    return ms(data.swot)
  },
  async updateSwot(id: string, input: Partial<Swot>): Promise<Swot> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'swot', id, ...input }),
    })
    return ms(data.swot)
  },
  async removeSwot(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'swot', id }),
    })
  },
  async listPlanos(empresa?: string): Promise<PlanoAcao[]> {
    const data = await api(BASE)
    const all = (data.planosAcao || []).map((p: any) => mpa(p))
    return empresa ? all.filter((p: any) => p.empresa === empresa) : all
  },
  async createPlano(input: Partial<PlanoAcao>): Promise<PlanoAcao> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'planoAcao', ...input }),
    })
    return mpa(data.planoAcao)
  },
  async updatePlano(id: string, input: Partial<PlanoAcao>): Promise<PlanoAcao> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'planoAcao', id, ...input }),
    })
    return mpa(data.planoAcao)
  },
  async removePlano(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'planoAcao', id }),
    })
  },
  async listKpis(empresa?: string): Promise<Kpi[]> {
    const data = await api(BASE)
    const all = (data.kpis || []).map((k: any) => mk(k))
    return empresa ? all.filter((k: any) => k.empresa === empresa) : all
  },
  async createKpi(input: Partial<Kpi>): Promise<Kpi> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'kpi', ...input }),
    })
    return mk(data.kpi)
  },
  async updateKpi(id: string, input: Partial<Kpi>): Promise<Kpi> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'kpi', id, ...input }),
    })
    return mk(data.kpi)
  },
  async removeKpi(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'kpi', id }),
    })
  },
  async listMetas(_kpiId?: string): Promise<KpiMeta[]> {
    return []
  },
  async createMeta(_input: Partial<KpiMeta>): Promise<KpiMeta> {
    throw new Error('Not implemented via Prisma API')
  },
  async listRelatorios(_empresa?: string): Promise<Relatorio[]> {
    return []
  },
  async createRelatorio(_input: Partial<Relatorio>): Promise<Relatorio> {
    throw new Error('Not implemented via Prisma API')
  },
  async listCheckins(_empresa?: string): Promise<Checkin[]> {
    return []
  },
  async createCheckin(_input: Partial<Checkin>): Promise<Checkin> {
    throw new Error('Not implemented via Prisma API')
  },
  async listFerramentas(): Promise<Ferramenta[]> {
    return []
  },
}

function md(r: any): Diagnostico { return { ...r, areasAnalisadas: r.areas_analisadas, pontosFortes: r.pontos_fortes, pontosMelhoria: r.pontos_melhoria, createdAt: r.created_at } }
function mo(r: any): Okr { return { ...r, keyResults: r.key_results, ciclo: r.ciclo, createdAt: r.created_at } }
function ms(r: any): Swot { return { ...r, forcas: r.forcas, fraquezas: r.fraquezas, oportunidades: r.oportunidades, ameacas: r.ameacas, createdAt: r.created_at } }
function mpa(r: any): PlanoAcao { return { ...r, dataInicio: r.data_inicio, dataFim: r.data_fim, responsavel: r.responsavel, createdAt: r.created_at } }
function mk(r: any): Kpi { return { ...r, unidade: r.unidade, periodicidade: r.periodicidade, createdAt: r.created_at } }
function mr(r: any): Relatorio { return { ...r, tipo: r.tipo, dataInicio: r.data_inicio, dataFim: r.data_fim, conteudo: r.conteudo, createdAt: r.created_at } }
function mch(r: any): Checkin { return { ...r, status: r.status, proximoCheckin: r.proximo_checkin } }
function mdRow(r: any) {
  const { areasAnalisadas, pontosFortes, pontosMelhoria, createdAt, ...rest } = r
  return { ...rest, areas_analisadas: r.areasAnalisadas, pontos_fortes: r.pontosFortes, pontos_melhoria: r.pontosMelhoria, created_at: r.createdAt }
}
function moRow(r: any) {
  const { keyResults, ciclo, createdAt, ...rest } = r
  return { ...rest, key_results: r.keyResults, ciclo: r.ciclo, created_at: r.createdAt }
}
function msRow(r: any) {
  const { forcas, fraquezas, oportunidades, ameacas, createdAt, ...rest } = r
  return { ...rest, forcas: r.forcas, fraquezas: r.fraquezas, oportunidades: r.oportunidades, ameacas: r.ameacas, created_at: r.createdAt }
}
function mpaRow(r: any) {
  const { dataInicio, dataFim, responsavel, createdAt, ...rest } = r
  return { ...rest, data_inicio: r.dataInicio, data_fim: r.dataFim, responsavel: r.responsavel, created_at: r.createdAt }
}
function mkRow(r: any) {
  const { unidade, periodicidade, createdAt, ...rest } = r
  return { ...rest, unidade: r.unidade, periodicidade: r.periodicidade, created_at: r.createdAt }
}
