'use client'

import { useState } from 'react'
import { Plus, X, Check, Loader2 } from 'lucide-react'
import { useServicesCatalog } from '@/hooks/useServicesCatalog'

export function ServiceQuickAdd({ onCreated, label = 'Novo serviço' }: {
  onCreated: (name: string) => void
  label?: string
}) {
  const { createService } = useServicesCatalog()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async () => {
    const trimmed = name.trim()
    if (!trimmed) return
    setSaving(true)
    setError('')
    try {
      const created = await createService({ name: trimmed, category: category.trim() || undefined })
      onCreated(created.name)
      setName('')
      setCategory('')
      setOpen(false)
    } catch (e: any) {
      setError(e?.message || 'Erro ao criar serviço.')
    } finally {
      setSaving(false)
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 rounded-full border border-dashed border-brand-teal/50 text-brand-teal text-xs font-bold transition-all hover:bg-brand-teal/5 flex items-center gap-1"
      >
        <Plus className="w-3 h-3" /> {label}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 w-full">
      <div className="flex items-center gap-1.5 flex-wrap">
        <input
          type="text"
          autoFocus
          placeholder="Nome do serviço"
          value={name}
          onChange={e => setName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          className="flex-1 min-w-[160px] px-3 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
        />
        <input
          type="text"
          placeholder="Categoria (opcional)"
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-[120px] px-3 py-1.5 border border-slate-200 rounded-full text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/50"
        />
        <button
          type="button"
          onClick={submit}
          disabled={saving || !name.trim()}
          className="px-3 py-1.5 rounded-full bg-brand-teal text-white text-xs font-bold transition-all hover:bg-brand-teal/90 disabled:opacity-50 flex items-center gap-1"
        >
          {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          Salvar
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1.5 rounded-full border border-slate-200 text-slate-400 hover:text-slate-600 transition-all"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
