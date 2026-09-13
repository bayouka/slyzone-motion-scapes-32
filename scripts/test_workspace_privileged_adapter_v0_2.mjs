import assert from 'node:assert/strict';
import {handleIdeaEngineCommand} from '../src/idea-engine-adapter.js';

const IDEA='11111111-1111-4111-8111-111111111111';
const USER='22222222-2222-4222-8222-222222222222';
const RUN='33333333-3333-4333-8333-333333333333';
const RAW='44444444-4444-4444-8444-444444444444';
const BASE_URL='https://example.supabase.co';

function projection(overrides={}){
  return {
    projection_version:'1.2',
    idea:{id:IDEA,title:'Cabinet conseil',current_description:'Créer un site vitrine.',engine_revision:5,blueprint_id:'SITE_VITRINE',blueprint_status:'active'},
    lifecycle:{mode:'IDEA_ENGINE'},
    capabilities:{can_read:true,can_write:true},
    signals:{blueprint_fit_needed:false,blueprint_fit_requires_human:false},
    blueprint_fit:{assessment:null,decision:{decision:'SITE_VITRINE'}},
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

async function withMocks({initialProjection=projection(),plans=[],aiResponse,serviceSecret='sb_secret_test',rpcErrors={}}={},fn){
  const originalFetch=globalThis.fetch;
  let current=structuredClone(initialProjection);
  let planIndex=0;
  let aiCalls=0;
  const calls=[];
  const completed=[];
  globalThis.fetch=async(url,options={})=>{
    const u=String(url);calls.push({url:u,options});
    if(u===`${BASE_URL}/auth/v1/user`) return response({id:USER});
    if(u===`${BASE_URL}/rest/v1/rpc/get_idea_workspace_projection_v1`) return response(current);
    const rpc=u.split('/rest/v1/rpc/')[1]||'';
    if(rpcErrors[rpc]) return response({message:rpcErrors[rpc]},400);
    if(rpc==='plan_idea_foundation_v1') return response(plans[Math.min(planIndex++,plans.length-1)]||{});
    if(rpc==='get_idea_foundation_raw_input_v1') return response({idea_id:IDEA,engine_revision:current.idea.engine_revision,raw_source_id:RAW,original_text:'Nous sommes un cabinet de conseil. Nous voulons présenter notre cabinet aux PME.'});
    if(rpc==='create_action_run_v3') return response({action_run_id:RUN,status:'queued',engine_revision:current.idea.engine_revision,idempotent:false});
    if(rpc==='retry_action_run_v1') return response({action_run_id:RUN,status:'queued',idempotent:false});
    if(rpc==='start_action_run_v1') return response({action_run_id:RUN,status:'running',idempotent:false});
    if(rpc==='complete_action_run_v1'){
      const body=JSON.parse(options.body||'{}');completed.push(body);
      return response({action_run_id:RUN,status:'succeeded',promotable:true,idempotent:false});
    }
    if(rpc==='promote_action_result_v1'){
      current=structuredClone(current);current.idea.engine_revision+=1;
      return response({action_run_id:RUN,promoted:true,engine_revision:current.idea.engine_revision,idempotent:false});
    }
    if(rpc==='fail_action_run_v1') return response({action_run_id:RUN,status:'failed',idempotent:false});
    if(rpc==='mark_action_run_stale_v1') return response({action_run_id:RUN,status:'stale',idempotent:false});
    throw new Error(`Unexpected fetch ${u}`);
  };
  const env={
    SUPABASE_URL:BASE_URL,
    SUPABASE_PUBLISHABLE_KEY:'publishable',
    SUPABASE_SERVICE_ROLE_KEY:serviceSecret,
    AI:{run:async()=>{aiCalls+=1;return {response:aiResponse||{findings:[]}}}}
  };
  try{return await fn({env,calls,completed,getProjection:()=>current,getAiCalls:()=>aiCalls})}
  finally{globalThis.fetch=originalFetch}
}

const humanPlan={
  gate_id:'G1_FOUNDATION_LOCKABLE',gate_status:'NOT_READY',projection_fingerprint:'proj-human',foundation_conflict:false,
  missing_requirements:[{requirement_id:'SV.D02.PRIMARY_OBJECTIVE',status:'UNRESOLVED',criticality:'BLOCKING'}],
  eligible_system_actions:[],
  dominant_user_action:{type:'HUMAN',requirement_id:'SV.D02.PRIMARY_OBJECTIVE',title:'Objectif principal',purpose:'Donner un critère de jugement.',interaction:'LIGHT_REVIEW',why_now:'G1_FOUNDATION_LOCKABLE',what_it_unlocks:['SV.D06.RECOMMENDATION']}
};

const rawPlan={
  gate_id:'G1_FOUNDATION_LOCKABLE',gate_status:'NOT_READY',projection_fingerprint:'proj-raw',foundation_conflict:false,
  missing_requirements:[
    {requirement_id:'SV.D02.ORG_CONTEXT',status:'UNRESOLVED',criticality:'REQUIRED'},
    {requirement_id:'SV.D03.PRIMARY_AUDIENCE',status:'UNRESOLVED',criticality:'REQUIRED'}
  ],
  eligible_system_actions:[{
    action_type:'EXTRACT_RAW',acquisition_path:'RAW',requirement_ids:['SV.D02.ORG_CONTEXT','SV.D03.PRIMARY_AUDIENCE'],
    target_requirement_fingerprints:{'SV.D02.ORG_CONTEXT':'fp-org','SV.D03.PRIMARY_AUDIENCE':'fp-audience'},input_fingerprint:'input-raw'
  }],dominant_user_action:null
};
const readyPlan={gate_id:'G1_FOUNDATION_LOCKABLE',gate_status:'READY',projection_fingerprint:'proj-ready',foundation_conflict:false,missing_requirements:[],eligible_system_actions:[],dominant_user_action:null};

{
  const res=await handleIdeaEngineCommand(request({command:'foundation.advance',idea_id:IDEA},{auth:false}),{});
  const out=await payload(res);assert.equal(out.status,401);assert.equal(out.body.error,'UNAUTHORIZED');
}

await withMocks({plans:[humanPlan]},async({env,getAiCalls,calls})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'foundation.advance',idea_id:IDEA}),env));
  assert.equal(out.status,200);assert.equal(out.body.status,'HUMAN_INPUT_REQUIRED');
  assert.equal(out.body.plan.dominant_user_action.requirement_id,'SV.D02.PRIMARY_OBJECTIVE');
  assert.match(out.body.plan.dominant_user_action.prompt,/résultat principal/i);
  assert.equal(getAiCalls(),0);
  assert.equal(calls.some(c=>c.url.includes('create_action_run_v3')),false);
});

await withMocks({plans:[rawPlan,readyPlan],aiResponse:{findings:[
  {requirement_id:'SV.D02.ORG_CONTEXT',value:'Cabinet de conseil',support_text:'cabinet de conseil',direct:true},
  {requirement_id:'SV.D03.PRIMARY_AUDIENCE',value:'PME',support_text:'aux PME',direct:true}
]}},async({env,calls,completed,getAiCalls})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'foundation.advance',idea_id:IDEA}),env));
  assert.equal(out.status,200);assert.equal(out.body.status,'FOUNDATION_READY');assert.equal(out.body.execution.promotions,1);
  assert.deepEqual(new Set(out.body.execution.accepted_requirement_ids),new Set(['SV.D02.ORG_CONTEXT','SV.D03.PRIMARY_AUDIENCE']));
  assert.equal(getAiCalls(),1);
  assert.equal(completed.length,1);assert.equal(completed[0].p_proposed_mutations.length,2);
  for(const mutation of completed[0].p_proposed_mutations){
    assert.equal(mutation.provenance_type,'SOURCE_EXTRACTED');
    assert.deepEqual(mutation.resolution_levels,['RAW_HUMAN','ACCEPTED_AS_CURRENT']);
    assert.equal(mutation.source_id,RAW);
  }
  const serviceCalls=calls.filter(c=>c.url.includes('/rest/v1/rpc/')&&!c.url.includes('get_idea_workspace_projection_v1'));
  assert(serviceCalls.length>0);
  for(const call of serviceCalls){
    assert.equal(call.options.headers.apikey,'sb_secret_test');
    assert.equal('Authorization' in call.options.headers,false);
  }
  const serialized=JSON.stringify(out.body);assert.equal(serialized.includes('sb_secret_test'),false);assert.equal(serialized.includes('user-token'),false);
});

await withMocks({plans:[rawPlan,humanPlan],aiResponse:{findings:[
  {requirement_id:'SV.D02.ORG_CONTEXT',value:'Cabinet de conseil',support_text:'texte inventé absent de la source',direct:true}
]}},async({env,calls,completed})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'foundation.advance',idea_id:IDEA}),env));
  assert.equal(out.status,200);assert.equal(out.body.status,'HUMAN_INPUT_REQUIRED');
  assert.equal(out.body.execution.promotions,0);assert.deepEqual(out.body.execution.accepted_requirement_ids,[]);
  assert.equal(completed[0].p_proposed_mutations.length,0);
  assert.equal(calls.some(c=>c.url.includes('promote_action_result_v1')),false);
});

await withMocks({initialProjection:projection({lifecycle:{mode:'CAPTURED_UNCLASSIFIED'}}),plans:[humanPlan]},async({env})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'foundation.advance',idea_id:IDEA}),env));
  assert.equal(out.status,409);assert.equal(out.body.error,'FOUNDATION_NOT_AVAILABLE');
});

await withMocks({plans:[humanPlan]},async({env})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'foundation.advance',idea_id:IDEA,rpc:'plan_idea_foundation_v1'}),env));
  assert.equal(out.status,400);assert.equal(out.body.error,'INVALID_REQUEST');
});

await withMocks({plans:[rawPlan],rpcErrors:{create_action_run_v3:'STALE_REQUIREMENT_FINGERPRINT'}},async({env})=>{
  const out=await payload(await handleIdeaEngineCommand(request({command:'foundation.advance',idea_id:IDEA}),env));
  assert.equal(out.status,409);assert.equal(out.body.error,'STALE_STATE');
});

console.log('WORKSPACE_PRIVILEGED_ADAPTER_V0_2_REDTEAM_PASS');
