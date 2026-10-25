import type { CornerDotType, CornerSquareType, DotType, ErrorCorrectionLevel } from 'qr-code-styling'

export type QrExportSize = 256 | 512 | 1024 | 2048

export interface QrDesignSettings {
  bodyPattern: DotType
  cornerSquareStyle: CornerSquareType
  cornerDotStyle: CornerDotType
  exportSize: QrExportSize
  quietZoneModules: 4
  errorCorrectionLevel: ErrorCorrectionLevel
}

export const defaultQrDesignSettings: QrDesignSettings = {
  bodyPattern: 'rounded',
  cornerSquareStyle: 'extra-rounded',
  cornerDotStyle: 'dot',
  exportSize: 512,
  quietZoneModules: 4,
  errorCorrectionLevel: 'M',
}
