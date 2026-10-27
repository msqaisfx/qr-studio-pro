import { useEffect, useMemo, useRef, useState } from 'react'
import type QRCodeStyling from 'qr-code-styling'
import { useApp } from '../../app/appContext'
import { Icons } from '../../components/icons'
import type { QrDesignSettings } from '../../types/qr'
import { createDesignSnapshot, stableConfigurationHash } from '../qr/designSnapshot'
import { appendPreparedQr, prepareQrEngineAsync } from '../qr/qrEngine'
import { createExportFile, downloadExportFile, resolveExportSettings } from './exportEngine'
import { validateExportFile } from './fileValidation'
import { sanitizeFilename } from './filename'
import { defaultExportOptions, type ExportFormat, type ExportOptions } from './exportTypes'
import { runQualityGuard } from '../quality/qualityRunner'
import { findSafeRecovery, type SafeRecoveryProposal } from './safeRecovery'

const formats: ExportFormat[] = ['png', 'svg', 'webp', 'jpeg', 'pdf']
const resolutions = [256, 512, 1024, 2048, 4096] as const

export function ExportPanel({ payload, settings, options: controlledOptions, onOptionsChange, onSettingsChange }: { payload: string; settings: QrDesignSettings; options?:ExportOptions; onOptionsChange?:(value:ExportOptions)=>void; onSettingsChange?:(value:QrDesignSettings)=>void }) {
  const { t } = useApp()
  const [localOptions, setLocalOptions] = useState<ExportOptions>({ ...defaultExportOptions, resolution: settings.exportSize })
  const options=controlledOptions??localOptions
  const [state, setState] = useState<'idle' | 'working' | 'valid' | 'warning' | 'unsafe' | 'unknown' | 'error'>('idle')
  const [stateHash, setStateHash] = useState('')
  const [snapshotId, setSnapshotId] = useState('')
  const [validationEvidence, setValidationEvidence] = useState('')
  const [failureKind, setFailureKind] = useState<'render' | 'integrity' | 'decode' | 'mismatch' | 'density' | 'contrast' | 'quietZone' | 'verification' | null>(null)
  const [recovering, setRecovering] = useState(false)
  const [recovery, setRecovery] = useState<SafeRecoveryProposal | null>(null)
  const [recoveryUnavailable, setRecoveryUnavailable] = useState(false)
  const previewRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<QRCodeStyling | null>(null)
  const previewSequence = useRef(0)
  const validationSequence = useRef(0)
  const safeName = useMemo(() => sanitizeFilename(options.filename, options.format), [options.filename, options.format])
  const { filename: _filename, ...renderOptions } = options
  void _filename
  const configurationHash = stableConfigurationHash(payload, settings, renderOptions)
  const currentHashRef = useRef(configurationHash)
  const effectiveState = stateHash === configurationHash ? state : 'idle'
  const update = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => { const next={...options,[key]:value}; if(onOptionsChange)onOptionsChange(next);else setLocalOptions(next) }

  useEffect(() => {
    const container = previewRef.current
    if (!container) return
    container.replaceChildren(); engineRef.current = null
    if (!payload) return
    const request = ++previewSequence.current
    const previewSettings = options.backgroundMode === 'transparent'
        ? { ...settings, background: { ...settings.background, transparent: true } }
        : options.backgroundMode === 'white' || options.backgroundMode === 'custom'
          ? { ...settings, background: { color: options.backgroundMode === 'white' ? '#ffffff' : options.backgroundColor, transparent: false } }
          : settings
    void prepareQrEngineAsync(payload, previewSettings, 220).then(async ({ engine }) => {
      await appendPreparedQr(engine, container, () => request === previewSequence.current)
      if (request === previewSequence.current) engineRef.current = engine
    }).catch(() => { if (request === previewSequence.current) setState('error') })
    return () => { previewSequence.current += 1 }
  }, [payload, settings, options.backgroundMode, options.backgroundColor])

  useEffect(() => {
    currentHashRef.current = configurationHash
    validationSequence.current += 1
  }, [configurationHash])

  async function exportFile() {
    if (!payload || effectiveState === 'working') return
    setStateHash(configurationHash)
    setState('working')
    setValidationEvidence('')
    setFailureKind(null)
    setRecovery(null); setRecoveryUnavailable(false)
    const request = ++validationSequence.current
    const snapshot = createDesignSnapshot(payload, settings, renderOptions)
    setSnapshotId(snapshot.id)
    const isCurrent = () => request === validationSequence.current && snapshot.configurationHash === currentHashRef.current
    try {
      const file = await createExportFile(snapshot.payload, snapshot.settings, structuredClone(options))
      if (!isCurrent()) return
      try { await validateExportFile(file, options.format) }
      catch (error) { setFailureKind('integrity'); throw error }
      const report = await runQualityGuard(snapshot.payload, resolveExportSettings(snapshot.settings, options), file.width ?? options.resolution, true, file.scanSource)
      if (!isCurrent()) return
      setValidationEvidence(report.checks.map((check) => `${check.id}:${check.status}:${check.evidence}`).join('|'))
      if (report.overall === 'fail') {
        const failed = report.checks.find((check) => check.status === 'fail')
        setFailureKind(failed?.id === 'payload' || failed?.evidence.includes('mismatch') ? 'mismatch' : failed?.id === 'density' ? 'density' : failed?.id === 'contrast' ? 'contrast' : failed?.id === 'quietZone' ? 'quietZone' : 'decode'); setState('unsafe'); return
      }
      if (report.overall === 'unknown') { setFailureKind('verification'); setState('unknown'); return }
      downloadExportFile(file); setState(report.overall === 'warning' ? 'warning' : 'valid')
    } catch { if (isCurrent()) { setFailureKind((current) => current ?? 'render'); setState('error') } }
  }

  async function proposeSafeRecovery() {
    if (!onSettingsChange || recovering) return
    setRecovering(true); setRecovery(null); setRecoveryUnavailable(false)
    const recoveryOptions = structuredClone(options)
    try {
      const proposal = await findSafeRecovery(settings, async (candidate) => {
        const file = await createExportFile(payload, candidate, recoveryOptions)
        await validateExportFile(file, recoveryOptions.format)
        return runQualityGuard(payload, resolveExportSettings(candidate, recoveryOptions), file.width ?? recoveryOptions.resolution, true, file.scanSource)
      })
      setRecovery(proposal); setRecoveryUnavailable(!proposal)
    } finally { setRecovering(false) }
  }

  function applyRecovery() {
    if (!onSettingsChange || !recovery) return
    onSettingsChange(recovery.proposed)
    setRecovery(null); setRecoveryUnavailable(false); setState('idle'); setStateHash(''); setValidationEvidence('')
  }

  return <section className="export-panel" aria-labelledby="export-heading">
    <div className="editor-heading"><div><span className="section-kicker">EXPORT STUDIO</span><h1 id="export-heading">{t('exportStudio')}</h1></div></div>
    <fieldset className="option-group"><legend>{t('formatSelector')}</legend><div className="export-formats">{formats.map((format) => <button type="button" key={format} data-export-format={format} className={options.format === format ? 'selected' : ''} aria-pressed={options.format === format} onClick={() => update('format', format)}>{format === 'jpeg' ? 'JPEG' : format.toUpperCase()}</button>)}</div></fieldset>
    {options.format !== 'svg' && <label className="dynamic-field">{t('resolution')}<select id="export-resolution" value={options.resolution} onChange={(event) => update('resolution', Number(event.target.value) as ExportOptions['resolution'])}>{resolutions.map((size) => <option key={size} value={size}>{size} × {size}px</option>)}</select></label>}
    {(options.format === 'webp' || options.format === 'jpeg') && <label className="export-range">{t('imageQuality')} <b>{Math.round(options.quality * 100)}%</b><input aria-label={t('imageQuality')} type="range" min="0.4" max="1" step="0.01" value={options.quality} onChange={(event) => update('quality', Number(event.target.value))} /></label>}
    {options.format === 'webp' && options.quality === 1 && <p className="export-note">{t('webpLosslessHint')}</p>}
    <fieldset className="option-group"><legend>{t('exportBackground')}</legend><div className="background-options">{(['design', 'transparent', 'white', 'custom'] as const).map((mode) => <button type="button" key={mode} aria-pressed={options.backgroundMode === mode} className={options.backgroundMode === mode ? 'selected' : ''} onClick={() => update('backgroundMode', mode)}>{t(mode === 'design' ? 'useDesignBackground' : mode === 'transparent' ? 'transparentBackground' : mode === 'white' ? 'backgroundWhite' : 'customExportBackground')}</button>)}</div>{options.backgroundMode === 'custom' && <input aria-label={t('customExportBackground')} type="color" value={options.backgroundColor} onChange={(event) => update('backgroundColor', event.target.value)} />}</fieldset>
    {options.format === 'jpeg' && options.backgroundMode === 'transparent' && <p className="export-warning"><Icons.info />{t('jpegFlattenWarning')}</p>}
    <label className="dynamic-field">{t('fileName')}<input id="export-filename" value={options.filename} onChange={(event) => update('filename', event.target.value)} /><small>{safeName}</small></label>
    {options.format === 'pdf' && <div className="pdf-options"><label className="dynamic-field">{t('pdfPageSize')}<select id="pdf-page-size" value={options.pdfPageSize} onChange={(event) => update('pdfPageSize', event.target.value as ExportOptions['pdfPageSize'])}><option value="a4">A4</option><option value="letter">US Letter</option><option value="square">{t('squarePage')}</option></select></label><label className="dynamic-field">{t('printMargin')}<input type="number" min="5" max="50" value={options.pdfMarginMm} onChange={(event) => update('pdfMarginMm', Number(event.target.value))} /></label><label className="dynamic-field">{t('pdfQrSize')}<input type="number" min="30" max="190" value={options.pdfQrSizeMm} onChange={(event) => update('pdfQrSizeMm', Number(event.target.value))} /></label><label className="dynamic-field">{t('pdfTitle')}<input id="pdf-title" maxLength={120} value={options.pdfTitle} onChange={(event) => update('pdfTitle', event.target.value)} /></label></div>}
    <div className="export-preview"><div ref={previewRef} /><span><strong>{t('exportPreview')}</strong><small>{options.format.toUpperCase()} · {options.format === 'svg' ? t('vectorFormat') : `${options.resolution}px`} · {safeName}</small></span></div>
    {settings.logo.enabled && options.format === 'svg' && <p className="export-note">{t('svgRasterLogoNote')}</p>}
    {options.format === 'pdf' && <p className="export-note">{t('pdfRasterNote')}</p>}
    <div className={`export-validation ${effectiveState}`} data-snapshot-id={stateHash === configurationHash ? snapshotId : ''} data-snapshot-hash={configurationHash} data-validation-evidence={stateHash === configurationHash ? validationEvidence : ''} role="status" aria-live="polite"><strong>{effectiveState === 'valid' ? 'PASS' : effectiveState === 'warning' ? 'WARNING' : effectiveState === 'unsafe' ? 'FAIL' : effectiveState === 'unknown' || effectiveState === 'error' ? 'UNKNOWN' : ''}</strong>{effectiveState === 'working' ? t('exportWorking') : effectiveState === 'valid' ? t('exportValidated') : effectiveState === 'warning' ? t('exportWarningAllowed') : effectiveState === 'unsafe' ? t(failureKind === 'mismatch' ? 'exportPayloadMismatch' : failureKind === 'density' ? 'exportDensityFailed' : failureKind === 'contrast' ? 'exportContrastFailed' : failureKind === 'quietZone' ? 'exportQuietZoneFailed' : 'exportDecodeFailed') : effectiveState === 'unknown' ? t('exportUnknownBlocked') : effectiveState === 'error' ? t(failureKind === 'integrity' ? 'exportIntegrityFailed' : 'exportRenderFailed') : t('exportValidationReady')}</div>
    {effectiveState === 'unsafe' && settings.logo.enabled && onSettingsChange && <div className="export-recovery"><p>{t('autoFixExplanation')}</p><button className="control-button auto-fix-button" type="button" disabled={recovering} onClick={() => void proposeSafeRecovery()}>{recovering ? t('autoFixTesting') : t('autoFixQr')}</button></div>}
    {recovery && <section className="recovery-comparison" aria-labelledby="recovery-heading"><h2 id="recovery-heading">{t('autoFixComparison')}</h2><div><span>{t('autoFixBefore')} <strong>{Math.round(recovery.original.logo.size * 100)}% · ECC {recovery.original.errorCorrectionLevel} · {recovery.original.logo.padding}% {t('logoPadding')}</strong></span><span>{t('autoFixAfter')} <strong>{Math.round(recovery.proposed.logo.size * 100)}% · ECC {recovery.proposed.errorCorrectionLevel} · {recovery.proposed.logo.padding}% {t('logoPadding')}</strong></span></div><p>{t('autoFixConsent')}</p><div className="recovery-actions"><button className="control-button" type="button" onClick={applyRecovery}>{t('autoFixApply')}</button><button className="text-button" type="button" onClick={() => setRecovery(null)}>{t('autoFixCancel')}</button></div><details><summary>{t('autoFixTechnicalDetails')}</summary><code>{recovery.attempts.map((attempt) => `${Math.round(attempt.size * 100)}% / ECC ${attempt.errorCorrectionLevel} / ${attempt.status} / ${attempt.evidence}`).join('\n')}</code></details></section>}
    {recoveryUnavailable && <p className="export-warning" role="alert"><Icons.info />{t('autoFixUnavailable')}</p>}
    <button className="download-button export-download" type="button" disabled={!payload || effectiveState === 'working'} onClick={exportFile}><Icons.download />{effectiveState === 'working' ? t('exportWorking') : t('downloadFile')}</button>
    <p className="field-hint">{t('exportPrivacy')}</p>
  </section>
}
