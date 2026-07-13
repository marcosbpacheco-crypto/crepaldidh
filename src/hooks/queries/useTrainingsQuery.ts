import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { trainingService } from '@/services/trainingService'
import type { TrainingEvent, TrainingParticipant, TrainingCertificate, TrainingFeedback, TrainingMaterial, SipatProgram } from '@/types/trainings'

const E_KEY = ['trainings', 'events']
const P_KEY = ['trainings', 'participants']
const C_KEY = ['trainings', 'certificates']
const F_KEY = ['trainings', 'feedbacks']
const M_KEY = ['trainings', 'materials']
const S_KEY = ['trainings', 'sipats']

export function useTrainingEventsQuery() { return useQuery({ queryKey: E_KEY, queryFn: () => trainingService.listEvents() }) }
export function useCreateTrainingEvent() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<TrainingEvent>) => trainingService.createEvent(i), onSuccess: () => qc.invalidateQueries({ queryKey: E_KEY }) }) }
export function useUpdateTrainingEvent() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<TrainingEvent>) => trainingService.updateEvent(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: E_KEY }) }) }
export function useDeleteTrainingEvent() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => trainingService.removeEvent(id), onSuccess: () => qc.invalidateQueries({ queryKey: E_KEY }) }) }

export function useTrainingParticipantsQuery(eventId: string) { return useQuery({ queryKey: [...P_KEY, eventId], queryFn: () => trainingService.listParticipants(eventId), enabled: !!eventId }) }
export function useCreateTrainingParticipant() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<TrainingParticipant>) => trainingService.createParticipant(i), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }
export function useUpdateTrainingParticipant() { const qc = useQueryClient(); return useMutation({ mutationFn: ({ id, ...i }: { id: string } & Partial<TrainingParticipant>) => trainingService.updateParticipant(id, i), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }
export function useDeleteTrainingParticipant() { const qc = useQueryClient(); return useMutation({ mutationFn: (id: string) => trainingService.removeParticipant(id), onSuccess: () => qc.invalidateQueries({ queryKey: P_KEY }) }) }

export function useTrainingCertificatesQuery() { return useQuery({ queryKey: C_KEY, queryFn: () => trainingService.listCertificates() }) }
export function useCreateTrainingCertificate() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<TrainingCertificate>) => trainingService.createCertificate(i), onSuccess: () => qc.invalidateQueries({ queryKey: C_KEY }) }) }

export function useTrainingFeedbacksQuery(eventId: string) { return useQuery({ queryKey: [...F_KEY, eventId], queryFn: () => trainingService.listFeedbacks(eventId), enabled: !!eventId }) }
export function useCreateTrainingFeedback() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<TrainingFeedback>) => trainingService.createFeedback(i), onSuccess: () => qc.invalidateQueries({ queryKey: F_KEY }) }) }

export function useTrainingMaterialsQuery(eventId: string) { return useQuery({ queryKey: [...M_KEY, eventId], queryFn: () => trainingService.listMaterials(eventId), enabled: !!eventId }) }
export function useCreateTrainingMaterial() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<TrainingMaterial>) => trainingService.createMaterial(i), onSuccess: () => qc.invalidateQueries({ queryKey: M_KEY }) }) }

export function useSipatsQuery() { return useQuery({ queryKey: S_KEY, queryFn: () => trainingService.listSipats() }) }
export function useCreateSipat() { const qc = useQueryClient(); return useMutation({ mutationFn: (i: Partial<SipatProgram>) => trainingService.createSipat(i), onSuccess: () => qc.invalidateQueries({ queryKey: S_KEY }) }) }
