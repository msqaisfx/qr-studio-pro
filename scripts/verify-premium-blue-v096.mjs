import { spawn } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const appUrl = process.env.QR_STUDIO_URL || 'http://127.0.0.1:5177/'
const output = process.env.QR_STUDIO_ARTIFACTS || 'artifacts/premium-blue-ux-v096'
const temporary = `/private/tmp/qr-studio-v096-${Date.now()}`
await mkdir(output, { recursive: true }); await mkdir(temporary, { recursive: true })
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new','--hide-scrollbars','--disable-gpu','--no-first-run','--no-default-browser-check','--force-prefers-reduced-motion',`--remote-debugging-port=9396`,`--user-data-dir=${temporary}/profile`,appUrl], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)); let targets
for (let index = 0; index < 120; index += 1) { try { targets = await (await fetch('http://127.0.0.1:9396/json')).json(); if (targets.length) break } catch {} await sleep(100) }
const target = targets?.find((item) => item.type === 'page'); if (!target) throw new Error('Chrome unavailable')
const socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0; const pending = new Map(); const runtimeErrors = []
socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text); if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') runtimeErrors.push(message.params.entry.text); if (message.id && pending.has(message.id)) { const handler = pending.get(message.id); pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result) } })
const send = (method, params = {}) => new Promise((resolve, reject) => { const messageId = ++id; pending.set(messageId, { resolve, reject }); socket.send(JSON.stringify({ id: messageId, method, params })) })
const js = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value
const shot = async (name) => { const result = await send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false, fromSurface: true }); await writeFile(join(output, `${name}.png`), Buffer.from(result.data, 'base64')) }
const setViewport = (width) => send('Emulation.setDeviceMetricsOverride', { width, height: width <= 375 ? 812 : 1000, deviceScaleFactor: 1, mobile: width < 600 })
try {
  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await sleep(700)
  await js(`localStorage.setItem('qr-studio-pro:language','ar');localStorage.setItem('qr-studio-pro:theme','dark');location.reload()`); await sleep(650)
  await js(`(()=>{const e=document.querySelector('#content-url');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'https://example.com/premium-blue');e.dispatchEvent(new Event('input',{bubbles:true}))})()`); await sleep(500)
  await setViewport(1280); await shot('arabic-dark')
  await js(`Array.from(document.querySelectorAll('.zoom-controls button')).find(button=>button.textContent.trim()==='150%')?.click()`); await sleep(250); await shot('canvas-zoom-150')
  await js(`document.querySelector('[data-tool="export"]').click()`); await sleep(450); await shot('export-panel')
  await js(`document.querySelector('[data-tool="quality"]').click()`); await sleep(1200); await shot('scan-guard-states')
  await js(`localStorage.setItem('qr-studio-pro:language','en');localStorage.setItem('qr-studio-pro:theme','light');location.reload()`); await sleep(650); await setViewport(1920); await shot('english-light-desktop')
  const responsive = []
  for (const width of [320,375,768,1280,1920]) { await setViewport(width); await sleep(180); const overflow = await js(`document.documentElement.scrollWidth-document.documentElement.clientWidth`); responsive.push({ width, overflow }); if (width === 320) await shot('mobile-320'); if (width === 375) await shot('mobile-375') }
  const audit = await js(`(()=>{const root=getComputedStyle(document.documentElement);const visible=e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&e.getClientRects().length>0};const controls=[...document.querySelectorAll('button,a[href],input,select,textarea')].filter(visible);const name=e=>e.getAttribute('aria-label')||e.getAttribute('aria-labelledby')||(e.labels&&e.labels.length)||e.textContent?.trim()||e.getAttribute('title');return {lang:document.documentElement.lang,dir:document.documentElement.dir,primary:root.getPropertyValue('--brand-primary').trim(),background:root.getPropertyValue('--bg').trim(),baseFont:getComputedStyle(document.body).fontSize,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches,unnamedControls:controls.filter(e=>!name(e)&&e.type!=='hidden').length,unlabelledInputs:controls.filter(e=>['INPUT','SELECT','TEXTAREA'].includes(e.tagName)&&!(e.labels&&e.labels.length)&&!e.getAttribute('aria-label')&&!e.getAttribute('aria-labelledby')).length}})()`)
  const report = { generatedAt: new Date().toISOString(), responsive, audit, runtimeErrors }
  if (responsive.some((item) => item.overflow !== 0) || audit.unnamedControls || audit.unlabelledInputs || runtimeErrors.length) throw new Error(JSON.stringify(report))
  await writeFile(join(output, 'ux-accessibility-report.json'), JSON.stringify(report, null, 2)); console.log(JSON.stringify(report, null, 2))
} finally { socket.close(); chrome.kill('SIGTERM') }
