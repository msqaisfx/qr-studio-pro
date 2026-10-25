import { useEffect, useRef, useState } from 'react'
import QRCodeStyling from 'qr-code-styling'
import jsQR from 'jsqr'
import { useApp } from '../../app/appContext'
import { getContentKind } from '../../utils/content'
import { Icons } from '../../components/icons'
import type { LogoGuardState, QrDesignSettings } from '../../types/qr'
import { encodeQrData } from './encoding'
import { prepareQrEngine } from './qrEngine'
import { QR_SIZE } from './qrOptions'

interface QRPreviewProps {
  value: string
  settings: QrDesignSettings
  onLogoGuardChange: (state: LogoGuardState) => void
}

export function QRPreview({ value, settings, onLogoGuardChange }: QRPreviewProps) {
  const { t } = useApp()
  const containerRef = useRef<HTMLDivElement>(null)
  const qrRef = useRef<QRCodeStyling | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)
  const [moduleCount, setModuleCount] = useState<number | null>(null)
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

    try {
      const { engine: qr, moduleCount: count } = prepareQrEngine(normalizedValue, settings, QR_SIZE)
      qr.append(container)
      qrRef.current = qr
      queueMicrotask(() => setModuleCount(count))
    } catch {
      qrRef.current = null
      queueMicrotask(() => setError(t('generationError')))
    }
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
        const canvas = document.createElement('canvas'); canvas.width = bitmap.width; canvas.height = bitmap.height
        const context = canvas.getContext('2d'); if (!context) throw new Error('missing-context')
        context.drawImage(bitmap, 0, 0); bitmap.close()
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height)
        const decoded = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'attemptBoth' })
        if (!cancelled) onLogoGuardChange(decoded?.data === encodeQrData(normalizedValue) || decoded?.data === normalizedValue ? 'readable' : 'unreadable')
      } catch { if (!cancelled) onLogoGuardChange('error') }
    }, 350)
    return () => { cancelled = true; window.clearTimeout(timer) }
  }, [normalizedValue, settings, onLogoGuardChange])

  async function downloadQr() {
    if (!qrRef.current || !normalizedValue) return
    setIsDownloading(true)
    setError(null)
    try {
      const { engine } = prepareQrEngine(normalizedValue, settings, settings.exportSize)
      await engine.download({ name: 'qr-studio-pro', extension: 'png' })
    } catch {
      setError(t('downloadError'))
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <section className="preview-panel" aria-labelledby="preview-title">
      <div className="canvas-toolbar">
        <div><span className="canvas-dot" /><span>{t('workspace')}</span></div>
        <span className="zoom-label">100%</span>
      </div>
      <div className="preview-stage" aria-live="polite" aria-busy="false">
        {!normalizedValue && (
          <div className="empty-state">
            <div className="empty-symbol" aria-hidden="true"><span /><span /><span /><span /></div>
            <strong>{t('emptyTitle')}</strong>
            <p>{t('emptyDescription')}</p>
          </div>
        )}
        <div className={normalizedValue && !error ? 'qr-artboard visible' : 'qr-artboard'}>
          <div className="artboard-meta"><span id="preview-title">{t('preview')}</span><span>{moduleCount ? `${moduleCount} × ${moduleCount} modules` : '300 × 300'}</span></div>
          <div ref={containerRef} className="qr-canvas" aria-label={normalizedValue ? t('preview') : undefined} />
          <div className="artboard-caption"><span>{kind === 'url' ? <Icons.link /> : <Icons.text />}{kind === 'url' ? t('validUrl') : t('plainText')}</span><small>{normalizedValue.length} {t('characterCount')}</small></div>
        </div>
        {error && <p className="error-message" role="alert">{error}</p>}
      </div>
      <div className="canvas-footer"><span className={`generation-status ${normalizedValue && !error ? 'ready' : ''}`}><i />{normalizedValue && !error ? t('ready') : t('emptyContent')}</span><button className="download-button" type="button" onClick={downloadQr} disabled={!normalizedValue || !!error || isDownloading}><Icons.download />{isDownloading ? t('downloading') : t('download')}</button></div>
    </section>
  )
}
