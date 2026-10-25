import type { CornerDotType, CornerSquareType, DotType, ErrorCorrectionLevel } from 'qr-code-styling'
import { useApp } from '../../app/appContext'
import type { TranslationKey } from '../../locales'
import type { QrDesignSettings, QrExportSize } from '../../types/qr'
import { Icons } from '../../components/icons'

interface ShapesPanelProps {
  settings: QrDesignSettings
  onChange: (next: QrDesignSettings) => void
}

const bodyPatterns: Array<[DotType, TranslationKey]> = [
  ['square', 'patternSquare'], ['dots', 'patternDots'], ['rounded', 'patternRounded'],
  ['classy', 'patternClassy'], ['classy-rounded', 'patternClassyRounded'], ['extra-rounded', 'patternExtraRounded'],
]
const squareStyles: Array<[CornerSquareType, TranslationKey]> = [
  ['square', 'patternSquare'], ['dot', 'cornerDotOption'], ['extra-rounded', 'patternExtraRounded'],
]
const dotStyles: Array<[CornerDotType, TranslationKey]> = [['square', 'patternSquare'], ['dot', 'cornerDotOption']]
const sizes: QrExportSize[] = [256, 512, 1024, 2048]
const levels: Array<[ErrorCorrectionLevel, TranslationKey]> = [['L', 'levelL'], ['M', 'levelM'], ['Q', 'levelQ'], ['H', 'levelH']]

export function ShapesPanel({ settings, onChange }: ShapesPanelProps) {
  const { t } = useApp()
  const update = <K extends keyof QrDesignSettings>(key: K, value: QrDesignSettings[K]) => onChange({ ...settings, [key]: value })

  return (
    <section className="shapes-panel" aria-labelledby="shapes-title">
      <div className="editor-heading"><div><span className="section-kicker">02 / {t('shapesTool')}</span><h1 id="shapes-title">{t('shapeStudio')}</h1></div></div>
      <OptionGroup legend={t('bodyPattern')}>
        <div className="pattern-grid">{bodyPatterns.map(([value, label]) => <PatternOption key={value} value={value} label={t(label)} selected={settings.bodyPattern === value} onSelect={() => update('bodyPattern', value)} />)}</div>
      </OptionGroup>
      <OptionGroup legend={t('cornerSquare')}>
        <div className="corner-options">{squareStyles.map(([value, label]) => <CornerOption key={value} value={value} label={t(label)} selected={settings.cornerSquareStyle === value} onSelect={() => update('cornerSquareStyle', value)} square />)}</div>
      </OptionGroup>
      <OptionGroup legend={t('cornerDot')}>
        <div className="corner-options">{dotStyles.map(([value, label]) => <CornerOption key={value} value={value} label={t(label)} selected={settings.cornerDotStyle === value} onSelect={() => update('cornerDotStyle', value)} />)}</div>
      </OptionGroup>
      <OptionGroup legend={t('qrSize')} description={t('qrSizeHint')}>
        <div className="size-grid">{sizes.map((size) => <ChoiceButton key={size} selected={settings.exportSize === size} onClick={() => update('exportSize', size)} label={`${size}px`} />)}</div>
      </OptionGroup>
      <div className="quiet-zone-card"><Icons.shield /><span><strong>{t('quietZoneSafe')}</strong><small>{t('quietZoneCalculated')}</small></span></div>
      <OptionGroup legend={t('errorCorrection')}>
        <div className="level-list">{levels.map(([level, description]) => <button type="button" key={level} data-error-level={level} className={settings.errorCorrectionLevel === level ? 'level-option selected' : 'level-option'} onClick={() => update('errorCorrectionLevel', level)} aria-pressed={settings.errorCorrectionLevel === level}><b>{level}</b><span>{t(description)}</span>{settings.errorCorrectionLevel === level && <Icons.check />}</button>)}</div>
      </OptionGroup>
    </section>
  )
}

function OptionGroup({ legend, description, children }: { legend: string; description?: string; children: React.ReactNode }) {
  return <fieldset className="option-group"><legend>{legend}</legend>{description && <p>{description}</p>}{children}</fieldset>
}

function PatternOption({ value, label, selected, onSelect }: { value: string; label: string; selected: boolean; onSelect: () => void }) {
  return <button type="button" data-pattern={value} className={selected ? 'pattern-option selected' : 'pattern-option'} onClick={onSelect} aria-pressed={selected}><PatternSwatch type={value} /><span>{label}</span></button>
}

function PatternSwatch({ type }: { type: string }) {
  return <span className={`pattern-swatch pattern-${type}`} aria-hidden="true">{Array.from({ length: 9 }, (_, index) => <i key={index} />)}</span>
}

function CornerOption({ value, label, selected, onSelect, square = false }: { value: string; label: string; selected: boolean; onSelect: () => void; square?: boolean }) {
  return <button type="button" data-corner-kind={square ? 'square' : 'dot'} data-corner-style={value} className={selected ? 'corner-option selected' : 'corner-option'} onClick={onSelect} aria-pressed={selected}><span className={`corner-swatch corner-${value} ${square ? 'outer' : ''}`}><i /></span><span>{label}</span></button>
}

function ChoiceButton({ selected, onClick, label }: { selected: boolean; onClick: () => void; label: string }) {
  return <button type="button" data-export-size={label.replace('px', '')} className={selected ? 'choice-button selected' : 'choice-button'} onClick={onClick} aria-pressed={selected}>{label}</button>
}
