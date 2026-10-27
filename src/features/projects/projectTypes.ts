import type { ContentWorkspace, ContentType } from '../content/contentTypes'
import type { ExportOptions } from '../export/exportTypes'
import type { QrDesignSettings } from '../../types/qr'

export const PROJECT_SCHEMA_VERSION = 4 as const
export const PROJECT_FILE_KIND = 'qr-studio-pro-project' as const

export interface ProjectSnapshot {
  content: ContentWorkspace
  encodedPayload: string
  design: QrDesignSettings
  exportPreferences: ExportOptions
}

export interface SavedProject extends ProjectSnapshot {
  id: string
  name: string
  createdAt: string
  updatedAt: string
  contentType: ContentType
  schemaVersion: typeof PROJECT_SCHEMA_VERSION
}

export interface ProjectFile {
  kind: typeof PROJECT_FILE_KIND
  schemaVersion: typeof PROJECT_SCHEMA_VERSION
  exportedAt: string
  project: SavedProject
}

export interface ProjectRepository {
  list(): Promise<SavedProject[]>
  get(id: string): Promise<SavedProject | null>
  put(project: SavedProject): Promise<void>
  delete(id: string): Promise<void>
}

export type SaveState = 'idle' | 'saving' | 'saved' | 'error'

export function containsSensitiveData(content: ContentWorkspace): boolean {
  const form = content.forms[content.activeType]
  return form.type === 'wifi' ? Boolean(form.password) : ['vcard', 'whatsapp', 'email', 'phone', 'sms', 'crypto'].includes(form.type)
}

export function createProject(name: string, snapshot: ProjectSnapshot): SavedProject {
  const now = new Date().toISOString()
  return { ...structuredClone(snapshot), id: crypto.randomUUID(), name: name.trim(), createdAt: now, updatedAt: now, contentType: snapshot.content.activeType, schemaVersion: PROJECT_SCHEMA_VERSION }
}
