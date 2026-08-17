'use client'

import React, { createContext, useContext } from 'react'
import { useServices as useServicesTQ } from '@/hooks/useServicesQuery'
import type { Service } from '@/types/services'

interface ServicesContextType {
  services: Service[]
  loading: boolean
  createService: (input: Partial<Service>) => Promise<Service>
  updateService: (id: string, input: Partial<Service>) => Promise<Service>
  deleteService: (id: string) => Promise<void>
}

const ServicesContext = createContext<ServicesContextType>({} as ServicesContextType)

export function ServicesProvider({ children }: { children: React.ReactNode }) {
  const tq = useServicesTQ()

  return (
    <ServicesContext.Provider
      value={{
        services: tq.services,
        loading: tq.isLoading,
        createService: tq.createService,
        updateService: tq.updateService,
        deleteService: tq.deleteService,
      }}
    >
      {children}
    </ServicesContext.Provider>
  )
}

export const useServices = () => useContext(ServicesContext)