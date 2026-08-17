'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { serviceService } from '@/services/serviceService'
import type { Service } from '@/types/services'

const SERVICES_KEY = ['services']

export function useServices() {
  const qc = useQueryClient()

  const servicesQuery = useQuery({
    queryKey: SERVICES_KEY,
    queryFn: () => serviceService.list(),
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: SERVICES_KEY })

  const createMut = useMutation({
    mutationFn: (input: Partial<Service>) => serviceService.create(input),
    onSuccess: invalidate,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & Partial<Service>) => serviceService.update(id, input),
    onSuccess: invalidate,
  })

  const deleteMut = useMutation({
    mutationFn: (id: string) => serviceService.remove(id),
    onSuccess: invalidate,
  })

  return {
    services: servicesQuery.data ?? [],
    isLoading: servicesQuery.isLoading,
    isError: servicesQuery.isError,
    error: servicesQuery.error,
    refresh: invalidate,
    createService: (input: Partial<Service>) => createMut.mutateAsync(input),
    updateService: (id: string, input: Partial<Service>) => updateMut.mutateAsync({ id, ...input }),
    deleteService: (id: string) => deleteMut.mutateAsync(id),
  }
}