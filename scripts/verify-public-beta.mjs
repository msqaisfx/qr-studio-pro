import { spawn } from 'node:child_process'
import { mkdir, readdir, stat, writeFile } from 'node:fs/promises'

const base = new URL(process.argv[2] ?? 'https://msqaisfx.github.io/qr-studio-pro/')
const chromePath = process.env.CHROME_PATH ?? 'google-chrome'
const temp = `/tmp/qr-studio-public-${Date.now()}`
const downloads = `${temp}/downloads`
await mkdir(downloads, { recursive: true })

const request = async (url) => {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) throw new Error(`${response.status} ${url}`)
  return response
}

const html = await (await request(base)).text()
const manifestUrl = new URL('manifest.webmanifest', base)
const manifest = await (await request(manifestUrl)).json()
const workerUrl = new URL('sw.js', base)
const worker = await (await request(workerUrl)).text()
const assetPaths = [...html.matchAll(/(?:src|href)="([^"]+\.(?:js|css))"/g)].map((match) => match[1])
if (!html.includes('id="root"') || assetPaths.length < 2) throw new Error('deployed HTML is incomplete')
if (manifest.scope !== './' || !manifest.start_url.startsWith('./')) throw new Error('manifest subpath is unsafe')
if (!worker.includes('qr-studio-') || !worker.includes('SKIP_WAITING')) throw new Error('service worker is incomplete')
for (const path of assetPaths) await request(new URL(path, base))

const chromePort = 9374
const chrome = spawn(chromePath, [
  '--headless=new', '--hide-scrollbars', '--disable-gpu', '--no-sandbox', '--no-first-run',
  '--no-default-browser-check', `--remote-debugging-port=${chromePort}`, `--user-data-dir=${temp}/profile`, base.href,
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let targets
for (let index = 0; index < 200; index += 1) {
  try {
    targets = await (await fetch(`http://127.0.0.1:${chromePort}/json`)).json()
    if (targets.some((target) => target.type === 'page')) break
  } catch {}
  await sleep(100)
}
const target = targets?.find((item) => item.type === 'page')
if (!target) throw new Error('Chrome did not start')
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true })
  socket.addEventListener('error', reject, { once: true })
})
let id = 0
const pending = new Map()
const runtimeErrors = []
socket.addEventListener('message', ({ data }) => {
  const message = JSON.parse(data)
  if (message.method === 'Runtime.exceptionThrown') runtimeErrors.push(message.params.exceptionDetails.text)
  if (message.method === 'Log.entryAdded' && message.params.entry.level === 'error') runtimeErrors.push(message.params.entry.text)
  if (message.id && pending.has(message.id)) {
    const handler = pending.get(message.id)
    pending.delete(message.id)
    message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result)
  }
})
const send = (method, params = {}) => new Promise((resolve, reject) => {
  const messageId = ++id
  pending.set(messageId, { resolve, reject })
  socket.send(JSON.stringify({ id: messageId, method, params }))
})
const evaluate = async (expression) => (await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })).result.value
const waitFor = async (expression, label) => {
  for (let index = 0; index < 200; index += 1) {
    if (await evaluate(expression)) return
    await sleep(100)
  }
  throw new Error(`timed out waiting for ${label}`)
}

try {
  await send('Page.enable')
  await send('Runtime.enable')
  await send('Log.enable')
  await send('Network.enable')
  await send('Browser.setDownloadBehavior', { behavior: 'allow', downloadPath: downloads })
  await waitFor(`document.readyState==='complete' && Boolean(document.querySelector('.app-shell'))`, 'application shell')
  const initial = await evaluate(`({lang:document.documentElement.lang,dir:document.documentElement.dir,title:document.title})`)
  if (initial.lang !== 'ar' || initial.dir !== 'rtl' || !initial.title.includes('QR Studio Pro')) throw new Error('Arabic RTL defaults are incorrect')
  await evaluate(`(()=>{const e=document.querySelector('#content-url');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(e,'https://example.com/public-beta');e.dispatchEvent(new Event('input',{bubbles:true}))})()`)
  await waitFor(`Boolean(document.querySelector('.qr-canvas canvas,.qr-canvas svg'))`, 'QR preview')
  await evaluate(`document.querySelector('.language-button').click()`)
  await waitFor(`document.documentElement.lang==='en' && document.documentElement.dir==='ltr'`, 'English LTR')
  const themeBefore = await evaluate(`document.documentElement.dataset.theme || document.documentElement.className`)
  await evaluate(`document.querySelector('.icon-button').click()`)
  await sleep(150)
  const themeAfter = await evaluate(`document.documentElement.dataset.theme || document.documentElement.className`)
  if (themeBefore === themeAfter) throw new Error('theme did not change')
  await evaluate(`document.querySelector('[data-tool="export"]').click()`)
  await waitFor(`Boolean(document.querySelector('.export-panel .export-download'))`, 'export panel')
  await evaluate(`document.querySelector('[data-export-format="png"]').click()`)
  await evaluate(`document.querySelector('.export-download').click()`)
  let downloaded
  for (let index = 0; index < 400; index += 1) {
    downloaded = (await readdir(downloads)).find((name) => name.endsWith('.png'))
    if (downloaded) break
    await sleep(100)
  }
  if (!downloaded || (await stat(`${downloads}/${downloaded}`)).size < 1000) throw new Error('public PNG export failed')
  await evaluate(`Promise.race([navigator.serviceWorker.ready.then(()=>true),new Promise((_,reject)=>setTimeout(()=>reject(new Error('service worker ready timeout')),20000))])`)
  await send('Page.reload')
  await waitFor(`Boolean(navigator.serviceWorker.controller) && Boolean(document.querySelector('.app-shell'))`, 'service worker control')
  await send('Network.emulateNetworkConditions', { offline: true, latency: 0, downloadThroughput: 0, uploadThroughput: 0 })
  await send('Page.reload')
  await waitFor(`Boolean(document.querySelector('.app-shell')) && navigator.onLine===false`, 'offline navigation')
  const report = {
    url: base.href,
    html: true,
    assets: assetPaths.length,
    manifest: true,
    serviceWorker: true,
    qrGeneration: true,
    pngExport: true,
    rtlLtr: true,
    themeToggle: true,
    offlineNavigation: true,
    runtimeErrors,
  }
  if (runtimeErrors.length) throw new Error(`runtime errors: ${runtimeErrors.join('; ')}`)
  await writeFile(`${temp}/public-beta-report.json`, JSON.stringify(report, null, 2))
  if (process.env.GITHUB_STEP_SUMMARY) await writeFile(process.env.GITHUB_STEP_SUMMARY, `## Public beta smoke test\n\n\`\`\`json\n${JSON.stringify(report, null, 2)}\n\`\`\`\n`)
  console.log(JSON.stringify(report, null, 2))
} finally {
  socket.close()
  chrome.kill('SIGTERM')
}
