import { useApp } from '../../app/appContext'
import { getContentKind } from '../../utils/content'
import { Icons } from '../../components/icons'

interface ContentEditorProps {
  value: string
  onChange: (value: string) => void
}

export function ContentEditor({ value, onChange }: ContentEditorProps) {
  const { t } = useApp()
  const kind = getContentKind(value)
  return (
    <section className="content-editor" aria-labelledby="content-label">
      <div className="editor-heading">
        <div><span className="section-kicker">01 / {t('contentTool')}</span><h1 id="content-label">{t('contentLabel')}</h1></div>
        {value && <button type="button" className="text-button" onClick={() => onChange('')}>{t('clear')}</button>}
      </div>
      <div className="field-label"><span>{t('contentMode')}</span><small>{t('contentModeAuto')}</small></div>
      <div className="type-display"><span className="type-icon">{kind === 'url' ? <Icons.link /> : <Icons.text />}</span><strong>{kind === 'url' ? t('validUrl') : t('plainText')}</strong><span className={`validation-dot ${kind !== 'empty' ? 'valid' : ''}`} /></div>
      <label className="field-label" htmlFor="qr-content"><span>{t('contentLabel')}</span><small>{value.length} {t('characterCount')}</small></label>
      <div className="input-shell">
        <Icons.content className="input-icon" />
        <textarea
          id="qr-content"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={t('contentPlaceholder')}
          aria-labelledby="content-label"
          rows={5}
          autoFocus
        />
      </div>
      <p className="field-hint">{t('contentHint')}</p>
    </section>
  )
}
