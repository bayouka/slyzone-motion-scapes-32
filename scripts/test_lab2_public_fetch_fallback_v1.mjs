import { fetchPublicHtmlFallback } from '../src/lab2-public-fetch-fallback.js';

const html='<!doctype html><html><head><title>HFconcept</title><script>bad()</script></head><body><main><h1>Studio d\'architecture intérieure</h1><p>Transformons vos espaces grâce à des projections 3D photoréalistes.</p><a>Parler de votre projet</a><section><h2>Un accompagnement clair dès le premier échange</h2><p>Premier échange offert et sans engagement.</p></section></main></body></html>';
let fetchCalls=0;
const fetchImpl=async(url,options={})=>{
  fetchCalls+=1;
  if(String(url).startsWith('https://cloudflare-dns.com/')){
    const type=new URL(String(url)).searchParams.get('type');
    return Response.json({Answer:type==='A'?[{type:1,data:'203.0.114.10'}]:[]});
  }
  if(String(url)==='https://www.hfconcept.test/'){
    if(options.redirect!=='manual')throw new Error('redirect must be manual');
    return new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
  }
  throw new Error(`unexpected fetch ${url}`);
};
const result=await fetchPublicHtmlFallback('https://www.hfconcept.test/',{fetchImpl});
if(result.fetch_method!=='SAFE_HTTP_FALLBACK')throw new Error('LAB2_FALLBACK_METHOD_MISMATCH');
if(!result.extracted_text.includes("Studio d'architecture intérieure"))throw new Error('LAB2_FALLBACK_TEXT_MISSING');
if(result.extracted_text.includes('bad()'))throw new Error('LAB2_FALLBACK_SCRIPT_NOT_STRIPPED');
if(fetchCalls<2)throw new Error('LAB2_FALLBACK_DNS_PRECHECK_MISSING');

let privateBlocked=false;
try{
  await fetchPublicHtmlFallback('https://127.0.0.1/private',{fetchImpl});
}catch(error){
  privateBlocked=String(error?.code||'').includes('PRIVATE');
}
if(!privateBlocked)throw new Error('LAB2_FALLBACK_PRIVATE_IP_GUARD_FAILED');
console.log('lab2-public-fetch-fallback-v1: ok (safe public HTTP fallback, private IP blocked)');
