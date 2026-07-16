const BASE = '/api/automations'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export interface AutomationRule {
  id: string
  name: string
  description: string | null
  event: string
  active: boolean
  created_by: string | null
  last_run_at: string | null
  created_at: string
  conditions: AutomationCondition[]
  actions: AutomationAction[]
  _count?: { runs: number }
}

export interface AutomationCondition {
  id: string
  rule_id: string
  field: string
  operator: string
  value: string
}

export interface AutomationAction {
  id: string
  rule_id: string
  action_type: string
  action_config: any
}

export interface AutomationRun {
  id: string
  rule_id: string
  status: string
  triggered_by: string | null
  result: string | null
  error: string | null
  entity_id: string | null
  executed_at: string
  rule?: { name: string }
}

export const automationService = {
  async listRules(): Promise<AutomationRule[]> {
    const data = await api(BASE + '/rules')
    return data.rules || []
  },

  async getRule(id: string): Promise<AutomationRule> {
    const data = await api(BASE + `/rules/${id}`)
    return data.rule
  },

  async createRule(input: { name: string; description?: string; event: string; conditions: { field: string; operator: string; value: string }[]; actions: { action_type: string; action_config?: any }[] }): Promise<AutomationRule> {
    const data = await api(BASE + '/rules', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return data.rule
  },

  async updateRule(id: string, input: { name?: string; description?: string; event?: string; active?: boolean; conditions?: { field: string; operator: string; value: string }[]; actions?: { action_type: string; action_config?: any }[] }): Promise<AutomationRule> {
    const data = await api(BASE + `/rules/${id}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    })
    return data.rule
  },

  async deleteRule(id: string): Promise<void> {
    await api(BASE + `/rules/${id}`, { method: 'DELETE' })
  },

  async toggleRule(id: string, active: boolean): Promise<AutomationRule> {
    return this.updateRule(id, { active })
  },

  async checkRules(ruleId?: string): Promise<any> {
    return api(BASE + '/check', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ruleId ? { ruleId } : {}),
    })
  },

  async getRuns(ruleId?: string): Promise<AutomationRun[]> {
    const qs = ruleId ? `?ruleId=${ruleId}` : ''
    const data = await api(BASE + '/runs' + qs)
    return data.runs || []
  },
}
