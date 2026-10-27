import { spawn } from 'node:child_process'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const sourcePath = process.env.QR_STUDIO_REAL_LOGO
const output = process.env.QR_STUDIO_ARTIFACTS
if (!sourcePath || !output) throw new Error('QR_STUDIO_REAL_LOGO and QR_STUDIO_ARTIFACTS are required')
await mkdir(output, { recursive: true })
const source = (await readFile(sourcePath)).toString('base64')
const temporary = `/private/tmp/qr-studio-inputs-${Date.now()}`
const port = 9477
const chrome = spawn('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${port}`, `--user-data-dir=${temporary}`, 'about:blank',
], { stdio: 'ignore' })
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))
let targets
for (let index = 0; index < 100; index += 1) {
  try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break } catch {}
  await sleep(100)
}
const target = targets?.find((entry) => entry.type === 'page')
if (!target) throw new Error('Chrome unavailable')
const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise((resolve, reject) => { socket.addEventListener('open', resolve, { once: true }); socket.addEventListener('error', reject, { once: true }) })
let id = 0
const pending = new Map()
socket.addEventListener('message', ({ data }) => { const message = JSON.parse(data); if (message.id && pending.has(message.id)) { const handler = pending.get(message.id); pending.delete(message.id); message.error ? handler.reject(new Error(message.error.message)) : handler.resolve(message.result) } })
const send = (method, params = {}) => new Promise((resolve, reject) => { const messageId = ++id; pending.set(messageId, { resolve, reject }); socket.send(JSON.stringify({ id: messageId, method, params })) })
const evaluate = async (expression) => { const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true }); if (response.exceptionDetails) throw new Error(response.exceptionDetails.text); return response.result.value }
try {
  await send('Runtime.enable')
  const variants = await evaluate(`(async()=>{
    const image=new Image();image.src='data:image/png;base64,${source}';await image.decode();
    const make=(width,height,type,quality,background,drawWidth=width,drawHeight=height)=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const context=canvas.getContext('2d');context.imageSmoothingEnabled=true;context.imageSmoothingQuality='high';if(background){context.fillStyle=background;context.fillRect(0,0,width,height)}context.drawImage(image,(width-drawWidth)/2,(height-drawHeight)/2,drawWidth,drawHeight);return canvas.toDataURL(type,quality)};
    return {
      transparentPng:make(768,768,'image/png',1,null),
      jpeg:make(768,768,'image/jpeg',.94,'#ffffff'),
      webp:make(768,768,'image/webp',.95,null),
      lowResolution:make(96,96,'image/png',1,null),
      fineDetail:make(1536,1536,'image/png',1,null),
      whiteBackground:make(768,768,'image/png',1,'#ffffff'),
      rectangular:make(1200,600,'image/png',1,null,560,560)
    }
  })()`)
  const definitions = [
    ['transparent-png.png', variants.transparentPng], ['jpeg-logo.jpg', variants.jpeg],
    ['webp-logo.webp', variants.webp], ['low-resolution-96.png', variants.lowResolution],
    ['fine-detail-1536.png', variants.fineDetail], ['white-background.png', variants.whiteBackground],
    ['rectangular-1200x600.png', variants.rectangular],
  ]
  for (const [name, dataUrl] of definitions) await writeFile(join(output, name), Buffer.from(dataUrl.split(',')[1], 'base64'))
} finally {
  socket.close(); chrome.kill('SIGTERM')
}
