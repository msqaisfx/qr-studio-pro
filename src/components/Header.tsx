import { useApp } from '../app/appContext'

export function Header() {
  const { language, theme, setLanguage, setTheme, t } = useApp()
  return (
    <header className="site-header">
      <a className="brand" href="#top" aria-label="QR Studio Pro">
        <LogoMark />
        <span><strong>QR Studio <b>Pro</b></strong><small>{t('studio')}</small></span>
      </a>
      <nav className="header-actions" aria-label="Preferences">
        <span className="local-status"><i />{t('localProject')}</span>
        <button className="control-button language-button" type="button" onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')} aria-label={t('languageLabel')}>
          <GlobeIcon /> <span>{t('language')}</span>
        </button>
        <button className="control-button icon-button" type="button" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} aria-label={theme === 'dark' ? t('themeLight') : t('themeDark')} title={theme === 'dark' ? t('themeLight') : t('themeDark')}>
          {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
        </button>
      </nav>
    </header>
  )
}

function LogoMark() { return <span className="logo-tile"><svg className="logo-mark" viewBox="0 0 32 32" aria-hidden="true"><rect x="3" y="3" width="10" height="10" rx="2"/><rect x="19" y="3" width="10" height="10" rx="2"/><rect x="3" y="19" width="10" height="10" rx="2"/><path d="M19 19h4v4h-4zm6 0h4v10h-4zm-6 6h4v4h-4z"/></svg></span> }
function GlobeIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg> }
function SunIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg> }
function MoonIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.5 15.5A9 9 0 0 1 8.5 3.5a9 9 0 1 0 12 12Z"/></svg> }
