import type { LeadScoreResult, TimelineEvent, SimulateResult, ExecutiveDossier, DashboardData } from '@/types/commercial-assistant'

const BASE = '/api/ai/commercial-assistant'

async function api(action: string, body?: Record<string, any>): Promise<any> {
  const res = await fetch(BASE, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, ...body }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const commercialAssistantService = {
  async getLeadScore(dealId: string): Promise<LeadScoreResult> {
    return api('score', { dealId })
  },

  async getTimeline(dealId: string): Promise<TimelineEvent[]> {
    const data = await api('timeline', { dealId })
    return data.events || []
  },

  async simulate(dealId: string, changes: Record<string, any>): Promise<SimulateResult> {
    return api('simulate', { dealId, changes })
  },

  async getDossier(companyId: string): Promise<ExecutiveDossier> {
    return api('dossier', { companyId })
  },

  async getDashboard(): Promise<DashboardData> {
    return api('dashboard')
  },
}
