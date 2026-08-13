'use client'

import { useState } from 'react'
import { useMentoring } from '../../../context/MentoringContext'
import type { MentoringProgram } from '../../../context/MentoringContext'
import { Star, Plus, Trash2, MessageSquare } from 'lucide-react'

const AUTHOR_LABELS: Record<string, string> = {
  mentor: 'Mentor',
  mentorado: 'Mentorado',
  participante: 'Participante',
}

const emptyForm = {
  sessionId: '',
  authorType: 'mentorado' as 'mentor' | 'mentorado' | 'participante',
  satisfaction: 5,
  relevance: 5,
  applicability: 5,
  evolutionPerceived: 5,
  comments: '',
}

export default function FeedbacksTab({ program }: { program: MentoringProgram }) {
  const { addFeedback, deleteFeedback } = useMentoring()
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)

  const sessions = Array.isArray(program.sessions) ? program.sessions : []
  const feedbacks = [...(Array.isArray(program.feedbacks) ? program.feedbacks : [])]
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    addFeedback({
      programId: program.id,
      sessionId: form.sessionId || undefined,
      authorType: form.authorType,
      satisfaction: form.satisfaction,
      relevance: form.relevance,
      applicability: form.applicability,
      evolutionPerceived: form.evolutionPerceived,
      comments: form.comments.trim() || undefined,
    })
    setShowForm(false)
    setForm(emptyForm)
  }

  const ratingFields = [
    { key: 'satisfaction' as const, label: 'Satisfação' },
    { key: 'relevance' as const, label: 'Relevância' },
    { key: 'applicability' as const, label: 'Aplicabilidade' },
    { key: 'evolutionPerceived' as const, label: 'Evolução percebida' },
  ]

  const renderStars = (value?: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star key={i} className={`w-4 h-4 ${i <= (value || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Star className="w-5 h-5 text-violet-600" />
            <h3 className="text-lg font-bold text-slate-800">Feedbacks</h3>
            <span className="text-xs font-semibold px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full">{feedbacks.length}</span>
          </div>
          <p className="text-xs text-slate-400 mt-1">Avaliações de satisfação e evolução das sessões</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
          <Plus className="w-4 h-4" /> Novo Feedback
        </button>
      </div>

      {showForm && (
        <form onSubmit={submit} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
          <h4 className="text-sm font-bold text-slate-700">Novo Feedback</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Sessão</span>
              <select value={form.sessionId} onChange={e => setForm({ ...form, sessionId: e.target.value })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                <option value="">Sem vínculo...</option>
                {sessions.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Autor</span>
              <select value={form.authorType} onChange={e => setForm({ ...form, authorType: e.target.value as any })}
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-300">
                {Object.entries(AUTHOR_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </label>
            {ratingFields.map(f => (
              <label key={f.key} className="block">
                <span className="block text-xs font-semibold text-slate-600 mb-1">{f.label}</span>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map(i => (
                    <button key={i} type="button" onClick={() => setForm({ ...form, [f.key]: i })}
                      className="p-1 transition-transform hover:scale-110">
                      <Star className={`w-5 h-5 ${i <= form[f.key] ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    </button>
                  ))}
                  <span className="ml-2 text-xs font-bold text-slate-500">{form[f.key]}/5</span>
                </div>
              </label>
            ))}
            <label className="block sm:col-span-2">
              <span className="block text-xs font-semibold text-slate-600 mb-1">Comentários</span>
              <textarea value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })} rows={3}
                placeholder="Percepções, pontos fortes e oportunidades..."
                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-300" />
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button type="button" onClick={() => setShowForm(false)} className="px-5 py-2.5 rounded-full text-sm font-semibold text-slate-600 hover:bg-slate-50 transition-colors">
              Cancelar
            </button>
            <button type="submit" className="px-5 py-2.5 bg-violet-600 text-white rounded-full text-sm font-bold hover:bg-violet-700 transition-colors">
              Salvar Feedback
            </button>
          </div>
        </form>
      )}

      {feedbacks.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-12 text-center">
          <MessageSquare className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="text-sm font-semibold text-slate-500">Nenhum feedback registrado</p>
          <p className="text-xs text-slate-400 mt-1">Registre a percepção do mentorado após as sessões.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {feedbacks.map(f => {
            const session = sessions.find(s => s.id === f.sessionId)
            return (
              <div key={f.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-50 text-violet-600">
                        {AUTHOR_LABELS[f.authorType] || f.authorType}
                      </span>
                      <span className="text-xs text-slate-400">{new Date(f.createdAt).toLocaleDateString('pt-BR')}</span>
                      {session && <span className="text-xs text-slate-500 font-medium">· {session.title}</span>}
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {ratingFields.map(rf => (
                        <div key={rf.key}>
                          <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{rf.label}</p>
                          <div className="mt-0.5">{renderStars(f[rf.key])}</div>
                        </div>
                      ))}
                    </div>
                    {f.comments && (
                      <p className="text-sm text-slate-600 mt-3 bg-slate-50 border border-slate-100 rounded-xl p-3">{f.comments}</p>
                    )}
                  </div>
                  <button onClick={() => confirm('Excluir este feedback?') && deleteFeedback(f.id)}
                    className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors flex-shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
