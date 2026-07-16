'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { crmService } from '@/services/crmService'
import type { Company } from '@/types/crm'

const COMPANIES_KEY = ['crm', 'companies']

export function useCompanies() {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: COMPANIES_KEY,
    queryFn: () => crmService.listCompanies(),
    staleTime: 30_000,
    gcTime: 300_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: COMPANIES_KEY })

  const createMut = useMutation({
    mutationFn: (input: any) => crmService.createCompany(input),
    onSuccess: invalidate,
  })

  const updateMut = useMutation({
    mutationFn: ({ id, ...input }: { id: string } & any) => crmService.updateCompany(id, input),
    onSuccess: invalidate,
  })

  const removeMut = useMutation({
    mutationFn: (id: string) => crmService.removeCompany(id),
    onSuccess: invalidate,
  })

  return {
    companies: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refresh: invalidate,
    addCompany: (input: any) => createMut.mutateAsync(input),
    updateCompany: (id: string, input: any) => updateMut.mutateAsync({ id, ...input }),
    removeCompany: (id: string) => removeMut.mutateAsync(id),
  }
}