import QRCodeStyling from 'qr-code-styling'
import type { QrDesignSettings } from '../../types/qr'
import { createQrOptions } from './qrOptions'
import { calculateQuietZone, getModuleCount, type QrEngineWithModules } from './quietZone'
import { encodeQrData } from './encoding'

export interface PreparedQr {
  engine: QRCodeStyling
  moduleCount: number
  margin: number
}

export function prepareQrEngine(data: string, settings: QrDesignSettings, size: number): PreparedQr {
  const encodedData = encodeQrData(data)
  const engine = new QRCodeStyling(createQrOptions(encodedData, settings, size, 0))
  const moduleCount = getModuleCount(engine as QRCodeStyling & QrEngineWithModules)
  const margin = calculateQuietZone(size, moduleCount, settings.quietZoneModules)
  engine.update(createQrOptions(encodedData, settings, size, margin))
  return { engine, moduleCount, margin }
}
