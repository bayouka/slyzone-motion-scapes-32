// 4b4c / 2b2c — isolated source-fetch service core V0.1
// Dormant candidate. The dedicated Worker is internal-only and is not yet bound to the main 4b4c Worker.

import { fetchCanonicalPublicSource, G2SourceFetchError } from './idea-source-fetch-candidate.js';

const CONTRACT='g2-source-fetch-service-v0.1';
const MAX_LOCATOR_CHARS=4096;

export class G2SourceFetchServiceError extends Error{
  constructor(code,detail=''){super(code);this.code=code;this.detail=detail;}
}

function locatorText(value){
  if(typeof value!=='string')throw new G2SourceFetchServiceError('SRC_SERVICE_LOCATOR_REQUIRED');
  const locator=value.trim();
  if(!locator)throw new G2SourceFetchServiceError('SRC_SERVICE_LOCATOR_REQUIRED');
  if(locator.length>MAX_LOCATOR_CHARS)throw new G2SourceFetchServiceError('SRC_SERVICE_LOCATOR_TOO_LONG');
  return locator;
}

export async function fetchEvidenceSourceCandidate(locator,{fetchSource=fetchCanonicalPublicSource}={}){
  const safeLocator=locatorText(locator);
  let fetched;
  try{
    fetched=await fetchSource(safeLocator);
  }catch(error){
    if(error instanceof G2SourceFetchError){
      throw new G2SourceFetchServiceError(error.code,String(error.detail||'').slice(0,180));
    }
    if(error instanceof G2SourceFetchServiceError)throw error;
    throw new G2SourceFetchServiceError('SRC_FETCH_FAILED');
  }

  if(!fetched||typeof fetched!=='object'||typeof fetched.extracted_text!=='string'||typeof fetched.content_hash!=='string'){
    throw new G2SourceFetchServiceError('SRC_FETCH_RESULT_INVALID');
  }
  if(!/^[0-9a-f]{64}$/.test(fetched.content_hash))throw new G2SourceFetchServiceError('SRC_FETCH_HASH_INVALID');

  return {
    contract:CONTRACT,
    final_url:String(fetched.final_url||'').slice(0,4096),
    content_type:String(fetched.content_type||'').slice(0,160),
    extracted_text:fetched.extracted_text,
    content_hash:fetched.content_hash,
    fetched_at:String(fetched.fetched_at||new Date().toISOString()).slice(0,80),
    redirect_count:Number.isInteger(fetched.redirect_count)?fetched.redirect_count:Number(fetched.redirect_count||0)
  };
}

export const G2_SOURCE_FETCH_SERVICE_CONTRACT=Object.freeze({
  code:CONTRACT,
  max_locator_chars:MAX_LOCATOR_CHARS,
  public_network_only:true,
  browser_access:false,
  service_binding_only:true
});
