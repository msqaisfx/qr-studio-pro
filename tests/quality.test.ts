import { describe, expect, it } from 'vitest'
import { buildQualityReport, contrastEvidence, type RenderEvidence } from '../src/features/quality/qualityAnalysis'
import { defaultQrDesignSettings, type QrDesignSettings } from '../src/types/qr'

const goodEvidence: RenderEvidence = { decoded: true, payloadMatches: true, moduleCount: 29, modulePixels: 12, quietZoneModules: 4.1, formatValid: true, exportSize: 512 }
const settings = (): QrDesignSettings => structuredClone(defaultQrDesignSettings)

describe('QR Scan Guard quality states', () => {
  it('returns PASS only when every required check has evidence', () => {
    const report = buildQualityReport('https://example.com', settings(), goodEvidence)
    expect(report.overall).toBe('pass')
    expect(report.checks.every((check) => check.status === 'pass')).toBe(true)
  })

  it('returns FAIL for an intentional decoder mismatch', () => {
    const report = buildQualityReport('مرحبا', settings(), { ...goodEvidence, decoded: true, payloadMatches: false })
    expect(report.overall).toBe('fail')
    expect(report.checks.find((check) => check.id === 'decode')?.status).toBe('fail')
  })

  it('returns FAIL for an image-measured unsafe quiet zone', () => {
    const report = buildQualityReport('quiet-zone', settings(), { ...goodEvidence, quietZoneModules: 2.2 })
    expect(report.overall).toBe('fail')
    expect(report.checks.find((check) => check.id === 'quietZone')?.status).toBe('fail')
  })

  it('returns UNKNOWN for transparent contrast instead of claiming PASS', () => {
    const transparent = settings(); transparent.background.transparent = true
    const report = buildQualityReport('transparent', transparent, goodEvidence)
    expect(report.overall).toBe('unknown')
    expect(report.checks.find((check) => check.id === 'contrast')?.status).toBe('unknown')
    expect(report.suggestions).toContain('whiteBackground')
  })

  it('warns for risky logo coverage and suggests explicit fixes', () => {
    const risky = settings(); risky.logo.enabled = true; risky.logo.size = 0.3; risky.logo.padding = 20; risky.errorCorrectionLevel = 'M'
    const report = buildQualityReport('logo', risky, goodEvidence)
    expect(report.overall).toBe('warning')
    expect(report.suggestions).toEqual(expect.arrayContaining(['reduceLogo', 'eccH']))
  })

  it('fails dense output below three pixels per module', () => {
    const report = buildQualityReport('dense', settings(), { ...goodEvidence, moduleCount: 177, modulePixels: 2.1, exportSize: 256 })
    expect(report.checks.find((check) => check.id === 'density')?.status).toBe('fail')
    expect(report.suggestions).toContain('increaseSize')
  })

  it('analyzes every correction level and supported raster size without an unknown density result', () => {
    for (const level of ['L', 'M', 'Q', 'H'] as const) for (const size of [256, 512, 1024, 2048, 4096]) {
      const variant = settings(); variant.errorCorrectionLevel = level
      const report = buildQualityReport('matrix', variant, { ...goodEvidence, exportSize: size, modulePixels: size / 37, moduleCount: 29 })
      expect(report.checks.find((check) => check.id === 'density')?.status).not.toBe('unknown')
    }
  })

  it('uses an advisory multi-color contrast minimum', () => {
    const low = settings(); low.bodyColor = { mode: 'linear', solid: '#000000', rotation: 0, stops: [{ offset: 0, color: '#111111' }, { offset: 1, color: '#eeeeee' }] }
    expect(contrastEvidence(low).status).toBe('fail')
  })
})
