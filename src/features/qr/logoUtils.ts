import type { ErrorCorrectionLevel } from 'qr-code-styling'
import type { LogoShape, QrLogoSettings } from '../../types/qr'

export const MAX_LOGO_BYTES = 5 * 1024 * 1024
export const MAX_LOGO_DIMENSION = 4096
export const supportedLogoTypes = ['image/png', 'image/jpeg', 'image/webp'] as const

export function detectImageMime(bytes: Uint8Array): typeof supportedLogoTypes[number] | null {
  if (bytes.length >= 8 && [137, 80, 78, 71, 13, 10, 26, 10].every((value, index) => bytes[index] === value)) return 'image/png'
  if (bytes.length >= 3 && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return 'image/jpeg'
  if (bytes.length >= 12 && String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' && String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP') return 'image/webp'
  return null
}

export function validateLogoBytes(bytes: Uint8Array, size: number): typeof supportedLogoTypes[number] {
  if (size > MAX_LOGO_BYTES) throw new Error('too-large')
  const mime = detectImageMime(bytes)
  if (!mime) throw new Error('unsupported')
  return mime
}

export const logoCoveragePercent = (size: number) => size * size * 100
export const visibleLogoPercent = (size: number, visibleSize: number, padding: number) => size * visibleSize * (1 - Math.min(24, Math.max(0, padding)) / 50) * 100
export const isConservativeLogoSize = (size: number, padding: number) => size <= 0.24 && padding <= 14

export interface PixelBuffer { data: Uint8ClampedArray; width: number; height: number }
export interface TrimBounds { x: number; y: number; width: number; height: number }
export interface LogoVisualAnalysis {
  bounds: TrimBounds
  detectedBounds: TrimBounds
  sourceWidth: number
  sourceHeight: number
  visibleRatio: number
  aspectRatio: number
  edgeBackgroundRemoved: boolean
}

export function findOpaqueBounds(image: PixelBuffer, alphaThreshold = 8): TrimBounds | null {
  let left = image.width; let top = image.height; let right = -1; let bottom = -1
  for (let y = 0; y < image.height; y += 1) for (let x = 0; x < image.width; x += 1) {
    if (image.data[(y * image.width + x) * 4 + 3] > alphaThreshold) { left = Math.min(left, x); top = Math.min(top, y); right = Math.max(right, x); bottom = Math.max(bottom, y) }
  }
  return right < left ? null : { x: left, y: top, width: right - left + 1, height: bottom - top + 1 }
}

const distance = (data: Uint8ClampedArray, index: number, color: [number, number, number]) => Math.max(Math.abs(data[index] - color[0]), Math.abs(data[index + 1] - color[1]), Math.abs(data[index + 2] - color[2]))

/** Removes only pixels connected to an edge, protecting same-colour artwork enclosed inside the logo. */
export function removeEdgeConnectedBackground(image: PixelBuffer, tolerance: number): PixelBuffer {
  const data = new Uint8ClampedArray(image.data); const visited = new Uint8Array(image.width * image.height); const queue: number[] = []
  const edge: number[] = []
  for (let x = 0; x < image.width; x += 1) edge.push(x, (image.height - 1) * image.width + x)
  for (let y = 1; y < image.height - 1; y += 1) edge.push(y * image.width, y * image.width + image.width - 1)
  const samples = edge.filter((pixel) => data[pixel * 4 + 3] > 0)
  if (!samples.length) return { width: image.width, height: image.height, data }
  const color: [number, number, number] = [0, 1, 2].map((channel) => Math.round(samples.reduce((sum, pixel) => sum + data[pixel * 4 + channel], 0) / samples.length)) as [number, number, number]
  for (const pixel of edge) if (!visited[pixel] && distance(data, pixel * 4, color) <= tolerance) { visited[pixel] = 1; queue.push(pixel) }
  for (let cursor = 0; cursor < queue.length; cursor += 1) {
    const pixel = queue[cursor]; const x = pixel % image.width; const y = Math.floor(pixel / image.width); const index = pixel * 4
    const delta = distance(data, index, color); data[index + 3] = delta <= tolerance * 0.65 ? 0 : Math.round(data[index + 3] * Math.min(1, (delta - tolerance * 0.65) / Math.max(1, tolerance * 0.35)))
    const neighbours = [x > 0 ? pixel - 1 : -1, x + 1 < image.width ? pixel + 1 : -1, y > 0 ? pixel - image.width : -1, y + 1 < image.height ? pixel + image.width : -1]
    for (const next of neighbours) if (next >= 0 && !visited[next] && distance(data, next * 4, color) <= tolerance) { visited[next] = 1; queue.push(next) }
  }
  return { width: image.width, height: image.height, data }
}

/** Removes only tiny, detached opaque components. It is intentionally opt-in. */
export function removeTinyDetachedDetails(image: PixelBuffer, minimumAreaRatio = 0.00035): PixelBuffer {
  const data = new Uint8ClampedArray(image.data); const visited = new Uint8Array(image.width * image.height)
  const minimumArea = Math.max(3, Math.round(image.width * image.height * minimumAreaRatio))
  for (let start = 0; start < image.width * image.height; start += 1) {
    if (visited[start] || data[start * 4 + 3] <= 8) continue
    const component: number[] = []; const queue = [start]; visited[start] = 1
    for (let cursor = 0; cursor < queue.length; cursor += 1) {
      const pixel = queue[cursor]; component.push(pixel); const x = pixel % image.width; const y = Math.floor(pixel / image.width)
      const neighbours = [x > 0 ? pixel - 1 : -1, x + 1 < image.width ? pixel + 1 : -1, y > 0 ? pixel - image.width : -1, y + 1 < image.height ? pixel + image.width : -1]
      for (const next of neighbours) if (next >= 0 && !visited[next] && data[next * 4 + 3] > 8) { visited[next] = 1; queue.push(next) }
    }
    if (component.length < minimumArea) for (const pixel of component) data[pixel * 4 + 3] = 0
  }
  return { width: image.width, height: image.height, data }
}

export function getLogoQuality(width: number, height: number, targetPixels: number) {
  const source = Math.min(width, height)
  return source < targetPixels * 0.75 ? 'low' : source > targetPixels * 2 ? 'high' : 'good'
}

export function analyzeVisualContent(image: PixelBuffer, removeSolid = false, tolerance = 24): { image: PixelBuffer; analysis: LogoVisualAnalysis } {
  const processed = removeSolid ? removeEdgeConnectedBackground(image, tolerance) : { width: image.width, height: image.height, data: new Uint8ClampedArray(image.data) }
  const bounds = findOpaqueBounds(processed) ?? { x: 0, y: 0, width: image.width, height: image.height }
  return {
    image: processed,
    analysis: {
      bounds,
      detectedBounds: bounds,
      sourceWidth: image.width,
      sourceHeight: image.height,
      visibleRatio: (bounds.width * bounds.height) / Math.max(1, image.width * image.height),
      aspectRatio: bounds.width / Math.max(1, bounds.height),
      edgeBackgroundRemoved: removeSolid,
    },
  }
}

export function resolveLogoCrop(width: number, height: number, detected: TrimBounds, autoTrim: boolean, mode: QrLogoSettings['contentMode'], crop: Pick<QrLogoSettings, 'cropX' | 'cropY' | 'cropWidth' | 'cropHeight'>): TrimBounds {
  if (mode !== 'custom') return autoTrim ? detected : { x: 0, y: 0, width, height }
  const x = Math.round(Math.max(0, Math.min(0.95, crop.cropX)) * width)
  const y = Math.round(Math.max(0, Math.min(0.95, crop.cropY)) * height)
  const cropWidth = Math.max(1, Math.round(Math.max(0.05, Math.min(1, crop.cropWidth)) * width))
  const cropHeight = Math.max(1, Math.round(Math.max(0.05, Math.min(1, crop.cropHeight)) * height))
  return { x, y, width: Math.min(cropWidth, width - x), height: Math.min(cropHeight, height - y) }
}

const eccSpans: Record<ErrorCorrectionLevel, number> = { L: 3, M: 5, Q: 7, H: 9 }

/** Returns an odd, module-aligned central span. It never reaches timing/finder regions. */
export function getAdaptiveLogoZone(moduleCount: number, level: ErrorCorrectionLevel, requestedSize: number, aspectRatio = 1) {
  const densityPenalty = moduleCount >= 57 ? 2 : moduleCount >= 41 ? 1 : 0
  const shapePenalty = aspectRatio > 2.2 || aspectRatio < 0.45 ? 2 : aspectRatio > 1.45 || aspectRatio < 0.7 ? 1 : 0
  const safeSpan = Math.max(3, eccSpans[level] - densityPenalty - shapePenalty)
  const requestedSpan = Math.max(3, Math.round(moduleCount * requestedSize))
  let span = Math.min(safeSpan, requestedSpan)
  if (span % 2 === 0) span -= 1
  return { moduleSpan: Math.max(3, span), size: Math.max(3, span) / moduleCount, safeMaximum: safeSpan / moduleCount }
}

export function getFusionMetrics(size: number, visibleSize: number, padding: number, moduleCount: number, level: ErrorCorrectionLevel, aspectRatio = 1) {
  const zone = getAdaptiveLogoZone(moduleCount, level, size, aspectRatio)
  return {
    ...zone,
    containerCoverage: zone.size * zone.size * 100,
    visibleCoverage: zone.size * visibleSize * (1 - Math.min(24, Math.max(0, padding)) / 50) * 100,
  }
}

export const getLogoVisualScale = (visibleSize: number, padding: number) =>
  Math.max(0.01, Math.min(1, visibleSize) * (1 - Math.min(24, Math.max(0, padding)) / 50))

export interface ResolvedLogoGeometry {
  requestedSize: number
  appliedSize: number
  containerSize: number
  maskModuleSpan: number
  safeMaximum: number
  constrained: boolean
  reason: 'manual-exact' | 'auto-tested' | 'library-limit'
}

/** Shared by live preview and all exporters. `size` describes visible artwork rather than its square carrier. */
export function resolveLogoGeometry(logo: Pick<QrLogoSettings, 'size' | 'sizeMode' | 'visibleSize' | 'padding'>, moduleCount: number, level: ErrorCorrectionLevel, aspectRatio = 1): ResolvedLogoGeometry {
  const requestedSize = Math.min(0.35, Math.max(0.05, logo.size))
  const safe = getAdaptiveLogoZone(moduleCount, level, requestedSize, aspectRatio)
  const visualScale = getLogoVisualScale(logo.visibleSize, logo.padding)
  const requestedCarrier = requestedSize / visualScale
  const maximumSpan = Math.max(1, moduleCount - 14)
  let maskModuleSpan = Math.max(1, Math.ceil(requestedCarrier * moduleCount))
  if (maskModuleSpan % 2 === 0) maskModuleSpan += 1
  maskModuleSpan = Math.min(maximumSpan % 2 === 0 ? maximumSpan - 1 : maximumSpan, maskModuleSpan)
  const containerSize = maskModuleSpan / moduleCount
  const libraryLimited = containerSize + 0.0005 < requestedCarrier
  const appliedSize = libraryLimited ? containerSize * visualScale : requestedSize
  return { requestedSize, appliedSize, containerSize, maskModuleSpan, safeMaximum: safe.safeMaximum, constrained: libraryLimited, reason: libraryLimited ? 'library-limit' : logo.sizeMode === 'auto' ? 'auto-tested' : 'manual-exact' }
}

const correctionArea: Record<ErrorCorrectionLevel, number> = { L: .07, M: .15, Q: .25, H: .3 }
/** qr-code-styling's imageSize is an ECC-area fraction, not a linear percentage. */
export const toLibraryImageSize = (geometry: Pick<ResolvedLogoGeometry, 'maskModuleSpan'>, moduleCount: number, level: ErrorCorrectionLevel) =>
  (geometry.maskModuleSpan ** 2 + .01) / (correctionArea[level] * moduleCount ** 2)

export async function readLogoFile(file: File): Promise<{ sourceDataUrl: string; mimeType: typeof supportedLogoTypes[number]; width: number; height: number }> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  const mimeType = validateLogoBytes(bytes, file.size)
  const blob = new Blob([bytes], { type: mimeType })
  let bitmap: ImageBitmap
  try { bitmap = await createImageBitmap(blob) } catch { throw new Error('corrupt') }
  const { width, height } = bitmap
  bitmap.close()
  if (!width || !height || width > MAX_LOGO_DIMENSION || height > MAX_LOGO_DIMENSION) throw new Error('dimensions')
  const sourceDataUrl = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = () => reject(new Error('corrupt')); reader.readAsDataURL(blob) })
  return { sourceDataUrl, mimeType, width, height }
}

export async function renderLogoDetailed(sourceDataUrl: string, options: Pick<QrLogoSettings, 'shape' | 'backgroundMode' | 'backgroundColor' | 'backgroundOpacity' | 'padding' | 'cornerRadius' | 'autoTrim' | 'removalTolerance' | 'visibleSize' | 'fit' | 'simplifyDetails' | 'contentMode' | 'cropX' | 'cropY' | 'cropWidth' | 'cropHeight'>): Promise<{ dataUrl: string; analysis: LogoVisualAnalysis }> {
  const response = await fetch(sourceDataUrl)
  const bitmap = await createImageBitmap(await response.blob())
  const source = document.createElement('canvas'); source.width = bitmap.width; source.height = bitmap.height
  const sourceContext = source.getContext('2d', { willReadFrequently: true }); if (!sourceContext) { bitmap.close(); throw new Error('render') }
  sourceContext.drawImage(bitmap, 0, 0); bitmap.close()
  let detected = analyzeVisualContent(sourceContext.getImageData(0, 0, source.width, source.height), options.backgroundMode === 'remove-solid', options.removalTolerance)
  if (options.simplifyDetails) detected = analyzeVisualContent(removeTinyDetachedDetails(detected.image))
  if (options.backgroundMode === 'remove-solid' || options.simplifyDetails) {
    const output = sourceContext.createImageData(detected.image.width, detected.image.height); output.data.set(detected.image.data)
    sourceContext.putImageData(output, 0, 0)
  }
  const crop = resolveLogoCrop(source.width, source.height, detected.analysis.detectedBounds, options.autoTrim, options.contentMode, options)
  const canvas = document.createElement('canvas'); canvas.width = 768; canvas.height = 768
  const context = canvas.getContext('2d')
  if (!context) throw new Error('render')
  context.imageSmoothingEnabled = true; context.imageSmoothingQuality = 'high'
  context.save(); createShapePath(context, options.shape, 0, 0, 768, options.cornerRadius); context.clip()
  if (options.backgroundMode === 'custom') { context.globalAlpha = options.backgroundOpacity; context.fillStyle = options.backgroundColor; context.fillRect(0, 0, 768, 768); context.globalAlpha = 1 }
  const inset = Math.round((Math.max(0, Math.min(24, options.padding)) / 100) * 768)
  const visible = Math.max(0.45, Math.min(1, options.visibleSize)); const available = (768 - inset * 2) * visible
  const scale = (options.fit === 'cover' ? Math.max : Math.min)(available / crop.width, available / crop.height)
  const width = crop.width * scale; const height = crop.height * scale
  context.drawImage(source, crop.x, crop.y, crop.width, crop.height, (768 - width) / 2, (768 - height) / 2, width, height)
  context.restore()
  return { dataUrl: canvas.toDataURL('image/png'), analysis: { ...detected.analysis, bounds: crop, visibleRatio: (crop.width * crop.height) / Math.max(1, source.width * source.height), aspectRatio: crop.width / Math.max(1, crop.height) } }
}

export async function renderLogo(sourceDataUrl: string, options: Pick<QrLogoSettings, 'shape' | 'backgroundMode' | 'backgroundColor' | 'backgroundOpacity' | 'padding' | 'cornerRadius' | 'autoTrim' | 'removalTolerance' | 'visibleSize' | 'fit' | 'simplifyDetails' | 'contentMode' | 'cropX' | 'cropY' | 'cropWidth' | 'cropHeight'>): Promise<string> {
  return (await renderLogoDetailed(sourceDataUrl, options)).dataUrl
}

function createShapePath(context: CanvasRenderingContext2D, shape: LogoShape, x: number, y: number, size: number, cornerRadius: number) {
  context.beginPath()
  if (shape === 'circle') context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  else if (shape === 'rounded') context.roundRect(x, y, size, size, size * Math.max(0, Math.min(50, cornerRadius)) / 100)
  else context.rect(x, y, size, size)
  context.closePath()
}
