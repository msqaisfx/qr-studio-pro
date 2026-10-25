export type ExportFormat = 'png' | 'svg' | 'webp' | 'jpeg' | 'pdf'
export type RasterResolution = 256 | 512 | 1024 | 2048 | 4096
export type ExportBackgroundMode = 'design' | 'transparent' | 'white' | 'custom'
export type PdfPageSize = 'a4' | 'letter' | 'square'

export interface ExportOptions {
  format: ExportFormat
  resolution: RasterResolution
  quality: number
  backgroundMode: ExportBackgroundMode
  backgroundColor: string
  filename: string
  pdfPageSize: PdfPageSize
  pdfMarginMm: number
  pdfQrSizeMm: number
  pdfTitle: string
}

export interface ExportFile {
  blob: Blob
  scanSource: Blob
  filename: string
  mimeType: string
  width?: number
  height?: number
  note?: 'raster-logo' | 'raster-pdf'
}

export const defaultExportOptions: ExportOptions = {
  format: 'png',
  resolution: 512,
  quality: 0.92,
  backgroundMode: 'design',
  backgroundColor: '#ffffff',
  filename: 'qr-studio-pro',
  pdfPageSize: 'a4',
  pdfMarginMm: 18,
  pdfQrSizeMm: 120,
  pdfTitle: '',
}

export const exportMimeTypes: Record<ExportFormat, string> = {
  png: 'image/png', svg: 'image/svg+xml', webp: 'image/webp', jpeg: 'image/jpeg', pdf: 'application/pdf',
}
