import { useApp } from '../app/appContext'
import { Icons } from './icons'
import type { QrDesignSettings } from '../types/qr'
import type { ContentType } from '../features/content/contentTypes'
import type { TranslationKey } from '../locales'

const typeLabels:Record<ContentType,TranslationKey>={website:'typeWebsite',text:'typeText',wifi:'typeWifi',vcard:'typeVcard',whatsapp:'typeWhatsapp',email:'typeEmail',phone:'typePhone',sms:'typeSms',location:'typeLocation',event:'typeEvent',crypto:'typeCrypto'}

export function InspectorPanel({ value, settings, contentType }: { value: string; settings: QrDesignSettings; contentType:ContentType }) {
  const { t } = useApp()
  const isReady = Boolean(value.trim())
  const kindLabel = isReady ? t(typeLabels[contentType]) : t('emptyContent')

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
