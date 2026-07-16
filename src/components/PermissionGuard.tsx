'use client'

import { usePathname } from 'next/navigation'
import { useAdmin, type ModuleName } from '@/app/(dashboard)/admin/context/AdminContext'
import { AlertTriangle, Loader2 } from 'lucide-react'

const ROUTE_MODULE_MAP: Record<string, ModuleName | null> = {
  '/crm': 'crm',
  '/clients': 'clients',
  '/projects': 'projects',
  '/tasks': 'tasks',
  '/alerts': 'alerts',
  '/assessoria': 'assessoria',
  '/trainings': 'trainings',
  '/mentoring': 'mentoring',
  '/financial': 'financial',
  '/calendar': 'calendar',
  '/documents': 'documents',
  '/bi': 'bi',
  '/ai': 'ai',
  '/admin': 'admin',
  '/import': 'import',
  '/nr01': 'nr01',
}

export function PermissionGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const admin = useAdmin()
  const moduleName = ROUTE_MODULE_MAP[pathname] ?? Object.entries(ROUTE_MODULE_MAP).find(([route]) => pathname.startsWith(route))?.[1]

  // Show loading spinner while admin context initializes (prevents false "Access Restricted")
  if (admin.loading) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-brand-teal animate-spin mx-auto mb-2" />
          <p className="text-sm text-slate-500">Carregando...</p>
        </div>
      </div>
    )
  }

  if (moduleName && !admin.checkPermission(moduleName, 'view')) {
    return (
      <div className="min-h-full flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-slate-800 mb-2">Acesso Restrito</h1>
          <p className="text-sm text-slate-500">
            Você não tem permissão para acessar este módulo.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
