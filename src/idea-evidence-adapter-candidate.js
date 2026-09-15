// 4b4c / 2b2c — G2 evidence.advance orchestration candidate
// STATUS: NON ACTIVE. Not imported by worker.js / worker-entry.js.

const G2_MAX_ACTIONS=2;
const G2_MAX_RESEARCH_ACTIONS=1;
const G2_RESEARCH_PATHS=new Set(['WEB','AUDIT','CONN']);
const G2_SYSTEM_PATHS=new Set(['RAW','SRC','CALC','AI_H','AI_R']);
const G2_TOOL_VERSION='evidence-adapter-candidate-0.1.0';
const G2_SCHEMA_VERSION='g2-evidence-v0.7';

export class G2CandidateError extends Error{
  constructor(status,code,internal=''){super(code);this.status=status;this.code=code;this.internal=internal;}
}

function arr(v){return Array.isArray(v)?v:[]}
function text(v,max=300){return String(v??'').trim().slice(0,max)}

async function sha256(value){
  const digest=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(String(value)));
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
}

function availablePaths(env){
  const paths=['CALC'];
  if(env.AI)paths.push('RAW','SRC','AI_H','AI_R');
  if(env.AI&&env.TAVILY_API_KEY)paths.push('WEB');
  // AUDIT/CONN/MEM deliberately unavailable until their executor contracts exist.
  return paths;
}

function safePlan(plan){
  return {
    gate_id:text(plan?.gate_id,120),gate_status:text(plan?.gate_status,80),
    missing_requirements:arr(plan?.missing_requirements).slice(0,24).map(x=>({requirement_id:text(x?.requirement_id,120),status:text(x?.status,80),criticality:text(x?.criticality,80)})),
    eligible_system_action_count:arr(plan?.eligible_system_actions).length,
    supportive_capability_count:arr(plan?.supportive_capabilities).length,
    inflight_count:arr(plan?.inflight_requirements).length,
    recoverable_count:arr(plan?.recoverable_action_runs).length,
    recovery_blocked_count:arr(plan?.recovery_blocked_action_runs).length,
    capability_blocked_requirements:arr(plan?.capability_blocked_requirements).slice(0,20).map(x=>typeof x==='string'?text(x,120):{requirement_id:text(x?.requirement_id,120),reason:text(x?.reason,160)}),
    dominant_user_action:plan?.dominant_user_action||null,
    projection_fingerprint:text(plan?.projection_fingerprint,120)
  };
}

function assertExecutableAction(action){
  if(!action||typeof action!=='object')throw new G2CandidateError(502,'G2_PLAN_ACTION_INVALID');
  if(action.path_role!=='GATE_SATISFYING')throw new G2CandidateError(502,'G2_SUPPORT_PATH_NOT_EXECUTABLE');
  const path=text(action.acquisition_path,20);
  if(!G2_SYSTEM_PATHS.has(path)&&!G2_RESEARCH_PATHS.has(path))throw new G2CandidateError(502,'G2_PATH_UNSUPPORTED');
  if(path==='MEM')throw new G2CandidateError(503,'G2_EXECUTOR_UNAVAILABLE');
  if(!text(action.requirement_id,120)||!text(action.target_fingerprint,160))throw new G2CandidateError(502,'G2_PLAN_ACTION_INCOMPLETE');
  return path;
}

async function actionInputFingerprint(idea,plan,action){
  return sha256(JSON.stringify({idea_id:idea.id,engine_revision:idea.engine_revision,projection_fingerprint:plan.projection_fingerprint,action_type:action.action_type,acquisition_path:action.acquisition_path,requirement_id:action.requirement_id,target_fingerprint:action.target_fingerprint}));
}

async function createRun(rpc,idea,plan,action){
  const path=assertExecutableAction(action);
  const inputFp=await actionInputFingerprint(idea,plan,action);
  const idempotency=`g2:${idea.id}:r${idea.engine_revision}:${action.requirement_id}:${path}:${inputFp.slice(0,24)}`;
  const common={
    p_idea_id:idea.id,p_expected_engine_revision:idea.engine_revision,p_action_type:action.action_type,p_acquisition_path:path,
    p_target_requirement_ids:[action.requirement_id],p_target_requirement_fingerprints:{[action.requirement_id]:action.target_fingerprint},
    p_target_artifact_keys:arr(action.target_artifact_keys),p_input_fingerprint:inputFp,p_projection_fingerprint:plan.projection_fingerprint,
    p_permission_scope:{allowed_mutation_kinds:['INFORMATION_ITEM','LEDGER_ENTRY']},p_provider:path==='CALC'?'2b2c-deterministic':path.startsWith('AI_')?'workers-ai':'2b2c-provider',
    p_model:path.startsWith('AI_')?'@cf/google/gemma-4-26b-a4b-it':null,p_prompt_version:'g2-evidence-v1',p_schema_version:G2_SCHEMA_VERSION,p_tool_version:G2_TOOL_VERSION,p_idempotency_key:idempotency
  };
  if(G2_RESEARCH_PATHS.has(path))return {run:await rpc('create_action_run_v4',common),inputFp,path};
  return {run:await rpc('create_g2_system_action_run_candidate_v1',common),inputFp,path};
}

function deterministicCalc(input){
  const target=input?.action_run?.target_requirement_ids?.[0];
  const states=arr(input?.context_requirement_states);
  const byId=new Map(states.map(s=>[s.requirement_id,s]));
  const resolved=id=>{const s=byId.get(id);return s&&['RESOLVED','NOT_RELEVANT'].includes(s.resolution_state)};
  let value=null;
  if(target==='SV.D04.EVIDENCE_QUALITY'){
    const sources=arr(input?.current_sources).filter(s=>['registered','ingested'].includes(s.status));
    if(!sources.length)return {terminal_outcome:'NO_RESOLUTION',terminal_reason:'INPUTS_INSUFFICIENT',proposed_mutations:[]};
    value={status:'SUFFICIENT_FOR_CURRENT_DECISION',source_count:sources.length,basis:'canonical_current_sources'};
  }else if(target==='SV.D05.MARKET_CONTEXT'){
    if(!resolved('SV.D03.PRIMARY_AUDIENCE')||!resolved('SV.D04.OFFER_BASELINE'))return {terminal_outcome:'NO_RESOLUTION',terminal_reason:'DETERMINISTIC_NOT_DECIDABLE',proposed_mutations:[]};
    value={status:'CONTEXT_BASIS_AVAILABLE',basis_requirements:['SV.D03.PRIMARY_AUDIENCE','SV.D04.OFFER_BASELINE']};
  }else if(target==='SV.D05.RESEARCH_SUFFICIENCY'){
    const required=['SV.D03.PRIMARY_NEED','SV.D03.OBJECTIONS_TRUST','SV.D04.EVIDENCE_QUALITY','SV.D05.MARKET_CONTEXT','SV.D05.COMPETITOR_SET','SV.D05.PATTERN_GAP_SYNTHESIS'];
    const unresolved=required.filter(id=>{const s=byId.get(id);return s?.applicability_state==='ACTIVE'&&!['RESOLVED','NOT_RELEVANT'].includes(s?.resolution_state)});
    value={status:unresolved.length?'MORE_EVIDENCE_REQUIRED':'STOP_RULE_SATISFIED',unresolved_requirements:unresolved};
  }else return {terminal_outcome:'NO_RESOLUTION',terminal_reason:'DETERMINISTIC_NOT_DECIDABLE',proposed_mutations:[]};
  return {terminal_outcome:'RESOLVED',result:{target,value},proposed_mutations:[{kind:'INFORMATION_ITEM',semantic_key:`g2.${target.toLowerCase().replaceAll('.','_')}`,item_type:'EVIDENCE',value,provenance_type:'SYSTEM_CALCULATED',confidence_class:'DIRECT',sensitivity:'internal',target_requirement_id:target,resolution_levels:['CALCULATED']}]};
}

async function executeRun(env,rpc,runId,inputFp,attempt,path){
  const input=await rpc('get_g2_action_input_candidate_v2',{p_action_run_id:runId,p_current_input_fingerprint:inputFp,p_expected_attempt:attempt});
  if(path==='CALC')return deterministicCalc(input);
  // Candidate deliberately fails closed until each provider executor is implemented/QA'd.
  return {terminal_outcome:'NO_RESOLUTION',terminal_reason:'PROVIDER_RESULT_NOT_USABLE',proposed_mutations:[]};
}

async function completeAndFinalize(rpc,runId,inputFp,attempt,path,execution){
  const noResolution=execution.terminal_outcome==='NO_RESOLUTION';
  const result=noResolution?{terminal_outcome:'NO_RESOLUTION',terminal_reason:execution.terminal_reason}:execution.result||{terminal_outcome:'RESOLVED'};
  const mutations=arr(execution.proposed_mutations);
  await rpc('complete_g2_action_run_candidate_v2',{p_action_run_id:runId,p_current_input_fingerprint:inputFp,p_expected_attempt:attempt,p_result:result,p_proposed_mutations:mutations,p_latency_ms:null,p_cost_metadata:{candidate:true}});
  if(noResolution){
    return rpc('finalize_g2_action_no_resolution_candidate_v1',{p_action_run_id:runId,p_current_input_fingerprint:inputFp,p_expected_attempt:attempt,p_terminal_reason:execution.terminal_reason});
  }
  if(G2_RESEARCH_PATHS.has(path))return rpc('promote_research_action_result_v3',{p_action_run_id:runId,p_current_input_fingerprint:inputFp});
  return rpc('promote_g2_system_action_result_candidate_v1',{p_action_run_id:runId,p_current_input_fingerprint:inputFp});
}

async function resume(rpc,recovery){
  const runId=recovery.action_run_id,inputFp=recovery.input_fingerprint,path=recovery.acquisition_path;
  let attempt=Number(recovery.attempt||1);
  if(recovery.mode==='PROMOTE'){
    // A succeeded run may be either a normal mutation result or NO_RESOLUTION. The active
    // adapter will need a bounded status projection before choosing the terminal RPC.
    return {status:'PROMOTION_REQUIRES_RESULT_CLASSIFICATION',run_id:runId,path};
  }
  if(recovery.mode==='RECOVER_EXPIRED'){
    const recovered=await rpc('recover_g2_action_run_candidate_v1',{p_action_run_id:runId,p_current_input_fingerprint:inputFp,p_expected_attempt:attempt,p_lease_seconds:300});
    if(recovered.status!=='queued')return recovered;
    attempt=Number(recovered.attempt);
  }
  const started=await rpc('start_g2_action_run_candidate_v2',{p_action_run_id:runId,p_current_input_fingerprint:inputFp});
  return {status:started.status,run_id:runId,path,input_fingerprint:inputFp,attempt:Number(started.attempt)};
}

export async function advanceEvidenceCandidate({env,idea,canWrite,rpc,refreshProjection}){
  if(!canWrite)throw new G2CandidateError(403,'IDEA_WRITE_REQUIRED');
  if(idea?.blueprint_id!=='SITE_VITRINE'||idea?.blueprint_version!=='0.5'||idea?.blueprint_status!=='active')throw new G2CandidateError(409,'G2_BLUEPRINT_0_5_NOT_ACTIVE');
  const paths=availablePaths(env);
  let actions=0,researchActions=0;
  const trace=[];
  let plan=await rpc('plan_idea_evidence_context_candidate_v11',{p_idea_id:idea.id,p_expected_engine_revision:idea.engine_revision,p_available_paths:paths,p_raw_context_available:paths.includes('RAW')});

  while(actions<G2_MAX_ACTIONS){
    const recovery=arr(plan?.recoverable_action_runs)[0];
    if(recovery){
      const resumed=await resume(rpc,recovery);
      trace.push({kind:'RECOVERY',mode:recovery.mode,path:recovery.acquisition_path,status:resumed.status});
      if(resumed.status==='PROMOTION_REQUIRES_RESULT_CLASSIFICATION')break;
      if(resumed.status!=='running')break;
      const execution=await executeRun(env,rpc,resumed.run_id,resumed.input_fingerprint,resumed.attempt,resumed.path);
      await completeAndFinalize(rpc,resumed.run_id,resumed.input_fingerprint,resumed.attempt,resumed.path,execution);
      actions++; if(G2_RESEARCH_PATHS.has(resumed.path))researchActions++;
    }else{
      if(arr(plan?.inflight_requirements).length||arr(plan?.recovery_blocked_action_runs).length)break;
      const action=arr(plan?.eligible_system_actions)[0];
      if(!action)break;
      const path=assertExecutableAction(action);
      if(G2_RESEARCH_PATHS.has(path)&&researchActions>=G2_MAX_RESEARCH_ACTIONS)break;
      const created=await createRun(rpc,idea,plan,action);
      const runId=created.run.action_run_id;
      const started=await rpc('start_g2_action_run_candidate_v2',{p_action_run_id:runId,p_current_input_fingerprint:created.inputFp});
      if(started.status!=='running')break;
      const execution=await executeRun(env,rpc,runId,created.inputFp,Number(started.attempt),path);
      await completeAndFinalize(rpc,runId,created.inputFp,Number(started.attempt),path,execution);
      trace.push({kind:'ACTION',requirement_id:action.requirement_id,path,outcome:execution.terminal_outcome});
      actions++; if(G2_RESEARCH_PATHS.has(path))researchActions++;
    }
    const projection=await refreshProjection();
    idea=projection.idea;
    plan=await rpc('plan_idea_evidence_context_candidate_v11',{p_idea_id:idea.id,p_expected_engine_revision:idea.engine_revision,p_available_paths:paths,p_raw_context_available:paths.includes('RAW')});
  }

  return {candidate:true,executed_actions:actions,executed_research_actions:researchActions,trace,plan:safePlan(plan),projection:await refreshProjection()};
}
