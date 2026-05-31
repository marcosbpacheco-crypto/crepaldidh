'use client'

import { useEffect, useRef } from 'react'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'
import { useFinancial } from '@/app/(dashboard)/financial/context/FinancialContext'

export interface IntegrationStatus {
  totalContracts: number
  contractsSynced: number
  contractsPending: number
  totalReceivablesFromContracts: number
  totalRecurringRules: number
  lastSync: string | null
}

/**
 * FinancialIntegrationBridge
 * Auto-syncs CRM contracts to financial receivables and recurring rules.
 * Mounted once in the Providers layer.
 */
export function FinancialIntegrationBridge() {
  const { contracts, companies } = useCrm()
  const fin = useFinancial()
  const syncedRef = useRef(false)

  useEffect(() => {
    if (syncedRef.current || typeof window === 'undefined') return
    const syncKey = 'fin_integration_last_sync'

    const sessionSync = sessionStorage.getItem('fin_integration_synced')
    if (sessionSync) { syncedRef.current = true; return }

    const activeContracts = contracts.filter(c => c.status === 'active')
    let newReceivablesCount = 0
    let newRulesCount = 0

    activeContracts.forEach(contract => {
      const company = companies.find(co => co.id === contract.companyId)
      const companyName = company?.name || company?.tradeName || 'Cliente'

      // Check if contract already has a receivable
      const existingRec = fin.receivables.some(r => r.contractId === contract.id)
      if (!existingRec) {
        // Generate a default receivable from the contract
        const dueDate = new Date()
        dueDate.setDate(dueDate.getDate() + 30)
        fin.createReceivableFromContract({
          companyId: contract.companyId,
          companyName,
          contractId: contract.id,
          contractName: contract.title,
          serviceName: 'Serviço Contratado',
          amount: contract.value,
          dueDate: dueDate.toISOString().split('T')[0],
        })
        newReceivablesCount++

        // Also create a recurring rule for multi-month contracts
        const existingRule = fin.recurringRules.some(r => r.contractId === contract.id)
        if (!existingRule) {
          fin.addRecurringRule({
            contractId: contract.id,
            contractName: contract.title,
            companyId: contract.companyId,
            companyName,
            frequency: 'monthly',
            amount: Math.round(contract.value / 12),
            nextBillingDate: dueDate.toISOString().split('T')[0],
            readjustmentRate: 0,
            status: 'active',
            serviceName: 'Serviço Contratado',
          })
          newRulesCount++
        }
      }
    })

    // Persist sync timestamp
    localStorage.setItem(syncKey, new Date().toISOString())
    sessionStorage.setItem('fin_integration_synced', 'true')
    syncedRef.current = true

    if (newReceivablesCount > 0 || newRulesCount > 0) {
      console.log(`FinancialIntegration: Synced ${newReceivablesCount} receivable(s) and ${newRulesCount} recurring rule(s) from CRM contracts.`)
    }
  }, [contracts, companies, fin])

  return null
}

/**
 * Hook to get integration status
 */
export function useIntegrationStatus(): IntegrationStatus {
  const { contracts } = useCrm()
  const fin = useFinancial()

  const contractIds = contracts.filter(c => c.status === 'active').map(c => c.id)
  const receivablesFromContracts = fin.receivables.filter(r => r.contractId && contractIds.includes(r.contractId))

  return {
    totalContracts: contractIds.length,
    contractsSynced: receivablesFromContracts.length,
    contractsPending: contractIds.length - receivablesFromContracts.length,
    totalReceivablesFromContracts: receivablesFromContracts.length,
    totalRecurringRules: fin.recurringRules.filter(r => r.status === 'active').length,
    lastSync: typeof window !== 'undefined' ? localStorage.getItem('fin_integration_last_sync') : null,
  }
}
