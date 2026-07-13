import { getClient, handleError } from './base'
import type { Diagnostico, Okr, Swot, PlanoAcao, Kpi, KpiMeta, Relatorio, Checkin, Ferramenta } from '@/types/assessoria'

const DIAGNOSTICOS_TABLE = 'ass_diagnosticos'
const OKRS_TABLE = 'ass_okrs'
const SWOT_TABLE = 'ass_swot'
const PLANOS_TABLE = 'ass_planos_acao'
const KPIS_TABLE = 'ass_kpis'
const METAS_TABLE = 'ass_kpi_metas'
const RELATORIOS_TABLE = 'ass_relatorios'
const CHECKINS_TABLE = 'ass_checkins'
const FERRAMENTAS_TABLE = 'ass_ferramentas'

export const assessoriaService = {
  async saveAll(data: {
    diagnosticos?: Diagnostico[]
    okrs?: Okr[]
    swots?: Swot[]
    planosAcao?: PlanoAcao[]
    kpis?: Kpi[]
  }): Promise<void> {
    const supabase = getClient()
    const jobs: Promise<any>[] = []
    if (data.diagnosticos?.length) jobs.push(Promise.resolve(supabase.from(DIAGNOSTICOS_TABLE).upsert(data.diagnosticos.map(mdRow))))
    if (data.okrs?.length) jobs.push(Promise.resolve(supabase.from(OKRS_TABLE).upsert(data.okrs.map(moRow))))
    if (data.swots?.length) jobs.push(Promise.resolve(supabase.from(SWOT_TABLE).upsert(data.swots.map(msRow))))
    if (data.planosAcao?.length) jobs.push(Promise.resolve(supabase.from(PLANOS_TABLE).upsert(data.planosAcao.map(mpaRow))))
    if (data.kpis?.length) jobs.push(Promise.resolve(supabase.from(KPIS_TABLE).upsert(data.kpis.map(mkRow))))
    await Promise.allSettled(jobs)
  },

  async listDiagnosticos(empresa?: string): Promise<Diagnostico[]> {
    const supabase = getClient()
    let q = supabase.from(DIAGNOSTICOS_TABLE).select('*').order('created_at', { ascending: false })
    if (empresa) q = q.eq('empresa', empresa)
    const { data, error } = await q
    if (error) handleError(error, 'assessoriaService.listDiagnosticos')
    return (data || []).map(md)
  },
  async createDiagnostico(input: Partial<Diagnostico>): Promise<Diagnostico> {
    const supabase = getClient()
    const { data, error } = await supabase.from(DIAGNOSTICOS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'assessoriaService.createDiagnostico')
    return md(data!)
  },
  async updateDiagnostico(id: string, input: Partial<Diagnostico>): Promise<Diagnostico> {
    const supabase = getClient()
    const { data, error } = await supabase.from(DIAGNOSTICOS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'assessoriaService.updateDiagnostico')
    return md(data!)
  },
  async removeDiagnostico(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(DIAGNOSTICOS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'assessoriaService.removeDiagnostico')
  },
  async listOkrs(empresa?: string): Promise<Okr[]> {
    const supabase = getClient()
    let q = supabase.from(OKRS_TABLE).select('*').order('created_at', { ascending: false })
    if (empresa) q = q.eq('empresa', empresa)
    const { data, error } = await q
    if (error) handleError(error, 'assessoriaService.listOkrs')
    return (data || []).map(mo)
  },
  async createOkr(input: Partial<Okr>): Promise<Okr> {
    const supabase = getClient()
    const { data, error } = await supabase.from(OKRS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'assessoriaService.createOkr')
    return mo(data!)
  },
  async updateOkr(id: string, input: Partial<Okr>): Promise<Okr> {
    const supabase = getClient()
    const { data, error } = await supabase.from(OKRS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'assessoriaService.updateOkr')
    return mo(data!)
  },
  async removeOkr(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(OKRS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'assessoriaService.removeOkr')
  },
  async listSwots(empresa?: string): Promise<Swot[]> {
    const supabase = getClient()
    let q = supabase.from(SWOT_TABLE).select('*').order('created_at', { ascending: false })
    if (empresa) q = q.eq('empresa', empresa)
    const { data, error } = await q
    if (error) handleError(error, 'assessoriaService.listSwots')
    return (data || []).map(ms)
  },
  async createSwot(input: Partial<Swot>): Promise<Swot> {
    const supabase = getClient()
    const { data, error } = await supabase.from(SWOT_TABLE).insert(input).select().single()
    if (error) handleError(error, 'assessoriaService.createSwot')
    return ms(data!)
  },
  async updateSwot(id: string, input: Partial<Swot>): Promise<Swot> {
    const supabase = getClient()
    const { data, error } = await supabase.from(SWOT_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'assessoriaService.updateSwot')
    return ms(data!)
  },
  async removeSwot(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(SWOT_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'assessoriaService.removeSwot')
  },
  async listPlanos(empresa?: string): Promise<PlanoAcao[]> {
    const supabase = getClient()
    let q = supabase.from(PLANOS_TABLE).select('*').order('created_at', { ascending: false })
    if (empresa) q = q.eq('empresa', empresa)
    const { data, error } = await q
    if (error) handleError(error, 'assessoriaService.listPlanos')
    return (data || []).map(mpa)
  },
  async createPlano(input: Partial<PlanoAcao>): Promise<PlanoAcao> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PLANOS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'assessoriaService.createPlano')
    return mpa(data!)
  },
  async updatePlano(id: string, input: Partial<PlanoAcao>): Promise<PlanoAcao> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PLANOS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'assessoriaService.updatePlano')
    return mpa(data!)
  },
  async removePlano(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PLANOS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'assessoriaService.removePlano')
  },
  async listKpis(empresa?: string): Promise<Kpi[]> {
    const supabase = getClient()
    let q = supabase.from(KPIS_TABLE).select('*').order('name')
    if (empresa) q = q.eq('empresa', empresa)
    const { data, error } = await q
    if (error) handleError(error, 'assessoriaService.listKpis')
    return (data || []).map(mk)
  },
  async createKpi(input: Partial<Kpi>): Promise<Kpi> {
    const supabase = getClient()
    const { data, error } = await supabase.from(KPIS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'assessoriaService.createKpi')
    return mk(data!)
  },
  async updateKpi(id: string, input: Partial<Kpi>): Promise<Kpi> {
    const supabase = getClient()
    const { data, error } = await supabase.from(KPIS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'assessoriaService.updateKpi')
    return mk(data!)
  },
  async removeKpi(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(KPIS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'assessoriaService.removeKpi')
  },
  async listMetas(kpiId?: string): Promise<KpiMeta[]> {
    const supabase = getClient()
    let q = supabase.from(METAS_TABLE).select('*')
    if (kpiId) q = q.eq('kpi_id', kpiId)
    const { data, error } = await q
    if (error) handleError(error, 'assessoriaService.listMetas')
    return data || []
  },
  async createMeta(input: Partial<KpiMeta>): Promise<KpiMeta> {
    const supabase = getClient()
    const { data, error } = await supabase.from(METAS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'assessoriaService.createMeta')
    return data!
  },
  async listRelatorios(empresa?: string): Promise<Relatorio[]> {
    const supabase = getClient()
    let q = supabase.from(RELATORIOS_TABLE).select('*').order('created_at', { ascending: false })
    if (empresa) q = q.eq('empresa', empresa)
    const { data, error } = await q
    if (error) handleError(error, 'assessoriaService.listRelatorios')
    return (data || []).map(mr)
  },
  async createRelatorio(input: Partial<Relatorio>): Promise<Relatorio> {
    const supabase = getClient()
    const { data, error } = await supabase.from(RELATORIOS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'assessoriaService.createRelatorio')
    return mr(data!)
  },
  async listCheckins(empresa?: string): Promise<Checkin[]> {
    const supabase = getClient()
    let q = supabase.from(CHECKINS_TABLE).select('*').order('date', { ascending: false })
    if (empresa) q = q.eq('empresa', empresa)
    const { data, error } = await q
    if (error) handleError(error, 'assessoriaService.listCheckins')
    return (data || []).map(mch)
  },
  async createCheckin(input: Partial<Checkin>): Promise<Checkin> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CHECKINS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'assessoriaService.createCheckin')
    return mch(data!)
  },
  async listFerramentas(): Promise<Ferramenta[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(FERRAMENTAS_TABLE).select('*').order('name')
    if (error) handleError(error, 'assessoriaService.listFerramentas')
    return data || []
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
