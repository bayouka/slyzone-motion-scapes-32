// 4b4c / 2b2c — dormant G2 SRC ingestion orchestrator candidate.
// Not imported by production until the SRC activation gate is explicitly opened.

import { fetchCanonicalPublicSource, G2SourceFetchError } from './idea-source-fetch-candidate.js';

export class G2SourceIngestionError extends Error{
  constructor(code,detail=''){super(code);this.code=code;this.detail=detail;}
}

function arr(v){return Array.isArray(v)?v:[]}
function text(v,max=400){return String(v??'').trim().slice(0,max)}

export async function ingestOneRegisteredUrlSourceCandidate({idea,rpc,fetchSource=fetchCanonicalPublicSource}){
  if(!idea?.id||idea?.blueprint_id!=='SITE_VITRINE'||idea?.blueprint_version!=='0.5'||idea?.blueprint_status!=='active'){
    throw new G2SourceIngestionError('G2_BLUEPRINT_0_5_NOT_ACTIVE');
  }
  if(typeof rpc!=='function')throw new G2SourceIngestionError('G2_SRC_RPC_REQUIRED');

  const inventory=await rpc('list_g2_src_ingestion_candidates_candidate_v2',{
    p_idea_id:idea.id,p_expected_engine_revision:idea.engine_revision,p_limit:1
  });
  const source=arr(inventory?.sources)[0];
  if(!source)return {status:'NO_INGESTION_CANDIDATE',idea_id:idea.id,engine_revision:idea.engine_revision};

  const sourceId=text(source?.source_id,80);
  const sourceVersion=Number(source?.source_version||0);
  const locator=text(source?.locator,2048);
  const sensitivity=text(source?.sensitivity,20);
  if(!sourceId||sourceVersion<1||!locator)throw new G2SourceIngestionError('G2_SRC_CANDIDATE_INVALID');
  if(!['public','internal'].includes(sensitivity))throw new G2SourceIngestionError('G2_SRC_SENSITIVITY_NOT_ALLOWED');

  let fetched;
  try{fetched=await fetchSource(locator);}
  catch(error){
    if(error instanceof G2SourceFetchError)throw new G2SourceIngestionError(error.code,error.detail);
    throw new G2SourceIngestionError('SRC_FETCH_FAILED');
  }

  if(!fetched?.extracted_text||!fetched?.content_hash)throw new G2SourceIngestionError('SRC_FETCH_RESULT_INVALID');
  const committed=await rpc('commit_idea_source_snapshot_candidate_v2',{
    p_source_id:sourceId,
    p_expected_source_version:sourceVersion,
    p_extracted_text:fetched.extracted_text,
    p_content_hash:fetched.content_hash,
    p_content_type:fetched.content_type||null,
    p_storage_ref:null,
    p_fetched_at:fetched.fetched_at||new Date().toISOString(),
    p_freshness_at:null,
    p_sensitivity:sensitivity,
    p_extraction_metadata:{
      fetch_contract:'g2-src-url-fetch-v0.2',
      original_locator:locator,
      final_url:text(fetched.final_url,2048),
      redirect_count:Number(fetched.redirect_count||0),
      content_type:text(fetched.content_type,120)
    }
  });

  return {
    status:'INGESTED',idea_id:idea.id,source_id:sourceId,
    source_version:Number(committed?.source_version||sourceVersion),
    snapshot_id:text(committed?.snapshot_id,80),
    engine_revision:Number(committed?.engine_revision??idea.engine_revision),
    content_changed:Boolean(committed?.content_changed),
    snapshot_created:Boolean(committed?.snapshot_created),
    idempotent:Boolean(committed?.idempotent)
  };
}
