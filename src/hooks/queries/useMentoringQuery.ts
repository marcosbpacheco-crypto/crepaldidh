import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { mentoringService } from '@/services/mentoringService'
import type { Participant, MentoringSession, PDIPlan, Institution, Mentor } from '@/types/mentoring'

const INST_KEY = ['mentoring', 'institutions']
const MENT_KEY = ['mentoring', 'mentors']
const PART_KEY = ['mentoring', 'participants']
const SESS_KEY = ['mentoring', 'sessions']
const PDI_KEY = ['mentoring', 'pdiPlans']
const COMP_KEY = ['mentoring', 'competencies']
const TOOL_KEY = ['mentoring', 'tools']

export function useInstitutionsQuery() { return useQuery({ queryKey: INST_KEY, queryFn: () => mentoringService.listInstitutions() }) }
export function useMentorsQuery() { return useQuery({ queryKey: MENT_KEY, queryFn: () => mentoringService.listMentors() }) }
export function useParticipantsQuery() { return useQuery({ queryKey: PART_KEY, queryFn: () => mentoringService.listParticipants() }) }
export function useCreateParticipant() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<Participant>) => mentoringService.createParticipant(i), onSuccess: () => qc.invalidateQueries({ queryKey: PART_KEY }) }) }
export function useUpdateParticipant() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<Participant>) => mentoringService.updateParticipant(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: PART_KEY }) }) }
export function useDeleteParticipant() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => mentoringService.removeParticipant(id) }) }

export function useSessionsQuery(participantId?: string) { return useQuery({ queryKey: [...SESS_KEY, participantId], queryFn: () => mentoringService.listSessions(participantId), enabled: participantId !== undefined }) }
export function useCreateSession() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<MentoringSession>) => mentoringService.createSession(i), onSuccess: () => qc.invalidateQueries({ queryKey: SESS_KEY }) }) }
export function useUpdateSession() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<MentoringSession>) => mentoringService.updateSession(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: SESS_KEY }) }) }
export function useDeleteSession() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => mentoringService.removeSession(id) }) }

export function usePdiPlansQuery(participantId?: string) { return useQuery({ queryKey: [...PDI_KEY, participantId], queryFn: () => mentoringService.listPdiPlans(participantId), enabled: participantId !== undefined }) }
export function useCreatePdiPlan() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<PDIPlan>) => mentoringService.createPdiPlan(i), onSuccess: () => qc.invalidateQueries({ queryKey: PDI_KEY }) }) }
export function useUpdatePdiPlan() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<PDIPlan>) => mentoringService.updatePdiPlan(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: PDI_KEY }) }) }

export function useCompetenciesQuery() { return useQuery({ queryKey: COMP_KEY, queryFn: () => mentoringService.listCompetencies() }) }
export function useToolsQuery() { return useQuery({ queryKey: TOOL_KEY, queryFn: () => mentoringService.listTools() }) }
