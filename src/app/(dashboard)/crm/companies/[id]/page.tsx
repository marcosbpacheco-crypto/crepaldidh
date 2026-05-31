'use client'

import { useCrm } from '../../context/CrmContext'
import { useTrainings } from '../../../trainings/context/TrainingsContext'
import { useParams, useRouter } from 'next/navigation'
import { Building2, ArrowLeft, Calendar, FileText, Activity } from 'lucide-react'
import Link from 'next/link'

export default function CompanyProfilePage() {
  const params = useParams()
  const router = useRouter()
  const { companies } = useCrm()
  const { events, sipatPrograms } = useTrainings()

  const company = companies.find(c => c.id === params.id)
  
  if (!company) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-500 mb-4">Empresa não encontrada.</p>
        <button onClick={() => router.push('/crm/companies')} className="text-brand-blue font-semibold hover:underline">Voltar para lista</button>
      </div>
    )
  }

  const companyEvents = events.filter(e => e.companyId === company.id)
  const companySipats = sipatPrograms.filter(s => s.companyId === company.id)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      
      {/* Header */}
      <div className="flex items-center gap-4">
        <button onClick={() => router.push('/crm/companies')} className="p-2 bg-white rounded-full shadow-sm hover:bg-slate-50 transition">
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-brand-blue flex items-center gap-2">
            <Building2 className="w-6 h-6" /> {company.name}
          </h1>
          <p className="text-slate-500 text-sm">Perfil da Empresa</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Info lateral */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-5">
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-3">Dados Principais</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs">Nome Fantasia</p>
                <p className="font-medium text-slate-700">{company.tradeName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">CNPJ</p>
                <p className="font-medium text-slate-700">{company.cnpj}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Segmento</p>
                <p className="font-medium text-slate-700">{company.segment}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Localidade</p>
                <p className="font-medium text-slate-700">{company.city} - {company.state}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs">Status</p>
                <span className={`px-2 py-0.5 rounded text-xs font-semibold ${company.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {company.status.toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Abas e Listagem */}
        <div className="md:col-span-2 space-y-6">
          
          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-500" /> Eventos & Treinamentos
            </h2>
            
            <div className="space-y-3">
              {companyEvents.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Nenhum treinamento vinculado a este cliente.</p>
              ) : (
                companyEvents.map(evt => (
                  <Link href="/trainings/events" key={evt.id} className="block p-4 border border-slate-100 rounded-lg hover:border-violet-200 transition bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded uppercase">{evt.type}</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{evt.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">🗓 {new Date(evt.eventDate).toLocaleDateString('pt-BR')} | 👨‍🏫 {evt.facilitator}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 capitalize">{evt.status}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6">
            <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-500" /> SIPATs
            </h2>
            
            <div className="space-y-3">
              {companySipats.length === 0 ? (
                <p className="text-sm text-slate-400 py-4 text-center">Nenhuma SIPAT vinculada a este cliente.</p>
              ) : (
                companySipats.map(sipat => (
                  <Link href="/trainings/sipat" key={sipat.id} className="block p-4 border border-slate-100 rounded-lg hover:border-indigo-200 transition bg-slate-50/50">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded uppercase">SEMANA SIPAT</span>
                        <h4 className="font-bold text-slate-800 text-sm mt-1">{sipat.title}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">🗓 {new Date(sipat.startDate).toLocaleDateString('pt-BR')} a {new Date(sipat.endDate).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <span className="text-xs font-semibold text-slate-400 capitalize">{sipat.status}</span>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
