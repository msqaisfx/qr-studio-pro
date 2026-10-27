import { spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { basename, join } from 'node:path'
import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { PNG } from 'pngjs'
import jsQR from 'jsqr'

const sourcePath = process.env.QR_STUDIO_REAL_LOGO
if (!sourcePath) throw new Error('QR_STUDIO_REAL_LOGO is required')
const appUrl = process.env.QR_STUDIO_URL || 'http://127.0.0.1:5178/'
const output = process.env.QR_STUDIO_ARTIFACTS || 'artifacts/final-35-percent-export-resolution'
const temporary = `/private/tmp/qr-studio-production-35-${Date.now()}`
const downloads = join(temporary, 'downloads')
const payload = `https://msqaisfx.github.io/qr-studio-pro/incident?campaign=${'production-validation-'.repeat(8)}`
await mkdir(output, { recursive: true }); await mkdir(downloads, { recursive: true })
const source = await readFile(sourcePath); const sourceBase64 = source.toString('base64')
const sourceMime = sourcePath.toLowerCase().endsWith('.jpg') || sourcePath.toLowerCase().endsWith('.jpeg') ? 'image/jpeg' : sourcePath.toLowerCase().endsWith('.webp') ? 'image/webp' : 'image/png'
const port = 9398
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', ['--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check', `--remote-debugging-port=${port}`, `--user-data-dir=${temporary}/profile`, appUrl], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let socket
const diagnostics = { runtimeErrors: [], consoleErrors: [], networkFailures: [], navigations: [] }
try {
  let targets
  for (let index = 0; index < 160; index += 1) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break } catch {} await sleep(100) }
  const target = targets?.find((entry) => entry.type === 'page'); if (!target) throw new Error('Chrome unavailable')
  socket = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
  let id = 0; let navigationGeneration = 0; const pending = new Map(); const runtimeErrors = diagnostics.runtimeErrors
  socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text); if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') diagnostics.consoleErrors.push(message.params.entry.text); if (message.method === 'Network.loadingFailed' && !message.params.canceled) diagnostics.networkFailures.push({ error: message.params.errorText, type: message.params.type }); if (message.method === 'Page.frameNavigated' && !message.params.frame.parentId) { navigationGeneration += 1; diagnostics.navigations.push({ generation: navigationGeneration, url: message.params.frame.url }) } if (message.id && pending.has(message.id)) { const handler = pending.get(message.id); pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result) } })
  const send = (method, params = {}) => new Promise((resolve, reject) => { const messageId = ++id; pending.set(messageId, { resolve, reject }); socket.send(JSON.stringify({ id: messageId, method, params })) })
  const evaluate = async (expression) => { const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.exception?.description || response.exceptionDetails.text); return response.result.value }
  const captureState = () => evaluate(`({url:location.href,lang:document.documentElement.lang,dir:document.documentElement.dir,readyState:document.readyState,serviceWorkerControlled:Boolean(navigator.serviceWorker?.controller),tools:[...document.querySelectorAll('[data-tool]')].map(element=>({tool:element.dataset.tool,disabled:element.disabled})),body:document.body?.innerText.slice(0,800)})`).catch(error=>({diagnosticError:error.message}))
  const failWithDiagnostics = async (label, lastError) => { const state = await captureState(); await writeFile(join(output, 'production-verification-failure.json'), JSON.stringify({ label, lastError, navigationCount: navigationGeneration, state, diagnostics }, null, 2)); throw new Error(`${label}${lastError ? ` (${lastError})` : ''}`) }
  const waitFor = async (expression, label, count = 900) => { let lastError; for (let index = 0; index < count; index += 1) { try { if (await evaluate(expression)) return } catch (error) { lastError = error.message } await sleep(100) } await failWithDiagnostics(`Timed out: ${label}`, lastError) }
  const waitForStableDom = async (label, expression = 'true', count = 900) => { let lastError; for (let index = 0; index < count; index += 1) { const generation = navigationGeneration; try { const ready = await evaluate(`new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve(document.readyState==='complete' && Boolean(document.querySelector('.app-shell')) && Boolean(navigator.serviceWorker?.controller) && (${expression})))))`); if (ready && generation === navigationGeneration) return generation } catch (error) { lastError = error.message } await sleep(100) } await failWithDiagnostics(`Timed out: ${label}`, lastError) }
  const openTool = async (tool, panelSelector, label) => { await waitForStableDom(`${label} control`, `Boolean(document.querySelector('[data-tool="${tool}"]:not(:disabled)'))`); const generation = navigationGeneration; await evaluate(`document.querySelector('[data-tool="${tool}"]').click()`); await waitForStableDom(label, `Boolean(document.querySelector(${JSON.stringify(panelSelector)}))`); if (generation !== navigationGeneration) await failWithDiagnostics(`Unexpected navigation while opening ${label}`) }
  const clickText = async (selector, label) => { const clicked = await evaluate(`(()=>{const e=[...document.querySelectorAll(${JSON.stringify(selector)})].find(x=>x.textContent.trim()===${JSON.stringify(label)});e?.click();return Boolean(e)})()`); if (!clicked) throw new Error(`Missing control: ${label}`) }
  const screenshot = async (name) => { const result = await send('Page.captureScreenshot', { format: 'png', fromSurface: true }); await writeFile(join(output, name), Buffer.from(result.data, 'base64')) }
  const download = async () => { const before = new Set(await readdir(downloads)); await evaluate(`document.querySelector('.export-download').click()`); await waitFor(`!document.querySelector('.export-validation').classList.contains('working') && Boolean(document.querySelector('.export-validation').dataset.snapshotId)`, 'validation completion'); for (let index = 0; index < 400; index += 1) { const found = (await readdir(downloads)).find((name) => !before.has(name) && name.endsWith('.png')); if (found) return join(downloads, found); await sleep(100) } return null }

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable'); await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads }); await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false })
  await waitFor(`Boolean(document.querySelector('.app-shell'))`, 'app shell')
  await waitForStableDom('service worker controlled application')
  const languageNavigation = navigationGeneration
  const languageChanged = await evaluate(`(()=>{if(document.documentElement.lang==='en')return true;const button=document.querySelector('.language-button');if(!button)return false;button.click();return true})()`)
  if (!languageChanged) await failWithDiagnostics('Language control is unavailable')
  await waitForStableDom('stable English LTR UI', `document.documentElement.lang==='en' && document.documentElement.dir==='ltr' && Boolean(document.querySelector('#content-url'))`)
  if (languageNavigation !== navigationGeneration) await failWithDiagnostics('Language switch caused an unexpected navigation')
  await evaluate(`(()=>{const e=document.querySelector('#content-url');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,${JSON.stringify(payload)});e.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-tool="shapes"]').click()})()`)
  await waitFor(`Boolean(document.querySelector('[data-error-level="M"]'))`, 'shapes'); await evaluate(`document.querySelector('[data-error-level="M"]').click();document.querySelector('[data-tool="logo"]').click()`)
  await waitFor(`Boolean(document.querySelector('.logo-dropzone'))`, 'logo upload')
  await evaluate(`(()=>{const bytes=Uint8Array.from(atob(${JSON.stringify(sourceBase64)}),c=>c.charCodeAt(0));const d=new DataTransfer();d.items.add(new File([bytes],${JSON.stringify(basename(sourcePath))},{type:${JSON.stringify(sourceMime)}}));document.querySelector('.logo-dropzone').dispatchEvent(new DragEvent('drop',{dataTransfer:d,bubbles:true}))})()`)
  await waitFor(`Boolean(document.querySelector('.logo-metrics'))`, 'logo processing'); await clickText('.logo-group button', 'Adaptive Badge')
  await evaluate(`(()=>{const e=document.querySelector('.logo-size-control input[type=range]');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'35');e.dispatchEvent(new Event('input',{bubbles:true}));e.dispatchEvent(new Event('change',{bubbles:true}))})()`)
  await waitForStableDom('35 percent single QR', `document.querySelector('.logo-size-control input[type=number]')?.value==='35' && document.querySelector('.qr-canvas')?.childElementCount===1`)
  await openTool('export', '.export-download', 'export panel')
  const beforePath = await download(); const before = await evaluate(`(()=>{const e=document.querySelector('.export-validation');return{status:e.querySelector('strong')?.textContent,hash:e.dataset.snapshotHash,evidence:e.dataset.validationEvidence,previewNodes:document.querySelector('.export-preview>div')?.childElementCount,size:35,ecc:'M'}})()`)
  if (before.status !== 'FAIL' || beforePath) throw new Error(`Expected the dense 35% incident fixture to fail, got ${JSON.stringify(before)}`)
  await screenshot('01-before-fail.png')
  await evaluate(`document.querySelector('.auto-fix-button').click()`); await waitFor(`Boolean(document.querySelector('.recovery-comparison'))`, 'safe recovery proposal', 1800)
  const proposed = await evaluate(`(()=>{const text=document.querySelector('.recovery-comparison').textContent;const validation=document.querySelector('.export-validation');return{configurationHash:validation.dataset.snapshotHash,text}})()`)
  if (proposed.configurationHash !== before.hash || !proposed.text.includes('Before: 35%')) throw new Error('Recovery changed user settings before consent')
  await screenshot('02-proposal-before-consent.png'); await clickText('.recovery-actions button', 'Apply proposed repair')
  await waitFor(`!document.querySelector('.recovery-comparison') && document.querySelector('.export-validation').classList.contains('idle')`, 'recovery applied')
  const applied = await evaluate(`document.querySelector('[data-tool="logo"]').click();true`); void applied
  await waitFor(`Boolean(document.querySelector('.logo-size-control input[type=number]'))`, 'logo settings after repair')
  const repairedSettings = await evaluate(`({size:Number(document.querySelector('.logo-size-control input[type=number]').value),summary:document.querySelector('.logo-size-result').textContent,previewNodes:document.querySelector('.qr-canvas')?.childElementCount})`)
  await openTool('export', '.export-download', 'export after repair')
  const repairedPath = await download(); if (!repairedPath) { const failed = await evaluate(`(()=>{const e=document.querySelector('.export-validation');return{status:e.querySelector('strong')?.textContent,hash:e.dataset.snapshotHash,evidence:e.dataset.validationEvidence,text:e.textContent}})()`); await writeFile(join(output, 'repaired-export-failure.json'), JSON.stringify({ proposed, repairedSettings, failed }, null, 2)); throw new Error(`Repaired export was not downloaded: ${JSON.stringify(failed)}`) }
  const bytes = await readFile(repairedPath); const png = PNG.sync.read(bytes); const decoded = jsQR(new Uint8ClampedArray(png.data.buffer, png.data.byteOffset, png.data.byteLength), png.width, png.height, { inversionAttempts: 'attemptBoth' })
  const after = await evaluate(`(()=>{const e=document.querySelector('.export-validation');return{status:e.querySelector('strong')?.textContent,hash:e.dataset.snapshotHash,evidence:e.dataset.validationEvidence,previewNodes:document.querySelector('.export-preview>div')?.childElementCount}})()`)
  await writeFile(join(output, 'repaired-export.png'), bytes); await screenshot('03-after-repair.png')
  const report = { generatedAt: new Date().toISOString(), appUrl, payloadHash: createHash('sha256').update(payload).digest('hex'), logoHash: createHash('sha256').update(source).digest('hex'), navigationCount: navigationGeneration, language: await evaluate(`({lang:document.documentElement.lang,dir:document.documentElement.dir})`), before, proposed, repairedSettings, after, export: { sha256: createHash('sha256').update(bytes).digest('hex'), width: png.width, height: png.height, payloadMatches: decoded?.data === payload }, runtimeErrors, consoleErrors: diagnostics.consoleErrors, networkFailures: diagnostics.networkFailures }
  await writeFile(join(output, 'production-logo-35-export.json'), JSON.stringify(report, null, 2))
  if (!['PASS', 'WARNING'].includes(after.status) || !report.export.payloadMatches || repairedSettings.previewNodes !== 1 || after.previewNodes !== 1 || runtimeErrors.length) throw new Error('Production 35% recovery regression failed')
  console.log(JSON.stringify(report, null, 2))
} finally { socket?.close(); chrome.kill('SIGTERM') }
