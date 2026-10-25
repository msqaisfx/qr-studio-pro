import { describe, expect, it } from 'vitest'
import { contrastRatio, minimumContrast, normalizeHex, normalizeStops, toQrColorOptions } from '../src/features/qr/colorUtils'
import { applyColorPreset, colorPresets } from '../src/features/qr/colorPresets'
import { defaultQrDesignSettings, type QrColorStyle } from '../src/types/qr'

describe('color and gradient settings', () => {
  it('validates and normalizes HEX colors', () => {
    expect(normalizeHex('07110F')).toBe('#07110f')
    expect(normalizeHex('#xyzxyz')).toBeNull()
  })

  it('maps linear and radial gradients to qr-code-styling', () => {
    const linear: QrColorStyle = { mode: 'linear', solid: '#000000', stops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#ffffff' }], rotation: 180 }
    const radial = { ...linear, mode: 'radial' as const }
    expect(toQrColorOptions(linear).gradient).toMatchObject({ type: 'linear', rotation: Math.PI })
    expect(toQrColorOptions(radial).gradient).toMatchObject({ type: 'radial', rotation: 0 })
  })

  it('sorts stops and protects the gradient boundaries', () => {
    expect(normalizeStops([{ offset: 0.8, color: '#ffffff' }, { offset: 0.2, color: '#000000' }, { offset: 0.5, color: '#334455' }])).toEqual([
      { offset: 0, color: '#000000' }, { offset: 0.5, color: '#334455' }, { offset: 1, color: '#ffffff' },
    ])
  })

  it('uses relative luminance to estimate worst-case contrast across gradients', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 4)
    const ratio = minimumContrast([{ mode: 'linear', solid: '#000000', rotation: 0, stops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#777777' }] }], '#ffffff')
    expect(ratio).toBeCloseTo(4.478, 2)
    expect(minimumContrast([{ mode: 'solid', solid: '#eeeeee', rotation: 0, stops: [{ offset: 0, color: '#eeeeee' }, { offset: 1, color: '#eeeeee' }] }], '#ffffff')).toBeLessThan(1.2)
  })

  it('applies presets as actual independent QR settings', () => {
    const next = applyColorPreset(defaultQrDesignSettings, colorPresets[4])
    expect(next.bodyColor.mode).toBe('linear')
    expect(next.cornerSquareColor).not.toBe(next.bodyColor)
    expect(next.background.transparent).toBe(false)
  })
})
