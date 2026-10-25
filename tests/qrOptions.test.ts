import { describe, expect, it } from 'vitest'
import { createQrOptions, QR_SIZE } from '../src/features/qr/qrOptions'
import { defaultQrDesignSettings } from '../src/types/qr'

describe('QR defaults', () => {
  it('uses the supplied content and safe production defaults', () => {
    const options = createQrOptions('https://example.com')
    expect(options.data).toBe('https://example.com')
    expect(options.width).toBe(QR_SIZE)
    expect(options.height).toBe(QR_SIZE)
    expect(options.qrOptions?.errorCorrectionLevel).toBe('M')
    expect(options.backgroundOptions?.color).toBe('#ffffff')
  })

  it('maps the unified design state to qr-code-styling options', () => {
    const settings = { ...defaultQrDesignSettings, bodyPattern: 'dots' as const, cornerSquareStyle: 'square' as const, cornerDotStyle: 'square' as const, exportSize: 1024 as const, errorCorrectionLevel: 'H' as const }
    const options = createQrOptions('مرحبا', settings, 1024, 96)
    expect(options.dotsOptions?.type).toBe('dots')
    expect(options.cornersSquareOptions?.type).toBe('square')
    expect(options.cornersDotOptions?.type).toBe('square')
    expect(options.qrOptions?.errorCorrectionLevel).toBe('H')
    expect(options.margin).toBe(96)
  })
})
