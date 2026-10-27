import { spawn } from 'node:child_process'
import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const appUrl = process.env.QR_STUDIO_URL || 'http://127.0.0.1:5176/'
const output = process.env.QR_STUDIO_ARTIFACTS || new URL('../artifacts/smart-logo-fusion-v3/', import.meta.url).pathname
const temp = `/private/tmp/qr-studio-logo-v3-${Date.now()}`
const downloads = join(temp, 'downloads')
await mkdir(output, { recursive: true }); await mkdir(downloads, { recursive: true })
const chromePort = 9360
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--hide-scrollbars','--disable-gpu','--no-first-run','--no-default-browser-check',`--remote-debugging-port=${chromePort}`,`--user-data-dir=${temp}/profile`,appUrl], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let targets
for (let index = 0; index < 100; index += 1) { try { targets = await (await fetch(`http://127.0.0.1:${chromePort}/json`)).json(); if (targets.length) break } catch {} await sleep(100) }
const target = targets?.find((item) => item.type === 'page'); if (!target) throw new Error('Chrome unavailable')
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0; const pending = new Map(); const runtimeErrors = []
socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text); if (message.id && pending.has(message.id)) { const handler = pending.get(message.id); pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result) } })
const send = (method, params = {}) => new Promise((resolve, reject) => { const messageId = ++id; pending.set(messageId, { resolve, reject }); socket.send(JSON.stringify({ id: messageId, method, params })) })
const js = async (expression) => { const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.text); return response.result.value }
const waitFor = async (expression, label, count = 160) => { for (let index = 0; index < count; index += 1) { if (await js(expression)) return; await sleep(100) } throw new Error(`Timed out: ${label}`) }
const shot = async (name) => { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }); await writeFile(join(output, `${name}.png`), Buffer.from(result.data, 'base64')) }
const clickText = async (selector, text) => { const clicked = await js(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.textContent.trim()===${JSON.stringify(text)});e?.click();return Boolean(e)})()`); if (!clicked) throw new Error(`Missing control: ${text}`); await sleep(350) }

try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads })
  await waitFor(`Boolean(document.querySelector('.app-shell'))`, 'app shell')
  await js(`localStorage.setItem('qr-studio-pro:language','en');localStorage.setItem('qr-studio-pro:theme','light');location.reload()`)
  await waitFor(`document.documentElement.lang==='en' && Boolean(document.querySelector('#content-url'))`, 'English UI')
  await js(`(()=>{const e=document.querySelector('#content-url');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'https://example.com/smart-logo-fusion-v3');e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-tool="logo"]').click()})()`)
  await waitFor(`Boolean(document.querySelector('.logo-dropzone'))`, 'logo panel')
  await js(`new Promise(resolve=>{const c=document.createElement('canvas');c.width=600;c.height=360;const x=c.getContext('2d');x.fillStyle='#ffffff';x.fillRect(0,0,600,360);x.fillStyle='#ffffff';x.fillRect(85,95,430,170);x.fillStyle='#0b8f63';x.beginPath();x.roundRect(110,115,150,130,24);x.fill();x.fillStyle='#07110f';x.font='700 54px sans-serif';x.textBaseline='middle';x.fillText('QR PRO',285,180);c.toBlob(blob=>{const d=new DataTransfer();d.items.add(new File([blob],'horizontal-white-logo.png',{type:'image/png'}));document.querySelector('.logo-dropzone').dispatchEvent(new DragEvent('drop',{dataTransfer:d,bubbles:true}));resolve()},'image/png')})`)
  await waitFor(`Boolean(document.querySelector('.logo-file-card img')) && Boolean(document.querySelector('.logo-metrics'))`, 'processed logo')
  await js(`document.querySelector('.logo-toggle:nth-of-type(2) input')?.click()`); await sleep(300)
  const initialMetrics = await js(`document.querySelector('.logo-metrics')?.textContent`)
  await shot('before-after')
  await clickText('.logo-group button', 'Remove solid background'); await sleep(600)
  const backgroundRemovalMetrics = await js(`document.querySelector('.logo-metrics')?.textContent`)
  await shot('white-background-removal')
  const styles = [['Seamless Fusion','seamless-fusion'],['Adaptive Badge','adaptive-badge'],['Minimal Cutout','minimal-cutout'],['Premium Brand','premium-brand']]
  for (const [label, name] of styles) { await clickText('.logo-group button', label); await shot(name) }
  await js(`(()=>{const e=document.querySelector('.logo-range input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'14');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`); await sleep(500); await shot('small-logo')
  await clickText('button', 'Find maximum readable size')
  await waitFor(`!document.querySelector('.logo-find-max')?.disabled && /candidate sizes decoded successfully/.test(document.querySelector('.logo-find-max + .field-hint')?.textContent || '')`, 'maximum readable size', 300)
  await sleep(300); await shot('maximum-readable-size')
  const metrics = await js(`({initial: ${JSON.stringify(null)},afterBackgroundRemoval: ${JSON.stringify(null)},current:document.querySelector('.logo-metrics')?.textContent,maximum:document.querySelector('.logo-find-max + .field-hint')?.textContent,selectedPercent:Number(document.querySelector('.logo-range input')?.value),guard:document.querySelector('.logo-guard p')?.textContent})`)
  metrics.initial = initialMetrics
  metrics.afterBackgroundRemoval = backgroundRemovalMetrics
  await js(`document.querySelector('[data-tool="export"]').click()`); await waitFor(`Boolean(document.querySelector('.export-panel .export-download'))`, 'export panel')
  await js(`document.querySelector('[data-export-format="png"]').click();document.querySelector('.export-download').click()`)
  let pngName
  for (let index = 0; index < 200; index += 1) { pngName = (await readdir(downloads)).find((name) => name.endsWith('.png') && !name.endsWith('.crdownload')); if (pngName) break; await sleep(100) }
  if (!pngName) throw new Error('PNG export missing')
  const bytes = await readFile(join(downloads, pngName)); const png = PNG.sync.read(bytes)
  const decoded = jsQR(new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength), png.width, png.height, { inversionAttempts: 'attemptBoth' })
  if (decoded?.data !== 'https://example.com/smart-logo-fusion-v3') throw new Error('Export decode failed')
  await writeFile(join(output, 'fusion-export.png'), bytes)
  const report = { appUrl, metrics, png: { width: png.width, height: png.height, bytes: (await stat(join(downloads, pngName))).size, decoded: true }, styles: styles.map(([, name]) => name), runtimeErrors }
  if (runtimeErrors.length) throw new Error(`Runtime errors: ${runtimeErrors.join('; ')}`)
  await writeFile(join(output, 'verification.json'), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report, null, 2))
} finally { socket.close(); chrome.kill('SIGTERM') }
