'use client'

import { DashboardProviders } from '@/app/(dashboard)/Providers'
import { PortalProvider, usePortal } from './context/PortalContext'
import { usePathname, redirect } from 'next/navigation'

function PortalAuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = usePortal()
  const pathname = usePathname()

  if (isLoading) return null

  const isLogin = pathname === '/portal'

  if (!user && !isLogin) { redirect('/portal') }
  if (user && isLogin) { redirect('/portal/dashboard') }

  return <>{children}</>
}

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProviders>
      <PortalProvider>
        <PortalAuthGuard>
          {children}
        </PortalAuthGuard>
      </PortalProvider>
    </DashboardProviders>
  )
}
