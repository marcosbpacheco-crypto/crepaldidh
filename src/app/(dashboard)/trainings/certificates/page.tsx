'use client'

import { useState, useRef, useCallback } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import { Award, Download, CheckCircle, Users, Shield, Star, Loader2 } from 'lucide-react'

type Cert = ReturnType<typeof useTrainings>['certificates'][0]

function CertificatePreview({ cert, certRef }: { cert: Cert; certRef?: React.Ref<HTMLDivElement> }) {
  return (
    <div
      ref={certRef}
      id={`cert-preview-${cert.id}`}
      className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-8 text-white relative overflow-hidden w-full max-w-xl mx-auto"
    >
      {/* decorative elements */}
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
  )
}

export default function CertificatesPage() {
  const {
    events, participants, certificates,
    issueCertificate, issueCertificatesInBulk
  } = useTrainings()

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
  const [previewCert, setPreviewCert] = useState<Cert | null>(certificates[0] || null)
  const [pdfLoading, setPdfLoading] = useState(false)
  const certRef = useRef<HTMLDivElement>(null)

  const event = events.find(e => e.id === selectedEventId)
  const eventParts = participants.filter(p => p.eventId === selectedEventId && p.attendanceStatus === 'presente')
  const eventCerts = certificates.filter(c => c.eventId === selectedEventId)

  const handleIssueSingle = (participantId: string) => {
    try {
      const cert = issueCertificate(participantId, selectedEventId)
      setPreviewCert(cert)
    } catch {
      alert('Não foi possível emitir o certificado. Verifique se o participante e evento existem.')
    }
  }

  const handleIssueBulk = () => {
    issueCertificatesInBulk(selectedEventId)
    alert(`Certificados emitidos em lote para ${eventParts.length} participante(s) com presença confirmada!`)
  }

  const handleExportPDF = useCallback(async () => {
    if (!previewCert || !certRef.current) return
    setPdfLoading(true)
    try {
      // Dynamically import to avoid SSR issues
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')

      const canvas = await html2canvas(certRef.current, {
        backgroundColor: '#0f172a',
        scale: 2,
        useCORS: true,
        logging: false,
      })

      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [canvas.width / 2, canvas.height / 2] })
      pdf.addImage(imgData, 'PNG', 0, 0, canvas.width / 2, canvas.height / 2)
      pdf.save(`certificado-${previewCert.participantName.replace(/\s+/g, '-')}-${previewCert.validationCode}.pdf`)
    } catch (err) {
      console.error('PDF generation error:', err)
      alert('Ocorreu um erro ao gerar o PDF. Tente novamente.')
    } finally {
      setPdfLoading(false)
    }
  }, [previewCert])

  const handleExportBulkPDF = useCallback(async () => {
    if (eventCerts.length === 0) { alert('Nenhum certificado para exportar.'); return }
    setPdfLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'px', format: [794, 561] })

      for (let i = 0; i < eventCerts.length; i++) {
        const cert = eventCerts[i]
        const tempDiv = document.createElement('div')
        tempDiv.style.position = 'fixed'
        tempDiv.style.top = '-9999px'
        tempDiv.style.width = '794px'
        tempDiv.innerHTML = certRef.current?.outerHTML || ''
        document.body.appendChild(tempDiv)

        // Swap participant name
        const h2 = tempDiv.querySelector('h2')
        if (h2) h2.textContent = cert.participantName
        const h3 = tempDiv.querySelector('h3')
        if (h3) h3.textContent = cert.eventName

        const canvas = await html2canvas(tempDiv, { backgroundColor: '#0f172a', scale: 1.5, useCORS: true })
        if (i > 0) pdf.addPage()
        const imgData = canvas.toDataURL('image/png')
        pdf.addImage(imgData, 'PNG', 0, 0, 794, 561)
        document.body.removeChild(tempDiv)
      }

      pdf.save(`certificados-lote-${event?.name?.replace(/\s+/g, '-') || 'evento'}.pdf`)
    } catch (err) {
      console.error('Bulk PDF error:', err)
      alert('Erro ao gerar PDFs em lote.')
    } finally {
      setPdfLoading(false)
    }
  }, [eventCerts, event])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Central de Certificados</h1>
          <p className="text-slate-500 text-sm mt-0.5">Emita certificados individuais ou em lote com código de validação único</p>
        </div>
        <div className="flex gap-2">
          {selectedEventId && (
            <>
              <button
                onClick={handleExportBulkPDF}
                disabled={pdfLoading || eventCerts.length === 0}
                className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-xl text-sm font-semibold hover:bg-slate-50 transition-all disabled:opacity-40"
              >
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                PDF Lote
              </button>
              <button
                onClick={handleIssueBulk}
                className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-sm font-bold shadow-md shadow-violet-100 hover:opacity-90 transition-all"
              >
                <Award className="w-4 h-4" /> Emitir Todos em Lote
              </button>
            </>
          )}
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-violet-50 text-violet-600 rounded-xl"><Award className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Emitidos</p>
            <p className="text-2xl font-black text-slate-800">{certificates.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><CheckCircle className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Neste Evento</p>
            <p className="text-2xl font-black text-slate-800">{eventCerts.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Users className="w-5 h-5" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Presentes Elegíveis</p>
            <p className="text-2xl font-black text-slate-800">{eventParts.length}</p>
          </div>
        </div>
      </div>

      {/* Event selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <label className="block text-xs font-bold text-slate-700 mb-2">Evento para Emissão</label>
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

        {/* Left: participants eligible for certificate */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Participantes com Presença Confirmada</h3>

          {eventParts.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Users className="w-10 h-10 text-slate-200 mx-auto mb-2" />
              <p className="text-sm">Nenhum participante com presença confirmada.</p>
              <p className="text-xs mt-1">Vá para Lista de Presença e confirme os participantes.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {eventParts.map(p => {
                const hasCert = eventCerts.some(c => c.participantId === p.id)
                return (
                  <div key={p.id} className="flex items-center justify-between p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{p.name}</p>
                      <p className="text-[10px] text-slate-400">{p.role} · {p.companyName}</p>
                    </div>
                    {hasCert ? (
                      <button
                        onClick={() => setPreviewCert(eventCerts.find(c => c.participantId === p.id)!)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold hover:bg-emerald-100 transition-colors"
                      >
                        <CheckCircle className="w-3 h-3" /> Ver Certificado
                      </button>
                    ) : (
                      <button
                        onClick={() => handleIssueSingle(p.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-[10px] font-bold hover:bg-violet-700 transition-colors"
                      >
                        <Award className="w-3 h-3" /> Emitir
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right: Preview panel */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Pré-Visualização do Certificado</h3>

          {previewCert ? (
            <div className="space-y-4">
              <CertificatePreview cert={previewCert} certRef={certRef} />
              <button
                onClick={handleExportPDF}
                disabled={pdfLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
              >
                {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                {pdfLoading ? 'Gerando PDF...' : 'Exportar PDF Individual'}
              </button>
            </div>
          ) : (
            <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
              <Award className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-medium">Nenhum certificado selecionado</p>
              <p className="text-xs mt-1">Emita um certificado para visualizar o layout</p>
            </div>
          )}
        </div>

      </div>

      {/* All certificates table */}
      {certificates.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Todos os Certificados Emitidos ({certificates.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                  <th className="py-3 px-6">Participante</th>
                  <th className="py-3 px-4">Evento</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Data</th>
                  <th className="py-3 px-4">Carga Horária</th>
                  <th className="py-3 px-4">Código Validação</th>
                  <th className="py-3 px-4 text-right">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {certificates.map(cert => (
                  <tr key={cert.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-3 px-6 font-bold text-slate-800">{cert.participantName}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-[200px] truncate">{cert.eventName}</td>
                    <td className="py-3 px-4 text-slate-600">{cert.clientName}</td>
                    <td className="py-3 px-4 text-slate-500">{new Date(cert.date).toLocaleDateString('pt-BR')}</td>
                    <td className="py-3 px-4 text-slate-500">{cert.hours}h</td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500">{cert.validationCode}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => setPreviewCert(cert)}
                        className="px-3 py-1.5 bg-violet-50 text-violet-700 border border-violet-100 rounded-lg text-[10px] font-bold hover:bg-violet-100 transition-colors"
                      >
                        Visualizar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

    </div>
  )
}
