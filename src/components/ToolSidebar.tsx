import { useApp } from '../app/appContext'
import { Icons } from './icons'
import type { TranslationKey } from '../locales'

export type StudioTool = 'content' | 'shapes' | 'colors' | 'logo'

const tools: Array<{ id: string; key: TranslationKey; icon: typeof Icons.content; available: boolean }> = [
  { id: 'content', key: 'contentTool', icon: Icons.content, available: true },
  { id: 'shapes', key: 'shapesTool', icon: Icons.shapes, available: true },
  { id: 'colors', key: 'colorsTool', icon: Icons.colors, available: true },
  { id: 'logo', key: 'logoTool', icon: Icons.logo, available: true },
  { id: 'frames', key: 'framesTool', icon: Icons.frames, available: false },
  { id: 'templates', key: 'templatesTool', icon: Icons.templates, available: false },
  { id: 'export', key: 'exportTool', icon: Icons.export, available: false },
]

export function ToolSidebar({ activeTool, onSelect }: { activeTool: StudioTool; onSelect: (tool: StudioTool) => void }) {
  const { t } = useApp()
  return (
    <aside className="tool-sidebar" aria-label={t('tools')}>
      <div className="panel-title"><span>{t('tools')}</span><small>7</small></div>
      <nav className="tool-list">
        {tools.map(({ id, key, icon: Icon, available }) => {
          const active = activeTool === id
          return <button key={key} type="button" data-tool={id} className={`tool-item ${active ? 'active' : ''}`} disabled={!available} aria-current={active ? 'page' : undefined} aria-label={id === 'content' ? t('openContent') : id === 'shapes' ? t('openShapes') : id === 'colors' ? t('openColors') : id === 'logo' ? t('openLogo') : t(key)} title={!available ? t('unavailableReason') : undefined} onClick={() => available && onSelect(id as StudioTool)}>
            <span className="tool-icon"><Icon /></span>
            <span>{t(key)}</span>
            {!available && <small>{t('comingSoon')}</small>}
          </button>
        })}
      </nav>
      <div className="local-note"><Icons.shield /><span><strong>{t('privacy')}</strong><small>{t('privacyDetail')}</small></span></div>
    </aside>
  )
}
