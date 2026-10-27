import { describe, expect, it, vi } from 'vitest'
import { findSafeRecovery } from '../src/features/export/safeRecovery'
import { defaultQrDesignSettings } from '../src/types/qr'
import type { QualityReport, QualityStatus } from '../src/features/quality/qualityTypes'

const report = (decode: QualityStatus): QualityReport => ({ overall: decode === 'pass' ? 'warning' : decode, checks: [
  { id: 'payload', status: 'pass', evidence: 'payload' }, { id: 'decode', status: decode, evidence: decode === 'pass' ? 'payload-match:jsqr' : 'confirmed-no-decode:jsqr+zxing' },
  { id: 'contrast', status: 'pass', evidence: 'minimum-21' }, { id: 'quietZone', status: 'pass', evidence: '4.00-modules' }, { id: 'logo', status: 'warning', evidence: 'large' },
  { id: 'finder', status: 'pass', evidence: 'protected' }, { id: 'density', status: 'pass', evidence: 'ok' }, { id: 'format', status: 'pass', evidence: 'valid' },
], suggestions: [], metrics: { payloadBytes: 4, moduleCount: 29, modulePixels: 10, quietZoneModules: 4, minimumContrast: 21, logoCoverage: 6, exportSize: 512 }, testedAt: '' })

describe('Smart Safe Recovery', () => {
  it('selects the largest actually decoded size and does not mutate the original', async () => {
    const original = structuredClone(defaultQrDesignSettings); original.logo.enabled = true; original.logo.size = .35; original.logo.padding = 14; original.errorCorrectionLevel = 'M'
    const evaluate = vi.fn(async (candidate: typeof original) => report(candidate.logo.size <= .31 ? 'pass' : 'fail'))
    const proposal = await findSafeRecovery(original, evaluate)
    expect(proposal?.proposed.logo.size).toBe(.31); expect(proposal?.proposed.errorCorrectionLevel).toBe('H'); expect(proposal?.proposed.logo.padding).toBe(8)
    expect(original.logo.size).toBe(.35); expect(original.errorCorrectionLevel).toBe('M'); expect(evaluate).toHaveBeenCalledTimes(5)
  })
  it('does not treat UNKNOWN as a safe repair', async () => {
    const original = structuredClone(defaultQrDesignSettings); original.logo.enabled = true; original.logo.size = .05
    expect(await findSafeRecovery(original, async () => report('unknown'))).toBeNull()
  })
  it('does not accept a payload failure even when decode passed', async () => {
    const original = structuredClone(defaultQrDesignSettings); original.logo.enabled = true; original.logo.size = .05
    const invalid = report('pass'); invalid.checks.find((check) => check.id === 'payload')!.status = 'fail'; invalid.overall = 'fail'
    expect(await findSafeRecovery(original, async () => invalid)).toBeNull()
  })
})
