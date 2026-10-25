import { defaultQrDesignSettings, type QrDesignSettings } from '../../types/qr'
import type { ContentType } from '../content/contentTypes'

export interface DesignTemplate { id:string; nameKey:string; suitable?:ContentType[]; settings:QrDesignSettings }
const solid=(color:string)=>({mode:'solid' as const,solid:color,stops:[{offset:0,color},{offset:1,color}],rotation:0})
const gradient=(a:string,b:string,rotation=0)=>({mode:'linear' as const,solid:a,stops:[{offset:0,color:a},{offset:1,color:b}],rotation})
const make=(id:string,body:string,accent:string,background='#ffffff',pattern:QrDesignSettings['bodyPattern']='rounded',extra:Partial<QrDesignSettings>={}):DesignTemplate=>({id,nameKey:`template_${id}`,settings:{...structuredClone(defaultQrDesignSettings),bodyPattern:pattern,bodyColor:solid(body),cornerSquareColor:solid(accent),cornerDotColor:solid(body),background:{color:background,transparent:false},...extra}})

export const designTemplates:DesignTemplate[]=[
  make('classicBusiness','#111827','#111827','#ffffff','square'),
  make('modernCorporate','#0f2a43','#2563eb','#f8fbff','rounded'),
  {...make('restaurantMenu','#3f1d16','#b45309','#fffaf0','classy-rounded'),suitable:['website']},
  {...make('coffeeShop','#3b2416','#a16207','#fff8ed','dots'),suitable:['website']},
  make('socialMedia','#7c3aed','#ec4899','#fff7ff','extra-rounded',{bodyColor:gradient('#7c3aed','#ec4899',45)}),
  make('personalBrand','#0f172a','#06b6d4','#f8fafc','classy'),
  {...make('eventInvitation','#6b214f','#d977a8','#fff7fb','classy-rounded'),suitable:['event']},
  {...make('wifiAccess','#064e3b','#10b981','#f0fdf4','rounded'),suitable:['wifi']},
  {...make('digitalBusinessCard','#1e3a5f','#0284c7','#f5fbff','square'),suitable:['vcard']},
  make('minimalBlack','#000000','#000000','#ffffff','square'),
  make('luxuryGold','#17120a','#b68a35','#fffdf7','classy'),
  make('creativeGradient','#312e81','#9f1239','#ffffff','dots',{bodyColor:gradient('#1e40af','#9f1239',135),cornerSquareColor:gradient('#5b21b6','#881337',45)}),
]

export function applyTemplate(current:QrDesignSettings, template:DesignTemplate):QrDesignSettings {
  return { ...structuredClone(template.settings), exportSize:current.exportSize, logo:structuredClone(current.logo), errorCorrectionLevel:current.errorCorrectionLevel }
}
