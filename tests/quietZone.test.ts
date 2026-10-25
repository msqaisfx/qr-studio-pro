import { describe, expect, it } from 'vitest'
import { calculateQuietZone } from '../src/features/qr/quietZone'

describe('quiet zone geometry', () => {
  it.each([256, 512, 1024, 2048])('reserves at least four actual modules at %ipx', (size) => {
    const moduleCount = 29
    const margin = calculateQuietZone(size, moduleCount, 4)
    const renderedCell = Math.floor((size - margin * 2) / moduleCount)
    const effectiveQuietZone = (size - renderedCell * moduleCount) / 2
    expect(effectiveQuietZone).toBeGreaterThanOrEqual(renderedCell * 4)
  })

  it('rejects invalid geometry', () => {
    expect(() => calculateQuietZone(0, 29)).toThrow('Invalid QR geometry')
  })
})
