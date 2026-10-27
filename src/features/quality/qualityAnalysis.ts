import type { QrDesignSettings } from '../../types/qr'
import { minimumContrast } from '../qr/colorUtils'
import { resolveLogoGeometry } from '../qr/logoUtils'
import type { QualityCheck, QualityReport, QualityStatus, QualitySuggestion } from './qualityTypes'

export interface RenderEvidence {
  decoded: boolean | null
  payloadMatches: boolean | null
  moduleCount: number | null
  modulePixels: number | null
  quietZoneModules: number | null
  formatValid: boolean | null
  exportSize: number
}

const rank: Record<QualityStatus, number> = { pass: 0, warning: 1, unknown: 2, fail: 3 }
const overallStatus = (checks: QualityCheck[]): QualityStatus => checks.reduce<QualityStatus>((worst, check) => rank[check.status] > rank[worst] ? check.status : worst, 'pass')

export function contrastEvidence(settings: QrDesignSettings): { status: QualityStatus; ratio: number | null } {
  if (settings.background.transparent) return { status: 'unknown', ratio: null }
  try {
    const ratio = minimumContrast([settings.bodyColor, settings.cornerSquareColor, settings.cornerDotColor], settings.background.color)
    return { ratio, status: ratio >= 4 ? 'pass' : ratio >= 3 ? 'warning' : 'fail' }
  } catch { return { status: 'unknown', ratio: null } }
}

export function buildQualityReport(payload: string, settings: QrDesignSettings, evidence: RenderEvidence): QualityReport {
  const bytes = new TextEncoder().encode(payload).length
  const contrast = contrastEvidence(settings)
  const appliedLogoSize = settings.logo.enabled && evidence.moduleCount
    ? resolveLogoGeometry(settings.logo, evidence.moduleCount, settings.errorCorrectionLevel, settings.logo.width / Math.max(1, settings.logo.height)).appliedSize
    : settings.logo.size
  const coverage = settings.logo.enabled ? appliedLogoSize ** 2 * 100 : 0
  const checks: QualityCheck[] = []
  checks.push({ id: 'payload', status: payload.trim() ? 'pass' : 'fail', evidence: payload.trim() ? `${bytes}-bytes` : 'empty' })
  checks.push({ id: 'decode', status: evidence.decoded === null ? 'unknown' : evidence.decoded && evidence.payloadMatches ? 'pass' : 'fail', evidence: evidence.decoded === null ? 'unavailable' : evidence.decoded && evidence.payloadMatches ? 'payload-match' : 'decode-or-match-failed' })
  checks.push({ id: 'contrast', status: contrast.status, evidence: contrast.ratio === null ? 'transparent-background' : `minimum-${contrast.ratio.toFixed(2)}` })
  checks.push({ id: 'quietZone', status: evidence.quietZoneModules === null ? 'unknown' : evidence.quietZoneModules >= 3.8 ? 'pass' : evidence.quietZoneModules >= 3 ? 'warning' : 'fail', evidence: evidence.quietZoneModules === null ? 'unavailable' : `${evidence.quietZoneModules.toFixed(2)}-modules` })
  const logoRisk = settings.logo.enabled && (coverage > 6.25 || settings.logo.padding > 16 || settings.errorCorrectionLevel !== 'H')
  checks.push({ id: 'logo', status: !settings.logo.enabled ? 'pass' : logoRisk ? 'warning' : 'pass', evidence: !settings.logo.enabled ? 'none' : `${coverage.toFixed(2)}%-ecc-${settings.errorCorrectionLevel}-padding-${settings.logo.padding}` })
  const cornerContrast = contrastEvidence({ ...settings, bodyColor: settings.cornerSquareColor }).status
  checks.push({ id: 'finder', status: cornerContrast === 'fail' ? 'fail' : cornerContrast === 'unknown' ? 'unknown' : appliedLogoSize > 0.3 ? 'warning' : cornerContrast, evidence: `corner-contrast-${cornerContrast};logo-centered-${appliedLogoSize.toFixed(2)}` })
  const modulePixels = evidence.modulePixels
  const densityStatus: QualityStatus = modulePixels === null ? 'unknown' : modulePixels < 3 ? 'fail' : modulePixels < 5 || bytes > 800 ? 'warning' : 'pass'
  checks.push({ id: 'density', status: densityStatus, evidence: modulePixels === null ? 'unavailable' : `${evidence.moduleCount}-modules;${modulePixels.toFixed(2)}px;${bytes}-bytes;ecc-${settings.errorCorrectionLevel}` })
  checks.push({ id: 'format', status: evidence.formatValid === null ? 'unknown' : evidence.formatValid ? 'pass' : 'fail', evidence: evidence.formatValid === null ? 'preflight-image' : evidence.formatValid ? 'signature-and-structure-valid' : 'invalid-file' })

  const suggestions = new Set<QualitySuggestion>()
  if (contrast.status === 'fail' || contrast.status === 'warning') suggestions.add('increaseContrast')
  if (settings.background.transparent || contrast.status === 'unknown') suggestions.add('whiteBackground')
  if (logoRisk || checks.find((check) => check.id === 'decode')?.status === 'fail') suggestions.add('reduceLogo')
  if (densityStatus !== 'pass') suggestions.add('increaseSize')
  if (densityStatus === 'fail' || settings.bodyPattern !== 'square') suggestions.add('squarePattern')
  if (settings.logo.enabled && settings.errorCorrectionLevel !== 'H') suggestions.add('eccH')
  if (bytes > 800) suggestions.add('shortenPayload')
  if (checks.some((check) => check.status === 'unknown')) suggestions.add('retryValidation')

  return {
    overall: overallStatus(checks), checks, suggestions: [...suggestions],
    metrics: { payloadBytes: bytes, moduleCount: evidence.moduleCount, modulePixels, quietZoneModules: evidence.quietZoneModules, minimumContrast: contrast.ratio, logoCoverage: coverage, exportSize: evidence.exportSize },
    testedAt: new Date().toISOString(),
  }
}
