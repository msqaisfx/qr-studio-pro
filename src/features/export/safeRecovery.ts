import type { QrDesignSettings } from '../../types/qr'
import type { QualityReport } from '../quality/qualityTypes'

export interface SafeRecoveryAttempt {
  size: number
  errorCorrectionLevel: QrDesignSettings['errorCorrectionLevel']
  padding: number
  contrastAdjusted: boolean
  status: QualityReport['overall'] | 'error'
  evidence: string
}

export interface SafeRecoveryProposal {
  original: QrDesignSettings
  proposed: QrDesignSettings
  attempts: SafeRecoveryAttempt[]
  report: QualityReport
}

export type SafeRecoveryEvaluator = (settings: QrDesignSettings) => Promise<QualityReport>

const hasRequiredEvidence = (report: QualityReport) => {
  const required = ['payload', 'decode', 'quietZone', 'format'] as const
  return (report.overall === 'pass' || report.overall === 'warning')
    && required.every((id) => report.checks.find((check) => check.id === id)?.status === 'pass')
    && report.checks.every((check) => check.status !== 'fail' && check.status !== 'unknown')
}

const evidenceFor = (report: QualityReport) => report.checks
  .filter((check) => check.id === 'decode' || check.id === 'payload' || check.id === 'quietZone' || check.id === 'contrast')
  .map((check) => `${check.id}:${check.status}:${check.evidence}`).join('|')

function candidateSettings(original: QrDesignSettings, size: number, optimizeContrast: boolean): QrDesignSettings {
  const background = optimizeContrast ? { color: '#ffffff', transparent: false } : structuredClone(original.background)
  const safeColor = { mode: 'solid' as const, solid: '#000000', rotation: 0, stops: [{ offset: 0, color: '#000000' }, { offset: 1, color: '#000000' }] }
  return {
    ...structuredClone(original),
    errorCorrectionLevel: 'H',
    background,
    bodyColor: optimizeContrast ? safeColor : structuredClone(original.bodyColor),
    cornerSquareColor: optimizeContrast ? safeColor : structuredClone(original.cornerSquareColor),
    cornerDotColor: optimizeContrast ? safeColor : structuredClone(original.cornerDotColor),
    logo: { ...structuredClone(original.logo), size, sizeMode: 'manual', autoFit: false, padding: Math.min(original.logo.padding, 8) },
  }
}

/** Finds the largest actually decoded logo size without mutating the user's settings. */
export async function findSafeRecovery(original: QrDesignSettings, evaluate: SafeRecoveryEvaluator): Promise<SafeRecoveryProposal | null> {
  const attempts: SafeRecoveryAttempt[] = []
  const maximum = Math.round(Math.min(0.35, original.logo.size) * 100)
  for (const optimizeContrast of [false, true]) {
    for (let percent = maximum; percent >= 5; percent -= 1) {
      const candidate = candidateSettings(original, percent / 100, optimizeContrast)
      try {
        const report = await evaluate(candidate)
        attempts.push({ size: candidate.logo.size, errorCorrectionLevel: candidate.errorCorrectionLevel, padding: candidate.logo.padding, contrastAdjusted: optimizeContrast, status: report.overall, evidence: evidenceFor(report) })
        if (hasRequiredEvidence(report)) return { original: structuredClone(original), proposed: candidate, attempts, report }
      } catch (error) {
        attempts.push({ size: candidate.logo.size, errorCorrectionLevel: candidate.errorCorrectionLevel, padding: candidate.logo.padding, contrastAdjusted: optimizeContrast, status: 'error', evidence: error instanceof Error ? error.message : 'evaluation-error' })
      }
    }
  }
  return null
}
