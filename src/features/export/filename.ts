import type { ExportFormat } from './exportTypes'

const reserved = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])$/i

export function sanitizeFilename(input: string, format: ExportFormat): string {
  const printable = [...input.normalize('NFC')].map((character) => {
    const code = character.charCodeAt(0)
    return code < 32 || code === 127 ? '-' : character
  }).join('')
  const base = printable
    .replace(/[/\\:*?"<>|]/g, '-')
    .replace(/\.\.+/g, '.')
    .replace(/^[-. ]+|[. ]+$/g, '')
    .replace(/\s+/g, ' ')
    .slice(0, 120)
  const safe = !base || reserved.test(base) ? 'qr-studio-pro' : base
  const withoutKnownExtension = safe.replace(/\.(png|svg|webp|jpe?g|pdf)$/i, '') || 'qr-studio-pro'
  return `${withoutKnownExtension}.${format === 'jpeg' ? 'jpg' : format}`
}
