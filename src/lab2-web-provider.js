const MAX_RESULTS=6;
const TAVILY_SEARCH_URL='https://api.tavily.com/search';
const TAVILY_EXTRACT_URL='https://api.tavily.com/extract';

function cleanText(value,max=1000){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function safeArray(value){return Array.isArray(value)?value:[]}
function normalizeUrl(value){
  let raw=cleanText(value,1000);if(!raw)return '';
  if(!/^https?:\/\//i.test(raw))raw=`https://${raw}`;
  try{const url=new URL(raw);if(!['http:','https:'].includes(url.protocol))return '';url.hash='';return url.toString().slice(0,1000)}catch{return ''}
}

async function braveSearch(env,query){
  if(!env?.LAB2_BRAVE_SEARCH_API_KEY)return {ok:false,provider:'BRAVE',error:'SEARCH_UNCONFIGURED',results:[]};
  const url=new URL('https://api.search.brave.com/res/v1/web/search');
  url.searchParams.set('q',query);url.searchParams.set('count',String(MAX_RESULTS));url.searchParams.set('country','fr');url.searchParams.set('search_lang','fr');url.searchParams.set('ui_lang','fr-FR');
  let response;
  try{response=await fetch(url.toString(),{headers:{accept:'application/json','x-subscription-token':String(env.LAB2_BRAVE_SEARCH_API_KEY)}})}
  catch{return {ok:false,provider:'BRAVE',error:'SEARCH_NETWORK_ERROR',results:[]}}
  if(!response.ok)return {ok:false,provider:'BRAVE',error:response.status===429?'SEARCH_QUOTA':'SEARCH_ERROR',results:[]};
  const payload=await response.json().catch(()=>null);
  const results=safeArray(payload?.web?.results).slice(0,MAX_RESULTS).map(item=>({title:cleanText(item?.title,220),url:normalizeUrl(item?.url),description:cleanText(item?.description,700)})).filter(item=>item.url);
  return {ok:true,provider:'BRAVE',error:null,results};
}

async function tavilySearch(query,apiKey=''){
  const headers={'content-type':'application/json','accept':'application/json'};
  if(apiKey)headers.authorization=`Bearer ${apiKey}`;
  let response;
  try{
    response=await fetch(TAVILY_SEARCH_URL,{method:'POST',headers,body:JSON.stringify({query:cleanText(query,1200),topic:'general',search_depth:'basic',max_results:MAX_RESULTS,include_answer:false,include_raw_content:false,include_images:false,include_usage:true})});
  }catch{return {ok:false,provider:apiKey?'TAVILY':'TAVILY_KEYLESS',error:'SEARCH_NETWORK_ERROR',results:[]}}
  if(!response.ok)return {ok:false,provider:apiKey?'TAVILY':'TAVILY_KEYLESS',error:response.status===429?'SEARCH_QUOTA':'SEARCH_ERROR',results:[]};
  const payload=await response.json().catch(()=>null);
  const results=safeArray(payload?.results).slice(0,MAX_RESULTS).map(item=>({title:cleanText(item?.title,220),url:normalizeUrl(item?.url),description:cleanText(item?.content,700)})).filter(item=>item.url);
  return {ok:true,provider:apiKey?'TAVILY':'TAVILY_KEYLESS',error:null,results,provider_usage:payload?.usage||null};
}

export async function searchLab2Web(env,query){
  const brave=await braveSearch(env,query);
  if(brave.ok&&brave.results.length)return brave;
  const tavily=await tavilySearch(query,String(env?.LAB2_TAVILY_API_KEY||env?.TAVILY_API_KEY||'').trim());
  if(tavily.ok)return tavily;
  return brave.error!=='SEARCH_UNCONFIGURED'?brave:tavily;
}

export async function extractLab2Web(url,env={}){
  const target=normalizeUrl(url);if(!target)return {ok:false,provider:'TAVILY_EXTRACT',error:'EXTRACT_URL_INVALID',text:''};
  const apiKey=String(env?.LAB2_TAVILY_API_KEY||env?.TAVILY_API_KEY||'').trim();
  const headers={'content-type':'application/json','accept':'application/json'};
  if(apiKey)headers.authorization=`Bearer ${apiKey}`;
  let response;
  try{
    response=await fetch(TAVILY_EXTRACT_URL,{method:'POST',headers,body:JSON.stringify({urls:[target],extract_depth:'basic',include_images:false,include_usage:true})});
  }catch{return {ok:false,provider:apiKey?'TAVILY_EXTRACT':'TAVILY_EXTRACT_KEYLESS',error:'EXTRACT_NETWORK_ERROR',text:''}}
  if(!response.ok)return {ok:false,provider:apiKey?'TAVILY_EXTRACT':'TAVILY_EXTRACT_KEYLESS',error:response.status===429?'EXTRACT_QUOTA':'EXTRACT_ERROR',text:''};
  const payload=await response.json().catch(()=>null);
  const first=safeArray(payload?.results)[0];
  const text=String(first?.raw_content||first?.content||'').trim();
  if(!text)return {ok:false,provider:apiKey?'TAVILY_EXTRACT':'TAVILY_EXTRACT_KEYLESS',error:'EXTRACT_EMPTY',text:''};
  return {ok:true,provider:apiKey?'TAVILY_EXTRACT':'TAVILY_EXTRACT_KEYLESS',error:null,url:normalizeUrl(first?.url)||target,text,provider_usage:payload?.usage||null};
}

export const LAB2_WEB_PROVIDER_LIMITS=Object.freeze({max_results:MAX_RESULTS,search_order:['BRAVE','TAVILY','TAVILY_KEYLESS'],extract_fallback:'TAVILY_EXTRACT'});
