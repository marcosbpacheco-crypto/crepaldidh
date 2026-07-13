import { getClient, handleError } from './base'
import type { Project, ProjectTask } from '@/types/projects'

const PROJECTS_TABLE = 'projects'
const TASKS_TABLE = 'project_tasks'

export const projectService = {
  async list(): Promise<Project[]> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PROJECTS_TABLE).select('*').is('deleted_at', null).order('name')
    if (error) handleError(error, 'projectService.list')
    return (data || []).map(mp)
  },
  async create(input: Partial<Project>): Promise<Project> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PROJECTS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'projectService.create')
    return mp(data!)
  },
  async update(id: string, input: Partial<Project>): Promise<Project> {
    const supabase = getClient()
    const { data, error } = await supabase.from(PROJECTS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'projectService.update')
    return mp(data!)
  },
  async remove(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(PROJECTS_TABLE).update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) handleError(error, 'projectService.remove')
  },
  async listTasks(projectId?: string): Promise<ProjectTask[]> {
    const supabase = getClient()
    let q = supabase.from(TASKS_TABLE).select('*').is('deleted_at', null)
    if (projectId) q = q.eq('project_id', projectId)
    const { data, error } = await q.order('created_at')
    if (error) handleError(error, 'projectService.listTasks')
    return (data || []).map(mt)
  },
  async createTask(input: Partial<ProjectTask>): Promise<ProjectTask> {
    const supabase = getClient()
    const { data, error } = await supabase.from(TASKS_TABLE).insert(input).select().single()
    if (error) handleError(error, 'projectService.createTask')
    return mt(data!)
  },
  async updateTask(id: string, input: Partial<ProjectTask>): Promise<ProjectTask> {
    const supabase = getClient()
    const { data, error } = await supabase.from(TASKS_TABLE).update(input).eq('id', id).select().single()
    if (error) handleError(error, 'projectService.updateTask')
    return mt(data!)
  },
  async removeTask(id: string): Promise<void> {
    const supabase = getClient()
    const { error } = await supabase.from(TASKS_TABLE).update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) handleError(error, 'projectService.removeTask')
  },
}

function mp(r: any): Project { return { ...r, companyId: r.company_id, tenantId: r.tenant_id, responsibleUserId: r.responsible_user_id, startDate: r.start_date, endDate: r.end_date, createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at, deletedAt: r.deleted_at } }
function mt(r: any): ProjectTask { return { ...r, projectId: r.project_id, tenantId: r.tenant_id, assignedTo: r.assigned_to, dueDate: r.due_date, createdBy: r.created_by, createdAt: r.created_at, updatedAt: r.updated_at, deletedAt: r.deleted_at } }
