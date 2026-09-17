const {searchLab2Web,extractLab2Web,LAB2_WEB_PROVIDER_LIMITS}=await import(new URL('../src/lab2-web-provider.js',import.meta.url).href+`?t=${Date.now()}`);

const originalFetch=globalThis.fetch;
let fetchCalls=0;
globalThis.fetch=async(url,options={})=>{
  fetchCalls+=1;
  if(String(url)==='https://api.tavily.com/search')return Response.json({results:[{title:'Result',url:'https://example.com/',content:'Relevant result'}],usage:{credits:1}});
  if(String(url)==='https://api.tavily.com/extract')return Response.json({results:[{url:'https://example.com/',raw_content:'Rendered fallback content'}],usage:{credits:1}});
  throw new Error(`unexpected fetch ${url}`);
};

const unconfigured=await searchLab2Web({},'architecte interieur');
if(unconfigured.ok||unconfigured.provider!=='NONE'||unconfigured.error!=='SEARCH_UNCONFIGURED')throw new Error('LAB2_WEB_UNCONFIGURED_SEARCH_MUST_FAIL_CLOSED');
if(fetchCalls!==0)throw new Error('LAB2_WEB_UNCONFIGURED_SEARCH_MUST_NOT_CALL_PROVIDER');

const tavily=await searchLab2Web({LAB2_TAVILY_API_KEY:'test-key'},'architecte interieur');
if(!tavily.ok||tavily.provider!=='TAVILY'||tavily.results.length!==1)throw new Error('LAB2_WEB_TAVILY_SEARCH_FAILED');

let browserCalls=0;
const browserEnv={BROWSER:{quickAction:async(action,input)=>{browserCalls+=1;if(action!=='markdown'||input?.url!=='https://hfconcept.com/')throw new Error('unexpected browser call');return Response.json({success:true,result:'# HFConcept\nArchitecture intérieure et réalisations.'});}}};
const rendered=await extractLab2Web('https://hfconcept.com/',browserEnv);
if(!rendered.ok||rendered.provider!=='BROWSER_MARKDOWN'||!rendered.text.includes('HFConcept')||browserCalls!==1)throw new Error('LAB2_WEB_BROWSER_MARKDOWN_FALLBACK_FAILED');

const tavilyExtract=await extractLab2Web('https://example.com/',{LAB2_TAVILY_API_KEY:'test-key'});
if(!tavilyExtract.ok||tavilyExtract.provider!=='TAVILY_EXTRACT'||!tavilyExtract.text.includes('Rendered fallback'))throw new Error('LAB2_WEB_TAVILY_EXTRACT_FALLBACK_FAILED');

if(LAB2_WEB_PROVIDER_LIMITS.search_order.includes('TAVILY_KEYLESS'))throw new Error('LAB2_WEB_KEYLESS_PROVIDER_MUST_NOT_BE_ADVERTISED');
if(!LAB2_WEB_PROVIDER_LIMITS.extract_fallback_order.includes('BROWSER_MARKDOWN'))throw new Error('LAB2_WEB_BROWSER_FALLBACK_CONTRACT_MISSING');

globalThis.fetch=originalFetch;
console.log('lab2-web-provider-v2: ok (no fake keyless search; browser-rendered extraction fallback verified)');
