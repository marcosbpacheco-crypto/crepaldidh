'use client'

import { useState, useRef, useCallback } from 'react'
import { useTrainings } from '../context/TrainingsContext'
import { FileText, Download, Paperclip, Trash2, Plus, ExternalLink, Image, Film, FileSpreadsheet, BookOpen, Loader2 } from 'lucide-react'

const MATERIAL_ICONS = {
  slide: FileText,
  apostila: BookOpen,
  pdf: FileText,
  foto: Image,
  video: Film,
  link: ExternalLink,
  dinamica: FileSpreadsheet,
  checklist: FileSpreadsheet,
  evidencia: Paperclip
}

export default function ReportsPage() {
  const {
    events, participants, feedbacks, materials, reports,
    addMaterial, deleteMaterial, generateEventReport
  } = useTrainings()

  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || '')
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [showReportForm, setShowReportForm] = useState(false)
  const [materialForm, setMaterialForm] = useState({ name: '', type: 'slide' as any, fileUrl: '' })
  const [reportSummary, setReportSummary] = useState('')
  const [reportRecs, setReportRecs] = useState('')
  const [generatingReport, setGeneratingReport] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const reportCardRef = useRef<HTMLDivElement>(null)

  const event = events.find(e => e.id === selectedEventId)
  const eventParticipants = participants.filter(p => p.eventId === selectedEventId)
  const eventFeedbacks = feedbacks.filter(f => f.eventId === selectedEventId)
  const eventMaterials = materials.filter(m => m.eventId === selectedEventId)
  const eventReport = reports.find(r => r.eventId === selectedEventId)

  const presentCount = eventParticipants.filter(p => p.attendanceStatus === 'presente').length
  const avgNps = eventFeedbacks.length > 0
    ? Math.round(eventFeedbacks.reduce((acc, f) => acc + f.nps, 0) / eventFeedbacks.length * 10) / 10
    : 0
  const avgRating = eventFeedbacks.length > 0
    ? Math.round(eventFeedbacks.reduce((acc, f) => acc + f.ratingGeneral, 0) / eventFeedbacks.length * 10) / 10
    : 0

  const handleAddMaterial = (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedEventId) return
    addMaterial({ ...materialForm, eventId: selectedEventId })
    setShowMaterialForm(false)
    setMaterialForm({ name: '', type: 'slide', fileUrl: '' })
  }

  const handleGenerateReport = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneratingReport(true)
    await new Promise(r => setTimeout(r, 800))
    generateEventReport(selectedEventId, reportSummary, reportRecs)
    setGeneratingReport(false)
    setShowReportForm(false)
    setReportSummary('')
    setReportRecs('')
  }

  const handleExportReportPDF = useCallback(async () => {
    if (!reportCardRef.current || !event) return
    setPdfLoading(true)
    try {
      const html2canvas = (await import('html2canvas')).default
      const { jsPDF } = await import('jspdf')
      const canvas = await html2canvas(reportCardRef.current, { backgroundColor: '#ffffff', scale: 2, useCORS: true })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'px', format: 'a4' })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const ratio = canvas.height / canvas.width
      const imgH = pageWidth * ratio
      pdf.addImage(imgData, 'PNG', 0, 0, pageWidth, imgH)
      pdf.save(`relatorio-${event.name.replace(/\s+/g, '-')}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
      alert('Erro ao gerar PDF do relatório.')
    } finally {
      setPdfLoading(false)
    }
  }, [event])

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Materiais & Relatórios</h1>
          <p className="text-slate-500 text-sm mt-0.5">Anexe slides, apostilas e evidências, e gere o relatório final do evento</p>
        </div>
      </div>

      {/* Event Selector */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <label className="block text-xs font-bold text-slate-700 mb-2">Selecione o Evento</label>
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

      {event && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">

          {/* Left: Materials section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Materiais do Evento</h3>
              <button
                onClick={() => setShowMaterialForm(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors shadow-md shadow-violet-100"
              >
                <Plus className="w-3.5 h-3.5" /> Anexar
              </button>
            </div>

            {eventMaterials.length === 0 ? (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                <Paperclip className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-medium">Nenhum material anexado</p>
                <p className="text-xs mt-1">Adicione slides, apostilas, fotos ou evidências</p>
              </div>
            ) : (
              <div className="space-y-2">
                {eventMaterials.map(mat => {
                  const Icon = MATERIAL_ICONS[mat.type] || Paperclip
                  return (
                    <div key={mat.id} className="flex items-center gap-3 p-3.5 bg-slate-50/50 border border-slate-100 rounded-xl group">
                      <div className="p-2 bg-violet-50 text-violet-600 rounded-lg">
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-slate-800 truncate">{mat.name}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{mat.type}</p>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={mat.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => deleteMaterial(mat.id)}
                          className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Right: Report section */}
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-5">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-slate-800 text-sm">Relatório Final do Evento</h3>
              {!eventReport && (
                <button
                  onClick={() => setShowReportForm(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 transition-all shadow-md shadow-violet-100"
                >
                  <FileText className="w-3.5 h-3.5" /> Gerar Relatório
                </button>
              )}
            </div>

            {/* Report Summary Card */}
            {eventReport ? (
              <div className="space-y-4">
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-700">
                  ✅ Relatório gerado em {new Date(eventReport.generatedAt).toLocaleString('pt-BR')}
                </div>

                {/* Auto-generated data card */}
                <div ref={reportCardRef} className="space-y-3 bg-white p-2 rounded-xl">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-3 text-xs">
                    <div className="flex justify-between items-center">
                      <h4 className="font-bold text-slate-700">Dados do Evento</h4>
                      <p className="text-[10px] text-slate-400">CrepaldiDH — Desenvolvimento Humano</p>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{event.name}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-slate-400 block">Cliente</span>
                        <span className="font-semibold text-slate-700">{event.companyName}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Facilitador</span>
                        <span className="font-semibold text-slate-700">{event.facilitator}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Data</span>
                        <span className="font-semibold text-slate-700">{new Date(event.eventDate).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Carga Horária</span>
                        <span className="font-semibold text-slate-700">{event.hoursDuration}h</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">Participantes</span>
                        <span className="font-semibold text-slate-700">{eventParticipants.length} inscritos / {presentCount} presentes</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block">NPS Médio</span>
                        <span className="font-semibold text-slate-700">{avgNps}/10 | Nota: {avgRating}/5</span>
                      </div>
                    </div>
                  </div>

                  {eventReport.executiveSummary && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
                      <h4 className="font-bold text-slate-700">Resumo Executivo</h4>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">{eventReport.executiveSummary}</p>
                    </div>
                  )}

                  {eventReport.recommendations && (
                    <div className="p-4 bg-violet-50/50 rounded-xl border border-violet-100 text-xs space-y-1.5">
                      <h4 className="font-bold text-violet-700">Recomendações Finais</h4>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">{eventReport.recommendations}</p>
                    </div>
                  )}
                </div>

                <button
                  onClick={handleExportReportPDF}
                  disabled={pdfLoading}
                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700 transition-colors disabled:opacity-50"
                >
                  {pdfLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  {pdfLoading ? 'Gerando PDF...' : 'Exportar Relatório em PDF'}
                </button>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 border-2 border-dashed border-slate-200 rounded-2xl">
                <FileText className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                <p className="text-sm font-medium">Relatório não gerado</p>
                <p className="text-xs mt-1">Clique em "Gerar Relatório" para criar o documento final</p>
              </div>
            )}
          </div>

        </div>
      )}

      {/* ADD MATERIAL MODAL */}
      {showMaterialForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowMaterialForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Anexar Material</h2>
            </div>
            <form onSubmit={handleAddMaterial} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nome do Material *</label>
                <input required value={materialForm.name} onChange={e => setMaterialForm({ ...materialForm, name: e.target.value })}
                  placeholder="Ex: Slide — Comunicação Assertiva" className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Tipo</label>
                <select value={materialForm.type} onChange={e => setMaterialForm({ ...materialForm, type: e.target.value as any })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs bg-white">
                  <option value="slide">Slide</option>
                  <option value="apostila">Apostila</option>
                  <option value="pdf">PDF</option>
                  <option value="foto">Foto</option>
                  <option value="video">Vídeo</option>
                  <option value="link">Link</option>
                  <option value="dinamica">Dinâmica</option>
                  <option value="checklist">Checklist</option>
                  <option value="evidencia">Evidência</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">URL ou caminho do arquivo *</label>
                <input required value={materialForm.fileUrl} onChange={e => setMaterialForm({ ...materialForm, fileUrl: e.target.value })}
                  placeholder="https://..." className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowMaterialForm(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit"
                  className="flex-1 py-2 bg-violet-600 text-white rounded-xl text-xs font-bold hover:bg-violet-700">
                  Anexar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* GENERATE REPORT MODAL */}
      {showReportForm && event && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowReportForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-800">Gerar Relatório Final</h2>
              <p className="text-sm text-slate-500">Evento: {event.name}</p>
            </div>
            <form onSubmit={handleGenerateReport} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Resumo Executivo *</label>
                <textarea required rows={4} value={reportSummary} onChange={e => setReportSummary(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-300 resize-none"
                  placeholder="Descreva os principais resultados alcançados, highlights da participação e destaques do dia..." />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Recomendações Finais</label>
                <textarea rows={3} value={reportRecs} onChange={e => setReportRecs(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-300 resize-none"
                  placeholder="Próximos passos sugeridos para o cliente, ações pós-evento e continuidade..." />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowReportForm(false)}
                  className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="submit" disabled={generatingReport}
                  className="flex-1 py-2 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl text-xs font-bold hover:opacity-90 disabled:opacity-50">
                  {generatingReport ? 'Gerando...' : 'Gerar Relatório'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  )
}
