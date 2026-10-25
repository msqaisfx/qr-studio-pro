import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { createHash } from 'node:crypto'
import { readdir, readFile, writeFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

async function files(root:string,dir=root):Promise<string[]>{const entries=await readdir(dir,{withFileTypes:true});const nested=await Promise.all(entries.map(entry=>entry.isDirectory()?files(root,join(dir,entry.name)):Promise.resolve([relative(root,join(dir,entry.name)).replaceAll('\\','/')] )));return nested.flat()}
function pwaServiceWorker(){return{name:'qr-studio-pwa',apply:'build' as const,async closeBundle(){const root=join(process.cwd(),'dist');const names=(await files(root)).filter(name=>name!=='sw.js'&&!name.endsWith('.map')&&!name.split('/').some(part=>part.startsWith('.')));const hash=createHash('sha256');for(const name of names.sort())hash.update(name).update(await readFile(join(root,name)));const version=hash.digest('hex').slice(0,12);const source=`const VERSION='qr-studio-${version}';const PRECACHE=${JSON.stringify(names.map(name=>`./${name}`))};const INDEX='./index.html';self.addEventListener('install',event=>event.waitUntil(caches.open(VERSION).then(cache=>cache.addAll(PRECACHE))));self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('qr-studio-')&&key!==VERSION).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));self.addEventListener('message',event=>{if(event.data?.type==='SKIP_WAITING')self.skipWaiting()});self.addEventListener('fetch',event=>{const request=event.request;if(request.method!=='GET')return;const url=new URL(request.url);if(url.origin!==self.location.origin)return;const path=url.pathname.slice(new URL(self.registration.scope).pathname.length);const key='./'+path;if(request.mode==='navigate'){event.respondWith(fetch(request).catch(()=>caches.match(INDEX)).then(response=>response||Response.error()));return}if(!PRECACHE.includes(key))return;event.respondWith(caches.match(request).then(cached=>cached||fetch(request)))})`;await writeFile(join(root,'sw.js'),source)}}}

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  plugins: [react(), tailwindcss(), pwaServiceWorker()],
  test: {
    environment: 'jsdom',
    setupFiles: './tests/setup.ts',
    css: true,
  },
})
