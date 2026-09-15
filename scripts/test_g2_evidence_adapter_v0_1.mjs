import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { advanceEvidenceCandidate, G2CandidateError } from '../src/idea-evidence-adapter-candidate.js';

const idea={id:'00000000-0000-0000-0000-000000000001',engine_revision:7,blueprint_id:'SITE_VITRINE',blueprint_version:'0.5',blueprint_status:'active'};
const rawSourceId='00000000-0000-4000-8000-000000000099';

function emptyPlan(fp='fp'){return {gate_id:'G2',gate_status:'IN_PROGRESS',missing_requirements:[],eligible_system_actions:[],supportive_capabilities:[],inflight_requirements:[],recoverable_action_runs:[],recovery_blocked_action_runs:[],capability_blocked_requirements:[],dominant_user_action:null,projection_fingerprint:fp};}
function rawPlan(){return {...emptyPlan('raw-plan-fp'),eligible_system_actions:[{path_role:'GATE_SATISFYING',action_type:'EXTRACT_RAW',acquisition_path:'RAW',requirement_id:'SV.D03.PRIMARY_NEED',target_fingerprint:'need-basis',target_artifact_keys:[]}]};}

let plannerArgs=null;
const rpc=async(name,args)=>{
  if(name==='plan_idea_evidence_context_candidate_v11'){plannerArgs=args;return emptyPlan();}
  throw new Error(`unexpected rpc ${name}`);
};
const refreshProjection=async()=>({idea,capabilities:{can_write:true}});

const calcOnly=await advanceEvidenceCandidate({env:{},idea,canWrite:true,rpc,refreshProjection});
assert.deepEqual(plannerArgs.p_available_paths,['CALC']);
assert.equal(plannerArgs.p_raw_context_available,false);
assert.equal(calcOnly.executed_actions,0);

plannerArgs=null;
const pathProbe=await advanceEvidenceCandidate({env:{AI:{run:async()=>({})},G2_RAW:true},idea,canWrite:true,rpc,refreshProjection});
assert.deepEqual(plannerArgs.p_available_paths,['CALC','RAW']);
assert.equal(plannerArgs.p_raw_context_available,true);
assert.deepEqual(pathProbe.available_paths,['CALC','RAW']);

plannerArgs=null;
await advanceEvidenceCandidate({env:{AI:{run:async()=>({})},G2_SRC:true,G2_AI_H:true,G2_AI_R:true,G2_WEB:true,TAVILY_API_KEY:'x'},idea,canWrite:true,rpc,refreshProjection});
assert.deepEqual(plannerArgs.p_available_paths,['CALC']);

await assert.rejects(
  ()=>advanceEvidenceCandidate({env:{},idea,canWrite:false,rpc,refreshProjection}),
  e=>e instanceof G2CandidateError&&e.status===403&&e.code==='IDEA_WRITE_REQUIRED'
);
await assert.rejects(
  ()=>advanceEvidenceCandidate({env:{},idea:{...idea,blueprint_version:'0.4'},canWrite:true,rpc,refreshProjection}),
  e=>e instanceof G2CandidateError&&e.status===409&&e.code==='G2_BLUEPRINT_0_5_NOT_ACTIVE'
);

async function runRawScenario({aiFinding,expectPromotion,expectedReason}){
  let planCalls=0,completion=null,promotionCalls=0,finalization=null;
  const scenarioRpc=async(name,args)=>{
    if(name==='plan_idea_evidence_context_candidate_v11')return planCalls++===0?rawPlan():emptyPlan('after-raw');
    if(name==='create_g2_system_action_run_candidate_v1'){
      assert.equal(args.p_acquisition_path,'RAW');
      assert.equal(args.p_provider,'cloudflare-workers-ai');
      assert.equal(args.p_model,'@cf/google/gemma-4-26b-a4b-it');
      assert.equal(args.p_prompt_version,'g2-raw-v1');
      assert.deepEqual(args.p_target_requirement_ids,['SV.D03.PRIMARY_NEED']);
      return {action_run_id:'00000000-0000-4000-8000-000000000010',status:'queued',idempotent:false};
    }
    if(name==='start_g2_action_run_candidate_v2')return {status:'running',attempt:1};
    if(name==='get_g2_action_input_candidate_v2')return {
      idea,
      action_run:{target_requirement_ids:['SV.D03.PRIMARY_NEED']},
      context_requirement_states:[],current_sources:[],
      raw_input:{source_id:rawSourceId,source_version:1,content_hash:'raw-hash',original_text:'Nous créons ce site pour des artisans. Ils veulent trouver rapidement un devis clair et contacter un professionnel sans perdre de temps.'}
    };
    if(name==='complete_g2_action_run_candidate_v2'){completion=args;return {status:'succeeded',promotable:true};}
    if(name==='promote_g2_system_action_result_candidate_v1'){promotionCalls++;return {status:'promoted',promoted:true};}
    if(name==='finalize_g2_action_no_resolution_candidate_v1'){finalization=args;return {status:'no_resolution',finalized:true};}
    throw new Error(`unexpected scenario rpc ${name}`);
  };
  const fakeAI={run:async(_model,request)=>{
    assert.match(request.messages[0].content,/N'invente rien/);
    assert.match(request.messages[0].content,/SV\.D03\.PRIMARY_NEED/);
    return {response:{finding:aiFinding}};
  }};
  let refreshed=false;
  const scenarioRefresh=async()=>{refreshed=true;return {idea:{...idea,engine_revision:expectPromotion?8:7},capabilities:{can_write:true}};};
  const out=await advanceEvidenceCandidate({env:{AI:fakeAI,G2_RAW:true},idea,canWrite:true,rpc:scenarioRpc,refreshProjection:scenarioRefresh});
  assert.equal(refreshed,true);
  assert.equal(out.executed_actions,1);
  if(expectPromotion){
    assert.equal(promotionCalls,1);
    assert.equal(finalization,null);
    assert.equal(completion.p_proposed_mutations.length,1);
    const mutation=completion.p_proposed_mutations[0];
    assert.equal(mutation.kind,'INFORMATION_ITEM');
    assert.equal(mutation.semantic_key,'primary_need');
    assert.equal(mutation.item_type,'DECISION_INPUT');
    assert.equal(mutation.provenance_type,'SOURCE_EXTRACTED');
    assert.equal(mutation.source_id,rawSourceId);
    assert.equal(mutation.confidence_class,'DIRECT');
    assert.equal(mutation.target_requirement_id,'SV.D03.PRIMARY_NEED');
    assert.deepEqual(mutation.resolution_levels,['RAW_HUMAN','ACCEPTED_AS_CURRENT']);
  }else{
    assert.equal(promotionCalls,0);
    assert.ok(finalization);
    assert.equal(finalization.p_terminal_reason,expectedReason);
    assert.deepEqual(completion.p_proposed_mutations,[]);
  }
}

await runRawScenario({
  aiFinding:{requirement_id:'SV.D03.PRIMARY_NEED',value:'Trouver rapidement un devis clair et contacter un professionnel.',support_text:'Ils veulent trouver rapidement un devis clair et contacter un professionnel sans perdre de temps.',direct:true},
  expectPromotion:true
});

await runRawScenario({
  aiFinding:{requirement_id:'SV.D03.PRIMARY_NEED',value:'Comparer les prix de tous les concurrents.',support_text:'Ils veulent comparer les prix de tous les concurrents.',direct:true},
  expectPromotion:false,expectedReason:'NO_SUPPORTED_FINDING'
});

const endpoint=await fs.readFile(new URL('../src/idea-evidence-endpoint.js',import.meta.url),'utf8');
assert.match(endpoint,/G2_RAW:Boolean\(env\?\.AI\)/);
assert.match(endpoint,/return env\?\.AI\?\['CALC','RAW'\]:\['CALC'\]/);
assert.match(endpoint,/classify_g2_action_promotion_candidate_v1/);
assert.match(endpoint,/finalize_g2_action_no_resolution_candidate_v1/);
assert.match(endpoint,/promote_g2_system_action_result_candidate_v1/);
assert.match(endpoint,/if\(!projection\.capabilities\?\.can_write\)throw new G2CandidateError\(403,'IDEA_WRITE_REQUIRED'\)/);

const adapter=await fs.readFile(new URL('../src/idea-evidence-adapter-candidate.js',import.meta.url),'utf8');
assert.match(adapter,/evidence-adapter-0\.2\.0/);
assert.match(adapter,/G2_RAW_TARGETS/);
assert.match(adapter,/SOURCE_EXTRACTED/);
assert.match(adapter,/RAW_HUMAN/);
assert.match(adapter,/NO_SUPPORTED_FINDING/);
assert.doesNotMatch(adapter,/if\(env\.AI\)paths\.push\('RAW','SRC','AI_H','AI_R'\)/);

const ui=await fs.readFile(new URL('../site/assets/ideas-workspace-g2-live.js',import.meta.url),'utf8');
assert.match(ui,/VERSION='1\.1\.0'/);
assert.match(ui,/Preuves & marché/);
assert.match(ui,/Approfondir les preuves/);
assert.match(ui,/sans transformer les inconnues en certitudes/);
assert.doesNotMatch(ui,/G2 actif|G2 prêt à être testé|Analyse G2 en cours/);
assert.doesNotMatch(ui,/SUPABASE_SERVICE_ROLE_KEY/);

console.log('G2 CALC+RAW executor, provenance and Evidence Market UX guard tests PASS');
