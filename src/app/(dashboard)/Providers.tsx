'use client'

import { SupabaseProvider } from './crm/context/SupabaseProvider'
import { CrmProvider } from './crm/context/CrmContext'
import { TrainingsProvider } from './trainings/context/TrainingsContext'
import { FinancialProvider } from './financial/context/FinancialContext'
import { FinancialIntegrationBridge } from './financial/context/FinancialIntegration'
import { CalendarProvider } from './calendar/context/CalendarContext'
import { DocumentProvider } from './documents/context/DocumentContext'
import { MentoringProvider } from './mentoring/context/MentoringContext'
import { BiProvider } from './bi/context/BiContext'
import { AiProvider } from './ai/context/AiContext'
import { AdminProvider } from './admin/context/AdminContext'
import { TenantProvider } from './admin/context/TenantContext'
import { ClientsProvider } from './clients/context/ClientsContext'

export function DashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <SupabaseProvider>
      <CrmProvider>
        <TrainingsProvider>
        <FinancialProvider>
          <FinancialIntegrationBridge />
          <CalendarProvider>
            <DocumentProvider>
              <MentoringProvider>
                <BiProvider>
                  <AiProvider>
                    <AdminProvider>
                      <TenantProvider>
                        <ClientsProvider>
                          {children}
                        </ClientsProvider>
                      </TenantProvider>
                    </AdminProvider>
                  </AiProvider>
                </BiProvider>
              </MentoringProvider>
            </DocumentProvider>
          </CalendarProvider>
        </FinancialProvider>
        </TrainingsProvider>
      </CrmProvider>
    </SupabaseProvider>
  )
}
