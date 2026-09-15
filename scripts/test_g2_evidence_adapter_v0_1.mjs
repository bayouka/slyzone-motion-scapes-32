import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { advanceEvidenceCandidate, G2CandidateError } from '../src/idea-evidence-adapter-candidate.js';

const idea={id:'00000000-0000-0000-0000-000000000001',engine_revision:7,blueprint_id:'SITE_VITRINE',blueprint_version:'0.5',blueprint_status:'active'};
const rawSourceId='00000000-0000-4000-8000-000000000099';
function emptyPlan(fp='fp'){return {gate_id:'G2',gate_status:'IN_PROGRESS',missing_requirements:[],eligible_system_actions:[],supportive_capabilities:[],inflight_requirements:[],recoverable_action_runs:[],recovery_blocked_action_runs:[],capability_blocked_requirements:[],dominant_user_action:null,projection_fingerprint:fp};}
function rawPlan(){return {...emptyPlan('raw-plan-fp'),eligible_system_actions:[{path_role:'GATE_SATISFYING',action_type:'EXTRACT_RAW',acquisition_path:'RAW',requirement_id:'SV.D03.PRIMARY_NEED',target_fingerprint:'need-basis',target_artifact_keys:[]}]};}
function aiHPlan(){return {...emptyPlan('aih-plan-fp'),eligible_system_actions:[{path_role:'GATE_SATISFYING',action_type:'INFER_HYPOTHESIS',acquisition_path:'AI_H',requirement_id:'SV.D03.PRIMARY_NEED',target_fingerprint:'need-basis',target_artifact_keys:[]}]};}

let plannerArgs=null;
const rpc=async(name,args)=>{if(name==='plan_idea_evidence_context_candidate_v11'){plannerArgs=args;return emptyPlan();}throw new Error(`unexpected rpc ${name}`);};
const refreshProjection=async()=>({idea,capabilities:{can_write:true}});
const calcOnly=await advanceEvidenceCandidate({env:{},idea,canWrite:true,rpc,refreshProjection});
assert.deepEqual(plannerArgs.p_available_paths,['CALC']);assert.equal(plannerArgs.p_raw_context_available,false);assert.equal(calcOnly.executed_actions,0);
plannerArgs=null;
const rawProbe=await advanceEvidenceCandidate({env:{AI:{run:async()=>({})},G2_RAW:true},idea,canWrite:true,rpc,refreshProjection});
assert.deepEqual(plannerArgs.p_available_paths,['CALC','RAW']);assert.deepEqual(rawProbe.available_paths,['CALC','RAW']);
await assert.rejects(()=>advanceEvidenceCandidate({env:{},idea,canWrite:false,rpc,refreshProjection}),e=>e instanceof G2CandidateError&&e.status===403&&e.code==='IDEA_WRITE_REQUIRED');
await assert.rejects(()=>advanceEvidenceCandidate({env:{},idea:{...idea,blueprint_version:'0.4'},canWrite:true,rpc,refreshProjection}),e=>e instanceof G2CandidateError&&e.status===409&&e.code==='G2_BLUEPRINT_0_5_NOT_ACTIVE');

async function runRawScenario({aiFinding,expectPromotion,expectedReason}){
  let planCalls=0,completion=null,promotionCalls=0,finalization=null;
  const scenarioRpc=async(name,args)=>{
    if(name==='plan_idea_evidence_context_candidate_v11')return planCalls++===0?rawPlan():emptyPlan('after-raw');
    if(name==='create_g2_system_action_run_candidate_v1')return {action_run_id:'00000000-0000-4000-8000-000000000010',status:'queued',idempotent:false};
    if(name==='start_g2_action_run_candidate_v2')return {status:'running',attempt:1};
    if(name==='get_g2_action_input_candidate_v2')return {idea,action_run:{target_requirement_ids:['SV.D03.PRIMARY_NEED']},context_requirement_states:[],current_information_items:[],current_sources:[],raw_input:{source_id:rawSourceId,source_version:1,content_hash:'raw-hash',original_text:'Nous créons ce site pour des artisans. Ils veulent trouver rapidement un devis clair et contacter un professionnel sans perdre de temps.'}};
    if(name==='complete_g2_action_run_candidate_v2'){completion=args;return {status:'succeeded',promotable:true};}
    if(name==='promote_g2_system_action_result_candidate_v1'){promotionCalls++;return {status:'promoted',promoted:true};}
    if(name==='finalize_g2_action_no_resolution_candidate_v1'){finalization=args;return {status:'no_resolution',finalized:true};}
    throw new Error(`unexpected RAW rpc ${name}`);
  };
  const fakeAI={run:async()=>({response:{finding:aiFinding}})};
  const scenarioRefresh=async()=>({idea:{...idea,engine_revision:expectPromotion?8:7},capabilities:{can_write:true}});
  const out=await advanceEvidenceCandidate({env:{AI:fakeAI,G2_RAW:true},idea,canWrite:true,rpc:scenarioRpc,refreshProjection:scenarioRefresh});
  assert.equal(out.executed_actions,1);
  if(expectPromotion){const mutation=completion.p_proposed_mutations[0];assert.equal(promotionCalls,1);assert.equal(finalization,null);assert.equal(mutation.provenance_type,'SOURCE_EXTRACTED');assert.equal(mutation.source_id,rawSourceId);assert.deepEqual(mutation.resolution_levels,['RAW_HUMAN','ACCEPTED_AS_CURRENT']);}
  else{assert.equal(promotionCalls,0);assert.equal(finalization.p_terminal_reason,expectedReason);assert.deepEqual(completion.p_proposed_mutations,[]);}
}
await runRawScenario({aiFinding:{requirement_id:'SV.D03.PRIMARY_NEED',value:'Trouver rapidement un devis clair et contacter un professionnel.',support_text:'Ils veulent trouver rapidement un devis clair et contacter un professionnel sans perdre de temps.',direct:true},expectPromotion:true});
await runRawScenario({aiFinding:{requirement_id:'SV.D03.PRIMARY_NEED',value:'Comparer tous les concurrents.',support_text:'Ils veulent comparer tous les concurrents.',direct:true},expectPromotion:false,expectedReason:'NO_SUPPORTED_FINDING'});

// AI_H V0.1 is tested internally as an implementation candidate only.
async function runAIHCandidate(){
  let planCalls=0,completion=null,promotionCalls=0;
  const audienceId='00000000-0000-4000-8000-000000000021',objectiveId='00000000-0000-4000-8000-000000000022',secretId='00000000-0000-4000-8000-000000000023';
  const candidateRpc=async(name,args)=>{
    if(name==='plan_idea_evidence_context_candidate_v11')return planCalls++===0?aiHPlan():emptyPlan('after-aih');
    if(name==='create_g2_system_action_run_candidate_v1'){assert.equal(args.p_action_type,'INFER_HYPOTHESIS');assert.equal(args.p_acquisition_path,'AI_H');assert.equal(args.p_prompt_version,'g2-ai-h-v1');return {action_run_id:'00000000-0000-4000-8000-000000000030',status:'queued'};}
    if(name==='start_g2_action_run_candidate_v2')return {status:'running',attempt:1};
    if(name==='get_g2_action_input_candidate_v2')return {idea,action_run:{target_requirement_ids:['SV.D03.PRIMARY_NEED']},context_requirement_states:[{requirement_id:'SV.D03.PRIMARY_AUDIENCE',applicability_state:'ACTIVE',resolution_refs:[{information_item_id:audienceId}]},{requirement_id:'SV.D02.PRIMARY_OBJECTIVE',applicability_state:'ACTIVE',resolution_refs:[{information_item_id:objectiveId}]},{requirement_id:'SV.D02.HARD_CONSTRAINTS',applicability_state:'ACTIVE',resolution_refs:[{information_item_id:secretId}]}],current_information_items:[{id:audienceId,semantic_key:'primary_audience',item_type:'DECISION_INPUT',value:{value:'artisans indépendants'},provenance_type:'HUMAN_DECLARED',confidence_class:'DIRECT',sensitivity:'internal',state:'ACTIVE'},{id:objectiveId,semantic_key:'primary_objective',item_type:'DECISION_INPUT',value:{value:'obtenir davantage de demandes de devis qualifiées'},provenance_type:'HUMAN_GUIDED_ANSWER',confidence_class:'DIRECT',sensitivity:'internal',state:'ACTIVE'},{id:secretId,semantic_key:'secret_budget',item_type:'CONSTRAINT',value:{value:'SECRET_NE_DOIT_PAS_SORTIR'},provenance_type:'HUMAN_DECLARED',confidence_class:'DIRECT',sensitivity:'sensitive',state:'ACTIVE'}],current_sources:[],raw_input:null};
    if(name==='complete_g2_action_run_candidate_v2'){completion=args;return {status:'succeeded',promotable:true};}
    if(name==='promote_g2_system_action_result_candidate_v1'){promotionCalls++;return {status:'promoted',promoted:true};}
    throw new Error(`unexpected AI_H candidate rpc ${name}`);
  };
  const fakeAI={run:async(_model,request)=>{assert.doesNotMatch(request.messages[1].content,/SECRET_NE_DOIT_PAS_SORTIR/);return {response:{hypothesis:{requirement_id:'SV.D03.PRIMARY_NEED',value:'Les artisans cherchent probablement à obtenir un devis qualifié rapidement sans multiplier les échanges.',rationale:'L’audience est constituée d’artisans indépendants et l’objectif déclaré porte sur les demandes de devis qualifiées.',basis_requirement_ids:['SV.D03.PRIMARY_AUDIENCE','SV.D02.PRIMARY_OBJECTIVE'],confidence:'MEDIUM'}}};}};
  const scenarioRefresh=async()=>({idea:{...idea,engine_revision:8},capabilities:{can_write:true}});
  const out=await advanceEvidenceCandidate({env:{AI:fakeAI,G2_AI_H:true},idea,canWrite:true,rpc:candidateRpc,refreshProjection:scenarioRefresh});
  assert.equal(out.executed_actions,1);assert.equal(promotionCalls,1);
  const mutation=completion.p_proposed_mutations[0];
  assert.equal(mutation.semantic_key,'primary_need');assert.equal(mutation.item_type,'ASSUMPTION');assert.equal(mutation.provenance_type,'AI_INFERRED');assert.equal(mutation.confidence_class,'MEDIUM');assert.deepEqual(mutation.resolution_levels,['WORKING_ASSUMPTION']);
}
await runAIHCandidate();

const endpoint=await fs.readFile(new URL('../src/idea-evidence-endpoint.js',import.meta.url),'utf8');
assert.match(endpoint,/G2_RAW:Boolean\(env\?\.AI\)/);
assert.match(endpoint,/return env\?\.AI\?\['CALC','RAW'\]:\['CALC'\]/);
assert.doesNotMatch(endpoint,/G2_AI_H:Boolean|G2_SRC:Boolean|G2_AI_R:Boolean|G2_WEB:Boolean/);
assert.match(endpoint,/authenticated fresh-Idea activation gate/);
const adapter=await fs.readFile(new URL('../src/idea-evidence-adapter-candidate.js',import.meta.url),'utf8');
assert.match(adapter,/evidence-adapter-0\.3\.1/);assert.match(adapter,/G2_AI_H_TARGETS/);assert.match(adapter,/AI_INFERRED/);assert.match(adapter,/WORKING_ASSUMPTION/);assert.doesNotMatch(adapter,/OBJECTIONS_TRUST.*objections_trust_hypothesis/);
const ui=await fs.readFile(new URL('../site/assets/ideas-workspace-g2-live.js',import.meta.url),'utf8');
assert.match(ui,/VERSION='1\.1\.0'/);assert.match(ui,/Preuves & marché/);assert.doesNotMatch(ui,/G2 actif|G2 prêt à être testé|Analyse G2 en cours/);assert.doesNotMatch(ui,/SUPABASE_SERVICE_ROLE_KEY/);
console.log('G2 active CALC+RAW boundary and dormant AI_H V0.1 candidate tests PASS');
