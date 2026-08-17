'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

export interface ServiceOption {
  id: string
  name: string
  description?: string
  category?: string
}

export function useServicesCatalog() {
  const qc = useQueryClient()
  const key = ['services', 'catalog']

  const query = useQuery({
    queryKey: key,
    queryFn: async (): Promise<ServiceOption[]> => {
      const res = await fetch('/api/services', { cache: 'no-store' })
      if (!res.ok) return []
      const data = await res.json()
      return data.services || []
    },
    staleTime: 60_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const createMut = useMutation({
    mutationFn: async (input: { name: string; category?: string; description?: string }): Promise<ServiceOption> => {
      const res = await fetch('/api/services', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Erro ao criar serviço')
      }
      const data = await res.json()
      return data.service
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: key }),
  })

  return {
    services: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: () => query.refetch(),
    createService: (input: { name: string; category?: string; description?: string }) => createMut.mutateAsync(input),
  }
}
