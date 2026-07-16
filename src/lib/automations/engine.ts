import { prisma } from '@/lib/prisma'

type RunLog = { status: string; result?: string; error?: string; entityId?: string }

export async function evaluateRule(ruleId: string, triggeredBy = 'manual'): Promise<RunLog> {
  const rule = await prisma.automation_rules.findUnique({
    where: { id: ruleId },
    include: { conditions: true, actions: true },
  })
  if (!rule) return { status: 'failure', error: 'Rule not found' }
  if (!rule.active) return { status: 'skipped', result: 'Rule is inactive' }

  try {
    const entities = await findMatchingEntities(rule)

    if (entities.length === 0) {
      await updateLastRun(ruleId)
      return { status: 'success', result: 'Nenhuma entidade corresponde às condições.' }
    }

    let executedCount = 0
    let skipCount = 0
    const errors: string[] = []

    for (const entity of entities) {
      const alreadyRun = await prisma.automation_runs.findFirst({
        where: { rule_id: ruleId, entity_id: entity.id, status: 'success', executed_at: { gte: new Date(Date.now() - 86400000) } },
      })
      if (alreadyRun) { skipCount++; continue }

      try {
        await executeActions(rule, entity)
        await logRun(ruleId, 'success', `Ação executada para ${entity.label || entity.id}`, triggeredBy, entity.id)
        executedCount++
      } catch (err: any) {
        errors.push(`${entity.id}: ${err.message}`)
        await logRun(ruleId, 'failure', undefined, triggeredBy, entity.id, err.message)
      }
    }

    await updateLastRun(ruleId)

    const summary = `${executedCount} ação(ões) executada(s), ${skipCount} ignorada(s), ${errors.length} erro(s).`
    if (errors.length > 0) return { status: 'failure', result: summary, error: errors.join('; ') }
    return { status: 'success', result: summary }
  } catch (err: any) {
    await logRun(ruleId, 'failure', undefined, triggeredBy, undefined, err.message)
    return { status: 'failure', error: err.message }
  }
}

export async function evaluateAllActiveRules(triggeredBy = 'auto'): Promise<{ ruleId: string; status: string; result?: string; error?: string }[]> {
  const rules = await prisma.automation_rules.findMany({
    where: { active: true },
  })
  const results: { ruleId: string; status: string; result?: string; error?: string }[] = []
  for (const rule of rules) {
    const log = await evaluateRule(rule.id, triggeredBy)
    results.push({ ruleId: rule.id, ...log })
    // Small delay to avoid overwhelming the DB
    await new Promise(r => setTimeout(r, 100))
  }
  return results
}

interface EntityMatch {
  id: string
  label?: string
  data?: any
}

async function findMatchingEntities(rule: any): Promise<EntityMatch[]> {
  const event = rule.event
  const conditions = rule.conditions || []

  switch (event) {
    case 'opportunity_inactive': {
      const days = parseInt(conditions.find((c: any) => c.field === 'days_without_contact')?.value || '7', 10)
      const deals = await prisma.crm_deals.findMany({
        where: { stage: { notIn: ['Cliente perdido', 'Cliente ativo', 'Implantação'] } },
        include: {
          crm_activities: { orderBy: { date: 'desc' }, take: 1 },
          crm_companies: { select: { name: true, trade_name: true } },
        },
      })
      const now = new Date()
      return deals
        .filter(d => {
          const lastActivity = d.crm_activities?.[0]?.date
          if (!lastActivity) return true
          const diffDays = Math.floor((now.getTime() - new Date(lastActivity).getTime()) / 86400000)
          return diffDays >= days
        })
        .map(d => ({
          id: d.id,
          label: `${d.crm_companies?.trade_name || d.crm_companies?.name || 'Empresa'} — ${d.title}`,
          data: { deal: d, daysWithoutContact: d.crm_activities?.[0]?.date ? Math.floor((now.getTime() - new Date(d.crm_activities[0].date).getTime()) / 86400000) : 999 },
        }))
    }

    case 'task_overdue': {
      const tasks = await prisma.crm_tasks.findMany({
        where: { status: 'pending', due_date: { lt: new Date() } },
        include: { crm_companies: { select: { name: true, trade_name: true } } },
      })
      return tasks.map(t => ({
        id: t.id,
        label: `${t.crm_companies?.trade_name || t.crm_companies?.name || 'Empresa'} — ${t.title}`,
        data: { task: t },
      }))
    }

    case 'proposal_expiring': {
      const daysThreshold = parseInt(conditions.find((c: any) => c.field === 'days_in_status')?.value || '15', 10)
      const proposals = await prisma.crm_proposals.findMany({
        where: { status: { in: ['sent', 'negotiation'] } },
        include: { crm_companies: { select: { name: true, trade_name: true } } },
      })
      const now = new Date()
      return proposals
        .filter(p => {
          if (!p.created_at) return false
          const diffDays = Math.floor((now.getTime() - new Date(p.created_at).getTime()) / 86400000)
          return diffDays >= daysThreshold
        })
        .map(p => ({
          id: p.id,
          label: `${p.crm_companies?.trade_name || p.crm_companies?.name || 'Empresa'} — ${p.service}`,
          data: { proposal: p },
        }))
    }

    default:
      return []
  }
}

async function executeActions(rule: any, entity: EntityMatch) {
  const actions = rule.actions || []
  for (const action of actions) {
    switch (action.action_type) {
      case 'create_task': {
        const config = typeof action.action_config === 'string' ? JSON.parse(action.action_config) : action.action_config || {}
        const title = (config.title_template || 'Automação: {label}').replace('{label}', entity.label || entity.id)
        await prisma.crm_tasks.create({
          data: {
            company_id: entity.data?.deal?.company_id || entity.data?.task?.company_id || entity.data?.proposal?.company_id || '',
            deal_id: entity.data?.deal?.id || null,
            title,
            status: 'pending',
            priority: config.priority || 'medium',
            due_date: new Date(Date.now() + (parseInt(config.due_days || '2', 10) * 86400000)),
          },
        })
        break
      }

      case 'create_alert': {
        break
      }

      case 'log_activity': {
        const config = typeof action.action_config === 'string' ? JSON.parse(action.action_config) : action.action_config || {}
        const title = (config.title_template || 'Automação: {label}').replace('{label}', entity.label || entity.id)
        await prisma.crm_activities.create({
          data: {
            company_id: entity.data?.deal?.company_id || entity.data?.task?.company_id || entity.data?.proposal?.company_id || '',
            deal_id: entity.data?.deal?.id || null,
            type: 'comment',
            title,
            description: config.description || 'Evento gerado automaticamente pelo motor de automações.',
            author: 'Automação',
          },
        })
        break
      }

      case 'update_status': {
        const config = typeof action.action_config === 'string' ? JSON.parse(action.action_config) : action.action_config || {}
        if (entity.data?.deal) {
          await prisma.crm_deals.update({
            where: { id: entity.data.deal.id },
            data: { stage: config.status || 'Cliente perdido' },
          })
        }
        break
      }

      default:
        break
    }
  }
}

async function logRun(ruleId: string, status: string, result?: string, triggeredBy = 'manual', entityId?: string, error?: string) {
  await prisma.automation_runs.create({
    data: { rule_id: ruleId, status, result, triggered_by: triggeredBy, entity_id: entityId, error },
  })
}

async function updateLastRun(ruleId: string) {
  await prisma.automation_rules.update({
    where: { id: ruleId },
    data: { last_run_at: new Date() },
  })
}
