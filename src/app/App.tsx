import { useState } from 'react'
import { Header } from '../components/Header'
import { ToolSidebar, type StudioTool } from '../components/ToolSidebar'
import { InspectorPanel } from '../components/InspectorPanel'
import { ContentEditor } from '../features/editor/ContentEditor'
import { QRPreview } from '../features/qr/QRPreview'
import { ShapesPanel } from '../features/qr/ShapesPanel'
import { defaultQrDesignSettings, type QrDesignSettings } from '../types/qr'
import { useApp } from './appContext'

export function App() {
  const [content, setContent] = useState('')
  const [activeTool, setActiveTool] = useState<StudioTool>('content')
  const [settings, setSettings] = useState<QrDesignSettings>(defaultQrDesignSettings)
  const { t } = useApp()
  return (
    <div className="app-shell" id="top">
      <Header />
      <main className="studio-main">
        <div className="studio-intro"><div><span>QR STUDIO / 03</span><h2>{t('tagline')}</h2><p>{t('intro')}</p></div></div>
        <div className="studio-grid">
          <ToolSidebar activeTool={activeTool} onSelect={setActiveTool} />
          <section className="editor-column">{activeTool === 'content' ? <ContentEditor value={content} onChange={setContent} /> : <ShapesPanel settings={settings} onChange={setSettings} />}</section>
          <QRPreview value={content} settings={settings} />
          <InspectorPanel value={content} settings={settings} />
        </div>
      </main>
      <footer>{t('footer')}</footer>
    </div>
  )
}
