export type QualityStatus = 'pass' | 'warning' | 'fail' | 'unknown'
export type QualityCheckId = 'payload' | 'decode' | 'contrast' | 'quietZone' | 'logo' | 'finder' | 'density' | 'format'
export type QualitySuggestion = 'increaseContrast' | 'whiteBackground' | 'reduceLogo' | 'increaseSize' | 'squarePattern' | 'eccH' | 'shortenPayload' | 'retryValidation'

export interface QualityCheck {
  id: QualityCheckId
  status: QualityStatus
  evidence: string
}

export interface QualityMetrics {
  payloadBytes: number
  moduleCount: number | null
  modulePixels: number | null
  quietZoneModules: number | null
  minimumContrast: number | null
  logoCoverage: number
  exportSize: number
}

export interface QualityReport {
  overall: QualityStatus
  checks: QualityCheck[]
  suggestions: QualitySuggestion[]
  metrics: QualityMetrics
  testedAt: string
}

export const unknownQualityReport: QualityReport = {
  overall: 'unknown',
  checks: [
    { id: 'payload', status: 'unknown', evidence: 'not-tested' },
    { id: 'decode', status: 'unknown', evidence: 'not-tested' },
    { id: 'contrast', status: 'unknown', evidence: 'not-tested' },
    { id: 'quietZone', status: 'unknown', evidence: 'not-tested' },
    { id: 'logo', status: 'unknown', evidence: 'not-tested' },
    { id: 'finder', status: 'unknown', evidence: 'not-tested' },
    { id: 'density', status: 'unknown', evidence: 'not-tested' },
    { id: 'format', status: 'unknown', evidence: 'not-tested' },
  ],
  suggestions: ['retryValidation'],
  metrics: { payloadBytes: 0, moduleCount: null, modulePixels: null, quietZoneModules: null, minimumContrast: null, logoCoverage: 0, exportSize: 0 },
  testedAt: '',
}
