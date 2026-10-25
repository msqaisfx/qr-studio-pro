import type { ExportFile, ExportFormat } from './exportTypes'

const startsWith = (data: Uint8Array, signature: number[]) => signature.every((byte, index) => data[index] === byte)

export async function validateExportFile(file: ExportFile, format: ExportFormat): Promise<void> {
  if (file.blob.size < 32) throw new Error('file-too-small')
  const data = new Uint8Array(await file.blob.slice(0, 32).arrayBuffer())
  if (format === 'png' && !startsWith(data, [137, 80, 78, 71, 13, 10, 26, 10])) throw new Error('bad-png')
  if (format === 'jpeg' && !startsWith(data, [255, 216, 255])) throw new Error('bad-jpeg')
  if (format === 'webp' && (new TextDecoder().decode(data.slice(0, 4)) !== 'RIFF' || new TextDecoder().decode(data.slice(8, 12)) !== 'WEBP')) throw new Error('bad-webp')
  if (format === 'pdf' && new TextDecoder().decode(data.slice(0, 5)) !== '%PDF-') throw new Error('bad-pdf')
  if (format === 'svg') {
    const text = await file.blob.text()
    if (!/<svg[\s>]/i.test(text) || /<script[\s>]/i.test(text) || /\b(?:href|src)=["']https?:/i.test(text)) throw new Error('unsafe-svg')
  }
  if (file.blob.type && file.blob.type !== file.mimeType) throw new Error('mime-mismatch')
}
