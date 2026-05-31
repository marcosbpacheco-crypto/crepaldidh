'use client'

import { useState } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import { Sparkles, Send, Loader2, Copy, RefreshCw, ChevronDown } from 'lucide-react'

type AIAction =
  | 'themes'
  | 'script'
  | 'email'
  | 'summary'

const ACTIONS = [
  {
    id: 'themes' as AIAction,
    label: 'Temas de Palestra',
    description: 'Gere sugestões de temas relevantes para o setor do cliente',
    icon: '💡',
    color: 'from-violet-500 to-purple-600'
  },
  {
    id: 'script' as AIAction,
    label: 'Roteiro de Palestra',
    description: 'Crie um roteiro estruturado para facilitar o evento',
    icon: '📝',
    color: 'from-indigo-500 to-blue-600'
  },
  {
    id: 'email' as AIAction,
    label: 'E-mail de Convite',
    description: 'Redija um e-mail corporativo para convidar participantes',
    icon: '✉️',
    color: 'from-sky-500 to-cyan-600'
  },
  {
    id: 'summary' as AIAction,
    label: 'Resumo Executivo',
    description: 'Gere um resumo do evento para o time de DHO do cliente',
    icon: '📊',
    color: 'from-emerald-500 to-teal-600'
  },
]

export default function TrainingsAIPage() {
  const {
    events,
    generateAILecturesThemes,
    generateAILectureScript,
    generateAIEmailInvite,
    generateAIExecutiveSummary
  } = useTrainings()

  const [selectedAction, setSelectedAction] = useState<AIAction>('themes')
  const [loading, setLoading] = useState(false)
  const [output, setOutput] = useState<string | null>(null)

  // Form inputs per action
  const [inputs, setInputs] = useState({
    industry: 'Mineração e Siderurgia',
    theme: '',
    eventId: events[0]?.id || '',
    eventName: events[0]?.name || '',
    eventDate: events[0]?.eventDate || '',
    eventHour: events[0]?.startTime || '',
    eventLocation: events[0]?.location || ''
  })

  const handleRun = async () => {
    setLoading(true)
    setOutput(null)
    try {
      let result: string | string[] = ''

      if (selectedAction === 'themes') {
        const themes = await generateAILecturesThemes(inputs.industry)
        result = themes.map((t, i) => `${i + 1}. ${t}`).join('\n\n')
      } else if (selectedAction === 'script') {
        result = await generateAILectureScript(inputs.theme || 'Comunicação Assertiva')
      } else if (selectedAction === 'email') {
        const ev = events.find(e => e.id === inputs.eventId)
        result = await generateAIEmailInvite(
          ev?.name || inputs.eventName,
          ev?.eventDate || inputs.eventDate,
          ev?.startTime || inputs.eventHour,
          ev?.location || inputs.eventLocation
        )
      } else if (selectedAction === 'summary') {
        result = await generateAIExecutiveSummary(inputs.eventId)
      }

      setOutput(typeof result === 'string' ? result : (result as string[]).join('\n'))
    } finally {
      setLoading(false)
    }
  }

  const selectedActionData = ACTIONS.find(a => a.id === selectedAction)!

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* Page Header */}
      <div className="bg-gradient-to-r from-slate-900 to-violet-950 rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-violet-800/30 to-transparent" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 text-violet-300 text-xs font-bold uppercase tracking-widest mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Módulo de Inteligência Artificial
          </div>
          <h1 className="text-2xl font-black">Assistente de Treinamentos IA</h1>
          <p className="text-slate-400 text-sm mt-1 max-w-xl">
            Crie roteiros de palestras, e-mails de convite, sugestões de temas e resumos executivos com um clique
          </p>
        </div>
      </div>

      {/* Action Selector */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {ACTIONS.map(action => (
          <button
            key={action.id}
            onClick={() => { setSelectedAction(action.id); setOutput(null) }}
            className={`p-4 rounded-2xl border text-left transition-all hover:shadow-md ${
              selectedAction === action.id
                ? 'border-violet-500 ring-2 ring-violet-100 bg-white'
                : 'border-slate-100 bg-white hover:border-violet-200'
            }`}
          >
            <div className="text-2xl mb-2">{action.icon}</div>
            <p className="text-xs font-bold text-slate-800 leading-tight">{action.label}</p>
            <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">{action.description}</p>
          </button>
        ))}
      </div>

      {/* Main workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Input Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-white text-base bg-gradient-to-br ${selectedActionData.color}`}>
              {selectedActionData.icon}
            </div>
            <div>
              <h3 className="font-bold text-slate-800 text-sm">{selectedActionData.label}</h3>
              <p className="text-[10px] text-slate-400">{selectedActionData.description}</p>
            </div>
          </div>

          {/* Inputs per action */}
          {selectedAction === 'themes' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Setor / Segmento do Cliente</label>
                <input
                  value={inputs.industry}
                  onChange={e => setInputs({ ...inputs, industry: e.target.value })}
                  placeholder="Ex: Mineração, Tecnologia, Saúde, Varejo..."
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
              <p className="text-[10px] text-slate-400 bg-violet-50 border border-violet-100 rounded-xl p-3">
                💡 A IA irá sugerir 5 temas de palestras altamente relevantes para o segmento inserido, considerando tendências do mercado e cenário de Saúde Ocupacional & DHO.
              </p>
            </div>
          )}

          {selectedAction === 'script' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tema da Palestra</label>
                <input
                  value={inputs.theme}
                  onChange={e => setInputs({ ...inputs, theme: e.target.value })}
                  placeholder="Ex: Inteligência Emocional para Líderes em Alta Performance"
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-violet-300"
                />
              </div>
              <p className="text-[10px] text-slate-400 bg-indigo-50 border border-indigo-100 rounded-xl p-3">
                📝 A IA criará um roteiro completo com introdução, 3 pilares de conteúdo, dinâmica prática e encerramento com Q&A, estimando a duração de cada bloco.
              </p>
            </div>
          )}

          {(selectedAction === 'email' || selectedAction === 'summary') && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Selecione o Evento</label>
                <select
                  value={inputs.eventId}
                  onChange={e => {
                    const ev = events.find(ev => ev.id === e.target.value)
                    setInputs({
                      ...inputs,
                      eventId: e.target.value,
                      eventName: ev?.name || '',
                      eventDate: ev?.eventDate || '',
                      eventHour: ev?.startTime || '',
                      eventLocation: ev?.location || ''
                    })
                  }}
                  className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-2 focus:ring-violet-300"
                >
                  <option value="">Selecione um evento...</option>
                  {events.map(e => (
                    <option key={e.id} value={e.id}>{e.name}</option>
                  ))}
                </select>
              </div>

              {selectedAction === 'email' && !inputs.eventId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Nome do Evento</label>
                    <input value={inputs.eventName} onChange={e => setInputs({ ...inputs, eventName: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Data</label>
                    <input type="date" value={inputs.eventDate} onChange={e => setInputs({ ...inputs, eventDate: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Horário</label>
                    <input type="time" value={inputs.eventHour} onChange={e => setInputs({ ...inputs, eventHour: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-1">Local / Link</label>
                    <input value={inputs.eventLocation} onChange={e => setInputs({ ...inputs, eventLocation: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" placeholder="Local ou link Zoom" />
                  </div>
                </div>
              )}

              {selectedAction === 'summary' && (
                <p className="text-[10px] text-slate-400 bg-emerald-50 border border-emerald-100 rounded-xl p-3">
                  📊 A IA consolidará o histórico do evento selecionado (participação, NPS, avaliações) e criará um resumo executivo pronto para ser entregue ao DHO ou liderança do cliente.
                </p>
              )}
            </div>
          )}

          <button
            onClick={handleRun}
            disabled={loading}
            className={`w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r ${selectedActionData.color} text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 transition-all disabled:opacity-50`}
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Gerando com IA...</>
            ) : (
              <><Send className="w-4 h-4" /> Gerar com IA</>
            )}
          </button>
        </div>

        {/* Output Panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-violet-500" /> Saída da IA
            </h3>
            {output && (
              <div className="flex gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(output)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <Copy className="w-3 h-3" /> Copiar
                </button>
                <button
                  onClick={handleRun}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  <RefreshCw className="w-3 h-3" /> Regerar
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <Loader2 className="w-10 h-10 text-violet-400 animate-spin" />
              <p className="text-sm text-slate-400 font-medium">Gerando conteúdo com IA...</p>
              <p className="text-xs text-slate-300">Isso pode levar alguns segundos</p>
            </div>
          )}

          {!loading && !output && (
            <div className="py-16 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Sparkles className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium">Nenhuma saída gerada</p>
              <p className="text-xs mt-1">Selecione uma ação e clique em "Gerar com IA"</p>
            </div>
          )}

          {!loading && output && (
            <div className="bg-slate-50 rounded-2xl border border-slate-100 p-5 text-xs text-slate-700 leading-relaxed whitespace-pre-line font-sans max-h-[500px] overflow-y-auto">
              {output}
            </div>
          )}
        </div>

      </div>

    </div>
  )
}
