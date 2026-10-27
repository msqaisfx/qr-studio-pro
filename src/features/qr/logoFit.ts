import jsQR from 'jsqr'
import type { QrDesignSettings } from '../../types/qr'
import { encodeQrData } from './encoding'
import { getAdaptiveLogoZone } from './logoUtils'
import { prepareQrEngine } from './qrEngine'

export interface LogoFitAttempt { requestedSize: number; appliedSize: number; readable: boolean; renderFingerprint?: string }
export interface LogoFitResult { selectedSize: number | null; attempts: LogoFitAttempt[] }
const requestedCandidates = [0.12, 0.14, 0.17, 0.2, 0.23, 0.26, 0.29, 0.32, 0.35]

const yieldToBrowser = () => new Promise<void>((resolve) => window.setTimeout(resolve, 0))

async function renderAndDecode(payload: string, settings: QrDesignSettings) {
  const { engine } = prepareQrEngine(payload, settings, 768)
  const raw = await engine.getRawData('png')
  if (!(raw instanceof Blob)) return { readable: false, renderFingerprint: '' }
  const digest = await crypto.subtle.digest('SHA-256', await raw.arrayBuffer())
  const renderFingerprint = [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
  const bitmap = await createImageBitmap(raw)
  const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height
  const context = canvas.getContext('2d', { willReadFrequently: true }); if (!context) { bitmap.close(); return { readable: false, renderFingerprint } }
  context.drawImage(bitmap, 0, 0); bitmap.close()
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
  const decoded = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })
  return { readable: decoded?.data === encodeQrData(payload) || decoded?.data === payload, renderFingerprint }
}

/** Tests every candidate independently; no monotonic-readability assumption is made. */
export async function findMaximumReadableLogoSize(payload: string, settings: QrDesignSettings, onAttempt?: (attempt: LogoFitAttempt) => void): Promise<LogoFitResult> {
  const attempts: LogoFitAttempt[] = []
  const rendered = new Set<string>()
  const moduleCount = prepareQrEngine(payload, settings, 256).moduleCount
  const candidates = buildLogoFitCandidates(moduleCount, settings.errorCorrectionLevel, settings.logo.width / Math.max(1, settings.logo.height), false)
  for (const { requestedSize, appliedSize } of candidates) {
    const candidate = { ...settings, logo: { ...settings.logo, size: requestedSize, sizeMode: 'manual' as const } }
    const result = await renderAndDecode(payload, candidate).catch(() => ({ readable: false, renderFingerprint: '' }))
    if (result.renderFingerprint && rendered.has(result.renderFingerprint)) { await yieldToBrowser(); continue }
    if (result.renderFingerprint) rendered.add(result.renderFingerprint)
    const attempt = { requestedSize, appliedSize, ...result }; attempts.push(attempt); onAttempt?.(attempt)
    await yieldToBrowser()
  }
  const passing = attempts.filter((attempt) => attempt.readable)
  return { selectedSize: passing.length ? passing.reduce((best, attempt) => attempt.appliedSize > best.appliedSize ? attempt : best).appliedSize : null, attempts }
}

/** Builds only genuinely distinct applied zones so the decoder never re-tests a clamped duplicate. */
export function buildLogoFitCandidates(moduleCount: number, level: QrDesignSettings['errorCorrectionLevel'], aspectRatio: number, adaptiveZone = true) {
  const seen = new Set<string>()
  return requestedCandidates.flatMap((requestedSize) => {
    const appliedSize = adaptiveZone ? getAdaptiveLogoZone(moduleCount, level, requestedSize, aspectRatio).size : requestedSize
    const key = appliedSize.toFixed(8)
    if (seen.has(key)) return []
    seen.add(key)
    return [{ requestedSize, appliedSize }]
  })
}
