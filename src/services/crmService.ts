import type { Contact, Company, Deal, Activity, Task, Proposal, Contract, Seller, CrmClient } from '@/types/crm'

const BASE = '/api/prisma/crm'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

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
  }): Promise<void> {
    const jobs: Promise<any>[] = []
    for (const c of data.companies || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'company', ...mcRow(c) }) }).catch(() => {}))
    }
    for (const c of data.contacts || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'contact', ...mapContactRow(c) }) }).catch(() => {}))
    }
    for (const d of data.deals || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'deal', ...mdRow(d) }) }).catch(() => {}))
    }
    for (const a of data.activities || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'activity', ...maRow(a) }) }).catch(() => {}))
    }
    for (const t of data.tasks || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'task', ...mtRow(t) }) }).catch(() => {}))
    }
    for (const p of data.proposals || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'proposal', ...mprRow(p) }) }).catch(() => {}))
    }
    for (const c of data.contracts || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'contract', ...mctRow(c) }) }).catch(() => {}))
    }
    await Promise.allSettled(jobs)
  },

  async listCompanies(): Promise<Company[]> {
    const data = await api(BASE)
    return (data.companies || []).map(mc)
  },

  async createCompany(input: Partial<Company>): Promise<Company> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'company', ...input }),
    })
    return mc(data.company)
  },

  async updateCompany(id: string, input: Partial<Company>): Promise<Company> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    })
    return mc(data.client || data.company)
  },

  async removeCompany(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  async listContacts(companyId?: string): Promise<Contact[]> {
    const data = await api(BASE)
    const all: Contact[] = []
    for (const c of data.companies || []) {
      for (const r of c.crm_contacts || []) {
        all.push(mapContact({ ...r, company_id: c.id }))
      }
    }
    return companyId ? all.filter(c => c.companyId === companyId) : all
  },

  async createContact(input: Partial<Contact>): Promise<Contact> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'contact', ...input }),
    })
    return mapContact(data.contact)
  },

  async updateContact(id: string, input: Partial<Contact>): Promise<Contact> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'contact', id, ...input }),
    })
    return mapContact(data.contact)
  },

  async removeContact(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'contact', id }),
    })
  },

  async listDeals(companyId?: string): Promise<Deal[]> {
    const data = await api(BASE)
    const all: Deal[] = []
    for (const c of data.companies || []) {
      for (const r of c.crm_deals || []) {
        all.push(md({ ...r, company_id: c.id }))
      }
    }
    return companyId ? all.filter(d => d.companyId === companyId) : all
  },

  async createDeal(input: Partial<Deal>): Promise<Deal> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'deal', ...input }),
    })
    return md(data.deal)
  },

  async updateDeal(id: string, input: Partial<Deal>): Promise<Deal> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'deal', id, ...input }),
    })
    return md(data.deal)
  },

  async removeDeal(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'deal', id }),
    })
  },

  async listActivities(companyId?: string, dealId?: string): Promise<Activity[]> {
    const data = await api(BASE)
    const all: Activity[] = []
    for (const c of data.companies || []) {
      for (const r of c.crm_activities || []) {
        all.push(ma({ ...r, company_id: c.id }))
      }
    }
    let filtered = all
    if (companyId) filtered = filtered.filter(a => a.companyId === companyId)
    if (dealId) filtered = filtered.filter(a => a.dealId === dealId)
    return filtered
  },

  async createActivity(input: Partial<Activity>): Promise<Activity> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'activity', ...input }),
    })
    return ma(data.activity)
  },

  async removeActivity(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'activity', id }),
    })
  },

  async listTasks(companyId?: string, dealId?: string): Promise<Task[]> {
    const data = await api(BASE)
    const all: Task[] = []
    for (const c of data.companies || []) {
      for (const r of c.crm_tasks || []) {
        all.push(mt({ ...r, company_id: c.id }))
      }
    }
    let filtered = all
    if (companyId) filtered = filtered.filter(t => t.companyId === companyId)
    if (dealId) filtered = filtered.filter(t => t.dealId === dealId)
    return filtered
  },

  async createTask(input: Partial<Task>): Promise<Task> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'task', ...input }),
    })
    return mt(data.task)
  },

  async updateTask(id: string, input: Partial<Task>): Promise<Task> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'task', id, ...input }),
    })
    return mt(data.task)
  },

  async removeTask(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'task', id }),
    })
  },

  async listProposals(companyId?: string): Promise<Proposal[]> {
    const data = await api(BASE)
    const all: Proposal[] = []
    for (const c of data.companies || []) {
      for (const r of c.crm_proposals || []) {
        all.push(mpr({ ...r, company_id: c.id }))
      }
    }
    return companyId ? all.filter(p => p.companyId === companyId) : all
  },

  async createProposal(input: Partial<Proposal>): Promise<Proposal> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'proposal', ...input }),
    })
    return mpr(data.proposal)
  },

  async updateProposal(id: string, input: Partial<Proposal>): Promise<Proposal> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'proposal', id, ...input }),
    })
    return mpr(data.proposal)
  },

  async removeProposal(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'proposal', id }),
    })
  },

  async listContracts(companyId?: string): Promise<Contract[]> {
    const data = await api(BASE)
    const all: Contract[] = []
    for (const c of data.companies || []) {
      for (const r of c.crm_contracts || []) {
        all.push(mct({ ...r, company_id: c.id }))
      }
    }
    return companyId ? all.filter(c => c.companyId === companyId) : all
  },

  async createContract(input: Partial<Contract>): Promise<Contract> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'contract', ...input }),
    })
    return mct(data.contract)
  },

  async updateContract(id: string, input: Partial<Contract>): Promise<Contract> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'contract', id, ...input }),
    })
    return mct(data.contract)
  },

  async removeContract(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'contract', id }),
    })
  },

  async listSellers(): Promise<Seller[]> {
    const data = await api(BASE)
    return data.sellers || []
  },

  async listCrmClients(): Promise<CrmClient[]> {
    const data = await api(BASE)
    return data.clients || []
  },
}

function mc(r: any): Company { return { ...r, tradeName: r.trade_name, respPrincipal: r.resp_principal, respRH: r.resp_rh, respFinanceiro: r.resp_financeiro, createdAt: r.created_at } }
function mapContact(r: any): Contact { return { ...r, companyId: r.company_id, influence: r.influence || 'medium', birthday: r.birthday || '' } }
function md(r: any): Deal { return { ...r, companyId: r.company_id, sellerId: r.seller_id, dueDate: r.due_date, createdAt: r.created_at, lostReason: r.lost_reason } }
function ma(r: any): Activity { return { ...r, companyId: r.company_id, dealId: r.deal_id } }
function mt(r: any): Task { return { ...r, companyId: r.company_id, dealId: r.deal_id, dueDate: r.due_date } }
function mpr(r: any): Proposal { return { ...r, companyId: r.company_id, createdAt: r.created_at } }
function mct(r: any): Contract { return { ...r, companyId: r.company_id, proposalId: r.proposal_id, startDate: r.start_date, endDate: r.end_date, autoRenew: r.auto_renew, createdAt: r.created_at } }

function mcRow(r: any) {
  const { tradeName, respPrincipal, respRH, respFinanceiro, createdAt, ...rest } = r
  return { ...rest, trade_name: r.tradeName, resp_principal: r.respPrincipal, resp_rh: r.respRH, resp_financeiro: r.respFinanceiro, created_at: r.createdAt }
}
function mapContactRow(r: any) {
  const { companyId, ...rest } = r
  return { ...rest, company_id: r.companyId }
}
function mdRow(r: any) {
  const { companyId, sellerId, dueDate, lostReason, createdAt, ...rest } = r
  return { ...rest, company_id: r.companyId, seller_id: r.sellerId, due_date: r.dueDate, lost_reason: r.lostReason, created_at: r.createdAt }
}
function maRow(r: any) {
  const { companyId, dealId, ...rest } = r
  return { ...rest, company_id: r.companyId, deal_id: r.dealId }
}
function mtRow(r: any) {
  const { companyId, dealId, dueDate, ...rest } = r
  return { ...rest, company_id: r.companyId, deal_id: r.dealId, due_date: r.dueDate }
}
function mprRow(r: any) {
  const { companyId, createdAt, ...rest } = r
  return { ...rest, company_id: r.companyId, created_at: r.createdAt }
}
function mctRow(r: any) {
  const { companyId, proposalId, startDate, endDate, autoRenew, createdAt, ...rest } = r
  return { ...rest, company_id: r.companyId, proposal_id: r.proposalId, start_date: r.startDate, end_date: r.endDate, auto_renew: r.autoRenew, created_at: r.createdAt }
}
