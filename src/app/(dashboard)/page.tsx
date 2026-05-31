import { Users, Briefcase, GraduationCap, TrendingUp, Calendar, ChevronRight } from "lucide-react"

export default function DashboardPage() {
  const stats = [
    { label: "Total de Clientes", value: "148", icon: Users, color: "bg-blue-500", trend: "+12% esse mês" },
    { label: "Projetos Ativos", value: "32", icon: Briefcase, color: "bg-brand-teal", trend: "+4% esse mês" },
    { label: "Treinamentos Realizados", value: "86", icon: GraduationCap, color: "bg-indigo-500", trend: "+22% esse ano" },
    { label: "Receita Mensal", value: "R$ 45.200", icon: TrendingUp, color: "bg-emerald-500", trend: "+8% esse mês" },
  ];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Bem-vindo de volta, Marcos. Aqui está o resumo de hoje.</p>
        </div>
        <div className="flex gap-3">
          <button className="px-5 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-full hover:bg-slate-50 font-semibold transition-all duration-300 shadow-sm">
            Baixar Relatório
          </button>
          <button className="px-5 py-2.5 bg-brand-teal text-white rounded-full hover:bg-brand-teal/90 shadow-md shadow-brand-teal/25 font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg">
            Novo Projeto
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${stat.color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">
                {stat.trend}
              </span>
            </div>
            <div className="relative z-10">
              <h3 className="text-slate-500 text-sm font-medium">{stat.label}</h3>
              <p className="text-3xl font-bold text-slate-800 mt-1">{stat.value}</p>
            </div>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.color} opacity-5 group-hover:scale-150 transition-transform duration-500`}></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800">Projetos Recentes</h2>
            <button className="text-brand-teal text-sm font-medium hover:underline flex items-center">
              Ver todos <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 hover:bg-slate-50 hover:border-slate-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-brand-blue-light/10 text-brand-blue flex items-center justify-center font-bold">
                    P{i}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">Consultoria em Gestão - Cliente {i}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">Atualizado há 2 horas</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-24 bg-slate-100 rounded-full h-2">
                    <div className="bg-brand-teal h-2 rounded-full" style={{ width: `${Math.random() * 60 + 30}%` }}></div>
                  </div>
                  <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-1 rounded-md">Em andamento</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-brand-blue rounded-2xl shadow-md p-6 relative overflow-hidden text-white">
          <div className="absolute top-0 right-0 w-64 h-64 bg-brand-teal/20 blur-3xl rounded-full translate-x-1/3 -translate-y-1/3 pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/20 blur-2xl rounded-full -translate-x-1/4 translate-y-1/4 pointer-events-none"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold">Agenda de Hoje</h2>
              <Calendar className="w-5 h-5 text-brand-teal" />
            </div>
            
            <div className="space-y-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-teal mt-1.5"></div>
                  <div>
                    <h4 className="text-sm font-semibold">Reunião de Alinhamento - NR01</h4>
                    <p className="text-xs text-slate-300 mt-1">10:00 - 11:30 • Videochamada</p>
                  </div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/10">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-400 mt-1.5"></div>
                  <div>
                    <h4 className="text-sm font-semibold">Mentoria de Liderança</h4>
                    <p className="text-xs text-slate-300 mt-1">14:00 - 15:00 • Presencial</p>
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full mt-6 py-3 bg-brand-teal hover:bg-brand-teal/90 text-white rounded-full text-sm font-bold transition-all duration-300 shadow-md shadow-black/10 hover:-translate-y-0.5">
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
