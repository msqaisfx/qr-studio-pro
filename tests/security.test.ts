import { describe, expect, it } from 'vitest'
import { buildPayload } from '../src/features/content/contentTypes'
import { detectImageMime, validateLogoBytes } from '../src/features/qr/logoUtils'
import { createProject } from '../src/features/projects/projectTypes'
import { parseProjectFile, serializeProject } from '../src/features/projects/projectValidation'
import { initialContentWorkspace } from '../src/features/content/contentTypes'
import { defaultQrDesignSettings } from '../src/types/qr'
import { defaultExportOptions } from '../src/features/export/exportTypes'

const sampleProject = () => createProject('Security fixture', {
  content: structuredClone(initialContentWorkspace), encodedPayload: 'safe',
  design: structuredClone(defaultQrDesignSettings), exportPreferences: structuredClone(defaultExportOptions),
})

describe('Phase 11 security boundaries', () => {
  it('rejects script and data schemes as website payloads', () => {
    for (const url of ['javascript:alert(1)', 'data:text/html,<script>alert(1)</script>', 'file:///etc/passwd']) {
      expect(buildPayload({ type: 'website', url }, 'M').error).toBe('invalidWebsite')
    }
  })

  it('keeps HTML-looking plain text inert as payload data', () => {
    const attack = '<img src=x onerror=alert(1)><script>globalThis.pwned=true</script>'
    const result = buildPayload({ type: 'text', text: attack }, 'M')
    expect(result.valid).toBe(true)
    expect(result.payload).toBe(attack)
    expect((globalThis as typeof globalThis & { pwned?: boolean }).pwned).toBeUndefined()
  })

  it('rejects SVG and extension-spoofed logo bytes', () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>')
    expect(detectImageMime(svg)).toBeNull()
    expect(() => validateLogoBytes(svg, svg.length)).toThrow('unsupported')
  })

  it('rejects malformed, oversized-shaped, and unsupported project JSON', () => {
    expect(() => parseProjectFile('{"__proto__":{"polluted":true}}')).toThrow()
    expect(() => parseProjectFile(JSON.stringify({ kind: 'qr-studio-pro-project', schemaVersion: 1, project: { __proto__: { polluted: true } } }))).toThrow()
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
  })

  it('round-trips validated JSON without prototype pollution', () => {
    const parsed = parseProjectFile(serializeProject(sampleProject()))
    expect(parsed.name).toBe('Security fixture')
    expect(Object.prototype.hasOwnProperty.call(parsed, '__proto__')).toBe(false)
    expect(({} as { polluted?: boolean }).polluted).toBeUndefined()
  })
})
