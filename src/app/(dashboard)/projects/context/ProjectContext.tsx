'use client'

import React, { createContext, useContext, useCallback } from 'react'
import { useProjects as useProjectsTQ } from '@/hooks/useProjectsQuery'

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
  createProject: (data: Partial<Project>) => Promise<Project>
  updateProject: (id: string, data: Partial<Project>) => Promise<Project>
  deleteProject: (id: string) => Promise<void>
  createTask: (data: Partial<ProjectTask>) => Promise<ProjectTask>
  updateTask: (id: string, data: Partial<ProjectTask>) => Promise<ProjectTask>
  deleteTask: (id: string) => Promise<void>
  getTasksByProject: (projectId: string) => ProjectTask[]
}

const ProjectContext = createContext<ProjectContextType>({} as ProjectContextType)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const tq = useProjectsTQ()

  const getTasksByProject = useCallback((projectId: string) => {
    return tq.tasks.filter(t => t.project_id === projectId)
  }, [tq.tasks])

  const deleteTask = useCallback(async (id: string) => {
    await tq.deleteTask(id)
  }, [tq])

  return (
    <ProjectContext.Provider value={{
      projects: tq.projects, tasks: tq.tasks, loading: tq.isLoading,
      createProject: tq.createProject,
      updateProject: tq.updateProject,
      deleteProject: tq.deleteProject,
      createTask: tq.createTask,
      updateTask: tq.updateTask,
      deleteTask,
      getTasksByProject,
    }}>
      {children}
    </ProjectContext.Provider>
  )
}

export const useProjects = () => useContext(ProjectContext)