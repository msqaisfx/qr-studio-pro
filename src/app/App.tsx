import { useState } from 'react'
import { Header } from '../components/Header'
import { ToolSidebar, type StudioTool } from '../components/ToolSidebar'
import { InspectorPanel } from '../components/InspectorPanel'
import { ContentEditor } from '../features/editor/ContentEditor'
import { QRPreview } from '../features/qr/QRPreview'
import { ShapesPanel } from '../features/qr/ShapesPanel'
import { ColorsPanel } from '../features/qr/ColorsPanel'
import { LogoPanel } from '../features/qr/LogoPanel'
import { defaultQrDesignSettings, type LogoGuardState, type QrDesignSettings } from '../types/qr'
import { useApp } from './appContext'

export function App() {
  const [content, setContent] = useState('')
  const [activeTool, setActiveTool] = useState<StudioTool>('content')
  const [settings, setSettings] = useState<QrDesignSettings>(defaultQrDesignSettings)
  const [logoGuard, setLogoGuard] = useState<LogoGuardState>('idle')
  const { t } = useApp()
  return (
    <div className="app-shell" id="top">
      <Header />
      <main className="studio-main">
        <div className="studio-intro"><div><span>QR STUDIO / 05</span><h2>{t('tagline')}</h2><p>{t('intro')}</p></div></div>
        <div className="studio-grid">
          <ToolSidebar activeTool={activeTool} onSelect={setActiveTool} />
          <section className="editor-column">{activeTool === 'content' ? <ContentEditor value={content} onChange={setContent} /> : activeTool === 'shapes' ? <ShapesPanel settings={settings} onChange={setSettings} /> : activeTool === 'colors' ? <ColorsPanel settings={settings} onChange={setSettings} /> : <LogoPanel settings={settings} onChange={setSettings} guard={logoGuard} />}</section>
          <QRPreview value={content} settings={settings} onLogoGuardChange={setLogoGuard} />
          <InspectorPanel value={content} settings={settings} />
        </div>
      </main>
      <footer>{t('footer')}</footer>
    </div>
  )
}
