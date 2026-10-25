import type { ErrorCorrectionLevel } from 'qr-code-styling'

export type ContentType = 'website'|'text'|'wifi'|'vcard'|'whatsapp'|'email'|'phone'|'sms'|'location'|'event'|'crypto'
export type WifiSecurity = 'WPA'|'WPA3'|'nopass'
export type CryptoAsset = 'bitcoin'|'ethereum'|'usdt'
export type CryptoNetwork = 'bitcoin'|'ethereum'|'erc20'|'trc20'

export type ContentForm =
  | { type:'website'; url:string }
  | { type:'text'; text:string }
  | { type:'wifi'; ssid:string; password:string; security:WifiSecurity; hidden:boolean }
  | { type:'vcard'; fullName:string; phone:string; email:string; company:string; jobTitle:string; website:string; address:string; notes:string }
  | { type:'whatsapp'; phone:string; message:string }
  | { type:'email'; recipient:string; subject:string; body:string }
  | { type:'phone'; phone:string }
  | { type:'sms'; phone:string; message:string }
  | { type:'location'; latitude:string; longitude:string }
  | { type:'event'; title:string; start:string; end:string; timeZone:string; location:string; description:string }
  | { type:'crypto'; asset:CryptoAsset; network:CryptoNetwork; address:string; amount:string }

export type ContentForms = { [K in ContentType]: Extract<ContentForm,{type:K}> }
export interface ContentWorkspace { activeType:ContentType; forms:ContentForms }
export interface PayloadResult { valid:boolean; payload:string; error:string|null; warning:string|null; bytes:number; capacity:number }

export const initialContentWorkspace:ContentWorkspace={activeType:'website',forms:{
  website:{type:'website',url:''},text:{type:'text',text:''},wifi:{type:'wifi',ssid:'',password:'',security:'WPA',hidden:false},
  vcard:{type:'vcard',fullName:'',phone:'',email:'',company:'',jobTitle:'',website:'',address:'',notes:''},whatsapp:{type:'whatsapp',phone:'',message:''},
  email:{type:'email',recipient:'',subject:'',body:''},phone:{type:'phone',phone:''},sms:{type:'sms',phone:'',message:''},location:{type:'location',latitude:'',longitude:''},
  event:{type:'event',title:'',start:'',end:'',timeZone:Intl.DateTimeFormat().resolvedOptions().timeZone||'UTC',location:'',description:''},
  crypto:{type:'crypto',asset:'bitcoin',network:'bitcoin',address:'',amount:''},
}}

const escapeWifi=(value:string)=>value.replace(/([\\;,:"])/g,'\\$1')
const escapeVCard=(value:string)=>value.replace(/\\/g,'\\\\').replace(/\n/g,'\\n').replace(/,/g,'\\,').replace(/;/g,'\\;')
const cleanPhone=(value:string)=>value.trim().replace(/[\s().-]/g,'')
const validPhone=(value:string)=>/^\+?[0-9]{5,15}$/.test(cleanPhone(value))
const validEmail=(value:string)=>/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
const basicDate=(value:string)=>value.replace(/[-:]/g,'').replace(/\.\d+$/,'')
export const byteCapacity:Record<ErrorCorrectionLevel,number>={L:2953,M:2331,Q:1663,H:1273}

export function buildPayload(form:ContentForm,level:ErrorCorrectionLevel):PayloadResult{
  let payload='';let error:string|null=null;let warning:string|null=null
  switch(form.type){
    case'website':{try{const url=new URL(form.url.trim());if(!['http:','https:'].includes(url.protocol))error='invalidWebsite';else payload=url.href}catch{error=form.url.trim()?'invalidWebsite':'requiredField'}break}
    case'text':payload=form.text;if(!payload.trim())error='requiredField';break
    case'wifi':if(!form.ssid.trim())error='requiredSsid';else if(form.security!=='nopass'&&!form.password)error='requiredPassword';else payload=`WIFI:T:${form.security};S:${escapeWifi(form.ssid)};${form.security==='nopass'?'':`P:${escapeWifi(form.password)};`}H:${form.hidden?'true':'false'};;`;if(form.security==='WPA3')warning='wifiWpa3Warning';break
    case'vcard':if(!form.fullName.trim())error='requiredName';else{const lines=['BEGIN:VCARD','VERSION:3.0',`FN:${escapeVCard(form.fullName)}`];if(form.phone)lines.push(`TEL:${escapeVCard(form.phone)}`);if(form.email){if(!validEmail(form.email))error='invalidEmail';else lines.push(`EMAIL:${escapeVCard(form.email)}`)}if(form.company)lines.push(`ORG:${escapeVCard(form.company)}`);if(form.jobTitle)lines.push(`TITLE:${escapeVCard(form.jobTitle)}`);if(form.website)lines.push(`URL:${escapeVCard(form.website)}`);if(form.address)lines.push(`ADR:;;${escapeVCard(form.address)}`);if(form.notes)lines.push(`NOTE:${escapeVCard(form.notes)}`);lines.push('END:VCARD');payload=lines.join('\r\n')}break
    case'whatsapp':{const phone=cleanPhone(form.phone).replace(/^\+/,'');if(!/^\d{5,15}$/.test(phone))error=form.phone?'invalidPhone':'requiredPhone';else payload=`https://wa.me/${phone}${form.message?`?text=${encodeURIComponent(form.message)}`:''}`;break}
    case'email':if(!validEmail(form.recipient))error=form.recipient?'invalidEmail':'requiredEmail';else{const query=new URLSearchParams();if(form.subject)query.set('subject',form.subject);if(form.body)query.set('body',form.body);payload=`mailto:${form.recipient}${query.size?`?${query.toString()}`:''}`}break
    case'phone':if(!validPhone(form.phone))error=form.phone?'invalidPhone':'requiredPhone';else payload=`tel:${cleanPhone(form.phone)}`;break
    case'sms':if(!validPhone(form.phone))error=form.phone?'invalidPhone':'requiredPhone';else payload=`sms:${cleanPhone(form.phone)}${form.message?`?body=${encodeURIComponent(form.message)}`:''}`;break
    case'location':{const lat=Number(form.latitude),lng=Number(form.longitude);if(form.latitude===''||form.longitude==='')error='requiredCoordinates';else if(!Number.isFinite(lat)||lat< -90||lat>90)error='invalidLatitude';else if(!Number.isFinite(lng)||lng< -180||lng>180)error='invalidLongitude';else payload=`https://www.google.com/maps?q=${lat},${lng}`;break}
    case'event':{let zoneValid=true;try{new Intl.DateTimeFormat('en',{timeZone:form.timeZone}).format()}catch{zoneValid=false}if(!form.title.trim()||!form.start||!form.end)error='requiredEvent';else if(new Date(form.end)<=new Date(form.start))error='invalidEventOrder';else if(!zoneValid)error='invalidTimeZone';else{const uid=`${basicDate(form.start)}-qr-studio-pro@local`;payload=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//QR Studio Pro//EN','BEGIN:VEVENT',`UID:${uid}`,`DTSTART;TZID=${form.timeZone}:${basicDate(form.start)}`,`DTEND;TZID=${form.timeZone}:${basicDate(form.end)}`,`SUMMARY:${escapeVCard(form.title)}`,form.location?`LOCATION:${escapeVCard(form.location)}`:'',form.description?`DESCRIPTION:${escapeVCard(form.description)}`:'','END:VEVENT','END:VCALENDAR'].filter(Boolean).join('\r\n');warning='eventCompatibility'}break}
    case'crypto':{const address=form.address.trim();const bitcoin=/^(bc1[ac-hj-np-z02-9]{11,71}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/.test(address);const ethereum=/^0x[a-fA-F0-9]{40}$/.test(address);const tron=/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);if(form.amount&&(!Number.isFinite(Number(form.amount))||Number(form.amount)<=0))error='invalidAmount';else if(!address)error='requiredAddress';else if(form.asset==='bitcoin'&&(form.network!=='bitcoin'||!bitcoin))error='invalidCryptoAddress';else if(form.asset==='ethereum'&&(form.network!=='ethereum'||!ethereum))error='invalidCryptoAddress';else if(form.asset==='usdt'&&!((form.network==='erc20'&&ethereum)||(form.network==='trc20'&&tron)))error='invalidCryptoAddress';else if(form.asset==='bitcoin'){payload=`bitcoin:${address}${form.amount?`?amount=${encodeURIComponent(form.amount)}`:''}`}else{payload=form.asset==='ethereum'?`ethereum:${address}`:`USDT (${form.network.toUpperCase()}): ${address}`;if(form.amount)warning='cryptoAmountUnsupported'}warning=warning??'cryptoWarning';break}
  }
  const bytes=new TextEncoder().encode(payload).length;const capacity=byteCapacity[level];if(!error&&bytes>capacity){error='capacityExceeded';payload=''}
  return{valid:!error&&!!payload,payload,error,warning,bytes,capacity}
}
