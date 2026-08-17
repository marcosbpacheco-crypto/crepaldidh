'use client'

import { useQuery } from '@tanstack/react-query'

export interface ServiceOption {
  id: string
  name: string
  description?: string
  category?: string
}

export function useServicesCatalog() {
  const query = useQuery({
    queryKey: ['services', 'catalog'],
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

  return {
    services: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    refresh: () => query.refetch(),
  }
}
