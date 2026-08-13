'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useMentoring } from '../../context/MentoringContext'
import Link from 'next/link'
import {
  ArrowLeft, User, Target, ListChecks, Calendar, Star,
  TrendingUp, FileText, History, Trash2
} from 'lucide-react'
import OverviewTab from './tabs/OverviewTab'
import MenteeTab from './tabs/MenteeTab'
import ObjectivesTab from './tabs/ObjectivesTab'
import ActionsTab from './tabs/ActionsTab'
import SessionsTab from './tabs/SessionsTab'
import FeedbacksTab from './tabs/FeedbacksTab'
import EvolutionTab from './tabs/EvolutionTab'
import DocumentsTab from './tabs/DocumentsTab'
import HistoryTab from './tabs/HistoryTab'

const TABS = [
  { key: 'overview', label: 'Visão Geral', icon: TrendingUp },
  { key: 'mentee', label: 'Mentorado', icon: User },
  { key: 'objectives', label: 'Objetivos', icon: Target },
  { key: 'actions', label: 'Ações', icon: ListChecks },
  { key: 'sessions', label: 'Sessões', icon: Calendar },
  { key: 'feedbacks', label: 'Feedbacks', icon: Star },
  { key: 'evolution', label: 'Evolução', icon: TrendingUp },
  { key: 'documents', label: 'Documentos', icon: FileText },
  { key: 'history', label: 'Histórico', icon: History },
] as const

type TabKey = typeof TABS[number]['key']

export default function IndividualMentoringWorkspace() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string
  const { programs, deleteProgram } = useMentoring()
  const [tab, setTab] = useState<TabKey>('overview')

  const program = programs.find(p => p.id === id)

  if (!program || program.modality !== 'individual') {
    return (
      <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-slate-100 p-6 text-center space-y-4">
        <User className="w-14 h-14 text-slate-200" />
        <h2 className="text-xl font-bold text-slate-800">Mentoria não encontrada</h2>
        <p className="text-slate-500 text-sm max-w-sm">O programa solicitado não existe ou foi removido.</p>
        <Link href="/mentoring/individual" className="px-5 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold shadow-md hover:bg-violet-700 transition-colors">
          Voltar para Mentorias Individuais
        </Link>
      </div>
    )
  }

  const handleDelete = async () => {
    if (!confirm(`Excluir a mentoria "${program.name}"? Esta ação não pode ser desfeita.`)) return
    await deleteProgram(id)
    router.push('/mentoring/individual')
  }

  const pObjectives = Array.isArray(program.objectives) ? program.objectives : []
  const done = pObjectives.filter(o => o.status === 'concluido').length
  const pct = pObjectives.length > 0 ? Math.round((done / pObjectives.length) * 100) : (program.progress || 0)

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div className="flex items-start gap-4">
          <Link href="/mentoring/individual" className="p-2 bg-white border border-slate-200 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors mt-1">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <User className="w-5 h-5 text-violet-600" />
              <span className="text-sm font-semibold text-violet-600 uppercase tracking-wider">Mentoria Individual</span>
            </div>
            <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{program.name}</h1>
            <p className="text-slate-500 text-sm mt-1">
              {program.menteeName ? `Mentorado: ${program.menteeName}` : 'Sem mentorado'}
              {program.mentor ? ` · Mentor: ${program.mentor}` : ''}
              {program.companyName ? ` · ${program.companyName}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-5 py-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-violet-100 flex items-center justify-center">
                <Target className="w-4 h-4 text-violet-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-slate-800 leading-none">{pct}%</p>
                <p className="text-[10px] font-semibold text-slate-400 mt-0.5">progresso</p>
              </div>
            </div>
          </div>
          <button
            onClick={handleDelete}
            className="p-2.5 bg-white border border-red-200 rounded-xl text-red-500 hover:bg-red-50 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto bg-white rounded-2xl shadow-sm border border-slate-100 p-1.5">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
              tab === t.key
                ? 'bg-violet-600 text-white shadow-sm'
                : 'text-slate-500 hover:bg-slate-50'
            }`}>
            <t.icon className="w-3.5 h-3.5" /> {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 'overview' && <OverviewTab program={program} />}
        {tab === 'mentee' && <MenteeTab program={program} />}
        {tab === 'objectives' && <ObjectivesTab program={program} />}
        {tab === 'actions' && <ActionsTab program={program} />}
        {tab === 'sessions' && <SessionsTab program={program} />}
        {tab === 'feedbacks' && <FeedbacksTab program={program} />}
        {tab === 'evolution' && <EvolutionTab program={program} />}
        {tab === 'documents' && <DocumentsTab program={program} />}
        {tab === 'history' && <HistoryTab program={program} />}
      </div>
    </div>
  )
}
