import type { LogoBackgroundMode, LogoShape } from '../../types/qr'

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
export const isConservativeLogoSize = (size: number, padding: number) => size <= 0.22 && padding <= 16

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

export async function renderLogo(sourceDataUrl: string, shape: LogoShape, backgroundMode: LogoBackgroundMode, backgroundColor: string, padding: number): Promise<string> {
  const response = await fetch(sourceDataUrl)
  const bitmap = await createImageBitmap(await response.blob())
  const canvas = document.createElement('canvas'); canvas.width = 512; canvas.height = 512
  const context = canvas.getContext('2d')
  if (!context) { bitmap.close(); throw new Error('render') }
  context.save(); createShapePath(context, shape, 0, 0, 512); context.clip()
  if (backgroundMode !== 'transparent') { context.fillStyle = backgroundMode === 'white' ? '#ffffff' : backgroundColor; context.fillRect(0, 0, 512, 512) }
  const inset = Math.round((Math.max(0, Math.min(24, padding)) / 100) * 512)
  const available = 512 - inset * 2
  const scale = Math.min(available / bitmap.width, available / bitmap.height)
  const width = bitmap.width * scale; const height = bitmap.height * scale
  context.drawImage(bitmap, (512 - width) / 2, (512 - height) / 2, width, height)
  context.restore(); bitmap.close()
  return canvas.toDataURL('image/png')
}

function createShapePath(context: CanvasRenderingContext2D, shape: LogoShape, x: number, y: number, size: number) {
  context.beginPath()
  if (shape === 'circle') context.arc(x + size / 2, y + size / 2, size / 2, 0, Math.PI * 2)
  else if (shape === 'rounded') context.roundRect(x, y, size, size, size * 0.18)
  else context.rect(x, y, size, size)
  context.closePath()
}
