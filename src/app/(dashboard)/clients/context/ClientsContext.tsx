'use client'

import React, { createContext, useContext } from 'react'
import { useClients as useClientsHook } from '../hooks/useClientsHooks'

export type { ClientStatus, InteractionType, ServiceStatusType, ContractType } from '@/types/clients'
export type { Client, ClientContact, ClientInteraction, ClientDocument, ClientFeedbackRanking } from '@/types/clients'

type ClientsContextType = ReturnType<typeof useClientsHook>

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const hook = useClientsHook()

  return (
    <ClientsContext.Provider value={hook}>
      {children}
    </ClientsContext.Provider>
  )
}

export const useClients = () => {
  const ctx = useContext(ClientsContext)
  if (!ctx) throw new Error('useClients must be used within ClientsProvider')
  return ctx
}
