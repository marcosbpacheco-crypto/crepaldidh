'use client'

import { DashboardProviders } from '@/app/(dashboard)/Providers'
import { PortalProvider } from './context/PortalContext'
import { usePathname, redirect } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  if (!mounted) return null

  const isLogin = pathname === '/portal'
  const stored = typeof window !== 'undefined' ? localStorage.getItem('portal_user') : null

  if (!stored && !isLogin) { redirect('/portal') }
  if (stored && isLogin) { redirect('/portal/dashboard') }

  return (
    <DashboardProviders>
      <PortalProvider>
        {children}
      </PortalProvider>
    </DashboardProviders>
  )
}
