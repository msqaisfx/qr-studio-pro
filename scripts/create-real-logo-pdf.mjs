import { readFile, writeFile } from 'node:fs/promises'
import { PDFDocument } from 'pdf-lib'

const [source, destination] = process.argv.slice(2)
if (!source || !destination) throw new Error('Usage: node create-real-logo-pdf.mjs <png> <pdf>')

const document = await PDFDocument.create()
const page = document.addPage([595.28, 841.89])
const qr = await document.embedPng(await readFile(source))
const size = 340.16
page.drawImage(qr, { x: (595.28 - size) / 2, y: (841.89 - size) / 2, width: size, height: size })
document.setProducer('QR Studio Pro')
document.setCreator('QR Studio Pro')
await writeFile(destination, await document.save())
