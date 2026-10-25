import { useEffect, useMemo, useRef, useState } from 'react'
import type QRCodeStyling from 'qr-code-styling'
import { useApp } from '../../app/appContext'
import { Icons } from '../../components/icons'
import type { QrDesignSettings } from '../../types/qr'
import { prepareQrEngine } from '../qr/qrEngine'
import { createExportFile, downloadExportFile, resolveExportSettings } from './exportEngine'
import { validateExportFile } from './fileValidation'
import { sanitizeFilename } from './filename'
import { defaultExportOptions, type ExportFormat, type ExportOptions } from './exportTypes'
import { runQualityGuard } from '../quality/qualityRunner'

const formats: ExportFormat[] = ['png', 'svg', 'webp', 'jpeg', 'pdf']
const resolutions = [256, 512, 1024, 2048, 4096] as const

export function ExportPanel({ payload, settings }: { payload: string; settings: QrDesignSettings }) {
  const { t } = useApp()
  const [options, setOptions] = useState<ExportOptions>({ ...defaultExportOptions, resolution: settings.exportSize })
  const [state, setState] = useState<'idle' | 'working' | 'valid' | 'warning' | 'unsafe' | 'unknown' | 'error'>('idle')
  const previewRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<QRCodeStyling | null>(null)
  const safeName = useMemo(() => sanitizeFilename(options.filename, options.format), [options.filename, options.format])
  const update = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => setOptions((current) => ({ ...current, [key]: value }))

  useEffect(() => {
    const container = previewRef.current
    if (!container) return
    container.replaceChildren(); engineRef.current = null
    if (!payload) return
    try {
      const previewSettings = options.backgroundMode === 'transparent'
        ? { ...settings, background: { ...settings.background, transparent: true } }
        : options.backgroundMode === 'white' || options.backgroundMode === 'custom'
          ? { ...settings, background: { color: options.backgroundMode === 'white' ? '#ffffff' : options.backgroundColor, transparent: false } }
          : settings
      const { engine } = prepareQrEngine(payload, previewSettings, 220)
      engine.append(container); engineRef.current = engine
    } catch { queueMicrotask(() => setState('error')) }
  }, [payload, settings, options.backgroundMode, options.backgroundColor])

  async function exportFile() {
    if (!payload || state === 'working') return
    setState('working')
    try {
      const file = await createExportFile(payload, settings, options)
      await validateExportFile(file, options.format)
      const report = await runQualityGuard(payload, resolveExportSettings(settings, options), file.width ?? options.resolution, true, file.scanSource)
      if (report.overall === 'fail') { setState('unsafe'); return }
      if (report.overall === 'unknown') { setState('unknown'); return }
      downloadExportFile(file); setState(report.overall === 'warning' ? 'warning' : 'valid')
    } catch { setState('error') }
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
    <div className={`export-validation ${state}`} role="status" aria-live="polite">{state === 'working' ? t('exportWorking') : state === 'valid' ? t('exportValidated') : state === 'warning' ? t('exportWarningAllowed') : state === 'unsafe' ? t('exportUnsafe') : state === 'unknown' ? t('exportUnknownBlocked') : state === 'error' ? t('exportFailed') : t('exportValidationReady')}</div>
    <button className="download-button export-download" type="button" disabled={!payload || state === 'working'} onClick={exportFile}><Icons.download />{state === 'working' ? t('exportWorking') : t('downloadFile')}</button>
    <p className="field-hint">{t('exportPrivacy')}</p>
  </section>
}
