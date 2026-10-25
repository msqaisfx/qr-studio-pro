import type { TranslationKey } from '../../locales'
import type { QrColorStyle, QrDesignSettings } from '../../types/qr'

const solid = (color: string): QrColorStyle => ({ mode: 'solid', solid: color, stops: [{ offset: 0, color }, { offset: 1, color }], rotation: 0 })
const linear = (first: string, second: string, rotation = 0): QrColorStyle => ({ mode: 'linear', solid: first, stops: [{ offset: 0, color: first }, { offset: 1, color: second }], rotation })
const radial = (first: string, second: string): QrColorStyle => ({ mode: 'radial', solid: first, stops: [{ offset: 0, color: first }, { offset: 1, color: second }], rotation: 0 })

export interface ColorPreset {
  id: string
  label: TranslationKey
  body: QrColorStyle
  square: QrColorStyle
  dot: QrColorStyle
  background: string
}

export const colorPresets: ColorPreset[] = [
  { id: 'classic', label: 'presetClassic', body: solid('#000000'), square: solid('#000000'), dot: solid('#000000'), background: '#ffffff' },
  { id: 'midnight', label: 'presetMidnight', body: solid('#0b1f3a'), square: solid('#133c68'), dot: solid('#0b1f3a'), background: '#f8fbff' },
  { id: 'emerald', label: 'presetEmerald', body: solid('#063d2b'), square: solid('#087a52'), dot: solid('#063d2b'), background: '#f6fffb' },
  { id: 'royal', label: 'presetRoyal', body: solid('#241044'), square: solid('#6034a8'), dot: solid('#241044'), background: '#fdfaff' },
  { id: 'ocean', label: 'presetOcean', body: linear('#062f4f', '#087f8c', 35), square: solid('#065a74'), dot: solid('#062f4f'), background: '#f6fcff' },
  { id: 'sunset', label: 'presetSunset', body: linear('#7f1d1d', '#c2410c', 45), square: solid('#9f1239'), dot: solid('#7f1d1d'), background: '#fffaf5' },
  { id: 'corporate', label: 'presetCorporate', body: linear('#111827', '#1d4ed8', 0), square: solid('#1e3a8a'), dot: solid('#111827'), background: '#ffffff' },
  { id: 'minimal', label: 'presetMinimal', body: solid('#202826'), square: solid('#384743'), dot: solid('#202826'), background: '#f4f6f5' },
  { id: 'aurora', label: 'presetAurora', body: radial('#052e2b', '#0f766e'), square: solid('#115e59'), dot: solid('#052e2b'), background: '#f0fdfa' },
]

const cloneStyle = (style: QrColorStyle): QrColorStyle => ({ ...style, stops: style.stops.map((stop) => ({ ...stop })) })

export function applyColorPreset(settings: QrDesignSettings, preset: ColorPreset): QrDesignSettings {
  return {
    ...settings,
    bodyColor: cloneStyle(preset.body),
    cornerSquareColor: cloneStyle(preset.square),
    cornerDotColor: cloneStyle(preset.dot),
    background: { color: preset.background, transparent: false },
  }
}
