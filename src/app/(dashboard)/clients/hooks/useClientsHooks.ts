'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { clientService } from '@/services/clientService'
import type { Client, ClientContact, ClientInteraction, ClientFeedbackRanking, ClientService, ContractType } from '@/types/clients'

const CLIENTS_KEY = ['clients']

export function useClients() {
  const qc = useQueryClient()

  const clientsQuery = useQuery({
    queryKey: CLIENTS_KEY,
    queryFn: () => clientService.list(),
  })
  const contactsQuery = useQuery({
    queryKey: [...CLIENTS_KEY, 'contacts'],
    queryFn: () => clientService.listAllContacts(),
  })
  const interactionsQuery = useQuery({
    queryKey: [...CLIENTS_KEY, 'interactions'],
    queryFn: () => clientService.listAllInteractions(),
  })
  const feedbacksQuery = useQuery({
    queryKey: [...CLIENTS_KEY, 'feedbacks'],
    queryFn: () => clientService.listAllFeedbacks(),
  })

  const clients = clientsQuery.data ?? []
  const contacts = contactsQuery.data ?? []
  const interactions = interactionsQuery.data ?? []
  const feedbacks = feedbacksQuery.data ?? []
  const documents: any[] = []
  const status = clientsQuery.isLoading ? 'loading' : clientsQuery.isError ? 'error' : 'success'
  const errorMessage = clientsQuery.error instanceof Error ? clientsQuery.error.message : null

  const clearError = () => {
    qc.resetQueries({ queryKey: CLIENTS_KEY })
  }

  const createClientMut = useMutation({
    mutationFn: (input: any) => clientService.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
  const updateClientMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & any) => clientService.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
  const deleteClientMut = useMutation({
    mutationFn: (id: string) => clientService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
  const hardDeleteClientMut = useMutation({
    mutationFn: (id: string) => clientService.hardDelete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
  const restoreClientMut = useMutation({
    mutationFn: (id: string) => clientService.restore(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
  const createContactMut = useMutation({
    mutationFn: (input: any) => clientService.createContact(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
  const createInteractionMut = useMutation({
    mutationFn: (input: any) => clientService.createInteraction(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })
  const createFeedbackMut = useMutation({
    mutationFn: (input: any) => clientService.createFeedback(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: CLIENTS_KEY }),
  })

  const addClient = async (c: any) => {
    const result = await createClientMut.mutateAsync(c)
    return result
  }
  const updateClient = async (id: string, input: Partial<Client>) => {
    await updateClientMut.mutateAsync({ id, ...input })
  }
  const deleteClient = async (id: string) => {
    await deleteClientMut.mutateAsync(id)
  }
  const hardDeleteClient = async (id: string) => {
    await hardDeleteClientMut.mutateAsync(id)
  }
  const restoreClient = async (id: string) => {
    await restoreClientMut.mutateAsync(id)
  }
  const addContact = async (c: any) => {
    await createContactMut.mutateAsync(c)
  }
  const addInteraction = async (i: any) => {
    await createInteractionMut.mutateAsync(i)
  }
  const addFeedback = async (f: any) => {
    await createFeedbackMut.mutateAsync(f)
  }

  return {
    clients,
    contacts,
    interactions,
    documents,
    feedbacks,
    status,
    errorMessage,
    clearError,
    addClient,
    updateClient,
    deleteClient,
    hardDeleteClient,
    restoreClient,
    addContact,
    addInteraction,
    addFeedback,
  }
}

export type { Client, ClientService, ContractType } from '@/types/clients'
