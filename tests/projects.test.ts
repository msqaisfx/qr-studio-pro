import { describe,expect,it } from 'vitest'
import { initialContentWorkspace } from '../src/features/content/contentTypes'
import { defaultExportOptions } from '../src/features/export/exportTypes'
import { MemoryProjectRepository, storageError } from '../src/features/projects/projectRepository'
import { containsSensitiveData, createProject, PROJECT_SCHEMA_VERSION } from '../src/features/projects/projectTypes'
import { migrateProject, parseProjectFile, serializeProject } from '../src/features/projects/projectValidation'
import { applyTemplate, designTemplates } from '../src/features/templates/templates'
import { defaultQrDesignSettings } from '../src/types/qr'

const workspace=structuredClone(initialContentWorkspace)
workspace.forms.website.url='https://example.com/project'
const sample=()=>createProject('Test project',{content:structuredClone(workspace),encodedPayload:'https://example.com/project',design:structuredClone(defaultQrDesignSettings),exportPreferences:structuredClone(defaultExportOptions)})

describe('local project architecture',()=>{
  it('performs transactional-style CRUD, rename, duplicate, and delete',async()=>{const db=new MemoryProjectRepository();const first=sample();await db.put(first);expect((await db.get(first.id))?.name).toBe('Test project');await db.put({...first,name:'Renamed',updatedAt:new Date(Date.now()+10).toISOString()});expect((await db.list())[0].name).toBe('Renamed');const copy=createProject('Copy',first);await db.put(copy);expect(await db.list()).toHaveLength(2);await db.delete(first.id);expect(await db.get(first.id)).toBeNull()})
  it('serializes and imports a versioned portable JSON file',()=>{const project=sample();expect(parseProjectFile(serializeProject(project))).toEqual(project)})
  it('rejects malformed and unsupported files',()=>{expect(()=>parseProjectFile('{bad')).toThrow('malformed-json');expect(()=>parseProjectFile(JSON.stringify({kind:'qr-studio-pro-project',schemaVersion:99,project:{}}))).toThrow('unsupported-version')})
  it('validates the current schema and migration entry point',()=>{const project=sample();expect(migrateProject(project).schemaVersion).toBe(PROJECT_SCHEMA_VERSION);expect(()=>migrateProject({...project,schemaVersion:2})).toThrow('unsupported-version')})
  it('preserves an embedded logo through save and restore',async()=>{const db=new MemoryProjectRepository();const project=sample();project.design.logo={...project.design.logo,enabled:true,sourceDataUrl:'data:image/png;base64,aGVsbG8=',renderedDataUrl:'data:image/png;base64,aGVsbG8=',fileName:'logo.png',mimeType:'image/png',width:10,height:10};await db.put(project);expect((await db.get(project.id))?.design.logo.sourceDataUrl).toBe(project.design.logo.sourceDataUrl)})
  it('detects sensitive forms without logging their values',()=>{const sensitive=structuredClone(workspace);sensitive.activeType='wifi';sensitive.forms.wifi={type:'wifi',ssid:'private',password:'secret',security:'WPA',hidden:false};expect(containsSensitiveData(sensitive)).toBe(true);expect(containsSensitiveData(workspace)).toBe(false)})
  it('normalizes storage quota errors',()=>{expect(storageError(new DOMException('full','QuotaExceededError')).message).toBe('storage-quota')})
  it('provides twelve editable templates',()=>{expect(designTemplates).toHaveLength(12);expect(new Set(designTemplates.map(item=>item.id)).size).toBe(12)})
  it('applies a template while preserving logo, export size, and correction',()=>{const current=structuredClone(defaultQrDesignSettings);current.exportSize=2048;current.errorCorrectionLevel='H';current.logo.enabled=true;const next=applyTemplate(current,designTemplates[11]);expect(next.bodyColor.mode).toBe('linear');expect(next.logo.enabled).toBe(true);expect(next.exportSize).toBe(2048);expect(next.errorCorrectionLevel).toBe('H')})
  it('returns clones so callers cannot mutate stored projects',async()=>{const db=new MemoryProjectRepository();const project=sample();await db.put(project);const opened=await db.get(project.id);opened!.name='Changed outside';expect((await db.get(project.id))?.name).toBe('Test project')})
})
