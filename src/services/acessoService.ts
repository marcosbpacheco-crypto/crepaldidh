import { getClient, handleError } from './base'

const ACCESSES_TABLE = 'acesso_accesses'
const USERS_TABLE = 'acesso_users'
const QUESTIONNAIRES_TABLE = 'acesso_questionnaires'
const RESPONSES_TABLE = 'acesso_responses'

export const acessoService = {
  async saveAll(data: {
    accesses?: any[]
    tempUsers?: any[]
    questionnaires?: any[]
    responses?: any[]
  }): Promise<void> {
    const supabase = getClient()
    const jobs: Promise<any>[] = []
    if (data.accesses?.length) jobs.push(Promise.resolve(supabase.from(ACCESSES_TABLE).upsert(data.accesses)))
    if (data.tempUsers?.length) jobs.push(Promise.resolve(supabase.from(USERS_TABLE).upsert(data.tempUsers)))
    if (data.questionnaires?.length) jobs.push(Promise.resolve(supabase.from(QUESTIONNAIRES_TABLE).upsert(data.questionnaires)))
    if (data.responses?.length) jobs.push(Promise.resolve(supabase.from(RESPONSES_TABLE).upsert(data.responses)))
    await Promise.allSettled(jobs)
  },

  async listAccesses(): Promise<any[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(ACCESSES_TABLE).select('*').order('created_at', { ascending: false })
    if (error) handleError(error, 'acessoService.listAccesses')
    return data || []
  },
  async listUsers(): Promise<any[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(USERS_TABLE).select('*')
    if (error) handleError(error, 'acessoService.listUsers')
    return data || []
  },
  async listQuestionnaires(): Promise<any[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(QUESTIONNAIRES_TABLE).select('*')
    if (error) handleError(error, 'acessoService.listQuestionnaires')
    return data || []
  },
  async listResponses(): Promise<any[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(RESPONSES_TABLE).select('*')
    if (error) handleError(error, 'acessoService.listResponses')
    return data || []
  },
}
