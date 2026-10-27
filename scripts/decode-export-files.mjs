import { readFile } from 'node:fs/promises'
import { basename } from 'node:path'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const expected = process.env.QR_EXPECTED_PAYLOAD
if (!expected || process.argv.length < 3) throw new Error('QR_EXPECTED_PAYLOAD and PNG paths are required')

const results = []
for (const path of process.argv.slice(2)) {
  const png = PNG.sync.read(await readFile(path))
  const decoded = jsQR(new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength), png.width, png.height, { inversionAttempts: 'attemptBoth' })
  results.push({ file: basename(path), width: png.width, height: png.height, decoded: decoded?.data ?? null, pass: decoded?.data === expected })
}
console.log(JSON.stringify(results, null, 2))
if (results.some((result) => !result.pass)) process.exitCode = 1
