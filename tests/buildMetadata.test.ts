import { describe,expect,it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { releaseChannel } from '../src/app/buildMetadata'

describe('release metadata',()=>{
  it('classifies development, beta, and stable builds',()=>{expect(releaseChannel('1.0.0-beta.1','development')).toBe('development');expect(releaseChannel('1.0.0-beta.1','production')).toBe('beta');expect(releaseChannel('1.0.0','production')).toBe('stable')})
  it('uses package.json as the only release-version source',async()=>{const root=process.cwd();const [app,en,ar,vite,pkg]=await Promise.all(['src/app/App.tsx','src/locales/en.ts','src/locales/ar.ts','vite.config.ts','package.json'].map(file=>readFile(join(root,file),'utf8')));const version=(JSON.parse(pkg) as {version:string}).version;expect(version).toBe('0.9.4-beta.1');expect(`${app}${en}${ar}`).not.toMatch(/0\.9\.\d+-beta\.\d+/);expect(app).toContain('buildMetadata.version');expect(vite).toContain("readFileSync(new URL('./package.json'");expect(vite).toContain('version:appVersion')})
  it('versions PWA caches without touching IndexedDB',async()=>{const vite=await readFile(join(process.cwd(),'vite.config.ts'),'utf8');expect(vite).toContain("'qr-studio-'+APP_VERSION");expect(vite).toContain("keys.filter(key=>key.startsWith('qr-studio-')&&key!==VERSION)");expect(vite).not.toMatch(/deleteDatabase|indexedDB/)})
})
