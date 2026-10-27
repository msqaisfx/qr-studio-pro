import { describe, expect, it } from 'vitest'
import { classifyDecodeResults } from '../src/features/quality/decodeValidation'

describe('multi-reader QR decode policy', () => {
  it('passes only when a reader returns the expected payload', () => {
    expect(classifyDecodeResults('hello', [
      { reader: 'jsqr', value: null, completed: true },
      { reader: 'zxing', value: 'hello', completed: true },
    ]).status).toBe('pass')
  })

  it('fails immediately on a decoded payload mismatch', () => {
    const result = classifyDecodeResults('expected', [{ reader: 'jsqr', value: 'other', completed: true }])
    expect(result.status).toBe('fail')
    expect(result.evidence).toContain('payload-mismatch')
  })

  it('requires two completed reader families to confirm no decode', () => {
    expect(classifyDecodeResults('hello', [{ reader: 'jsqr', value: null, completed: true }]).status).toBe('unknown')
    expect(classifyDecodeResults('hello', [
      { reader: 'jsqr', value: null, completed: true },
      { reader: 'zxing', value: null, completed: true },
    ]).status).toBe('fail')
  })

  it('keeps decoder infrastructure failures UNKNOWN', () => {
    expect(classifyDecodeResults('hello', [
      { reader: 'jsqr', value: null, completed: true },
      { reader: 'zxing', value: null, completed: false },
    ]).status).toBe('unknown')
  })
})
