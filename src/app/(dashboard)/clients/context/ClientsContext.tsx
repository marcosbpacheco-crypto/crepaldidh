'use client'

import React, { createContext, useContext, useEffect } from 'react'
import { useSupabase } from '../../crm/context/SupabaseProvider'
import { useClients as useClientsHook } from '../hooks/useClientsHooks'
import { useQueryClient } from '@tanstack/react-query'

export type { ClientStatus, InteractionType, ServiceStatusType, ContractType } from '@/types/clients'
export type { Client, ClientContact, ClientInteraction, ClientDocument, ClientFeedbackRanking } from '@/types/clients'

type ClientsContextType = ReturnType<typeof useClientsHook>

const ClientsContext = createContext<ClientsContextType | undefined>(undefined)

export const ClientsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { supabase } = useSupabase()
  const qc = useQueryClient()
  const hook = useClientsHook()

  useEffect(() => {
    if (!supabase) return

    function getOrCreateChannel(name: string) {
      const existing = supabase.getChannels().find((c: any) => c.topic === `realtime:${name}`)
      if (existing) supabase.removeChannel(existing)
      return supabase.channel(name)
    }

    const tables = ['client_list', 'client_contacts', 'client_interactions', 'client_documents', 'client_feedbacks']
    const channels = tables.map(table => {
      const name = `${table}-changes`
      return getOrCreateChannel(name)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => {
          qc.invalidateQueries({ queryKey: ['clients'] })
        })
        .subscribe()
    })

    return () => {
      channels.forEach(ch => { try { supabase.removeChannel(ch) } catch {} })
    }
  }, [supabase, qc])

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
