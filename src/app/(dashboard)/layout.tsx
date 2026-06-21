import { Sidebar } from "@/components/layout/Sidebar"
import { Header } from "@/components/layout/Header"
import { DashboardProviders } from "./Providers"
import { PermissionGuard } from "@/components/PermissionGuard"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <DashboardProviders>
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
          <Header />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            <PermissionGuard>
              {children}
            </PermissionGuard>
          </main>
        </div>
      </DashboardProviders>
    </div>
  )
}
