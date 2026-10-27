import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { basename, join } from 'node:path'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const sourcePath = process.env.QR_STUDIO_REAL_LOGO
if (!sourcePath) throw new Error('QR_STUDIO_REAL_LOGO is required')
const appUrl = process.env.QR_STUDIO_URL || 'http://127.0.0.1:5178/'
const output = process.env.QR_STUDIO_ARTIFACTS || 'artifacts/deterministic-logo-export-v097'
const temporary = `/private/tmp/qr-studio-v097-${Date.now()}`
const downloads = join(temporary, 'downloads')
const payload = 'https://msqaisfx.github.io/qr-studio-pro/v097-deterministic'
await mkdir(output, { recursive: true }); await mkdir(downloads, { recursive: true })
const source = await readFile(sourcePath); const sourceBase64 = source.toString('base64')
const chromePort = 9397
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--hide-scrollbars','--disable-gpu','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${chromePort}`,`--user-data-dir=${temporary}/profile`,appUrl], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); let targets
for (let index = 0; index < 160; index += 1) { try { targets = await (await fetch(`http://127.0.0.1:${chromePort}/json`)).json(); if (targets.length) break } catch {} await sleep(100) }
const target = targets?.find((entry) => entry.type === 'page'); if (!target) throw new Error('Chrome unavailable')
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0; const pending = new Map(); const runtimeErrors = []
socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text); if (message.id && pending.has(message.id)) { const handler = pending.get(message.id); pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result) } })
const send = (method, params = {}) => new Promise((resolve, reject) => { const messageId = ++id; pending.set(messageId, { resolve, reject }); socket.send(JSON.stringify({ id: messageId, method, params })) })
const js = async (expression) => { const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.text); return response.result.value }
const waitFor = async (expression, label, count = 400) => { for (let index = 0; index < count; index += 1) { if (await js(expression)) return; await sleep(100) } throw new Error(`Timed out: ${label}`) }
const shot = async (name) => { const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true }); await writeFile(join(output, name), Buffer.from(result.data, 'base64')) }
const clickText = async (selector, label) => { const clicked = await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.textContent.trim()===${JSON.stringify(label)});e?.click();return Boolean(e)})()`); if (!clicked) throw new Error(`Missing control: ${label}`); await sleep(350) }
const upload = () => js(`new Promise(resolve=>{const bytes=Uint8Array.from(atob(${JSON.stringify(sourceBase64)}),c=>c.charCodeAt(0));const d=new DataTransfer();d.items.add(new File([bytes],${JSON.stringify(basename(sourcePath))},{type:'image/png'}));document.querySelector('.logo-dropzone').dispatchEvent(new DragEvent('drop',{dataTransfer:d,bubbles:true}));resolve()})`)
const setSize = async (percent) => { await js(`(()=>{const e=document.querySelector('.logo-size-control input[type=range]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(String(percent))});e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`); await waitFor(`document.querySelector('.logo-size-control input[type=number]')?.value===${JSON.stringify(String(percent))}`, `size ${percent}`); await sleep(450) }
const nextPng = async (before) => { for (let index = 0; index < 500; index += 1) { const found = (await readdir(downloads)).find((name) => !before.has(name) && !name.endsWith('.crdownload') && name.endsWith('.png')); if (found) return join(downloads, found); await sleep(100) } return null }
const navigate = async () => { await send('Page.navigate', { url: appUrl }); await sleep(300); await waitFor(`location.href.startsWith(${JSON.stringify(appUrl)}) && document.readyState==='complete' && Boolean(document.querySelector('.app-shell'))`, 'app shell') }
const setup = async (ecc = 'H') => {
  await navigate()
  await js(`localStorage.setItem('qr-studio-pro:language','en');localStorage.setItem('qr-studio-pro:theme','light')`)
  await send('Page.reload'); await sleep(300); await waitFor(`document.readyState==='complete' && document.documentElement.lang==='en' && Boolean(document.querySelector('#content-url'))`, 'English UI')
  await js(`(()=>{const e=document.querySelector('#content-url');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(payload)});e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-tool="shapes"]').click()})()`)
  await waitFor(`Boolean(document.querySelector('[data-error-level="${ecc}"]'))`, 'shapes'); await js(`document.querySelector('[data-error-level="${ecc}"]').click();document.querySelector('[data-tool="logo"]').click()`)
  await waitFor(`Boolean(document.querySelector('.logo-dropzone'))`, 'logo upload'); await upload(); await waitFor(`Boolean(document.querySelector('.logo-metrics'))`, 'logo processing')
  await clickText('.logo-group button', 'Remove solid background'); await clickText('.logo-group button', 'Seamless Fusion'); await waitFor(`document.querySelector('.qr-canvas')?.childElementCount===1`, 'single QR preview'); await sleep(500)
}
const exportPng = async (name, expectDownload = true) => {
  await js(`document.querySelector('[data-tool="export"]').click()`); await waitFor(`Boolean(document.querySelector('.export-download'))`, 'export panel')
  await js(`document.querySelector('[data-export-format="png"]').click()`)
  await js(`(()=>{const e=document.querySelector('#export-filename');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(name)});e.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  const before = new Set(await readdir(downloads)); await js(`document.querySelector('.export-download').click()`)
  await waitFor(`!document.querySelector('.export-validation').classList.contains('working') && Boolean(document.querySelector('.export-validation').dataset.snapshotId)`, 'validation completion', 800)
  const validation = await js(`(()=>{const e=document.querySelector('.export-validation');return{status:e.querySelector('strong')?.textContent||'IDLE',hash:e.dataset.snapshotHash,id:e.dataset.snapshotId,evidence:e.dataset.validationEvidence,previewNodes:document.querySelector('.export-preview>div')?.childElementCount||0}})()`)
  const path = await nextPng(before)
  if (expectDownload && !path) throw new Error(`${name}: expected download for ${validation.status}`)
  let file = null
  if (path) { const bytes = await readFile(path); const destination = join(output, `${name}.png`); await writeFile(destination, bytes); const png = PNG.sync.read(bytes); const decoded = jsQR(new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength), png.width, png.height, { inversionAttempts: 'attemptBoth' }); file = { path: basename(destination), sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length, dimensions: `${png.width}x${png.height}`, jsqr: decoded?.data === payload ? 'PASS' : 'FAIL' } }
  await shot(`${name}-after.png`)
  return { validation, file }
}
const backToLogo = async () => { await js(`document.querySelector('[data-tool="logo"]').click()`); await waitFor(`Boolean(document.querySelector('.logo-size-control'))`, 'logo panel') }

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads }); await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false })
  const results = []
  await setup(); await setSize(35); results.push({ scenario: 'A-direct-35', ...(await exportPng('A-direct-35')) })
  await setup(); await setSize(20); await exportPng('B-intermediate-20'); await backToLogo(); await setSize(35); results.push({ scenario: 'B-20-export-35', ...(await exportPng('B-final-35')) })
  await setup(); await setSize(25); await setSize(35); results.push({ scenario: 'C-25-35', ...(await exportPng('C-final-35')) })
  await setup(); await setSize(35); await setSize(20); await setSize(35); results.push({ scenario: 'D-35-20-35', ...(await exportPng('D-final-35')) })
  await setup(); await setSize(35); await setup(); await setSize(35); results.push({ scenario: 'E-reload-35', ...(await exportPng('E-final-35')) })
  await setup(); await setSize(35); await js(`document.querySelector('[data-tool="colors"]').click()`); await waitFor(`Boolean(document.querySelector('.colors-panel'))`, 'colors'); results.push({ scenario: 'F-section-return', ...(await exportPng('F-final-35')) })
  await setup('M'); await setSize(35); await js(`document.querySelector('[data-tool="shapes"]').click()`); await waitFor(`Boolean(document.querySelector('[data-error-level="H"]'))`, 'ECC H'); await js(`document.querySelector('[data-error-level="H"]').click()`); results.push({ scenario: 'G-M-to-H', ...(await exportPng('G-final-35')) })
  await setup(); await setSize(35); await clickText('.logo-group button', 'Adaptive Badge'); await clickText('.logo-group button', 'Seamless Fusion'); await sleep(700); results.push({ scenario: 'H-style-roundtrip', ...(await exportPng('H-final-35')) })
  await setup(); await setSize(35); await js(`document.querySelector('.language-button').click();document.querySelector('.icon-button').click()`); results.push({ scenario: 'I-language-theme', ...(await exportPng('I-final-35')) })
  await setup(); await setSize(35); await js(`document.querySelector('[data-tool="export"]').click()`); await waitFor(`Boolean(document.querySelector('.export-download'))`, 'preload export'); await backToLogo(); await send('Network.enable'); await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 }); results.push({ scenario: 'J-offline', ...(await exportPng('J-final-35')) }); await send('Network.emulateNetworkConditions', { offline: false, latency: 0, downloadThroughput: -1, uploadThroughput: -1 })
  const finals = results.map((entry) => entry.file?.sha256).filter(Boolean)
  const hashes = results.map((entry) => entry.validation.hash)
  const report = { generatedAt: new Date().toISOString(), payload, source: { file: basename(sourcePath), sha256: createHash('sha256').update(source).digest('hex') }, results, finalConfigurationHashes: [...new Set(hashes)], finalPngHashes: [...new Set(finals)], runtimeErrors }
  await writeFile(join(output, 'sequence-verification.json'), JSON.stringify(report, null, 2))
  const invalid = results.some((entry) => !['PASS','WARNING'].includes(entry.validation.status) || entry.file?.jsqr !== 'PASS' || entry.validation.previewNodes !== 1 || !entry.validation.evidence.includes('readers:jsqr+zxing'))
  if (invalid || new Set(hashes).size !== 1 || new Set(finals).size !== 1 || runtimeErrors.length) throw new Error('Deterministic sequence gate failed; inspect sequence-verification.json')
  console.log(JSON.stringify(report, null, 2))
} finally { socket.close(); chrome.kill('SIGTERM') }
