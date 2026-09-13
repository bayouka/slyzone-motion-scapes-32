import assert from 'node:assert/strict';
import {handleIdeaEngineCommand} from '../src/idea-engine-adapter.js';

const IDEA='11111111-1111-4111-8111-111111111111';
const USER='22222222-2222-4222-8222-222222222222';
const BASE_URL='https://example.supabase.co';

function projection(overrides={}){
  return {
    projection_version:'1.2',
    idea:{id:IDEA,title:'Cabinet conseil',current_description:'Créer un site vitrine pour présenter le cabinet, ses offres et un formulaire de contact.',engine_revision:0,blueprint_id:null,blueprint_status:null},
    lifecycle:{mode:'CAPTURED_UNCLASSIFIED'},
    capabilities:{can_read:true,can_write:true},
    signals:{blueprint_fit_needed:true,blueprint_fit_requires_human:false},
    blueprint_fit:{assessment:null,decision:null},
    ...overrides
  };
}

function response(data,status=200){return new Response(JSON.stringify(data),{status,headers:{'content-type':'application/json'}})}
function request(body,{auth=true}={}){
  return new Request('https://worker.example/api/ideas/engine',{
    method:'POST',
    headers:{'content-type':'application/json',...(auth?{authorization:'Bearer user-token'}:{})},
    body:JSON.stringify(body)
  });
}
async function payload(res){return {status:res.status,body:await res.json()}}

async function withMocks({initialProjection=projection(),classifier,serviceSecret='service-secret',recordError=null}={},fn){
  const originalFetch=globalThis.fetch;
  let current=structuredClone(initialProjection);
  const calls=[];
  globalThis.fetch=async(url,options={})=>{
    const u=String(url);calls.push({url:u,options});
    if(u===`${BASE_URL}/auth/v1/user`)return response({id:USER});
    if(u===`${BASE_URL}/rest/v1/rpc/get_idea_workspace_projection_v1`)return response(current);
    if(u===`${BASE_URL}/rest/v1/rpc/record_idea_blueprint_fit_assessment_v1`){
      if(recordError)return response({message:recordError},400);
      const body=JSON.parse(options.body||'{}');
      current.blueprint_fit.assessment={id:'33333333-3333-4333-8333-333333333333',classification:body.p_classification,candidate_type:body.p_candidate_type,confidence:body.p_confidence,rationale:body.p_rationale,auto_applicable:body.p_auto_applicable,state:'current'};
      current.signals.blueprint_fit_requires_human=body.p_confidence!=='HIGH'||!body.p_auto_applicable||body.p_classification==='AMBIGUOUS';
      return response({assessment_id:current.blueprint_fit.assessment.id,idempotent:false});
    }
    if(u===`${BASE_URL}/rest/v1/rpc/apply_assessed_blueprint_fit_v1`){
      current.lifecycle.mode=current.blueprint_fit.assessment.classification==='SITE_VITRINE'?'IDEA_ENGINE':'BLUEPRINT_MISMATCH';
      current.idea.blueprint_status=current.lifecycle.mode==='IDEA_ENGINE'?'active':'mismatch';
      current.idea.blueprint_id=current.lifecycle.mode==='IDEA_ENGINE'?'SITE_VITRINE':null;
      current.idea.engine_revision+=1;
      current.signals.blueprint_fit_needed=false;
      current.signals.blueprint_fit_requires_human=false;
      current.blueprint_fit.assessment.state='resolved';
      return response({decision:'SITE_VITRINE',idempotent:false});
    }
    throw new Error(`Unexpected fetch ${u}`);
  };
  const env={SUPABASE_URL:BASE_URL,SUPABASE_PUBLISHABLE_KEY:'publishable',SUPABASE_SERVICE_ROLE_KEY:serviceSecret,AI:{run:async()=>({response:classifier||{classification:'SITE_VITRINE',candidate_type:'site vitrine',confidence:'HIGH',rationale:'Le besoin est centré sur la présentation et le contact.',evidence:['présenter le cabinet','formulaire de contact'],auto_applicable:true}})}};
  try{return await fn({env,calls,getProjection:()=>current})}finally{globalThis.fetch=originalFetch}
}

{
  const res=await handleIdeaEngineCommand(request({command:'blueprint_fit.assess',idea_id:IDEA},{auth:false}),{});
  const out=await payload(res);assert.equal(out.status,401);assert.equal(out.body.error,'UNAUTHORIZED');
}

await withMocks({},async({env})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'blueprint_fit.assess',idea_id:IDEA,rpc:'record_idea_blueprint_fit_assessment_v1'}),env));
  assert.equal(out.status,400);assert.equal(out.body.error,'INVALID_REQUEST');
});

await withMocks({serviceSecret:''},async({env})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'blueprint_fit.assess',idea_id:IDEA}),env));
  assert.equal(out.status,503);assert.equal(out.body.error,'SERVER_PRIVILEGE_UNAVAILABLE');
});

await withMocks({initialProjection:projection({capabilities:{can_read:true,can_write:false}})},async({env,calls})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'blueprint_fit.assess',idea_id:IDEA}),env));
  assert.equal(out.status,403);assert.equal(out.body.error,'IDEA_WRITE_REQUIRED');
  assert.equal(calls.some(c=>c.url.includes('record_idea_blueprint_fit_assessment_v1')),false);
});

await withMocks({classifier:{classification:'AMBIGUOUS',candidate_type:'site ou portail client',confidence:'MEDIUM',rationale:'La description mentionne un espace client sans préciser son rôle.',evidence:['espace client'],auto_applicable:false}},async({env,calls})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'blueprint_fit.assess',idea_id:IDEA}),env));
  assert.equal(out.status,200);assert.equal(out.body.status,'HUMAN_CONFIRMATION_REQUIRED');assert.equal(out.body.auto_applied,false);
  assert.equal(calls.some(c=>c.url.includes('apply_assessed_blueprint_fit_v1')),false);
});

await withMocks({},async({env,calls})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'blueprint_fit.assess',idea_id:IDEA}),env));
  assert.equal(out.status,200);assert.equal(out.body.status,'READY');assert.equal(out.body.auto_applied,true);assert.equal(out.body.projection.lifecycle.mode,'IDEA_ENGINE');
  const serviceCalls=calls.filter(c=>c.url.includes('/rest/v1/rpc/record_idea_blueprint_fit_assessment_v1')||c.url.includes('/rest/v1/rpc/apply_assessed_blueprint_fit_v1'));
  assert.equal(serviceCalls.length,2);
  const serialized=JSON.stringify(out.body);assert.equal(serialized.includes('service-secret'),false);assert.equal(serialized.includes('user-token'),false);
});

await withMocks({recordError:'STALE_ENGINE'},async({env})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'blueprint_fit.assess',idea_id:IDEA}),env));
  assert.equal(out.status,409);assert.equal(out.body.error,'STALE_STATE');
});

await withMocks({initialProjection:projection({blueprint_fit:{assessment:{id:'33333333-3333-4333-8333-333333333333',classification:'AMBIGUOUS',candidate_type:'site ou SaaS',confidence:'MEDIUM',rationale:'Ambigu.',auto_applicable:false,state:'current'},decision:null},signals:{blueprint_fit_needed:true,blueprint_fit_requires_human:true}})},async({env,calls})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'blueprint_fit.assess',idea_id:IDEA}),env));
  assert.equal(out.status,200);assert.equal(out.body.reused,true);assert.equal(out.body.status,'HUMAN_CONFIRMATION_REQUIRED');
  assert.equal(calls.some(c=>c.url.includes('record_idea_blueprint_fit_assessment_v1')),false);
});

console.log('WORKSPACE_PRIVILEGED_ADAPTER_V0_1_REDTEAM_PASS');
