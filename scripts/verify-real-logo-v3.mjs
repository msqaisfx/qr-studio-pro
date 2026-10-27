import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const sourcePath = process.env.QR_STUDIO_REAL_LOGO
if (!sourcePath) throw new Error('QR_STUDIO_REAL_LOGO is required')
const appUrl = process.env.QR_STUDIO_URL || 'http://127.0.0.1:5176/'
const output = process.env.QR_STUDIO_ARTIFACTS || new URL('../artifacts/smart-logo-fusion-v3/real-logo-acceptance/', import.meta.url).pathname
const temp = `/private/tmp/qr-studio-real-logo-${Date.now()}`; const downloads = join(temp, 'downloads')
await mkdir(output, { recursive: true }); await mkdir(downloads, { recursive: true })
const source = await readFile(sourcePath); const sourceBase64 = source.toString('base64')
const chromePort = 9362
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--hide-scrollbars','--disable-gpu','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${chromePort}`,`--user-data-dir=${temp}/profile`,appUrl], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); let targets
for (let index = 0; index < 100; index += 1) { try { targets = await (await fetch(`http://127.0.0.1:${chromePort}/json`)).json(); if (targets.length) break } catch {} await sleep(100) }
const target = targets?.find((item) => item.type === 'page'); if (!target) throw new Error('Chrome unavailable')
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0; const pending = new Map(); const runtimeErrors = []
socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text); if (message.id && pending.has(message.id)) { const handler = pending.get(message.id); pending.delete(message.id); message.error?.message?.includes('Inspected target navigated or closed') ? handler.resolve({ result: { value: undefined } }) : message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result) } })
const send = (method, params = {}) => new Promise((resolve, reject) => { const messageId = ++id; pending.set(messageId, { resolve, reject }); socket.send(JSON.stringify({ id: messageId, method, params })) })
const js = async (expression) => { const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.text); return response.result.value }
const waitFor = async (expression, label, count = 240) => { for (let index = 0; index < count; index += 1) { if (await js(expression)) return; await sleep(100) } throw new Error(`Timed out: ${label}`) }
const shot = async (name) => { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }); await writeFile(join(output, `${name}.png`), Buffer.from(result.data, 'base64')) }
const clickText = async (selector, label) => { const clicked = await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.textContent.trim()===${JSON.stringify(label)});e?.click();return Boolean(e)})()`); if (!clicked) throw new Error(`Missing control: ${label}`); await sleep(450) }
const upload = async (base64, name) => js(`new Promise(resolve=>{const bytes=Uint8Array.from(atob(${JSON.stringify(base64)}),c=>c.charCodeAt(0));const d=new DataTransfer();d.items.add(new File([bytes],${JSON.stringify(name)},{type:'image/png'}));document.querySelector('.logo-dropzone').dispatchEvent(new DragEvent('drop',{dataTransfer:d,bubbles:true}));resolve()})`)
const saveDataUrl = async (selector, name) => { const dataUrl = await js(`document.querySelector(${JSON.stringify(selector)})?.src`); if (!dataUrl?.startsWith('data:')) throw new Error(`Missing data URL: ${name}`); await writeFile(join(output, name), Buffer.from(dataUrl.split(',')[1], 'base64')) }
const setSize = async (percent) => {
  await js(`(()=>{const e=document.querySelector('.logo-size-stepper input');const setter=Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set;setter.call(e,${JSON.stringify(String(percent))});e.dispatchEvent(new InputEvent('input',{bubbles:true,inputType:'insertText',data:${JSON.stringify(String(percent))}}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await waitFor(`document.querySelector('.logo-size-stepper input')?.value===${JSON.stringify(String(percent))}`, `logo size ${percent}%`); await sleep(900)
}
const nextDownload = async (before, extension) => { for (let index = 0; index < 300; index += 1) { const names = await readdir(downloads); const found = names.find((name) => !before.has(name) && !name.endsWith('.crdownload') && name.toLowerCase().endsWith(`.${extension}`)); if (found) return found; await sleep(100) } throw new Error(`.${extension} download missing`) }
const exportCurrent = async (format, filename) => {
  await js(`document.querySelector('[data-tool="export"]').click()`); await waitFor(`Boolean(document.querySelector('.export-download'))`, 'export panel')
  await js(`document.querySelector('[data-export-format=${JSON.stringify(format)}]').click()`); await waitFor(`document.querySelector('[data-export-format=${JSON.stringify(format)}]')?.getAttribute('aria-pressed')==='true'`, `${format} selected`)
  if (format !== 'svg') await js(`(()=>{const e=document.querySelector('#export-resolution');if(!e)return;Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,'value').set.call(e,'512');e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await js(`(()=>{const e=document.querySelector('#export-filename');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(filename)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  const before = new Set(await readdir(downloads)); await js(`document.querySelector('.export-download').click()`)
  const extension = format === 'jpeg' ? 'jpg' : format; const downloaded = await nextDownload(before, extension); const bytes = await readFile(join(downloads, downloaded)); const destination = join(output, `${filename}.${extension}`); await writeFile(destination, bytes)
  await js(`document.querySelector('[data-tool="logo"]').click()`); await waitFor(`Boolean(document.querySelector('.logo-file-card'))`, 'logo panel return')
  return { format, bytes: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex'), path: basename(destination) }
}
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads })
  await waitFor(`Boolean(document.querySelector('.app-shell'))`, 'app shell')
  await js(`localStorage.setItem('qr-studio-pro:language','en');localStorage.setItem('qr-studio-pro:theme','light');location.reload()`).catch(() => undefined)
  await waitFor(`document.documentElement.lang==='en' && Boolean(document.querySelector('#content-url'))`, 'English UI')
  await js(`(()=>{const e=document.querySelector('#content-url');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'https://msqaisfx.github.io/qr-studio-pro/');e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-tool="shapes"]').click()})()`)
  await waitFor(`Boolean(document.querySelector('[data-error-level="H"]'))`, 'shapes'); await js(`document.querySelector('[data-error-level="H"]').click();document.querySelector('[data-tool="logo"]').click()`)
  await waitFor(`Boolean(document.querySelector('.logo-dropzone'))`, 'logo panel'); await upload(sourceBase64, basename(sourcePath)); await waitFor(`Boolean(document.querySelector('.logo-file-card img')) && Boolean(document.querySelector('.logo-metrics'))`, 'real logo')
  await js(`document.querySelector('.logo-toggle:nth-of-type(2) input')?.click()`); await sleep(300)
  const fullInitial = await js(`document.querySelector('.logo-metrics')?.textContent`); await saveDataUrl('.logo-file-card img', 'full-brand-original.png'); await shot('01-v2-original')
  await clickText('.logo-group button', 'Remove solid background'); const fullProcessed = await js(`document.querySelector('.logo-metrics')?.textContent`); await saveDataUrl('.logo-file-card img', 'full-brand-processed.png'); await shot('02-v3-auto-trim')
  await clickText('.logo-group button', 'Seamless Fusion'); await shot('03-v3-seamless-fusion')
  await clickText('.logo-group button', 'Adaptive Badge'); await shot('04-v3-adaptive-badge')
  await clickText('.logo-group button', 'Premium Brand'); await shot('05-v3-premium-brand')
  await clickText('button', 'Auto Fit'); await waitFor(`!Array.from(document.querySelectorAll('button')).find(button=>button.textContent.trim()==='Auto Fit')?.disabled && /candidate sizes decoded successfully/.test(document.querySelector('.logo-size-control .field-hint')?.textContent || '')`, 'maximum size', 500); await sleep(350)
  const maximum = await js(`({result:document.querySelector('.logo-size-control .field-hint')?.textContent,selectedPercent:Number(document.querySelector('.logo-range input')?.value),modules:document.querySelector('.artboard-meta span:last-child')?.textContent,guard:document.querySelector('.logo-guard p')?.textContent})`); await shot('06-v3-maximum-readable-size')
  const moduleCount = Number(String(maximum.modules).match(/\d+/)?.[0]); const requests = [12,14,17,20,23,26,29,32,35]
  const unique = []; const seen = new Set(); for (const requested of requests) { let span = Math.min(9, Math.max(3, Math.round(moduleCount * requested / 100))); if (span % 2 === 0) span -= 1; const applied = span / moduleCount; if (!seen.has(applied)) { seen.add(applied); unique.push({ requested, span, applied }) } }
  const sizeResults = []
  const actualRenders = new Map()
  for (const candidate of unique) { await setSize(candidate.requested); const exported = await exportCurrent('png', `real-logo-size-${candidate.span}`); const bytes = await readFile(join(output, exported.path)); const png = PNG.sync.read(bytes); const decoded = jsQR(new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength), png.width, png.height, { inversionAttempts: 'attemptBoth' }); const readable = decoded?.data === 'https://msqaisfx.github.io/qr-studio-pro/'; const sha256 = createHash('sha256').update(bytes).digest('hex'); const duplicateOf = actualRenders.get(sha256) ?? null; if (!duplicateOf) actualRenders.set(sha256, candidate.span); sizeResults.push({ ...candidate, readable, bytes: bytes.length, sha256, duplicateOf, file: exported.path }); await shot(`size-${candidate.span}-modules`) }
  const largest = [...sizeResults].reverse().find((item) => item.readable); if (largest) await setSize(largest.requested)
  const exports = []; for (const format of ['png','svg','webp','jpeg','pdf']) { const exported = await exportCurrent(format, `real-logo-final-${format}`); exports.push({ ...exported, generatedByApp: true }) }
  await js(`document.querySelector('[data-tool="logo"]').click()`); await waitFor(`Boolean(document.querySelector('.logo-file-card'))`, 'logo panel')
  const cropDataUrl = await js(`new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{const c=document.createElement('canvas');c.width=560;c.height=570;c.getContext('2d').drawImage(image,250,65,560,570,0,0,560,570);resolve(c.toDataURL('image/png'))};image.onerror=reject;image.src='data:image/png;base64,${sourceBase64}'})`)
  await writeFile(join(output, 'symbol-focus-manual-crop.png'), Buffer.from(cropDataUrl.split(',')[1], 'base64'))
  await clickText('.logo-group button', 'Custom Crop'); await waitFor(`document.querySelectorAll('.logo-crop-controls input').length===4`, 'custom crop controls')
  await js(`(()=>{const values=['24','6','55','56'];document.querySelectorAll('.logo-crop-controls input').forEach((e,index)=>{Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,values[index]);e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})})()`); await sleep(900)
  await clickText('.logo-group button', 'Seamless Fusion'); await saveDataUrl('.logo-file-card img', 'symbol-focus-rendered.png'); await shot('07-v3-symbol-focus')
  const symbolMetrics = await js(`document.querySelector('.logo-metrics')?.textContent`)
  const symbolFile = await exportCurrent('png', 'real-logo-symbol-focus'); const symbolBytes = await readFile(join(output, symbolFile.path)); const symbolPng = PNG.sync.read(symbolBytes); const symbolDecoded = jsQR(new Uint8ClampedArray(symbolPng.data.buffer, symbolPng.data.byteOffset, symbolPng.data.byteLength), symbolPng.width, symbolPng.height, { inversionAttempts: 'attemptBoth' })
  const symbolExport = { ...symbolFile, width: symbolPng.width, height: symbolPng.height, readable: symbolDecoded?.data === 'https://msqaisfx.github.io/qr-studio-pro/' }
  const report = { source: { fileName: basename(sourcePath), format: 'png', width: 1024, height: 1024, sha256: createHash('sha256').update(source).digest('hex') }, crop: { x: 250, y: 65, width: 560, height: 570, reviewable: true }, fullInitial, fullProcessed, maximum, distinctAppliedSizes: sizeResults, exports, symbolMetrics, symbolExport, runtimeErrors }
  if (runtimeErrors.length) throw new Error(`Runtime errors: ${runtimeErrors.join('; ')}`)
  await writeFile(join(output, 'verification.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2))
} finally { socket.close(); chrome.kill('SIGTERM') }
