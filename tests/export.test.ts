import { describe, expect, it } from 'vitest'
import { sanitizeFilename } from '../src/features/export/filename'
import { validateExportFile } from '../src/features/export/fileValidation'
import type { ExportFile } from '../src/features/export/exportTypes'

function file(bytes: number[], type: string): ExportFile {
  const blob = new Blob([Uint8Array.from(bytes), new Uint8Array(64)], { type })
  return { blob, scanSource: blob, filename: 'qr', mimeType: type }
}

describe('export filename safety', () => {
  it('prevents traversal and applies the right extension', () => {
    expect(sanitizeFilename('../../private:key?.png', 'svg')).toBe('private-key-.svg')
  })

  it('preserves safe Unicode and replaces empty or reserved names', () => {
    expect(sanitizeFilename('رمز تجريبي', 'png')).toBe('رمز تجريبي.png')
    expect(sanitizeFilename('CON', 'pdf')).toBe('qr-studio-pro.pdf')
    expect(sanitizeFilename('...', 'webp')).toBe('qr-studio-pro.webp')
  })
})

describe('actual file signatures', () => {
  it('accepts PNG, JPEG, WebP, PDF and safe SVG signatures', async () => {
    await expect(validateExportFile(file([137, 80, 78, 71, 13, 10, 26, 10], 'image/png'), 'png')).resolves.toBeUndefined()
    await expect(validateExportFile(file([255, 216, 255], 'image/jpeg'), 'jpeg')).resolves.toBeUndefined()
    await expect(validateExportFile(file([82, 73, 70, 70, 0, 0, 0, 0, 87, 69, 66, 80], 'image/webp'), 'webp')).resolves.toBeUndefined()
    await expect(validateExportFile(file([37, 80, 68, 70, 45], 'application/pdf'), 'pdf')).resolves.toBeUndefined()
    const svg = new Blob([`<svg xmlns="http://www.w3.org/2000/svg"><rect width="20" height="20"/></svg>`], { type: 'image/svg+xml' })
    await expect(validateExportFile({ blob: svg, scanSource: svg, filename: 'x.svg', mimeType: 'image/svg+xml' }, 'svg')).resolves.toBeUndefined()
  })

  it('rejects external resources and scripts in SVG', async () => {
    const svg = new Blob([`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><image href="https://example.com/x.png"/></svg>`], { type: 'image/svg+xml' })
    await expect(validateExportFile({ blob: svg, scanSource: svg, filename: 'x.svg', mimeType: 'image/svg+xml' }, 'svg')).rejects.toThrow('unsafe-svg')
  })
})
