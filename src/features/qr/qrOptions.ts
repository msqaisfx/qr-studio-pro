import type { Options } from 'qr-code-styling'
import type { QrDesignSettings } from '../../types/qr'
import { toQrColorOptions } from './colorUtils'

export const QR_SIZE = 300

export function createQrOptions(data: string, settings?: QrDesignSettings, size = QR_SIZE, margin = 12): Options {
  return {
    width: size,
    height: size,
    type: 'svg',
    data,
    margin,
    qrOptions: { errorCorrectionLevel: settings?.errorCorrectionLevel ?? 'M' },
    dotsOptions: { ...toQrColorOptions(settings?.bodyColor ?? { mode: 'solid', solid: '#07110f', stops: [], rotation: 0 }), type: settings?.bodyPattern ?? 'rounded' },
    cornersSquareOptions: { ...toQrColorOptions(settings?.cornerSquareColor ?? { mode: 'solid', solid: '#0b8f63', stops: [], rotation: 0 }), type: settings?.cornerSquareStyle ?? 'extra-rounded' },
    cornersDotOptions: { ...toQrColorOptions(settings?.cornerDotColor ?? { mode: 'solid', solid: '#07110f', stops: [], rotation: 0 }), type: settings?.cornerDotStyle ?? 'dot' },
    backgroundOptions: { color: settings?.background.transparent ? 'rgba(255,255,255,0)' : (settings?.background.color ?? '#ffffff') },
    ...(settings?.logo.enabled && settings.logo.renderedDataUrl ? { image: settings.logo.renderedDataUrl, imageOptions: { hideBackgroundDots: true, imageSize: settings.logo.size, margin: 0, saveAsBlob: true } } : {}),
  }
}
