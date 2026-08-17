import type { Service } from '@/types/services'

const BASE = '/api/prisma/services'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const serviceService = {
  async list(): Promise<Service[]> {
    const data = await api(BASE)
    return (data.services || []).map(mapService)
  },

  async create(input: Partial<Service>): Promise<Service> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return mapService(data.service)
  },

  async update(id: string, input: Partial<Service>): Promise<Service> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    })
    return mapService(data.service)
  },

  async remove(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },
}

function mapService(r: any): Service {
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    category: r.category,
    status: r.status,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at,
  }
}