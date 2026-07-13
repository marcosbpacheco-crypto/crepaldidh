import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '@/services/clientService'
import type { Client, ClientContact, ClientInteraction, ClientFeedbackRanking } from '@/types/clients'

const BASE_KEY = ['clients']

export function useClientsQuery() {
  return useQuery({
    queryKey: BASE_KEY,
    queryFn: () => clientService.list(),
  })
}
export function useClientQuery(id: string) {
  return useQuery({
    queryKey: [...BASE_KEY, id],
    queryFn: () => clientService.getById(id),
    enabled: !!id,
  })
}

export function useCreateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, any>) => clientService.create(input as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}
export function useUpdateClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, any>) => clientService.update(id, input as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}
export function useDeleteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}

// Contacts
export function useContactsQuery(clientId: string) {
  return useQuery({
    queryKey: [...BASE_KEY, clientId, 'contacts'],
    queryFn: () => clientService.listContacts(clientId),
    enabled: !!clientId,
  })
}
export function useCreateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, any>) => clientService.createContact(input as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}
export function useUpdateContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Record<string, any>) => clientService.updateContact(id, input as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}
export function useDeleteContact() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => clientService.deleteContact(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}

// Interactions
export function useInteractionsQuery(clientId: string) {
  return useQuery({
    queryKey: [...BASE_KEY, clientId, 'interactions'],
    queryFn: () => clientService.listInteractions(clientId),
    enabled: !!clientId,
  })
}
export function useCreateInteraction() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, any>) => clientService.createInteraction(input as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}

// Feedbacks
export function useFeedbacksQuery(clientId: string) {
  return useQuery({
    queryKey: [...BASE_KEY, clientId, 'feedbacks'],
    queryFn: () => clientService.listFeedbacks(clientId),
    enabled: !!clientId,
  })
}
export function useCreateFeedback() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: Record<string, any>) => clientService.createFeedback(input as any),
    onSuccess: () => qc.invalidateQueries({ queryKey: BASE_KEY }),
  })
}
