import jsQR from 'jsqr'
import { encodeQrData } from '../qr/encoding'

async function blobImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally { window.setTimeout(() => URL.revokeObjectURL(url), 0) }
}

export async function decodeExportBlob(blob: Blob, expected: string): Promise<boolean> {
  let source: ImageBitmap | HTMLImageElement
  try { source = await createImageBitmap(blob) } catch { source = await blobImage(blob) }
  const width = source.width; const height = source.height
  const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height
  const context = canvas.getContext('2d'); if (!context) return false
  context.drawImage(source, 0, 0)
  if ('close' in source) source.close()
  const pixels = context.getImageData(0, 0, width, height)
  const result = jsQR(pixels.data, width, height, { inversionAttempts: 'attemptBoth' })
  return result?.data === expected || result?.data === encodeQrData(expected)
}
