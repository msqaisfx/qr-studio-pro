import jsQR from 'jsqr'
import type { QrDesignSettings } from '../../types/qr'
import { encodeQrData } from '../qr/encoding'
import { prepareQrEngine } from '../qr/qrEngine'
import { buildQualityReport, type RenderEvidence } from './qualityAnalysis'
import type { QualityReport } from './qualityTypes'

async function imageSource(blob: Blob): Promise<ImageBitmap | HTMLImageElement> {
  try { return await createImageBitmap(blob) } catch {
    const url = URL.createObjectURL(blob)
    const image = new Image(); image.src = url
    try { await image.decode(); return image } finally { window.setTimeout(() => URL.revokeObjectURL(url), 0) }
  }
}

export async function inspectQrImage(blob: Blob, payload: string, moduleCount: number, exportSize: number, formatValid: boolean | null): Promise<RenderEvidence> {
  const source = await imageSource(blob)
  const canvas = document.createElement('canvas'); canvas.width = source.width; canvas.height = source.height
  const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) throw new Error('missing-canvas')
  // Decode transparent exports against a known neutral surface, while contrast remains UNKNOWN elsewhere.
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
  context.drawImage(source, 0, 0); if ('close' in source) source.close()
  const image = context.getImageData(0, 0, canvas.width, canvas.height)
  const decoded = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })
  const corner = [image.data[0], image.data[1], image.data[2], image.data[3]]
  let minX = image.width; let minY = image.height; let maxX = -1; let maxY = -1
  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
    const index = (y * image.width + x) * 4
    const difference = Math.abs(image.data[index] - corner[0]) + Math.abs(image.data[index + 1] - corner[1]) + Math.abs(image.data[index + 2] - corner[2]) + Math.abs(image.data[index + 3] - corner[3])
    if (difference > 80) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y) }
  }
  const foregroundWidth = maxX >= minX ? maxX - minX + 1 : 0
  const modulePixels = foregroundWidth ? foregroundWidth / moduleCount : null
  const margin = foregroundWidth ? Math.min(minX, minY, image.width - 1 - maxX, image.height - 1 - maxY) : null
  const quietZoneModules = margin !== null && modulePixels ? margin / modulePixels : null
  return { decoded: Boolean(decoded), payloadMatches: decoded ? decoded.data === payload || decoded.data === encodeQrData(payload) : false, moduleCount, modulePixels, quietZoneModules, formatValid, exportSize }
}

export async function runQualityGuard(payload: string, settings: QrDesignSettings, size = 768, formatValid: boolean | null = null, existingBlob?: Blob): Promise<QualityReport> {
  if (!payload.trim()) return buildQualityReport(payload, settings, { decoded: false, payloadMatches: false, moduleCount: null, modulePixels: null, quietZoneModules: null, formatValid, exportSize: size })
  const prepared = prepareQrEngine(payload, settings, size)
  const raw = existingBlob ?? await prepared.engine.getRawData('png')
  if (!(raw instanceof Blob)) return buildQualityReport(payload, settings, { decoded: null, payloadMatches: null, moduleCount: prepared.moduleCount, modulePixels: null, quietZoneModules: null, formatValid, exportSize: size })
  try { return buildQualityReport(payload, settings, await inspectQrImage(raw, payload, prepared.moduleCount, size, formatValid)) }
  catch { return buildQualityReport(payload, settings, { decoded: null, payloadMatches: null, moduleCount: prepared.moduleCount, modulePixels: null, quietZoneModules: null, formatValid, exportSize: size }) }
}
