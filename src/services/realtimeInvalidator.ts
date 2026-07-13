import { getClient } from './base'
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js'

type TableName =
  | 'client_list' | 'client_contacts' | 'client_interactions' | 'client_documents' | 'client_feedbacks'
  | 'crm_companies' | 'crm_contacts' | 'crm_deals' | 'crm_proposals' | 'crm_contracts' | 'crm_activities' | 'crm_tasks'
  | 'training_events' | 'training_participants' | 'training_certificates' | 'training_feedbacks'
  | 'calendar_events' | 'calendar_participants'
  | 'documents' | 'document_versions'
  | 'admin_users' | 'admin_audit_logs'
  | 'projects' | 'project_tasks'
  | 'fin_receivables' | 'fin_payables' | 'fin_categories'
  | 'ment_sessions' | 'ment_participants' | 'ment_pdi_plans'
  | 'ass_diagnosticos' | 'ass_okrs' | 'ass_swot' | 'ass_planos_acao' | 'ass_kpis'

const TABLE_QUERY_KEYS: Record<TableName, string[]> = {
  client_list: ['clients'],
  client_contacts: ['clients'],
  client_interactions: ['clients'],
  client_documents: ['clients'],
  client_feedbacks: ['clients'],
  crm_companies: ['crm', 'companies'],
  crm_contacts: ['crm', 'contacts'],
  crm_deals: ['crm', 'deals'],
  crm_proposals: ['crm', 'proposals'],
  crm_contracts: ['crm', 'contracts'],
  crm_activities: ['crm', 'activities'],
  crm_tasks: ['crm', 'tasks'],
  training_events: ['trainings', 'events'],
  training_participants: ['trainings', 'participants'],
  training_certificates: ['trainings', 'certificates'],
  training_feedbacks: ['trainings', 'feedbacks'],
  calendar_events: ['calendar', 'events'],
  calendar_participants: ['calendar', 'participants'],
  documents: ['documents'],
  document_versions: ['documents'],
  admin_users: ['admin', 'users'],
  admin_audit_logs: ['admin', 'auditLogs'],
  projects: ['projects'],
  project_tasks: ['projects', 'tasks'],
  fin_receivables: ['finance', 'receivables'],
  fin_payables: ['finance', 'payables'],
  fin_categories: ['finance', 'categories'],
  ment_sessions: ['mentoring', 'sessions'],
  ment_participants: ['mentoring', 'participants'],
  ment_pdi_plans: ['mentoring', 'pdiPlans'],
  ass_diagnosticos: ['assessoria', 'diagnosticos'],
  ass_okrs: ['assessoria', 'okrs'],
  ass_swot: ['assessoria', 'swots'],
  ass_planos_acao: ['assessoria', 'planos'],
  ass_kpis: ['assessoria', 'kpis'],
}

export function createRealtimeInvalidator(queryClient: any) {
  const supabase = getClient()
  if (!supabase) return () => {}

  const tables = Object.keys(TABLE_QUERY_KEYS) as TableName[]
  const channels: any[] = []

  for (const table of tables) {
    const key = TABLE_QUERY_KEYS[table]
    const channelName = `rt-${table}`

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table },
        (_payload: RealtimePostgresChangesPayload<Record<string, unknown>>) => {
          queryClient.invalidateQueries({ queryKey: key })
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] ${table} subscribed`)
        }
      })

    channels.push(channel)
  }

  return () => {
    for (const ch of channels) {
      supabase.removeChannel(ch)
    }
  }
}
