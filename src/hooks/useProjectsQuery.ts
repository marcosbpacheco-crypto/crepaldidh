'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import type { Project, ProjectTask } from '@/types/projects'

const PROJECTS_KEY = ['projects']

export function useProjects() {
  const qc = useQueryClient()

  const projectsQuery = useQuery({
    queryKey: PROJECTS_KEY,
    queryFn: () => projectService.list(),
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const tasksQuery = useQuery({
    queryKey: [...PROJECTS_KEY, 'tasks'],
    queryFn: () => projectService.listTasks(),
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: PROJECTS_KEY })

  const createProjectMut = useMutation({
    mutationFn: (input: any) => projectService.create(input),
    onSuccess: invalidate,
  })

  const updateProjectMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & any) => projectService.update(id, input),
    onSuccess: invalidate,
  })

  const deleteProjectMut = useMutation({
    mutationFn: (id: string) => projectService.remove(id),
    onSuccess: invalidate,
  })

  const createTaskMut = useMutation({
    mutationFn: (input: any) => projectService.createTask(input),
    onSuccess: invalidate,
  })

  const updateTaskMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & any) => projectService.updateTask(id, input),
    onSuccess: invalidate,
  })

  const deleteTaskMut = useMutation({
    mutationFn: (id: string) => projectService.removeTask(id),
    onSuccess: invalidate,
  })

  return {
    projects: projectsQuery.data ?? [],
    tasks: tasksQuery.data ?? [],
    isLoading: projectsQuery.isLoading,
    isError: projectsQuery.isError,
    error: projectsQuery.error,
    refresh: invalidate,
    createProject: (input: any) => createProjectMut.mutateAsync(input),
    updateProject: (id: string, input: any) => updateProjectMut.mutateAsync({ id, ...input }),
    deleteProject: (id: string) => deleteProjectMut.mutateAsync(id),
    createTask: (input: any) => createTaskMut.mutateAsync(input),
    updateTask: (id: string, input: any) => updateTaskMut.mutateAsync({ id, ...input }),
    deleteTask: (id: string) => deleteTaskMut.mutateAsync(id),
  }
}