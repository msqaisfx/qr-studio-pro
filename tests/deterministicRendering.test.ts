import { describe, expect, it } from 'vitest'
import type QRCodeStyling from 'qr-code-styling'
import { createDesignSnapshot, stableConfigurationHash } from '../src/features/qr/designSnapshot'
import { appendPreparedQr } from '../src/features/qr/qrEngine'
import { defaultQrDesignSettings } from '../src/types/qr'

describe('deterministic render snapshots', () => {
  it('produces the same configuration hash for equivalent final settings', () => {
    const left = structuredClone(defaultQrDesignSettings)
    const right = structuredClone(defaultQrDesignSettings)
    left.logo.renderedDataUrl = 'data:image/png;base64,old-derived-preview'
    right.logo.renderedDataUrl = 'data:image/png;base64,new-derived-preview'
    expect(stableConfigurationHash('fixed payload', left)).toBe(stableConfigurationHash('fixed payload', right))
  })

  it('invalidates the hash when an effective logo setting changes', () => {
    const twenty = structuredClone(defaultQrDesignSettings); twenty.logo.size = .2
    const thirtyFive = structuredClone(defaultQrDesignSettings); thirtyFive.logo.size = .35
    expect(stableConfigurationHash('fixed payload', twenty)).not.toBe(stableConfigurationHash('fixed payload', thirtyFive))
  })

  it('invalidates the hash when error correction changes', () => {
    const medium = structuredClone(defaultQrDesignSettings); medium.errorCorrectionLevel = 'M'
    const high = structuredClone(defaultQrDesignSettings); high.errorCorrectionLevel = 'H'
    expect(stableConfigurationHash('fixed payload', medium)).not.toBe(stableConfigurationHash('fixed payload', high))
  })

  it('freezes an immutable clone rather than sharing mutable design state', () => {
    const settings = structuredClone(defaultQrDesignSettings)
    const snapshot = createDesignSnapshot('fixed payload', settings)
    settings.logo.size = .35
    expect(snapshot.settings.logo.size).toBe(.2)
    expect(snapshot.configurationHash).toBe(stableConfigurationHash('fixed payload', snapshot.settings))
    expect(Object.isFrozen(snapshot.settings)).toBe(true)
    expect(Object.isFrozen(snapshot.settings.logo)).toBe(true)
  })

  it('atomically replaces a preview and ignores a superseded async render', async () => {
    const container = document.createElement('div'); document.body.append(container)
    let releaseOld!: () => void
    let releaseNew!: () => void
    const deferred = (label: string, release: (value: () => void) => void) => ({
      getRawData: () => new Promise<Blob>((resolve) => release(() => resolve(new Blob(['svg'])))),
      append: (target: HTMLElement) => { const svg = document.createElement('svg'); svg.dataset.render = label; target.append(svg) },
    }) as unknown as QRCodeStyling
    let current = 1
    const oldRender = appendPreparedQr(deferred('old', (value) => { releaseOld = value }), container, () => current === 1)
    current = 2
    const newRender = appendPreparedQr(deferred('new', (value) => { releaseNew = value }), container, () => current === 2)
    releaseNew(); await newRender
    releaseOld(); await oldRender
    expect(container.querySelectorAll('svg')).toHaveLength(1)
    expect(container.querySelector('svg')).toHaveAttribute('data-render', 'new')
  })
})
