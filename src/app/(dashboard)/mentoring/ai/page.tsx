'use client'

import { useState } from 'react'
import { useMentoring } from '../context/MentoringContext'
import { Sparkles, Brain, User, AlertCircle, RefreshCw, Send, HelpCircle, CheckCircle } from 'lucide-react'

export default function AIPage() {
  const { participants, generateAIInsights } = useMentoring()
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [insights, setInsights] = useState('')

  const handleGenerate = async () => {
    if (!selectedParticipantId) return
    setLoading(true)
    try {
      const ins = await generateAIInsights(selectedParticipantId)
      setInsights(ins)
    } catch {
      setInsights('Erro ao processar requisição com a Inteligência Artificial.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-violet-600 animate-pulse" />
            <span className="text-sm font-semibold text-violet-600 uppercase tracking-wider">Módulo de IA Integrada</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">IA & Devolutivas Executivas</h1>
          <p className="text-slate-500 text-sm">Resumos automatizados e análises comportamentais preparados para integração com Inteligência Artificial</p>
        </div>
      </div>

      {/* Main split interactive playground */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Input Control panel */}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm h-fit space-y-6">
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-base">Configurações de Geração</h3>
            <p className="text-xs text-slate-400">Selecione um líder ou colaborador para gerar a devolutiva de desenvolvimento humana</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Participante *</label>
              <select
                value={selectedParticipantId}
                onChange={e => {
                  setSelectedParticipantId(e.target.value)
                  setInsights('')
                }}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 font-medium text-slate-700 cursor-pointer"
              >
                <option value="">Selecione um participante...</option>
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !selectedParticipantId}
              className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-200 transition-all duration-300"
            >
              <Brain className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              {loading ? 'Analisando perfil...' : 'Gerar Devolutiva Completa'}
            </button>
          </div>

          <div className="bg-violet-50/50 p-4 border border-violet-100 rounded-xl text-xs text-slate-600 leading-relaxed space-y-2">
            <span className="font-bold text-violet-700 block">O que a IA analisa?</span>
            <ul className="list-disc list-inside space-y-1.5 text-slate-500">
              <li>Histórico de sessões e resumos acordados</li>
              <li>A evolução dos objetivos da mentoria</li>
              <li>Mapeamento comportamental DISC e ferramentas</li>
              <li>Notas e observações qualitativas do mentor</li>
            </ul>
          </div>
        </div>

        {/* AI Output Result display */}
        <div className="lg:col-span-2 space-y-6">
          {loading ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center shadow-sm flex flex-col items-center justify-center space-y-4">
              <RefreshCw className="w-10 h-10 text-violet-500 animate-spin" />
              <div>
                <p className="text-slate-700 font-bold">Nossa Inteligência Artificial está trabalhando...</p>
                <p className="text-slate-400 text-xs mt-1">Isso pode levar alguns segundos dependendo do histórico do participante.</p>
              </div>
            </div>
          ) : insights ? (
            <div className="space-y-6 animate-in fade-in duration-500">
              {/* Insights text card */}
              <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-slate-50">
                  <Sparkles className="w-5 h-5 text-violet-600" />
                  <h3 className="font-bold text-slate-800 text-base">Relatório de Devolutiva do Participante</h3>
                </div>
                <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line bg-slate-50/50 p-5 rounded-xl border border-slate-100">
                  {insights}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-20 text-center shadow-sm text-slate-400">
              <Brain className="w-16 h-16 text-slate-200 mx-auto mb-4 animate-pulse" />
              <p className="text-base font-bold text-slate-500">Pronto para iniciar análise</p>
              <p className="text-xs mt-1.5 max-w-xs mx-auto">Selecione um participante na lateral esquerda e clique no botão para gerar análises e diagnósticos cognitivos completos.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
