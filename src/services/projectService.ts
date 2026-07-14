import type { Project, ProjectTask } from '@/types/projects'

const BASE = '/api/prisma/projects'

async function api(url: string, opts?: RequestInit) {
  const res = await fetch(url, opts)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`)
  return data
}

export const projectService = {
  async list(): Promise<Project[]> {
    const data = await api(BASE)
    return (data.projects || []).map(mp)
  },

  async create(input: Partial<Project>): Promise<Project> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'project', ...input }),
    })
    return mp(data.project)
  },

  async update(id: string, input: Partial<Project>): Promise<Project> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...input }),
    })
    return mp(data.project)
  },

  async remove(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
  },

  async listTasks(projectId?: string): Promise<ProjectTask[]> {
    const data = await api(BASE)
    const all = (data.tasks || []).map(mt)
    return projectId ? all.filter((t: ProjectTask) => t.project_id === projectId) : all
  },

  async createTask(input: Partial<ProjectTask>): Promise<ProjectTask> {
    const data = await api(BASE, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'task', ...input }),
    })
    return mt(data.task)
  },

  async updateTask(id: string, input: Partial<ProjectTask>): Promise<ProjectTask> {
    const data = await api(BASE, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'task', id, ...input }),
    })
    return mt(data.task)
  },

  async removeTask(id: string): Promise<void> {
    await api(BASE, {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ _type: 'task', id }),
    })
  },
}

function mp(r: any): Project {
  return { ...r, company_id: r.company_id, tenant_id: r.tenant_id, responsible_user_id: r.responsible_user_id, start_date: r.start_date, end_date: r.end_date, created_by: r.created_by, created_at: r.created_at, updated_at: r.updated_at, deleted_at: r.deleted_at }
}

function mt(r: any): ProjectTask {
  return { ...r, project_id: r.project_id, tenant_id: r.tenant_id, assigned_to: r.assigned_to, due_date: r.due_date, created_by: r.created_by, created_at: r.created_at, updated_at: r.updated_at, deleted_at: r.deleted_at }
}
