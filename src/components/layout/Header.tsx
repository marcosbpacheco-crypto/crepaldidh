import { Bell, Search, User, Menu } from "lucide-react"

export function Header() {
  return (
    <header className="h-20 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-10 shadow-sm">
      <div className="flex items-center gap-4 w-full max-w-md">
        <button className="md:hidden p-2 text-slate-500 hover:text-brand-blue">
          <Menu className="w-6 h-6" />
        </button>
        <div className="flex-1 flex items-center bg-slate-100/80 rounded-full px-4 py-2.5 border border-slate-200 focus-within:border-brand-teal focus-within:ring-2 focus-within:ring-brand-teal/20 transition-all">
          <Search className="w-4 h-4 text-slate-400 mr-3" />
          <input 
            type="text" 
            placeholder="Buscar no sistema..." 
            className="bg-transparent border-none outline-none text-sm w-full text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>
      
      <div className="flex items-center gap-6">
        <button className="relative p-2 text-slate-400 hover:text-brand-teal transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-brand-teal rounded-full border-2 border-white"></span>
        </button>
        
        <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>
        
        <button className="flex items-center gap-3 hover:bg-slate-50 p-2 rounded-full pr-4 transition-all border border-transparent hover:border-slate-200">
          <div className="w-10 h-10 bg-brand-blue-light/10 text-brand-blue rounded-full flex items-center justify-center font-bold text-sm">
            <User className="w-5 h-5" />
          </div>
          <div className="flex flex-col items-start text-left hidden sm:flex">
            <span className="text-sm font-semibold text-slate-800 leading-none mb-1">Marcos Pacheco</span>
            <span className="text-xs text-brand-teal font-medium uppercase tracking-wider">Administrador</span>
          </div>
        </button>
      </div>
    </header>
  )
}
