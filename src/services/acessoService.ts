const BASE = '/api/prisma/acesso-temporario'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const acessoService = {
  async listAccesses(): Promise<any[]> {
    const data = await api(BASE)
    return data.accesses || []
  },
  async listUsers(): Promise<any[]> {
    const data = await api(BASE)
    return data.tempUsers || []
  },
  async listQuestionnaires(): Promise<any[]> {
    const data = await api(BASE)
    return data.questionnaires || []
  },
  async listResponses(): Promise<any[]> {
    const data = await api(BASE)
    return data.responses || []
  },
}
