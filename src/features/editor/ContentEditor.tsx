import type { ReactNode } from 'react'
import type { ErrorCorrectionLevel } from 'qr-code-styling'
import { useApp } from '../../app/appContext'
import { Icons } from '../../components/icons'
import type { TranslationKey } from '../../locales'
import { buildPayload, initialContentWorkspace, type ContentType, type ContentWorkspace } from '../content/contentTypes'

const contentTypes:Array<[ContentType,TranslationKey]>=[['website','typeWebsite'],['text','typeText'],['wifi','typeWifi'],['vcard','typeVcard'],['whatsapp','typeWhatsapp'],['email','typeEmail'],['phone','typePhone'],['sms','typeSms'],['location','typeLocation'],['event','typeEvent'],['crypto','typeCrypto']]

export function ContentEditor({state,onChange,level}:{state:ContentWorkspace;onChange:(state:ContentWorkspace)=>void;level:ErrorCorrectionLevel}){
  const{t}=useApp();const type=state.activeType;const form=state.forms[type];const result=buildPayload(form,level)
  const update=(patch:Record<string,unknown>)=>onChange({...state,forms:{...state.forms,[type]:{...form,...patch}}} as ContentWorkspace)
  const select=(activeType:ContentType)=>onChange({...state,activeType})
  const clear=()=>onChange({...state,forms:{...state.forms,[type]:initialContentWorkspace.forms[type]}} as ContentWorkspace)
  return <section className="content-editor multi-content" aria-labelledby="content-label">
    <div className="editor-heading"><div><span className="section-kicker">01 / {t('contentTool')}</span><h1 id="content-label">{t('multiTypeTitle')}</h1></div><button type="button" className="text-button" onClick={clear}>{t('clear')}</button></div>
    <div className="content-type-grid" role="group" aria-label={t('contentType')}>{contentTypes.map(([value,label])=><button type="button" key={value} data-content-type={value} aria-pressed={type===value} className={type===value?'selected':''} onClick={()=>select(value)}><span aria-hidden="true">{typeGlyph(value)}</span><small>{t(label)}</small></button>)}</div>
    <div className="dynamic-form">{renderForm(type,form,update,t)}</div>
    <div className={`payload-status ${result.error?'invalid':result.valid?'valid':''}`} role="status" aria-live="polite"><span>{result.error?t(result.error as TranslationKey):result.valid?t('payloadReady'):t('emptyContent')}</span><small>{result.bytes} / {result.capacity} UTF-8 bytes · ECC {level}</small>{result.warning&&<p><Icons.info/>{t(result.warning as TranslationKey)}</p>}</div>
    <p className="field-hint"><Icons.shield/>{t('sessionOnly')}</p>
  </section>
}

type T=(key:TranslationKey)=>string
function renderForm(type:ContentType,form:ContentWorkspace['forms'][ContentType],update:(patch:Record<string,unknown>)=>void,t:T):ReactNode{
  const record=form as unknown as Record<string,unknown>
  const input=(name:string,label:TranslationKey,kind='text',placeholder='')=><Field label={t(label)}><input id={`content-${name}`} type={kind} value={String(record[name]??'')} placeholder={placeholder} onChange={(event)=>update({[name]:event.target.value})}/></Field>
  const area=(name:string,label:TranslationKey)=><Field label={t(label)}><textarea id={`content-${name}`} rows={4} value={String(record[name]??'')} onChange={(event)=>update({[name]:event.target.value})}/></Field>
  switch(type){
    case'website':return input('url','websiteUrl','url','https://example.com')
    case'text':return area('text','textContent')
    case'wifi':return <>{input('ssid','wifiSsid')}<Field label={t('wifiSecurity')}><select id="content-security" value={form.type==='wifi'?form.security:'WPA'} onChange={(e)=>update({security:e.target.value})}><option value="WPA">WPA / WPA2</option><option value="WPA3">WPA3-Personal</option><option value="nopass">{t('wifiOpen')}</option></select></Field>{form.type==='wifi'&&form.security!=='nopass'&&input('password','wifiPassword','password')}<label className="check-field"><input id="content-hidden" type="checkbox" checked={form.type==='wifi'&&form.hidden} onChange={(e)=>update({hidden:e.target.checked})}/>{t('wifiHidden')}</label></>
    case'vcard':return <div className="form-grid">{input('fullName','fullName')}{input('phone','phoneNumber','tel')}{input('email','emailRecipient','email')}{input('company','company')}{input('jobTitle','jobTitle')}{input('website','websiteUrl','url')}{input('address','address')}{area('notes','notes')}</div>
    case'whatsapp':return <>{input('phone','internationalPhone','tel')}{area('message','message')}</>
    case'email':return <>{input('recipient','emailRecipient','email')}{input('subject','emailSubject')}{area('body','emailBody')}</>
    case'phone':return input('phone','phoneNumber','tel')
    case'sms':return <>{input('phone','phoneNumber','tel')}{area('message','message')}</>
    case'location':return <div className="form-grid">{input('latitude','latitude','number')}{input('longitude','longitude','number')}</div>
    case'event':return <>{input('title','eventTitle')}<div className="form-grid">{input('start','eventStart','datetime-local')}{input('end','eventEnd','datetime-local')}</div>{input('timeZone','timeZone')}{input('location','eventLocation')}{area('description','description')}</>
    case'crypto':{const f=form.type==='crypto'?form:null;return <><Field label={t('cryptoAsset')}><select id="content-asset" value={f?.asset} onChange={(e)=>{const asset=e.target.value;update({asset,network:asset==='bitcoin'?'bitcoin':asset==='ethereum'?'ethereum':'erc20'})}}><option value="bitcoin">Bitcoin</option><option value="ethereum">Ethereum</option><option value="usdt">USDT</option></select></Field><Field label={t('cryptoNetwork')}><select id="content-network" value={f?.network} onChange={(e)=>update({network:e.target.value})}>{f?.asset==='bitcoin'?<option value="bitcoin">Bitcoin</option>:f?.asset==='ethereum'?<option value="ethereum">Ethereum Mainnet</option>:<><option value="erc20">Ethereum (ERC-20)</option><option value="trc20">TRON (TRC-20)</option></>}</select></Field>{input('address','cryptoAddress')}{input('amount','cryptoAmount','number')}<div className="crypto-warning" role="note"><Icons.info/>{t('cryptoPermanentWarning')}</div></>}
  }
}

function Field({label,children}:{label:string;children:ReactNode}){return <label className="dynamic-field"><span>{label}</span>{children}</label>}
function typeGlyph(type:ContentType){return({website:'↗',text:'T',wifi:'⌁',vcard:'◉',whatsapp:'◌',email:'@',phone:'☎',sms:'…',location:'⌖',event:'□',crypto:'₿'} as Record<ContentType,string>)[type]}
