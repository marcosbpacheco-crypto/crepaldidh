const BASE = '/api/prisma/acesso-temporario'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const acessoService = {
  async saveAll(data: {
    accesses?: any[]
    tempUsers?: any[]
    questionnaires?: any[]
    responses?: any[]
  }): Promise<void> {
    const jobs: Promise<any>[] = []
    for (const a of data.accesses || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'access', ...a }) }).catch(() => {}))
    }
    for (const u of data.tempUsers || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'user', ...u }) }).catch(() => {}))
    }
    for (const q of data.questionnaires || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'questionnaire', ...q }) }).catch(() => {}))
    }
    for (const r of data.responses || []) {
      jobs.push(api(BASE, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ _type: 'response', ...r }) }).catch(() => {}))
    }
    await Promise.allSettled(jobs)
  },

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
