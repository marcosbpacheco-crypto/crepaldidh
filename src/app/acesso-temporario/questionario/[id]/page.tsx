'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, FileQuestion, Save, Send, AlertCircle, Loader2, CheckCircle } from 'lucide-react'

interface Question { id: string; text: string; type: string; required: boolean; options?: { id: string; label: string }[]; placeholder?: string }
interface Questionnaire { id: string; title: string; description?: string; instructions?: string; questions: Question[] }
interface User { id: string; companyId: string; companyName: string; name: string; email: string }

export default function QuestionarioPage() {
  const router = useRouter()
  const params = useParams()
  const qId = params.id as string
  const [user, setUser] = useState<User | null>(null)
  const [questionnaire, setQuestionnaire] = useState<Questionnaire | null>(null)
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({})
  const [saving, setSaving] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('temp_access_user')
    if (!stored) { router.push('/acesso-temporario/entrar'); return }
    try {
      const u = JSON.parse(stored)
      setUser(u)
      const qs = localStorage.getItem('acesso_temporario_questionnaires')
      if (qs) {
        const list = JSON.parse(qs)
        const q = list.find((x: any) => x.id === qId)
        if (q) setQuestionnaire(q)
        else router.push('/acesso-temporario/coleta')
      }
      const rs = localStorage.getItem('acesso_temporario_responses')
      if (rs) {
        const list = JSON.parse(rs)
        const existing = list.find((r: any) => r.questionnaireId === qId && r.companyId === u.companyId && r.status === 'draft')
        if (existing) {
          const ans: Record<string, string | string[]> = {}
          existing.answers.forEach((a: any) => { ans[a.questionId] = a.value })
          setAnswers(ans)
        }
      }
    } catch { router.push('/acesso-temporario/entrar') }
  }, [qId, router])

  const setAnswer = useCallback((qId: string, value: string | string[]) => {
    setAnswers(prev => ({ ...prev, [qId]: value }))
    setSaved(false)
  }, [])

  const answersToArray = () => {
    if (!questionnaire) return []
    return questionnaire.questions.map(q => ({ questionId: q.id, value: answers[q.id] ?? '' }))
  }

  const handleSaveDraft = async () => {
    if (!user || !questionnaire) return
    setSaving(true)
    try {
      const existing = JSON.parse(localStorage.getItem('acesso_temporario_responses') || '[]')
      const draftIdx = existing.findIndex((r: any) => r.questionnaireId === qId && r.companyId === user.companyId && r.status === 'draft')
      const draft = { questionnaireId: qId, questionnaireTitle: questionnaire.title, companyId: user.companyId, companyName: user.companyName, userId: user.id, userName: user.name, answers: answersToArray(), submittedAt: new Date().toISOString(), status: 'draft', id: 'resp-' + Date.now() }
      if (draftIdx >= 0) { existing[draftIdx] = { ...existing[draftIdx], ...draft, id: existing[draftIdx].id } }
      else { existing.push(draft) }
      localStorage.setItem('acesso_temporario_responses', JSON.stringify(existing))
      setSaved(true); setTimeout(() => setSaved(false), 3000)
    } catch { setError('Erro ao salvar rascunho') }
    setSaving(false)
  }

  const handleSubmit = async () => {
    if (!user || !questionnaire) return
    const missing = questionnaire.questions.filter(q => q.required && (!answers[q.id] || (typeof answers[q.id] === 'string' && !(answers[q.id] as string).trim())))
    if (missing.length > 0) { setError(`Preencha os campos obrigatórios: ${missing.map(q => q.text).join(', ')}`); return }
    setSubmitting(true)
    setError('')
    try {
      const existing = JSON.parse(localStorage.getItem('acesso_temporario_responses') || '[]')
      existing.push({ id: 'resp-' + Date.now(), questionnaireId: qId, questionnaireTitle: questionnaire.title, companyId: user.companyId, companyName: user.companyName, userId: user.id, userName: user.name, answers: answersToArray(), submittedAt: new Date().toISOString(), status: 'submitted' })
      localStorage.setItem('acesso_temporario_responses', JSON.stringify(existing))
      router.push('/acesso-temporario/coleta')
    } catch { setError('Erro ao enviar respostas') }
    setSubmitting(false)
  }

  if (!user || !questionnaire) return null

  const renderInput = (q: Question) => {
    const val = (answers[q.id] as string) ?? ''
    switch (q.type) {
      case 'textarea':
        return <textarea value={val} onChange={e => setAnswer(q.id, e.target.value)} rows={3} placeholder={q.placeholder || ''} className="w-full text-[12px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
      case 'select':
        return <select value={val} onChange={e => setAnswer(q.id, e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20 bg-white"><option value="">Selecione...</option>{(q.options || []).map(o => <option key={o.id} value={o.label}>{o.label}</option>)}</select>
      case 'radio':
        return <div className="space-y-1.5">{(q.options || []).map(o => <label key={o.id} className="flex items-center gap-2 cursor-pointer"><input type="radio" name={q.id} value={o.label} checked={val === o.label} onChange={e => setAnswer(q.id, e.target.value)} className="accent-violet-600" /><span className="text-[12px] text-slate-700">{o.label}</span></label>)}</div>
      case 'number':
        return <input type="number" value={val} onChange={e => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || ''} className="w-full text-[12px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
      case 'date':
        return <input type="date" value={val} onChange={e => setAnswer(q.id, e.target.value)} className="w-full text-[12px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
      case 'email':
        return <input type="email" value={val} onChange={e => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || 'email@exemplo.com'} className="w-full text-[12px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
      case 'phone':
        return <input type="tel" value={val} onChange={e => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || '(11) 99999-0000'} className="w-full text-[12px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
      case 'cnpj':
        return <input type="text" value={val} onChange={e => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || '00.000.000/0000-00'} className="w-full text-[12px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
      default:
        return <input type="text" value={val} onChange={e => setAnswer(q.id, e.target.value)} placeholder={q.placeholder || ''} className="w-full text-[12px] border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-500/20" />
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <button onClick={() => router.push('/acesso-temporario/coleta')} className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 hover:text-violet-600 mb-4 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Voltar
        </button>

        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 sm:p-6">
          <div className="flex items-start gap-2 sm:gap-3 mb-4 sm:mb-6">
            <FileQuestion className="w-6 h-6 text-violet-500 mt-0.5" />
            <div>
              <h1 className="text-lg font-black text-slate-800">{questionnaire.title}</h1>
              {questionnaire.description && <p className="text-xs text-slate-500 mt-1">{questionnaire.description}</p>}
              {questionnaire.instructions && <p className="text-[10px] text-amber-700 mt-2 flex items-center gap-1 bg-amber-50 border border-amber-100 rounded-xl p-3"><AlertCircle className="w-3.5 h-3.5 shrink-0" />{questionnaire.instructions}</p>}
            </div>
          </div>

          {error && <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-[10px] text-red-700">{error}</div>}

          <div className="space-y-4">
            {questionnaire.questions.map((q, i) => (
              <div key={q.id} className="p-3 sm:p-4 bg-slate-50 rounded-xl border border-slate-100">
                <label className="block text-[11px] font-semibold text-slate-700 mb-2">
                  {i + 1}. {q.text}{q.required && <span className="text-red-400 ml-1">*</span>}
                </label>
                {renderInput(q)}
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-6 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button onClick={handleSaveDraft} disabled={saving}
                className="flex items-center justify-center gap-1.5 px-3 sm:px-4 py-2 sm:py-2.5 border border-slate-200 rounded-xl text-[10px] sm:text-[11px] font-semibold text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-40">
                {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                {saving ? 'Salvando...' : 'Salvar Rascunho'}
              </button>
              {saved && <span className="text-[9px] sm:text-[10px] text-emerald-600 flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Salvo</span>}
            </div>
            <div className="flex-1 min-w-0" />
            <button onClick={handleSubmit} disabled={submitting}
              className="flex items-center justify-center gap-1.5 px-5 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-[10px] sm:text-[11px] font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50">
              {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {submitting ? 'Enviando...' : 'Enviar Respostas'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
