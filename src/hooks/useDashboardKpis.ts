'use client'

import { useQuery } from '@tanstack/react-query'

interface DashboardKpis {
  activeCompanies: number
  activeClients: number
  completedTrainings: number
  totalReceived: number
  totalRevenue: number
  totalPaidPayable: number
  estimatedTaxes: number
  companyCount: number
  activeProjects: number
}

interface MonthlyBilling {
  month: string
  total: number
}

interface DashboardResponse {
  kpis: DashboardKpis
  monthlyBilling: MonthlyBilling[]
  timingMs: number
}

export function useDashboardKpis() {
  return useQuery<DashboardResponse>({
    queryKey: ['dashboard', 'kpis'],
    queryFn: async () => {
      const res = await fetch('/api/prisma/dashboard')
      if (!res.ok) throw new Error(`Dashboard KPIs: HTTP ${res.status}`)
      const data: DashboardResponse = await res.json()
      if (data.timingMs > 500) {
        console.warn(`[Dashboard] KPI query took ${data.timingMs}ms`)
      }
      return data
    },
    staleTime: 15_000,
    gcTime: 60_000,
    refetchOnWindowFocus: false,
    retry: 1,
  })
}