import { advanceEvidenceCandidate, G2CandidateError } from './idea-evidence-adapter-candidate.js';

function clean(v,max=220){return String(v??'').trim().slice(0,max)}
function json(data,status=200){return Response.json(data,{status,headers:{'cache-control':'no-store'}})}

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

export async function handleEvidenceAdvance(request,env,body){
  const a=await auth(env,request);if(!a)return json({ok:false,error:'UNAUTHORIZED'},401);
  const ideaId=String(body?.idea_id||'');
  try{
    const projection=await sb(env,'/rest/v1/rpc/get_idea_workspace_projection_v1',{token:a.token,body:{p_idea_id:ideaId}});
    const rpc=(name,args)=>sb(env,`/rest/v1/rpc/${encodeURIComponent(name)}`,{service:true,body:args});
    const refreshProjection=()=>sb(env,'/rest/v1/rpc/get_idea_workspace_projection_v1',{token:a.token,body:{p_idea_id:ideaId}});
    // G2 v0.7 production currently has only the deterministic CALC executor certified.
    // Provider/research bindings remain unavailable to the orchestrator until their contracts and tests pass.
    const executorCapabilities={};
    const result=await advanceEvidenceCandidate({env:executorCapabilities,idea:projection.idea,canWrite:Boolean(projection.capabilities?.can_write),rpc,refreshProjection});
    return json({ok:true,command:'evidence.advance',status:result.plan?.gate_status||'IN_PROGRESS',...result});
  }catch(error){const e=mapError(error);return json({ok:false,error:e.code},e.status)}
}
