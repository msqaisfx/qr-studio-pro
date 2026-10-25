import { useState } from 'react'
import { useApp } from '../../app/appContext'
import type { ContentType } from '../content/contentTypes'
import type { QrDesignSettings } from '../../types/qr'
import { applyTemplate, designTemplates } from './templates'
import { TemplatePreview } from './TemplatePreview'
import { runQualityGuard } from '../quality/qualityRunner'
import type { QualityStatus } from '../quality/qualityTypes'

export function TemplatesPanel({ settings, contentType, payload, onChange }: { settings:QrDesignSettings; contentType:ContentType; payload:string; onChange:(value:QrDesignSettings)=>void }) {
  const {t}=useApp(); const [warning,setWarning]=useState('');const [guard,setGuard]=useState<QualityStatus|null>(null)
  const choose=async(id:string)=>{const template=designTemplates.find(item=>item.id===id);if(!template)return;setWarning(template.suitable&&!template.suitable.includes(contentType)?t('templateCompatibilityWarning'):'');const next=applyTemplate(settings,template);onChange(next);setGuard(null);if(payload){try{const report=await runQualityGuard(payload,next);setGuard(report.overall)}catch{setGuard('unknown')}}}
  return <div className="panel-body templates-panel"><span className="eyebrow">TEMPLATES / 09</span><h1>{t('templatesLibrary')}</h1><p className="section-copy">{t('templatesIntro')}</p>{warning&&<div className="warning-box" role="status">⚠ {warning}</div>}{guard&&<div className={`template-guard ${guard}`} role="status">{t('templateGuardResult')}: {guard.toUpperCase()}</div>}<div className="template-grid">{designTemplates.map(template=><button type="button" key={template.id} data-template={template.id} className="template-card" onClick={()=>void choose(template.id)}><TemplatePreview settings={template.settings}/><strong>{t(template.nameKey as never)}</strong><span>{t('editableTemplate')}</span></button>)}</div></div>
}
