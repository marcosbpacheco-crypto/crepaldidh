import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx'
import jsPDF from 'jspdf'

let cachedLogoUint8: Uint8Array | null = null
let cachedLogoBase64: string | null = null

async function getLogoUint8(): Promise<Uint8Array> {
  if (cachedLogoUint8) return cachedLogoUint8
  const resp = await fetch('/logo-full.png')
  const blob = await resp.blob()
  const buffer = await blob.arrayBuffer()
  cachedLogoUint8 = new Uint8Array(buffer)
  return cachedLogoUint8
}

async function getLogoBase64(): Promise<string> {
  if (cachedLogoBase64) return cachedLogoBase64
  const resp = await fetch('/logo-full.png')
  const blob = await resp.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      cachedLogoBase64 = reader.result as string
      resolve(cachedLogoBase64!)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

function formatDate(): string {
  const d = new Date()
  const meses = ['janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho', 'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro']
  const cidade = 'Campinas'
  return `${cidade}, ${d.getDate()} de ${meses[d.getMonth()]} de ${d.getFullYear()}`
}

function isHeadingLine(line: string): boolean {
  const trimmed = line.trim()
  if (!trimmed) return false
  if (trimmed.startsWith('CLÁUSULA') || trimmed.startsWith('Cláusula')) return true
  if (['Pelo presente', 'Pela presente'].some(s => trimmed.startsWith(s))) return true
  if (trimmed === trimmed.toUpperCase() && trimmed.length > 5) return true
  return false
}

export async function generateDocx(title: string, content: string): Promise<Blob> {
  const lines = content.split('\n')
  const children: (Paragraph)[] = []

  const logoData = await getLogoUint8()
  children.push(
    new Paragraph({
      children: [
        new ImageRun({
          data: logoData,
          transformation: { width: 180, height: 54 },
          type: 'png',
        }),
      ],
      alignment: AlignmentType.CENTER,
      spacing: { after: 300 },
    })
  )

  children.push(
    new Paragraph({
      children: [new TextRun({ text: title, bold: true, size: 28 })],
      alignment: AlignmentType.CENTER,
      spacing: { after: 400 },
    })
  )

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      children.push(new Paragraph({ spacing: { after: 100 }, children: [] }))
      continue
    }

    if (isHeadingLine(trimmed)) {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, bold: true, size: 22 })],
          spacing: { before: 300, after: 200 },
          heading: HeadingLevel.HEADING_2,
        })
      )
    } else {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: trimmed, size: 20 })],
          spacing: { after: 120 },
          alignment: AlignmentType.JUSTIFIED,
        })
      )
    }
  }

  const doc = new Document({
    title,
    description: title,
    creator: 'CrepaldiDH ERP',
    sections: [{ children, properties: { page: { margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } } } }],
  })

  return await Packer.toBlob(doc)
}

export async function generatePdf(title: string, content: string): Promise<Blob> {
  const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
  const pageWidth = 210
  const margin = 20
  const maxWidth = pageWidth - margin * 2
  const lineHeight = 6

  const logoBase64 = await getLogoBase64()
  const logoWidth = 50
  const logoHeight = 15
  pdf.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight)

  let y = margin + logoHeight + 10

  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'bold')
  pdf.text(title, margin, y, { align: 'left', maxWidth })
  y += 10

  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'normal')

  const lines = content.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) {
      y += 4
      continue
    }

    if (isHeadingLine(trimmed)) {
      if (y + lineHeight + 4 > 297 - margin) {
        pdf.addPage()
        y = margin
        pdf.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight)
        y = margin + logoHeight + 10
      }
      y += 2
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      const wrapped = pdf.splitTextToSize(trimmed, maxWidth)
      wrapped.forEach((w: string) => {
        if (y + lineHeight > 297 - margin) {
          pdf.addPage()
          y = margin
          pdf.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight)
          y = margin + logoHeight + 10
        }
        pdf.text(w, margin, y)
        y += lineHeight
      })
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      y += 2
    } else {
      if (y + lineHeight > 297 - margin) {
        pdf.addPage()
        y = margin
        pdf.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight)
        y = margin + logoHeight + 10
      }
      const wrapped = pdf.splitTextToSize(trimmed, maxWidth)
      wrapped.forEach((w: string) => {
        if (y + lineHeight > 297 - margin) {
          pdf.addPage()
          y = margin
          pdf.addImage(logoBase64, 'PNG', margin, margin, logoWidth, logoHeight)
          y = margin + logoHeight + 10
        }
        pdf.text(w, margin, y)
        y += lineHeight
      })
      y += 1
    }
  }

  y += 10
  pdf.setFontSize(8)
  pdf.setFont('helvetica', 'italic')
  pdf.text(`Documento gerado por CrepaldiDH ERP em ${formatDate()}`, margin, y)

  return pdf.output('blob')
}
