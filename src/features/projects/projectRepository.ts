import { migrateProject } from './projectValidation'
import type { ProjectRepository, SavedProject } from './projectTypes'

const DB_NAME = 'qr-studio-pro'
const DB_VERSION = 1
const STORE = 'projects'

export function storageError(error: unknown): Error {
  if (error instanceof DOMException && error.name === 'QuotaExceededError') return new Error('storage-quota')
  return error instanceof Error ? error : new Error('storage-error')
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => { const db = request.result; if (!db.objectStoreNames.contains(STORE)) { const store = db.createObjectStore(STORE, { keyPath: 'id' }); store.createIndex('updatedAt', 'updatedAt') } }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(storageError(request.error))
    request.onblocked = () => reject(new Error('storage-blocked'))
  })
}

async function transaction<T>(mode: IDBTransactionMode, action: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDatabase()
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, mode); const request = action(tx.objectStore(STORE)); let result: T
    request.onsuccess = () => { result = request.result }
    request.onerror = () => reject(storageError(request.error))
    tx.oncomplete = () => { db.close(); resolve(result) }
    tx.onerror = () => { db.close(); reject(storageError(tx.error)) }
    tx.onabort = () => { db.close(); reject(storageError(tx.error)) }
  })
}

export const indexedDbProjectRepository: ProjectRepository = {
  async list() { const values = await transaction<unknown[]>('readonly', (store) => store.getAll()); return values.map(migrateProject).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)) },
  async get(id) { const value = await transaction<unknown>('readonly', (store) => store.get(id)); return value ? migrateProject(value) : null },
  async put(project) { await transaction<IDBValidKey>('readwrite', (store) => store.put(migrateProject(project))) },
  async delete(id) { await transaction<undefined>('readwrite', (store) => store.delete(id)) },
}

export class MemoryProjectRepository implements ProjectRepository {
  private records = new Map<string, SavedProject>()
  async list() { return [...this.records.values()].map((value)=>structuredClone(value)).sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)) }
  async get(id: string) { const value = this.records.get(id); return value ? structuredClone(value) : null }
  async put(project: SavedProject) { this.records.set(project.id, structuredClone(project)) }
  async delete(id: string) { this.records.delete(id) }
}
