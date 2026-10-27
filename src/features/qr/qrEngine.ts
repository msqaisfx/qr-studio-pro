import QRCodeStyling from 'qr-code-styling'
import type { QrDesignSettings } from '../../types/qr'
import { createQrOptions } from './qrOptions'
import { calculateQuietZone, getModuleCount, type QrEngineWithModules } from './quietZone'
import { encodeQrData } from './encoding'
import { getLogoVisualScale, renderLogoDetailed, resolveLogoGeometry } from './logoUtils'

export interface PreparedQr {
  engine: QRCodeStyling
  moduleCount: number
  margin: number
}

/** Waits for async image loading/extensions so an appended live preview is never an empty SVG. */
export async function appendPreparedQr(engine: QRCodeStyling, container: HTMLElement, isCurrent: () => boolean = () => true): Promise<void> {
  if (typeof engine.getRawData === 'function') await engine.getRawData('svg')
  const staging = document.createElement('div')
  engine.append(staging)
  if (container.isConnected && isCurrent()) container.replaceChildren(...staging.childNodes)
}

/** Materializes the exact current logo from its original source at export-appropriate quality. */
export async function materializeQrSettings(settings: QrDesignSettings, qrSize: number): Promise<QrDesignSettings> {
  const snapshot = structuredClone(settings)
  if (!snapshot.logo.enabled) return snapshot
  if (!snapshot.logo.sourceDataUrl) throw new Error('logo-source-missing')
  const target = Math.max(768, Math.ceil(qrSize * Math.min(0.5, snapshot.logo.size / Math.max(0.01, getLogoVisualScale(snapshot.logo.visibleSize, snapshot.logo.padding))) * 1.5))
  const rendered = await renderLogoDetailed(snapshot.logo.sourceDataUrl, snapshot.logo, target)
  snapshot.logo.renderedDataUrl = rendered.dataUrl
  return snapshot
}

export async function prepareQrEngineAsync(data: string, settings: QrDesignSettings, size: number): Promise<PreparedQr & { settings: QrDesignSettings }> {
  const materialized = await materializeQrSettings(settings, size)
  return { ...prepareQrEngine(data, materialized, size), settings: materialized }
}

export function prepareQrEngine(data: string, settings: QrDesignSettings, size: number): PreparedQr {
  const encodedData = encodeQrData(data)
  const engine = new QRCodeStyling(createQrOptions(encodedData, settings, size, 0))
  const moduleCount = getModuleCount(engine as QRCodeStyling & QrEngineWithModules)
  const margin = calculateQuietZone(size, moduleCount, settings.quietZoneModules)
  engine.update(createQrOptions(encodedData, settings, size, margin, moduleCount))
  if (settings.logo.enabled && settings.logo.renderedDataUrl) {
    const geometry = resolveLogoGeometry(settings.logo, moduleCount, settings.errorCorrectionLevel, settings.logo.width / Math.max(1, settings.logo.height))
    const carrierRatio = geometry.appliedSize / getLogoVisualScale(settings.logo.visibleSize, settings.logo.padding)
    engine.applyExtension((svg, options) => {
      const image = svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg', 'image')
      const width = Number(options.width ?? size); const height = Number(options.height ?? size); const optionMargin = Number(options.margin ?? margin)
      const fieldSize = moduleCount * Math.floor((Math.min(width, height) - 2 * optionMargin) / moduleCount)
      const carrier = fieldSize * carrierRatio
      image.setAttribute('href', settings.logo.renderedDataUrl ?? '')
      image.setAttribute('x', String((width - carrier) / 2))
      image.setAttribute('y', String((height - carrier) / 2))
      image.setAttribute('width', String(carrier))
      image.setAttribute('height', String(carrier))
      image.setAttribute('preserveAspectRatio', 'none')
      image.setAttribute('data-qr-studio-logo', 'true')
      svg.appendChild(image)
    })
  }
  return { engine, moduleCount, margin }
}
