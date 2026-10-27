import type { QrDesignSettings } from '../../types/qr'

const canonicalize = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== 'renderedDataUrl')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, entry]) => [key, canonicalize(entry)]))
  }
  return value
}

const deepFreeze = <Value>(value: Value): Value => {
  if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value
  Object.freeze(value)
  for (const entry of Object.values(value as Record<string, unknown>)) deepFreeze(entry)
  return value
}

/** Stable, non-cryptographic identity for invalidating render/validation work. */
export function stableConfigurationHash(payload: string, settings: QrDesignSettings, extra?: unknown): string {
  const serialized = JSON.stringify(canonicalize({ payload, settings, extra }))
  let left = 0x811c9dc5
  let right = 0x9e3779b9
  for (let index = 0; index < serialized.length; index += 1) {
    const code = serialized.charCodeAt(index)
    left = Math.imul(left ^ code, 0x01000193)
    right = Math.imul(right ^ (code + index), 0x85ebca6b)
  }
  return `${(left >>> 0).toString(16).padStart(8, '0')}${(right >>> 0).toString(16).padStart(8, '0')}`
}

export interface ImmutableDesignSnapshot {
  id: string
  configurationHash: string
  payload: string
  settings: QrDesignSettings
}

export function createDesignSnapshot(payload: string, settings: QrDesignSettings, extra?: unknown): ImmutableDesignSnapshot {
  const immutableSettings = deepFreeze(structuredClone(settings))
  const configurationHash = stableConfigurationHash(payload, immutableSettings, extra)
  return Object.freeze({
    id: `${configurationHash}-${crypto.randomUUID()}`,
    configurationHash,
    payload,
    settings: immutableSettings,
  })
}
