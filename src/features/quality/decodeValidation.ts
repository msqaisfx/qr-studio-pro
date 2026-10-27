import jsQR from 'jsqr'
import { encodeQrData } from '../qr/encoding'

export type DecodeStatus = 'pass' | 'fail' | 'unknown'

export interface DecodeVerification {
  status: DecodeStatus
  matchedPayload: string | null
  evidence: string
  readers: string[]
  attempts: number
}

export function classifyDecodeResults(expected: string, results: Array<{ reader: string; value: string | null; completed: boolean }>): DecodeVerification {
  const accepted = new Set([expected, encodeQrData(expected)])
  const match = results.find((result) => result.value !== null && accepted.has(result.value))
  const readers = [...new Set(results.filter((result) => result.completed).map((result) => result.reader))]
  if (match) return { status: 'pass', matchedPayload: match.value, evidence: `payload-match:${match.reader};readers:${readers.join('+')}`, readers, attempts: results.length }
  const mismatch = results.find((result) => result.value !== null)
  if (mismatch) return { status: 'fail', matchedPayload: mismatch.value, evidence: `payload-mismatch:${mismatch.reader}`, readers, attempts: results.length }
  if (readers.length >= 2) return { status: 'fail', matchedPayload: null, evidence: `confirmed-no-decode:${readers.join('+')}`, readers, attempts: results.length }
  return { status: 'unknown', matchedPayload: null, evidence: readers.length ? `single-reader-inconclusive:${readers[0]}` : 'decoder-unavailable', readers, attempts: results.length }
}

const candidateSizes = (width: number, height: number) => {
  const maximum = Math.max(width, height)
  return [...new Set([maximum, 1600, 1200, 1024, 768, 512].filter((size) => size <= maximum && size >= 256))]
}

function rasterize(source: CanvasImageSource & { width: number; height: number }, longestSide: number, smoothing: boolean): HTMLCanvasElement {
  const scale = Math.min(1, longestSide / Math.max(source.width, source.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(source.width * scale)); canvas.height = Math.max(1, Math.round(source.height * scale))
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('missing-canvas')
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, canvas.width, canvas.height)
  context.imageSmoothingEnabled = smoothing; context.imageSmoothingQuality = 'high'
  context.drawImage(source, 0, 0, canvas.width, canvas.height)
  return canvas
}

async function decodeWithZxing(canvas: HTMLCanvasElement): Promise<string | null> {
  const { BrowserQRCodeReader } = await import('@zxing/browser')
  const reader = new BrowserQRCodeReader()
  try { return (await reader.decodeFromCanvas(canvas)).getText() }
  catch { return null }
}

/** Two independent readers, multiple raster sizes, and both crisp/smoothed resampling reduce false negatives. */
export async function verifyQrImage(source: CanvasImageSource & { width: number; height: number }, expected: string): Promise<DecodeVerification> {
  const results: Array<{ reader: string; value: string | null; completed: boolean }> = []
  const canvases: HTMLCanvasElement[] = []
  for (const size of candidateSizes(source.width, source.height)) {
    for (const smoothing of [false, true]) {
      const canvas = rasterize(source, size, smoothing); canvases.push(canvas)
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) continue
      const image = context.getImageData(0, 0, canvas.width, canvas.height)
      const decoded = jsQR(image.data, image.width, image.height, { inversionAttempts: 'attemptBoth' })
      results.push({ reader: 'jsqr', value: decoded?.data ?? null, completed: true })
    }
  }
  try {
    for (const canvas of canvases) {
      results.push({ reader: 'zxing', value: await decodeWithZxing(canvas), completed: true })
      if (results.at(-1)?.value !== null) break
    }
  } catch { results.push({ reader: 'zxing', value: null, completed: false }) }
  return classifyDecodeResults(expected, results)
}
