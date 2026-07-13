import { getClient, handleError } from './base'
import type { Client, ClientContact, ClientInteraction, ClientFeedbackRanking } from '@/types/clients'

const TABLE = 'client_list'
const CONTACTS_TABLE = 'client_contacts'
const INTERACTIONS_TABLE = 'client_interactions'
const FEEDBACKS_TABLE = 'client_feedbacks'

export const clientService = {
  async list(): Promise<Client[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
    if (error) handleError(error, 'clientService.list')
    return (data || []).map(mapRow)
  },

  async getById(id: string): Promise<Client | null> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()
    if (error) return null
    return data ? mapRow(data) : null
  },

  async create(input: Omit<Client, 'id' | 'createdAt'> & { id?: string }): Promise<Client> {
    const supabase = getClient()
    const row = mapToRow(input)
    const { data, error } = await supabase
      .from(TABLE)
      .insert(row)
      .select()
      .single()
    if (error) handleError(error, 'clientService.create')
    return mapRow(data!)
  },

  async update(id: string, input: Partial<Client>): Promise<Client> {
    const supabase = getClient()
    const row = mapToRow(input)
    const { data, error } = await supabase
      .from(TABLE)
      .update(row)
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error, 'clientService.update')
    return mapRow(data!)
  },

  async remove(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase
      .from(TABLE)
      .update({ deleted_at: new Date().toISOString(), status: 'churned' })
      .eq('id', id)
    if (error) handleError(error, 'clientService.remove')
  },

  async restore(id: string): Promise<Client> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(TABLE)
      .update({ deleted_at: null, status: 'active' })
      .eq('id', id)
      .select()
      .single()
    if (error) handleError(error, 'clientService.restore')
    return mapRow(data!)
  },

  async hardDelete(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq('id', id)
    if (error) handleError(error, 'clientService.hardDelete')
  },

  // Contacts
  async listAllContacts(): Promise<ClientContact[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .select('*')
      .order('is_primary', { ascending: false })
    if (error) handleError(error, 'clientService.listAllContacts')
    return (data || []).map(mapContactRow)
  },

  async listContacts(clientId: string): Promise<ClientContact[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(CONTACTS_TABLE)
      .select('*')
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
    if (error) handleError(error, 'clientService.listContacts')
    return (data || []).map(mapContactRow)
  },

  async createContact(input: Omit<ClientContact, 'id'>): Promise<ClientContact> {
    const supabase = getClient()
    const row = { client_id: input.clientId, name: input.name, role: input.role, phone: input.phone, email: input.email, is_primary: input.isPrimary }
    const { data, error } = await supabase.from(CONTACTS_TABLE).insert(row).select().single()
    if (error) handleError(error, 'clientService.createContact')
    return mapContactRow(data!)
  },

  async updateContact(id: string, input: Partial<ClientContact>): Promise<ClientContact> {
    const supabase = getClient()
    const row: Record<string, any> = {}
    if (input.name !== undefined) row.name = input.name
    if (input.role !== undefined) row.role = input.role
    if (input.phone !== undefined) row.phone = input.phone
    if (input.email !== undefined) row.email = input.email
    if (input.isPrimary !== undefined) row.is_primary = input.isPrimary
    const { data, error } = await supabase.from(CONTACTS_TABLE).update(row).eq('id', id).select().single()
    if (error) handleError(error, 'clientService.updateContact')
    return mapContactRow(data!)
  },

  async deleteContact(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(CONTACTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'clientService.deleteContact')
  },

  // Interactions
  async listAllInteractions(): Promise<ClientInteraction[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(INTERACTIONS_TABLE)
      .select('*')
      .order('date', { ascending: false })
    if (error) handleError(error, 'clientService.listAllInteractions')
    return (data || []).map(mapInteractionRow)
  },

  async listInteractions(clientId: string): Promise<ClientInteraction[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(INTERACTIONS_TABLE)
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
    if (error) handleError(error, 'clientService.listInteractions')
    return (data || []).map(mapInteractionRow)
  },

  async createInteraction(input: Omit<ClientInteraction, 'id'>): Promise<ClientInteraction> {
    const supabase = getClient()
    const row = { client_id: input.clientId, type: input.type, title: input.title, description: input.description, date: input.date, author: input.author }
    const { data, error } = await supabase.from(INTERACTIONS_TABLE).insert(row).select().single()
    if (error) handleError(error, 'clientService.createInteraction')
    return mapInteractionRow(data!)
  },

  // Feedbacks
  async listAllFeedbacks(): Promise<ClientFeedbackRanking[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(FEEDBACKS_TABLE)
      .select('*')
      .order('date', { ascending: false })
    if (error) handleError(error, 'clientService.listAllFeedbacks')
    return (data || []).map(mapFeedbackRow)
  },

  async listFeedbacks(clientId: string): Promise<ClientFeedbackRanking[]> {
    const supabase = getClient()
    const { data, error } = await supabase
      .from(FEEDBACKS_TABLE)
      .select('*')
      .eq('client_id', clientId)
      .order('date', { ascending: false })
    if (error) handleError(error, 'clientService.listFeedbacks')
    return (data || []).map(mapFeedbackRow)
  },

  async createFeedback(input: Omit<ClientFeedbackRanking, 'id'>): Promise<ClientFeedbackRanking> {
    const supabase = getClient()
    const row = { client_id: input.clientId, score: input.score, comment: input.comment }
    const { data, error } = await supabase.from(FEEDBACKS_TABLE).insert(row).select().single()
    if (error) handleError(error, 'clientService.createFeedback')
    return mapFeedbackRow(data!)
  },
}

function mapRow(r: any): Client {
  return {
    id: r.id,
    companyId: r.company_id || '',
    companyName: r.company_name || '',
    companyTradeName: r.company_trade_name || r.company_name || '',
    cnpj: r.cnpj || '',
    segment: r.segment || '',
    city: r.city || '',
    state: r.state || '',
    services: Array.isArray(r.services) ? r.services : [],
    contractType: r.contract_type === 'renewal' ? 'renewal' : 'first',
    internalResponsible: r.internal_responsible || '',
    status: r.status || 'active',
    startDate: r.start_date || '',
    endDate: r.end_date || '',
    monthlyValue: Number(r.monthly_value) || 0,
    totalValue: Number(r.total_value) || 0,
    notes: r.notes || '',
    createdAt: r.created_at || new Date().toISOString(),
  }
}

function mapToRow(c: Partial<Client>): Record<string, any> {
  const r: Record<string, any> = {}
  if (c.id !== undefined) r.id = c.id
  if (c.companyId !== undefined) r.company_id = c.companyId
  if (c.companyName !== undefined) r.company_name = c.companyName
  if (c.companyTradeName !== undefined) r.company_trade_name = c.companyTradeName
  if (c.cnpj !== undefined) r.cnpj = c.cnpj
  if (c.segment !== undefined) r.segment = c.segment
  if (c.city !== undefined) r.city = c.city
  if (c.state !== undefined) r.state = c.state
  if (c.services !== undefined) r.services = c.services
  if (c.contractType !== undefined) r.contract_type = c.contractType
  if (c.internalResponsible !== undefined) r.internal_responsible = c.internalResponsible
  if (c.status !== undefined) r.status = c.status
  if (c.startDate !== undefined) r.start_date = c.startDate
  if (c.endDate !== undefined) r.end_date = c.endDate
  if (c.monthlyValue !== undefined) r.monthly_value = c.monthlyValue
  if (c.totalValue !== undefined) r.total_value = c.totalValue
  if (c.notes !== undefined) r.notes = c.notes
  return r
}

function mapContactRow(r: any): ClientContact {
  return { id: r.id, clientId: r.client_id, name: r.name, role: r.role || '', phone: r.phone || '', email: r.email || '', isPrimary: r.is_primary ?? false }
}

function mapInteractionRow(r: any): ClientInteraction {
  return { id: r.id, clientId: r.client_id, type: r.type, title: r.title, description: r.description || '', date: r.date, author: r.author || '' }
}

function mapFeedbackRow(r: any): ClientFeedbackRanking {
  return { id: r.id, clientId: r.client_id, score: r.score, comment: r.comment || '', date: r.date || r.created_at }
}
