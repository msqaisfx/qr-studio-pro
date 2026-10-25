export function encodeQrData(value: string): string {
  const bytes = new TextEncoder().encode(value)
  let encoded = ''
  for (const byte of bytes) encoded += String.fromCharCode(byte)
  return encoded
}
