import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { projectService } from '@/services/projectService'
import type { Project, ProjectTask } from '@/types/projects'

const P_KEY = ['projects']
const T_KEY = ['projects', 'tasks']

export function useProjectsQuery() { return useQuery({ queryKey: P_KEY, queryFn: () => projectService.list() }) }
export function useCreateProject() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Project>) => projectService.create(i), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }
export function useUpdateProject() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Project>) => projectService.update(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }
export function useDeleteProject() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => projectService.remove(id), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }

export function useProjectTasksQuery(projectId?: string) { return useQuery({ queryKey: [...T_KEY, projectId], queryFn: () => projectService.listTasks(projectId), enabled: projectId !== undefined }) }
export function useCreateProjectTask() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<ProjectTask>) => projectService.createTask(i), onSuccess: () => qc.invalidateQueries({ queryKey: T_KEY }) }) }
export function useUpdateProjectTask() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<ProjectTask>) => projectService.updateTask(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: T_KEY }) }) }
export function useDeleteProjectTask() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => projectService.removeTask(id), onSuccess: () => qc.invalidateQueries({ queryKey: T_KEY }) }) }
