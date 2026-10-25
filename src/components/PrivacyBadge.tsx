import { useApp } from '../app/appContext'

export function PrivacyBadge() {
  const { t } = useApp()
  return <div className="privacy-badge"><ShieldIcon /><span><strong>{t('privacy')}</strong><small>{t('privacyDetail')}</small></span></div>
}

function ShieldIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3 5 6v5c0 4.5 2.8 8.1 7 10 4.2-1.9 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/></svg> }
