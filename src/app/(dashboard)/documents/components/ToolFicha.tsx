'use client'

import type { KnowledgeTool } from '@/types/documents'
import { X, Save, Copy } from 'lucide-react'

export interface ToolFormState {
  name: string
  finalidade: string
  categoria: string
  tipo: string
  servicoRelacionado: string
  publicoAlvo: string
  duracaoEstimada: string
  objetivo: string
  preparacao: string
  passoAPasso: string
  orientacoes: string
  cuidados: string
  resultadoEsperado: string
  materiais: string
  equipamentos: string
  documentosComplementares: string
  status: string
  tags: string[]
  arquivoPrincipalUrl: string
  isClientVisible: boolean
}

// Placeholder da ficha: expansão completa das seções está em andamento.
export default function ToolFicha({ tool, onClose, onSave, onDuplicate }: { tool: KnowledgeTool; onClose: () => void; onSave: (t: Partial<KnowledgeTool>) => void; onDuplicate: () => void }) {
  const isNew = !tool.id
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-bold text-slate-800">{isNew ? 'Nova Ferramenta' : tool.name}</h2>
          <div className="flex gap-2">
            <button onClick={onDuplicate} className="p-2 text-slate-400 hover:text-violet-600"><Copy className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-5 space-y-4 text-xs text-slate-600">
          <p>Ficha detalhada em expansão. Campo: <b>{tool.name || 'nome'}</b>, status: {tool.status}, categoria: {tool.categoria}.</p>
          <div className="flex justify-end gap-2 pt-4 border-t">
            <button onClick={onClose} className="px-4 py-2 border rounded-xl">Cancelar</button>
            <button onClick={() => onSave(tool)} className="px-4 py-2 bg-violet-600 text-white rounded-xl flex items-center gap-1"><Save className="w-4 h-4" /> Salvar</button>
          </div>
        </div>
      </div>
    </div>
  )
}
