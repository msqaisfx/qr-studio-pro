import type { Options } from 'qr-code-styling'
import type { QrDesignSettings } from '../../types/qr'

export const QR_SIZE = 300

export function createQrOptions(data: string, settings?: QrDesignSettings, size = QR_SIZE, margin = 12): Options {
  return {
    width: size,
    height: size,
    type: 'svg',
    data,
    margin,
    qrOptions: { errorCorrectionLevel: settings?.errorCorrectionLevel ?? 'M' },
    dotsOptions: { color: '#07110f', type: settings?.bodyPattern ?? 'rounded' },
    cornersSquareOptions: { color: '#14b87a', type: settings?.cornerSquareStyle ?? 'extra-rounded' },
    cornersDotOptions: { color: '#07110f', type: settings?.cornerDotStyle ?? 'dot' },
    backgroundOptions: { color: '#ffffff' },
  }
}
