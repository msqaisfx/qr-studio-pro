import { describe, expect, it } from 'vitest'
import { getContentKind } from '../src/utils/content'

describe('content detection', () => {
  it('distinguishes empty, URL, and multilingual text content', () => {
    expect(getContentKind('   ')).toBe('empty')
    expect(getContentKind('https://example.com/path')).toBe('url')
    expect(getContentKind('مرحبا بالعالم')).toBe('text')
  })

  it('does not treat unsafe or unsupported protocols as web URLs', () => {
    expect(getContentKind('javascript:alert(1)')).toBe('text')
    expect(getContentKind('mailto:test@example.com')).toBe('text')
  })
})
