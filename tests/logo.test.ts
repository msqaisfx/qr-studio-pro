import { describe, expect, it } from 'vitest'
import { createQrOptions } from '../src/features/qr/qrOptions'
import { detectImageMime, findOpaqueBounds, getLogoQuality, isConservativeLogoSize, logoCoveragePercent, MAX_LOGO_BYTES, removeEdgeConnectedBackground, validateLogoBytes, visibleLogoPercent } from '../src/features/qr/logoUtils'
import { defaultQrDesignSettings } from '../src/types/qr'

describe('logo security and QR integration', () => {
  it('detects actual PNG, JPEG, and WebP signatures rather than extensions', () => {
    expect(detectImageMime(Uint8Array.from([137,80,78,71,13,10,26,10]))).toBe('image/png')
    expect(detectImageMime(Uint8Array.from([255,216,255,0]))).toBe('image/jpeg')
    expect(detectImageMime(Uint8Array.from([82,73,70,70,0,0,0,0,87,69,66,80]))).toBe('image/webp')
    expect(detectImageMime(new TextEncoder().encode('<svg onload="alert(1)">'))).toBeNull()
  })

  it('rejects unsupported and oversized files', () => {
    expect(() => validateLogoBytes(Uint8Array.from([1,2,3]), 3)).toThrow('unsupported')
    expect(() => validateLogoBytes(Uint8Array.from([137,80,78,71,13,10,26,10]), MAX_LOGO_BYTES + 1)).toThrow('too-large')
  })

  it('estimates coverage and flags settings outside the conservative range', () => {
    expect(logoCoveragePercent(0.18)).toBeCloseTo(3.24)
    expect(isConservativeLogoSize(0.18, 10)).toBe(true)
    expect(isConservativeLogoSize(0.28, 10)).toBe(false)
  })

  it('passes the processed logo to qr-code-styling with hidden background dots', () => {
    const settings = { ...defaultQrDesignSettings, logo: { ...defaultQrDesignSettings.logo, enabled: true, renderedDataUrl: 'data:image/png;base64,AA==' } }
    const options = createQrOptions('test', settings)
    expect(options.image).toBe(settings.logo.renderedDataUrl)
    expect(options.imageOptions).toMatchObject({ hideBackgroundDots: true, imageSize: settings.logo.size, margin: 0 })
  })

  it('omits all image options until a processed logo is available', () => {
    const options = createQrOptions('test', defaultQrDesignSettings)
    expect(options).not.toHaveProperty('image')
    expect(options).not.toHaveProperty('imageOptions')
  })

  it('trims transparent padding around actual artwork', () => {
    const data = new Uint8ClampedArray(4 * 4 * 4)
    data[(1 * 4 + 1) * 4 + 3] = 255; data[(2 * 4 + 2) * 4 + 3] = 255
    expect(findOpaqueBounds({ data, width: 4, height: 4 })).toEqual({ x: 1, y: 1, width: 2, height: 2 })
  })

  it('removes only edge-connected background pixels', () => {
    const data = new Uint8ClampedArray(5 * 5 * 4).fill(255)
    const center = (2 * 5 + 2) * 4; data[center] = 20; data[center + 1] = 40; data[center + 2] = 60
    const result = removeEdgeConnectedBackground({ data, width: 5, height: 5 }, 12)
    expect(result.data[3]).toBe(0)
    expect(result.data[center + 3]).toBe(255)
  })

  it('separates container coverage from visible artwork and flags weak sources', () => {
    expect(visibleLogoPercent(0.22, 0.8, 5)).toBeCloseTo(15.84)
    expect(getLogoQuality(64, 64, 180)).toBe('low')
  })
})
