/// <reference types="node" />
import { describe,expect,it } from 'vitest'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

const manifestPath=join(process.cwd(),'public/manifest.webmanifest')

describe('PWA metadata',()=>{
  it('has a valid subpath-safe standalone manifest',async()=>{const manifest=JSON.parse(await readFile(manifestPath,'utf8'));expect(manifest.name).toContain('QR Studio Pro');expect(manifest.display).toBe('standalone');expect(manifest.start_url.startsWith('./')).toBe(true);expect(manifest.scope).toBe('./');expect(manifest.icons.map((icon:{sizes:string})=>icon.sizes)).toEqual(expect.arrayContaining(['192x192','512x512']));expect(manifest.icons.some((icon:{purpose?:string})=>icon.purpose==='maskable')).toBe(true)})
  it('references only local icons',async()=>{const manifest=JSON.parse(await readFile(manifestPath,'utf8'));expect(manifest.icons.every((icon:{src:string})=>icon.src.startsWith('./')&&!icon.src.includes('://'))).toBe(true)})
})
