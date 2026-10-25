export type ContentKind = 'empty' | 'url' | 'text'

export function getContentKind(value: string): ContentKind {
  const normalized = value.trim()
  if (!normalized) return 'empty'
  try {
    const url = new URL(normalized)
    return url.protocol === 'http:' || url.protocol === 'https:' ? 'url' : 'text'
  } catch {
    return 'text'
  }
}
