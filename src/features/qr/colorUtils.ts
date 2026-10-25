import type { Gradient, Options } from 'qr-code-styling'
import type { QrColorStyle, QrGradientStop } from '../../types/qr'

export const HEX_PATTERN = /^#[0-9a-f]{6}$/i

export function isValidHex(value: string): boolean {
  return HEX_PATTERN.test(value)
}

export function normalizeHex(value: string): string | null {
  const candidate = value.trim().startsWith('#') ? value.trim() : `#${value.trim()}`
  return isValidHex(candidate) ? candidate.toLowerCase() : null
}

export function toQrColorOptions(style: QrColorStyle): Pick<NonNullable<Options['dotsOptions']>, 'color' | 'gradient'> {
  if (style.mode === 'solid') return { color: style.solid, gradient: undefined }
  const gradient: Gradient = {
    type: style.mode,
    rotation: style.mode === 'linear' ? (style.rotation * Math.PI) / 180 : 0,
    colorStops: style.stops.map((stop) => ({ offset: stop.offset, color: stop.color })),
  }
  return { color: undefined, gradient }
}

function channel(value: number): number {
  const normalized = value / 255
  return normalized <= 0.04045 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4
}

export function relativeLuminance(hex: string): number {
  const value = normalizeHex(hex)
  if (!value) throw new Error('Invalid HEX color')
  return 0.2126 * channel(parseInt(value.slice(1, 3), 16)) + 0.7152 * channel(parseInt(value.slice(3, 5), 16)) + 0.0722 * channel(parseInt(value.slice(5, 7), 16))
}

export function contrastRatio(foreground: string, background: string): number {
  const first = relativeLuminance(foreground)
  const second = relativeLuminance(background)
  return (Math.max(first, second) + 0.05) / (Math.min(first, second) + 0.05)
}

export function colorsForStyle(style: QrColorStyle): string[] {
  return style.mode === 'solid' ? [style.solid] : style.stops.map((stop) => stop.color)
}

export function minimumContrast(styles: QrColorStyle[], background: string): number {
  return Math.min(...styles.flatMap(colorsForStyle).map((color) => contrastRatio(color, background)))
}

export function normalizeStops(stops: QrGradientStop[]): QrGradientStop[] {
  return [...stops].sort((a, b) => a.offset - b.offset).map((stop, index, array) => ({
    color: normalizeHex(stop.color) ?? '#000000',
    offset: index === 0 ? 0 : index === array.length - 1 ? 1 : Math.max(0, Math.min(1, stop.offset)),
  }))
}
