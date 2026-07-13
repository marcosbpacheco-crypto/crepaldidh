import { getClient, handleError } from './base'
import type { Contact, Company, Deal, Activity, Task, Proposal, Contract, Seller, CrmClient } from '@/types/crm'

const COMPANIES_TABLE = 'crm_companies'
const CONTACTS_TABLE = 'crm_contacts'
const DEALS_TABLE = 'crm_deals'
const ACTIVITIES_TABLE = 'crm_activities'
const TASKS_TABLE = 'crm_tasks'
const PROPOSALS_TABLE = 'crm_proposals'
const CONTRACTS_TABLE = 'crm_contracts'
const SELLERS_TABLE = 'crm_sellers'
const CLIENTS_TABLE = 'crm_clients'

export const crmService = {
  async saveAll(data: {
    companies?: Company[]
    contacts?: Contact[]
    deals?: Deal[]
    activities?: Activity[]
    tasks?: Task[]
    proposals?: Proposal[]
    contracts?: Contract[]
    clients?: CrmClient[]
    diagnostics?: any[]
    units?: any[]
    sectors?: any[]
    risks?: any[]
    evidences?: any[]
    actionPlans?: any[]
    monitoring?: any[]
    reports?: any[]
    interviews?: any[]
  }): Promise<void> {
    const supabase = getClient()
    const jobs: Promise<any>[] = []
    if (data.companies?.length) jobs.push(Promise.resolve(supabase.from(COMPANIES_TABLE).upsert(data.companies.map(mcRow))))
    if (data.contacts?.length) jobs.push(Promise.resolve(supabase.from(CONTACTS_TABLE).upsert(data.contacts.map(mapContactRow))))
    if (data.deals?.length) jobs.push(Promise.resolve(supabase.from(DEALS_TABLE).upsert(data.deals.map(mdRow))))
    if (data.activities?.length) jobs.push(Promise.resolve(supabase.from(ACTIVITIES_TABLE).upsert(data.activities.map(maRow))))
    if (data.tasks?.length) jobs.push(Promise.resolve(supabase.from(TASKS_TABLE).upsert(data.tasks.map(mtRow))))
    if (data.proposals?.length) jobs.push(Promise.resolve(supabase.from(PROPOSALS_TABLE).upsert(data.proposals.map(mprRow))))
    if (data.contracts?.length) jobs.push(Promise.resolve(supabase.from(CONTRACTS_TABLE).upsert(data.contracts.map(mctRow))))
    if (data.clients?.length) jobs.push(Promise.resolve(supabase.from(CLIENTS_TABLE).upsert(data.clients)))
    await Promise.allSettled(jobs)
  },
  // Companies
  async listCompanies(): Promise<Company[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(COMPANIES_TABLE).select('*').order('name')
    if (error) handleError(error, 'crmService.listCompanies')
    return (data || []).map(mc)
  },
  async createCompany(input: Partial<Company>): Promise<Company> {
    const supabase = getClient()
    const { data, error } = await supabase.from(COMPANIES_TABLE).insert(input).select().single()
    if (error) handleError(error, 'crmService.createCompany')
    return mc(data!)
  },
  async updateCompany(id: string, input: Partial<Company>): Promise<Company> {
    const supabase = getClient()
    const { data, error } = await supabase.from(COMPANIES_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'crmService.updateCompany')
    return mc(data!)
  },
  async removeCompany(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(COMPANIES_TABLE).update({ status: 'inactive' }).eq('id', id)
    if (error) handleError(error, 'crmService.removeCompany')
  },
  // Contacts
  async listContacts(companyId?: string): Promise<Contact[]> {
    const supabase = getClient()
    let q = supabase.from(CONTACTS_TABLE).select('*')
    if (companyId) q = q.eq('company_id', companyId)
    const { data, error } = await q.order('name')
    if (error) handleError(error, 'crmService.listContacts')
    return (data || []).map(mapContact)
  },
  async createContact(input: Partial<Contact>): Promise<Contact> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CONTACTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'crmService.createContact')
    return mapContact(data!)
  },
  async updateContact(id: string, input: Partial<Contact>): Promise<Contact> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CONTACTS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'crmService.updateContact')
    return mapContact(data!)
  },
  async removeContact(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(CONTACTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'crmService.removeContact')
  },
  // Deals
  async listDeals(companyId?: string): Promise<Deal[]> {
    const supabase = getClient()
    let q = supabase.from(DEALS_TABLE).select('*')
    if (companyId) q = q.eq('company_id', companyId)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) handleError(error, 'crmService.listDeals')
    return (data || []).map(md)
  },
  async createDeal(input: Partial<Deal>): Promise<Deal> {
    const supabase = getClient()
    const { data, error } = await supabase.from(DEALS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'crmService.createDeal')
    return md(data!)
  },
  async updateDeal(id: string, input: Partial<Deal>): Promise<Deal> {
    const supabase = getClient()
    const { data, error } = await supabase.from(DEALS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'crmService.updateDeal')
    return md(data!)
  },
  async removeDeal(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(DEALS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'crmService.removeDeal')
  },
  // Activities
  async listActivities(companyId?: string, dealId?: string): Promise<Activity[]> {
    const supabase = getClient()
    let q = supabase.from(ACTIVITIES_TABLE).select('*')
    if (companyId) q = q.eq('company_id', companyId)
    if (dealId) q = q.eq('deal_id', dealId)
    const { data, error } = await q.order('date', { ascending: false })
    if (error) handleError(error, 'crmService.listActivities')
    return (data || []).map(ma)
  },
  async createActivity(input: Partial<Activity>): Promise<Activity> {
    const supabase = getClient()
    const { data, error } = await supabase.from(ACTIVITIES_TABLE).insert(input).select().single()
    if (error) handleError(error, 'crmService.createActivity')
    return ma(data!)
  },
  async removeActivity(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(ACTIVITIES_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'crmService.removeActivity')
  },
  // Tasks
  async listTasks(companyId?: string, dealId?: string): Promise<Task[]> {
    const supabase = getClient()
    let q = supabase.from(TASKS_TABLE).select('*')
    if (companyId) q = q.eq('company_id', companyId)
    if (dealId) q = q.eq('deal_id', dealId)
    const { data, error } = await q.order('due_date')
    if (error) handleError(error, 'crmService.listTasks')
    return (data || []).map(mt)
  },
  async createTask(input: Partial<Task>): Promise<Task> {
    const supabase = getClient()
    const { data, error } = await supabase.from(TASKS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'crmService.createTask')
    return mt(data!)
  },
  async updateTask(id: string, input: Partial<Task>): Promise<Task> {
    const supabase = getClient()
    const { data, error } = await supabase.from(TASKS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'crmService.updateTask')
    return mt(data!)
  },
  async removeTask(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(TASKS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'crmService.removeTask')
  },
  // Proposals
  async listProposals(companyId?: string): Promise<Proposal[]> {
    const supabase = getClient()
    let q = supabase.from(PROPOSALS_TABLE).select('*')
    if (companyId) q = q.eq('company_id', companyId)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) handleError(error, 'crmService.listProposals')
    return (data || []).map(mpr)
  },
  async createProposal(input: Partial<Proposal>): Promise<Proposal> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PROPOSALS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'crmService.createProposal')
    return mpr(data!)
  },
  async updateProposal(id: string, input: Partial<Proposal>): Promise<Proposal> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PROPOSALS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'crmService.updateProposal')
    return mpr(data!)
  },
  async removeProposal(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PROPOSALS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'crmService.removeProposal')
  },
  // Contracts
  async listContracts(companyId?: string): Promise<Contract[]> {
    const supabase = getClient()
    let q = supabase.from(CONTRACTS_TABLE).select('*')
    if (companyId) q = q.eq('company_id', companyId)
    const { data, error } = await q.order('created_at', { ascending: false })
    if (error) handleError(error, 'crmService.listContracts')
    return (data || []).map(mct)
  },
  async createContract(input: Partial<Contract>): Promise<Contract> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CONTRACTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'crmService.createContract')
    return mct(data!)
  },
  async updateContract(id: string, input: Partial<Contract>): Promise<Contract> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CONTRACTS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'crmService.updateContract')
    return mct(data!)
  },
  async removeContract(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(CONTRACTS_TABLE).delete().eq('id', id)
    if (error) handleError(error, 'crmService.removeContract')
  },
  // Sellers
  async listSellers(): Promise<Seller[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(SELLERS_TABLE).select('*').order('name')
    if (error) handleError(error, 'crmService.listSellers')
    return data || []
  },
  // Crm clients
  async listCrmClients(): Promise<CrmClient[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(CLIENTS_TABLE).select('*')
    if (error) handleError(error, 'crmService.listCrmClients')
    return data || []
  },
}

function mc(r: any): Company { return { ...r, tradeName: r.trade_name, respPrincipal: r.resp_principal, respRH: r.resp_rh, respFinanceiro: r.resp_financeiro, createdAt: r.created_at } }
function mapContact(r: any): Contact { return { ...r, companyId: r.company_id, influence: r.influence || 'medium', birthday: r.birthday || '' } }
function md(r: any): Deal { return { ...r, companyId: r.company_id, sellerId: r.seller_id, dueDate: r.due_date, createdAt: r.created_at, lostReason: r.lost_reason } }
function ma(r: any): Activity { return { ...r, companyId: r.company_id, dealId: r.deal_id } }
function mt(r: any): Task { return { ...r, companyId: r.company_id, dealId: r.deal_id, dueDate: r.due_date } }
function mpr(r: any): Proposal { return { ...r, companyId: r.company_id, createdAt: r.created_at } }
function mct(r: any): Contract { return { ...r, companyId: r.company_id, proposalId: r.proposal_id, startDate: r.start_date, endDate: r.end_date, autoRenew: r.auto_renew, createdAt: r.created_at } }
function mcRow(r: any) { const { tradeName, respPrincipal, respRH, respFinanceiro, createdAt, ...rest } = r; return { ...rest, trade_name: r.tradeName, resp_principal: r.respPrincipal, resp_rh: r.respRH, resp_financeiro: r.respFinanceiro, created_at: r.createdAt } }
function mapContactRow(r: any) { const { companyId, influence, birthday, ...rest } = r; return { ...rest, company_id: r.companyId } }
function mdRow(r: any) { const { companyId, sellerId, dueDate, createdAt, lostReason, ...rest } = r; return { ...rest, company_id: r.companyId, seller_id: r.sellerId, due_date: r.dueDate, created_at: r.createdAt, lost_reason: r.lostReason } }
function maRow(r: any) { const { companyId, dealId, ...rest } = r; return { ...rest, company_id: r.companyId, deal_id: r.dealId } }
function mtRow(r: any) { const { companyId, dealId, dueDate, ...rest } = r; return { ...rest, company_id: r.companyId, deal_id: r.dealId, due_date: r.dueDate } }
function mprRow(r: any) { const { companyId, createdAt, ...rest } = r; return { ...rest, company_id: r.companyId, created_at: r.createdAt } }
function mctRow(r: any) { const { companyId, proposalId, startDate, endDate, autoRenew, createdAt, ...rest } = r; return { ...rest, company_id: r.companyId, proposal_id: r.proposalId, start_date: r.startDate, end_date: r.endDate, auto_renew: r.autoRenew, created_at: r.createdAt } }
