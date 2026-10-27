import { useEffect, useRef } from 'react'
import { appendPreparedQr, prepareQrEngine } from '../qr/qrEngine'
import type { QrDesignSettings } from '../../types/qr'

export function TemplatePreview({ settings }: { settings: QrDesignSettings }) {
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{ const host=ref.current;if(!host)return;let cancelled=false;host.replaceChildren();const prepared=prepareQrEngine('https://qr.studio/template',settings,112);void appendPreparedQr(prepared.engine,host).catch(()=>undefined);return()=>{cancelled=true;if(cancelled)host.replaceChildren()} },[settings])
  return <div className="template-preview" ref={ref} aria-hidden="true" />
}
