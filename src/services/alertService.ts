import type { TabelaPrice, ObrigacaoFiscal, AliquotaTributaria, Anotacao } from '@/types/alerts'

const TABELA_TABLE = 'alerts_tabela_price'
const OBRIGACOES_TABLE = 'alerts_obrigacoes_fiscais'
const ALIQUOTAS_TABLE = 'alerts_aliquotas'
const ANOTACOES_TABLE = 'alerts_anotacoes'

// This module is optional — skip if tables don't exist
export const alertService = {
  async listTabelaPrice(): Promise<TabelaPrice[]> {
    const { getClient, handleError } = await import('./base')
    const supabase = getClient()
    const { data, error } = await supabase.from(TABELA_TABLE).select('*').order('name')
    if (error) handleError(error, 'alertService.listTabelaPrice')
    return data || []
  },
  async listObrigacoes(): Promise<ObrigacaoFiscal[]> {
    const { getClient, handleError } = await import('./base')
    const supabase = getClient()
    const { data, error } = await supabase.from(OBRIGACOES_TABLE).select('*').order('due_date')
    if (error) handleError(error, 'alertService.listObrigacoes')
    return (data || []).map(mo)
  },
  async listAliquotas(): Promise<AliquotaTributaria[]> {
    const { getClient, handleError } = await import('./base')
    const supabase = getClient()
    const { data, error } = await supabase.from(ALIQUOTAS_TABLE).select('*').order('name')
    if (error) handleError(error, 'alertService.listAliquotas')
    return data || []
  },
  async listAnotacoes(): Promise<Anotacao[]> {
    const { getClient, handleError } = await import('./base')
    const supabase = getClient()
    const { data, error } = await supabase.from(ANOTACOES_TABLE).select('*').order('created_at', { ascending: false })
    if (error) handleError(error, 'alertService.listAnotacoes')
    return (data || []).map(mn)
  },
}

function mo(r: any): ObrigacaoFiscal { return { ...r, dueDate: r.due_date, paymentDate: r.payment_date, companyId: r.company_id } }
function mn(r: any): Anotacao { return { ...r, createdAt: r.created_at } }
