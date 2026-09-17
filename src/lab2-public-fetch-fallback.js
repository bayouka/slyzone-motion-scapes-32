import { validatePublicSourceUrl, resolvePublicAddresses } from './idea-source-fetch-candidate.js';

const MAX_REDIRECTS=3;
const MAX_BYTES=1536*1024;
const TIMEOUT_MS=12000;
const ALLOWED_TYPES=new Set(['text/html','text/plain','application/xhtml+xml']);
const BROWSER_UA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0 Safari/537.36 4b4c2-reference-reader/1.0';

export class Lab2PublicFetchError extends Error{
  constructor(code,detail=''){super(code);this.code=code;this.detail=detail;}
}

function timeout(ms){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  return {signal:controller.signal,clear:()=>clearTimeout(timer)};
}

async function readBounded(response){
  const declared=Number(response.headers.get('content-length')||0);
  if(Number.isFinite(declared)&&declared>MAX_BYTES)throw new Lab2PublicFetchError('FALLBACK_BODY_TOO_LARGE');
  if(!response.body)throw new Lab2PublicFetchError('FALLBACK_EMPTY_BODY');
  const reader=response.body.getReader();
  const chunks=[];let total=0;
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    total+=value.byteLength;
    if(total>MAX_BYTES){try{await reader.cancel()}catch{}throw new Lab2PublicFetchError('FALLBACK_BODY_TOO_LARGE');}
    chunks.push(value);
  }
  const merged=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.byteLength;}
  return new TextDecoder('utf-8',{fatal:false}).decode(merged);
}

function decodeEntities(text){
  const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return String(text||'').replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(match,key)=>{
    if(key[0]==='#'){
      const hex=key[1]?.toLowerCase()==='x';
      const raw=hex?key.slice(2):key.slice(1);
      const value=parseInt(raw,hex?16:10);
      return Number.isFinite(value)&&value>0&&value<=0x10ffff?String.fromCodePoint(value):match;
    }
    return Object.prototype.hasOwnProperty.call(named,key.toLowerCase())?named[key.toLowerCase()]:match;
  });
}

function htmlToText(raw,contentType){
  let text=String(raw||'').replace(/\u0000/g,' ');
  if(contentType==='text/html'||contentType==='application/xhtml+xml'){
    text=text
      .replace(/<!--[\s\S]*?-->/g,' ')
      .replace(/<(script|style|template|noscript|svg|canvas)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
      .replace(/<br\s*\/?>/gi,'\n')
      .replace(/<\/(p|div|li|section|article|main|aside|header|footer|nav|h[1-6]|tr|blockquote)>/gi,'\n')
      .replace(/<[^>]+>/g,' ');
    text=decodeEntities(text);
  }
  return text.normalize('NFC').replace(/\r\n?/g,'\n').replace(/[\t\f\v ]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
}

export async function fetchPublicHtmlFallback(locator,{fetchImpl=fetch,resolveAddresses=resolvePublicAddresses}={}){
  let url;
  try{url=validatePublicSourceUrl(locator);}catch(error){throw new Lab2PublicFetchError(error?.code||'FALLBACK_URL_INVALID');}
  for(let hop=0;hop<=MAX_REDIRECTS;hop++){
    try{await resolveAddresses(url.hostname,fetchImpl);}catch(error){throw new Lab2PublicFetchError(error?.code||'FALLBACK_DNS_FAILED');}
    const deadline=timeout(TIMEOUT_MS);
    let response;
    try{
      response=await fetchImpl(url,{method:'GET',redirect:'manual',signal:deadline.signal,headers:{accept:'text/html,text/plain,application/xhtml+xml;q=0.9,*/*;q=0.2','accept-language':'fr-FR,fr;q=0.9,en;q=0.7','user-agent':BROWSER_UA}});
    }catch(error){throw new Lab2PublicFetchError(error?.name==='AbortError'?'FALLBACK_TIMEOUT':'FALLBACK_FETCH_FAILED');}
    finally{deadline.clear();}
    if(response.status>=300&&response.status<400){
      const location=response.headers.get('location');
      if(!location)throw new Lab2PublicFetchError('FALLBACK_REDIRECT_LOCATION_MISSING');
      if(hop===MAX_REDIRECTS)throw new Lab2PublicFetchError('FALLBACK_REDIRECT_LIMIT');
      try{url=validatePublicSourceUrl(new URL(location,url).href);}catch(error){throw new Lab2PublicFetchError(error?.code||'FALLBACK_REDIRECT_INVALID');}
      continue;
    }
    if(!response.ok)throw new Lab2PublicFetchError('FALLBACK_HTTP_ERROR',String(response.status));
    const type=String(response.headers.get('content-type')||'').split(';')[0].trim().toLowerCase();
    if(!ALLOWED_TYPES.has(type))throw new Lab2PublicFetchError('FALLBACK_CONTENT_TYPE_UNSUPPORTED',type);
    const raw=await readBounded(response);
    const extracted_text=htmlToText(raw,type);
    if(extracted_text.length<80)throw new Lab2PublicFetchError('FALLBACK_TEXT_TOO_SHORT');
    return {final_url:url.href,content_type:type,extracted_text,redirect_count:hop,fetch_method:'SAFE_HTTP_FALLBACK'};
  }
  throw new Lab2PublicFetchError('FALLBACK_REDIRECT_LIMIT');
}

export const LAB2_PUBLIC_FETCH_FALLBACK_LIMITS=Object.freeze({max_redirects:MAX_REDIRECTS,max_bytes:MAX_BYTES,timeout_ms:TIMEOUT_MS,https_only:true,dns_public_only:true});
