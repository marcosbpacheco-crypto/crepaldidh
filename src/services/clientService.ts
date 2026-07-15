import type { Client, ClientContact, ClientInteraction, ClientFeedbackRanking } from '@/types/clients'

const BASE = '/api/prisma/clients'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  const json = await res.json()
  if (!res.ok) throw new Error(json?.error || `HTTP ${res.status}`)
  return json as T
}

function mapClient(r: any): Client {
  return {
    id: r.id ?? '',
    companyId: r.company_id ?? '',
    companyName: r.company_name ?? '',
    companyTradeName: r.company_trade_name ?? r.company_name ?? '',
    cnpj: r.cnpj ?? '',
    segment: r.segment ?? '',
    city: r.city ?? '',
    state: r.state ?? '',
    services: Array.isArray(r.services) ? r.services : [],
    contractType: r.contract_type === 'renewal' ? 'renewal' : 'first',
    internalResponsible: r.internal_responsible ?? '',
    status: ['active', 'suspended', 'churned'].includes(r.status) ? r.status : 'active',
    startDate: r.start_date ?? '',
    endDate: r.end_date ?? '',
    monthlyValue: Number(r.monthly_value ?? 0),
    totalValue: Number(r.total_value ?? 0),
    notes: r.notes ?? '',
    createdAt: r.created_at ?? new Date().toISOString(),
  }
}

function mapContact(r: any): ClientContact {
  return {
    id: r.id ?? '',
    clientId: r.client_id ?? '',
    name: r.name ?? '',
    role: r.role ?? '',
    phone: r.phone ?? '',
    email: r.email ?? '',
    isPrimary: r.is_primary ?? false,
  }
}

function mapInteraction(r: any): ClientInteraction {
  return {
    id: r.id ?? '',
    clientId: r.client_id ?? '',
    type: r.type ?? 'call',
    title: r.title ?? '',
    description: r.description ?? '',
    date: r.date ?? r.created_at ?? new Date().toISOString(),
    author: r.author ?? '',
  }
}

function mapFeedback(r: any): ClientFeedbackRanking {
  return {
    id: r.id ?? '',
    clientId: r.client_id ?? '',
    score: r.score ?? 0,
    comment: r.comment ?? '',
    date: r.date ?? r.created_at ?? new Date().toISOString(),
  }
}

export const clientService = {
  async list(): Promise<Client[]> {
    const json = await request<{ clients: any[] }>(BASE)
    return (json.clients || []).map(mapClient)
  },

  async getById(id: string): Promise<Client | null> {
    const list = await this.list()
    return list.find(c => c.id === id) ?? null
  },

  async create(input: Partial<Client> & { id?: string }): Promise<Client> {
    const json = await request<{ client: any }>(BASE, {
      method: 'POST',
      body: JSON.stringify({ _type: 'client', ...input }),
    })
    return mapClient(json.client)
  },

  async update(id: string, input: Partial<Client>): Promise<Client> {
    const json = await request<{ client: any }>(BASE, {
      method: 'PATCH',
      body: JSON.stringify({ _type: 'client', id, ...input }),
    })
    return mapClient(json.client)
  },

  async remove(id: string): Promise<void> {
    await request(BASE, {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    })
  },

  async restore(id: string): Promise<Client> {
    const json = await request<{ client: any }>(BASE, {
      method: 'PATCH',
      body: JSON.stringify({ _type: 'restore', id }),
    })
    return mapClient(json.client)
  },

  async hardDelete(id: string): Promise<void> {
    await request(BASE, {
      method: 'DELETE',
      body: JSON.stringify({ id, _type: 'hard' }),
    })
  },

  async listAllContacts(): Promise<ClientContact[]> {
    const json = await request<{ clients: any[] }>(BASE)
    const contacts: ClientContact[] = []
    for (const c of json.clients || []) {
      if (c.client_contacts) {
        for (const ct of c.client_contacts) {
          contacts.push(mapContact(ct))
        }
      }
    }
    return contacts
  },

  async listContacts(clientId: string): Promise<ClientContact[]> {
    return (await this.listAllContacts()).filter(c => c.clientId === clientId)
  },

  async createContact(input: Partial<ClientContact> & { id?: string }): Promise<ClientContact> {
    const json = await request<{ contact: any }>(BASE, {
      method: 'POST',
      body: JSON.stringify({ _type: 'contact', ...input }),
    })
    return mapContact(json.contact)
  },

  async updateContact(id: string, input: Partial<ClientContact>): Promise<ClientContact> {
    const json = await request<{ contact: any }>(BASE, {
      method: 'PATCH',
      body: JSON.stringify({ _type: 'contact', id, ...input }),
    })
    return mapContact(json.contact)
  },

  async deleteContact(id: string): Promise<void> {
    await request(BASE, {
      method: 'DELETE',
      body: JSON.stringify({ _type: 'contact', id }),
    })
  },

  async createInteraction(input: Partial<ClientInteraction> & { id?: string }): Promise<ClientInteraction> {
    const json = await request<{ interaction: any }>(BASE, {
      method: 'POST',
      body: JSON.stringify({ _type: 'interaction', ...input }),
    })
    return mapInteraction(json.interaction)
  },

  async createFeedback(input: Partial<ClientFeedbackRanking> & { id?: string }): Promise<ClientFeedbackRanking> {
    const json = await request<{ feedback: any }>(BASE, {
      method: 'POST',
      body: JSON.stringify({ _type: 'feedback', ...input }),
    })
    return mapFeedback(json.feedback)
  },

  async listAllInteractions(): Promise<ClientInteraction[]> {
    const json = await request<{ clients: any[] }>(BASE)
    const interactions: ClientInteraction[] = []
    for (const c of json.clients || []) {
      if (c.client_interactions) {
        for (const i of c.client_interactions) {
          interactions.push(mapInteraction(i))
        }
      }
    }
    return interactions
  },

  async listInteractions(clientId: string): Promise<ClientInteraction[]> {
    return (await this.listAllInteractions()).filter(i => i.clientId === clientId)
  },

  async listAllFeedbacks(): Promise<ClientFeedbackRanking[]> {
    const json = await request<{ clients: any[] }>(BASE)
    const feedbacks: ClientFeedbackRanking[] = []
    for (const c of json.clients || []) {
      if (c.client_feedbacks) {
        for (const f of c.client_feedbacks) {
          feedbacks.push(mapFeedback(f))
        }
      }
    }
    return feedbacks
  },

  async listFeedbacks(clientId: string): Promise<ClientFeedbackRanking[]> {
    return (await this.listAllFeedbacks()).filter(f => f.clientId === clientId)
  },
}
