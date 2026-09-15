import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { advanceEvidenceCandidate, G2CandidateError } from '../src/idea-evidence-adapter-candidate.js';

const idea={id:'00000000-0000-0000-0000-000000000001',engine_revision:7,blueprint_id:'SITE_VITRINE',blueprint_version:'0.5',blueprint_status:'active'};
const rawSourceId='00000000-0000-4000-8000-000000000099';

function emptyPlan(fp='fp'){return {gate_id:'G2',gate_status:'IN_PROGRESS',missing_requirements:[],eligible_system_actions:[],supportive_capabilities:[],inflight_requirements:[],recoverable_action_runs:[],recovery_blocked_action_runs:[],capability_blocked_requirements:[],dominant_user_action:null,projection_fingerprint:fp};}
function rawPlan(){return {...emptyPlan('raw-plan-fp'),eligible_system_actions:[{path_role:'GATE_SATISFYING',action_type:'EXTRACT_RAW',acquisition_path:'RAW',requirement_id:'SV.D03.PRIMARY_NEED',target_fingerprint:'need-basis',target_artifact_keys:[]}]};}
function aiHPlan(){return {...emptyPlan('aih-plan-fp'),eligible_system_actions:[{path_role:'GATE_SATISFYING',action_type:'INFER_HYPOTHESIS',acquisition_path:'AI_H',requirement_id:'SV.D03.OBJECTIONS_TRUST',target_fingerprint:'objections-basis',target_artifact_keys:[]}]};}

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
const pathProbe=await advanceEvidenceCandidate({env:{AI:{run:async()=>({})},G2_RAW:true,G2_AI_H:true},idea,canWrite:true,rpc,refreshProjection});
assert.deepEqual(plannerArgs.p_available_paths,['CALC','RAW','AI_H']);
assert.equal(plannerArgs.p_raw_context_available,true);
assert.deepEqual(pathProbe.available_paths,['CALC','RAW','AI_H']);

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
      assert.equal(args.p_schema_version,'g2-raw-v1');
      return {action_run_id:'00000000-0000-4000-8000-000000000010',status:'queued',idempotent:false};
    }
    if(name==='start_g2_action_run_candidate_v2')return {status:'running',attempt:1};
    if(name==='get_g2_action_input_candidate_v2')return {
      idea,
      action_run:{target_requirement_ids:['SV.D03.PRIMARY_NEED']},
      context_requirement_states:[],current_information_items:[],current_sources:[],
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
  const scenarioRefresh=async()=>({idea:{...idea,engine_revision:expectPromotion?8:7},capabilities:{can_write:true}});
  const out=await advanceEvidenceCandidate({env:{AI:fakeAI,G2_RAW:true},idea,canWrite:true,rpc:scenarioRpc,refreshProjection:scenarioRefresh});
  assert.equal(out.executed_actions,1);
  if(expectPromotion){
    assert.equal(promotionCalls,1);
    assert.equal(finalization,null);
    const mutation=completion.p_proposed_mutations[0];
    assert.equal(mutation.semantic_key,'primary_need');
    assert.equal(mutation.item_type,'DECISION_INPUT');
    assert.equal(mutation.provenance_type,'SOURCE_EXTRACTED');
    assert.equal(mutation.source_id,rawSourceId);
    assert.deepEqual(mutation.resolution_levels,['RAW_HUMAN','ACCEPTED_AS_CURRENT']);
  }else{
    assert.equal(promotionCalls,0);
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

async function runAIHScenario({hypothesis,expectPromotion,expectedReason}){
  let planCalls=0,completion=null,promotionCalls=0,finalization=null,aiCalls=0;
  const itemAudience='00000000-0000-4000-8000-000000000021';
  const itemObjective='00000000-0000-4000-8000-000000000022';
  const itemSecret='00000000-0000-4000-8000-000000000023';
  const scenarioRpc=async(name,args)=>{
    if(name==='plan_idea_evidence_context_candidate_v11')return planCalls++===0?aiHPlan():emptyPlan('after-aih');
    if(name==='create_g2_system_action_run_candidate_v1'){
      assert.equal(args.p_action_type,'INFER_HYPOTHESIS');
      assert.equal(args.p_acquisition_path,'AI_H');
      assert.equal(args.p_provider,'cloudflare-workers-ai');
      assert.equal(args.p_model,'@cf/google/gemma-4-26b-a4b-it');
      assert.equal(args.p_prompt_version,'g2-ai-h-v1');
      assert.equal(args.p_schema_version,'g2-ai-h-v1');
      assert.equal(args.p_tool_version,'evidence-adapter-0.3.0');
      return {action_run_id:'00000000-0000-4000-8000-000000000030',status:'queued',idempotent:false};
    }
    if(name==='start_g2_action_run_candidate_v2')return {status:'running',attempt:1};
    if(name==='get_g2_action_input_candidate_v2')return {
      idea,
      action_run:{target_requirement_ids:['SV.D03.OBJECTIONS_TRUST']},
      context_requirement_states:[
        {requirement_id:'SV.D03.PRIMARY_AUDIENCE',applicability_state:'ACTIVE',resolution_refs:[{information_item_id:itemAudience}]},
        {requirement_id:'SV.D02.PRIMARY_OBJECTIVE',applicability_state:'ACTIVE',resolution_refs:[{information_item_id:itemObjective}]},
        {requirement_id:'SV.D02.HARD_CONSTRAINTS',applicability_state:'ACTIVE',resolution_refs:[{information_item_id:itemSecret}]}
      ],
      current_information_items:[
        {id:itemAudience,semantic_key:'primary_audience',item_type:'DECISION_INPUT',value:{value:'artisans indépendants'},provenance_type:'HUMAN_DECLARED',confidence_class:'DIRECT',sensitivity:'internal',state:'ACTIVE'},
        {id:itemObjective,semantic_key:'primary_objective',item_type:'DECISION_INPUT',value:{value:'obtenir davantage de demandes de devis qualifiées'},provenance_type:'HUMAN_GUIDED_ANSWER',confidence_class:'DIRECT',sensitivity:'internal',state:'ACTIVE'},
        {id:itemSecret,semantic_key:'secret_budget',item_type:'CONSTRAINT',value:{value:'SECRET_NE_DOIT_PAS_SORTIR'},provenance_type:'HUMAN_DECLARED',confidence_class:'DIRECT',sensitivity:'sensitive',state:'ACTIVE'}
      ],
      current_sources:[],raw_input:null
    };
    if(name==='complete_g2_action_run_candidate_v2'){completion=args;return {status:'succeeded',promotable:true};}
    if(name==='promote_g2_system_action_result_candidate_v1'){promotionCalls++;return {status:'promoted',promoted:true};}
    if(name==='finalize_g2_action_no_resolution_candidate_v1'){finalization=args;return {status:'no_resolution',finalized:true};}
    throw new Error(`unexpected AI_H rpc ${name}`);
  };
  const fakeAI={run:async(_model,request)=>{
    aiCalls++;
    assert.match(request.messages[0].content,/hypothèse de travail/);
    assert.match(request.messages[0].content,/WORKING_ASSUMPTION/);
    assert.doesNotMatch(request.messages[1].content,/SECRET_NE_DOIT_PAS_SORTIR/);
    assert.match(request.messages[1].content,/artisans indépendants/);
    return {response:{hypothesis}};
  }};
  const scenarioRefresh=async()=>({idea:{...idea,engine_revision:expectPromotion?8:7},capabilities:{can_write:true}});
  const out=await advanceEvidenceCandidate({env:{AI:fakeAI,G2_AI_H:true},idea,canWrite:true,rpc:scenarioRpc,refreshProjection:scenarioRefresh});
  assert.equal(aiCalls,1);
  assert.equal(out.executed_actions,1);
  if(expectPromotion){
    assert.equal(promotionCalls,1);
    assert.equal(finalization,null);
    const mutation=completion.p_proposed_mutations[0];
    assert.equal(mutation.semantic_key,'objections_trust_hypothesis');
    assert.equal(mutation.item_type,'ASSUMPTION');
    assert.equal(mutation.provenance_type,'AI_INFERRED');
    assert.equal(mutation.confidence_class,'MEDIUM');
    assert.equal(mutation.sensitivity,'internal');
    assert.equal(mutation.target_requirement_id,'SV.D03.OBJECTIONS_TRUST');
    assert.deepEqual(mutation.resolution_levels,['WORKING_ASSUMPTION']);
    assert.deepEqual(mutation.value.basis_requirement_ids,['SV.D03.PRIMARY_AUDIENCE','SV.D02.PRIMARY_OBJECTIVE']);
  }else{
    assert.equal(promotionCalls,0);
    assert.ok(finalization);
    assert.equal(finalization.p_terminal_reason,expectedReason);
    assert.deepEqual(completion.p_proposed_mutations,[]);
  }
}

await runAIHScenario({
  hypothesis:{
    requirement_id:'SV.D03.OBJECTIONS_TRUST',
    value:'Ces artisans peuvent hésiter si le site ne rend pas immédiatement clairs le sérieux du prestataire et le déroulement de la demande de devis.',
    rationale:'L’audience est composée d’artisans indépendants et l’objectif déclaré est de générer des demandes de devis qualifiées.',
    basis_requirement_ids:['SV.D03.PRIMARY_AUDIENCE','SV.D02.PRIMARY_OBJECTIVE'],
    confidence:'MEDIUM'
  },
  expectPromotion:true
});

await runAIHScenario({
  hypothesis:{
    requirement_id:'SV.D03.OBJECTIONS_TRUST',
    value:'Ils exigent une certification ISO précise.',
    rationale:'Hypothèse non fondée.',
    basis_requirement_ids:['SV.D99.UNKNOWN'],
    confidence:'MEDIUM'
  },
  expectPromotion:false,expectedReason:'HYPOTHESIS_NOT_USABLE'
});

const endpoint=await fs.readFile(new URL('../src/idea-evidence-endpoint.js',import.meta.url),'utf8');
assert.match(endpoint,/G2_RAW:Boolean\(ai\),G2_AI_H:Boolean\(ai\)/);
assert.match(endpoint,/return env\?\.AI\?\['CALC','RAW','AI_H'\]:\['CALC'\]/);
assert.match(endpoint,/classify_g2_action_promotion_candidate_v1/);
assert.match(endpoint,/IDEA_WRITE_REQUIRED/);
assert.doesNotMatch(endpoint,/G2_SRC:Boolean|G2_AI_R:Boolean|G2_WEB:Boolean/);

const adapter=await fs.readFile(new URL('../src/idea-evidence-adapter-candidate.js',import.meta.url),'utf8');
assert.match(adapter,/evidence-adapter-0\.3\.0/);
assert.match(adapter,/G2_AI_H_TARGETS/);
assert.match(adapter,/AI_INFERRED/);
assert.match(adapter,/WORKING_ASSUMPTION/);
assert.match(adapter,/HYPOTHESIS_BASIS_INSUFFICIENT/);
assert.match(adapter,/\['public','internal'\]\.includes\(item\?\.sensitivity\)/);
assert.doesNotMatch(adapter,/if\(env\.AI\)paths\.push\('RAW','SRC','AI_H','AI_R'\)/);

const ui=await fs.readFile(new URL('../site/assets/ideas-workspace-g2-live.js',import.meta.url),'utf8');
assert.match(ui,/VERSION='1\.1\.0'/);
assert.match(ui,/Preuves & marché/);
assert.match(ui,/Approfondir les preuves/);
assert.doesNotMatch(ui,/G2 actif|G2 prêt à être testé|Analyse G2 en cours/);
assert.doesNotMatch(ui,/SUPABASE_SERVICE_ROLE_KEY/);

console.log('G2 CALC+RAW+AI_H executor, provenance, privacy and Evidence Market UX guard tests PASS');
