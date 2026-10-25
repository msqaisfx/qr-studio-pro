import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9341
const artifacts = new URL('../artifacts/phase-03/', import.meta.url)
const downloadsRoot = `/private/tmp/qr-studio-pro-phase03-${Date.now()}`
await mkdir(artifacts, { recursive: true })
await mkdir(downloadsRoot, { recursive: true })

const chrome = spawn(chromePath, ['--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${downloadsRoot}/profile`, 'http://127.0.0.1:5173/'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

let targets
for (let attempt = 0; attempt < 60; attempt += 1) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break } catch { /* retry */ }
  await sleep(100)
}
const target = targets?.find((item) => item.type === 'page' && item.url.includes('127.0.0.1'))
if (!target) throw new Error('Chrome page target did not start')

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0
const pending = new Map()
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data)
  if (!message.id || !pending.has(message.id)) return
  const handlers = pending.get(message.id); pending.delete(message.id)
  message.error ? handlers.reject(new Error(message.error.message)) : handlers.resolve(message.result)
})
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })) })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value

await send('Page.enable')
await send('Runtime.enable')

async function configure({ data, pattern = 'rounded', cornerSquare = 'extra-rounded', cornerDot = 'dot', size = 512, level = 'M', language = 'en', theme = 'light', width = 1280, height = 900 }) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' })
  await sleep(650)
  await evaluate(`localStorage.setItem('qr-studio-pro:language','${language}');localStorage.setItem('qr-studio-pro:theme','${theme}');location.reload()`)
  await sleep(750)
  await evaluate(`(() => { const el=document.querySelector('#qr-content');const setter=Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set;setter.call(el,${JSON.stringify(data)});el.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-tool="shapes"]').click(); })()`)
  await sleep(250)
  for (const selector of [`[data-pattern="${pattern}"]`, `[data-corner-kind="square"][data-corner-style="${cornerSquare}"]`, `[data-corner-kind="dot"][data-corner-style="${cornerDot}"]`, `[data-export-size="${size}"]`, `[data-error-level="${level}"]`]) {
    await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`)
    await sleep(80)
  }
  await sleep(400)
  const state = JSON.parse(await evaluate(`JSON.stringify({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,dir:document.documentElement.dir,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,qr:document.querySelectorAll('.qr-canvas svg').length,moduleText:document.querySelector('.artboard-meta span:last-child')?.textContent,pattern:document.querySelector('[data-pattern][aria-pressed="true"]')?.dataset.pattern,size:document.querySelector('[data-export-size][aria-pressed="true"]')?.dataset.exportSize,level:document.querySelector('[data-error-level][aria-pressed="true"]')?.dataset.errorLevel})`))
  if (state.scrollWidth !== state.width || state.qr !== 1 || state.pattern !== pattern || Number(state.size) !== size || state.level !== level) throw new Error(`UI state failed: ${JSON.stringify(state)}`)
  return { ...state, moduleCount: Number(state.moduleText.match(/\d+/)?.[0]) }
}

async function screenshot(name) {
  const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true })
  await writeFile(new URL(`${name}.png`, artifacts), Buffer.from(result.data, 'base64'))
}

async function exportAndDecode(name, expected, config) {
  const state = await configure(config)
  const directory = `${downloadsRoot}/${name}`
  await mkdir(directory, { recursive: true })
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: directory })
  await evaluate(`document.querySelector('.download-button').click()`)
  let file
  for (let attempt = 0; attempt < 80; attempt += 1) {
    const files = await readdir(directory)
    file = files.find((item) => item.endsWith('.png'))
    if (file) break
    await sleep(100)
  }
  if (!file) throw new Error(`${name}: PNG download missing`)
  const source = `${directory}/${file}`
  const finalPath = `${directory}/${name}.png`
  if (source !== finalPath) await rename(source, finalPath)
  const png = PNG.sync.read(await readFile(finalPath))
  const hash = createHash('sha256').update(await readFile(finalPath)).digest('hex')
  if (png.width !== config.size || png.height !== config.size) throw new Error(`${name}: expected ${config.size}px, got ${png.width}x${png.height}`)
  const pixels = new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength)
  const decoded = jsQR(pixels, png.width, png.height, { inversionAttempts: 'dontInvert' })
  if (decoded?.data !== expected) throw new Error(`${name}: decode failed (${decoded?.data ?? 'no result'})`)
  let minX = png.width; let minY = png.height
  for (let y = 0; y < png.height; y += 1) for (let x = 0; x < png.width; x += 1) {
    const offset = (y * png.width + x) * 4
    if (png.data[offset] < 245 || png.data[offset + 1] < 245 || png.data[offset + 2] < 245) { minX = Math.min(minX, x); minY = Math.min(minY, y) }
  }
  const cell = Math.floor(config.size / (state.moduleCount + 8))
  if (minX < cell * 4 || minY < cell * 4) throw new Error(`${name}: unsafe quiet zone (${minX}, ${minY}, cell ${cell})`)
  console.log(`${name}: decoded, ${png.width}x${png.height}, modules=${state.moduleCount}, quiet>=4 (${minX}px)`)
  return hash
}

const sample = 'https://example.com/مرحبا'
const longUrl = `https://example.com/research?query=${'professional-qr-studio-'.repeat(8)}end`

const visualCases = [
  ['default-qr', { data: sample, pattern: 'rounded', language: 'en', theme: 'dark', width: 1280, height: 900 }],
  ['dots-pattern', { data: sample, pattern: 'dots', language: 'en', theme: 'dark', width: 1280, height: 900 }],
  ['rounded-pattern', { data: sample, pattern: 'rounded', language: 'en', theme: 'light', width: 1280, height: 900 }],
  ['classy-pattern', { data: sample, pattern: 'classy', language: 'en', theme: 'dark', width: 1280, height: 900 }],
  ['corner-customization', { data: sample, pattern: 'square', cornerSquare: 'dot', cornerDot: 'square', language: 'en', theme: 'light', width: 1280, height: 900 }],
  ['arabic-dark', { data: 'مرحبًا من استوديو QR الاحترافي', pattern: 'extra-rounded', language: 'ar', theme: 'dark', width: 1280, height: 900 }],
  ['english-light', { data: sample, pattern: 'classy-rounded', language: 'en', theme: 'light', width: 1920, height: 1080 }],
  ['mobile-layout', { data: sample, pattern: 'dots', language: 'ar', theme: 'dark', width: 375, height: 812 }],
]

for (const [name, config] of visualCases) { await configure(config); await screenshot(name); console.log(`${name}: screenshot, overflow=0`) }

const decodeCases = [
  ['decode-default', sample, { data: sample, pattern: 'square', size: 256, level: 'M' }],
  ['decode-dots', sample, { data: sample, pattern: 'dots', size: 512, level: 'M' }],
  ['decode-rounded', sample, { data: sample, pattern: 'rounded', size: 512, level: 'Q' }],
  ['decode-classy', sample, { data: sample, pattern: 'classy', size: 1024, level: 'H' }],
  ['decode-corners', sample, { data: sample, pattern: 'square', cornerSquare: 'dot', cornerDot: 'square', size: 512, level: 'M' }],
  ['decode-arabic', 'رمز عربي قابل للقراءة', { data: 'رمز عربي قابل للقراءة', pattern: 'rounded', size: 512, level: 'M', language: 'ar' }],
  ['decode-long-url', longUrl, { data: longUrl, pattern: 'square', size: 2048, level: 'H' }],
  ['decode-level-l', sample, { data: sample, pattern: 'square', size: 512, level: 'L' }],
  ['decode-level-q', sample, { data: sample, pattern: 'square', size: 512, level: 'Q' }],
]
const hashes = new Set()
for (const [name, expected, config] of decodeCases) hashes.add(await exportAndDecode(name, expected, { language: 'en', theme: 'light', width: 1280, height: 900, cornerSquare: 'extra-rounded', cornerDot: 'dot', ...config }))
if (hashes.size !== decodeCases.length) throw new Error('Distinct design configurations produced duplicate PNG files')
console.log(`png-variation: ${hashes.size}/${decodeCases.length} exported files are pixel-distinct`)

socket.close()
chrome.kill('SIGTERM')
