import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { useApp } from '../../app/appContext'
import { Icons } from '../../components/icons'
import { defaultQrDesignSettings, type LogoBackgroundMode, type LogoFit, type LogoGuardState, type LogoIntegrationStyle, type LogoShape, type QrDesignSettings, type QrLogoSettings } from '../../types/qr'
import { getFusionMetrics, getLogoQuality, isConservativeLogoSize, readLogoFile, renderLogoDetailed, resolveLogoGeometry, type LogoVisualAnalysis } from './logoUtils'
import { findMaximumReadableLogoSize, type LogoFitAttempt } from './logoFit'
import { prepareQrEngine } from './qrEngine'

export function LogoPanel({ settings, onChange, guard, payload }: { settings: QrDesignSettings; onChange: (settings: QrDesignSettings) => void; guard: LogoGuardState; payload: string }) {
  const { t } = useApp(); const inputId = useId(); const sequence = useRef(0); const history = useRef<QrLogoSettings[]>([])
  const [error, setError] = useState<string | null>(null); const [dragging, setDragging] = useState(false)
  const [analysis, setAnalysis] = useState<LogoVisualAnalysis | null>(null); const [finding, setFinding] = useState(false); const [attempts, setAttempts] = useState<LogoFitAttempt[]>([])
  const logo = settings.logo
  const commit = (patch: Partial<QrLogoSettings>, remember = true) => {
    if (remember) history.current.push(structuredClone(logo))
    onChange({ ...settings, logo: { ...logo, ...patch } })
  }

  useEffect(() => {
    if (!logo.sourceDataUrl) return
    const request = ++sequence.current
    renderLogoDetailed(logo.sourceDataUrl, logo)
      .then(({ dataUrl, analysis: nextAnalysis }) => { if (request === sequence.current) { setError(null); setAnalysis(nextAnalysis); if (dataUrl !== logo.renderedDataUrl) commit({ renderedDataUrl: dataUrl }, false) } })
      .catch(() => { if (request === sequence.current) setError(t('logoCorrupt')) })
    return () => { sequence.current += 1 }
  // Visual controls are deliberately enumerated to avoid stale asynchronous results.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo.sourceDataUrl, logo.shape, logo.backgroundMode, logo.backgroundColor, logo.backgroundOpacity, logo.padding, logo.cornerRadius, logo.autoTrim, logo.removalTolerance, logo.visibleSize, logo.fit, logo.simplifyDetails, logo.contentMode, logo.cropX, logo.cropY, logo.cropWidth, logo.cropHeight])

  async function accept(file?: File) {
    if (!file) return
    setError(null)
    try {
      const image = await readLogoFile(file)
      history.current = []
      onChange({ ...settings, logo: { ...logo, ...image, fileName: file.name, enabled: true, renderedDataUrl: null } })
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : 'corrupt'
      setError(t(code === 'too-large' ? 'logoTooLarge' : code === 'dimensions' ? 'logoDimensions' : code === 'unsupported' ? 'logoUnsupported' : 'logoCorrupt'))
    }
  }
  function drop(event: DragEvent) { event.preventDefault(); setDragging(false); void accept(event.dataTransfer.files[0]) }
  function applyStyle(style: LogoIntegrationStyle) {
    const preset: Record<LogoIntegrationStyle, Partial<QrLogoSettings>> = {
      'seamless-fusion': { integrationStyle: style, shape: 'rounded', backgroundMode: 'transparent', backgroundOpacity: 0, padding: 0, cornerRadius: 12, visibleSize: 1 },
      'adaptive-badge': { integrationStyle: style, shape: 'circle', backgroundMode: 'custom', backgroundColor: '#ffffff', backgroundOpacity: 0.92, padding: 7, cornerRadius: 50, visibleSize: 0.9 },
      'minimal-cutout': { integrationStyle: style, shape: 'rounded', backgroundMode: 'transparent', backgroundOpacity: 0, padding: 1, cornerRadius: 18, visibleSize: 0.98 },
      'premium-brand': { integrationStyle: style, shape: 'rounded', backgroundMode: 'custom', backgroundColor: '#ffffff', backgroundOpacity: 0.96, padding: 4, cornerRadius: 24, visibleSize: 0.94 },
    }
    commit(preset[style])
  }
  const moduleCount = payload.trim() ? prepareQrEngine(payload, settings, 256).moduleCount : 29
  const aspectRatio = analysis?.aspectRatio ?? logo.width / Math.max(1, logo.height)
  const geometry = resolveLogoGeometry(logo, moduleCount, settings.errorCorrectionLevel, aspectRatio)
  const metrics = getFusionMetrics(geometry.containerSize, logo.visibleSize, logo.padding, moduleCount, settings.errorCorrectionLevel, aspectRatio)
  const risky = !isConservativeLogoSize(logo.size, logo.padding)
  const quality = getLogoQuality(logo.width, logo.height, settings.exportSize * logo.size * logo.visibleSize)
  async function findMaximum() {
    if (!payload.trim() || !logo.renderedDataUrl || finding) return
    setFinding(true); setAttempts([])
    try {
      const result = await findMaximumReadableLogoSize(payload, settings, (attempt) => setAttempts((current) => [...current, attempt]))
      if (result.selectedSize !== null) commit({ size: result.selectedSize, sizeMode: 'auto', autoFit: true })
    } finally { setFinding(false) }
  }

  return <section className="logo-panel" aria-labelledby="logo-title">
    <div className="editor-heading"><div><span className="section-kicker">04 / {t('logoTool')}</span><h1 id="logo-title">{t('logoStudio')}</h1></div>{logo.enabled && <button type="button" className="text-button" onClick={() => commit({ enabled: false, sourceDataUrl: null, renderedDataUrl: null, fileName: null })}>{t('removeLogo')}</button>}</div>
    {!logo.enabled ? <label htmlFor={inputId} className={`logo-dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={drop}><Icons.logo /><strong>{t('uploadLogo')}</strong><span>{t('dropLogo')}</span><small>{t('logoFileHint')}</small><input id={inputId} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void accept(event.target.files?.[0])} /></label> : <>
      <div className="logo-file-card"><img src={logo.renderedDataUrl ?? logo.sourceDataUrl ?? ''} alt={t('logoPreview')} /><div><strong>{logo.fileName}</strong><span>{logo.width} × {logo.height}px · {logo.mimeType}</span></div><label className="replace-logo">{t('replaceLogo')}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void accept(event.target.files?.[0])} /></label></div>
      <section className="logo-size-control" aria-labelledby="logo-size-title">
        <div className="logo-size-heading"><div><h2 id="logo-size-title">{t('logoSizeControl')}</h2><p>{t('logoSizeControlHint')}</p></div><div className="logo-size-modes" role="group" aria-label={t('logoSizeMode')}><button type="button" className={logo.sizeMode === 'manual' ? 'selected' : ''} aria-pressed={logo.sizeMode === 'manual'} onClick={() => commit({ sizeMode: 'manual', autoFit: false })}>{t('logoManual')}</button><button type="button" className={logo.sizeMode === 'auto' ? 'selected' : ''} aria-pressed={logo.sizeMode === 'auto'} disabled={finding || !payload.trim()} onClick={() => void findMaximum()}>{finding ? t('logoFindingMaximum') : t('logoAutoFitAction')}</button></div></div>
        <div className="logo-size-stepper"><button type="button" aria-label={t('logoDecreaseSize')} onClick={() => commit({ size: Math.max(.05, Math.round((logo.size * 100 - 1)) / 100), sizeMode: 'manual', autoFit: false })}>−</button><label><span className="sr-only">{t('logoRequestedSize')}</span><input type="number" min="5" max="35" step="1" value={Math.round(logo.size * 100)} onChange={(event) => { const value = Math.min(35, Math.max(5, Number(event.target.value) || 5)); commit({ size: value / 100, sizeMode: 'manual', autoFit: false }) }} /><b>%</b></label><button type="button" aria-label={t('logoIncreaseSize')} onClick={() => commit({ size: Math.min(.35, Math.round((logo.size * 100 + 1)) / 100), sizeMode: 'manual', autoFit: false })}>+</button><button type="button" className="logo-size-reset" onClick={() => commit({ size: .2, sizeMode: 'manual', autoFit: false })}>{t('logoSizeReset')}</button></div>
        <Range value={Math.round(logo.size * 100)} min={5} max={35} label={`${t('logoRequestedSize')}: ${Math.round(geometry.requestedSize * 100)}%`} onChange={(value) => commit({ size: value / 100, sizeMode: 'manual', autoFit: false })} />
        <div className="logo-size-result" role="status" aria-live="polite"><span>{t('logoAppliedSize')}: <strong>{(geometry.appliedSize * 100).toFixed(1)}%</strong></span><span>{t('logoMode')}: <strong>{t(logo.sizeMode === 'auto' ? 'logoAuto' : 'logoManual')}</strong></span><span>{t('logoReadStatus')}: <strong>{guard === 'readable' ? 'PASS' : guard === 'unreadable' ? 'FAIL' : geometry.appliedSize > geometry.safeMaximum ? 'WARNING' : 'UNKNOWN'}</strong></span><span>{geometry.maskModuleSpan} {t('logoModules')}</span></div>
        {geometry.appliedSize > geometry.safeMaximum && <div className="color-warning" role="alert"><Icons.info /><span>{t('logoEngineeringWarning')}</span></div>}
        {attempts.length > 0 && <p className="field-hint" role="status">{attempts.filter((attempt) => attempt.readable).length}/{attempts.length} {t('logoSizesReadable')}</p>}
      </section>
      <div className="logo-comparison" aria-label={t('logoPreview')}><figure className={logo.showContentBounds ? 'show-bounds' : ''}><div className="logo-bound-stage"><img src={logo.sourceDataUrl ?? ''} alt={t('logoBefore')} />{logo.showContentBounds && analysis && <i aria-hidden="true" style={{ left: `${analysis.bounds.x / analysis.sourceWidth * 100}%`, top: `${analysis.bounds.y / analysis.sourceHeight * 100}%`, width: `${analysis.bounds.width / analysis.sourceWidth * 100}%`, height: `${analysis.bounds.height / analysis.sourceHeight * 100}%` }} />}</div><figcaption>{t('logoBefore')}</figcaption></figure><figure><img src={logo.renderedDataUrl ?? logo.sourceDataUrl ?? ''} alt={t('logoAfter')} /><figcaption>{t('logoAfter')}</figcaption></figure></div>
      <div className="logo-actions"><button type="button" className="text-button" onClick={() => { const previous = history.current.pop(); if (previous) onChange({ ...settings, logo: previous }) }}>{t('logoUndo')}</button><button type="button" className="text-button" onClick={() => commit({ ...defaultQrDesignSettings.logo, enabled: true, sourceDataUrl: logo.sourceDataUrl, fileName: logo.fileName, mimeType: logo.mimeType, width: logo.width, height: logo.height })}>{t('logoReset')}</button></div>
      <Group title={t('logoContentMode')}><div className="option-row two"><Choice selected={logo.contentMode === 'full'} onClick={() => commit({ contentMode: 'full' })}>{t('logoFullBrand')}</Choice><Choice selected={logo.contentMode === 'custom'} onClick={() => commit({ contentMode: 'custom' })}>{t('logoCustomCrop')}</Choice></div>
        {logo.contentMode === 'custom' && <div className="logo-crop-controls" role="group" aria-label={t('logoCustomCrop')}><Range value={Math.round(logo.cropX * 100)} min={0} max={95} label={`${t('logoCropX')}: ${Math.round(logo.cropX * 100)}%`} onChange={(value) => commit({ cropX: value / 100 })} /><Range value={Math.round(logo.cropY * 100)} min={0} max={95} label={`${t('logoCropY')}: ${Math.round(logo.cropY * 100)}%`} onChange={(value) => commit({ cropY: value / 100 })} /><Range value={Math.round(logo.cropWidth * 100)} min={5} max={100} label={`${t('logoCropWidth')}: ${Math.round(logo.cropWidth * 100)}%`} onChange={(value) => commit({ cropWidth: value / 100 })} /><Range value={Math.round(logo.cropHeight * 100)} min={5} max={100} label={`${t('logoCropHeight')}: ${Math.round(logo.cropHeight * 100)}%`} onChange={(value) => commit({ cropHeight: value / 100 })} /><small className="field-hint">{t('logoCropHint')}</small></div>}
      </Group>
      <Group title={t('logoStyle')}><div className="option-row two">{(['seamless-fusion','adaptive-badge','minimal-cutout','premium-brand'] as LogoIntegrationStyle[]).map((style) => <Choice key={style} selected={logo.integrationStyle === style} onClick={() => applyStyle(style)}>{t(style === 'seamless-fusion' ? 'logoFusionSeamless' : style === 'adaptive-badge' ? 'logoFusionBadge' : style === 'minimal-cutout' ? 'logoFusionMinimal' : 'logoFusionPremium')}</Choice>)}</div></Group>
      <Group title={t('logoFit')}><div className="option-row two">{(['contain','cover'] as LogoFit[]).map((fit) => <Choice key={fit} selected={logo.fit === fit} onClick={() => commit({ fit })}>{t(fit === 'contain' ? 'logoContain' : 'logoCover')}</Choice>)}</div></Group>
      <Group title={t('logoVisibleSize')}><Range value={Math.round(logo.visibleSize * 100)} min={45} max={100} label={`${Math.round(logo.visibleSize * 100)}% · ${metrics.visibleCoverage.toFixed(1)}% ${t('logoActualSize')}`} onChange={(value) => commit({ visibleSize: value / 100 })} /></Group>
      <Group title={t('logoShape')}><div className="option-row">{(['square','circle','rounded'] as LogoShape[]).map((shape) => <Choice key={shape} selected={logo.shape === shape} onClick={() => commit({ shape })}>{t(shape === 'square' ? 'logoSquare' : shape === 'circle' ? 'logoCircle' : 'logoRounded')}</Choice>)}</div></Group>
      <Group title={t('logoBackground')}><div className="option-row two">{(['original','transparent','remove-solid','custom'] as LogoBackgroundMode[]).map((mode) => <Choice key={mode} selected={logo.backgroundMode === mode} onClick={() => commit({ backgroundMode: mode })}>{t(mode === 'original' ? 'logoOriginal' : mode === 'transparent' ? 'logoTransparent' : mode === 'remove-solid' ? 'logoRemoveBackground' : 'backgroundCustom')}</Choice>)}</div>
        {logo.backgroundMode === 'custom' && <><label className="logo-color"><span>{t('backgroundCustom')}</span><input aria-label={t('backgroundCustom')} type="color" value={logo.backgroundColor} onChange={(event) => commit({ backgroundColor: event.target.value })} /></label><Range value={Math.round(logo.backgroundOpacity * 100)} min={20} max={100} label={`${t('logoOpacity')}: ${Math.round(logo.backgroundOpacity * 100)}%`} onChange={(value) => commit({ backgroundOpacity: value / 100 })} /></>}
        {logo.backgroundMode === 'remove-solid' && <><Range value={logo.removalTolerance} min={4} max={80} label={`${t('logoTolerance')}: ${logo.removalTolerance}`} onChange={(value) => commit({ removalTolerance: value })} /><small className="field-hint">{t('logoRemovalHint')}</small></>}
      </Group>
      <Group title={t('logoPadding')}><Range value={logo.padding} min={0} max={24} label={`${logo.padding}%`} onChange={(value) => commit({ padding: value })} /></Group>
      {logo.shape === 'rounded' && <Group title={t('logoCornerRadius')}><Range value={logo.cornerRadius} min={4} max={50} label={`${logo.cornerRadius}%`} onChange={(value) => commit({ cornerRadius: value })} /></Group>}
      <label className="logo-toggle"><input type="checkbox" checked={logo.autoTrim} onChange={(event) => commit({ autoTrim: event.target.checked })} /><span>{t('logoAutoTrim')}</span></label>
      <label className="logo-toggle"><input type="checkbox" checked={logo.showContentBounds} onChange={(event) => commit({ showContentBounds: event.target.checked })} /><span>{t('logoShowBounds')}</span></label>
      <label className="logo-toggle"><input type="checkbox" checked={logo.simplifyDetails} onChange={(event) => { if (!event.target.checked || window.confirm(t('logoSimplifyConfirm'))) commit({ simplifyDetails: event.target.checked }) }} /><span>{t('logoSimplifyDetails')}</span></label>
      <small className="field-hint">{t('logoSimplifyHint')}</small>
      {analysis && <div className="logo-metrics" role="status"><span>{t('logoVisibleBounds')}: {analysis.bounds.width}×{analysis.bounds.height}px</span><span>{t('logoAspectRatio')}: {analysis.aspectRatio.toFixed(2)}</span><span>{t('estimatedCoverage')}: {metrics.containerCoverage.toFixed(1)}%</span></div>}
      {quality === 'low' && <div className="color-warning" role="alert"><Icons.info /><span>{t('logoLowResolution')}</span></div>}
      <div className={`logo-guard ${guard === 'unreadable' || risky ? 'warning' : guard === 'readable' ? 'success' : ''}`} role="status" aria-live="polite"><Icons.shield /><div><strong>{t('smartLogoGuard')}</strong><p>{t(guard === 'checking' ? 'logoChecking' : guard === 'readable' ? 'logoReadable' : guard === 'unreadable' ? 'logoUnreadable' : guard === 'unknown' || guard === 'error' ? 'logoGuardError' : 'logoGuardPending')}</p>{risky && <p>{t('logoLargeWarning')}</p>}{(guard === 'unreadable' || risky) && <button type="button" className="text-button" onClick={() => commit({ size: 0.2, visibleSize: 0.82, padding: Math.min(logo.padding, 10) })}>{t('reduceLogo')}</button>}<small>{t('logoGuardDisclaimer')}</small></div></div>
      {settings.errorCorrectionLevel !== 'H' && <div className="color-warning" role="alert"><Icons.info /><span>{t('logoEccWarning')}</span><button type="button" className="text-button" onClick={() => onChange({ ...settings, errorCorrectionLevel: 'H' })}>{t('useHCorrection')}</button></div>}
    </>}
    {error && <p className="error-message" role="alert">{error}</p>}
    <p className="logo-privacy"><Icons.shield />{t('logoPrivacy')}</p>
  </section>
}

function Choice({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) { return <button type="button" aria-pressed={selected} className={selected ? 'selected' : ''} onClick={onClick}>{children}</button> }
function Range({ value, min, max, label, onChange }: { value: number; min: number; max: number; label: string; onChange: (value: number) => void }) { return <label className="logo-range"><span>{label}</span><input type="range" min={min} max={max} value={value} onChange={(event) => onChange(Number(event.target.value))} /></label> }
function Group({ title, children }: { title: string; children: React.ReactNode }) { return <section className="logo-group"><h2>{title}</h2>{children}</section> }
