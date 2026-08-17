import { createSingleFlight } from '@/lib/single-flight'

const BASE = '/api/prisma/acesso-temporario'

async function api(url: string, opts?: RequestInit) {
  if (opts?.method && opts.method !== 'GET') flight.invalidate()
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

const flight = createSingleFlight(() => api(BASE))

export const acessoService = {
  async listAccesses(): Promise<any[]> {
    const data = await flight.get()
    return data.accesses || []
  },
  async listUsers(): Promise<any[]> {
    const data = await flight.get()
    return data.tempUsers || []
  },
  async listQuestionnaires(): Promise<any[]> {
    const data = await flight.get()
    return data.questionnaires || []
  },
  async listResponses(): Promise<any[]> {
    const data = await flight.get()
    return data.responses || []
  },
}
