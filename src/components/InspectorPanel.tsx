import { useApp } from '../app/appContext'
import { getContentKind } from '../utils/content'
import { Icons } from './icons'
import type { QrDesignSettings } from '../types/qr'

export function InspectorPanel({ value, settings }: { value: string; settings: QrDesignSettings }) {
  const { t } = useApp()
  const kind = getContentKind(value)
  const kindLabel = kind === 'url' ? t('validUrl') : kind === 'text' ? t('plainText') : t('emptyContent')
  const isReady = kind !== 'empty'

  return (
    <aside className="inspector-panel" aria-labelledby="inspector-title">
      <div className="panel-title"><span id="inspector-title">{t('inspector')}</span><span className={`status-dot ${isReady ? 'ready' : ''}`} /></div>
      <dl className="inspector-list">
        <InfoRow label={t('status')} value={isReady ? t('ready') : t('emptyContent')} accent={isReady} />
        <InfoRow label={t('contentType')} value={kindLabel} />
        <InfoRow label={t('exportFormat')} value="PNG" mono />
        <InfoRow label={t('exportSize')} value={`${settings.exportSize} × ${settings.exportSize} px`} mono />
        <InfoRow label={t('errorCorrection')} value={settings.errorCorrectionLevel} />
        <InfoRow label={t('quietZone')} value={`4 modules`} />
      </dl>
      <div className="privacy-callout"><Icons.info /><p>{t('privacyNote')}</p></div>
    </aside>
  )
}

function InfoRow({ label, value, mono, accent }: { label: string; value: string; mono?: boolean; accent?: boolean }) {
  return <div><dt>{label}</dt><dd className={`${mono ? 'mono' : ''} ${accent ? 'accent' : ''}`}>{accent && <Icons.check />}{value}</dd></div>
}
