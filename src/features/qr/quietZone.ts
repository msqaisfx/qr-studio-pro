export function calculateQuietZone(size: number, moduleCount: number, quietZoneModules = 4): number {
  if (!Number.isFinite(size) || !Number.isFinite(moduleCount) || size <= 0 || moduleCount <= 0) {
    throw new Error('Invalid QR geometry')
  }
  const cellSize = Math.floor(size / (moduleCount + quietZoneModules * 2))
  if (cellSize < 1) throw new Error('Export size is too small for a safe quiet zone')
  // qr-code-styling recalculates and centers whole-pixel modules after margin is removed.
  // Reserving the complete non-module remainder guarantees >= N final module widths per side.
  return Math.ceil((size - cellSize * moduleCount) / 2)
}

export interface QrEngineWithModules {
  _qr?: { getModuleCount(): number }
}

export function getModuleCount(engine: QrEngineWithModules): number {
  const count = engine._qr?.getModuleCount()
  if (!count || count < 21) throw new Error('QR module count is unavailable')
  return count
}
