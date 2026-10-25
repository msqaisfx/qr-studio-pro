import { defaultExportOptions, exportMimeTypes } from '../export/exportTypes'
import { PROJECT_FILE_KIND, PROJECT_SCHEMA_VERSION, type ProjectFile, type SavedProject } from './projectTypes'

export const MAX_PROJECT_FILE_BYTES = 7 * 1024 * 1024

const isObject = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
const contentTypes = ['website','text','wifi','vcard','whatsapp','email','phone','sms','location','event','crypto']
const patterns = ['square','dots','rounded','classy','classy-rounded','extra-rounded']

export function validateProject(value: unknown): SavedProject {
  if (!isObject(value)) throw new Error('invalid-project')
  if (value.schemaVersion !== PROJECT_SCHEMA_VERSION) throw new Error('unsupported-version')
  if (typeof value.id !== 'string' || !value.id || typeof value.name !== 'string' || !value.name.trim()) throw new Error('invalid-project')
  if (typeof value.createdAt !== 'string' || typeof value.updatedAt !== 'string' || Number.isNaN(Date.parse(value.createdAt)) || Number.isNaN(Date.parse(value.updatedAt))) throw new Error('invalid-project')
  if (!contentTypes.includes(String(value.contentType)) || !isObject(value.content) || !isObject(value.design) || !isObject(value.exportPreferences)) throw new Error('invalid-project')
  const content = value.content as Record<string, unknown>; const design = value.design as Record<string, unknown>; const options = value.exportPreferences as Record<string, unknown>
  if (content.activeType !== value.contentType || !isObject(content.forms) || typeof value.encodedPayload !== 'string') throw new Error('invalid-project')
  if (!patterns.includes(String(design.bodyPattern)) || !['L','M','Q','H'].includes(String(design.errorCorrectionLevel)) || design.quietZoneModules !== 4) throw new Error('invalid-project')
  if (!Object.keys(exportMimeTypes).includes(String(options.format)) || typeof options.filename !== 'string') throw new Error('invalid-project')
  const logo = isObject(design.logo) ? design.logo : null
  if (!logo || (logo.sourceDataUrl !== null && (typeof logo.sourceDataUrl !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/.test(logo.sourceDataUrl) || logo.sourceDataUrl.length > MAX_PROJECT_FILE_BYTES))) throw new Error('invalid-logo')
  return structuredClone(value) as unknown as SavedProject
}

export function parseProjectFile(text: string): SavedProject {
  if (new TextEncoder().encode(text).length > MAX_PROJECT_FILE_BYTES) throw new Error('file-too-large')
  let value: unknown; try { value = JSON.parse(text) } catch { throw new Error('malformed-json') }
  if (!isObject(value) || value.kind !== PROJECT_FILE_KIND || value.schemaVersion !== PROJECT_SCHEMA_VERSION) throw new Error('unsupported-version')
  return validateProject(value.project)
}

export function serializeProject(project: SavedProject): string {
  const file: ProjectFile = { kind: PROJECT_FILE_KIND, schemaVersion: PROJECT_SCHEMA_VERSION, exportedAt: new Date().toISOString(), project: validateProject(project) }
  return JSON.stringify(file, null, 2)
}

export function migrateProject(value: unknown): SavedProject {
  return validateProject(value)
}

export { defaultExportOptions }
