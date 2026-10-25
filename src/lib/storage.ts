export const storageKeys = {
  language: 'qr-studio-pro:language',
  theme: 'qr-studio-pro:theme',
} as const

export function readStoredValue<T extends string>(key: string, allowed: readonly T[], fallback: T): T {
  try {
    const value = localStorage.getItem(key)
    return value && allowed.includes(value as T) ? (value as T) : fallback
  } catch {
    return fallback
  }
}

export function storeValue(key: string, value: string): void {
  try {
    localStorage.setItem(key, value)
  } catch {
    // The app remains usable when storage is unavailable.
  }
}
