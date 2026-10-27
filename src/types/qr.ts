import type { CornerDotType, CornerSquareType, DotType, ErrorCorrectionLevel } from 'qr-code-styling'

export type QrExportSize = 256 | 512 | 1024 | 2048 | 4096
export type QrColorMode = 'solid' | 'linear' | 'radial'

export interface QrGradientStop {
  offset: number
  color: string
}

export interface QrColorStyle {
  mode: QrColorMode
  solid: string
  stops: QrGradientStop[]
  rotation: number
}

export interface QrBackgroundStyle {
  color: string
  transparent: boolean
}
export type LogoShape = 'square' | 'circle' | 'rounded'
export type LogoBackgroundMode = 'original' | 'transparent' | 'remove-solid' | 'custom'
export type LogoFit = 'contain' | 'cover'
export type LogoIntegrationStyle = 'seamless-fusion' | 'adaptive-badge' | 'minimal-cutout' | 'premium-brand'
export type LogoContentMode = 'full' | 'custom'
export type LogoSizeMode = 'manual' | 'auto'
export interface QrLogoSettings {
  enabled: boolean
  sourceDataUrl: string | null
  renderedDataUrl: string | null
  fileName: string | null
  mimeType: 'image/png' | 'image/jpeg' | 'image/webp' | null
  width: number
  height: number
  /** Requested visible-logo size relative to the complete QR. Kept as `size` for project compatibility. */
  size: number
  sizeMode: LogoSizeMode
  visibleSize: number
  shape: LogoShape
  fit: LogoFit
  integrationStyle: LogoIntegrationStyle
  backgroundMode: LogoBackgroundMode
  backgroundColor: string
  backgroundOpacity: number
  padding: number
  cornerRadius: number
  autoTrim: boolean
  removalTolerance: number
  showContentBounds: boolean
  adaptiveZone: boolean
  autoFit: boolean
  simplifyDetails: boolean
  contentMode: LogoContentMode
  cropX: number
  cropY: number
  cropWidth: number
  cropHeight: number
}
export type LogoGuardState = 'idle' | 'checking' | 'readable' | 'unreadable' | 'error'

export interface QrDesignSettings {
  bodyPattern: DotType
  cornerSquareStyle: CornerSquareType
  cornerDotStyle: CornerDotType
  exportSize: QrExportSize
  quietZoneModules: 4
  errorCorrectionLevel: ErrorCorrectionLevel
  bodyColor: QrColorStyle
  cornerSquareColor: QrColorStyle
  cornerDotColor: QrColorStyle
  background: QrBackgroundStyle
  logo: QrLogoSettings
}

export const defaultBodyColor: QrColorStyle = { mode: 'solid', solid: '#07110f', stops: [{ offset: 0, color: '#07110f' }, { offset: 1, color: '#0b8f63' }], rotation: 0 }
export const defaultCornerSquareColor: QrColorStyle = { mode: 'solid', solid: '#0b8f63', stops: [{ offset: 0, color: '#07110f' }, { offset: 1, color: '#0b8f63' }], rotation: 0 }
export const defaultCornerDotColor: QrColorStyle = { mode: 'solid', solid: '#07110f', stops: [{ offset: 0, color: '#07110f' }, { offset: 1, color: '#0b8f63' }], rotation: 0 }

export const defaultQrDesignSettings: QrDesignSettings = {
  bodyPattern: 'rounded',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  exportSize: 512,
  quietZoneModules: 4,
  errorCorrectionLevel: 'M',
  bodyColor: defaultBodyColor,
  cornerSquareColor: defaultCornerSquareColor,
  cornerDotColor: defaultCornerDotColor,
  background: { color: '#ffffff', transparent: false },
  logo: { enabled: false, sourceDataUrl: null, renderedDataUrl: null, fileName: null, mimeType: null, width: 0, height: 0, size: 0.2, sizeMode: 'manual', visibleSize: 0.98, shape: 'rounded', fit: 'contain', integrationStyle: 'minimal-cutout', backgroundMode: 'transparent', backgroundColor: '#ffffff', backgroundOpacity: 1, padding: 1, cornerRadius: 18, autoTrim: true, removalTolerance: 24, showContentBounds: false, adaptiveZone: true, autoFit: false, simplifyDetails: false, contentMode: 'full', cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 },
}
