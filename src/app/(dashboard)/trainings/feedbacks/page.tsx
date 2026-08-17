'use client'

import { useState } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import { Star, TrendingUp, MessageSquare, BarChart3, Send, ThumbsUp, QrCode, CheckCircle2, Clock } from 'lucide-react'
import { QRCodeSVG } from 'qrcode.react'

function RatingBar({ label, value }: { label: string; value: number }) {
  const pct = Math.round((value / 5) * 100)
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center text-xs">
        <span className="text-slate-600 font-medium">{label}</span>
        <span className="font-bold text-slate-800">{value.toFixed(1)} / 5</span>
      </div>
      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function NpsDonut({ nps }: { nps: number }) {
  const color = nps >= 50 ? '#10b981' : nps >= 0 ? '#f59e0b' : '#ef4444'
  const label = nps >= 50 ? 'Excelente' : nps >= 0 ? 'Bom' : 'Crítico'
  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="w-28 h-28 rounded-full flex items-center justify-center text-white text-2xl font-black border-8"
        style={{ borderColor: color, color, background: `${color}15` }}
      >
        {nps}
      </div>
      <span className="text-xs font-bold" style={{ color }}>{label}</span>
      <span className="text-[10px] text-slate-400">NPS do evento</span>
    </div>
  )
}

export default function FeedbacksPage() {
  const { events, feedbacks, participants, addFeedback } = useTrainings()

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
  const [showForm, setShowForm] = useState(false)
  const [showQr, setShowQr] = useState(false)
  const [form, setForm] = useState({
    ratingGeneral: 5,
    clarityContent: 5,
    applicability: 5,
    didactics: 5,
    organization: 5,
    nps: 10,
    comments: '',
    participantId: ''
  })

  const publicBase = typeof window !== 'undefined' ? window.location.origin : ''

  const eventFeedbacks = feedbacks.filter(f => f.eventId === selectedEventId)
  const respondedFeedbacks = eventFeedbacks.filter(f => f.status !== 'pendente')
  const pendingFeedbacks = eventFeedbacks.filter(f => f.status === 'pendente')

  const avg = (key: keyof typeof form) => {
    if (respondedFeedbacks.length === 0) return 0
    return respondedFeedbacks.reduce((acc, f) => acc + (f as any)[key], 0) / respondedFeedbacks.length
  }

  // NPS calculation (Net Promoter Score)
  const promoters = respondedFeedbacks.filter(f => f.nps >= 9).length
  const detractors = respondedFeedbacks.filter(f => f.nps <= 6).length
  const npsScore = respondedFeedbacks.length > 0
    ? Math.round(((promoters - detractors) / respondedFeedbacks.length) * 100)
    : 0

  const neutralCount = respondedFeedbacks.filter(f => f.nps >= 7 && f.nps <= 8).length

  const eventParticipants = participants.filter(p => p.eventId === selectedEventId)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addFeedback({
      eventId: selectedEventId,
      participantId: form.participantId || undefined,
      ratingGeneral: form.ratingGeneral,
      clarityContent: form.clarityContent,
      applicability: form.applicability,
      didactics: form.didactics,
      organization: form.organization,
      nps: form.nps,
      comments: form.comments
    })
    setShowForm(false)
    setForm({ ratingGeneral: 5, clarityContent: 5, applicability: 5, didactics: 5, organization: 5, nps: 10, comments: '', participantId: '' })
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Avaliação de Reação & NPS</h1>
          <p className="text-slate-500 text-sm mt-0.5">Colete e analise feedback dos participantes sobre a qualidade dos eventos</p>
        </div>
        <div className="flex gap-2">
          {selectedEventId && (
            <button
              onClick={() => setShowQr(true)}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all"
            >
              <QrCode className="w-4 h-4" /> QR do Formulário
            </button>
          )}
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-100 hover:opacity-90 transition-all"
          >
            <Star className="w-4 h-4" /> Nova Avaliação
          </button>
        </div>
      </div>

      {/* Event Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <label className="block text-xs font-bold text-slate-700 mb-2">Selecione o Evento para Análise</label>
        <select
          value={selectedEventId}
          onChange={e => setSelectedEventId(e.target.value)}
          className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 bg-white"
        >
          <option value="">Selecione um evento...</option>
          {events.map(e => (
            <option key={e.id} value={e.id}>{e.name} — {new Date(e.eventDate).toLocaleDateString('pt-BR')}</option>
          ))}
        </select>
      </div>

      {selectedEventId && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

          {/* Rating Bars Panel */}
          <div className="xl:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800">Resultado das Avaliações</h3>
              <span className="text-xs text-slate-400 font-medium">{respondedFeedbacks.length} avaliação(ões) respondida(s)</span>
            </div>

            {respondedFeedbacks.length === 0 ? (
              <div className="py-16 text-center text-slate-400">
                <BarChart3 className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-sm font-medium">Nenhuma avaliação registrada</p>
                <p className="text-xs mt-1">Adicione avaliações para ver os gráficos aqui</p>
              </div>
            ) : (
              <div className="space-y-5">
                <RatingBar label="Nota Geral" value={avg('ratingGeneral')} />
                <RatingBar label="Clareza do Conteúdo" value={avg('clarityContent')} />
                <RatingBar label="Aplicabilidade Prática" value={avg('applicability')} />
                <RatingBar label="Didática do Facilitador" value={avg('didactics')} />
                <RatingBar label="Organização do Evento" value={avg('organization')} />
              </div>
            )}

            {/* Comments section */}
            {eventFeedbacks.filter(f => f.comments && f.status !== 'pendente').length > 0 && (
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5" /> Comentários dos Participantes
                </h4>
                {eventFeedbacks.filter(f => f.comments && f.status !== 'pendente').map(f => (
                  <div key={f.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-600 leading-relaxed">
                    <div className="flex items-center gap-1 mb-1.5">
                      {Array.from({ length: f.ratingGeneral }, (_, i) => (
                        <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                      ))}
                      <span className="text-[10px] text-slate-400 ml-1">NPS: {f.nps}/10</span>
                    </div>
                    "{f.comments}"
                    <p className="text-[10px] text-slate-400 mt-1.5">{new Date(f.createdAt).toLocaleDateString('pt-BR')}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* NPS Gauge Panel */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-6">
            <h3 className="font-bold text-slate-800 text-sm">Net Promoter Score (NPS)</h3>

            {respondedFeedbacks.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <ThumbsUp className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-xs">Sem dados de NPS ainda</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center py-4">
                  <NpsDonut nps={npsScore} />
                </div>

                <div className="space-y-2 pt-4 border-t border-slate-100">
                  {[
                    { label: 'Promotores (9-10)', count: promoters, color: 'emerald' },
                    { label: 'Neutros (7-8)', count: neutralCount, color: 'amber' },
                    { label: 'Detratores (0-6)', count: detractors, color: 'red' },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">{row.label}</span>
                      <span className={`font-bold text-${row.color}-600`}>{row.count}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4 border-t border-slate-100 text-xs text-slate-400 leading-relaxed">
                  NPS = <span className="text-emerald-600 font-bold">%Promotores</span> - <span className="text-red-500 font-bold">%Detratores</span>
                </div>
              </>
            )}
          </div>

        </div>
      )}

      {/* Pending evaluations panel */}
      {selectedEventId && pendingFeedbacks.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" /> Avaliações Pendentes ({pendingFeedbacks.length})
            </h3>
            <p className="text-[10px] text-slate-400">Participantes confirmados que ainda não responderam</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {pendingFeedbacks.map(f => {
              const part = participants.find(p => p.id === f.participantId)
              return (
                <div key={f.id} className="flex items-center gap-2 px-3 py-2 bg-amber-50/60 border border-amber-100 rounded-xl">
                  <div className="w-6 h-6 rounded-full bg-amber-200 text-amber-700 flex items-center justify-center text-[10px] font-black">
                    {(part?.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">{part?.name || 'Anônimo'}</p>
                    <p className="text-[10px] text-slate-400">{part?.companyName || '—'}</p>
                  </div>
                </div>
              )
            })}
          </div>
          <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            Quando responderem pelo QR Code ou formulário, entram automaticamente nos cálculos de NPS.
          </p>
        </div>
      )}

      {/* QR Code Modal */}
      {showQr && selectedEventId && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowQr(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-slate-800">QR Code do Formulário de Avaliação</h3>
            <p className="text-xs text-slate-500 mt-0.5">Compartilhe para que os participantes avaliem o evento</p>
            <div className="my-5 flex justify-center bg-white p-4 rounded-2xl border border-slate-100">
              <QRCodeSVG value={`${publicBase}/publico/avaliacao/${selectedEventId}`} size={200} level="H" includeMargin />
            </div>
            <p className="text-xs font-bold text-slate-700">{events.find(e => e.id === selectedEventId)?.name}</p>
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => window.open(`${publicBase}/publico/avaliacao/${selectedEventId}`, '_blank')}
                className="flex-1 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors"
              >
                Abrir Formulário
              </button>
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(`${publicBase}/publico/avaliacao/${selectedEventId}`)
                  alert('Link copiado para a área de transferência!')
                }}
                className="flex-1 py-2.5 bg-slate-50 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors"
              >
                Copiar Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Feedback Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md font-sans max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Nova Avaliação de Reação</h2>
              <p className="text-sm text-slate-500">Formulário pós-evento de satisfação e NPS</p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Participante (opcional)</label>
                <select value={form.participantId} onChange={e => setForm({ ...form, participantId: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="">Avaliação anônima</option>
                  {eventParticipants.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              {[
                { key: 'ratingGeneral', label: 'Nota Geral', max: 5 },
                { key: 'clarityContent', label: 'Clareza do Conteúdo', max: 5 },
                { key: 'applicability', label: 'Aplicabilidade', max: 5 },
                { key: 'didactics', label: 'Didática', max: 5 },
                { key: 'organization', label: 'Organização', max: 5 },
              ].map(field => (
                <div key={field.key}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-xs font-bold text-slate-700">{field.label}</label>
                    <span className="text-xs font-bold text-violet-600">{(form as any)[field.key]}/{field.max}</span>
                  </div>
                  <input
                    type="range" min={1} max={field.max} step={1}
                    value={(form as any)[field.key]}
                    onChange={e => setForm({ ...form, [field.key]: Number(e.target.value) })}
                    className="w-full accent-violet-600"
                  />
                </div>
              ))}

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">NPS — Recomendaria a Empresa? (0-10)</label>
                  <span className="text-xs font-bold text-violet-600">{form.nps}/10</span>
                </div>
                <input
                  type="range" min={0} max={10} step={1}
                  value={form.nps}
                  onChange={e => setForm({ ...form, nps: Number(e.target.value) })}
                  className="w-full accent-violet-600"
                />
                <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
                  <span>Muito Improvável (0)</span>
                  <span>Muito Provável (10)</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Comentários</label>
                <textarea rows={3} value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-300 resize-none"
                  placeholder="Deixe seu comentário sobre o evento..." />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">
                  Enviar Avaliação
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
