'use client'

import { useState } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import type { TrainingTargetType } from '@/types/trainings'
import { Plus, Trash2, BookOpen, Save, X, Layers, Target } from 'lucide-react'

const MATERIAL_TYPES = ['slide', 'apostila', 'pdf', 'foto', 'video', 'link', 'dinamica', 'checklist', 'evidencia'] as const

const TARGET_LABEL: Record<TrainingTargetType, string> = {
  empresa: 'Empresa',
  pessoa: 'Pessoa',
  ambos: 'Empresa ou Pessoa',
}

export default function CatalogManager({ category }: { category: 'Treinamento' | 'Palestra' | 'Workshop' }) {
  const { trainingTypes, typeMaterials, addTrainingType, updateTrainingType, deleteTrainingType, addTypeMaterial, deleteTypeMaterial } = useTrainings()
  const [newType, setNewType] = useState(false)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [targetType, setTargetType] = useState<TrainingTargetType>('empresa')
  const [hours, setHours] = useState(2)
  const [mat, setMat] = useState<{ name: string; type: typeof MATERIAL_TYPES[number] }>({ name: '', type: 'pdf' })

  const types = trainingTypes.filter(t => t.category === category)

  const save = () => {
    if (!name.trim()) return
    addTrainingType({ name: name.trim(), description: description.trim() || undefined, category, targetType, hoursDuration: Number(hours) || 2, active: true })
    setName('')
    setDescription('')
    setNewType(false)
  }

  const addMat = (typeId: string) => {
    if (!mat.name.trim()) return
    addTypeMaterial({ trainingTypeId: typeId, name: mat.name.trim(), type: mat.type })
    setMat({ name: '', type: 'pdf' })
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-violet-50 text-violet-600 rounded-xl"><BookOpen className="w-4 h-4" /></div>
          <div>
            <h3 className="font-bold text-slate-800 text-sm">Tipos de {category === 'Palestra' ? 'Palestras' : category === 'Workshop' ? 'Workshops' : 'Treinamentos'}</h3>
            <p className="text-[10px] text-slate-400">Catálogo cadastrável com materiais recomendados por tipo</p>
          </div>
        </div>
        <button
          onClick={() => setNewType(o => !o)}
          className="flex items-center gap-1.5 px-3 py-2 text-[11px] font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white transition-colors"
        >
          {newType ? <X className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />} {newType ? 'Cancelar' : 'Novo tipo'}
        </button>
      </div>

      {newType && (
        <div className="space-y-3 border border-violet-100 bg-violet-50/40 rounded-2xl p-4">
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={`Nome do tipo de ${category.toLowerCase()} (ex: Primeiros Socorros)`}
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-violet-300"
          />
          <input
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Descrição / ementa (opcional)"
            className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none focus:ring-1 focus:ring-violet-300"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
              Vinculável a
              <select
                value={targetType}
                onChange={e => setTargetType(e.target.value as TrainingTargetType)}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white text-slate-700 focus:outline-none"
              >
                <option value="empresa">Empresa</option>
                <option value="pessoa">Pessoa</option>
                <option value="ambos">Empresa ou Pessoa</option>
              </select>
            </label>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider space-y-1">
              Duração (h)
              <input
                type="number"
                min={0.5}
                step={0.5}
                value={hours}
                onChange={e => setHours(Number(e.target.value))}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white focus:outline-none"
              />
            </label>
          </div>
          <button
            onClick={save}
            disabled={!name.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-bold transition-colors"
          >
            <Save className="w-3.5 h-3.5" /> Salvar tipo
          </button>
        </div>
      )}

      {types.length === 0 ? (
        <p className="text-xs text-slate-400 text-center py-4">Nenhum tipo cadastrado. Crie o primeiro para agilizar o cadastro de eventos.</p>
      ) : (
        <div className="space-y-3">
          {types.map(t => {
            const mats = typeMaterials.filter(m => m.trainingTypeId === t.id)
            return (
              <div key={t.id} className="border border-slate-100 rounded-2xl p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${t.active ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>
                        {t.active ? 'Ativo' : 'Inativo'}
                      </span>
                      {t.targetType && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-100 flex items-center gap-1">
                          <Target className="w-2.5 h-2.5" /> {TARGET_LABEL[t.targetType]}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-800 text-sm mt-1">{t.name}</p>
                    {t.description && <p className="text-[11px] text-slate-500 mt-0.5">{t.description}</p>}
                    <p className="text-[10px] text-slate-400 mt-1">⏱ {t.hoursDuration || 0}h | 📦 {mats.length} materiais</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateTrainingType(t.id, { active: !t.active })}
                      className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700"
                      title={t.active ? 'Desativar' : 'Ativar'}
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => deleteTrainingType(t.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500"
                      title="Excluir tipo"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Materials do tipo */}
                <div className="space-y-2 pl-1">
                  {mats.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {mats.map(m => (
                        <span key={m.id} className="flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-bold text-slate-600">
                          {m.name}
                          <span className="text-[8px] uppercase text-slate-400">{m.type}</span>
                          <button onClick={() => deleteTypeMaterial(m.id)} className="hover:text-red-500"><X className="w-3 h-3" /></button>
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <input
                      value={mat.name}
                      onChange={e => setMat({ ...mat, name: e.target.value })}
                      placeholder="Adicionar material recomendado..."
                      className="flex-1 px-3 py-1.5 border border-slate-200 rounded-xl text-[11px] bg-slate-50 focus:outline-none focus:ring-1 focus:ring-violet-200"
                    />
                    <select
                      value={mat.type}
                      onChange={e => setMat({ ...mat, type: e.target.value as typeof MATERIAL_TYPES[number] })}
                      className="px-2 py-1.5 border border-slate-200 rounded-xl text-[10px] bg-white text-slate-600"
                    >
                      {MATERIAL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                    </select>
                    <button
                      onClick={() => addMat(t.id)}
                      disabled={!mat.name.trim()}
                      className="p-1.5 rounded-lg bg-violet-50 text-violet-600 hover:bg-violet-100 disabled:opacity-40"
                      title="Vincular material"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}