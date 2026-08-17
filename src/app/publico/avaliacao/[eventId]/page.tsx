'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Star, Send, CheckCircle, Loader2, Users } from 'lucide-react'

interface PublicEvent {
  id: string
  name: string
  type: string
  theme: string
  eventDate: string
  company: string
}
interface PublicParticipant { id: string; name: string; company_name?: string }

function RatingRow({ label, value, max, onChange }: { label: string; value: number; max: number; onChange: (v: number) => void }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-xs font-bold text-slate-700">{label}</label>
        <span className="text-xs font-bold text-violet-600">{value}/{max}</span>
      </div>
      <input
        type="range" min={1} max={max} step={1} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-violet-600"
      />
    </div>
  )
}

export default function PublicAvaliacaoPage() {
  const params = useParams<{ eventId: string }>()
  const eventId = params?.eventId || ''
  const [event, setEvent] = useState<PublicEvent | null>(null)
  const [participants, setParticipants] = useState<PublicParticipant[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)

  const [form, setForm] = useState({
    participantId: '',
    ratingGeneral: 5,
    clarityContent: 5,
    applicability: 5,
    didactics: 5,
    organization: 5,
    nps: 10,
    comments: '',
  })

  useEffect(() => {
    if (!eventId) return
    fetch(`/api/publico/avaliacao?eventId=${eventId}`)
      .then(r => r.json())
      .then(d => {
        if (d.event) {
          setEvent(d.event)
          setParticipants(d.participants || [])
        } else {
          setError(d.error || 'Evento não encontrado')
        }
      })
      .catch(() => setError('Erro ao carregar o evento'))
      .finally(() => setLoading(false))
  }, [eventId])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/publico/avaliacao', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId, ...form }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Erro ao enviar')
      setDone(true)
    } catch (err: any) {
      setError(err.message || 'Erro ao enviar avaliação')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm">
          <div className="w-14 h-14 bg-red-100 text-red-500 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">!</div>
          <h1 className="font-bold text-slate-800">Avaliação indisponível</h1>
          <p className="text-sm text-slate-500 mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-4">
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-10 text-center max-w-md w-full">
          <CheckCircle className="w-14 h-14 text-emerald-400 mx-auto mb-4" />
          <h1 className="text-xl font-black">Avaliação enviada!</h1>
          <p className="text-sm text-slate-300 mt-2">
            Obrigado por participar de <strong>{event.name}</strong>.<br />
            Sua opinião ajuda a CrepaldiDH a melhorar cada vez mais.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <div className="text-center text-white mb-6">
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/15 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-violet-200">
            <Star className="w-3.5 h-3.5" /> CrepaldiDH — Avaliação de Reação
          </div>
          <h1 className="text-2xl font-black mt-4">{event.name}</h1>
          <p className="text-sm text-slate-300 mt-1">{event.company} · {new Date(event.eventDate).toLocaleDateString('pt-BR')}</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-2xl p-6 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Seu Nome (para associar ao certificado)</label>
            <select value={form.participantId} onChange={e => setForm({ ...form, participantId: e.target.value })}
              className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-sm bg-white">
              <option value="">Avaliação anônima</option>
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.company_name ? `— ${p.company_name}` : ''}</option>
              ))}
            </select>
            {participants.length === 0 && (
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><Users className="w-3 h-3" /> Nenhum participante vinculado — avalie de forma anônima.</p>
            )}
          </div>

          <RatingRow label="Nota Geral do Evento" value={form.ratingGeneral} max={5} onChange={v => setForm({ ...form, ratingGeneral: v })} />
          <RatingRow label="Clareza do Conteúdo" value={form.clarityContent} max={5} onChange={v => setForm({ ...form, clarityContent: v })} />
          <RatingRow label="Aplicabilidade Prática" value={form.applicability} max={5} onChange={v => setForm({ ...form, applicability: v })} />
          <RatingRow label="Didática do Facilitador" value={form.didactics} max={5} onChange={v => setForm({ ...form, didactics: v })} />
          <RatingRow label="Organização do Evento" value={form.organization} max={5} onChange={v => setForm({ ...form, organization: v })} />

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-xs font-bold text-slate-700">NPS — Você recomendaria a CrepaldiDH? (0-10)</label>
              <span className="text-xs font-bold text-violet-600">{form.nps}/10</span>
            </div>
            <input type="range" min={0} max={10} step={1} value={form.nps}
              onChange={e => setForm({ ...form, nps: Number(e.target.value) })}
              className="w-full accent-violet-600" />
            <div className="flex justify-between text-[9px] text-slate-400 mt-0.5">
              <span>Muito Improvável (0)</span>
              <span>Muito Provável (10)</span>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Comentários (opcional)</label>
            <textarea rows={3} value={form.comments} onChange={e => setForm({ ...form, comments: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm resize-none focus:ring-1 focus:ring-violet-300"
              placeholder="Deixe seu comentário sobre o evento..." />
          </div>

          <button type="submit" disabled={submitting}
            className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-violet-200 hover:opacity-90 disabled:opacity-50 transition-all">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {submitting ? 'Enviando...' : 'Enviar Avaliação'}
          </button>
        </form>

        <p className="text-center text-[10px] text-slate-400 mt-4">CrepaldiDH · Desenvolvimento Humano e Organizacional</p>
      </div>
    </div>
  )
}