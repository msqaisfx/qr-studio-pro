import { verifyQrImage } from '../quality/decodeValidation'

async function blobImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return image
  } finally { window.setTimeout(() => URL.revokeObjectURL(url), 0) }
}

export async function decodeExportBlob(blob: Blob, expected: string): Promise<boolean> {
  let source: ImageBitmap | HTMLImageElement
  try { source = await createImageBitmap(blob) } catch { source = await blobImage(blob) }
  const result = await verifyQrImage(source, expected)
  if ('close' in source) source.close()
  return result.status === 'pass'
}
