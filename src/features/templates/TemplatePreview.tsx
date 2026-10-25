import { useEffect, useRef } from 'react'
import { prepareQrEngine } from '../qr/qrEngine'
import type { QrDesignSettings } from '../../types/qr'

export function TemplatePreview({ settings }: { settings: QrDesignSettings }) {
  const ref=useRef<HTMLDivElement>(null)
  useEffect(()=>{ const host=ref.current;if(!host)return;host.replaceChildren();const prepared=prepareQrEngine('https://qr.studio/template',settings,112);prepared.engine.append(host);return()=>host.replaceChildren() },[settings])
  return <div className="template-preview" ref={ref} aria-hidden="true" />
}
