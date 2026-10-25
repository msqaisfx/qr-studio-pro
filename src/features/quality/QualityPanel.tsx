import { useEffect, useRef, useState } from 'react'
import { useApp } from '../../app/appContext'
import { Icons } from '../../components/icons'
import type { TranslationKey } from '../../locales'
import type { QrDesignSettings } from '../../types/qr'
import { runQualityGuard } from './qualityRunner'
import { unknownQualityReport, type QualityCheck, type QualityReport, type QualityStatus, type QualitySuggestion } from './qualityTypes'

const checkLabels: Record<QualityCheck['id'], TranslationKey> = { payload: 'guardPayload', decode: 'guardDecode', contrast: 'guardContrast', quietZone: 'guardQuietZone', logo: 'guardLogo', finder: 'guardFinder', density: 'guardDensity', format: 'guardFormat' }
const statusLabels: Record<QualityStatus, TranslationKey> = { pass: 'qualityPass', warning: 'qualityWarning', fail: 'qualityFail', unknown: 'qualityUnknown' }
const suggestionLabels: Record<QualitySuggestion, TranslationKey> = { increaseContrast: 'suggestIncreaseContrast', whiteBackground: 'suggestWhiteBackground', reduceLogo: 'suggestReduceLogo', increaseSize: 'suggestIncreaseSize', squarePattern: 'suggestSquarePattern', eccH: 'suggestEccH', shortenPayload: 'suggestShortenPayload', retryValidation: 'suggestRetryValidation' }

export function QualityPanel({ payload, settings }: { payload: string; settings: QrDesignSettings }) {
  const { t } = useApp()
  const [report, setReport] = useState<QualityReport>(unknownQualityReport)
  const [checking, setChecking] = useState(false)
  const sequence = useRef(0)

  useEffect(() => {
    const request = ++sequence.current
    const timer = window.setTimeout(async () => {
      setChecking(true)
      const next = await runQualityGuard(payload, settings, settings.exportSize, true)
      if (request === sequence.current) { setReport(next); setChecking(false) }
    }, 450)
    return () => { sequence.current += 1; window.clearTimeout(timer) }
  }, [payload, settings])

  const detail = (check: QualityCheck) => {
    const metrics = report.metrics
    if (check.id === 'payload') return `${metrics.payloadBytes} UTF-8 bytes`
    if (check.id === 'decode') return t(check.status === 'pass' ? 'decodePayloadMatch' : check.status === 'unknown' ? 'qualityNotTested' : 'decodePayloadFailed')
    if (check.id === 'contrast') return metrics.minimumContrast === null ? t('transparentContrastUnknown') : `${t('minimumContrastLabel')}: ${metrics.minimumContrast.toFixed(2)}:1`
    if (check.id === 'quietZone') return metrics.quietZoneModules === null ? t('qualityNotTested') : `${metrics.quietZoneModules.toFixed(2)} ${t('modulesLabel')}`
    if (check.id === 'logo') return settings.logo.enabled ? `${metrics.logoCoverage.toFixed(2)}% · ECC ${settings.errorCorrectionLevel}` : t('noLogoEvidence')
    if (check.id === 'finder') return t(check.status === 'pass' ? 'finderProtected' : check.status === 'unknown' ? 'qualityNotTested' : 'finderAtRisk')
    if (check.id === 'density') return metrics.modulePixels === null ? t('qualityNotTested') : `${metrics.moduleCount} × ${metrics.moduleCount} · ${metrics.modulePixels.toFixed(2)} px/module`
    return t(check.status === 'pass' ? 'fileValidated' : 'formatPending')
  }

  return <section className="quality-panel" aria-labelledby="quality-heading">
    <div className="editor-heading"><div><span className="section-kicker">SCAN GUARD / 08</span><h1 id="quality-heading">{t('qualityStudio')}</h1></div></div>
    <div className={`quality-overall ${checking ? 'checking' : report.overall}`} role="status" aria-live="polite"><Icons.shield /><div><small>{t('overallQuality')}</small><strong>{checking ? t('qualityChecking') : t(statusLabels[report.overall])}</strong><p>{t('qualityDisclaimer')}</p></div></div>
    <div className="quality-checks">{report.checks.map((check) => <article className={`quality-check ${check.status}`} key={check.id} data-quality-check={check.id}><span className="quality-marker" aria-hidden="true">{check.status === 'pass' ? '✓' : check.status === 'warning' ? '!' : check.status === 'fail' ? '×' : '?'}</span><div><strong>{t(checkLabels[check.id])}</strong><small>{detail(check)}</small></div><b>{t(statusLabels[check.status])}</b></article>)}</div>
    <section className="quality-suggestions"><h2>{t('smartSuggestions')}</h2>{report.suggestions.length ? <ul>{report.suggestions.map((suggestion) => <li key={suggestion}>{t(suggestionLabels[suggestion])}</li>)}</ul> : <p>{t('noSuggestions')}</p>}<small>{t('suggestionsConsent')}</small></section>
  </section>
}
