const UUID_RE=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const COMMANDS=new Set(['canonical.read','decision.record','project.promote']);
const DECISION_OUTCOMES=new Set(['APPROVE_TO_PROJECT','APPROVE_WITH_CHANGES','REVISE','DEEPEN_RESEARCH','PAUSE','STOP','INSUFFICIENT_INFORMATION']);
const MAX_BODY_BYTES=16384;

class CanonicalIdeaHttpError extends Error{
  constructor(status,code,internal=''){super(code);this.status=status;this.code=code;this.internal=internal;}
}

function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}})}
function cleanText(value,max=1000){return String(value??'').trim().replace(/\s+/g,' ').slice(0,max)}
function hasOnlyKeys(obj,allowed){return Object.keys(obj||{}).every(key=>allowed.has(key))}

async function parseResponse(response){
  const text=await response.text();
  if(!text)return null;
  try{return JSON.parse(text)}catch{return text}
}

async function supabaseRequest(env,path,{token,service=false,body}={}){
  const key=service?env.SUPABASE_SERVICE_ROLE_KEY:env.SUPABASE_PUBLISHABLE_KEY;
  if(!key)throw new CanonicalIdeaHttpError(503,service?'SERVER_PRIVILEGE_UNAVAILABLE':'BACKEND_CONFIG_UNAVAILABLE');
  const headers=service
    ? {apikey:key,'content-type':'application/json'}
    : {apikey:key,Authorization:`Bearer ${token}`,'content-type':'application/json'};
  const response=await fetch(`${env.SUPABASE_URL}${path}`,{method:'POST',headers,body:JSON.stringify(body||{})});
  const payload=await parseResponse(response);
  if(!response.ok){
    const raw=cleanText(payload?.message||payload?.error||payload?.hint||payload||`SUPABASE_${response.status}`,300);
    throw new CanonicalIdeaHttpError(response.status,'SUPABASE_REJECTED',raw);
  }
  return payload;
}

async function serviceRpc(env,name,body={}){
  return supabaseRequest(env,`/rest/v1/rpc/${encodeURIComponent(name)}`,{service:true,body});
}

async function authenticate(env,request){
  const header=request.headers.get('authorization')||'';
  if(!header.startsWith('Bearer '))return null;
  const token=header.slice(7).trim();
  if(!token)return null;
  const response=await fetch(`${env.SUPABASE_URL}/auth/v1/user`,{headers:{apikey:env.SUPABASE_PUBLISHABLE_KEY,Authorization:`Bearer ${token}`}});
  if(!response.ok)return null;
  const user=await response.json().catch(()=>null);
  return user?.id?{user,token}:null;
}

async function loadProjection(env,ideaId,token){
  try{
    const result=await supabaseRequest(env,'/rest/v1/rpc/get_idea_workspace_projection_v1',{token,body:{p_idea_id:ideaId}});
    if(!result||typeof result!=='object'||Array.isArray(result))throw new CanonicalIdeaHttpError(502,'IDEA_PROJECTION_INVALID');
    return result;
  }catch(error){
    if(error instanceof CanonicalIdeaHttpError&&(/FORBIDDEN|IDEA_NOT_FOUND/i.test(error.internal)||error.status===403))throw new CanonicalIdeaHttpError(403,'IDEA_ACCESS_DENIED');
    throw error;
  }
}

function mapError(error){
  if(error instanceof CanonicalIdeaHttpError){
    const raw=error.internal||'';
    if(/STALE_CANONICAL_G1|STALE_ENGINE|DECISION_PACKAGE_STALE|DECISION_PACKAGE_OUTPUT_STALE|IDEMPOTENCY_KEY_REUSE/i.test(raw))return new CanonicalIdeaHttpError(409,'STALE_STATE');
    if(/CANONICAL_G1_NOT_READY|GO_REQUIRES_CANONICAL_LAUNCH_PATH|OUTCOME_NOT_ALLOWED_FOR_CANONICAL_G1_PATH|APPROVAL_NOT_PROMOTABLE/i.test(raw))return new CanonicalIdeaHttpError(409,'DECISION_NOT_READY');
    if(/DECISION_PACKAGE_NOT_FOUND|CANONICAL_DECISION_PACKAGE_MISMATCH/i.test(raw))return new CanonicalIdeaHttpError(409,'DECISION_PACKAGE_INVALID');
    if(/CANONICAL_G2_NOT_READY|CANONICAL_G2_DECISION_MISMATCH|PROJECT_BASELINE_REQUIRED_REQUIREMENT_NOT_CURRENT|PROJECT_BASELINE_CONTAINS_NONCURRENT_REQUIREMENT|PROJECT_PROMOTION_ARTIFACT_NOT_CURRENT|UNMAPPED_PROJECT_PROMOTABLE_ARTIFACT|OPEN_REVIEW_FEEDBACK_BLOCKS_PROMOTION|STRUCTURAL_BLOCKER_UNRESOLVED|PROMOTION_DIFF_REQUIRES_REAPPROVAL/i.test(raw))return new CanonicalIdeaHttpError(409,'PROJECT_PROMOTION_NOT_READY');
    if(/ACTIVE_PROJECT_DEFINITION_ALREADY_EXISTS/i.test(raw))return new CanonicalIdeaHttpError(409,'PROJECT_DEFINITION_ALREADY_EXISTS');
    if(/DECISION_RECORD_NOT_FOUND|DECISION_IDEA_MISMATCH|DECISION_RECORD_SUPERSEDED/i.test(raw))return new CanonicalIdeaHttpError(409,'DECISION_RECORD_INVALID');
    if(/PROJECT_PROMOTION_ACTOR_NOT_AUTHORIZED|DECISION_OWNER_NOT_AUTHORIZED|FORBIDDEN|IDEA_NOT_FOUND/i.test(raw))return new CanonicalIdeaHttpError(403,'IDEA_ACCESS_DENIED');
    return error;
  }
  return new CanonicalIdeaHttpError(502,'CANONICAL_IDEA_ENGINE_ERROR');
}

function validateReadBody(body){
  return hasOnlyKeys(body,new Set(['command','idea_id']));
}

function validateDecisionBody(body){
  if(!hasOnlyKeys(body,new Set(['command','idea_id','package_id','outcome','rationale','conditions','conditions_resolved','expected_g1_fingerprint','idempotency_key'])))return false;
  if(!UUID_RE.test(String(body.package_id||'')))return false;
  if(!DECISION_OUTCOMES.has(String(body.outcome||'')))return false;
  if(!Array.isArray(body.conditions)||body.conditions.length>50)return false;
  if(typeof body.conditions_resolved!=='boolean')return false;
  if(!cleanText(body.expected_g1_fingerprint,128)||!cleanText(body.idempotency_key,180))return false;
  if(String(body.rationale??'').length>8000)return false;
  return true;
}

function validateProjectPromoteBody(body){
  if(!hasOnlyKeys(body,new Set(['command','idea_id','decision_record_id','expected_engine_revision','idempotency_key'])))return false;
  if(!UUID_RE.test(String(body.decision_record_id||'')))return false;
  const revision=Number(body.expected_engine_revision);
  if(!Number.isSafeInteger(revision)||revision<0)return false;
  if(!cleanText(body.idempotency_key,180))return false;
  return true;
}

export async function handleCanonicalIdeaCommand(request,env){
  if(request.method!=='POST')return json({ok:false,error:'METHOD_NOT_ALLOWED'},405);
  if(Number(request.headers.get('content-length')||0)>MAX_BODY_BYTES)return json({ok:false,error:'INVALID_REQUEST'},400);
  if(!env.SUPABASE_SERVICE_ROLE_KEY)return json({ok:false,error:'SERVER_PRIVILEGE_UNAVAILABLE'},503);

  const auth=await authenticate(env,request);
  if(!auth)return json({ok:false,error:'UNAUTHORIZED'},401);

  let body;
  try{body=await request.json()}catch{return json({ok:false,error:'INVALID_REQUEST'},400)}
  if(!body||typeof body!=='object'||Array.isArray(body))return json({ok:false,error:'INVALID_REQUEST'},400);

  const command=String(body.command||''),ideaId=String(body.idea_id||'');
  if(!COMMANDS.has(command)||!UUID_RE.test(ideaId))return json({ok:false,error:'INVALID_REQUEST'},400);
  if(command==='canonical.read'&&!validateReadBody(body))return json({ok:false,error:'INVALID_REQUEST'},400);
  if(command==='decision.record'&&!validateDecisionBody(body))return json({ok:false,error:'INVALID_REQUEST'},400);
  if(command==='project.promote'&&!validateProjectPromoteBody(body))return json({ok:false,error:'INVALID_REQUEST'},400);

  let projection;
  try{projection=await loadProjection(env,ideaId,auth.token)}catch(error){const mapped=mapError(error);return json({ok:false,error:mapped.code},mapped.status)}

  try{
    if(command==='canonical.read'){
      const readiness=await serviceRpc(env,'get_canonical_idea_preproject_readiness_v1',{p_idea_id:ideaId});
      return json({ok:true,command,readiness});
    }

    if(command==='decision.record'){
      if(!projection.capabilities?.can_write)throw new CanonicalIdeaHttpError(403,'IDEA_WRITE_REQUIRED');
      const result=await serviceRpc(env,'record_canonical_idea_decision_v1',{
        p_package_id:String(body.package_id),
        p_decided_by:auth.user.id,
        p_outcome:String(body.outcome),
        p_rationale:String(body.rationale||''),
        p_conditions:body.conditions,
        p_conditions_resolved:body.conditions_resolved,
        p_expected_g1_fingerprint:String(body.expected_g1_fingerprint),
        p_idempotency_key:String(body.idempotency_key)
      });
      const readiness=await serviceRpc(env,'get_canonical_idea_preproject_readiness_v1',{p_idea_id:ideaId});
      return json({ok:true,command,result,readiness});
    }

    if(command==='project.promote'){
      if(!projection.capabilities?.can_write)throw new CanonicalIdeaHttpError(403,'IDEA_WRITE_REQUIRED');
      const result=await serviceRpc(env,'promote_canonical_approved_idea_to_project_definition_v3',{
        p_idea_id:ideaId,
        p_decision_record_id:String(body.decision_record_id),
        p_actor_id:auth.user.id,
        p_expected_engine_revision:Number(body.expected_engine_revision),
        p_idempotency_key:String(body.idempotency_key)
      });
      const readiness=await serviceRpc(env,'get_canonical_idea_preproject_readiness_v1',{p_idea_id:ideaId});
      return json({ok:true,command,result,readiness});
    }

    return json({ok:false,error:'INVALID_REQUEST'},400);
  }catch(error){
    const mapped=mapError(error);
    return json({ok:false,error:mapped.code},mapped.status);
  }
}
