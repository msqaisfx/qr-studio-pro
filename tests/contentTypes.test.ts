import { describe, expect, it } from 'vitest'
import { buildPayload, byteCapacity, type ContentForm } from '../src/features/content/contentTypes'

const build=(form:ContentForm)=>buildPayload(form,'M')

describe('multi-type payload encoders',()=>{
  it('encodes HTTP, HTTPS, IDN, and query URLs without network access',()=>{
    expect(build({type:'website',url:'https://مثال.إختبار/بحث?q=مرحبا'}).payload).toContain('xn--')
    expect(build({type:'website',url:'ftp://example.com'}).error).toBe('invalidWebsite')
  })
  it('keeps Unicode, emoji, and multiline text and enforces ECC capacity',()=>{
    const value='مرحبا 🌍\nHello';expect(build({type:'text',text:value}).payload).toBe(value)
    expect(buildPayload({type:'text',text:'x'.repeat(byteCapacity.H+1)},'H').error).toBe('capacityExceeded')
  })
  it('escapes Wi-Fi delimiters and supports hidden, WPA3, and open networks',()=>{
    expect(build({type:'wifi',ssid:'Office;5G',password:'p:a,ss\\word',security:'WPA',hidden:true}).payload).toBe('WIFI:T:WPA;S:Office\\;5G;P:p\\:a\\,ss\\\\word;H:true;;')
    expect(build({type:'wifi',ssid:'شبكة',password:'secret',security:'WPA3',hidden:false}).warning).toBe('wifiWpa3Warning')
    expect(build({type:'wifi',ssid:'Guest',password:'',security:'nopass',hidden:false}).valid).toBe(true)
  })
  it('builds escaped Unicode vCard 3.0 content',()=>{
    const result=build({type:'vcard',fullName:'محمد، علي',phone:'+967 777 000 000',email:'test@example.com',company:'ACME; Labs',jobTitle:'مهندس',website:'https://example.com',address:'عدن, اليمن',notes:'سطر 1\nسطر 2'})
    expect(result.payload).toContain('VERSION:3.0');expect(result.payload).toContain('NOTE:سطر 1\\nسطر 2');expect(result.payload).toContain('ORG:ACME\\; Labs')
  })
  it('builds official wa.me URLs and rejects invalid phone numbers',()=>{
    expect(build({type:'whatsapp',phone:'+967 (777) 123-456',message:'مرحبًا & أهلاً'}).payload).toBe('https://wa.me/967777123456?text=%D9%85%D8%B1%D8%AD%D8%A8%D9%8B%D8%A7%20%26%20%D8%A3%D9%87%D9%84%D8%A7%D9%8B')
    expect(build({type:'whatsapp',phone:'abc',message:''}).valid).toBe(false)
  })
  it('encodes mailto, tel, and SMS URIs',()=>{
    expect(build({type:'email',recipient:'a@example.com',subject:'موضوع خاص',body:'سطر & ثان'}).payload).toContain('mailto:a@example.com?')
    expect(build({type:'phone',phone:'+1 (202) 555-0100'}).payload).toBe('tel:+12025550100')
    expect(build({type:'sms',phone:'+967777123456',message:'مرحبا'}).payload).toContain('?body=%D9%85')
  })
  it('validates coordinates and uses an HTTPS maps URL',()=>{
    expect(build({type:'location',latitude:'12.7855',longitude:'45.0187'}).payload).toBe('https://www.google.com/maps?q=12.7855,45.0187')
    expect(build({type:'location',latitude:'91',longitude:'0'}).error).toBe('invalidLatitude')
    expect(build({type:'location',latitude:'0',longitude:'181'}).error).toBe('invalidLongitude')
  })
  it('builds VEVENT with timezone, ordering, Unicode, and escaping',()=>{
    const valid=build({type:'event',title:'لقاء، الفريق',start:'2026-10-25T10:00',end:'2026-10-25T11:00',timeZone:'Asia/Aden',location:'عدن',description:'مناقشة; مهمة'})
    expect(valid.payload).toContain('BEGIN:VEVENT');expect(valid.payload).toContain('DTSTART;TZID=Asia/Aden:20261025T1000');expect(valid.warning).toBe('eventCompatibility')
    expect(build({type:'event',title:'x',start:'2026-10-25T12:00',end:'2026-10-25T11:00',timeZone:'UTC',location:'',description:''}).error).toBe('invalidEventOrder')
  })
  it('keeps crypto assets and networks distinct without executing transactions',()=>{
    const btc='1A111111111111111111111111111111111';const eth=`0x${'11'.repeat(20)}`;const tron=`T${'1'.repeat(33)}`
    expect(build({type:'crypto',asset:'bitcoin',network:'bitcoin',address:btc,amount:'0.001'}).payload).toBe(`bitcoin:${btc}?amount=0.001`)
    expect(build({type:'crypto',asset:'ethereum',network:'ethereum',address:eth,amount:'1'}).payload).toBe(`ethereum:${eth}`)
    expect(build({type:'crypto',asset:'usdt',network:'trc20',address:tron,amount:''}).payload).toBe(`USDT (TRC20): ${tron}`)
    expect(build({type:'crypto',asset:'usdt',network:'erc20',address:tron,amount:''}).error).toBe('invalidCryptoAddress')
    expect(build({type:'crypto',asset:'bitcoin',network:'bitcoin',address:btc,amount:'-1'}).error).toBe('invalidAmount')
  })
  it('reports empty required fields without producing a QR payload',()=>{
    for(const form of [{type:'website',url:''},{type:'text',text:''},{type:'phone',phone:''}] as ContentForm[])expect(build(form).payload).toBe('')
  })
})
