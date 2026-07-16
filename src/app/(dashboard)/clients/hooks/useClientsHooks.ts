'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '@/services/clientService'
import type { Client, ClientContact, ClientInteraction, ClientFeedbackRanking } from '@/types/clients'

const CLIENTS_KEY = ['clients']

const QUERY_OPTIONS = {
  staleTime: 30_000,
  gcTime: 300_000,
  refetchOnWindowFocus: false,
  retry: 1,
}

export function useClients() {
  const qc = useQueryClient()

  const clientsQuery = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: () => clientService.list(),
    ...QUERY_OPTIONS,
  })
  const contactsQuery = useQuery({
    queryKey: [...CLIENTS_KEY, 'contacts'],
    queryFn: () => clientService.listAllContacts(),
    ...QUERY_OPTIONS,
  })
  const interactionsQuery = useQuery({
    queryKey: [...CLIENTS_KEY, 'interactions'],
    queryFn: () => clientService.listAllInteractions(),
    ...QUERY_OPTIONS,
  })
  const feedbacksQuery = useQuery({
    queryKey: [...CLIENTS_KEY, 'feedbacks'],
    queryFn: () => clientService.listAllFeedbacks(),
    ...QUERY_OPTIONS,
  })

  const clients = clientsQuery.data ?? []
  const contacts = contactsQuery.data ?? []
  const interactions = interactionsQuery.data ?? []
  const feedbacks = feedbacksQuery.data ?? []
  const documents: any[] = []
  const status = clientsQuery.isLoading ? 'loading' : clientsQuery.isError ? 'error' : 'success'
  const errorMessage = clientsQuery.error instanceof Error ? clientsQuery.error.message : null

  const clearError = () => qc.resetQueries({ queryKey: CLIENTS_KEY })

  const invalidate = () => qc.invalidateQueries({ queryKey: CLIENTS_KEY })

  const createClientMut = useMutation({
    mutationFn: (input: any) => clientService.create(input),
    onSuccess: invalidate,
  })
  const updateClientMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & any) => clientService.update(id, input),
    onSuccess: invalidate,
  })
  const deleteClientMut = useMutation({
    mutationFn: (id: string) => clientService.remove(id),
    onSuccess: invalidate,
  })
  const restoreClientMut = useMutation({
    mutationFn: (id: string) => clientService.restore(id),
    onSuccess: invalidate,
  })
  const hardDeleteClientMut = useMutation({
    mutationFn: (id: string) => clientService.hardDelete(id),
    onSuccess: invalidate,
  })
  const createContactMut = useMutation({
    mutationFn: (input: any) => clientService.createContact(input),
    onSuccess: invalidate,
  })
  const updateContactMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & any) => clientService.updateContact(id, input),
    onSuccess: invalidate,
  })
  const deleteContactMut = useMutation({
    mutationFn: (id: string) => clientService.deleteContact(id),
    onSuccess: invalidate,
  })
  const createInteractionMut = useMutation({
    mutationFn: (input: any) => clientService.createInteraction(input),
    onSuccess: invalidate,
  })
  const createFeedbackMut = useMutation({
    mutationFn: (input: any) => clientService.createFeedback(input),
    onSuccess: invalidate,
  })

  const addClient = async (c: any): Promise<Client> => createClientMut.mutateAsync(c)
  const updateClient = async (id: string, input: Partial<Client>) => updateClientMut.mutateAsync({ id, ...input })
  const deleteClient = async (id: string) => deleteClientMut.mutateAsync(id)
  const hardDeleteClient = async (id: string) => hardDeleteClientMut.mutateAsync(id)
  const restoreClient = async (id: string) => restoreClientMut.mutateAsync(id)
  const refreshClients = async () => { await invalidate() }
  const addContact = async (c: any) => createContactMut.mutateAsync(c)
  const updateContact = async (id: string, input: Partial<ClientContact>) => updateContactMut.mutateAsync({ id, ...input })
  const deleteContact = async (id: string) => deleteContactMut.mutateAsync(id)
  const addInteraction = async (i: any) => createInteractionMut.mutateAsync(i)
  const addFeedback = async (f: any) => createFeedbackMut.mutateAsync(f)

  return {
    clients, contacts, interactions, documents, feedbacks,
    status, errorMessage, clearError,
    addClient, updateClient, deleteClient, hardDeleteClient, restoreClient, refreshClients,
    addContact, updateContact, deleteContact,
    addInteraction, addFeedback,
  }
}

export type { Client, ClientService, ContractType } from '@/types/clients'
