import { describe, it, expect } from 'vitest'

describe('Alerts Logic', () => {
  it('identifies overdue tasks correctly', () => {
    const now = new Date()
    const yesterday = new Date(now.getTime() - 86400000).toISOString().split('T')[0]
    const lastWeek = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0]

    const tasks = [
      { id: 't1', title: 'Tarefa atrasada 1 dia', dueDate: yesterday, status: 'pending', companyId: 'c1', priority: 'high' },
      { id: 't2', title: 'Tarefa atrasada 7 dias', dueDate: lastWeek, status: 'pending', companyId: 'c1', priority: 'high' },
      { id: 't3', title: 'Tarefa concluída', dueDate: yesterday, status: 'completed', companyId: 'c1', priority: 'high' },
    ]

    const overdueTasks = tasks.filter(t => t.status === 'pending' && new Date(t.dueDate) < now)
    expect(overdueTasks).toHaveLength(2)
    expect(overdueTasks.map(t => t.id)).toEqual(['t1', 't2'])
  })

  it('identifies expiring contracts correctly', () => {
    const now = new Date()
    const in15Days = new Date(now.getTime() + 15 * 86400000).toISOString().split('T')[0]
    const in5Days = new Date(now.getTime() + 5 * 86400000).toISOString().split('T')[0]
    const in60Days = new Date(now.getTime() + 60 * 86400000).toISOString().split('T')[0]

    const contracts = [
      { id: 'c1', title: 'Contrato A', endDate: in15Days, status: 'active' },
      { id: 'c2', title: 'Contrato B', endDate: in5Days, status: 'active' },
      { id: 'c3', title: 'Contrato C', endDate: in60Days, status: 'active' },
      { id: 'c4', title: 'Contrato D', endDate: in15Days, status: 'expired' },
    ]

    const expiringSoon = contracts.filter(c => {
      if (c.status !== 'active') return false
      const end = new Date(c.endDate)
      const daysLeft = Math.floor((end.getTime() - now.getTime()) / 86400000)
      return daysLeft <= 30 && daysLeft >= 0
    })

    expect(expiringSoon).toHaveLength(2)
    expect(expiringSoon.map(c => c.id)).toEqual(['c1', 'c2'])
  })

  it('classifies alert severity by days overdue', () => {
    const getSeverity = (daysOverdue: number) => {
      if (daysOverdue > 7) return 'critical'
      if (daysOverdue > 3) return 'high'
      return 'medium'
    }

    expect(getSeverity(1)).toBe('medium')
    expect(getSeverity(5)).toBe('high')
    expect(getSeverity(10)).toBe('critical')
  })
})

describe('Import Logic', () => {
  it('parses CSV headers correctly', () => {
    const csvLine = 'name,tradeName,cnpj,segment,city,state\n'
    const headers = csvLine.trim().split(',').map(s => s.trim())
    expect(headers).toHaveLength(6)
    expect(headers[0]).toBe('name')
    expect(headers[3]).toBe('segment')
  })

  it('auto-maps columns by normalized name', () => {
    const columns = ['name', 'email', 'phone', 'document', 'companyName', 'roleName']
    const csvHeaders = ['Name', 'Email', 'Phone', 'Document (CPF)', 'Company', 'Role']

    const mapping: Record<number, string> = {}
    csvHeaders.forEach((col, idx) => {
      const normalized = col.toLowerCase().replace(/[\s_-]/g, '')
      const match = columns.find(tc => {
        const tcNorm = tc.toLowerCase().replace(/[\s_-]/g, '')
        return normalized === tcNorm || normalized.includes(tcNorm) || tcNorm.includes(normalized)
      })
      if (match) mapping[idx] = match
    })

    expect(mapping[0]).toBe('name')
    expect(mapping[1]).toBe('email')
    expect(mapping[2]).toBe('phone')
    expect(mapping[3]).toBe('document')
    expect(Object.keys(mapping).length).toBe(6)
  })
})

describe('Cadastros Logic', () => {
  it('generates unique IDs for new entities', () => {
    const generateId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    const id1 = generateId('unit')
    const id2 = generateId('unit')
    expect(id1).not.toBe(id2)
    expect(id1).toContain('unit-')
    expect(id2).toContain('unit-')
  })

  it('filters collaborators by sector', () => {
    const collaborators = [
      { id: 'c1', sectorId: 's1', name: 'João' },
      { id: 'c2', sectorId: 's1', name: 'Maria' },
      { id: 'c3', sectorId: 's2', name: 'Pedro' },
    ]
    const sector1Collabs = collaborators.filter(c => c.sectorId === 's1')
    expect(sector1Collabs).toHaveLength(2)
    expect(sector1Collabs.map(c => c.name)).toEqual(['João', 'Maria'])
  })
})
