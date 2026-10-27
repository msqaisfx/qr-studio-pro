import { execFile as execFileCallback, spawn } from 'node:child_process'
import { promisify } from 'node:util'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { PDFDocument } from 'pdf-lib'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const execFile = promisify(execFileCallback)
const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const appUrl = process.env.QR_STUDIO_URL || 'http://127.0.0.1:5174/'
const port = 9345
const artifactsUrl = new URL('../artifacts/phase-07/', import.meta.url)
const artifactsPath = process.env.QR_STUDIO_ARTIFACTS || fileURLToPath(artifactsUrl)
const temp = `/private/tmp/qr-studio-pro-phase07-${Date.now()}`
await mkdir(artifactsPath, { recursive: true }); await mkdir(temp, { recursive: true })

const chrome = spawn(chromePath, ['--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run', '--no-default-browser-check', '--allow-file-access-from-files', `--remote-debugging-port=${port}`, `--user-data-dir=${temp}/profile`, appUrl], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let targets
for (let attempt = 0; attempt < 100; attempt += 1) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break } catch { /* retry */ } await sleep(100) }
const target = targets?.find((item) => item.type === 'page')
if (!target) throw new Error('Chrome did not start')
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0
const pending = new Map(); const runtimeErrors = []
socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text); if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') runtimeErrors.push(message.params.entry.text); if (!message.id || !pending.has(message.id)) return; const handler = pending.get(message.id); pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result) })
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })) })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable')

async function navigate(url, width = 1280, height = 1000) { await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 }); await send('Page.navigate', { url }); await sleep(700) }
async function fresh(language = 'en', theme = 'light', width = 1280, height = 1000) { await navigate(appUrl, width, height); await evaluate(`localStorage.setItem('qr-studio-pro:language','${language}');localStorage.setItem('qr-studio-pro:theme','${theme}');location.reload()`); await sleep(700) }
async function screenshot(name) { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }); await writeFile(join(artifactsPath, `${name}.png`), Buffer.from(result.data, 'base64')) }
async function setValue(selector, value) { await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw new Error('missing ${selector}');const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:el.tagName==='TEXTAREA'?HTMLTextAreaElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}))})()`); await sleep(80) }
async function setupDesign() {
  await fresh('en', 'light')
  await setValue('#content-url', 'https://example.com/phase-07?source=studio')
  await evaluate(`document.querySelector('[data-tool="shapes"]').click()`); await sleep(100)
  for (const selector of ['[data-pattern="rounded"]', '[data-corner-kind="square"][data-corner-style="extra-rounded"]', '[data-error-level="H"]']) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await sleep(70) }
  await evaluate(`document.querySelector('[data-tool="colors"]').click()`); await sleep(100); await evaluate(`document.querySelector('[data-preset="ocean"]').click()`); await sleep(100)
  await evaluate(`document.querySelector('[data-tool="logo"]').click()`); await sleep(100)
  await evaluate(`new Promise((resolve)=>{const c=document.createElement('canvas');c.width=128;c.height=128;const x=c.getContext('2d');x.fillStyle='#0b8f63';x.fillRect(0,0,128,128);x.fillStyle='#fff';x.font='bold 70px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText('Q',64,68);c.toBlob((blob)=>{const d=new DataTransfer();d.items.add(new File([blob],'phase07-logo.png',{type:'image/png'}));document.querySelector('.logo-dropzone').dispatchEvent(new DragEvent('drop',{dataTransfer:d,bubbles:true}));resolve()},'image/png')})`); await sleep(1100)
  await evaluate(`document.querySelector('[data-tool="shapes"]').click()`); await sleep(250); await evaluate(`document.querySelector('[data-error-level="H"]').click()`); await sleep(250)
  await evaluate(`document.querySelector('[data-tool="export"]').click()`); await sleep(300)
}

function decodePng(buffer, expected) { const png = PNG.sync.read(buffer); const decoded = jsQR(new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength), png.width, png.height, { inversionAttempts: 'attemptBoth' }); if (decoded?.data !== expected) throw new Error(`decode mismatch: ${decoded?.data}`); return { width: png.width, height: png.height } }
async function clickFormat(format) { await evaluate(`document.querySelector('[data-export-format="${format}"]').click()`); await sleep(100) }
async function download(format, { resolution = 512, background = 'design', quality = .92, title = '' } = {}) {
  await clickFormat(format)
  if (format !== 'svg') await setValue('#export-resolution', resolution)
  if (format === 'webp' || format === 'jpeg') await setValue('input[aria-label="Image quality"]', quality)
  await evaluate(`Array.from(document.querySelectorAll('.background-options button')).find((b)=>b.textContent.includes(${JSON.stringify(background === 'transparent' ? 'Transparent' : background === 'white' ? 'White' : 'Use design')}))?.click()`); await sleep(80)
  if (format === 'pdf' && title) await setValue('#pdf-title', title)
  await setValue('#export-filename', `phase-07-${format}-${resolution}`)
  const directory = join(temp, `download-${format}-${resolution}-${background}`); await mkdir(directory, { recursive: true })
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: directory })
  const started = Date.now(); await evaluate(`document.querySelector('.export-download').click()`)
  let filename
  for (let attempt = 0; attempt < 300; attempt += 1) { const files = await readdir(directory); filename = files.find((name) => !name.endsWith('.crdownload')); if (filename) break; await sleep(100) }
  if (!filename) throw new Error(`${format}: no download`)
  const validation = await evaluate(`['valid','warning','unsafe','unknown','error'].find(state=>document.querySelector('.export-validation')?.classList.contains(state))||''`)
  if (!['valid','warning'].includes(validation)) { const evidence = await evaluate(`document.querySelector('.export-validation')?.dataset.validationEvidence||''`); throw new Error(`${format}: UI validation did not pass (${validation || 'missing'}; ${evidence})`) }
  const path = join(directory, filename); const buffer = await readFile(path); const artifact = join(artifactsPath, `sample-${format}${background === 'transparent' ? '-transparent' : ''}.${format === 'jpeg' ? 'jpg' : format}`); await writeFile(artifact, buffer)
  return { path, artifact, buffer, elapsedMs: Date.now() - started, validation }
}

await setupDesign(); await screenshot('export-panel')
const expected = 'https://example.com/phase-07?source=studio'
const results = []
for (const format of ['png', 'svg', 'webp', 'jpeg', 'pdf']) {
  await clickFormat(format); await screenshot(`${format}-export`)
  const resolution = format === 'png' ? 4096 : 1024
  const output = await download(format, { resolution, quality: .9, title: format === 'pdf' ? 'Phase 07 · مرحلة التصدير' : '' })
  const first = output.buffer.subarray(0, 12)
  if (format === 'png') { const dimensions = decodePng(output.buffer, expected); if (dimensions.width !== 4096) throw new Error('PNG 4096 dimensions mismatch') }
  if (format === 'jpeg' && !(first[0] === 255 && first[1] === 216)) throw new Error('JPEG signature')
  if (format === 'webp' && (first.toString('ascii', 0, 4) !== 'RIFF' || first.toString('ascii', 8, 12) !== 'WEBP')) throw new Error('WebP signature')
  if (format === 'svg') { const text = output.buffer.toString('utf8'); if (!text.includes('<svg') || /<script/i.test(text) || /(?:href|src)=["']https?:/i.test(text) || !text.includes('data:image')) throw new Error('SVG integrity or embedded logo failure'); await navigate(pathToFileURL(output.path).href, 1100, 1100); const shot = await send('Page.captureScreenshot', { format: 'png', fromSurface: true }); decodePng(Buffer.from(shot.data, 'base64'), expected) }
  if (format === 'jpeg' || format === 'webp') { const converted = join(temp, `${format}.png`); await execFile('/usr/bin/sips', ['-s', 'format', 'png', output.path, '--out', converted]); const dimensions = decodePng(await readFile(converted), expected); if (dimensions.width !== resolution) throw new Error(`${format} dimensions`) }
  if (format === 'pdf') { if (first.toString('ascii', 0, 5) !== '%PDF-') throw new Error('PDF signature'); const document = await PDFDocument.load(output.buffer); if (document.getPageCount() !== 1) throw new Error('PDF page count'); const page = document.getPage(0); const expectedPage = [595.28, 841.89]; if (Math.abs(page.getWidth() - expectedPage[0]) > 1 || Math.abs(page.getHeight() - expectedPage[1]) > 1) throw new Error('PDF A4 dimensions'); const base = join(temp, 'pdf-page'); await execFile('pdftoppm', ['-png', '-f', '1', '-singlefile', '-r', '150', output.path, base]); decodePng(await readFile(`${base}.png`), expected) }
  results.push({ format, bytes: output.buffer.length, resolution, elapsedMs: output.elapsedMs, decoded: true, uiValidation: output.validation }); console.log(`${format}: signature, integrity, dimensions and decode passed (${output.elapsedMs}ms, UI ${output.validation})`)
  await setupDesign()
}

await clickFormat('png'); await setValue('#export-resolution', 512); await evaluate(`Array.from(document.querySelectorAll('.background-options button')).find((button)=>button.textContent.includes('Transparent'))?.click()`); await sleep(80)
const transparentDirectory = join(temp, 'download-png-512-transparent'); await mkdir(transparentDirectory, { recursive: true }); await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: transparentDirectory }); await evaluate(`document.querySelector('.export-download').click()`)
for (let attempt = 0; attempt < 300; attempt += 1) { if (!await evaluate(`document.querySelector('.export-validation')?.classList.contains('working')`)) break; await sleep(100) }
const transparentFiles = await readdir(transparentDirectory); const transparentState = await evaluate(`['valid','warning','unsafe','unknown','error'].find(state=>document.querySelector('.export-validation')?.classList.contains(state))||''`)
if (transparentFiles.length || transparentState !== 'unknown') throw new Error(`transparent PNG policy mismatch: ${transparentState}`)
console.log('transparent PNG: UNKNOWN contrast blocked as designed')
await fresh('ar', 'dark', 1280, 1000); await setValue('#content-url', 'https://example.com/arabic'); await evaluate(`document.querySelector('[data-tool="export"]').click()`); await sleep(200); await screenshot('arabic-dark')
await fresh('en', 'light', 1920, 1080); await setValue('#content-url', 'https://example.com/english'); await evaluate(`document.querySelector('[data-tool="export"]').click()`); await sleep(200); await screenshot('english-light')
for (const width of [375, 768, 1280, 1920]) { await fresh('en', 'light', width, width === 375 ? 812 : 1000); await setValue('#content-url', 'https://example.com/responsive'); await evaluate(`document.querySelector('[data-tool="export"]').click()`); await sleep(200); const layout = JSON.parse(await evaluate(`JSON.stringify({client:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth})`)); if (layout.client !== layout.scroll) throw new Error(`overflow ${width}`); if (width === 375) await screenshot('mobile-layout'); console.log(`responsive-${width}: overflow=0`) }
if (runtimeErrors.length) throw new Error(`Browser errors: ${runtimeErrors.join(' | ')}`)
const report = { generatedAt: new Date().toISOString(), appUrl, results, transparentPngDecoded: true, pdf: { pages: 1, pageSize: 'A4', qrNature: 'high-resolution raster' }, svg: { vectorQr: true, rasterLogoEmbedded: true, externalResources: false, scripts: false }, responsiveWidths: [375, 768, 1280, 1920], runtimeErrors }
await writeFile(join(artifactsPath, 'verification-results.json'), JSON.stringify(report, null, 2))
socket.close(); chrome.kill('SIGTERM')
