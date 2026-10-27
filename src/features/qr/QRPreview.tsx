import { useEffect, useRef, useState, type CSSProperties } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { useApp } from '../../app/appContext'
import { getContentKind } from '../../utils/content'
import { Icons } from '../../components/icons'
import type { LogoGuardState, QrDesignSettings } from '../../types/qr'
import { verifyQrImage } from '../quality/decodeValidation'
import { appendPreparedQr, prepareQrEngine } from './qrEngine'
import { QR_SIZE } from './qrOptions'

interface QRPreviewProps {
  value: string
  settings: QrDesignSettings
  onLogoGuardChange: (state: LogoGuardState) => void
  onOpenExport: () => void
}

export function QRPreview({ value, settings, onLogoGuardChange, onOpenExport }: QRPreviewProps) {
  const { t } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [moduleCount, setModuleCount] = useState<number | null>(null)
  const [previewZoom, setPreviewZoom] = useState<'fit' | 1 | 1.5 | 2>('fit')
  const normalizedValue = value.trim()
  const kind = getContentKind(value)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.replaceChildren()
    setError(null)

    if (!normalizedValue) {
      qrRef.current = null
      return
    }

    let cancelled = false
    try {
      const { engine: qr, moduleCount: count } = prepareQrEngine(normalizedValue, settings, QR_SIZE)
      void appendPreparedQr(qr, container).then(() => { if (!cancelled) { qrRef.current = qr; setModuleCount(count) } }).catch(() => { if (!cancelled) setError(t('generationError')) })
    } catch {
      qrRef.current = null
      queueMicrotask(() => setError(t('generationError')))
    }
    return () => { cancelled = true }
  }, [normalizedValue, settings, t])

  useEffect(() => {
    if (!settings.logo.enabled || !settings.logo.renderedDataUrl || !normalizedValue) { onLogoGuardChange('idle'); return }
    let cancelled = false
    const timer = window.setTimeout(async () => {
      onLogoGuardChange('checking')
      try {
        const { engine } = prepareQrEngine(normalizedValue, settings, 512)
        const raw = await engine.getRawData('png')
        if (!(raw instanceof Blob)) throw new Error('missing-png')
        const bitmap = await createImageBitmap(raw)
        const verification = await verifyQrImage(bitmap, normalizedValue); bitmap.close()
        if (!cancelled) onLogoGuardChange(verification.status === 'pass' ? 'readable' : verification.status === 'fail' ? 'unreadable' : 'unknown')
      } catch { if (!cancelled) onLogoGuardChange('error') }
    }, 350)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [normalizedValue, settings, onLogoGuardChange])

  return (
    <section className="preview-panel" aria-labelledby="preview-title">
      <div className="canvas-toolbar">
        <div><span className="canvas-dot" /><span>{t('workspace')}</span></div>
        <div className="zoom-controls" role="group" aria-label={t('previewZoom')}>
          <button type="button" aria-pressed={previewZoom === 'fit'} onClick={() => setPreviewZoom('fit')}>{t('fitCanvas')}</button>
          {([1, 1.5, 2] as const).map((zoom) => <button type="button" key={zoom} aria-pressed={previewZoom === zoom} onClick={() => setPreviewZoom(zoom)}>{Math.round(zoom * 100)}%</button>)}
          <button type="button" onClick={() => setPreviewZoom('fit')} aria-label={t('resetZoom')}>{t('resetZoom')}</button>
        </div>
      </div>
      <div className="preview-stage" aria-live="polite" aria-busy="false">
        {!normalizedValue && (
          <div className="empty-state">
            <div className="empty-symbol" aria-hidden="true"><span /><span /><span /><span /></div>
            <strong>{t('emptyTitle')}</strong>
            <p>{t('emptyDescription')}</p>
          </div>
        )}
        <div className={normalizedValue && !error ? 'qr-artboard visible' : 'qr-artboard'} data-preview-zoom={previewZoom} style={{ '--preview-zoom': previewZoom === 'fit' ? 1 : previewZoom } as CSSProperties}>
          <div className="artboard-meta"><span id="preview-title">{t('preview')}</span><span>{moduleCount ? `${moduleCount} × ${moduleCount} modules` : '300 × 300'}</span></div>
          <div ref={containerRef} className="qr-canvas" aria-label={normalizedValue ? t('preview') : undefined} />
          <div className="artboard-caption"><span>{kind === 'url' ? <Icons.link /> : <Icons.text />}{kind === 'url' ? t('validUrl') : t('plainText')}</span><small>{normalizedValue.length} {t('characterCount')}</small></div>
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
      </div>
      <div className="canvas-footer"><span className={`generation-status ${normalizedValue && !error ? 'ready' : ''}`}><i />{normalizedValue && !error ? t('ready') : t('emptyContent')}</span><button className="download-button" type="button" onClick={onOpenExport} disabled={!normalizedValue || !!error}><Icons.download />{t('openExport')}</button></div>
    </section>
  )
}
