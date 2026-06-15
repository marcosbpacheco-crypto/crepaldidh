'use client'

import { useState, useRef } from 'react'
import { Upload, FileSpreadsheet, Download, CheckCircle, AlertCircle, X, ChevronDown, Loader2 } from 'lucide-react'
import { useCrm } from '@/app/(dashboard)/crm/context/CrmContext'

type ImportTarget = 'companies' | 'training_participants'

const TARGETS: { key: ImportTarget; label: string; description: string; columns: string[] }[] = [
  { key: 'companies', label: 'Clientes / Empresas', description: 'Importar empresas com nome, CNPJ, segmento, contato', columns: ['name', 'tradeName', 'cnpj', 'segment', 'city', 'state', 'phone', 'email', 'respPrincipal'] },
  { key: 'training_participants', label: 'Participantes de Treinamento', description: 'Importar participantes para eventos de treinamento', columns: ['name', 'email', 'companyName', 'eventName', 'status'] },
]

export default function ImportPage() {
  const { companies, addCompany } = useCrm()
  const [target, setTarget] = useState<ImportTarget>('companies')
  const [csvData, setCsvData] = useState<string[][]>([])
  const [headers, setHeaders] = useState<string[]>([])
  const [mapping, setMapping] = useState<Record<number, string>>({})
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      const text = ev.target?.result as string
      const lines = text.split('\n').filter(l => l.trim())
      if (lines.length < 2) {
        alert('Arquivo inválido. Deve conter cabeçalho + pelo menos 1 linha de dados.')
        return
      }
      const h = lines[0].split(',').map(s => s.trim().replace(/^["']|["']$/g, ''))
      const d = lines.slice(1).map(l => l.split(',').map(s => s.trim().replace(/^["']|["']$/g, '')))
      setHeaders(h)
      setCsvData(d)
      setResults(null)
      // Auto-map columns
      const autoMap: Record<number, string> = {}
      const targetColumns = TARGETS.find(t => t.key === target)?.columns || []
      h.forEach((col, idx) => {
        const normalized = col.toLowerCase().replace(/[\s_-]/g, '')
        const match = targetColumns.find(tc => {
          const tcNorm = tc.toLowerCase().replace(/[\s_-]/g, '')
          return normalized === tcNorm || normalized.includes(tcNorm) || tcNorm.includes(normalized)
        })
        if (match) autoMap[idx] = match
      })
      setMapping(autoMap)
    }
    reader.readAsText(file, 'UTF-8')
  }

  const handleImport = async () => {
    setImporting(true)
    const errors: string[] = []
    let success = 0
    const targetCols = TARGETS.find(t => t.key === target)?.columns || []

    for (let rowIdx = 0; rowIdx < csvData.length; rowIdx++) {
      const row = csvData[rowIdx]
      try {
        const record: Record<string, string> = {}
        Object.entries(mapping).forEach(([colIdx, field]) => {
          record[field] = row[parseInt(colIdx)] || ''
        })

        if (target === 'companies') {
          if (!record.name) { errors.push(`Linha ${rowIdx + 2}: nome da empresa é obrigatório`); continue }
          addCompany({
            name: record.name, tradeName: record.tradeName || record.name,
            cnpj: record.cnpj || '', segment: record.segment || '',
            employees: 0, city: record.city || '', state: record.state || '',
            website: '', instagram: '', respPrincipal: record.respPrincipal || '',
            respRH: '', respFinanceiro: '', phone: record.phone || '',
            email: record.email || '', notes: '', status: 'active',
          })
          success++
        } else if (target === 'training_participants') {
          if (!record.name) { errors.push(`Linha ${rowIdx + 2}: nome é obrigatório`); continue }
          success++
        }
      } catch (err: any) {
        errors.push(`Linha ${rowIdx + 2}: ${err.message || 'Erro inesperado'}`)
      }
    }

    setResults({ success, errors })
    setImporting(false)
  }

  const downloadTemplate = () => {
    const targetInfo = TARGETS.find(t => t.key === target)
    if (!targetInfo) return
    const header = targetInfo.columns.join(',')
    const sampleRow = targetInfo.columns.map(c => {
      const samples: Record<string, string> = {
        name: 'Exemplo Ltda', tradeName: 'Exemplo', cnpj: '00.000.000/0001-00',
        segment: 'Serviços', city: 'São Paulo', state: 'SP', phone: '(11) 99999-0000',
        email: 'contato@exemplo.com', respPrincipal: 'João Silva',
        companyName: 'Empresa Exemplo', roleName: 'Analista', sectorName: 'Administrativo',
        startDate: '2026-01-01', unitName: 'Matriz', department: 'RH', level: 'pleno',
        description: 'Descrição do cargo', eventName: 'Treinamento CIPA', status: 'confirmado',
      }
      return samples[c] || ''
    }).join(',')
    const blob = new Blob([`${header}\n${sampleRow}`], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `template-${target}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Importação por Planilha</h1>
        <p className="text-slate-500 text-sm mt-0.5">Importe dados em massa usando arquivos CSV</p>
      </div>

      {/* Target Selection */}
      <div className="grid grid-cols-2 gap-3">
        {TARGETS.map(t => (
          <button key={t.key} onClick={() => { setTarget(t.key); setCsvData([]); setResults(null) }}
            className={`p-4 bg-white rounded-2xl border text-left transition-all ${target === t.key ? 'border-violet-400 ring-2 ring-violet-50' : 'border-slate-100 hover:border-slate-200'}`}>
            <p className="text-xs font-bold text-slate-800">{t.label}</p>
            <p className="text-[9px] text-slate-400 mt-1">{t.description}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-sm font-bold text-slate-800">Arquivo CSV</h2>
            <p className="text-xs text-slate-500">Selecione um arquivo .csv com os dados para importar</p>
          </div>
          <div className="flex gap-3">
            <button onClick={downloadTemplate} className="flex items-center gap-2 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
              <Download className="w-4 h-4" /> Baixar Template
            </button>
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-md hover:opacity-90">
              <Upload className="w-4 h-4" /> Selecionar Arquivo
            </button>
          </div>
          <input ref={fileRef} type="file" accept=".csv" onChange={handleFile} className="hidden" />
        </div>

        {headers.length > 0 && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4">
              <p className="text-xs font-bold text-slate-700 mb-2">Colunas detectadas ({csvData.length} linha(s))</p>
              <div className="flex flex-wrap gap-2">
                {headers.map((h, i) => (
                  <div key={i} className="flex items-center gap-2 bg-white rounded-lg px-3 py-1.5 border border-slate-200">
                    <span className="text-xs text-slate-600">{h}</span>
                    <span className="text-[9px] text-violet-500 font-semibold">→ {mapping[i] || 'não mapeado'}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Preview */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {headers.map((h, i) => (
                      <th key={i} className="text-left p-2 font-bold text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {csvData.slice(0, 5).map((row, ri) => (
                    <tr key={ri} className="border-b border-slate-100">
                      {row.map((cell, ci) => (
                        <td key={ci} className="p-2 text-slate-600 max-w-[200px] truncate">{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              {csvData.length > 5 && <p className="text-[10px] text-slate-400 mt-2">...e mais {csvData.length - 5} linha(s)</p>}
            </div>

            <button onClick={handleImport} disabled={importing || csvData.length === 0}
              className="flex items-center justify-center gap-2 w-full py-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white rounded-xl text-sm font-bold shadow-md hover:opacity-90 disabled:opacity-50">
              {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
              {importing ? 'Importando...' : `Importar ${csvData.length} registro(s)`}
            </button>
          </div>
        )}
      </div>

      {/* Results */}
      {results && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <CheckCircle className="w-6 h-6 text-emerald-500" />
            <div>
              <h2 className="text-sm font-bold text-slate-800">Resultado da Importação</h2>
              <p className="text-xs text-slate-500">{results.success} registro(s) importado(s) com sucesso</p>
            </div>
          </div>
          {results.errors.length > 0 && (
            <div className="bg-red-50 rounded-xl p-4">
              <p className="text-xs font-bold text-red-700 mb-2">{results.errors.length} erro(s):</p>
              <ul className="space-y-1">
                {results.errors.map((err, i) => (
                  <li key={i} className="text-[10px] text-red-600 flex items-start gap-1">
                    <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" /> {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
