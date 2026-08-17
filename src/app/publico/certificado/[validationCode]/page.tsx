'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Award, Download, Loader2, ShieldCheck, FileQuestion } from 'lucide-react'

interface PublicCert {
  participantName: string
  eventName: string
  clientName: string
  hours: number
  facilitator: string
  date: string
  validationCode: string
  issuedAt?: string
}

export default function PublicCertificadoPage() {
  const params = useParams<{ validationCode: string }>()
  const code = params?.validationCode || ''
  const [cert, setCert] = useState<PublicCert | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [pdfLoading, setPdfLoading] = useState(false)

  useEffect(() => {
    if (!code) return
    fetch(`/api/publico/certificado?code=${encodeURIComponent(code)}`)
      .then(r => r.json())
      .then(d => {
        if (d.certificate) setCert(d.certificate)
        else setError(d.error || 'Certificado não encontrado')
      })
      .catch(() => setError('Erro ao consultar o certificado'))
      .finally(() => setLoading(false))
  }, [code])

  const handleDownloadPDF = async () => {
    if (!cert) return
    setPdfLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const preview = document.getElementById('cert-preview-public')
      if (!preview) return
      const canvas = await html2canvas(preview, { backgroundColor: '#0f172a', scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' })
      const pw = pdf.internal.pageSize.getWidth()
      const ph = pdf.internal.pageSize.getHeight()
      pdf.addImage(imgData, 'PNG', 0, 0, pw, ph)
      pdf.save(`certificado-${cert.participantName.replace(/\s+/g, '-')}-${cert.validationCode}.pdf`)
    } catch (err) {
      console.error(err)
      alert('Ocorreu um erro ao gerar o PDF.')
    } finally {
      setPdfLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white">
        <Loader2 className="w-8 h-8 animate-spin text-violet-400" />
      </div>
    )
  }

  if (error || !cert) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white rounded-2xl shadow-xl p-10 text-center max-w-sm">
          <FileQuestion className="w-14 h-14 text-slate-300 mx-auto mb-4" />
          <h1 className="font-bold text-slate-800">Certificado não encontrado</h1>
          <p className="text-sm text-slate-500 mt-1">Verifique o código de validação e tente novamente.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="text-center text-white">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-400/20 rounded-full px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
            <ShieldCheck className="w-3.5 h-3.5" /> Certificado Verificado
          </div>
          <h1 className="text-xl font-black mt-4">Validação de Certificado CrepaldiDH</h1>
          <p className="text-sm text-slate-300 mt-1">Código: <span className="font-mono">{cert.validationCode}</span></p>
        </div>

        <div id="cert-preview-public" className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden w-full mx-auto">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-purple-400 to-indigo-500" />
          <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-violet-500/10 border border-violet-400/20" />
          <div className="absolute bottom-4 right-4 w-24 h-24 rounded-full bg-indigo-500/10 border border-indigo-400/20" />

          <div className="relative z-10 text-center space-y-4">
            <div className="flex justify-center">
              <div className="px-3 py-1 bg-violet-500/20 border border-violet-400/30 rounded-full text-violet-300 text-[10px] font-bold tracking-widest uppercase">
                CrepaldiDH — Certificado de Participação
              </div>
            </div>
            <div>
              <p className="text-slate-400 text-xs">Certificamos que</p>
              <h2 className="text-2xl font-black text-white mt-1">{cert.participantName}</h2>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400 text-xs">participou do evento</p>
              <h3 className="text-base font-bold text-violet-200 leading-tight">{cert.eventName}</h3>
            </div>
            <div className="grid grid-cols-3 gap-3 my-4">
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Cliente</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5 truncate">{cert.clientName}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Data</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">{new Date(cert.date).toLocaleDateString('pt-BR')}</p>
              </div>
              <div className="bg-white/5 rounded-xl p-3 border border-white/10">
                <p className="text-[9px] text-slate-500 uppercase tracking-wider font-bold">Carga Horária</p>
                <p className="text-xs text-slate-300 font-semibold mt-0.5">{cert.hours}h</p>
              </div>
            </div>
            <div className="flex justify-between items-end pt-4 border-t border-white/10">
              <div className="text-left">
                <div className="w-24 border-b border-white/30 mb-1" />
                <p className="text-[10px] text-slate-400">{cert.facilitator}</p>
                <p className="text-[9px] text-slate-500">Facilitador(a)</p>
              </div>
              <div className="text-right">
                <p className="text-[9px] text-slate-500 font-mono">Cód.: {cert.validationCode}</p>
                <p className="text-[9px] text-slate-600">CrepaldiDH • Desenvolvimento Humano</p>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          className="w-full max-w-sm mx-auto flex items-center justify-center gap-2 py-3 bg-white text-slate-800 rounded-xl text-sm font-bold shadow-lg hover:bg-slate-100 disabled:opacity-50 transition-all"
        >
          {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {pdfLoading ? 'Gerando PDF...' : 'Baixar Certificado (PDF)'}
        </button>

        <div className="flex items-center justify-center gap-1.5 text-[10px] text-slate-400">
          <Award className="w-3.5 h-3.5" /> Certificado emitido e validado pela CrepaldiDH
        </div>
      </div>
    </div>
  )
}