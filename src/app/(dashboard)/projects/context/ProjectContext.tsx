'use client'

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { projectService } from '@/services/projectService'

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

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const [pList, tList] = await Promise.all([
        projectService.list(),
        projectService.listTasks(),
      ])
      setProjects(pList)
      setTasks(tList)
    } catch (err) {
      console.error('[ProjectContext] load error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const createProject = useCallback(async (data: Partial<Project>) => {
    try {
      await projectService.create(data)
      await load()
    } catch (err) {
      console.error('[ProjectContext] createProject error:', err)
    }
  }, [load])

  const updateProject = useCallback(async (id: string, data: Partial<Project>) => {
    try {
      await projectService.update(id, data)
      await load()
    } catch (err) {
      console.error('[ProjectContext] updateProject error:', err)
    }
  }, [load])

  const deleteProject = useCallback(async (id: string) => {
    try {
      await projectService.remove(id)
      await load()
    } catch (err) {
      console.error('[ProjectContext] deleteProject error:', err)
    }
  }, [load])

  const createTask = useCallback(async (data: Partial<ProjectTask>) => {
    try {
      await projectService.createTask(data)
      await load()
    } catch (err) {
      console.error('[ProjectContext] createTask error:', err)
    }
  }, [load])

  const updateTask = useCallback(async (id: string, data: Partial<ProjectTask>) => {
    try {
      await projectService.updateTask(id, data)
      await load()
    } catch (err) {
      console.error('[ProjectContext] updateTask error:', err)
    }
  }, [load])

  const deleteTask = useCallback(async (id: string) => {
    try {
      await projectService.removeTask(id)
      await load()
    } catch (err) {
      console.error('[ProjectContext] deleteTask error:', err)
    }
  }, [load])

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
