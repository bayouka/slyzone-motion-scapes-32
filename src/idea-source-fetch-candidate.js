// 4b4c / 2b2c — G2 SRC URL fetch + canonical text candidate
// Dormant candidate. Not imported by the production Worker until SRC activation gates pass.

const MAX_REDIRECTS=3;
const MAX_BODY_BYTES=1024*1024;
const MAX_TEXT_BYTES=256*1024;
const FETCH_TIMEOUT_MS=10000;
const DNS_TIMEOUT_MS=5000;
const ALLOWED_CONTENT_TYPES=new Set(['text/html','text/plain','application/xhtml+xml']);

export class G2SourceFetchError extends Error{
  constructor(code,detail=''){super(code);this.code=code;this.detail=detail;}
}

function lower(v){return String(v??'').trim().toLowerCase()}
function stripIpv6Brackets(host){return host.startsWith('[')&&host.endsWith(']')?host.slice(1,-1):host}
function normalizeHost(host){return stripIpv6Brackets(lower(host)).replace(/\.+$/,'')}

function parseIPv4(host){
  if(!/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host))return null;
  const parts=host.split('.').map(Number);
  if(parts.some(n=>n<0||n>255))return null;
  return parts;
}

function ipv4IsPublic(parts){
  if(!parts)return false;
  const [a,b,c]=parts;
  if(a===0||a===10||a===127||a>=224)return false;
  if(a===100&&b>=64&&b<=127)return false;
  if(a===169&&b===254)return false;
  if(a===172&&b>=16&&b<=31)return false;
  if(a===192&&b===0&&c===0)return false;
  if(a===192&&b===0&&c===2)return false;
  if(a===192&&b===168)return false;
  if(a===198&&(b===18||b===19))return false;
  if(a===198&&b===51&&c===100)return false;
  if(a===203&&b===0&&c===113)return false;
  return true;
}

function ipv6IsPublic(raw){
  const host=normalizeHost(raw).split('%')[0];
  if(!host.includes(':'))return false;
  if(host==='::'||host==='::1')return false;
  if(host.startsWith('fc')||host.startsWith('fd'))return false;
  if(/^fe[89ab]/.test(host))return false;
  if(host.startsWith('ff'))return false;
  if(host==='2001:db8'||host.startsWith('2001:db8:'))return false;
  if(host.startsWith('::ffff:')){
    const mapped=host.slice(7);
    const v4=parseIPv4(mapped);
    return Boolean(v4)&&ipv4IsPublic(v4);
  }
  return true;
}

function timeoutController(ms){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),ms);
  return {signal:controller.signal,clear:()=>clearTimeout(timer)};
}

export function validatePublicSourceUrl(value){
  let url;
  try{url=new URL(String(value??''));}catch{throw new G2SourceFetchError('SRC_URL_INVALID')}
  if(url.protocol!=='https:')throw new G2SourceFetchError('SRC_HTTPS_REQUIRED');
  if(url.username||url.password)throw new G2SourceFetchError('SRC_URL_CREDENTIALS_FORBIDDEN');
  if(url.port&&url.port!=='443')throw new G2SourceFetchError('SRC_PORT_FORBIDDEN');
  const host=normalizeHost(url.hostname);
  if(!host)throw new G2SourceFetchError('SRC_HOST_REQUIRED');
  if(host==='localhost'||host==='local'||host==='internal'||host==='home.arpa'||host.endsWith('.localhost')||host.endsWith('.local')||host.endsWith('.internal')||host.endsWith('.home.arpa')){
    throw new G2SourceFetchError('SRC_PRIVATE_HOST_FORBIDDEN');
  }
  const v4=parseIPv4(host);
  if(v4&&!ipv4IsPublic(v4))throw new G2SourceFetchError('SRC_PRIVATE_IP_FORBIDDEN');
  if(host.includes(':')&&!ipv6IsPublic(host))throw new G2SourceFetchError('SRC_PRIVATE_IP_FORBIDDEN');
  url.hostname=host;
  url.hash='';
  return url;
}

export function assertPublicResolvedAddresses(addresses){
  if(!Array.isArray(addresses)||addresses.length===0)throw new G2SourceFetchError('SRC_DNS_NO_PUBLIC_ADDRESS');
  for(const raw of addresses){
    const value=normalizeHost(raw);
    const v4=parseIPv4(value);
    if(v4){if(!ipv4IsPublic(v4))throw new G2SourceFetchError('SRC_DNS_PRIVATE_ADDRESS');continue;}
    if(value.includes(':')){if(!ipv6IsPublic(value))throw new G2SourceFetchError('SRC_DNS_PRIVATE_ADDRESS');continue;}
    throw new G2SourceFetchError('SRC_DNS_ADDRESS_INVALID');
  }
  return true;
}

export async function resolvePublicAddresses(hostname,fetchImpl=fetch){
  const host=normalizeHost(hostname);
  const literal4=parseIPv4(host);
  if(literal4){assertPublicResolvedAddresses([host]);return [host];}
  if(host.includes(':')){assertPublicResolvedAddresses([host]);return [host];}
  const out=[];
  for(const type of ['A','AAAA']){
    const u=new URL('https://cloudflare-dns.com/dns-query');
    u.searchParams.set('name',host);u.searchParams.set('type',type);
    const deadline=timeoutController(DNS_TIMEOUT_MS);
    let r;
    try{r=await fetchImpl(u,{headers:{accept:'application/dns-json'},redirect:'error',signal:deadline.signal});}
    catch(error){throw new G2SourceFetchError(error?.name==='AbortError'?'SRC_DNS_TIMEOUT':'SRC_DNS_LOOKUP_FAILED')}
    finally{deadline.clear();}
    if(!r.ok)throw new G2SourceFetchError('SRC_DNS_LOOKUP_FAILED',String(r.status));
    const payload=await r.json().catch(()=>null);
    for(const answer of Array.isArray(payload?.Answer)?payload.Answer:[]){
      if((type==='A'&&answer?.type===1)||(type==='AAAA'&&answer?.type===28))out.push(String(answer.data||''));
    }
  }
  assertPublicResolvedAddresses(out);
  return out;
}

async function readBodyBounded(response,maxBytes=MAX_BODY_BYTES){
  const declared=Number(response.headers.get('content-length')||0);
  if(Number.isFinite(declared)&&declared>maxBytes)throw new G2SourceFetchError('SRC_BODY_TOO_LARGE');
  if(!response.body)throw new G2SourceFetchError('SRC_EMPTY_BODY');
  const reader=response.body.getReader();
  const chunks=[];let total=0;
  while(true){
    const {done,value}=await reader.read();
    if(done)break;
    total+=value.byteLength;
    if(total>maxBytes){try{await reader.cancel()}catch{}throw new G2SourceFetchError('SRC_BODY_TOO_LARGE');}
    chunks.push(value);
  }
  const merged=new Uint8Array(total);let offset=0;
  for(const chunk of chunks){merged.set(chunk,offset);offset+=chunk.byteLength;}
  return new TextDecoder('utf-8',{fatal:false}).decode(merged);
}

function decodeEntities(text){
  const named={amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
  return text.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi,(m,key)=>{
    if(key[0]==='#'){
      const hex=key[1]?.toLowerCase()==='x';const raw=hex?key.slice(2):key.slice(1);const n=parseInt(raw,hex?16:10);
      return Number.isFinite(n)&&n>0&&n<=0x10ffff?String.fromCodePoint(n):m;
    }
    return Object.prototype.hasOwnProperty.call(named,key.toLowerCase())?named[key.toLowerCase()]:m;
  });
}

export function canonicalizeSourceText(body,contentType='text/plain'){
  let text=String(body??'').replace(/\u0000/g,' ');
  if(lower(contentType).startsWith('text/html')||lower(contentType).startsWith('application/xhtml+xml')){
    text=text
      .replace(/<!--[\s\S]*?-->/g,' ')
      .replace(/<(script|style|template|noscript|svg)\b[^>]*>[\s\S]*?<\/\1\s*>/gi,' ')
      .replace(/<br\s*\/?>/gi,'\n')
      .replace(/<\/(p|div|li|section|article|h[1-6]|tr|blockquote)>/gi,'\n')
      .replace(/<[^>]+>/g,' ');
    text=decodeEntities(text);
  }
  text=text.normalize('NFC').replace(/\r\n?/g,'\n').replace(/[\t\f\v ]+/g,' ').replace(/ *\n */g,'\n').replace(/\n{3,}/g,'\n\n').trim();
  if(!text)throw new G2SourceFetchError('SRC_CANONICAL_TEXT_EMPTY');
  const bytes=new TextEncoder().encode(text);
  if(bytes.byteLength>MAX_TEXT_BYTES)throw new G2SourceFetchError('SRC_CANONICAL_TEXT_TOO_LARGE');
  return text;
}

export async function sha256Hex(text){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(text)));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

export async function fetchCanonicalPublicSource(locator,{fetchImpl=fetch,resolveAddresses=resolvePublicAddresses,maxRedirects=MAX_REDIRECTS}={}){
  let url=validatePublicSourceUrl(locator);
  for(let hop=0;hop<=maxRedirects;hop++){
    await resolveAddresses(url.hostname,fetchImpl);
    const deadline=timeoutController(FETCH_TIMEOUT_MS);
    let response;
    try{
      response=await fetchImpl(url,{method:'GET',redirect:'manual',signal:deadline.signal,headers:{accept:'text/html,text/plain,application/xhtml+xml;q=0.9','user-agent':'2b2c-source-fetch/0.2'}});
      if(response.status>=300&&response.status<400){
        const location=response.headers.get('location');
        if(!location)throw new G2SourceFetchError('SRC_REDIRECT_LOCATION_MISSING');
        if(hop===maxRedirects)throw new G2SourceFetchError('SRC_REDIRECT_LIMIT');
        url=validatePublicSourceUrl(new URL(location,url).href);
        continue;
      }
      if(!response.ok)throw new G2SourceFetchError('SRC_FETCH_HTTP_ERROR',String(response.status));
      const contentType=lower((response.headers.get('content-type')||'').split(';')[0]);
      if(!ALLOWED_CONTENT_TYPES.has(contentType))throw new G2SourceFetchError('SRC_CONTENT_TYPE_UNSUPPORTED',contentType);
      const raw=await readBodyBounded(response);
      const extractedText=canonicalizeSourceText(raw,contentType);
      const contentHash=await sha256Hex(extractedText);
      return {final_url:url.href,content_type:contentType,extracted_text:extractedText,content_hash:contentHash,fetched_at:new Date().toISOString(),redirect_count:hop};
    }catch(error){
      if(error instanceof G2SourceFetchError)throw error;
      throw new G2SourceFetchError(error?.name==='AbortError'?'SRC_FETCH_TIMEOUT':'SRC_FETCH_FAILED');
    }finally{deadline.clear();}
  }
  throw new G2SourceFetchError('SRC_REDIRECT_LIMIT');
}

export const G2_SOURCE_FETCH_LIMITS=Object.freeze({max_redirects:MAX_REDIRECTS,max_body_bytes:MAX_BODY_BYTES,max_text_bytes:MAX_TEXT_BYTES,fetch_timeout_ms:FETCH_TIMEOUT_MS,dns_timeout_ms:DNS_TIMEOUT_MS});
