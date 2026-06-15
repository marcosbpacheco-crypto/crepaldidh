import Link from "next/link"
import Image from "next/image"
import { 
  LayoutDashboard, 
  Users, 
  Briefcase, 
  ShieldAlert, 
  GraduationCap, 
  CircleDollarSign, 
  CalendarDays, 
  FileText,
  Settings,
  Brain,
  CheckSquare,
  Bell,
  Upload
} from "lucide-react"
import { LogoutButton } from "./LogoutButton"

const menuItems = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Gestão de Pessoas", href: "/crm", icon: Users },
  { name: "Clientes", href: "/clients", icon: Users },
  { name: "Projetos", href: "/projects", icon: Briefcase },
  { name: "Tarefas", href: "/tasks", icon: CheckSquare },
  { name: "Alertas", href: "/alerts", icon: Bell },
  { name: "Saúde Ocupacional", href: "/occupational", icon: ShieldAlert },
  { name: "Treinamentos", href: "/trainings", icon: GraduationCap },
  { name: "Mentorias & PDI", href: "/mentoring", icon: Brain },
  { name: "Financeiro", href: "/financial", icon: CircleDollarSign },
  { name: "Agenda", href: "/calendar", icon: CalendarDays },
  { name: "Documentos", href: "/documents", icon: FileText },
  { name: "Importação", href: "/import", icon: Upload },
]

export function Sidebar() {
  return (
    <aside className="w-64 bg-brand-blue text-slate-300 flex flex-col h-screen fixed top-0 left-0 shadow-2xl z-20">
      <div className="h-20 flex items-center justify-center px-4 relative overflow-hidden">
        {/* Subtle background glow for the logo area */}
        <div className="absolute inset-0 bg-brand-teal/10 blur-2xl rounded-full scale-150 transform -translate-y-1/2"></div>
        <Link href="/" className="relative z-10 flex items-center justify-center w-full h-full p-2 hover:scale-105 transition-transform duration-300">
          <Image 
            src="/logo-full.png" 
            alt="CrepaldiDH Logo" 
            width={240}
            height={80}
            className="object-contain"
            style={{ filter: 'brightness(0) invert(1)' }}
            priority
          />
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-3 custom-scrollbar">
        <ul className="space-y-0.5 px-4">
          {menuItems.map((item) => (
            <li key={item.name}>
              <Link 
                href={item.href}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-brand-blue-light hover:text-white hover:shadow-lg hover:shadow-black/10 transition-all duration-300 group relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-teal/0 to-brand-teal/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <item.icon className="w-5 h-5 text-brand-teal/70 group-hover:text-brand-teal transition-colors relative z-10" />
                <span className="text-sm font-medium relative z-10">{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      <div className="p-3 border-t border-white/10 space-y-0.5">
        <Link 
          href="/settings"
          className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-brand-blue-light hover:text-white transition-all duration-300"
        >
          <Settings className="w-5 h-5 text-slate-400" />
          <span className="text-sm font-medium">Configurações</span>
        </Link>
        <LogoutButton />
      </div>
    </aside>
  )
}
