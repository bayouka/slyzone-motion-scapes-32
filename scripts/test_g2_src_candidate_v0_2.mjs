import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import {
  G2SourceFetchError,
  validatePublicSourceUrl,
  assertPublicResolvedAddresses,
  canonicalizeSourceText,
  fetchCanonicalPublicSource
} from '../src/idea-source-fetch-candidate.js';
import { ingestOneRegisteredUrlSourceCandidate } from '../src/idea-source-ingestion-candidate.js';
import { advanceEvidenceCandidate } from '../src/idea-evidence-adapter-candidate.js';

function rejectsCode(fn,code){
  assert.throws(fn,error=>error instanceof G2SourceFetchError&&error.code===code);
}

assert.equal(validatePublicSourceUrl('https://example.com/a#frag').href,'https://example.com/a');
assert.equal(validatePublicSourceUrl('https://example.com./a').hostname,'example.com');
rejectsCode(()=>validatePublicSourceUrl('http://example.com'),'SRC_HTTPS_REQUIRED');
rejectsCode(()=>validatePublicSourceUrl('https://u:p@example.com'),'SRC_URL_CREDENTIALS_FORBIDDEN');
rejectsCode(()=>validatePublicSourceUrl('https://example.com:444'),'SRC_PORT_FORBIDDEN');
rejectsCode(()=>validatePublicSourceUrl('https://localhost./x'),'SRC_PRIVATE_HOST_FORBIDDEN');
rejectsCode(()=>validatePublicSourceUrl('https://foo.local./x'),'SRC_PRIVATE_HOST_FORBIDDEN');
rejectsCode(()=>validatePublicSourceUrl('https://127.0.0.1/x'),'SRC_PRIVATE_IP_FORBIDDEN');
rejectsCode(()=>validatePublicSourceUrl('https://10.0.0.1/x'),'SRC_PRIVATE_IP_FORBIDDEN');
rejectsCode(()=>validatePublicSourceUrl('https://169.254.169.254/latest/meta-data'),'SRC_PRIVATE_IP_FORBIDDEN');
rejectsCode(()=>validatePublicSourceUrl('https://[::1]/x'),'SRC_PRIVATE_IP_FORBIDDEN');
rejectsCode(()=>validatePublicSourceUrl('https://[fd00::1]/x'),'SRC_PRIVATE_IP_FORBIDDEN');
assert.equal(assertPublicResolvedAddresses(['93.184.216.34']),true);
rejectsCode(()=>assertPublicResolvedAddresses(['192.168.1.2']),'SRC_DNS_PRIVATE_ADDRESS');
rejectsCode(()=>assertPublicResolvedAddresses(['127.0.0.1','93.184.216.34']),'SRC_DNS_PRIVATE_ADDRESS');

const html='<html><head><style>.x{display:none}</style><script>SECRET()</script></head><body><h1>Besoin &amp; marché</h1><p>Les artisans veulent un devis clair.</p></body></html>';
const canonical=canonicalizeSourceText(html,'text/html');
assert.match(canonical,/Besoin & marché/);
assert.match(canonical,/Les artisans veulent un devis clair\./);
assert.doesNotMatch(canonical,/SECRET|display:none/);

const publicResolver=async()=>['93.184.216.34'];
const okFetch=async()=>new Response(html,{status:200,headers:{'content-type':'text/html; charset=utf-8'}});
const fetched=await fetchCanonicalPublicSource('https://example.com/research',{fetchImpl:okFetch,resolveAddresses:publicResolver});
assert.equal(fetched.final_url,'https://example.com/research');
assert.equal(fetched.content_type,'text/html');
assert.match(fetched.content_hash,/^[0-9a-f]{64}$/);
assert.equal(fetched.extracted_text,canonical);

let redirectCalls=0;
const redirectFetch=async()=>{
  redirectCalls++;
  return new Response(null,{status:302,headers:{location:'https://127.0.0.1/private'}});
};
await assert.rejects(
  ()=>fetchCanonicalPublicSource('https://example.com/start',{fetchImpl:redirectFetch,resolveAddresses:publicResolver}),
  error=>error instanceof G2SourceFetchError&&error.code==='SRC_PRIVATE_IP_FORBIDDEN'
);
assert.equal(redirectCalls,1);

await assert.rejects(
  ()=>fetchCanonicalPublicSource('https://example.com/file',{fetchImpl:async()=>new Response('binary',{status:200,headers:{'content-type':'application/octet-stream'}}),resolveAddresses:publicResolver}),
  error=>error instanceof G2SourceFetchError&&error.code==='SRC_CONTENT_TYPE_UNSUPPORTED'
);

await assert.rejects(
  ()=>fetchCanonicalPublicSource('https://example.com/huge',{fetchImpl:async()=>new Response('x'.repeat(1024*1024+1),{status:200,headers:{'content-type':'text/plain'}}),resolveAddresses:publicResolver}),
  error=>error instanceof G2SourceFetchError&&error.code==='SRC_BODY_TOO_LARGE'
);

const ingestIdea={id:'00000000-0000-4000-8000-000000000001',engine_revision:12,blueprint_id:'SITE_VITRINE',blueprint_version:'0.5',blueprint_status:'active'};
const ingestCalls=[];
const ingestRpc=async(name,args)=>{
  ingestCalls.push({name,args});
  if(name==='list_g2_src_ingestion_candidates_candidate_v2')return {sources:[{source_id:'00000000-0000-4000-8000-000000000010',source_version:1,locator:'https://example.com/research',sensitivity:'internal'}]};
  if(name==='commit_idea_source_snapshot_candidate_v2')return {source_id:args.p_source_id,snapshot_id:'00000000-0000-4000-8000-000000000011',source_version:1,engine_revision:13,content_changed:true,snapshot_created:true,idempotent:false};
  throw new Error(`unexpected ingestion rpc ${name}`);
};
const ingestOut=await ingestOneRegisteredUrlSourceCandidate({
  idea:ingestIdea,rpc:ingestRpc,
  fetchSource:async()=>({final_url:'https://www.example.com/research',content_type:'text/plain',extracted_text:'Les artisans veulent un devis clair.',content_hash:'a'.repeat(64),fetched_at:'2026-09-15T15:00:00.000Z',redirect_count:1})
});
assert.equal(ingestOut.status,'INGESTED');
assert.equal(ingestOut.engine_revision,13);
const commitCall=ingestCalls.find(x=>x.name==='commit_idea_source_snapshot_candidate_v2');
assert.equal(commitCall.args.p_expected_source_version,1);
assert.equal(commitCall.args.p_sensitivity,'internal');
assert.equal(commitCall.args.p_extraction_metadata.fetch_contract,'g2-src-url-fetch-v0.2');
assert.equal(commitCall.args.p_extraction_metadata.redirect_count,1);

const idea={id:'00000000-0000-4000-8000-000000000101',engine_revision:7,blueprint_id:'SITE_VITRINE',blueprint_version:'0.5',blueprint_status:'active'};
const snapshotId='00000000-0000-4000-8000-000000000102';
const sourceId='00000000-0000-4000-8000-000000000103';
const srcPlan={gate_id:'G2',gate_status:'NOT_READY',missing_requirements:[],eligible_system_actions:[{path_role:'GATE_SATISFYING',action_type:'EXTRACT_SOURCE',acquisition_path:'SRC',requirement_id:'SV.D03.PRIMARY_NEED',target_fingerprint:'need-fp',target_artifact_keys:[]}],supportive_capabilities:[],inflight_requirements:[],recoverable_action_runs:[],recovery_blocked_action_runs:[],capability_blocked_requirements:[],dominant_user_action:null,projection_fingerprint:'proj-fp'};
const emptyPlan={...srcPlan,gate_status:'READY',eligible_system_actions:[],projection_fingerprint:'proj-after'};
let planCalls=0,completed=null,promoted=0,finalized=0;
const srcRpc=async(name,args)=>{
  if(name==='plan_idea_evidence_context_candidate_v11'){
    assert.deepEqual(args.p_available_paths,['CALC','SRC']);
    return planCalls++===0?srcPlan:emptyPlan;
  }
  if(name==='list_g2_src_snapshot_candidates_candidate_v2')return {snapshots:[{snapshot_id:snapshotId,source_id:sourceId,source_version:1,content_hash:'b'.repeat(64)}]};
  if(name==='create_g2_src_action_run_candidate_v2'){
    assert.deepEqual(args.p_snapshot_ids,[snapshotId]);
    return {action_run_id:'00000000-0000-4000-8000-000000000104',status:'queued',input_fingerprint:'src-input-fp',input_refs:{source_snapshots:[{snapshot_id:snapshotId,source_id:sourceId,source_version:1,content_hash:'b'.repeat(64)}]}};
  }
  if(name==='start_g2_action_run_candidate_v2')return {status:'running',attempt:1};
  if(name==='get_g2_src_action_input_candidate_v2')return {action_run:{target_requirement_ids:['SV.D03.PRIMARY_NEED']},source_snapshots:[{snapshot_id:snapshotId,source_id:sourceId,source_version:1,content_hash:'b'.repeat(64),locator:'https://example.com/research',title:'Research',sensitivity:'internal',extracted_text:'Une étude qualitative indique que les artisans veulent recevoir un devis clair rapidement.',content_truncated:false}]};
  if(name==='complete_g2_action_run_candidate_v2'){completed=args;return {status:'succeeded',promotable:true};}
  if(name==='promote_g2_src_action_result_candidate_v1'){promoted++;return {status:'promoted',promoted:true};}
  if(name==='finalize_g2_action_no_resolution_candidate_v1'){finalized++;return {status:'no_resolution'};}
  throw new Error(`unexpected SRC rpc ${name}`);
};
const ai={run:async()=>({response:{finding:{requirement_id:'SV.D03.PRIMARY_NEED',snapshot_id:snapshotId,value:'Recevoir un devis clair rapidement.',support_text:'les artisans veulent recevoir un devis clair rapidement.',direct:true}}})};
const refreshed=async()=>({idea:{...idea,engine_revision:8},capabilities:{can_write:true}});
const srcOut=await advanceEvidenceCandidate({env:{AI:ai,G2_SRC:true},idea,canWrite:true,rpc:srcRpc,refreshProjection:refreshed});
assert.equal(srcOut.executed_actions,1);
assert.equal(promoted,1);
assert.equal(finalized,0);
const mutation=completed.p_proposed_mutations[0];
assert.equal(mutation.semantic_key,'primary_need_source');
assert.equal(mutation.provenance_type,'SOURCE_EXTRACTED');
assert.equal(mutation.source_id,sourceId);
assert.equal(mutation.confidence_class,'DIRECT');
assert.equal(mutation.sensitivity,'internal');
assert.deepEqual(mutation.resolution_levels,['SOURCE_BACKED']);

let badCompleted=null,badPromoted=0,badFinalized=0,badPlanCalls=0;
const badRpc=async(name,args)=>{
  if(name==='plan_idea_evidence_context_candidate_v11')return badPlanCalls++===0?srcPlan:emptyPlan;
  if(name==='list_g2_src_snapshot_candidates_candidate_v2')return {snapshots:[{snapshot_id:snapshotId,source_id:sourceId,source_version:1,content_hash:'b'.repeat(64)}]};
  if(name==='create_g2_src_action_run_candidate_v2')return {action_run_id:'00000000-0000-4000-8000-000000000105',status:'queued',input_fingerprint:'bad-src-fp'};
  if(name==='start_g2_action_run_candidate_v2')return {status:'running',attempt:1};
  if(name==='get_g2_src_action_input_candidate_v2')return {action_run:{target_requirement_ids:['SV.D03.PRIMARY_NEED']},source_snapshots:[{snapshot_id:snapshotId,source_id:sourceId,sensitivity:'internal',extracted_text:'Texte réel sans la citation inventée.',content_truncated:false}]};
  if(name==='complete_g2_action_run_candidate_v2'){badCompleted=args;return {status:'succeeded'};}
  if(name==='finalize_g2_action_no_resolution_candidate_v1'){badFinalized++;return {status:'no_resolution'};}
  if(name==='promote_g2_src_action_result_candidate_v1'){badPromoted++;return {status:'promoted'};}
  throw new Error(`unexpected bad SRC rpc ${name}`);
};
const badAI={run:async()=>({response:{finding:{requirement_id:'SV.D03.PRIMARY_NEED',snapshot_id:snapshotId,value:'Besoin inventé.',support_text:'citation inventée absente',direct:true}}})};
await advanceEvidenceCandidate({env:{AI:badAI,G2_SRC:true},idea,canWrite:true,rpc:badRpc,refreshProjection:async()=>({idea,capabilities:{can_write:true}})});
assert.equal(badPromoted,0);
assert.equal(badFinalized,1);
assert.deepEqual(badCompleted.p_proposed_mutations,[]);
assert.equal(badCompleted.p_result.terminal_reason,'NO_SUPPORTED_FINDING');

const endpoint=await fs.readFile(new URL('../src/idea-evidence-endpoint.js',import.meta.url),'utf8');
assert.match(endpoint,/Production stays CALC \+ RAW/);
assert.match(endpoint,/path==='SRC'[\s\S]*promote_g2_src_action_result_candidate_v1/);
assert.doesNotMatch(endpoint,/G2_SRC:Boolean\(env\?\.AI\)|G2_SRC:true/);
const workerEntry=await fs.readFile(new URL('../src/worker-entry.js',import.meta.url),'utf8');
assert.match(workerEntry,/g2_ai_h_active:false/);
assert.match(workerEntry,/return env\?\.AI\?\['CALC','RAW'\]:\['CALC'\]/);

console.log('G2 SRC V0.2 dormant fetch, ingestion, extraction and dedicated-promotion candidate tests PASS');
