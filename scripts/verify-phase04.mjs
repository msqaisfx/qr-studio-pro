import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { mkdir, readFile, readdir, rename, writeFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
const port = 9342
const artifacts = new URL('../artifacts/phase-04/', import.meta.url)
const downloadsRoot = `/private/tmp/qr-studio-pro-phase04-${Date.now()}`
await mkdir(artifacts, { recursive: true })
await mkdir(downloadsRoot, { recursive: true })

const chrome = spawn(chromePath, ['--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${downloadsRoot}/profile`, 'http://127.0.0.1:5173/'], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let targets
for (let attempt = 0; attempt < 60; attempt += 1) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break } catch { /* retry */ } await sleep(100) }
const target = targets?.find((item) => item.type === 'page' && item.url.includes('127.0.0.1'))
if (!target) throw new Error('Chrome page target did not start')
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0
const pending = new Map()
const runtimeErrors = []
const verificationResults = []
socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text); if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') runtimeErrors.push(message.params.entry.text); if (!message.id || !pending.has(message.id)) return; const handlers = pending.get(message.id); pending.delete(message.id); message.error ? handlers.reject(new Error(message.error.message)) : handlers.resolve(message.result) })
const send = (method, params = {}) => new Promise((resolve, reject) => { const requestId = ++id; pending.set(requestId, { resolve, reject }); socket.send(JSON.stringify({ id: requestId, method, params })) })
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable')

async function configure({ data = 'https://example.com/مرحبا', preset = 'classic', transparent = false, pattern = 'rounded', cornerSquare = 'extra-rounded', cornerDot = 'dot', size = 512, level = 'M', language = 'en', theme = 'light', width = 1280, height = 900 }) {
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 })
  await send('Page.navigate', { url: 'http://127.0.0.1:5173/' }); await sleep(550)
  await evaluate(`localStorage.setItem('qr-studio-pro:language','${language}');localStorage.setItem('qr-studio-pro:theme','${theme}');location.reload()`); await sleep(650)
  await evaluate(`(() => {const el=document.querySelector('#qr-content');Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype,'value').set.call(el,${JSON.stringify(data)});el.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-tool="shapes"]').click()})()`); await sleep(180)
  for (const selector of [`[data-pattern="${pattern}"]`, `[data-corner-kind="square"][data-corner-style="${cornerSquare}"]`, `[data-corner-kind="dot"][data-corner-style="${cornerDot}"]`, `[data-export-size="${size}"]`, `[data-error-level="${level}"]`]) { await evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`); await sleep(55) }
  await evaluate(`document.querySelector('[data-tool="colors"]').click()`); await sleep(150)
  await evaluate(`document.querySelector('[data-preset="${preset}"]').click()`); await sleep(180)
  if (transparent) { await evaluate(`document.querySelector('[data-transparent]').click()`); await sleep(150) }
  const state = JSON.parse(await evaluate(`JSON.stringify({width:document.documentElement.clientWidth,scrollWidth:document.documentElement.scrollWidth,dir:document.documentElement.dir,lang:document.documentElement.lang,theme:document.documentElement.dataset.theme,qr:document.querySelectorAll('.qr-canvas svg').length,moduleText:document.querySelector('.artboard-meta span:last-child')?.textContent,preset:${JSON.stringify(preset)},transparent:document.querySelector('[data-transparent]').checked})`))
  if (state.scrollWidth !== state.width || state.qr !== 1 || state.transparent !== transparent || state.lang !== language || state.dir !== (language === 'ar' ? 'rtl' : 'ltr') || state.theme !== theme) throw new Error(`UI state failed: ${JSON.stringify(state)}`)
  return { ...state, moduleCount: Number(state.moduleText.match(/\d+/)?.[0]) }
}

async function screenshot(name) { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }); await writeFile(new URL(`${name}.png`, artifacts), Buffer.from(result.data, 'base64')) }

async function exportAndDecode(name, expected, config) {
  const state = await configure(config)
  const directory = `${downloadsRoot}/${name}`; await mkdir(directory, { recursive: true })
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: directory })
  await evaluate(`document.querySelector('.download-button').click()`)
  let file
  for (let attempt = 0; attempt < 100; attempt += 1) { file = (await readdir(directory)).find((item) => item.endsWith('.png')); if (file) break; await sleep(80) }
  if (!file) throw new Error(`${name}: PNG download missing`)
  const source = `${directory}/${file}`; const finalPath = `${directory}/${name}.png`; if (source !== finalPath) await rename(source, finalPath)
  const buffer = await readFile(finalPath); const png = PNG.sync.read(buffer)
  await writeFile(new URL(`sample-${name}.png`, artifacts), buffer)
  if (png.width !== config.size || png.height !== config.size) throw new Error(`${name}: expected ${config.size}px, got ${png.width}x${png.height}`)
  const decodePixels = new Uint8ClampedArray(png.data)
  if (config.transparent) for (let offset = 0; offset < decodePixels.length; offset += 4) { const alpha = decodePixels[offset + 3] / 255; decodePixels[offset] = Math.round(decodePixels[offset] * alpha + 255 * (1 - alpha)); decodePixels[offset + 1] = Math.round(decodePixels[offset + 1] * alpha + 255 * (1 - alpha)); decodePixels[offset + 2] = Math.round(decodePixels[offset + 2] * alpha + 255 * (1 - alpha)); decodePixels[offset + 3] = 255 }
  const decoded = jsQR(decodePixels, png.width, png.height, { inversionAttempts: 'attemptBoth' })
  if (decoded?.data !== expected) throw new Error(`${name}: decode failed (${decoded?.data ?? 'no result'})`)
  const bg = [png.data[0], png.data[1], png.data[2], png.data[3]]
  let minX = png.width; let minY = png.height; const colors = new Set(); let transparentPixels = 0
  for (let y = 0; y < png.height; y += 1) for (let x = 0; x < png.width; x += 1) { const o = (y * png.width + x) * 4; if (png.data[o + 3] < 10) transparentPixels += 1; const distance = Math.abs(png.data[o] - bg[0]) + Math.abs(png.data[o + 1] - bg[1]) + Math.abs(png.data[o + 2] - bg[2]) + Math.abs(png.data[o + 3] - bg[3]); if (distance > 35) { minX = Math.min(minX, x); minY = Math.min(minY, y); colors.add(`${png.data[o] >> 4}-${png.data[o + 1] >> 4}-${png.data[o + 2] >> 4}`) } }
  const cell = Math.floor(config.size / (state.moduleCount + 8))
  if (minX < cell * 4 || minY < cell * 4) throw new Error(`${name}: unsafe quiet zone (${minX}, ${minY}, cell ${cell})`)
  if (config.transparent && transparentPixels === 0) throw new Error(`${name}: expected transparent pixels`)
  if (['ocean', 'aurora', 'corporate'].includes(config.preset) && colors.size < 3) throw new Error(`${name}: gradient did not produce enough color variation`)
  console.log(`${name}: decoded ${png.width}px, quiet=${minX}px, colors=${colors.size}, alpha=${transparentPixels}`)
  verificationResults.push({ name, decoded: true, width: png.width, height: png.height, quietZonePixels: minX, modulePixels: cell, uniqueColorBuckets: colors.size, transparentPixels })
  return createHash('sha256').update(buffer).digest('hex')
}

const visualCases = [
  ['solid-colors', { preset: 'emerald' }], ['linear-gradient', { preset: 'ocean' }], ['radial-gradient', { preset: 'aurora' }],
  ['custom-corner-colors', { preset: 'royal', cornerSquare: 'dot', cornerDot: 'square' }], ['transparent-background', { preset: 'classic', transparent: true }],
  ['preset-gallery', { preset: 'sunset' }], ['contrast-warning', { preset: 'minimal', transparent: true }],
  ['arabic-dark', { preset: 'ocean', language: 'ar', theme: 'dark' }], ['english-light', { preset: 'corporate', language: 'en', theme: 'light', width: 1920, height: 1080 }],
  ['mobile-layout', { preset: 'aurora', language: 'ar', theme: 'dark', width: 375, height: 812 }],
]
for (const [name, config] of visualCases) { await configure(config); await screenshot(name); console.log(`${name}: screenshot, overflow=0`) }
for (const width of [375, 768, 1280, 1920]) { const state = await configure({ preset: 'ocean', width, height: width === 375 ? 812 : 900 }); console.log(`responsive-${width}: dir=${state.dir}, theme=${state.theme}, overflow=0`) }

const sample = 'https://example.com/مرحبا'
const longUrl = `https://example.com/research?query=${'professional-qr-studio-'.repeat(8)}end`
const cases = [
  ['solid', sample, { preset: 'emerald', pattern: 'square', cornerSquare: 'square', cornerDot: 'square', size: 256, level: 'L' }],
  ['linear', sample, { preset: 'ocean', pattern: 'dots', cornerSquare: 'dot', cornerDot: 'dot', size: 512, level: 'M' }],
  ['radial', sample, { preset: 'aurora', pattern: 'rounded', cornerSquare: 'extra-rounded', cornerDot: 'square', size: 1024, level: 'Q' }],
  ['custom-corners', sample, { preset: 'royal', pattern: 'classy', cornerSquare: 'dot', cornerDot: 'dot', size: 512, level: 'H' }],
  ['transparent', sample, { preset: 'classic', transparent: true, pattern: 'classy-rounded', size: 1024, level: 'H' }],
  ['preset', 'نص عربي سليم UTF-8', { data: 'نص عربي سليم UTF-8', preset: 'corporate', pattern: 'extra-rounded', size: 2048, level: 'Q', language: 'ar' }],
  ['long-url', longUrl, { data: longUrl, preset: 'classic', pattern: 'square', cornerSquare: 'square', cornerDot: 'square', size: 2048, level: 'H' }],
]
const hashes = new Set()
for (const [name, expected, config] of cases) hashes.add(await exportAndDecode(name, expected, { language: 'en', theme: 'light', width: 1280, height: 900, cornerSquare: 'extra-rounded', cornerDot: 'dot', ...config }))
if (hashes.size !== cases.length) throw new Error('Expected pixel-distinct PNG files')
console.log(`compatibility-sample: patterns=6/6, corner-squares=3/3, corner-dots=2/2, sizes=4/4, levels=4/4`)
if (runtimeErrors.length) throw new Error(`Unhandled browser errors: ${runtimeErrors.join(' | ')}`)
await writeFile(new URL('verification-results.json', artifacts), JSON.stringify({ generatedAt: new Date().toISOString(), decodePassed: verificationResults.length, decodeFailed: 0, runtimeErrors, responsiveWidths: [375, 768, 1280, 1920], compatibility: { bodyPatterns: '6/6', cornerSquares: '3/3', cornerDots: '2/2', sizes: '4/4', correctionLevels: '4/4' }, results: verificationResults }, null, 2))
socket.close(); chrome.kill('SIGTERM')
