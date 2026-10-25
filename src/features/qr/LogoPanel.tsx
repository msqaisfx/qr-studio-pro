import { useEffect, useId, useRef, useState, type DragEvent } from 'react'
import { useApp } from '../../app/appContext'
import { Icons } from '../../components/icons'
import type { LogoBackgroundMode, LogoGuardState, LogoShape, QrDesignSettings } from '../../types/qr'
import { isConservativeLogoSize, logoCoveragePercent, readLogoFile, renderLogo } from './logoUtils'

export function LogoPanel({ settings, onChange, guard }: { settings: QrDesignSettings; onChange: (settings: QrDesignSettings) => void; guard: LogoGuardState }) {
  const { t } = useApp(); const inputId = useId(); const sequence = useRef(0); const [error, setError] = useState<string | null>(null); const [dragging, setDragging] = useState(false)
  const logo = settings.logo
  const update = (patch: Partial<typeof logo>) => onChange({ ...settings, logo: { ...logo, ...patch } })

  useEffect(() => {
    if (!logo.sourceDataUrl) return
    const request = ++sequence.current
    renderLogo(logo.sourceDataUrl, logo.shape, logo.backgroundMode, logo.backgroundColor, logo.padding)
      .then((renderedDataUrl) => { if (request === sequence.current && renderedDataUrl !== logo.renderedDataUrl) update({ renderedDataUrl }) })
      .catch(() => { if (request === sequence.current) setError(t('logoCorrupt')) })
    return () => { sequence.current += 1 }
  // Only regenerate when visual controls or source change.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [logo.sourceDataUrl, logo.shape, logo.backgroundMode, logo.backgroundColor, logo.padding])

  async function accept(file?: File) {
    if (!file) return
    setError(null)
    try { const image = await readLogoFile(file); onChange({ ...settings, logo: { ...logo, ...image, fileName: file.name, enabled: true, renderedDataUrl: null } }) }
    catch (reason) { const code = reason instanceof Error ? reason.message : 'corrupt'; setError(t(code === 'too-large' ? 'logoTooLarge' : code === 'dimensions' ? 'logoDimensions' : code === 'unsupported' ? 'logoUnsupported' : 'logoCorrupt')) }
  }
  function drop(event: DragEvent) { event.preventDefault(); setDragging(false); void accept(event.dataTransfer.files[0]) }
  const coverage = logoCoveragePercent(logo.size)
  const risky = !isConservativeLogoSize(logo.size, logo.padding)
  return <section className="logo-panel" aria-labelledby="logo-title">
    <div className="editor-heading"><div><span className="section-kicker">04 / {t('logoTool')}</span><h1 id="logo-title">{t('logoStudio')}</h1></div>{logo.enabled && <button type="button" className="text-button" onClick={() => update({ enabled: false, sourceDataUrl: null, renderedDataUrl: null, fileName: null })}>{t('removeLogo')}</button>}</div>
    {!logo.enabled ? <label htmlFor={inputId} className={`logo-dropzone ${dragging ? 'dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={drop}><Icons.logo /><strong>{t('uploadLogo')}</strong><span>{t('dropLogo')}</span><small>{t('logoFileHint')}</small><input id={inputId} type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void accept(event.target.files?.[0])} /></label> : <>
      <div className="logo-file-card"><img src={logo.renderedDataUrl ?? logo.sourceDataUrl ?? ''} alt={t('logoPreview')} /><div><strong>{logo.fileName}</strong><span>{logo.width} × {logo.height}px · {logo.mimeType}</span></div><label className="replace-logo">{t('replaceLogo')}<input type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => void accept(event.target.files?.[0])} /></label></div>
      <Group title={t('logoSize')}><label className="logo-range"><span>{Math.round(logo.size * 100)}% · {coverage.toFixed(1)}% {t('estimatedCoverage')}</span><input data-logo-size type="range" min="10" max="30" value={Math.round(logo.size * 100)} onChange={(event) => update({ size: Number(event.target.value) / 100 })} /></label></Group>
      <Group title={t('logoShape')}><div className="option-row">{(['square','circle','rounded'] as LogoShape[]).map((shape) => <button type="button" data-logo-shape={shape} aria-pressed={logo.shape === shape} className={logo.shape === shape ? 'selected' : ''} onClick={() => update({ shape })} key={shape}>{t(shape === 'square' ? 'logoSquare' : shape === 'circle' ? 'logoCircle' : 'logoRounded')}</button>)}</div></Group>
      <Group title={t('logoBackground')}><div className="option-row">{(['white','custom','transparent'] as LogoBackgroundMode[]).map((mode) => <button type="button" data-logo-background={mode} aria-pressed={logo.backgroundMode === mode} className={logo.backgroundMode === mode ? 'selected' : ''} onClick={() => update({ backgroundMode: mode })} key={mode}>{t(mode === 'white' ? 'backgroundWhite' : mode === 'custom' ? 'backgroundCustom' : 'transparentBackground')}</button>)}</div>{logo.backgroundMode === 'custom' && <label className="logo-color"><span>{t('backgroundCustom')}</span><input type="color" value={logo.backgroundColor} onChange={(event) => update({ backgroundColor: event.target.value })} /></label>}</Group>
      <Group title={t('logoPadding')}><label className="logo-range"><span>{logo.padding}%</span><input data-logo-padding type="range" min="0" max="24" value={logo.padding} onChange={(event) => update({ padding: Number(event.target.value) })} /></label></Group>
      <div className={`logo-guard ${guard === 'unreadable' || guard === 'error' || risky ? 'warning' : guard === 'readable' ? 'success' : ''}`} role="status" aria-live="polite"><Icons.shield /><div><strong>{t('smartLogoGuard')}</strong><p>{t(guard === 'checking' ? 'logoChecking' : guard === 'readable' ? 'logoReadable' : guard === 'unreadable' ? 'logoUnreadable' : guard === 'error' ? 'logoGuardError' : 'logoGuardPending')}</p>{risky && <p>{t('logoLargeWarning')}</p>}{(guard === 'unreadable' || risky) && <button data-safe-logo type="button" className="text-button" onClick={() => update({ size: 0.18, padding: Math.min(logo.padding, 12) })}>{t('reduceLogo')}</button>}<small>{t('logoGuardDisclaimer')}</small></div></div>
      {settings.errorCorrectionLevel !== 'H' && <div className="color-warning" role="alert"><Icons.info /><span>{t('logoEccWarning')}</span><button type="button" className="text-button" onClick={() => onChange({ ...settings, errorCorrectionLevel: 'H' })}>{t('useHCorrection')}</button></div>}
    </>}
    {error && <p className="error-message" role="alert">{error}</p>}
    <p className="logo-privacy"><Icons.shield />{t('logoPrivacy')}</p>
  </section>
}

function Group({ title, children }: { title: string; children: React.ReactNode }) { return <section className="logo-group"><h2>{title}</h2>{children}</section> }
