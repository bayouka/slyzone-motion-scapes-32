import { advanceEvidenceCandidate, G2CandidateError } from './idea-evidence-adapter-candidate.js';

const G2_RESEARCH_PATHS=new Set(['WEB','AUDIT','CONN']);

function clean(v,max=220){return String(v??'').trim().slice(0,max)}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}})}
function arr(v){return Array.isArray(v)?v:[]}

async function parse(response){const t=await response.text();if(!t)return null;try{return JSON.parse(t)}catch{return t}}

async function sb(env,path,{token,service=false,body}={}){
  const key=service?env.SUPABASE_SERVICE_ROLE_KEY:env.SUPABASE_PUBLISHABLE_KEY;
  if(!key)throw new G2CandidateError(503,service?'SERVER_PRIVILEGE_UNAVAILABLE':'BACKEND_CONFIG_UNAVAILABLE');
  const headers=service?{apikey:key,'content-type':'application/json'}:{apikey:key,authorization:`Bearer ${token}`,'content-type':'application/json'};
  const response=await fetch(`${env.SUPABASE_URL}${path}`,{method:'POST',headers,body:JSON.stringify(body||{})});
  const payload=await parse(response);
  if(!response.ok)throw new G2CandidateError(response.status,'SUPABASE_REJECTED',clean(payload?.message||payload?.error||payload,220));
  return payload;
}

async function auth(env,request){
  const h=request.headers.get('authorization')||'';if(!h.startsWith('Bearer '))return null;
  const token=h.slice(7).trim();if(!token)return null;
  const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,authorization:`Bearer ${token}`}});
  if(!response.ok)return null;const user=await response.json().catch(()=>null);return user?.id?{user,token}:null;
}

function mapError(error){
  if(error instanceof G2CandidateError){
    if(/STALE|ATTEMPT_STALE|IDEMPOTENCY_KEY_REUSE/i.test(error.internal))return new G2CandidateError(409,'STALE_STATE');
    if(/G2_BLUEPRINT_0_5_NOT_ACTIVE/i.test(error.internal))return new G2CandidateError(409,'G2_NOT_AVAILABLE');
    if(/FORBIDDEN|IDEA_NOT_FOUND/i.test(error.internal))return new G2CandidateError(403,'IDEA_ACCESS_DENIED');
    return error;
  }
  return new G2CandidateError(502,'G2_ENGINE_ERROR');
}

async function settlePromotionRecovery(rpc,idea){
  const plan=await rpc('plan_idea_evidence_context_candidate_v11',{
    p_idea_id:idea.id,p_expected_engine_revision:idea.engine_revision,p_available_paths:['CALC'],p_raw_context_available:false
  });
  const recovery=arr(plan?.recoverable_action_runs)[0];
  if(!recovery||recovery.mode!=='PROMOTE')return null;

  const runId=clean(recovery.action_run_id,80);
  const inputFp=clean(recovery.input_fingerprint,180);
  const attempt=Number(recovery.attempt||0);
  const path=clean(recovery.acquisition_path,20);
  if(!runId||!inputFp||attempt<1||!path)throw new G2CandidateError(502,'G2_RECOVERY_INVALID');

  const classification=await rpc('classify_g2_action_promotion_candidate_v1',{
    p_action_run_id:runId,p_current_input_fingerprint:inputFp,p_expected_attempt:attempt
  });
  const disposition=clean(classification?.disposition,80);

  if(disposition==='FINALIZE_NO_RESOLUTION'){
    const finalization=await rpc('finalize_g2_action_no_resolution_candidate_v1',{
      p_action_run_id:runId,p_current_input_fingerprint:inputFp,p_expected_attempt:attempt,
      p_terminal_reason:classification.terminal_reason
    });
    return {disposition,path,status:clean(finalization?.status||'no_resolution',80)};
  }

  if(disposition==='PROMOTE'){
    const promotion=G2_RESEARCH_PATHS.has(path)
      ?await rpc('promote_research_action_result_v3',{p_action_run_id:runId,p_current_input_fingerprint:inputFp})
      :await rpc('promote_g2_system_action_result_candidate_v1',{p_action_run_id:runId,p_current_input_fingerprint:inputFp});
    return {disposition,path,status:clean(promotion?.status||'promoted',80)};
  }

  if(disposition==='ALREADY_FINALIZED')return {disposition,path,status:'already_finalized'};
  throw new G2CandidateError(409,'G2_RECOVERY_NOT_PROMOTABLE',disposition||'CLASSIFICATION_MISSING');
}

export async function handleEvidenceAdvance(request,env,body){
  const a=await auth(env,request);if(!a)return json({ok:false,error:'UNAUTHORIZED'},401);
  const ideaId=String(body?.idea_id||'');
  try{
    let projection=await sb(env,'/rest/v1/rpc/get_idea_workspace_projection_v1',{token:a.token,body:{p_idea_id:ideaId}});
    if(!projection.capabilities?.can_write)throw new G2CandidateError(403,'IDEA_WRITE_REQUIRED');
    const rpc=(name,args)=>sb(env,`/rest/v1/rpc/${encodeURIComponent(name)}`,{service:true,body:args});
    const refreshProjection=()=>sb(env,'/rest/v1/rpc/get_idea_workspace_projection_v1',{token:a.token,body:{p_idea_id:ideaId}});

    const recoverySettlement=await settlePromotionRecovery(rpc,projection.idea);
    if(recoverySettlement)projection=await refreshProjection();

    // G2 production currently has only the deterministic CALC executor certified.
    // Provider/research bindings remain unavailable to the orchestrator until their contracts and tests pass.
    const executorCapabilities={};
    const result=await advanceEvidenceCandidate({env:executorCapabilities,idea:projection.idea,canWrite:true,rpc,refreshProjection});
    return json({ok:true,command:'evidence.advance',status:result.plan?.gate_status||'IN_PROGRESS',recovery_settlement:recoverySettlement,...result});
  }catch(error){const e=mapError(error);return json({ok:false,error:e.code},e.status)}
}
