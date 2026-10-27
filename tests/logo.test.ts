import { describe, expect, it } from 'vitest'
import { createQrOptions } from '../src/features/qr/qrOptions'
import { analyzeVisualContent, detectImageMime, findOpaqueBounds, getAdaptiveLogoZone, getFusionMetrics, getLogoQuality, isConservativeLogoSize, logoCoveragePercent, MAX_LOGO_BYTES, removeEdgeConnectedBackground, removeTinyDetachedDetails, resolveLogoCrop, validateLogoBytes, visibleLogoPercent } from '../src/features/qr/logoUtils'
import { defaultQrDesignSettings } from '../src/types/qr'
import { buildLogoFitCandidates } from '../src/features/qr/logoFit'

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

  it('removes tiny detached details only when the explicit processor is invoked', () => {
    const data = new Uint8ClampedArray(20 * 20 * 4)
    for (let y = 5; y < 15; y += 1) for (let x = 5; x < 15; x += 1) data[(y * 20 + x) * 4 + 3] = 255
    data[(1 * 20 + 1) * 4 + 3] = 255
    const result = removeTinyDetachedDetails({ data, width: 20, height: 20 }, 0.01)
    expect(result.data[(1 * 20 + 1) * 4 + 3]).toBe(0)
    expect(result.data[(10 * 20 + 10) * 4 + 3]).toBe(255)
    expect(data[(1 * 20 + 1) * 4 + 3]).toBe(255)
  })

  it('separates container coverage from visible artwork and flags weak sources', () => {
    expect(visibleLogoPercent(0.22, 0.8, 5)).toBeCloseTo(15.84)
    expect(getLogoQuality(64, 64, 180)).toBe('low')
  })

  it('detects visible artwork independently from transparent source dimensions', () => {
    const data = new Uint8ClampedArray(10 * 6 * 4)
    for (let y = 2; y < 5; y += 1) for (let x = 3; x < 8; x += 1) data[(y * 10 + x) * 4 + 3] = 255
    const { analysis } = analyzeVisualContent({ data, width: 10, height: 6 })
    expect(analysis.bounds).toEqual({ x: 3, y: 2, width: 5, height: 3 })
    expect(analysis.visibleRatio).toBeCloseTo(0.25)
    expect(analysis.aspectRatio).toBeCloseTo(5 / 3)
  })

  it('keeps full-brand detection and clamps a reviewable custom crop to source bounds', () => {
    const detected = { x: 100, y: 80, width: 700, height: 600 }
    expect(resolveLogoCrop(1000, 1000, detected, true, 'full', { cropX: 0, cropY: 0, cropWidth: 1, cropHeight: 1 })).toEqual(detected)
    expect(resolveLogoCrop(1000, 1000, detected, true, 'custom', { cropX: .8, cropY: .7, cropWidth: .6, cropHeight: .5 })).toEqual({ x: 800, y: 700, width: 200, height: 300 })
  })

  it('aligns the adaptive logo zone to an odd number of complete modules', () => {
    const zone = getAdaptiveLogoZone(29, 'H', 0.3, 1)
    expect(zone.moduleSpan % 2).toBe(1)
    expect(zone.moduleSpan).toBeLessThanOrEqual(9)
    expect(zone.size).toBeCloseTo(zone.moduleSpan / 29)
    expect(getAdaptiveLogoZone(57, 'L', 0.3, 1).moduleSpan).toBe(3)
  })

  it('reports container and visible fusion coverage separately', () => {
    const metrics = getFusionMetrics(0.3, 0.9, 4, 29, 'H', 1)
    expect(metrics.containerCoverage).toBeGreaterThan(metrics.visibleCoverage / 100)
    expect(metrics.visibleCoverage).toBeLessThan(30)
  })

  it('tests distinct applied logo zones instead of repeated clamped requests', () => {
    const candidates = buildLogoFitCandidates(37, 'M', 1.7)
    expect(candidates.map((candidate) => candidate.appliedSize)).toEqual([...new Set(candidates.map((candidate) => candidate.appliedSize))])
    expect(candidates.length).toBeLessThan(8)
    expect(candidates.every((candidate) => candidate.appliedSize <= 3 / 37)).toBe(true)
    expect(buildLogoFitCandidates(37, 'H', 1).length).toBeGreaterThan(candidates.length)
  })
})
