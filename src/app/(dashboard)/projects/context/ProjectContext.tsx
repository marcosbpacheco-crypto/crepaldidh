'use client'

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

export interface Project {
  id: string
  company_id: string
  tenant_id?: string
  name: string
  description?: string
  status: string
  responsible_user_id?: string
  start_date?: string
  end_date?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string
}

export interface ProjectTask {
  id: string
  project_id: string
  tenant_id?: string
  title: string
  description?: string
  status: string
  priority: string
  assigned_to?: string
  due_date?: string
  created_by?: string
  created_at?: string
  updated_at?: string
  deleted_at?: string
}

interface ProjectContextType {
  projects: Project[]
  tasks: ProjectTask[]
  loading: boolean
  createProject: (data: Partial<Project>) => Promise<void>
  updateProject: (id: string, data: Partial<Project>) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  createTask: (data: Partial<ProjectTask>) => Promise<void>
  updateTask: (id: string, data: Partial<ProjectTask>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  getTasksByProject: (projectId: string) => ProjectTask[]
}

const ProjectContext = createContext<ProjectContextType>({} as ProjectContextType)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<ProjectTask[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = useRef(createClient())
  const syncTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

  const load = useCallback(async () => {
    try {
      const [pRes, tRes] = await Promise.all([
        supabase.current.from('projects').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
        supabase.current.from('project_tasks').select('*').is('deleted_at', null).order('created_at', { ascending: false }),
      ])
      if (!pRes.error) setProjects(pRes.data || [])
      if (!tRes.error) setTasks(tRes.data || [])
    } catch {
      const cached = localStorage.getItem('erp_projects')
      if (cached) setProjects(JSON.parse(cached))
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const pSub = supabase.current
      .channel('projects-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'projects' }, load)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'project_tasks' }, load)
      .subscribe()
    return () => { pSub.unsubscribe() }
  }, [load])

  useEffect(() => {
    clearTimeout(syncTimer.current)
    syncTimer.current = setTimeout(() => {
      try { localStorage.setItem('erp_projects', JSON.stringify(projects)) } catch {}
    }, 500)
  }, [projects])

  const createProject = useCallback(async (data: Partial<Project>) => {
    const { error } = await supabase.current.from('projects').insert({
      ...data,
    })
    if (error) throw error
    await load()
  }, [load])

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    const { error } = await supabase.current.from('projects').update(data).eq('id', id)
    if (error) throw error
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...data } as Project : p))
  }, [])

  const deleteProject = useCallback(async (id: string) => {
    const { error } = await supabase.current.from('projects').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    setProjects(prev => prev.filter(p => p.id !== id))
  }, [])

  const createTask = useCallback(async (data: Partial<ProjectTask>) => {
    const { error } = await supabase.current.from('project_tasks').insert(data)
    if (error) throw error
    await load()
  }, [load])

  const updateTask = useCallback(async (id: string, data: Partial<ProjectTask>) => {
    const { error } = await supabase.current.from('project_tasks').update(data).eq('id', id)
    if (error) throw error
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...data } as ProjectTask : t))
  }, [])

  const deleteTask = useCallback(async (id: string) => {
    const { error } = await supabase.current.from('project_tasks').update({ deleted_at: new Date().toISOString() }).eq('id', id)
    if (error) throw error
    setTasks(prev => prev.filter(t => t.id !== id))
  }, [])

  const getTasksByProject = useCallback((projectId: string) => {
    return tasks.filter(t => t.project_id === projectId)
  }, [tasks])

  return (
    <ProjectContext.Provider value={{
      projects, tasks, loading,
      createProject, updateProject, deleteProject,
      createTask, updateTask, deleteTask, getTasksByProject,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectContext)
