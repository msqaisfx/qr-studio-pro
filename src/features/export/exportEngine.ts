import type { QrDesignSettings } from '../../types/qr'
import { prepareQrEngine } from '../qr/qrEngine'
import { sanitizeFilename } from './filename'
import { exportMimeTypes, type ExportFile, type ExportOptions } from './exportTypes'

const mmToPt = (mm: number) => mm * 72 / 25.4
const pageSizes = { a4: [595.28, 841.89], letter: [612, 792], square: [612, 612] } as const

function settingsWithBackground(settings: QrDesignSettings, options: ExportOptions): QrDesignSettings {
  if (options.backgroundMode === 'design') return settings
  if (options.backgroundMode === 'transparent') return { ...settings, background: { ...settings.background, transparent: true } }
  return { ...settings, background: { color: options.backgroundMode === 'white' ? '#ffffff' : options.backgroundColor, transparent: false } }
}

async function asBlob(value: Blob | Uint8Array | null, type: string): Promise<Blob> {
  if (!value) throw new Error('empty-export')
  if (value instanceof Blob) return value
  return new Blob([new Uint8Array(value)], { type })
}

async function canvasEncode(png: Blob, format: 'webp' | 'jpeg', quality: number, flattenColor?: string): Promise<Blob> {
  const bitmap = await createImageBitmap(png)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = bitmap.width
    canvas.height = bitmap.height
    const context = canvas.getContext('2d')
    if (!context) throw new Error('canvas-unavailable')
    if (flattenColor) { context.fillStyle = flattenColor; context.fillRect(0, 0, canvas.width, canvas.height) }
    context.drawImage(bitmap, 0, 0)
    const type = format === 'webp' ? 'image/webp' : 'image/jpeg'
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality))
    if (!blob || blob.type !== type) throw new Error('format-not-supported')
    return blob
  } finally { bitmap.close() }
}

async function titlePng(title: string): Promise<Uint8Array | null> {
  if (!title.trim()) return null
  const canvas = document.createElement('canvas'); canvas.width = 1800; canvas.height = 150
  const context = canvas.getContext('2d'); if (!context) return null
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
  context.fillStyle = '#111827'; context.font = '600 54px sans-serif'; context.textAlign = 'center'; context.textBaseline = 'middle'
  context.direction = /[\u0600-\u06ff]/.test(title) ? 'rtl' : 'ltr'; context.fillText(title.slice(0, 120), canvas.width / 2, canvas.height / 2, 1700)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'))
  return blob ? new Uint8Array(await blob.arrayBuffer()) : null
}

async function createPdf(png: Blob, options: ExportOptions): Promise<Blob> {
  const { PDFDocument } = await import('pdf-lib')
  const document = await PDFDocument.create()
  const [pageWidth, pageHeight] = pageSizes[options.pdfPageSize]
  const page = document.addPage([pageWidth, pageHeight])
  const qr = await document.embedPng(new Uint8Array(await png.arrayBuffer()))
  const margin = mmToPt(Math.min(50, Math.max(5, options.pdfMarginMm || 18)))
  const requested = mmToPt(Math.min(190, Math.max(30, options.pdfQrSizeMm || 120)))
  const titleSpace = options.pdfTitle.trim() ? 52 : 0
  const size = Math.max(36, Math.min(requested, pageWidth - margin * 2, pageHeight - margin * 2 - titleSpace))
  const x = (pageWidth - size) / 2
  const y = (pageHeight - size - titleSpace) / 2
  page.drawImage(qr, { x, y, width: size, height: size })
  const title = await titlePng(options.pdfTitle)
  if (title) {
    const titleImage = await document.embedPng(title)
    page.drawImage(titleImage, { x: margin, y: y + size + 12, width: pageWidth - margin * 2, height: 30 })
  }
  document.setProducer('QR Studio Pro'); document.setCreator('QR Studio Pro')
  return new Blob([new Uint8Array(await document.save())], { type: 'application/pdf' })
}

export async function createExportFile(payload: string, settings: QrDesignSettings, options: ExportOptions): Promise<ExportFile> {
  if (!payload.trim()) throw new Error('empty-payload')
  await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))
  const effective = settingsWithBackground(settings, options)
  const renderSize = options.format === 'pdf' ? Math.max(2048, options.resolution) : options.resolution
  const { engine } = prepareQrEngine(payload, effective, renderSize)
  const filename = sanitizeFilename(options.filename, options.format)

  if (options.format === 'svg') {
    const blob = await asBlob(await engine.getRawData('svg'), exportMimeTypes.svg)
    return { blob, scanSource: blob, filename, mimeType: exportMimeTypes.svg, width: renderSize, height: renderSize, note: settings.logo.enabled ? 'raster-logo' : undefined }
  }
  const png = await asBlob(await engine.getRawData('png'), exportMimeTypes.png)
  if (options.format === 'png') return { blob: png, scanSource: png, filename, mimeType: exportMimeTypes.png, width: renderSize, height: renderSize }
  if (options.format === 'pdf') return { blob: await createPdf(png, options), scanSource: png, filename, mimeType: exportMimeTypes.pdf, note: 'raster-pdf' }

  const flatten = options.format === 'jpeg'
    ? (options.backgroundMode === 'custom' ? options.backgroundColor : options.backgroundMode === 'design' && !settings.background.transparent ? settings.background.color : '#ffffff')
    : undefined
  const blob = await canvasEncode(png, options.format, options.quality, flatten)
  return { blob, scanSource: blob, filename, mimeType: exportMimeTypes[options.format], width: renderSize, height: renderSize }
}

export function downloadExportFile(file: ExportFile): void {
  const url = URL.createObjectURL(file.blob)
  const anchor = document.createElement('a'); anchor.href = url; anchor.download = file.filename; anchor.rel = 'noopener'; anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
