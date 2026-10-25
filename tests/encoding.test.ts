import { describe, expect, it } from 'vitest'
import { encodeQrData } from '../src/features/qr/encoding'

describe('QR UTF-8 encoding', () => {
  it('keeps ASCII unchanged', () => {
    expect(encodeQrData('https://example.com')).toBe('https://example.com')
  })

  it('converts Arabic into the UTF-8 byte string expected by the QR engine', () => {
    const bytes = [...encodeQrData('مرحبا')].map((character) => character.charCodeAt(0))
    expect(bytes).toEqual([...new TextEncoder().encode('مرحبا')])
  })
})
