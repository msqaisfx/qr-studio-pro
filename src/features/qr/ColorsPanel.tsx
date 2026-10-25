import { useId, useState, type ReactNode } from 'react'
import { useApp } from '../../app/appContext'
import { Icons } from '../../components/icons'
import type { TranslationKey } from '../../locales'
import { defaultBodyColor, defaultCornerDotColor, defaultCornerSquareColor, type QrColorMode, type QrColorStyle, type QrDesignSettings } from '../../types/qr'
import { colorPresets, applyColorPreset } from './colorPresets'
import { minimumContrast, normalizeHex, normalizeStops } from './colorUtils'

type ColorTarget = 'bodyColor' | 'cornerSquareColor' | 'cornerDotColor'
const targets: Array<[ColorTarget, TranslationKey]> = [['bodyColor', 'bodyColor'], ['cornerSquareColor', 'cornerSquareColor'], ['cornerDotColor', 'cornerDotColor']]
const modes: Array<[QrColorMode, TranslationKey]> = [['solid', 'solidColor'], ['linear', 'linearGradient'], ['radial', 'radialGradient']]

export function ColorsPanel({ settings, onChange }: { settings: QrDesignSettings; onChange: (settings: QrDesignSettings) => void }) {
  const { t } = useApp()
  const [target, setTarget] = useState<ColorTarget>('bodyColor')
  const style = settings[target]
  const updateStyle = (next: QrColorStyle) => onChange({ ...settings, [target]: next })
  const reset = () => onChange({ ...settings, bodyColor: defaultBodyColor, cornerSquareColor: defaultCornerSquareColor, cornerDotColor: defaultCornerDotColor, background: { color: '#ffffff', transparent: false } })

  function updateStop(index: number, patch: Partial<{ color: string; offset: number }>) {
    const stops = style.stops.map((stop, stopIndex) => stopIndex === index ? { ...stop, ...patch } : stop)
    updateStyle({ ...style, stops: normalizeStops(stops) })
  }

  function addStop() {
    if (style.stops.length >= 5) return
    const next = [...style.stops, { offset: 0.5, color: '#374151' }]
    updateStyle({ ...style, stops: normalizeStops(next) })
  }

  function removeStop(index: number) {
    if (style.stops.length <= 2) return
    updateStyle({ ...style, stops: normalizeStops(style.stops.filter((_, stopIndex) => stopIndex !== index)) })
  }

  return (
    <section className="colors-panel" aria-labelledby="colors-title">
      <div className="editor-heading"><div><span className="section-kicker">03 / {t('colorsTool')}</span><h1 id="colors-title">{t('colorStudio')}</h1></div><button type="button" className="text-button" onClick={reset}>{t('resetColors')}</button></div>
      <PanelGroup title={t('colorPresets')}>
        <div className="preset-grid">{colorPresets.map((preset) => <button type="button" key={preset.id} data-preset={preset.id} className="preset-card" onClick={() => onChange(applyColorPreset(settings, preset))}><span style={{ background: previewBackground(preset.body) }} /><small>{t(preset.label)}</small></button>)}</div>
      </PanelGroup>
      <PanelGroup title={t('colorTarget')}>
        <div className="target-tabs">{targets.map(([value, label]) => <button type="button" key={value} data-color-target={value} aria-pressed={target === value} className={target === value ? 'selected' : ''} onClick={() => setTarget(value)}>{t(label)}</button>)}</div>
      </PanelGroup>
      <PanelGroup title={t('colorStudio')}>
        <div className="mode-tabs">{modes.map(([mode, label]) => <button type="button" key={mode} data-color-mode={mode} aria-pressed={style.mode === mode} className={style.mode === mode ? 'selected' : ''} onClick={() => updateStyle({ ...style, mode })}>{t(label)}</button>)}</div>
        {style.mode === 'solid' ? <ColorField key={`${target}-${style.solid}`} label={t('hexColor')} value={style.solid} onChange={(solid) => updateStyle({ ...style, solid })} /> : (
          <div className="gradient-editor">
            <div className="gradient-preview" style={{ background: previewBackground(style) }} />
            <div className="stops-heading"><span>{t('gradientStops')}</span><button type="button" onClick={addStop} disabled={style.stops.length >= 5}>+ {t('addStop')}</button></div>
            {style.stops.map((stop, index) => <div className="stop-row" key={`${index}-${stop.offset}`}><ColorField key={stop.color} label={`${t('gradientStops')} ${index + 1}`} value={stop.color} onChange={(color) => updateStop(index, { color })} compact /><label><span>{t('stopPosition')}</span><input type="range" min="0" max="100" value={Math.round(stop.offset * 100)} disabled={index === 0 || index === style.stops.length - 1} onChange={(event) => updateStop(index, { offset: Number(event.target.value) / 100 })} aria-label={`${t('stopPosition')} ${index + 1}`} /></label><button type="button" className="remove-stop" disabled={style.stops.length <= 2} onClick={() => removeStop(index)} aria-label={`${t('removeStop')} ${index + 1}`}>×</button></div>)}
            {style.mode === 'linear' && <label className="rotation-control"><span>{t('gradientRotation')} <b>{style.rotation}°</b></span><input type="range" min="0" max="360" step="5" value={style.rotation} onChange={(event) => updateStyle({ ...style, rotation: Number(event.target.value) })} /></label>}
          </div>
        )}
      </PanelGroup>
      <PanelGroup title={t('backgroundColor')}>
        <ColorField key={settings.background.color} label={t('backgroundColor')} value={settings.background.color} onChange={(color) => onChange({ ...settings, background: { ...settings.background, color, transparent: false } })} />
        <label className="transparent-toggle"><input type="checkbox" data-transparent checked={settings.background.transparent} onChange={(event) => onChange({ ...settings, background: { ...settings.background, transparent: event.target.checked } })} /><span>{t('transparentBackground')}</span></label>
        {settings.background.transparent && <div className="color-warning" role="alert"><Icons.info /><span>{t('transparencyWarning')}</span></div>}
      </PanelGroup>
      <ContrastGuard settings={settings} />
    </section>
  )
}

function PanelGroup({ title, children }: { title: string; children: ReactNode }) { return <section className="color-group"><h2>{title}</h2>{children}</section> }

function ColorField({ label, value, onChange, compact = false }: { label: string; value: string; onChange: (value: string) => void; compact?: boolean }) {
  const { t } = useApp()
  const id = useId()
  const [draft, setDraft] = useState(value)
  const [invalid, setInvalid] = useState(false)
  function commit(candidate: string) { const normalized = normalizeHex(candidate); if (normalized) { setInvalid(false); setDraft(normalized); onChange(normalized) } else setInvalid(true) }
  return <div className={`color-field ${compact ? 'compact' : ''}`}><label htmlFor={id}>{label}</label><div><input type="color" value={value} onChange={(event) => commit(event.target.value)} aria-label={`${label} color picker`} /><input id={id} type="text" value={draft} onChange={(event) => { setDraft(event.target.value); setInvalid(!normalizeHex(event.target.value)) }} onBlur={() => commit(draft)} aria-invalid={invalid} aria-describedby={invalid ? `${id}-error` : undefined} spellCheck="false" /></div>{invalid && <small id={`${id}-error`} role="alert">{t('invalidHex')}</small>}</div>
}

function ContrastGuard({ settings }: { settings: QrDesignSettings }) {
  const { t } = useApp()
  if (settings.background.transparent) return <div className="contrast-card warning" role="status"><Icons.info /><div><strong>{t('contrastUnknown')}</strong><p>{t('contrastDisclaimer')}</p></div></div>
  const ratio = minimumContrast([settings.bodyColor, settings.cornerSquareColor, settings.cornerDotColor], settings.background.color)
  const state = ratio >= 4 ? 'strong' : ratio >= 2.5 ? 'moderate' : 'low'
  const label = state === 'strong' ? t('contrastStrong') : state === 'moderate' ? t('contrastModerate') : t('contrastLow')
  return <div className={`contrast-card ${state === 'low' ? 'warning' : ''}`} role="status"><span className="contrast-icon">{state === 'strong' ? <Icons.check /> : <Icons.info />}</span><div><strong>{t('contrastGuard')}: {label}</strong><span>{t('contrastRatio')}: {ratio.toFixed(2)}:1</span><p>{t('contrastDisclaimer')}</p></div></div>
}

function previewBackground(style: QrColorStyle): string {
  if (style.mode === 'solid') return style.solid
  const stops = style.stops.map((stop) => `${stop.color} ${Math.round(stop.offset * 100)}%`).join(', ')
  return style.mode === 'linear' ? `linear-gradient(${style.rotation}deg, ${stops})` : `radial-gradient(circle, ${stops})`
}
